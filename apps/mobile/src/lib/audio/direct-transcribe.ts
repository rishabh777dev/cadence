import * as FileSystem from "expo-file-system/legacy";

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
 * Uses native FileSystem.uploadAsync for robust multipart file streaming on Android & iOS.
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

  // Normalize file URI
  let normalizedUri = fileUri.trim();
  if (normalizedUri.startsWith("/") && !normalizedUri.startsWith("file://")) {
    normalizedUri = `file://${normalizedUri}`;
  }

  const filename = normalizedUri.split("/").pop() || "recording.m4a";
  const extension = filename.split(".").pop()?.toLowerCase() || "m4a";
  const mimeType =
    extension === "wav"
      ? "audio/wav"
      : extension === "mp4"
        ? "audio/mp4"
        : "audio/m4a";

  const parameters: Record<string, string> = {
    model,
    response_format: "verbose_json",
  };

  if (language && language !== "auto") {
    parameters.language = language;
  }

  console.log(
    `[Direct Transcribe] Uploading via FileSystem.uploadAsync (${provider}): ${normalizedUri}`,
  );

  const uploadResult = await FileSystem.uploadAsync(endpoint, normalizedUri, {
    fieldName: "file",
    mimeType,
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    parameters,
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    console.error(
      `[Direct Transcribe Error] ${provider.toUpperCase()} responded with status ${uploadResult.status}:`,
      uploadResult.body,
    );
    throw new Error(
      `${provider.toUpperCase()} Transcription Error (${uploadResult.status}): ${uploadResult.body}`,
    );
  }

  const data = JSON.parse(uploadResult.body) as {
    text: string;
    duration?: number;
  };

  console.log(
    `[Direct Transcribe Success] Provider: ${provider}, Duration: ${data.duration ?? "unknown"}s, Text: "${data.text?.trim()}"`,
  );

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
      const errText = await response.text().catch(() => "");
      console.error(
        `[Direct Cleanup Error] Status ${response.status}:`,
        errText,
      );
      return text;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const polished = data.choices?.[0]?.message?.content?.trim();
    return polished || text;
  } catch (cleanErr) {
    console.error(
      "[Direct Cleanup Error] Failed to contact AI cleanup endpoint:",
      cleanErr,
    );
    return text;
  }
}
