/**
 * Model & Provider settings management for Cadence Mobile.
 *
 * Supports Bring-Your-Own-Key (BYOK) for:
 *   - Groq (Whisper Large v3 Turbo + LLaMA 3.3 70B)
 *   - OpenAI (Whisper-1 + GPT-4o-mini)
 *   - Cadence Server (Render Cloud or local server)
 *
 * Persists keys locally via SecureStore / AsyncStorage and syncs them
 * to the Cadence server (/api/keys) so streaming STT and LLM cleanup work
 * seamlessly without requiring local 2GB model downloads.
 */

import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { getPref, setPref } from "./storage";
import { supabase } from "./supabase";

export type TranscriptionProvider = "groq" | "openai";
export type CleanupModelId =
  | "groq/llama-3.3-70b-versatile"
  | "openai/gpt-4o-mini"
  | "off";

export interface ModelConfig {
  transcriptionProvider: TranscriptionProvider;
  cleanupModel: CleanupModelId;
  groqKeyConfigured: boolean;
  openAiKeyConfigured: boolean;
  customServerUrl: string;
}

const PROVIDER_KEY = "byok_transcription_provider";
const CLEANUP_MODEL_KEY = "byok_cleanup_model";
const CUSTOM_SERVER_KEY = "byok_custom_server_url";

const GROQ_SECURE_KEY = "cadence_key_groq";
const OPENAI_SECURE_KEY = "cadence_key_openai";

export async function getSecureApiKey(
  provider: "groq" | "openai",
): Promise<string | null> {
  const keyName = provider === "groq" ? GROQ_SECURE_KEY : OPENAI_SECURE_KEY;
  try {
    const val = await SecureStore.getItemAsync(keyName);
    if (val) return val;
  } catch {
    // fallback
  }

  const localVal = await getPref(keyName);
  if (localVal) return localVal;

  // If signed in, check Supabase
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("cadence_api_keys")
        .select("api_key")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .single();
      if (data?.api_key) {
        await SecureStore.setItemAsync(keyName, data.api_key).catch(() => {});
        return data.api_key;
      }
    }
  } catch {
    // offline
  }

  return null;
}

export async function setSecureApiKey(
  provider: "groq" | "openai",
  key: string,
): Promise<void> {
  const keyName = provider === "groq" ? GROQ_SECURE_KEY : OPENAI_SECURE_KEY;
  try {
    await SecureStore.setItemAsync(keyName, key);
  } catch {
    await setPref(keyName, key);
  }

  // Sync to Supabase if authenticated
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cadence_api_keys").upsert(
        {
          user_id: user.id,
          provider,
          api_key: key,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );
    }
  } catch {
    // Non-blocking
  }
}

export async function removeSecureApiKey(
  provider: "groq" | "openai",
): Promise<void> {
  const keyName = provider === "groq" ? GROQ_SECURE_KEY : OPENAI_SECURE_KEY;
  try {
    await SecureStore.deleteItemAsync(keyName);
  } catch {
    await setPref(keyName, "");
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("cadence_api_keys")
        .delete()
        .match({ user_id: user.id, provider });
    }
  } catch {
    // Non-blocking
  }
}

export function useModelConfig() {
  const [provider, setProviderState] = useState<TranscriptionProvider>("groq");
  const [cleanupModel, setCleanupModelState] = useState<CleanupModelId>(
    "groq/llama-3.3-70b-versatile",
  );
  const [groqConfigured, setGroqConfigured] = useState(false);
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [customServerUrl, setCustomServerUrlState] = useState("");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const p = (await getPref(PROVIDER_KEY)) as TranscriptionProvider | null;
    const c = (await getPref(CLEANUP_MODEL_KEY)) as CleanupModelId | null;
    const s = (await getPref(CUSTOM_SERVER_KEY)) ?? "";

    const groqKey = await getSecureApiKey("groq");
    const openAiKey = await getSecureApiKey("openai");

    if (p) setProviderState(p);
    if (c) setCleanupModelState(c);
    setCustomServerUrlState(s);
    setGroqConfigured(Boolean(groqKey?.trim()));
    setOpenAiConfigured(Boolean(openAiKey?.trim()));
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setProvider = useCallback(async (next: TranscriptionProvider) => {
    setProviderState(next);
    await setPref(PROVIDER_KEY, next);
  }, []);

  const setCleanupModel = useCallback(async (next: CleanupModelId) => {
    setCleanupModelState(next);
    await setPref(CLEANUP_MODEL_KEY, next);
  }, []);

  const setCustomServerUrl = useCallback(async (url: string) => {
    setCustomServerUrlState(url);
    await setPref(CUSTOM_SERVER_KEY, url);
  }, []);

  const saveApiKey = useCallback(
    async (targetProvider: "groq" | "openai", key: string) => {
      await setSecureApiKey(targetProvider, key.trim());
      await refresh();
    },
    [refresh],
  );

  const deleteApiKey = useCallback(
    async (targetProvider: "groq" | "openai") => {
      await removeSecureApiKey(targetProvider);
      await refresh();
    },
    [refresh],
  );

  return {
    provider,
    cleanupModel,
    groqConfigured,
    openAiConfigured,
    customServerUrl,
    ready,
    setProvider,
    setCleanupModel,
    setCustomServerUrl,
    saveApiKey,
    deleteApiKey,
    refresh,
  };
}
