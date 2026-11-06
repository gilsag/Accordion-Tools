import type { DefaultSettingsFile } from "./settingsSchema";

/**
 * Version of the settings JSON this build writes. Files without a
 * `settingsVersion` field are version 1: everything exported up to v0.17.0.
 *
 * To change the settings format: bump SETTINGS_VERSION, add a step to
 * MIGRATIONS that turns a version N document into version N + 1, and update
 * collectCurrentSettings(). Old files keep importing because every step runs
 * in order; keys a step does not mention pass through untouched.
 */
export const SETTINGS_VERSION = 2;

type SettingsDocument = Record<string, unknown>;

const MIGRATIONS: Record<number, (document: SettingsDocument) => SettingsDocument> = {
  // 1 → 2: `progressionAllowApproximations` was retired from the interface and
  // no longer affects the optimizer, so it is dropped. `soundArticulation` is
  // new in version 2; files without it keep the built-in default (0.85).
  1: (document) => {
    const next = { ...document };
    delete next.progressionAllowApproximations;
    return next;
  },
};

/**
 * Brings a settings document of any earlier version up to SETTINGS_VERSION.
 * A document from a newer build is passed through unchanged: its known keys
 * still validate and unknown ones are ignored.
 */
export function migrateSettingsDocument(input: unknown): DefaultSettingsFile {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { settingsVersion: SETTINGS_VERSION };
  let document: SettingsDocument = { ...(input as SettingsDocument) };
  const declared = document.settingsVersion;
  let version = typeof declared === "number" && Number.isInteger(declared) && declared >= 1 ? declared : 1;
  while (version < SETTINGS_VERSION) {
    document = MIGRATIONS[version](document);
    version += 1;
  }
  document.settingsVersion = Math.max(version, SETTINGS_VERSION);
  return document as DefaultSettingsFile;
}
