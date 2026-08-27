import { z } from "zod/v3";

// "off" is a valid value for every sector tone. It means the user has turned
// styling off for that destination: cleanup still runs the base preset, but no
// destination tone or structure block is applied (see destination-style.ts).
export const cleanupPersonalToneSchema = z.enum([
  "polished",
  "casual",
  "very_casual",
  "off",
]);

export const cleanupWorkToneSchema = z.enum([
  "direct",
  "friendly",
  "formal",
  "off",
]);

export const cleanupEmailToneSchema = z.enum([
  "casual",
  "warm",
  "formal",
  "off",
]);

// "Everything else" — the tone applied to destinations we don't recognize as
// personal, work, or email. A plain formality dial rather than a surface-shaped
// tone, since the destination is unknown.
export const cleanupOverallToneSchema = z.enum([
  "casual",
  "neutral",
  "professional",
  "off",
]);

export const cleanupDeveloperToneSchema = z.enum([
  "commits",
  "docstrings",
  "terminal",
  "technical",
  "off",
]);

export const cleanupToneScopeSchema = z.enum([
  "both",
  "dictation",
  "magic_edit",
]);

export type CleanupPersonalTone = z.infer<typeof cleanupPersonalToneSchema>;
export type CleanupWorkTone = z.infer<typeof cleanupWorkToneSchema>;
export type CleanupEmailTone = z.infer<typeof cleanupEmailToneSchema>;
export type CleanupOverallTone = z.infer<typeof cleanupOverallToneSchema>;
export type CleanupDeveloperTone = z.infer<typeof cleanupDeveloperToneSchema>;
export type CleanupToneScope = z.infer<typeof cleanupToneScopeSchema>;

export const cleanupToneDestinationSchema = z.enum([
  "overall",
  "personal",
  "work",
  "email",
  "developer",
]);

export type CleanupToneDestination = z.infer<
  typeof cleanupToneDestinationSchema
>;

export const DEFAULT_CLEANUP_PERSONAL_TONE: CleanupPersonalTone = "off";
export const DEFAULT_CLEANUP_WORK_TONE: CleanupWorkTone = "off";
export const DEFAULT_CLEANUP_EMAIL_TONE: CleanupEmailTone = "off";
export const DEFAULT_CLEANUP_OVERALL_TONE: CleanupOverallTone = "off";
export const DEFAULT_CLEANUP_DEVELOPER_TONE: CleanupDeveloperTone = "off";
export const DEFAULT_CLEANUP_TONE_SCOPE: CleanupToneScope = "both";
export const DEFAULT_CLEANUP_DEVELOPER_TAGS: readonly string[] = [
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Git",
  "Docker",
];

export const cleanupDeveloperTagsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(50);

export function parseCleanupToneScope(
  value: string | null | undefined,
): CleanupToneScope {
  const result = cleanupToneScopeSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CLEANUP_TONE_SCOPE;
}

export function parseCleanupPersonalTone(
  value: string | null | undefined,
): CleanupPersonalTone {
  const result = cleanupPersonalToneSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CLEANUP_PERSONAL_TONE;
}

export function parseCleanupWorkTone(
  value: string | null | undefined,
): CleanupWorkTone {
  const result = cleanupWorkToneSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CLEANUP_WORK_TONE;
}

export function parseCleanupEmailTone(
  value: string | null | undefined,
): CleanupEmailTone {
  const result = cleanupEmailToneSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CLEANUP_EMAIL_TONE;
}

export function parseCleanupOverallTone(
  value: string | null | undefined,
): CleanupOverallTone {
  const result = cleanupOverallToneSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CLEANUP_OVERALL_TONE;
}

export function parseCleanupDeveloperTone(
  value: string | null | undefined,
): CleanupDeveloperTone {
  const result = cleanupDeveloperToneSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CLEANUP_DEVELOPER_TONE;
}

export function parseCleanupDeveloperTags(
  value: string | null | undefined,
): string[] {
  if (!value) return [...DEFAULT_CLEANUP_DEVELOPER_TAGS];
  try {
    const parsed = JSON.parse(value);
    const result = cleanupDeveloperTagsSchema.safeParse(parsed);
    return result.success ? result.data : [...DEFAULT_CLEANUP_DEVELOPER_TAGS];
  } catch {
    return [...DEFAULT_CLEANUP_DEVELOPER_TAGS];
  }
}

/** True when every sector tone is off — no destination routing is needed. */
export function areAllCleanupTonesOff(tones: {
  personalTone: CleanupPersonalTone;
  workTone: CleanupWorkTone;
  emailTone: CleanupEmailTone;
  overallTone: CleanupOverallTone;
  developerTone?: CleanupDeveloperTone;
}): boolean {
  return (
    tones.personalTone === "off" &&
    tones.workTone === "off" &&
    tones.emailTone === "off" &&
    tones.overallTone === "off" &&
    (tones.developerTone === undefined || tones.developerTone === "off")
  );
}

// ---------------------------------------------------------------------------
// App assignments — user overrides that route a specific app or website into a
// tone group. Consulted before the built-in match lists, so a user can pull
// Discord into "work", push a niche mail client into "email", etc. `match` is a
// lowercased token compared against the captured app name (kind "app") or the
// URL/window text (kind "site").
// ---------------------------------------------------------------------------

export const cleanupAppAssignmentSchema = z.object({
  // Lowercased here so the desktop client and the server enforce the same
  // invariant the runtime matcher relies on: rewrite-context lowercases both the
  // captured app name and the window/URL text before comparing against `match`.
  match: z.string().trim().toLowerCase().min(1).max(120),
  label: z.string().trim().min(1).max(120),
  kind: z.enum(["app", "site"]),
  destination: cleanupToneDestinationSchema,
});

export const cleanupAppAssignmentsSchema = z
  .array(cleanupAppAssignmentSchema)
  .max(200);

export type CleanupAppAssignment = z.infer<typeof cleanupAppAssignmentSchema>;

export function parseCleanupAppAssignments(
  value: string | null | undefined,
): CleanupAppAssignment[] {
  if (!value) return [];
  try {
    const result = cleanupAppAssignmentsSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}
