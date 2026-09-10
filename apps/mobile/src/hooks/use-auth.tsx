/**
 * Auth facade and context powered by Supabase.
 * Exposes the current user, loading state, sign-in/sign-up/sign-out actions,
 * and a Guest Mode allowing users to explore the app without signing in.
 */

import type { Session } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { clearKeyboardSession } from "@/lib/keyboard-bridge";
import { getPref, setPref } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = "google" | "github" | "apple";

export interface CadenceUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface AuthState {
  user: CadenceUser | null;
  /** True until the cached session and guest mode preference have resolved on launch. */
  loading: boolean;
  /** True when an authenticated account session exists. */
  signedIn: boolean;
  /** True when the user opted to enter the app without signing in. */
  isGuest: boolean;
  /** Enter guest mode without signing in. */
  continueAsGuest: () => void;
  /** Clear guest mode (e.g. from profile to return to sign-in). */
  leaveGuestMode: () => void;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error?: string }>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signInWith: (provider: SocialProvider) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function parseUrlParams(url: string): Record<string, string> {
  const hashIdx = url.indexOf("#");
  const queryIdx = url.indexOf("?");
  const queryString =
    hashIdx !== -1
      ? url.substring(hashIdx + 1)
      : queryIdx !== -1
        ? url.substring(queryIdx + 1)
        : "";

  const params: Record<string, string> = {};
  if (!queryString) return params;

  for (const part of queryString.split("&")) {
    const [key, val] = part.split("=");
    if (key && val) {
      params[decodeURIComponent(key)] = decodeURIComponent(val);
    }
  }
  return params;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [guestLoading, setGuestLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let active = true;

    // Load guest mode preference
    void getPref("guest_mode").then((val) => {
      if (active) {
        setIsGuest(val === "true");
        setGuestLoading(false);
      }
    });

    // Check existing Supabase session
    void supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (active) {
          setSession(initialSession);
          setSessionLoading(false);
        }
      });

    // Listen to real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (active) {
        setSession(currentSession);
        if (currentSession) {
          setIsGuest(false);
          void setPref("guest_mode", "false");
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    void setPref("guest_mode", "true");
  }, []);

  const leaveGuestMode = useCallback(() => {
    setIsGuest(false);
    void setPref("guest_mode", "false");
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || cleanEmail.split("@")[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // If active session was returned immediately
      if (data.session) {
        setSession(data.session);
        setIsGuest(false);
        void setPref("guest_mode", "false");
        return {};
      }

      // If email confirmation is enabled on Supabase, data.session is null.
      // Our database trigger immediately auto-confirms new users, so sign in now.
      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInErr) {
        return {
          error:
            signInErr.message ||
            "Account created! Please verify your email or sign in.",
        };
      }

      if (signInData.session) {
        setSession(signInData.session);
        setIsGuest(false);
        void setPref("guest_mode", "false");
        return {};
      }

      return {};
    },
    [],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const cleanEmail = email.trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setIsGuest(false);
        void setPref("guest_mode", "false");
      }
      return {};
    },
    [],
  );

  const signInWith = useCallback(async (provider: SocialProvider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "github" | "apple",
        options: {
          redirectTo: "cadence://",
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(
          data.url,
          "cadence://",
        );
        if (res.type === "success" && res.url) {
          const params = parseUrlParams(res.url);
          if (params.error_description || params.error) {
            return {
              error:
                params.error_description ||
                params.error ||
                `${provider} authentication failed.`,
            };
          }
          if (params.access_token && params.refresh_token) {
            const { data: sessionData, error: setErr } =
              await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });
            if (setErr) return { error: setErr.message };
            if (sessionData.session) {
              setSession(sessionData.session);
            }
            setIsGuest(false);
            void setPref("guest_mode", "false");
            return {};
          }
        } else if (res.type === "cancel" || res.type === "dismiss") {
          return {
            error:
              provider === "google"
                ? "Google Sign-In is not enabled in your Supabase project yet. Please sign in with Email & Password or enable Google in the Supabase Dashboard."
                : `${provider} sign-in was cancelled or not enabled in Supabase.`,
          };
        }
      }
      return {};
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err.message : "OAuth sign-in failed",
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    void setPref("guest_mode", "false");
    await supabase.auth.signOut();
    clearKeyboardSession();
  }, []);

  const user: CadenceUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email || "",
        name:
          (session.user.user_metadata?.full_name as string) ||
          (session.user.user_metadata?.name as string) ||
          session.user.email?.split("@")[0] ||
          "Cadence User",
        image:
          (session.user.user_metadata?.avatar_url as string) ||
          (session.user.user_metadata?.picture as string) ||
          null,
      }
    : null;

  const signedIn = !!session?.user;
  const loading = sessionLoading || guestLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signedIn,
        isGuest: !signedIn && isGuest,
        continueAsGuest,
        leaveGuestMode,
        signUpWithEmail,
        signInWithEmail,
        signInWith,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
