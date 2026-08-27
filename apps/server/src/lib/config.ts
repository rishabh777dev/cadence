/**
 * Freestyle config file — `config.freestyle.json` in the same directory as the
 * SQLite database (userData). Stores experimental feature flags and other
 * non-settings configuration that doesn't belong in the DB.
 *
 * Versioned schema — bump `CONFIG_VERSION` when the shape changes. The loader
 * migrates from older versions automatically.
 *
 * Shape (v1):
 * ```json
 * {
 *   "version": 1,
 *   "flags": {
 *     "streaming_audio": true
 *   }
 * }
 * ```
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createAppLogger } from "@cadence-voice/utils";
import { z } from "zod";

const log = createAppLogger("config");

const CADENCE_CONFIG_FILENAME = "config.cadence.json";
const LEGACY_CONFIG_FILENAME = "config.freestyle.json";
const CONFIG_FILENAME = CADENCE_CONFIG_FILENAME;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const CONFIG_VERSION = 1;

export const cadenceConfigSchema = z.object({
  version: z.number().int().min(1),
  flags: z.record(z.string(), z.boolean()).default({}),
});

export type CadenceConfig = z.infer<typeof cadenceConfigSchema>;
export const freestyleConfigSchema = cadenceConfigSchema;
export type FreestyleConfig = CadenceConfig;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let cachedConfig: CadenceConfig | null = null;
let configPath: string | null = null;

function resolveConfigPath(): string | null {
  if (configPath) return configPath;
  const dbPath = process.env.CADENCE_DB_PATH || process.env.FREESTYLE_DB_PATH;
  if (!dbPath) return null;
  const dir = dirname(dbPath);
  const cadenceFile = join(dir, CADENCE_CONFIG_FILENAME);
  const legacyFile = join(dir, LEGACY_CONFIG_FILENAME);
  if (existsSync(cadenceFile)) {
    configPath = cadenceFile;
  } else if (existsSync(legacyFile)) {
    configPath = legacyFile;
  } else {
    configPath = cadenceFile;
  }
  return configPath;
}

function defaultConfig(): CadenceConfig {
  return { version: CONFIG_VERSION, flags: {} };
}

/**
 * Migrate a config object from an older version to the current one.
 * Add migration steps here as CONFIG_VERSION grows.
 */
function migrate(config: FreestyleConfig): FreestyleConfig {
  // v1 is the initial version — nothing to migrate yet.
  // Future: if (config.version < 2) { ... config.version = 2; }
  return config;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Load the config file from disk (or return the cached copy). */
export function loadConfig(): FreestyleConfig {
  if (cachedConfig) return cachedConfig;

  const path = resolveConfigPath();
  if (!path) {
    cachedConfig = defaultConfig();
    return cachedConfig;
  }

  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = freestyleConfigSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      cachedConfig = migrate(parsed.data);
    } else {
      log.warn(`Invalid ${CONFIG_FILENAME}, resetting to defaults`);
      cachedConfig = defaultConfig();
    }
  } catch {
    // File doesn't exist yet or is malformed — start fresh.
    cachedConfig = defaultConfig();
  }
  return cachedConfig;
}

/** Persist the current config to disk. */
export function saveConfig(config: FreestyleConfig): void {
  const path = resolveConfigPath();
  if (!path) return;

  cachedConfig = config;
  try {
    writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
  } catch (err) {
    log.error(
      `Failed to write ${CONFIG_FILENAME}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** Read a single flag (defaults to `false` if unset). */
export function getFlag(key: string): boolean {
  return loadConfig().flags[key] === true;
}

/** Set a flag and persist to disk. */
export function setFlag(key: string, value: boolean): void {
  const config = loadConfig();
  config.flags[key] = value;
  saveConfig(config);
}

/** Return the full config object (clone). */
export function getConfig(): FreestyleConfig {
  const config = loadConfig();
  return { ...config, flags: { ...config.flags } };
}

/** Replace the full config and persist. */
export function updateConfig(incoming: FreestyleConfig): void {
  saveConfig({ ...incoming, version: CONFIG_VERSION });
}
