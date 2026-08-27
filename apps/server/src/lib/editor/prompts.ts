/** Transcript cleanup prompt assembly (intensity preset + dynamic blocks). */

import {
  type CleanupDeveloperTone,
  type CleanupEmailTone,
  type CleanupIntensity,
  type CleanupOverallTone,
  type CleanupPersonalTone,
  type CleanupToneDestination,
  type CleanupWorkTone,
  DEFAULT_CLEANUP_DEVELOPER_TONE,
  DEFAULT_CLEANUP_EMAIL_TONE,
  DEFAULT_CLEANUP_INTENSITY,
  DEFAULT_CLEANUP_OVERALL_TONE,
  DEFAULT_CLEANUP_PERSONAL_TONE,
  DEFAULT_CLEANUP_WORK_TONE,
} from "@cadence-voice/validations";
import { getCleanupPromptConfig } from "./prompt-config.js";

function normalizeLanguageCode(language: string): string {
  return language.trim().toLowerCase().replace(/_/g, "-");
}

export function buildLanguageBlock(language: string | undefined): string {
  const config = getCleanupPromptConfig();
  if (!language?.trim() || language === "auto") {
    return config.autoLanguageConstraint;
  }

  const rawCodes = language
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  if (
    rawCodes.length === 0 ||
    (rawCodes.length === 1 && rawCodes[0] === "auto")
  ) {
    return config.autoLanguageConstraint;
  }

  const codes = rawCodes.map(normalizeLanguageCode);

  if (codes.length === 1 && codes[0] === "hinglish") {
    return `\n\nCRITICAL LANGUAGE RULE - HINGLISH (Roman Script):
Transliterate and edit the transcript into natural, fluid Roman script (English alphabet).
- SCRIPT & TRANSLITERATION: The output MUST be in English/Latin letters (Roman script). Transliterate all Hindi words into clean, natural Roman Hindi (e.g., "Hum Hindi mein bolne ki koshish kar rahe hain", "Aapko meri awaaz aa rahi hai?").
- PRESERVE LANGUAGE: Do NOT translate Hindi words to English (e.g. do NOT turn "koshish" into "trying", and do NOT turn "kya ho raha hai" into "what is happening"). Retain the speaker's original spoken words.
- CODE-SWITCHING: Keep actual English words in standard English spelling (e.g., "button", "meeting", "press", "audio", "review", "feel").
- FORMATTING: Punctuate and capitalize naturally for clean, modern messaging.`;
  }

  if (codes.length === 1) {
    const normalized = codes[0];
    const baseCode = normalized.split("-")[0] ?? normalized;
    const label =
      config.languageLabels[normalized] ?? config.languageLabels[baseCode];
    const descriptor = label ? label : `language code "${language}"`;
    const punctuationHint = normalized.startsWith("zh")
      ? " Use standard Chinese punctuation."
      : "";

    return `\n\nLanguage constraint: the transcript language is ${descriptor}. Return the final edited text in the same language and script. Do not translate to English or another language. If the transcript mixes languages, preserve each span in the language spoken.${punctuationHint}`;
  }

  // Multi-language selected pool (e.g. English + Hinglish, or English + German)
  const labels = codes.map((c) => {
    const base = c.split("-")[0] ?? c;
    return config.languageLabels[c] ?? config.languageLabels[base] ?? c;
  });
  const hasHinglish = codes.includes("hinglish");
  const hinglishNote = hasHinglish
    ? " If Hindi or Hinglish is spoken, format all Hindi words in natural Roman script (English alphabet: e.g. 'Hum bolne ki koshish kar rahe hain'). Never output in Devanagari, Arabic, or Urdu script."
    : "";

  return `\n\nLanguage constraint: the user's active languages are ${labels.join(", ")}. Transcribe and edit the speech strictly within these selected languages. Do NOT output in any unselected foreign language or script.${hinglishNote} If the speech code-switches between these selected languages, preserve each span accurately without translating.`;
}

function buildDestinationToneBlock(options: {
  destination: CleanupToneDestination;
  personalTone?: CleanupPersonalTone;
  personalSurface?: "discord" | null;
  workTone?: CleanupWorkTone;
  emailTone?: CleanupEmailTone;
  developerTone?: CleanupDeveloperTone;
  developerTags?: string[];
  overallTone?: CleanupOverallTone;
}): string {
  const config = getCleanupPromptConfig();
  const priority = config.destinationPriorityBlock;
  const toneBlocks = config.toneBlocks;

  // A sector tone of "off" means styling is turned off for that destination:
  // skip the priority block, the tone block, and (for email) the structure
  // block, so cleanup runs the base preset only.
  switch (options.destination) {
    case "personal": {
      const tone = options.personalTone ?? DEFAULT_CLEANUP_PERSONAL_TONE;
      if (tone === "off") return "";
      return (
        priority +
        toneBlocks.personal[tone] +
        (tone === "casual" && options.personalSurface === "discord"
          ? toneBlocks.discordCasualOverlay
          : "")
      );
    }
    case "work": {
      const tone = options.workTone ?? DEFAULT_CLEANUP_WORK_TONE;
      if (tone === "off") return "";
      return priority + toneBlocks.work[tone];
    }
    case "email": {
      const tone = options.emailTone ?? DEFAULT_CLEANUP_EMAIL_TONE;
      if (tone === "off") return "";
      return priority + toneBlocks.email[tone] + toneBlocks.emailStructure;
    }
    case "developer": {
      const tone = options.developerTone ?? DEFAULT_CLEANUP_DEVELOPER_TONE;
      if (tone === "off") return "";
      const tagsBlock =
        options.developerTags && options.developerTags.length > 0
          ? `\n\nActive Tech Stack & Domain Terms: ${options.developerTags.join(", ")}.\nAccurately recognize, spell, and format all terms, libraries, functions, and symbols related to this stack.`
          : "";
      return priority + toneBlocks.developer[tone] + tagsBlock;
    }
    default: {
      const tone = options.overallTone ?? DEFAULT_CLEANUP_OVERALL_TONE;
      if (tone === "off") return "";
      return priority + toneBlocks.overall[tone];
    }
  }
}

function buildDestinationUserPromptBlock(options: {
  destination: CleanupToneDestination;
  personalTone?: CleanupPersonalTone;
  personalSurface?: "discord" | null;
  emailTone?: CleanupEmailTone;
}): string {
  const userPromptBlocks = getCleanupPromptConfig().userPromptBlocks;
  switch (options.destination) {
    case "personal":
      switch (options.personalTone ?? DEFAULT_CLEANUP_PERSONAL_TONE) {
        case "very_casual":
          return userPromptBlocks.personalVeryCasual;
        case "casual":
          return options.personalSurface === "discord"
            ? userPromptBlocks.personalCasualDiscord
            : userPromptBlocks.personalCasualDefault;
        default:
          return "";
      }
    case "email":
      if ((options.emailTone ?? DEFAULT_CLEANUP_EMAIL_TONE) === "off")
        return "";
      return userPromptBlocks.email;
    default:
      return "";
  }
}

/**
 * Resolve the base system prompt for a given cleanup intensity. For "custom",
 * the user-authored prompt is used when present, otherwise we fall back to the
 * "low" preset so cleanup still does something safe.
 */
export function resolveBaseCleanupPrompt(
  intensity: CleanupIntensity,
  customPrompt?: string,
): string {
  const presets = getCleanupPromptConfig().presets;
  if (intensity === "custom") {
    const trimmed = customPrompt?.trim();
    return trimmed ? trimmed : presets.low;
  }
  return presets[intensity];
}

export function buildRewritePrompt(
  inputText: string,
  options?: {
    language?: string;
    intensity?: CleanupIntensity;
    customPrompt?: string;
    destination?: CleanupToneDestination;
    personalTone?: CleanupPersonalTone;
    personalSurface?: "discord" | null;
    workTone?: CleanupWorkTone;
    emailTone?: CleanupEmailTone;
    developerTone?: CleanupDeveloperTone;
    developerTags?: string[];
    overallTone?: CleanupOverallTone;
  },
): { system: string; prompt: string } {
  const languageBlock = buildLanguageBlock(options?.language);
  const destinationBlock = buildDestinationToneBlock({
    destination: options?.destination ?? "overall",
    personalTone: options?.personalTone,
    personalSurface: options?.personalSurface,
    workTone: options?.workTone,
    emailTone: options?.emailTone,
    developerTone: options?.developerTone,
    developerTags: options?.developerTags,
    overallTone: options?.overallTone,
  });
  const destinationUserPromptBlock = buildDestinationUserPromptBlock({
    destination: options?.destination ?? "overall",
    personalTone: options?.personalTone,
    personalSurface: options?.personalSurface,
    emailTone: options?.emailTone,
  });
  const baseSystem = resolveBaseCleanupPrompt(
    options?.intensity ?? DEFAULT_CLEANUP_INTENSITY,
    options?.customPrompt,
  );

  const rawCodes = options?.language
    ? options.language
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const hasHinglish = rawCodes.includes("hinglish");
  const langUserPrompt = hasHinglish
    ? "\n\nCRITICAL: The output MUST be in Roman script (English letters ONLY). Transliterate all Hindi words into natural, fluid Roman Hindi + English. Do NOT translate Hindi words to English."
    : "";

  return {
    system: baseSystem + languageBlock + destinationBlock,
    prompt: `${getCleanupPromptConfig().transcriptEditUserPrompt}${destinationUserPromptBlock}${langUserPrompt}\n\n<transcript>\n${inputText}\n</transcript>`,
  };
}
