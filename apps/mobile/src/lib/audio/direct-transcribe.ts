/**
 * Direct client-side speech transcription & AI cleanup.
 * Sends recorded audio directly to Groq Whisper or OpenAI Whisper APIs
 * without passing through any intermediate server.
 */

import type { CleanupIntensity } from "../cleanup-tones";

export interface DirectTranscribeOptions {
  fileUri: string;
  provider: "groq" | "openai";
  apiKey: string;
  language?: string;
}

export interface DirectTranscribeResult {
  text: string;
  durationSeconds?: number;
}

export interface DirectCleanupOptions {
  text: string;
  cleanupModel: "groq/llama-3.3-70b-versatile" | "openai/gpt-4o-mini" | "off";
  groqKey?: string;
  openAiKey?: string;
  intensity?: CleanupIntensity | "light" | "standard" | "strong";
  customPrompt?: string;
}

const CLEANUP_SYSTEM_PROMPT = `You are a precision voice dictation editor. Clean up the user's raw spoken transcript:
1. Fix capitalization, punctuation, and grammar.
2. Remove filler words (um, uh, like, you know) and accidental stuttering/false starts.
3. Preserve the exact vocabulary, names, acronyms, and technical terms used by the speaker.
4. If formatting (bullet points, email style, code) is clearly implied or dictated, format it cleanly.
5. NEVER answer the transcript as an AI assistant. Return ONLY the polished spoken text with zero conversational commentary.`;

/**
 * Transcribe an audio file directly with Groq or OpenAI Whisper.
 */
export async function directTranscribe({
  fileUri,
  provider,
  apiKey,
  language,
}: DirectTranscribeOptions): Promise<DirectTranscribeResult> {
  if (!apiKey?.trim()) {
    throw new Error(`API key for ${provider} is not configured.`);
  }

  const endpoint =
    provider === "groq"
      ? "https://api.groq.com/openai/v1/audio/transcriptions"
      : "https://api.openai.com/v1/audio/transcriptions";

  const model = provider === "groq" ? "whisper-large-v3-turbo" : "whisper-1";

  // Derive filename and extension
  const filename = fileUri.split("/").pop() || "recording.m4a";
  const extension = filename.split(".").pop()?.toLowerCase() || "m4a";
  const mimeType = extension === "wav" ? "audio/wav" : "audio/m4a";

  const formData = new FormData();
  // React Native FormData file specification
  formData.append("file", {
    uri: fileUri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  formData.append("model", model);
  formData.append("response_format", "verbose_json");

  if (language && language !== "auto") {
    formData.append("language", language);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      // Note: Omit 'Content-Type' so the runtime boundary is set automatically
    },
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(
      `${provider.toUpperCase()} Transcription Error (${response.status}): ${errBody || response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    text: string;
    duration?: number;
  };

  return {
    text: data.text?.trim() || "",
    durationSeconds: data.duration,
  };
}

/**
 * Perform LLM post-processing and text cleanup directly with Groq or OpenAI.
 */
export async function directCleanup({
  text,
  cleanupModel,
  groqKey,
  openAiKey,
  intensity = "standard",
  customPrompt,
}: DirectCleanupOptions): Promise<string> {
  if (!text.trim() || cleanupModel === "off") {
    return text;
  }

  const isGroq = cleanupModel === "groq/llama-3.3-70b-versatile";
  const apiKey = isGroq ? groqKey : openAiKey;
  if (!apiKey?.trim()) {
    return text; // Fallback to raw text if no key available
  }

  const endpoint = isGroq
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

  let prompt = CLEANUP_SYSTEM_PROMPT;
  if (intensity === "low" || intensity === "light") {
    prompt +=
      "\nApply minimal edits: add only basic periods and commas, keeping wording identical.";
  } else if (intensity === "high" || intensity === "strong") {
    prompt +=
      "\nApply strong polish: streamline awkward phrasing into crisp, clear prose while preserving all points.";
  }

  if (customPrompt) {
    prompt += `\nUser instruction: ${customPrompt}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      return text;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const polished = data.choices?.[0]?.message?.content?.trim();
    return polished || text;
  } catch {
    return text;
  }
}
