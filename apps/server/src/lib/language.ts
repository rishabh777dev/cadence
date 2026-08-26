import { getDb } from "./db.js";

export const ISO_LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  fa: "Persian",
  fi: "Finnish",
  fr: "French",
  hi: "Hindi",
  hinglish: "Hinglish",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  mk: "Macedonian",
  ms: "Malay",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  zh: "Chinese",
};

export const NON_LATIN_LANGUAGES = new Set([
  "ar",
  "el",
  "fa",
  "hi",
  "ja",
  "ko",
  "mk",
  "ru",
  "th",
  "uk",
  "zh",
]);

export function parseLanguageCodes(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

export function buildMultilingualWhisperPrompt(codes: string[]): string | undefined {
  if (codes.length === 0 || (codes.length === 1 && codes[0] === "auto")) {
    return undefined;
  }
  const hasHinglish = codes.includes("hinglish");
  if (hasHinglish) {
    return "Namaste, kaise ho? Let's discuss this task. Haan, bilkul sahi hai.";
  }
  const langNames = codes
    .filter((c) => c !== "auto")
    .map((code) => ISO_LANGUAGE_NAMES[code] ?? code.toUpperCase());
  if (langNames.length > 0) {
    return `Conversation in ${langNames.join(" and ")}.`;
  }
  return undefined;
}

export function normalizeLanguageSetting(
  value: string | null | undefined,
): string | undefined {
  if (!value || value === "auto") return undefined;
  return value;
}

export function getLanguageSetting(): string | undefined {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = 'language'")
    .get() as { value: string } | undefined;
  return normalizeLanguageSetting(row?.value);
}
