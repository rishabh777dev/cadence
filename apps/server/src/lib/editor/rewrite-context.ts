import type {
  CleanupAppAssignment,
  CleanupToneDestination,
} from "@cadence-voice/validations";
import { parseAppContextPayload } from "./app-context.js";
import { CLEANUP_ROUTING, getCleanupPromptConfig } from "./prompt-config.js";

export interface RewritePromptContext {
  destination: CleanupToneDestination;
  personalSurface: "discord" | null;
}

export function buildMatchContext(rawContext: string | null): string {
  if (!rawContext) return "";

  const ctx = parseAppContextPayload(rawContext);
  if (!ctx) return rawContext;

  const parts: string[] = [];
  if (ctx.url) parts.push(ctx.url);
  if (ctx.title) parts.push(ctx.title);
  if (ctx.windowTitle) parts.push(ctx.windowTitle);
  if (ctx.app) parts.push(ctx.app);
  return parts.join(" ");
}

function matchesAny(matchText: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchText.includes(pattern));
}

function normalizeAppName(appName: string | undefined): string {
  return appName?.trim().toLowerCase() ?? "";
}

/**
 * Find a user assignment that routes this context into a group. App-kind
 * assignments must match the frontmost app name exactly; site-kind assignments
 * match anywhere in the URL/window text. App matches are checked first so a
 * precise native-app rule wins over a looser site substring.
 */
function matchUserAssignment(
  assignments: readonly CleanupAppAssignment[],
  appName: string,
  matchText: string,
): CleanupToneDestination | null {
  for (let index = assignments.length - 1; index >= 0; index -= 1) {
    const a = assignments[index]!;
    if (a.kind === "app" && appName && appName === a.match) {
      return a.destination;
    }
  }
  for (let index = assignments.length - 1; index >= 0; index -= 1) {
    const a = assignments[index]!;
    if (a.kind === "site" && matchText.includes(a.match)) {
      return a.destination;
    }
  }
  return null;
}

export function getRewritePromptContext(
  rawContext: string | null,
  assignments: readonly CleanupAppAssignment[] = [],
): RewritePromptContext {
  if (!rawContext) {
    return { destination: "overall", personalSurface: null };
  }

  const routing = getCleanupPromptConfig().routing;
  const developerAppNames =
    routing?.developerAppNames ?? CLEANUP_ROUTING.developerAppNames;
  const developerPatterns =
    routing?.developerPatterns ?? CLEANUP_ROUTING.developerPatterns;
  const emailAppNames = routing?.emailAppNames ?? CLEANUP_ROUTING.emailAppNames;
  const emailPatterns = routing?.emailPatterns ?? CLEANUP_ROUTING.emailPatterns;
  const workAppNames = routing?.workAppNames ?? CLEANUP_ROUTING.workAppNames;
  const workPatterns = routing?.workPatterns ?? CLEANUP_ROUTING.workPatterns;
  const personalAppNames =
    routing?.personalAppNames ?? CLEANUP_ROUTING.personalAppNames;
  const personalPatterns =
    routing?.personalPatterns ?? CLEANUP_ROUTING.personalPatterns;
  const discordPatterns =
    routing?.discordPatterns ?? CLEANUP_ROUTING.discordPatterns;

  const ctx = parseAppContextPayload(rawContext);
  const appName = normalizeAppName(ctx?.app);
  const matchText = buildMatchContext(rawContext).toLowerCase();
  const personalSurface =
    matchesAny(appName, discordPatterns) ||
    matchesAny(matchText, discordPatterns)
      ? "discord"
      : null;

  // User assignments override the built-in routing so people can pull an app
  // into whichever group they prefer.
  const assigned = matchUserAssignment(assignments, appName, matchText);
  if (assigned) {
    return {
      destination: assigned,
      personalSurface: assigned === "personal" ? personalSurface : null,
    };
  }

  if (developerAppNames.includes(appName)) {
    return { destination: "developer", personalSurface: null };
  }
  if (emailAppNames.includes(appName)) {
    return { destination: "email", personalSurface: null };
  }
  if (workAppNames.includes(appName)) {
    return { destination: "work", personalSurface: null };
  }
  if (personalAppNames.includes(appName)) {
    return { destination: "personal", personalSurface };
  }

  if (!matchText) return { destination: "overall", personalSurface: null };

  if (matchesAny(matchText, developerPatterns)) {
    return { destination: "developer", personalSurface: null };
  }
  if (matchesAny(matchText, emailPatterns)) {
    return { destination: "email", personalSurface: null };
  }
  if (matchesAny(matchText, workPatterns)) {
    return { destination: "work", personalSurface: null };
  }
  if (matchesAny(matchText, personalPatterns)) {
    return { destination: "personal", personalSurface };
  }

  return { destination: "overall", personalSurface: null };
}
