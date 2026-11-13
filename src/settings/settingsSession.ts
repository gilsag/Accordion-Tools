import type { DefaultSettingsFile } from "./settingsSchema";
import { migrateSettingsDocument } from "./settingsMigrations";

/** The settings of the last session, kept in this browser.
 *
 * Precedence at startup: built-in defaults, then the bundled
 * default-settings.json, then this saved session. The stored document has
 * the same shape as an exported settings file, so it goes through the same
 * migrations and the same validating setters as an imported one.
 *
 * Storage can be unavailable (private browsing, quota, disabled cookies);
 * every function then degrades to "nothing saved". */
export const SAVED_SESSION_KEY = "accordionTools.session.v1";

/** Keys cleared by "Reset to defaults". Custom bass patterns are the user's
 * own data and panel widths are window layout, so both are kept. */
const RESET_KEYS = [SAVED_SESSION_KEY, "accordionTools.interfaceLanguage.v1"] as const;

export function readSavedSession(storage: Pick<Storage, "getItem"> | undefined = browserStorage()): DefaultSettingsFile | null {
  try {
    const raw = storage?.getItem(SAVED_SESSION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? migrateSettingsDocument(value) : null;
  } catch {
    return null;
  }
}

/** Serialized form used both for storage and for skipping unchanged writes. */
export function serializeSession(settings: DefaultSettingsFile): string {
  return JSON.stringify(settings);
}

export function writeSavedSession(serialized: string, storage: Pick<Storage, "setItem"> | undefined = browserStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(SAVED_SESSION_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearSavedSession(storage: Pick<Storage, "removeItem"> | undefined = browserStorage()): void {
  try {
    for (const key of RESET_KEYS) storage?.removeItem(key);
  } catch {
    /* Nothing to clear when storage is unavailable. */
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
