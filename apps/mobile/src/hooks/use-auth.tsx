/**
 * Auth facade and context over the `@better-auth/expo` client.
 * Exposes the current user, loading state, sign-in/sign-out actions,
 * and a Guest Mode allowing users to explore the app without signing in.
 */

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authClient } from "@/lib/cloud/auth-client";
import { type CloudUser, signOutCloud } from "@/lib/cloud/session";
import { clearKeyboardSession } from "@/lib/keyboard-bridge";
import { getPref, setPref } from "@/lib/storage";

export type SocialProvider = "google" | "github" | "apple";

interface AuthState {
  user: CloudUser | null;
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
  signInWith: (provider: SocialProvider) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [guestLoading, setGuestLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let active = true;
    void getPref("guest_mode").then((val) => {
      if (active) {
        setIsGuest(val === "true");
        setGuestLoading(false);
      }
    });
    return () => {
      active = false;
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

  const signInWith = useCallback(async (provider: SocialProvider) => {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
    if (!error) {
      setIsGuest(false);
      void setPref("guest_mode", "false");
    }
    return error ? { error: error.message ?? "Sign-in failed" } : {};
  }, []);

  const signOut = useCallback(async () => {
    setIsGuest(false);
    void setPref("guest_mode", "false");
    await signOutCloud();
    clearKeyboardSession();
  }, []);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  const signedIn = !!session?.user;
  const loading = isPending || guestLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signedIn,
        isGuest: !signedIn && isGuest,
        continueAsGuest,
        leaveGuestMode,
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
