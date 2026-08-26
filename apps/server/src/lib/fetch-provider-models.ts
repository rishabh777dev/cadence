import { createAppLogger } from "@freestyle-voice/utils";
import { getDb } from "./db.js";

const log = createAppLogger("provider-models");
const TIMEOUT_MS = 8000;

export interface AvailableModel {
  provider_id: string;
  provider_name: string;
  model_id: string;
  model_name: string;
  family: string;
  type: "voice" | "llm";
  cost_input?: number;
  cost_output?: number;
  curated?: boolean;
  gateway?: string;
}

// In-memory cache for live provider models: key = `${provider}:${apiKey.slice(-6)}`
const liveModelsCache = new Map<
  string,
  { models: AvailableModel[]; fetchedAt: number }
>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function formatDisplayName(id: string): string {
  return id
    .replace(/^models\//, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function fetchOpenAIModels(apiKey: string): Promise<AvailableModel[]> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);

  const json = (await res.json()) as { data?: { id: string }[] };
  if (!json.data || !Array.isArray(json.data)) return [];

  const validPrefixes = ["gpt-4", "gpt-3.5", "o1", "o3", "chatgpt"];
  const excludePatterns = [/audio/i, /realtime/i, /embedding/i, /dall-e/i, /tts/i, /whisper/i, /babbage/i, /davinci/i];

  return json.data
    .filter((m) => {
      const id = m.id.toLowerCase();
      const matchesPrefix = validPrefixes.some((p) => id.startsWith(p));
      const isExcluded = excludePatterns.some((rx) => rx.test(id));
      return matchesPrefix && !isExcluded;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      provider_id: "openai",
      provider_name: "OpenAI",
      model_id: m.id,
      model_name: formatDisplayName(m.id),
      family: m.id.startsWith("o") ? "reasoning" : "gpt",
      type: "llm" as const,
      curated: m.id === "gpt-4o" || m.id === "gpt-4o-mini" || m.id === "o3-mini",
    }));
}

async function fetchGroqModels(apiKey: string): Promise<AvailableModel[]> {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: { id: string; active?: boolean }[];
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data
    .filter((m) => {
      const id = m.id.toLowerCase();
      return (
        m.active !== false &&
        !id.includes("whisper") &&
        !id.includes("embed") &&
        !id.includes("guard")
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      provider_id: "groq",
      provider_name: "Groq",
      model_id: m.id,
      model_name: formatDisplayName(m.id),
      family: m.id.includes("llama")
        ? "llama"
        : m.id.includes("qwen")
          ? "qwen"
          : m.id.includes("mistral")
            ? "mistral"
            : m.id.includes("deepseek")
              ? "deepseek"
              : "groq",
      type: "llm" as const,
      curated:
        m.id.includes("llama-3.3-70b") ||
        m.id.includes("llama-3.1-8b") ||
        m.id.includes("mistral-saba"),
    }));
}

async function fetchAnthropicModels(apiKey: string): Promise<AvailableModel[]> {
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: { id: string; display_name?: string }[];
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      provider_id: "anthropic",
      provider_name: "Anthropic",
      model_id: m.id,
      model_name: m.display_name ?? formatDisplayName(m.id),
      family: "claude",
      type: "llm" as const,
      curated:
        m.id.includes("3-5-sonnet") ||
        m.id.includes("3-7-sonnet") ||
        m.id.includes("3-5-haiku"),
    }));
}

async function fetchGoogleModels(apiKey: string): Promise<AvailableModel[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=50`,
    { signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);

  const json = (await res.json()) as {
    models?: {
      name: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }[];
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
        provider_id: "google",
        provider_name: "Google Gemini",
        model_id: cleanId,
        model_name: m.displayName ?? formatDisplayName(cleanId),
        family: "gemini",
        type: "llm" as const,
        curated: cleanId.includes("flash") || cleanId.includes("pro"),
      };
    })
    .sort((a, b) => a.model_id.localeCompare(b.model_id));
}

async function fetchMistralModels(apiKey: string): Promise<AvailableModel[]> {
  const res = await fetch("https://api.mistral.ai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Mistral HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: { id: string; name?: string; capabilities?: { completion_chat?: boolean } }[];
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data
    .filter((m) => {
      const id = m.id.toLowerCase();
      return !id.includes("embed") && !id.includes("moderation");
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      provider_id: "mistral",
      provider_name: "Mistral AI",
      model_id: m.id,
      model_name: m.name ?? formatDisplayName(m.id),
      family: "mistral",
      type: "llm" as const,
      curated:
        m.id.includes("small") ||
        m.id.includes("large") ||
        m.id.includes("codestral"),
    }));
}

async function fetchOpenRouterModels(
  apiKey: string,
): Promise<AvailableModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: {
      id: string;
      name?: string;
      pricing?: { prompt?: string; completion?: string };
    }[];
  };
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data.slice(0, 150).map((m) => ({
    provider_id: "openrouter",
    provider_name: "OpenRouter",
    model_id: m.id,
    model_name: m.name ?? m.id,
    family: m.id.split("/")[0] ?? "openrouter",
    type: "llm" as const,
    cost_input: m.pricing?.prompt ? Number(m.pricing.prompt) : undefined,
    cost_output: m.pricing?.completion
      ? Number(m.pricing.completion)
      : undefined,
    curated:
      m.id.includes("claude-3.5-sonnet") ||
      m.id.includes("gpt-4o") ||
      m.id.includes("gemini-2.0-flash"),
    gateway: "OpenRouter",
  }));
}

export async function fetchLocalOllamaModels(): Promise<AvailableModel[]> {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT key, value FROM settings WHERE key IN ('local_llm_url', 'local_llm_api_key')",
    )
    .all() as { key: string; value: string }[];
  const settings = Object.fromEntries(
    rows.map((r) => [r.key, r.value]),
  ) as Record<string, string | undefined>;

  const defaultUrls = [
    settings.local_llm_url,
    "http://localhost:11434",
    "http://127.0.0.1:11434",
    "http://localhost:1234",
  ].filter(Boolean) as string[];

  for (const rawUrl of defaultUrls) {
    try {
      const baseUrl = rawUrl.replace(/\/+$/, "").replace(/\/v1$/, "");
      const res = await fetch(`${baseUrl}/v1/models`, {
        headers: {
          ...(settings.local_llm_api_key
            ? { Authorization: `Bearer ${settings.local_llm_api_key}` }
            : {}),
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as { data?: { id: string }[] };
      if (!data.data || !Array.isArray(data.data)) continue;

      return data.data.map((m) => ({
        provider_id: "local-llm",
        provider_name: "Local LLM (Ollama)",
        model_id: m.id,
        model_name: m.id,
        family: "local",
        type: "llm" as const,
        cost_input: 0,
        cost_output: 0,
        curated: true,
      }));
    } catch {
      // Try next url
    }
  }

  return [];
}

/**
 * Fetches live models directly from provider API using configured credentials.
 */
export async function getLiveProviderModels(
  provider: string,
  apiKey?: string,
): Promise<AvailableModel[]> {
  if (provider === "local-llm") {
    return fetchLocalOllamaModels();
  }

  let key = apiKey;
  if (!key) {
    const db = getDb();
    const row = db
      .prepare("SELECT key FROM api_keys WHERE provider = ?")
      .get(provider) as { key: string } | undefined;
    key = row?.key;
  }

  if (!key) return [];

  const cacheKey = `${provider}:${key.slice(-6)}`;
  const cached = liveModelsCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.models;
  }

  let models: AvailableModel[] = [];
  try {
    switch (provider) {
      case "openai":
        models = await fetchOpenAIModels(key);
        break;
      case "groq":
        models = await fetchGroqModels(key);
        break;
      case "anthropic":
        models = await fetchAnthropicModels(key);
        break;
      case "google":
        models = await fetchGoogleModels(key);
        break;
      case "mistral":
        models = await fetchMistralModels(key);
        break;
      case "openrouter":
        models = await fetchOpenRouterModels(key);
        break;
      default:
        return [];
    }

    if (models.length > 0) {
      liveModelsCache.set(cacheKey, { models, fetchedAt: Date.now() });
    }
  } catch (err) {
    log.warn(
      `Failed to fetch live models for ${provider}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return models;
}
