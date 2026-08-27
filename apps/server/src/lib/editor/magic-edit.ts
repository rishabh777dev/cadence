import { sanitizeTranscriptText } from "@cadence-voice/stt";
import { createAppLogger } from "@cadence-voice/utils";
import { generateText } from "ai";
import { FREESTYLE_CLOUD_PROVIDER_ID } from "../cadence-cloud.js";
import { getDb } from "../db.js";
import {
  getCleanupAppAssignments,
  getCleanupDeveloperTags,
  getCleanupDeveloperTone,
  getCleanupDeveloperToneScope,
  getCleanupEmailTone,
  getCleanupEmailToneScope,
  getCleanupOverallTone,
  getCleanupOverallToneScope,
  getCleanupPersonalTone,
  getCleanupPersonalToneScope,
  getCleanupWorkTone,
  getCleanupWorkToneScope,
} from "../post-process.js";
import { createChatModel, getDefaultModels } from "../providers.js";
import { parseAppContextPayload } from "./app-context.js";
import { getRewritePromptContext } from "./rewrite-context.js";

const log = createAppLogger("magic-edit");

export interface MagicEditParams {
  selectedText: string;
  instruction: string;
  appContext?: string | null;
  language?: string;
  apiKey?: string;
  model?: string;
  tone?: string;
  customPrompt?: string;
  script?: string;
}

export interface MagicEditResult {
  editedText: string;
  instruction: string;
  llmProvider: string | null;
  llmModel: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export function isReplyIntent(instruction: string): boolean {
  const norm = instruction.toLowerCase().trim();
  return (
    /\b(reply|respond|response|answer|help me reply|what should i say|what to reply|how to reply|write a reply|draft a reply|tell (him|her|them)|say to (him|her|them)|say that|say yes|say no)\b/i.test(
      norm,
    ) || /^(reply|respond|answer)\b/i.test(norm)
  );
}

export function buildMagicEditPrompt(params: {
  selectedText: string;
  instruction: string;
  appContext?: string | null;
  language?: string;
  tone?: string;
  customPrompt?: string;
  script?: string;
}): { system: string; prompt: string } {
  const ctx = parseAppContextPayload(params.appContext ?? null);
  const appDesc = ctx?.app
    ? ` The user is working inside ${ctx.app}${ctx.windowTitle ? ` (${ctx.windowTitle})` : ""}.`
    : "";

  let toneInstruction = "";
  if (params.tone === "professional") {
    toneInstruction =
      "\nTone requirement: Write in a polished, professional, business-appropriate tone.";
  } else if (params.tone === "casual") {
    toneInstruction =
      "\nTone requirement: Write in a relaxed, friendly, conversational tone.";
  } else if (params.tone === "concise") {
    toneInstruction =
      "\nTone requirement: Be extremely direct and concise. Eliminate any wordiness.";
  } else if (params.tone === "academic") {
    toneInstruction =
      "\nTone requirement: Use formal academic and articulate vocabulary.";
  } else if (params.tone === "direct") {
    toneInstruction =
      "\nTone requirement: Deliver the message in direct, crisp, high-impact phrasing.";
  } else if (params.tone === "commits") {
    toneInstruction =
      "\nTone requirement: Format in standard git conventional commit syntax (e.g. feat(scope): ..., fix: ...). Use imperative mood and remove conversational fluff.";
  } else if (params.tone === "docstrings") {
    toneInstruction =
      "\nTone requirement: Write technical markdown/docstrings with inline backticks around all code symbols, functions, types, and file paths.";
  } else if (params.tone === "terminal") {
    toneInstruction =
      "\nTone requirement: Extract and output exact, executable shell/CLI commands and flags without conversational words.";
  } else if (params.tone === "technical") {
    toneInstruction =
      "\nTone requirement: High-density, concise engineer-to-engineer technical notes and bullet points.";
  }

  const customInstruction = params.customPrompt?.trim()
    ? `\nUser's custom instructions:\n${params.customPrompt.trim()}`
    : "";

  const scriptRule =
    params.script === "native"
      ? "5. Output in the native script of the requested language unless specified otherwise."
      : "5. If Hindi or Hinglish is requested or spoken, output in natural, fluent Roman script (English alphabet). Never output in Devanagari or Arabic script unless explicitly instructed.";

  // Mode B: Direct Content Generation / Ghostwriting (when no text was selected)
  if (!params.selectedText.trim()) {
    const system = `You are an elite, highly capable AI ghostwriter, copywriter, and assistant.${appDesc}
Your objective is to directly write, generate, or compose whatever the user requests in their spoken voice instruction.${toneInstruction}${customInstruction}

CRITICAL RULES:
1. GHOSTWRITER & FIRST-PERSON PERSPECTIVE:
   - When the user asks to write, draft, or compose a letter, email, message, note, or reply to someone (e.g. "write a letter to my girlfriend", "email my manager", "send a message to my friend", "write a cold outreach"), ALWAYS write the message directly from the user's first-person perspective ("I" / "my") addressed directly to the recipient ("You" / "Dear [Name]").
   - NEVER talk about the recipient in the third person. Write the actual message/letter directly.
   - Capture the authentic human emotion, warmth, urgency, depth, or professional tone requested by the user.
2. DYNAMIC FULFILLMENT:
   - Fulfill ANY request dynamically like an expert assistant:
     - If the user asks for a prompt, generate the comprehensive prompt.
     - If the user asks for an email or letter, write the complete, expressive text with proper greetings and sign-offs.
     - If the user asks for code, generate the clean, working code.
     - If the user asks for a summary, plan, or checklist, generate it directly.
3. OUTPUT ONLY:
   - Output ONLY the final drafted text ready to be pasted directly into the user's active window/cursor.
4. NO FILLER OR META-PREAMBLES:
   - NEVER include conversational preambles (e.g. NEVER output "Here is your letter:", "Sure, here's what you requested:", "Certainly!", "Below is the draft:"). Start immediately with the opening line of the text.
5. NO FENCES:
   - DO NOT wrap the output in markdown code blocks unless the user explicitly requested code or markdown formatting.
${scriptRule}`;

    const prompt = `<user_request>
${params.instruction.trim()}
</user_request>

Write the final generated text below:`;

    return { system, prompt };
  }

  // Mode C: Smart Contextual Reply (when text was selected and user wants to reply/respond)
  if (isReplyIntent(params.instruction)) {
    const system = `You are an elite AI communication partner and ghostwriter.${appDesc}
The user has highlighted a message, email, or conversation they received (<incoming_message_to_reply_to>) and wants you to compose the perfect reply based on their instruction (<reply_instruction>).${toneInstruction}${customInstruction}

CRITICAL RULES:
1. FIRST-PERSON REPLY:
   - Write the reply directly from the user's perspective ("I" / "we") addressing the sender ("you").
   - Do NOT talk in the third person. Do NOT summarize or explain what you are doing.
2. OPEN-ENDED & SPECIFIC INSTRUCTIONS:
   - If the instruction is specific (e.g. "say yes and ask for Friday at 3pm"), fulfill all specified points cleanly.
   - If the instruction is open-ended (e.g. "help me reply to this", "what should I say", "draft a response", "answer them"), analyze the incoming message, identify what the sender is asking for, and compose a warm, professional, engaging reply that advances the conversation and addresses their questions.
3. PLATFORM & TONE MATCHING:
   - Adapt formatting and layout to the active app (e.g. email with greetings/sign-offs, LinkedIn with polished professional networking tone, Slack with crisp friendly clarity, WhatsApp with conversational warmth).
4. OUTPUT ONLY:
   - Output ONLY the final drafted reply text ready to be pasted into the chat or email compose box.
5. NO FILLER OR PREAMBLES:
   - NEVER include conversational filler, preamble, notes, or quotes (e.g. NEVER output "Here is a reply:", "Sure, here's what you can say:"). Start immediately with the first line of the reply.
6. NO FENCES:
   - DO NOT wrap the output in markdown code blocks unless code formatting is explicitly requested.
${scriptRule}`;

    const prompt = `<reply_instruction>
${params.instruction.trim()}
</reply_instruction>

<incoming_message_to_reply_to>
${params.selectedText}
</incoming_message_to_reply_to>

Write the final reply below:`;

    return { system, prompt };
  }

  // Mode A: In-Place Text Rewrite / Edit (when text was selected and user wants to edit/transform it)
  const system = `You are an elite, direct in-place text editor and copywriter.${appDesc}
Your objective is to directly rewrite and transform the user's provided original text strictly following their requested instruction.${toneInstruction}${customInstruction}

CRITICAL RULES:
1. DIRECT EXECUTION:
   - Write the actual, complete replacement text. Do NOT describe what to do, do NOT summarize instructions, and do NOT output meta-commentary (e.g. NEVER output "edit text which is...", "here is the paragraph:", "rewrite the following...").
2. PERSPECTIVE & TONE:
   - Maintain the user's intended perspective (first-person "I" / author voice) and match the requested emotional, creative, or professional tone.
3. SCOPE:
   - If the instruction asks for an elaborate, long, detailed, polite, or structured rewrite, expand and polish the full text dynamically.
4. OUTPUT ONLY:
   - Return ONLY the final rewritten text that should be pasted in place of the original text.
5. NO FILLER:
   - NEVER include conversational filler, preamble, explanations, notes, or quotation marks around the output.
6. NO FENCES:
   - DO NOT wrap the output in markdown code blocks unless the instruction explicitly requests code or markdown formatting.
${scriptRule}
8. FACTUAL INTEGRITY:
   - Preserve essential factual details, names, numbers, and core intent unless the instruction explicitly asks to alter them.`;

  const prompt = `<instruction_how_to_rewrite>
${params.instruction.trim()}
</instruction_how_to_rewrite>

<original_text_to_be_replaced>
${params.selectedText}
</original_text_to_be_replaced>

Write the final rewritten text below:`;

  return { system, prompt };
}

/**
 * Resolves the active LLM provider and model without relying on Freestyle Cloud.
 * Prioritizes:
 * 1. User's explicit Magic Edit provider/model settings.
 * 2. User's configured default model in Settings > Models.
 * 3. Saved model configs in database.
 * 4. Configured BYOK API keys (Groq, OpenAI, Anthropic, Google, OpenRouter, Mistral).
 * 5. Local LLM endpoint URL.
 */
export function resolveMagicEditLlm(): {
  providerId: string;
  modelId: string;
} {
  const db = getDb();

  // 1. Check if user configured a specific provider/model in Magic Edit settings
  try {
    const pRow = db
      .prepare("SELECT value FROM settings WHERE key = 'magic_edit_provider'")
      .get() as { value: string } | undefined;
    const mRow = db
      .prepare("SELECT value FROM settings WHERE key = 'magic_edit_model'")
      .get() as { value: string } | undefined;
    const provider = pRow?.value?.trim();
    const model = mRow?.value?.trim();

    if (
      provider &&
      provider !== "auto" &&
      provider !== FREESTYLE_CLOUD_PROVIDER_ID
    ) {
      const defaultModelForProvider =
        provider === "groq"
          ? "llama-3.3-70b-versatile"
          : provider === "openai"
            ? "gpt-4o-mini"
            : provider === "anthropic"
              ? "claude-3-5-haiku-latest"
              : provider === "google"
                ? "gemini-2.0-flash"
                : provider === "mistral"
                  ? "mistral-small-latest"
                  : provider === "openrouter"
                    ? "openai/gpt-4o-mini"
                    : "default";

      return {
        providerId: provider,
        modelId: model || defaultModelForProvider,
      };
    }
  } catch {}

  const defaults = getDefaultModels();

  // 2. If default LLM model is configured and not freestyle-cloud
  if (defaults.llm && defaults.llm.provider !== FREESTYLE_CLOUD_PROVIDER_ID) {
    return {
      providerId: defaults.llm.provider,
      modelId: defaults.llm.model_id,
    };
  }

  // 3. Check model_configs for any non-cloud LLM model
  try {
    const nonCloudConfig = db
      .prepare(
        "SELECT provider, model_id FROM model_configs WHERE type = 'llm' AND provider != 'freestyle-cloud' ORDER BY is_default DESC LIMIT 1",
      )
      .get() as { provider: string; model_id: string } | undefined;

    if (nonCloudConfig) {
      return {
        providerId: nonCloudConfig.provider,
        modelId: nonCloudConfig.model_id,
      };
    }
  } catch {}

  // 4. Check api_keys table for any available BYOK LLM provider key
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
          modelId: "llama-3.3-70b-versatile",
        };
      }
      if (row.provider === "openai") {
        return {
          providerId: "openai",
          modelId: "gpt-4o-mini",
        };
      }
      if (row.provider === "anthropic") {
        return {
          providerId: "anthropic",
          modelId: "claude-3-5-haiku-latest",
        };
      }
      if (row.provider === "google") {
        return {
          providerId: "google",
          modelId: "gemini-2.0-flash",
        };
      }
      if (row.provider === "openrouter") {
        return {
          providerId: "openrouter",
          modelId: "openai/gpt-4o-mini",
        };
      }
      if (row.provider === "mistral") {
        return {
          providerId: "mistral",
          modelId: "mistral-small-latest",
        };
      }
      if (row.provider === "vercel") {
        return {
          providerId: "vercel",
          modelId: "openai/gpt-4o-mini",
        };
      }
    }
  } catch {}

  // 5. Check if local_llm_url is configured in settings
  try {
    const localUrl = db
      .prepare("SELECT value FROM settings WHERE key = 'local_llm_url'")
      .get() as { value: string } | undefined;

    if (localUrl?.value?.trim()) {
      const localModel = db
        .prepare("SELECT value FROM settings WHERE key = 'local_llm_model'")
        .get() as { value: string } | undefined;

      return {
        providerId: "local-llm",
        modelId: localModel?.value?.trim() || "default",
      };
    }
  } catch {}

  throw new Error(
    "No local or BYOK LLM provider configured. Please configure an LLM model (Groq, OpenAI, Anthropic, Google, OpenRouter, or Local LLM) in Settings > Magic Edit or Settings > Models.",
  );
}

export async function transformWithMagicEdit(
  params: MagicEditParams,
): Promise<MagicEditResult> {
  const selectedText = params.selectedText.trim();
  const instruction = params.instruction.trim();

  if (!instruction) {
    return {
      editedText: selectedText,
      instruction: "",
      llmProvider: null,
      llmModel: null,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };
  }

  // Load any configured tone, customPrompt, or script preference from settings if not passed
  const db = getDb();
  let tone = params.tone;
  let customPrompt = params.customPrompt;
  let script = params.script;

  try {
    if (!tone) {
      const row = db
        .prepare("SELECT value FROM settings WHERE key = 'magic_edit_tone'")
        .get() as { value: string } | undefined;
      tone = row?.value;

      // If no explicit magic_edit_tone override, dynamically inherit the active app's configured Tone setting
      if (!tone && params.appContext) {
        const { destination } = getRewritePromptContext(
          params.appContext,
          getCleanupAppAssignments(),
        );

        if (destination === "personal") {
          const pTone = getCleanupPersonalTone();
          const pScope = getCleanupPersonalToneScope();
          if (pTone !== "off" && pScope !== "dictation") {
            tone = pTone;
          }
        } else if (destination === "work") {
          const wTone = getCleanupWorkTone();
          const wScope = getCleanupWorkToneScope();
          if (wTone !== "off" && wScope !== "dictation") {
            tone = wTone;
          }
        } else if (destination === "email") {
          const eTone = getCleanupEmailTone();
          const eScope = getCleanupEmailToneScope();
          if (eTone !== "off" && eScope !== "dictation") {
            tone = eTone;
          }
        } else if (destination === "developer") {
          const dTone = getCleanupDeveloperTone();
          const dScope = getCleanupDeveloperToneScope();
          if (dTone !== "off" && dScope !== "dictation") {
            tone = dTone;
          }
          const tags = getCleanupDeveloperTags();
          if (tags.length > 0) {
            const tagsPrompt = `Active Tech Stack: ${tags.join(", ")}. Format code/identifiers accurately.`;
            customPrompt = customPrompt
              ? `${customPrompt}\n${tagsPrompt}`
              : tagsPrompt;
          }
        } else if (destination === "overall") {
          const oTone = getCleanupOverallTone();
          const oScope = getCleanupOverallToneScope();
          if (oTone !== "off" && oScope !== "dictation") {
            tone = oTone;
          }
        }
      }
    }
    if (!customPrompt) {
      const row = db
        .prepare(
          "SELECT value FROM settings WHERE key = 'magic_edit_custom_prompt'",
        )
        .get() as { value: string } | undefined;
      customPrompt = row?.value;
    }
    if (!script) {
      const row = db
        .prepare("SELECT value FROM settings WHERE key = 'magic_edit_script'")
        .get() as { value: string } | undefined;
      script = row?.value;
    }
  } catch {}

  const { system, prompt } = buildMagicEditPrompt({
    ...params,
    tone,
    customPrompt,
    script,
  });

  const { providerId, modelId } = resolveMagicEditLlm();

  try {
    const chatModel = await createChatModel(providerId, modelId);

    const response = await generateText({
      model: chatModel,
      system,
      prompt,
      temperature: params.selectedText.trim() ? 0.3 : 0.6,
    });

    let editedText = response.text.trim();

    // Strip wrapping backtick fences if model wrapped whole text accidentally
    if (editedText.startsWith("```") && editedText.endsWith("```")) {
      const lines = editedText.split("\n");
      if (lines.length >= 2) {
        editedText = lines.slice(1, -1).join("\n").trim();
      }
    }

    // Strip wrapping outer quotes if model added them
    if (
      (editedText.startsWith('"""') && editedText.endsWith('"""')) ||
      (editedText.startsWith('"') && editedText.endsWith('"')) ||
      (editedText.startsWith("'") && editedText.endsWith("'"))
    ) {
      editedText = editedText
        .replace(/^(?:"""|"|')/, "")
        .replace(/(?:"""|"|')$/, "")
        .trim();
    }

    // Strip conversational preambles (e.g. "Here's a more elaborate version of your text:\n---")
    const preambleRegex =
      /^(?:here(?:'s|\s+is|\s+are)\s+[^:\n]+:|sure[,!]?\s*(?:here(?:'s|\s+is)[^:\n]+:)?|certainly[,!]?\s*(?:here(?:'s|\s+is)[^:\n]+:)?|below\s+is\s+[^:\n]+:)\s*(?:\r?\n\s*[-=_*~]{3,}\s*)?\r?\n+/i;
    editedText = editedText.replace(preambleRegex, "").trim();

    // Strip standalone leading markdown separator lines (---, ===, ***)
    editedText = editedText.replace(/^[-=_*~]{3,}\r?\n+/, "").trim();

    const usage = response.usage as
      | { promptTokens?: number; completionTokens?: number }
      | undefined;

    return {
      editedText: sanitizeTranscriptText(editedText),
      instruction,
      llmProvider: providerId,
      llmModel: modelId,
      inputTokens: usage?.promptTokens ?? 0,
      outputTokens: usage?.completionTokens ?? 0,
      costUsd: 0,
    };
  } catch (err) {
    log.error(
      `transformWithMagicEdit failed (${providerId}/${modelId}): ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}
