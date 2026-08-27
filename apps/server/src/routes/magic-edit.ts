import { sanitizeTranscriptText } from "@cadence-voice/stt";
import { createAppLogger } from "@cadence-voice/utils";
import { Hono } from "hono";
import {
  FREESTYLE_CLOUD_PROVIDER_ID,
  transcribeWithFreestyleCloud,
} from "../lib/cadence-cloud.js";
import { getDb } from "../lib/db.js";
import { transformWithMagicEdit } from "../lib/editor/magic-edit.js";
import { formatError } from "../lib/format-error.js";
import { saveProcessedHistory } from "../lib/history-store.js";
import { getLanguageSetting } from "../lib/language.js";
import { resolveAppContextForCleanup } from "../lib/post-process.js";
import { getDefaultModels } from "../lib/providers.js";
import { getProvider } from "../lib/streaming/registry.js";
import { stripProviderPrefix } from "../lib/streaming/types.js";
import { getApiKeyForProvider } from "../lib/streaming-stt.js";
import { WHISPER_PROVIDER_ID } from "../lib/whisper/constants.js";

const log = createAppLogger("magic-edit-route");

function decodeAppContext(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function resolveMagicEditVoiceProvider(): {
  providerId: string;
  modelId: string;
  apiKey: string | null;
} | null {
  const db = getDb();

  // 1. Check if user configured a specific STT provider in Magic Edit settings
  try {
    const vRow = db
      .prepare(
        "SELECT value FROM settings WHERE key = 'magic_edit_voice_provider'",
      )
      .get() as { value: string } | undefined;
    const provider = vRow?.value?.trim();
    if (
      provider &&
      provider !== "auto" &&
      provider !== FREESTYLE_CLOUD_PROVIDER_ID
    ) {
      const key = getApiKeyForProvider(provider);
      if (key) {
        let modelId = "base";
        if (provider === "groq") modelId = "whisper-large-v3-turbo";
        else if (provider === "openai") modelId = "whisper-1";
        else if (provider === "deepgram") modelId = "nova-3";
        return {
          providerId: provider,
          modelId,
          apiKey: key,
        };
      }
    }
  } catch {}

  const defaults = getDefaultModels();

  // 2. If user configured a default voice model that is NOT freestyle-cloud
  if (
    defaults.voice &&
    defaults.voice.provider !== FREESTYLE_CLOUD_PROVIDER_ID
  ) {
    const key = getApiKeyForProvider(defaults.voice.provider);
    if (key) {
      return {
        providerId: defaults.voice.provider,
        modelId: defaults.voice.model_id,
        apiKey: key,
      };
    }
  }

  // 3. Check model_configs for any non-cloud voice model
  try {
    const nonCloudConfig = db
      .prepare(
        "SELECT provider, model_id FROM model_configs WHERE type = 'voice' AND provider != 'freestyle-cloud' ORDER BY is_default DESC LIMIT 1",
      )
      .get() as { provider: string; model_id: string } | undefined;

    if (nonCloudConfig) {
      const key = getApiKeyForProvider(nonCloudConfig.provider);
      if (key) {
        return {
          providerId: nonCloudConfig.provider,
          modelId: nonCloudConfig.model_id,
          apiKey: key,
        };
      }
    }
  } catch {
    // Ignore query error
  }

  // 4. Check api_keys table for any available BYOK STT provider key
  try {
    const availableKeys = db
      .prepare(
        "SELECT provider, key FROM api_keys WHERE provider != 'freestyle-cloud'",
      )
      .all() as { provider: string; key: string }[];

    for (const row of availableKeys) {
      if (row.provider === "groq") {
        return {
          providerId: "groq",
          modelId: "whisper-large-v3-turbo",
          apiKey: row.key,
        };
      }
      if (row.provider === "openai") {
        return {
          providerId: "openai",
          modelId: "whisper-1",
          apiKey: row.key,
        };
      }
      if (row.provider === "deepgram") {
        return {
          providerId: "deepgram",
          modelId: "nova-3",
          apiKey: row.key,
        };
      }
      if (row.provider === "soniox") {
        return {
          providerId: "soniox",
          modelId: "precision-ivr",
          apiKey: row.key,
        };
      }
    }
  } catch {
    // Ignore query error
  }

  // 5. Check if local whisper is available
  const whisperProvider = getProvider(WHISPER_PROVIDER_ID);
  if (whisperProvider) {
    return {
      providerId: WHISPER_PROVIDER_ID,
      modelId: "base",
      apiKey: "local",
    };
  }

  // 6. Fallback to default if present
  if (defaults.voice) {
    const key = getApiKeyForProvider(defaults.voice.provider);
    if (key) {
      return {
        providerId: defaults.voice.provider,
        modelId: defaults.voice.model_id,
        apiKey: key,
      };
    }
  }

  return null;
}

export const magicEditRoute = new Hono().post("/", async (c) => {
  const start = Date.now();

  const contentType = c.req.header("content-type") ?? "";
  let audioData: Uint8Array;
  let selectedText = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.formData();
    const audioFile = form.get("audio");
    selectedText = String(form.get("selectedText") ?? "");

    if (audioFile instanceof File) {
      audioData = new Uint8Array(await audioFile.arrayBuffer());
    } else {
      audioData = new Uint8Array(0);
    }
  } else {
    audioData = new Uint8Array(await c.req.arrayBuffer());
    selectedText = c.req.header("x-selected-text") ?? "";
  }

  const appContext = resolveAppContextForCleanup(
    decodeAppContext(c.req.header("x-app-context")),
  );

  let audioDurationMs = 0;
  if (audioData.length > 44) {
    audioDurationMs = Math.round((audioData.length - 44) / 32);
  }

  // 1. Transcribe the spoken audio into instruction text
  let instruction = "";
  if (audioData.length > 0) {
    const voice = resolveMagicEditVoiceProvider();
    if (!voice) {
      return c.json(
        {
          error:
            "No voice transcription model configured. Please go to Settings > Magic Edit or Settings > Models to select a Voice model.",
        },
        400,
      );
    }

    const language = getLanguageSetting();

    try {
      if (voice.providerId === FREESTYLE_CLOUD_PROVIDER_ID) {
        const cloudRes = await transcribeWithFreestyleCloud({
          token: voice.apiKey ?? "",
          audio: audioData,
          language,
          mode: "raw",
        });
        instruction = sanitizeTranscriptText(cloudRes.raw ?? "");
      } else {
        const provider = getProvider(voice.providerId);
        if (provider) {
          const result = await provider.transcribe({
            audio: audioData,
            model: stripProviderPrefix(voice.modelId),
            apiKey: voice.apiKey ?? "",
            language,
          });
          instruction = sanitizeTranscriptText(result.text);
        }
      }
    } catch (err) {
      log.warn(
        `Magic edit STT failed (${voice.providerId}/${voice.modelId}): ${err instanceof Error ? err.message : String(err)}`,
      );
      return c.json(
        {
          error: `Voice transcription failed (${voice.providerId}): ${err instanceof Error ? err.message : String(err)}`,
        },
        500,
      );
    }
  }

  if (!instruction.trim()) {
    return c.json(
      {
        error:
          "No spoken instruction detected. Please hold the shortcut and speak your edit command clearly.",
      },
      400,
    );
  }

  // 2. Execute Magic Edit / Magic Generate transformation using configured model
  try {
    const transformResult = await transformWithMagicEdit({
      selectedText: selectedText || "",
      instruction,
      appContext,
      language: getLanguageSetting(),
    });

    const durationMs = Date.now() - start;

    // Save into history
    try {
      const historyRaw = selectedText.trim()
        ? `[Magic Edit] "${instruction}" on: "${selectedText.slice(0, 100)}${selectedText.length > 100 ? "..." : ""}"`
        : `[Magic Generate] "${instruction}"`;

      saveProcessedHistory({
        rawText: historyRaw,
        cleanedText: transformResult.editedText,
        voiceProvider: "magic-edit",
        voiceModel: "voice-instruction",
        llmProvider: transformResult.llmProvider,
        llmModel: transformResult.llmModel,
        durationMs,
        audioDurationMs,
        inputTokens: transformResult.inputTokens,
        outputTokens: transformResult.outputTokens,
        costUsd: transformResult.costUsd,
      });
    } catch (dbErr) {
      log.warn(
        `Failed to save Magic Edit history: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
      );
    }

    return c.json({
      editedText: transformResult.editedText,
      instruction,
      selectedText,
      llmModel: transformResult.llmModel,
      llmProvider: transformResult.llmProvider,
      durationMs,
    });
  } catch (err) {
    const message = formatError(err);
    log.error(`Magic Edit transformation failed: ${message}`);
    return c.json({ error: message }, 500);
  }
});
