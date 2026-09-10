/**
 * Freestyle Cloud connection settings. Mirrors the desktop app's
 * `apps/server/src/lib/freestyle-cloud.ts` so the mobile client talks to the
 * exact same managed backend (v2 routes) — no BYOK provider keys.
 */

import Constants from "expo-constants";

const DEFAULT_CLOUD_URL = "https://service.freestylevoice.com";
const DEFAULT_SERVER_URL = "https://cadence-server-5059.onrender.com";

/**
 * Base URL for Cadence / Freestyle Cloud (better-auth, user accounts, credits).
 * Resolution order:
 *   1. `EXPO_PUBLIC_CLOUD_URL` env var.
 *   2. `extra.cadenceCloudUrl` or `extra.freestyleCloudUrl` in app config.
 *   3. Production (`https://service.freestylevoice.com`).
 */
export function cloudUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_CLOUD_URL;
  const extra = Constants.expoConfig?.extra as
    | { cadenceCloudUrl?: string; freestyleCloudUrl?: string }
    | undefined;
  const fromConfig = extra?.cadenceCloudUrl ?? extra?.freestyleCloudUrl;
  return (fromEnv || fromConfig || DEFAULT_CLOUD_URL).replace(/\/+$/, "");
}

/** Base URL for the better-auth endpoints (mounted under `/auth`). */
export function cloudAuthUrl(): string {
  return `${cloudUrl()}/auth`;
}

/**
 * Base URL for the dedicated Cadence Server deployed on Render
 * (BYOK keys, model registry, local data sync).
 */
export function cadenceServerUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SERVER_URL;
  return (fromEnv || DEFAULT_SERVER_URL).replace(/\/+$/, "");
}

/**
 * WebSocket URL for the streaming STT endpoint. Converts `https` → `wss`
 * (and `http` → `ws` for local dev).
 * If a customBaseUrl is provided (e.g. Render server for BYOK), routes to that.
 */
export function cloudStreamWsUrl(customBaseUrl?: string): string {
  const base = customBaseUrl || cloudUrl();
  return `${base.replace(/^http/, "ws")}/v2/stream`;
}
