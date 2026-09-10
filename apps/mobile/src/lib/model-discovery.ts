/**
 * Model Discovery engine for Cadence Mobile.
 * Fetches live models directly from provider endpoints (Groq, OpenAI, Anthropic,
 * Google Gemini, Mistral, OpenRouter, Custom / Local LLMs) using user's configured API keys.
 */

import { getPref, setPref } from "./storage";

export type ProviderId =
  | "groq"
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "openrouter"
  | "deepgram"
  | "custom";

export interface DiscoveredModel {
  id: string;
  name: string;
  providerId: ProviderId;
  providerName: string;
  type: "voice" | "llm";
  curated?: boolean;
  description?: string;
}

const TIMEOUT_MS = 8000;
const CACHE_PREFIX = "cadence_models_cache_";

function formatDisplayName(id: string): string {
  return id
    .replace(/^models\//, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Curated fallback models for each provider when offline or before discovery runs.
 */
export const FALLBACK_MODELS: Record<ProviderId, DiscoveredModel[]> = {
  groq: [
    {
      id: "llama-3.1-8b-instant",
      name: "LLaMA 3.1 8B Instant",
      providerId: "groq",
      providerName: "Groq",
      type: "llm",
      curated: true,
      description: "Ultra-fast inference, ideal for real-time clean-up",
    },
    {
      id: "llama-3.3-70b-versatile",
      name: "LLaMA 3.3 70B Versatile",
      providerId: "groq",
      providerName: "Groq",
      type: "llm",
      curated: true,
      description: "Frontier open-weights reasoning & nuanced writing",
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Mixtral 8x7B",
      providerId: "groq",
      providerName: "Groq",
      type: "llm",
      curated: false,
      description: "High-speed MoE model with 32k context",
    },
    {
      id: "qwen-2.5-32b",
      name: "Qwen 2.5 32B",
      providerId: "groq",
      providerName: "Groq",
      type: "llm",
      curated: false,
    },
    {
      id: "deepseek-r1-distill-llama-70b",
      name: "DeepSeek R1 Distill 70B",
      providerId: "groq",
      providerName: "Groq",
      type: "llm",
      curated: true,
      description: "Advanced step-by-step reasoning",
    },
    {
      id: "whisper-large-v3-turbo",
      name: "Whisper Large v3 Turbo",
      providerId: "groq",
      providerName: "Groq",
      type: "voice",
      curated: true,
      description: "Fastest speech-to-text (~200ms)",
    },
    {
      id: "whisper-large-v3",
      name: "Whisper Large v3",
      providerId: "groq",
      providerName: "Groq",
      type: "voice",
      curated: false,
      description: "High accuracy multilingual transcription",
    },
  ],
  openai: [
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      providerId: "openai",
      providerName: "OpenAI",
      type: "llm",
      curated: true,
      description: "Fast, intelligent, and cost-effective",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      providerId: "openai",
      providerName: "OpenAI",
      type: "llm",
      curated: true,
      description: "Flagship intelligence for complex restructuring",
    },
    {
      id: "o3-mini",
      name: "o3-mini",
      providerId: "openai",
      providerName: "OpenAI",
      type: "llm",
      curated: false,
      description: "High-speed reasoning model",
    },
    {
      id: "whisper-1",
      name: "Whisper-1",
      providerId: "openai",
      providerName: "OpenAI",
      type: "voice",
      curated: true,
      description: "OpenAI speech recognition endpoint",
    },
  ],
  anthropic: [
    {
      id: "claude-3-5-haiku-latest",
      name: "Claude 3.5 Haiku",
      providerId: "anthropic",
      providerName: "Anthropic",
      type: "llm",
      curated: true,
      description: "Ultra-fast, concise editing",
    },
    {
      id: "claude-3-5-sonnet-latest",
      name: "Claude 3.5 Sonnet",
      providerId: "anthropic",
      providerName: "Anthropic",
      type: "llm",
      curated: true,
      description: "Elite writing and reasoning",
    },
    {
      id: "claude-3-7-sonnet-latest",
      name: "Claude 3.7 Sonnet",
      providerId: "anthropic",
      providerName: "Anthropic",
      type: "llm",
      curated: true,
      description: "Hybrid reasoning and instant response",
    },
  ],
  google: [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      providerId: "google",
      providerName: "Google Gemini",
      type: "llm",
      curated: true,
      description: "Next-gen fast multimodal model",
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      providerId: "google",
      providerName: "Google Gemini",
      type: "llm",
      curated: false,
      description: "Lightweight fast assistant",
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      providerId: "google",
      providerName: "Google Gemini",
      type: "llm",
      curated: true,
      description: "Complex reasoning & deep context",
    },
  ],
  mistral: [
    {
      id: "mistral-small-latest",
      name: "Mistral Small",
      providerId: "mistral",
      providerName: "Mistral AI",
      type: "llm",
      curated: true,
      description: "Fast reasoning and editing",
    },
    {
      id: "mistral-large-latest",
      name: "Mistral Large",
      providerId: "mistral",
      providerName: "Mistral AI",
      type: "llm",
      curated: true,
      description: "Top-tier multilingual intelligence",
    },
    {
      id: "codestral-latest",
      name: "Codestral",
      providerId: "mistral",
      providerName: "Mistral AI",
      type: "llm",
      curated: false,
      description: "Fluent in 80+ programming languages",
    },
  ],
  openrouter: [
    {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B (OpenRouter)",
      providerId: "openrouter",
      providerName: "OpenRouter",
      type: "llm",
      curated: true,
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet (OpenRouter)",
      providerId: "openrouter",
      providerName: "OpenRouter",
      type: "llm",
      curated: true,
    },
    {
      id: "google/gemini-2.0-flash-001",
      name: "Gemini 2.0 Flash (OpenRouter)",
      providerId: "openrouter",
      providerName: "OpenRouter",
      type: "llm",
      curated: true,
    },
  ],
  deepgram: [
    {
      id: "nova-3",
      name: "Nova-3",
      providerId: "deepgram",
      providerName: "Deepgram",
      type: "voice",
      curated: true,
      description: "Next-generation speech recognition",
    },
    {
      id: "nova-2",
      name: "Nova-2",
      providerId: "deepgram",
      providerName: "Deepgram",
      type: "voice",
      curated: false,
      description: "Production-proven accuracy",
    },
  ],
  custom: [
    {
      id: "default",
      name: "Default Endpoint Model",
      providerId: "custom",
      providerName: "Custom LLM",
      type: "llm",
      curated: true,
      description: "Model served at custom OpenAI-compatible endpoint",
    },
  ],
};

/**
 * Fetch live models from Groq.
 */
async function fetchGroqLive(apiKey: string): Promise<DiscoveredModel[]> {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: Array<{ id: string; active?: boolean }>;
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  const models: DiscoveredModel[] = [];

  for (const item of json.data) {
    if (item.active === false) continue;
    const id = item.id.toLowerCase();

    if (id.includes("whisper")) {
      models.push({
        id: item.id,
        name: formatDisplayName(item.id),
        providerId: "groq",
        providerName: "Groq",
        type: "voice",
        curated: id.includes("turbo"),
      });
    } else if (!id.includes("embed") && !id.includes("guard")) {
      models.push({
        id: item.id,
        name: formatDisplayName(item.id),
        providerId: "groq",
        providerName: "Groq",
        type: "llm",
        curated: id.includes("llama-3.1-8b") || id.includes("llama-3.3-70b"),
      });
    }
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch live models from OpenAI.
 */
async function fetchOpenAILive(apiKey: string): Promise<DiscoveredModel[]> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);

  const json = (await res.json()) as { data?: Array<{ id: string }> };
  if (!json.data || !Array.isArray(json.data)) return [];

  const validPrefixes = ["gpt-4", "gpt-3.5", "o1", "o3", "chatgpt"];
  const excludePatterns = [
    /audio/i,
    /realtime/i,
    /embedding/i,
    /dall-e/i,
    /tts/i,
    /whisper/i,
    /babbage/i,
    /davinci/i,
  ];

  const models: DiscoveredModel[] = [];

  for (const m of json.data) {
    const id = m.id.toLowerCase();
    if (id === "whisper-1") {
      models.push({
        id: m.id,
        name: "Whisper-1",
        providerId: "openai",
        providerName: "OpenAI",
        type: "voice",
        curated: true,
      });
      continue;
    }

    const matchesPrefix = validPrefixes.some((p) => id.startsWith(p));
    const isExcluded = excludePatterns.some((rx) => rx.test(id));

    if (matchesPrefix && !isExcluded) {
      models.push({
        id: m.id,
        name: formatDisplayName(m.id),
        providerId: "openai",
        providerName: "OpenAI",
        type: "llm",
        curated:
          m.id === "gpt-4o" || m.id === "gpt-4o-mini" || m.id === "o3-mini",
      });
    }
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch live models from Anthropic.
 */
async function fetchAnthropicLive(apiKey: string): Promise<DiscoveredModel[]> {
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey.trim(),
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: Array<{ id: string; display_name?: string }>;
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data.map((m) => ({
    id: m.id,
    name: m.display_name ?? formatDisplayName(m.id),
    providerId: "anthropic",
    providerName: "Anthropic",
    type: "llm",
    curated: m.id.includes("sonnet") || m.id.includes("haiku"),
  }));
}

/**
 * Fetch live models from Google Gemini.
 */
async function fetchGoogleLive(apiKey: string): Promise<DiscoveredModel[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}&pageSize=50`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);

  const json = (await res.json()) as {
    models?: Array<{
      name: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }>;
  };
  if (!json.models || !Array.isArray(json.models)) return [];

  return json.models
    .filter((m) => {
      const methods = m.supportedGenerationMethods ?? [];
      const isGenerateContent = methods.includes("generateContent");
      const name = m.name.toLowerCase();
      return (
        isGenerateContent &&
        !name.includes("embedding") &&
        !name.includes("aqa") &&
        !name.includes("imagen")
      );
    })
    .map((m) => {
      const cleanId = m.name.replace(/^models\//, "");
      return {
        id: cleanId,
        name: m.displayName ?? formatDisplayName(cleanId),
        providerId: "google" as ProviderId,
        providerName: "Google Gemini",
        type: "llm" as const,
        curated: cleanId.includes("flash") || cleanId.includes("pro"),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch live models from Mistral.
 */
async function fetchMistralLive(apiKey: string): Promise<DiscoveredModel[]> {
  const res = await fetch("https://api.mistral.ai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Mistral HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: Array<{ id: string; name?: string }>;
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data
    .filter((m) => {
      const id = m.id.toLowerCase();
      return !id.includes("embed") && !id.includes("moderation");
    })
    .map((m) => ({
      id: m.id,
      name: m.name ?? formatDisplayName(m.id),
      providerId: "mistral" as ProviderId,
      providerName: "Mistral AI",
      type: "llm" as const,
      curated: m.id.includes("small") || m.id.includes("large"),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch live models from OpenRouter.
 */
async function fetchOpenRouterLive(apiKey: string): Promise<DiscoveredModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: Array<{ id: string; name?: string }>;
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data.slice(0, 100).map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    providerId: "openrouter" as ProviderId,
    providerName: "OpenRouter",
    type: "llm" as const,
    curated:
      m.id.includes("claude-3.5-sonnet") ||
      m.id.includes("gpt-4o") ||
      m.id.includes("gemini-2.0-flash"),
  }));
}

/**
 * Fetch live models from Custom / Local OpenAI-compatible endpoint.
 */
async function fetchCustomLive(
  endpointUrl: string,
  apiKey?: string,
): Promise<DiscoveredModel[]> {
  const baseUrl = endpointUrl.trim().replace(/\/+$/, "").replace(/\/v1$/, "");
  const headers: Record<string, string> = {};
  if (apiKey?.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  const res = await fetch(`${baseUrl}/v1/models`, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Custom endpoint HTTP ${res.status}`);

  const json = (await res.json()) as { data?: Array<{ id: string }> };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data.map((m) => ({
    id: m.id,
    name: m.id,
    providerId: "custom" as ProviderId,
    providerName: "Custom LLM",
    type: "llm" as const,
    curated: true,
  }));
}

/**
 * Discover live models for a provider, caching successful results.
 */
export async function discoverProviderModels(
  provider: ProviderId,
  apiKey?: string | null,
  customUrl?: string | null,
): Promise<DiscoveredModel[]> {
  // Return fallbacks immediately if provider is deepgram (static models)
  if (provider === "deepgram") {
    return FALLBACK_MODELS.deepgram;
  }

  const key = apiKey?.trim();
  const url = customUrl?.trim();

  // If no credentials provided, return cached or fallback models
  if (!key && !(provider === "custom" && url)) {
    const cached = await getCachedModels(provider);
    return cached.length > 0 ? cached : FALLBACK_MODELS[provider] || [];
  }

  try {
    let live: DiscoveredModel[] = [];

    switch (provider) {
      case "groq":
        live = await fetchGroqLive(key!);
        break;
      case "openai":
        live = await fetchOpenAILive(key!);
        break;
      case "anthropic":
        live = await fetchAnthropicLive(key!);
        break;
      case "google":
        live = await fetchGoogleLive(key!);
        break;
      case "mistral":
        live = await fetchMistralLive(key!);
        break;
      case "openrouter":
        live = await fetchOpenRouterLive(key!);
        break;
      case "custom":
        if (url) live = await fetchCustomLive(url, key);
        break;
    }

    if (live.length > 0) {
      // Cache discovered models
      await setPref(`${CACHE_PREFIX}${provider}`, JSON.stringify(live));
      return live;
    }
  } catch (err) {
    console.warn(
      `[Model Discovery] Failed to discover live models for ${provider}:`,
      err,
    );
  }

  // Fallback to cache or built-ins
  const cached = await getCachedModels(provider);
  return cached.length > 0 ? cached : FALLBACK_MODELS[provider] || [];
}

/**
 * Get previously cached models for a provider.
 */
export async function getCachedModels(
  provider: ProviderId,
): Promise<DiscoveredModel[]> {
  try {
    const raw = await getPref(`${CACHE_PREFIX}${provider}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as DiscoveredModel[];
      }
    }
  } catch {
    // ignore json error
  }
  return [];
}
