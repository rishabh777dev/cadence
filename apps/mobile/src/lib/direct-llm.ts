/**
 * Direct client-side LLM completion engine for Cadence Mobile.
 * Connects directly to Groq, OpenAI, Anthropic, Google Gemini, Mistral, OpenRouter,
 * or Custom / Local OpenAI-compatible endpoints with zero intermediate servers.
 */

import type { ProviderId } from "./model-discovery";

export interface DirectLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DirectLLMOptions {
  provider: ProviderId;
  model: string;
  messages: DirectLLMMessage[];
  systemPrompt?: string;
  temperature?: number;
  apiKey?: string | null;
  customUrl?: string | null;
}

const LLM_TIMEOUT_MS = 25000;

/**
 * Execute a completion request directly against the selected AI provider.
 */
export async function executeDirectLLM({
  provider,
  model,
  messages,
  systemPrompt,
  temperature = 0.2,
  apiKey,
  customUrl,
}: DirectLLMOptions): Promise<string> {
  const cleanKey = apiKey?.trim() || "";
  const cleanUrl = customUrl?.trim() || "";

  if (provider !== "custom" && !cleanKey) {
    throw new Error(`No API key configured for ${provider.toUpperCase()}`);
  }

  // Extract combined system prompt and user contents
  let effectiveSystem = systemPrompt || "";
  const filteredMessages: DirectLLMMessage[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      effectiveSystem = effectiveSystem
        ? `${effectiveSystem}\n\n${m.content}`
        : m.content;
    } else {
      filteredMessages.push(m);
    }
  }

  // 1. Anthropic Claude
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cleanKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: effectiveSystem || undefined,
        messages: filteredMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Anthropic Error (${res.status}): ${err || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ text?: string }>;
    };
    return data.content?.[0]?.text?.trim() || "";
  }

  // 2. Google Gemini
  if (provider === "google") {
    const cleanModel = model.replace(/^models\//, "");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    const contents = filteredMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature,
      },
    };

    if (effectiveSystem) {
      body.systemInstruction = {
        parts: [{ text: effectiveSystem }],
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Google Gemini Error (${res.status}): ${err || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }

  // 3. OpenAI-compatible Providers (Groq, OpenAI, Mistral, OpenRouter, Custom)
  let endpoint = "https://api.openai.com/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (cleanKey) {
    headers.Authorization = `Bearer ${cleanKey}`;
  }

  switch (provider) {
    case "groq":
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
      break;
    case "mistral":
      endpoint = "https://api.mistral.ai/v1/chat/completions";
      break;
    case "openrouter":
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      headers["HTTP-Referer"] = "https://cadencevoice.app";
      headers["X-Title"] = "Cadence Voice";
      break;
    case "custom": {
      const base = cleanUrl.replace(/\/+$/, "").replace(/\/v1$/, "");
      endpoint = `${base}/v1/chat/completions`;
      break;
    }
  }

  const fullMessages = effectiveSystem
    ? [{ role: "system", content: effectiveSystem }, ...filteredMessages]
    : filteredMessages;

  let chosenModel = model;

  const makeOpenAiReq = async (modelToUse: string) => {
    return fetch(endpoint, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      body: JSON.stringify({
        model: modelToUse,
        messages: fullMessages,
        temperature,
      }),
    });
  };

  let res = await makeOpenAiReq(chosenModel);

  // Automatic fallback for Groq if model returns 404 (e.g. llama-3.3-70b-versatile unavailable)
  if (
    provider === "groq" &&
    res.status === 404 &&
    chosenModel !== "llama-3.1-8b-instant"
  ) {
    console.warn(
      `[Direct LLM] Groq returned 404 for ${chosenModel}. Retrying with universal fallback llama-3.1-8b-instant...`,
    );
    chosenModel = "llama-3.1-8b-instant";
    res = await makeOpenAiReq(chosenModel);
  }

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(
      `${provider.toUpperCase()} Error (${res.status}): ${err || res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}
