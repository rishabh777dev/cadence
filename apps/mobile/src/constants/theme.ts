/**
 * Cadence design tokens, lifted from the desktop app's globals.css.
 * Claude-inspired Warm Glass & Terracotta palette. Never pure white/black.
 */

export const Colors = {
  light: {
    background: "#FAF7F2", // warm luminous paper/glass substrate
    foreground: "#1F1E1B", // deep warm obsidian ink
    card: "#FFFFFF",
    primary: "#C15F3D", // signature terracotta accent
    primaryForeground: "#FFFFFF",
    secondary: "#F2EFE8",
    muted: "#F2EFE8",
    mutedForeground: "#787369",
    accent: "#F6EBE5",
    accentForeground: "#8A3D22",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
    border: "#E5E0D8",
    // Cloud's `ring-foreground/10` — subtle card hairline.
    cardRing: "rgba(31, 30, 27, 0.08)",
    // Destructive button: bg-destructive/8 → /16 on press.
    destructiveTint: "rgba(220, 38, 38, 0.08)",
    destructiveTintPressed: "rgba(220, 38, 38, 0.16)",
    // Switch track & input border.
    switchTrack: "#E5E0D8",
  },
  dark: {
    background: "#121211", // warm obsidian frosted substrate
    foreground: "#EDE8DE", // warm luminous cream ink
    card: "#1A1916",
    primary: "#D97757", // luminous glowing terracotta
    primaryForeground: "#FFFFFF",
    secondary: "#272521",
    muted: "#272521",
    mutedForeground: "#9B9484",
    accent: "#2B2621",
    accentForeground: "#F2A285",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    border: "rgba(255, 255, 255, 0.08)",
    // Subtle frosted card hairline in dark mode.
    cardRing: "rgba(237, 232, 222, 0.08)",
    // Destructive button in dark: bg-destructive/15 → /25 on press.
    destructiveTint: "rgba(239, 68, 68, 0.15)",
    destructiveTintPressed: "rgba(239, 68, 68, 0.25)",
    // Switch track & input border in dark.
    switchTrack: "#2A2824",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Three families, three jobs (DESIGN.md §3):
 * - Instrument Serif → display / page titles (the signature italic accent word)
 * - DM Sans → body & UI
 * - JetBrains Mono → uppercase, tracked micro-labels
 */
export const Fonts = {
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansSemiBold: "DMSans_600SemiBold",
  mono: "JetBrainsMono_400Regular",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  "2xl": 18,
  full: 999,
} as const;
