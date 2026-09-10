/**
 * Freestyle Cloud connection settings. Mirrors the desktop app's
 * `apps/server/src/lib/freestyle-cloud.ts` so the mobile client talks to the
 * exact same managed backend (v2 routes) — no BYOK provider keys.
 */

import Constants from "expo-constants";

const DEFAULT_CLOUD_URL = "https://api.cadencevoice.com";

/**
 * Base URL for Cadence Cloud. Resolution order:
 *   1. `EXPO_PUBLIC_CLOUD_URL` env var (set in `.env.local` for local dev —
 *      point it at your machine's LAN IP, e.g. `http://192.168.1.20:8787`, so
 *      a physical device running Expo Go can reach a locally-run cloud).
 *   2. `extra.cadenceCloudUrl` or `extra.freestyleCloudUrl` in app config.
 *   3. Production (`https://api.cadencevoice.com`).
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
 * WebSocket URL for the v2 streaming STT endpoint. Converts `https` → `wss`
 * (and `http` → `ws` for local dev).
 */
export function cloudStreamWsUrl(): string {
  return `${cloudUrl().replace(/^http/, "ws")}/v2/stream`;
}
