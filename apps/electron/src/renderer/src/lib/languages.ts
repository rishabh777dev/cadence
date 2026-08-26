export interface LanguageOption {
  id: string;
  label: string;
  nativeLabel: string;
  onboarding?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { id: "en", label: "English", nativeLabel: "English", onboarding: true },
  {
    id: "hinglish",
    label: "Hinglish",
    nativeLabel: "Hindi + English",
    onboarding: true,
  },
  { id: "hi", label: "Hindi", nativeLabel: "हिन्दी", onboarding: true },
  {
    id: "zh",
    label: "Chinese - Simplified",
    nativeLabel: "简体中文",
    onboarding: true,
  },
  {
    id: "zh-tw",
    label: "Chinese - Traditional",
    nativeLabel: "繁體中文",
  },
  { id: "es", label: "Spanish", nativeLabel: "Español", onboarding: true },
  { id: "fr", label: "French", nativeLabel: "Français", onboarding: true },
  { id: "de", label: "German", nativeLabel: "Deutsch", onboarding: true },
  { id: "it", label: "Italian", nativeLabel: "Italiano", onboarding: true },
  { id: "pt", label: "Portuguese", nativeLabel: "Português", onboarding: true },
  { id: "ja", label: "Japanese", nativeLabel: "日本語", onboarding: true },
  { id: "ko", label: "Korean", nativeLabel: "한국어", onboarding: true },
  { id: "ru", label: "Russian", nativeLabel: "Русский", onboarding: true },
  { id: "ar", label: "Arabic", nativeLabel: "العربية" },
  { id: "nl", label: "Dutch", nativeLabel: "Nederlands", onboarding: true },
  { id: "pl", label: "Polish", nativeLabel: "Polski" },
  { id: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { id: "sv", label: "Swedish", nativeLabel: "Svenska" },
  { id: "da", label: "Danish", nativeLabel: "Dansk" },
  { id: "no", label: "Norwegian", nativeLabel: "Norsk" },
  { id: "fi", label: "Finnish", nativeLabel: "Suomi" },
  { id: "uk", label: "Ukrainian", nativeLabel: "Українська" },
  { id: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
  { id: "th", label: "Thai", nativeLabel: "ไทย" },
  { id: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { id: "ms", label: "Malay", nativeLabel: "Bahasa Melayu" },
  { id: "tl", label: "Tagalog", nativeLabel: "Filipino" },
  { id: "el", label: "Greek", nativeLabel: "Ελληνικά" },
  { id: "cs", label: "Czech", nativeLabel: "Čeština" },
  { id: "ro", label: "Romanian", nativeLabel: "Română" },
  { id: "hu", label: "Hungarian", nativeLabel: "Magyar" },
  { id: "he", label: "Hebrew", nativeLabel: "עברית" },
  { id: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { id: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { id: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { id: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { id: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { id: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { id: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
  { id: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { id: "ur", label: "Urdu", nativeLabel: "اردو" },
  { id: "fa", label: "Persian", nativeLabel: "فارسی" },
  { id: "af", label: "Afrikaans", nativeLabel: "Afrikaans" },
  { id: "sq", label: "Albanian", nativeLabel: "Shqip" },
  { id: "am", label: "Amharic", nativeLabel: "አማርኛ" },
  { id: "hy", label: "Armenian", nativeLabel: "Հայերեն" },
  { id: "as", label: "Assamese", nativeLabel: "অসমীয়া" },
  { id: "az", label: "Azerbaijani", nativeLabel: "Azərbaycan" },
  { id: "ba", label: "Bashkir", nativeLabel: "Башҡортса" },
  { id: "eu", label: "Basque", nativeLabel: "Euskara" },
  { id: "be", label: "Belarusian", nativeLabel: "Беларуская" },
  { id: "bs", label: "Bosnian", nativeLabel: "Bosanski" },
  { id: "br", label: "Breton", nativeLabel: "Brezhoneg" },
  { id: "bg", label: "Bulgarian", nativeLabel: "Български" },
  { id: "ca", label: "Catalan", nativeLabel: "Català" },
  { id: "hr", label: "Croatian", nativeLabel: "Hrvatski" },
  { id: "et", label: "Estonian", nativeLabel: "Eesti" },
  { id: "gl", label: "Galician", nativeLabel: "Galego" },
  { id: "ka", label: "Georgian", nativeLabel: "ქართული" },
  { id: "ht", label: "Haitian Creole", nativeLabel: "Kreyòl ayisyen" },
  { id: "ha", label: "Hausa", nativeLabel: "Hausa" },
  { id: "is", label: "Icelandic", nativeLabel: "Íslenska" },
  { id: "jw", label: "Javanese", nativeLabel: "Basa Jawa" },
  { id: "kk", label: "Kazakh", nativeLabel: "Қазақша" },
  { id: "km", label: "Khmer", nativeLabel: "ភាសាខ្មែរ" },
  { id: "lo", label: "Lao", nativeLabel: "ພາສາລາວ" },
  { id: "la", label: "Latin", nativeLabel: "Latina" },
  { id: "lv", label: "Latvian", nativeLabel: "Latviešu" },
  { id: "lt", label: "Lithuanian", nativeLabel: "Lietuvių" },
  { id: "mk", label: "Macedonian", nativeLabel: "Македонски" },
  { id: "ne", label: "Nepali", nativeLabel: "नेपाली" },
  { id: "ps", label: "Pashto", nativeLabel: "پښتو" },
  { id: "sr", label: "Serbian", nativeLabel: "Српски" },
  { id: "sk", label: "Slovak", nativeLabel: "Slovenčina" },
  { id: "sl", label: "Slovenian", nativeLabel: "Slovenščina" },
  { id: "so", label: "Somali", nativeLabel: "Soomaali" },
  { id: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { id: "bo", label: "Tibetan", nativeLabel: "བོད་སྐད་" },
  { id: "cy", label: "Welsh", nativeLabel: "Cymraeg" },
  { id: "yi", label: "Yiddish", nativeLabel: "ייִדיש" },
  { id: "zu", label: "Zulu", nativeLabel: "isiZulu" },
];

export const ONBOARDING_LANGUAGES: LanguageOption[] = LANGUAGES.filter(
  (l) => l.onboarding,
);

export function defaultLanguage(): string {
  const code = (navigator.language || "en").slice(0, 2).toLowerCase();
  return ONBOARDING_LANGUAGES.some((l) => l.id === code) ? code : "auto";
}

export function formatLanguageDisplay(value: string | null | undefined): string {
  if (!value || value === "auto") return "Auto-detect (99 languages)";
  const codes = value.split(",").map((c) => c.trim()).filter(Boolean);
  if (codes.length === 0) return "Auto-detect (99 languages)";
  const map = new Map(LANGUAGES.map((l) => [l.id, l.label]));
  const labels = codes.map((c) => map.get(c) || c);
  return labels.join(" · ");
}
