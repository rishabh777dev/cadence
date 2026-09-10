import * as FileSystem from "expo-file-system/legacy";

import type { CleanupIntensity } from "../cleanup-tones";

import { executeDirectLLM } from "../direct-llm";
import { getSecureApiKey, type ProviderId } from "../models";

export interface DirectTranscribeOptions {
  fileUri: string;
  provider: "groq" | "openai" | "deepgram";
  apiKey: string;
  language?: string;
}

export interface DirectTranscribeResult {
  text: string;
  durationSeconds?: number;
}

export interface DirectCleanupOptions {
  text: string;
  cleanupModel?: string;
  cleanupProvider?: ProviderId | "off";
  apiKey?: string;
  groqKey?: string;
  openAiKey?: string;
  intensity?: CleanupIntensity | "light" | "standard" | "strong";
  customPrompt?: string;
  customUrl?: string;
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
 * Perform LLM post-processing and text cleanup directly with any configured provider.
 */
export async function directCleanup({
  text,
  cleanupModel,
  cleanupProvider,
  apiKey,
  groqKey,
  openAiKey,
  intensity = "standard",
  customPrompt,
  customUrl,
}: DirectCleanupOptions): Promise<string> {
  if (!text.trim() || cleanupModel === "off" || cleanupProvider === "off") {
    return text;
  }

  // Determine provider and model
  let provider: ProviderId = "groq";
  let model = cleanupModel || "llama-3.1-8b-instant";

  if (cleanupProvider) {
    provider = cleanupProvider;
  } else if (cleanupModel) {
    if (
      cleanupModel.startsWith("openai/") ||
      cleanupModel === "gpt-4o-mini" ||
      cleanupModel === "gpt-4o"
    ) {
      provider = "openai";
      model = cleanupModel.replace(/^openai\//, "");
    } else if (cleanupModel.startsWith("anthropic/")) {
      provider = "anthropic";
      model = cleanupModel.replace(/^anthropic\//, "");
    } else if (cleanupModel.startsWith("google/")) {
      provider = "google";
      model = cleanupModel.replace(/^google\//, "");
    } else if (cleanupModel.startsWith("mistral/")) {
      provider = "mistral";
      model = cleanupModel.replace(/^mistral\//, "");
    } else if (cleanupModel.startsWith("openrouter/")) {
      provider = "openrouter";
      model = cleanupModel.replace(/^openrouter\//, "");
    } else if (cleanupModel.startsWith("groq/")) {
      provider = "groq";
      model = cleanupModel.replace(/^groq\//, "");
    }
  }

  // Resolve API key
  let resolvedKey = apiKey?.trim();
  if (!resolvedKey) {
    if (provider === "groq" && groqKey) resolvedKey = groqKey.trim();
    else if (provider === "openai" && openAiKey) resolvedKey = openAiKey.trim();
    else {
      resolvedKey = (await getSecureApiKey(provider)) || undefined;
    }
  }

  if (!resolvedKey && provider !== "custom") {
    console.log(
      `[Direct Cleanup] No API key available for ${provider}. Returning raw transcript.`,
    );
    return text;
  }

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
    const polished = await executeDirectLLM({
      provider,
      model,
      systemPrompt: prompt,
      messages: [{ role: "user", content: text }],
      apiKey: resolvedKey,
      customUrl,
      temperature: 0.1,
    });

    return polished || text;
  } catch (cleanErr) {
    console.error(
      `[Direct Cleanup Error] Failed to polish transcript with ${provider}/${model}:`,
      cleanErr,
    );
    return text;
  }
}
