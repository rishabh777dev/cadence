/**
 * Model & Provider settings management for Cadence Mobile.
 *
 * Supports Bring-Your-Own-Key (BYOK) for all desktop providers:
 *   - Groq (Whisper Large v3 Turbo, LLaMA 3.1/3.3, Mixtral, DeepSeek)
 *   - OpenAI (Whisper-1, GPT-4o, GPT-4o-mini, o3-mini)
 *   - Anthropic (Claude 3.5 Sonnet, 3.5 Haiku, 3.7 Sonnet)
 *   - Google Gemini (Gemini 2.0 Flash, 1.5 Flash, 1.5 Pro)
 *   - Mistral AI (Mistral Small, Large, Codestral)
 *   - OpenRouter (100+ multi-provider frontier models)
 *   - Deepgram (Nova-3 STT)
 *   - Custom OpenAI-compatible / Local LLMs (Ollama, LM Studio, vLLM)
 *
 * Persists keys locally via SecureStore / AsyncStorage, checks .env variables,
 * syncs with Supabase if authenticated, and provides live model discovery.
 */

import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  type DiscoveredModel,
  discoverProviderModels,
  FALLBACK_MODELS,
  getCachedModels,
  type ProviderId,
} from "./model-discovery";
import { getPref, setPref } from "./storage";
import { supabase } from "./supabase";

export type { DiscoveredModel, ProviderId };

export type TranscriptionProvider = "groq" | "openai" | "deepgram";
export type CleanupProviderId = ProviderId | "off";

// Backwards compatibility
export type CleanupModelId = string;

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  desc: string;
  icon: string;
  hasVoice: boolean;
  hasLlm: boolean;
  keyUrl?: string;
  defaultLlmModel: string;
  defaultVoiceModel?: string;
}

export const ALL_PROVIDERS: ProviderMeta[] = [
  {
    id: "groq",
    name: "Groq",
    desc: "Ultra-fast inference for Whisper & LLaMA",
    icon: "⚡",
    hasVoice: true,
    hasLlm: true,
    keyUrl: "https://console.groq.com/keys",
    defaultLlmModel: "llama-3.1-8b-instant",
    defaultVoiceModel: "whisper-large-v3-turbo",
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "GPT-4o, GPT-4o-mini, o3-mini & Whisper",
    icon: "🤖",
    hasVoice: true,
    hasLlm: true,
    keyUrl: "https://platform.openai.com/api-keys",
    defaultLlmModel: "gpt-4o-mini",
    defaultVoiceModel: "whisper-1",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    desc: "Claude 3.5 Sonnet, 3.7 Sonnet & Haiku",
    icon: "🧠",
    hasVoice: false,
    hasLlm: true,
    keyUrl: "https://console.anthropic.com/settings/keys",
    defaultLlmModel: "claude-3-5-haiku-latest",
  },
  {
    id: "google",
    name: "Google Gemini",
    desc: "Gemini 2.0 Flash, 1.5 Flash & Pro",
    icon: "🌐",
    hasVoice: false,
    hasLlm: true,
    keyUrl: "https://aistudio.google.com/apikey",
    defaultLlmModel: "gemini-2.0-flash",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    desc: "Frontier reasoning & multilingual models",
    icon: "🌪️",
    hasVoice: false,
    hasLlm: true,
    keyUrl: "https://console.mistral.ai/api-keys",
    defaultLlmModel: "mistral-small-latest",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    desc: "Access 100+ AI models with a single key",
    icon: "🔀",
    hasVoice: false,
    hasLlm: true,
    keyUrl: "https://openrouter.ai/keys",
    defaultLlmModel: "meta-llama/llama-3.3-70b-instruct",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    desc: "High-speed Nova-3 voice models",
    icon: "🎙️",
    hasVoice: true,
    hasLlm: false,
    keyUrl: "https://console.deepgram.com",
    defaultLlmModel: "",
    defaultVoiceModel: "nova-3",
  },
  {
    id: "custom",
    name: "Custom / Local LLM",
    desc: "Ollama, LM Studio, or OpenAI-compatible endpoint",
    icon: "🦙",
    hasVoice: false,
    hasLlm: true,
    defaultLlmModel: "default",
  },
];

const PREF_PREFIX = "cadence_pref_";
const PROVIDER_KEY = `${PREF_PREFIX}transcription_provider`;
const CLEANUP_PROVIDER_KEY = `${PREF_PREFIX}cleanup_provider`;
const CLEANUP_MODEL_KEY = `${PREF_PREFIX}cleanup_model`;
const MAGIC_EDIT_LLM_PROVIDER_KEY = `${PREF_PREFIX}magic_edit_llm_provider`;
const MAGIC_EDIT_LLM_MODEL_KEY = `${PREF_PREFIX}magic_edit_llm_model`;
const MAGIC_EDIT_VOICE_PROVIDER_KEY = `${PREF_PREFIX}magic_edit_voice_provider`;
const CUSTOM_SERVER_KEY = `${PREF_PREFIX}custom_server_url`;

const SECURE_KEY_MAP: Record<ProviderId, string> = {
  groq: "cadence_key_groq",
  openai: "cadence_key_openai",
  anthropic: "cadence_key_anthropic",
  google: "cadence_key_google",
  mistral: "cadence_key_mistral",
  openrouter: "cadence_key_openrouter",
  deepgram: "cadence_key_deepgram",
  custom: "cadence_key_custom",
};

/**
 * Retrieve the active API key for any supported provider.
 */
export async function getSecureApiKey(
  provider: ProviderId | string,
): Promise<string | null> {
  const normProvider = provider.toLowerCase() as ProviderId;
  const keyName = SECURE_KEY_MAP[normProvider] || `cadence_key_${normProvider}`;

  // 1. SecureStore
  try {
    const val = await SecureStore.getItemAsync(keyName);
    if (val?.trim()) return val.trim();
  } catch {
    // fallback
  }

  // 2. Local storage preference fallback
  const localVal = await getPref(keyName);
  if (localVal?.trim()) return localVal.trim();

  // 3. Environment variables
  switch (normProvider) {
    case "groq": {
      const k =
        process.env.EXPO_PUBLIC_GROQ_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.EXPO_PUBLIC_GROK_API_KEY ||
        process.env.GROK_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "openai": {
      const k =
        process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "anthropic": {
      const k =
        process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
        process.env.ANTHROPIC_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "google": {
      const k =
        process.env.EXPO_PUBLIC_GOOGLE_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GEMINI_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "mistral": {
      const k =
        process.env.EXPO_PUBLIC_MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "openrouter": {
      const k =
        process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "deepgram": {
      const k =
        process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY ||
        process.env.DEEPGRAM_API_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
    case "custom": {
      const k =
        process.env.EXPO_PUBLIC_CUSTOM_LLM_KEY || process.env.CUSTOM_LLM_KEY;
      if (k?.trim()) return k.trim();
      break;
    }
  }

  // 4. Supabase sync if signed in
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("cadence_api_keys")
        .select("api_key")
        .eq("user_id", user.id)
        .eq("provider", normProvider)
        .single();
      if (data?.api_key?.trim()) {
        await SecureStore.setItemAsync(keyName, data.api_key.trim()).catch(
          () => {},
        );
        return data.api_key.trim();
      }
    }
  } catch {
    // offline
  }

  return null;
}

/**
 * Save an API key securely for a provider.
 */
export async function setSecureApiKey(
  provider: ProviderId | string,
  key: string,
): Promise<void> {
  const normProvider = provider.toLowerCase() as ProviderId;
  const keyName = SECURE_KEY_MAP[normProvider] || `cadence_key_${normProvider}`;

  try {
    await SecureStore.setItemAsync(keyName, key.trim());
  } catch {
    await setPref(keyName, key.trim());
  }

  // Sync with Supabase
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cadence_api_keys").upsert(
        {
          user_id: user.id,
          provider: normProvider,
          api_key: key.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" },
      );
    }
  } catch {
    // non-blocking
  }
}

/**
 * Remove an API key for a provider.
 */
export async function removeSecureApiKey(
  provider: ProviderId | string,
): Promise<void> {
  const normProvider = provider.toLowerCase() as ProviderId;
  const keyName = SECURE_KEY_MAP[normProvider] || `cadence_key_${normProvider}`;

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
        .match({ user_id: user.id, provider: normProvider });
    }
  } catch {
    // non-blocking
  }
}

/**
 * Main model config and discovery hook.
 */
export function useModelConfig() {
  const [provider, setProviderState] = useState<TranscriptionProvider>("groq");
  const [cleanupProvider, setCleanupProviderState] =
    useState<CleanupProviderId>("groq");
  const [cleanupModel, setCleanupModelState] = useState<string>(
    "llama-3.1-8b-instant",
  );

  const [magicEditLlmProvider, setMagicEditLlmProviderState] =
    useState<string>("auto");
  const [magicEditLlmModel, setMagicEditLlmModelState] = useState<string>("");
  const [magicEditVoiceProvider, setMagicEditVoiceProviderState] =
    useState<string>("auto");

  const [customServerUrl, setCustomServerUrlState] = useState("");
  const [configuredKeys, setConfiguredKeys] = useState<
    Record<ProviderId, boolean>
  >({
    groq: false,
    openai: false,
    anthropic: false,
    google: false,
    mistral: false,
    openrouter: false,
    deepgram: false,
    custom: false,
  });

  const [discoveredModels, setDiscoveredModels] = useState<
    Record<ProviderId, DiscoveredModel[]>
  >({
    groq: FALLBACK_MODELS.groq,
    openai: FALLBACK_MODELS.openai,
    anthropic: FALLBACK_MODELS.anthropic,
    google: FALLBACK_MODELS.google,
    mistral: FALLBACK_MODELS.mistral,
    openrouter: FALLBACK_MODELS.openrouter,
    deepgram: FALLBACK_MODELS.deepgram,
    custom: FALLBACK_MODELS.custom,
  });

  const [discovering, setDiscovering] = useState<Record<ProviderId, boolean>>({
    groq: false,
    openai: false,
    anthropic: false,
    google: false,
    mistral: false,
    openrouter: false,
    deepgram: false,
    custom: false,
  });

  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const p = (await getPref(PROVIDER_KEY)) as TranscriptionProvider | null;
    const cp = (await getPref(
      CLEANUP_PROVIDER_KEY,
    )) as CleanupProviderId | null;
    const cm = (await getPref(CLEANUP_MODEL_KEY)) as string | null;
    const melp = (await getPref(MAGIC_EDIT_LLM_PROVIDER_KEY)) as string | null;
    const melm = (await getPref(MAGIC_EDIT_LLM_MODEL_KEY)) as string | null;
    const mevp = (await getPref(MAGIC_EDIT_VOICE_PROVIDER_KEY)) as
      | string
      | null;
    const s = (await getPref(CUSTOM_SERVER_KEY)) ?? "";

    if (p) setProviderState(p);
    if (cp) setCleanupProviderState(cp);

    // Normalize legacy cleanupModel string if needed
    if (cm) {
      if (cm === "groq/llama-3.3-70b-versatile") {
        setCleanupProviderState("groq");
        setCleanupModelState("llama-3.1-8b-instant");
      } else if (cm === "openai/gpt-4o-mini") {
        setCleanupProviderState("openai");
        setCleanupModelState("gpt-4o-mini");
      } else if (cm === "off") {
        setCleanupProviderState("off");
      } else {
        setCleanupModelState(cm);
      }
    }

    if (melp) setMagicEditLlmProviderState(melp);
    if (melm) setMagicEditLlmModelState(melm);
    if (mevp) setMagicEditVoiceProviderState(mevp);
    setCustomServerUrlState(s);

    // Check all keys
    const nextConfigured: Record<ProviderId, boolean> = {
      groq: false,
      openai: false,
      anthropic: false,
      google: false,
      mistral: false,
      openrouter: false,
      deepgram: false,
      custom: Boolean(s?.trim()),
    };

    const nextDiscovered = { ...discoveredModels };

    for (const item of ALL_PROVIDERS) {
      const k = await getSecureApiKey(item.id);
      nextConfigured[item.id] =
        Boolean(k?.trim()) || (item.id === "custom" && Boolean(s?.trim()));

      // Load cached models
      const cached = await getCachedModels(item.id);
      if (cached.length > 0) {
        nextDiscovered[item.id] = cached;
      }
    }

    setConfiguredKeys(nextConfigured);
    setDiscoveredModels(nextDiscovered);
    setReady(true);
  }, [discoveredModels]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setProvider = useCallback(async (next: TranscriptionProvider) => {
    setProviderState(next);
    await setPref(PROVIDER_KEY, next);
  }, []);

  const setCleanupProvider = useCallback(async (next: CleanupProviderId) => {
    setCleanupProviderState(next);
    await setPref(CLEANUP_PROVIDER_KEY, next);
  }, []);

  const setCleanupModel = useCallback(async (next: string) => {
    setCleanupModelState(next);
    await setPref(CLEANUP_MODEL_KEY, next);
  }, []);

  const setMagicEditLlmProvider = useCallback(async (next: string) => {
    setMagicEditLlmProviderState(next);
    await setPref(MAGIC_EDIT_LLM_PROVIDER_KEY, next);
  }, []);

  const setMagicEditLlmModel = useCallback(async (next: string) => {
    setMagicEditLlmModelState(next);
    await setPref(MAGIC_EDIT_LLM_MODEL_KEY, next);
  }, []);

  const setMagicEditVoiceProvider = useCallback(async (next: string) => {
    setMagicEditVoiceProviderState(next);
    await setPref(MAGIC_EDIT_VOICE_PROVIDER_KEY, next);
  }, []);

  const setCustomServerUrl = useCallback(async (url: string) => {
    setCustomServerUrlState(url);
    await setPref(CUSTOM_SERVER_KEY, url);
  }, []);

  /**
   * Run live model discovery for a given provider.
   */
  const discoverModels = useCallback(
    async (targetProvider: ProviderId) => {
      setDiscovering((prev) => ({ ...prev, [targetProvider]: true }));
      try {
        const key = await getSecureApiKey(targetProvider);
        const models = await discoverProviderModels(
          targetProvider,
          key,
          customServerUrl,
        );
        setDiscoveredModels((prev) => ({
          ...prev,
          [targetProvider]: models,
        }));
        return models;
      } finally {
        setDiscovering((prev) => ({ ...prev, [targetProvider]: false }));
      }
    },
    [customServerUrl],
  );

  const saveApiKey = useCallback(
    async (targetProvider: ProviderId, key: string) => {
      await setSecureApiKey(targetProvider, key.trim());
      await refresh();
      // Auto-discover models after saving key
      void discoverModels(targetProvider);
    },
    [refresh, discoverModels],
  );

  const deleteApiKey = useCallback(
    async (targetProvider: ProviderId) => {
      await removeSecureApiKey(targetProvider);
      await refresh();
    },
    [refresh],
  );

  return {
    provider,
    cleanupProvider,
    cleanupModel,
    magicEditLlmProvider,
    magicEditLlmModel,
    magicEditVoiceProvider,
    customServerUrl,
    configuredKeys,
    discoveredModels,
    discovering,
    ready,

    // Legacy backwards-compatibility flags
    groqConfigured: configuredKeys.groq,
    openAiConfigured: configuredKeys.openai,

    setProvider,
    setCleanupProvider,
    setCleanupModel,
    setMagicEditLlmProvider,
    setMagicEditLlmModel,
    setMagicEditVoiceProvider,
    setCustomServerUrl,
    saveApiKey,
    deleteApiKey,
    discoverModels,
    refresh,
  };
}
