/** Collects settings from their owners for files, imports and the saved
 * session.
 *
 * Owners register a slice (their values and setters, see `settingsOwners.ts`)
 * and report when their values change. The registry runs the startup
 * sequence once every owner is registered: built-in defaults, then the
 * bundled default-settings.json, then the saved session. It stores the
 * session half a second after the last change, and never before startup has
 * finished, so a slow defaults file cannot replace the saved session.
 *
 * Validation, aliases, migrations and the exported key order stay in
 * `settingsController.ts`; this module only gathers what those functions
 * need. */
import type { DefaultSettingsFile } from "./settingsSchema";
import {
  applyImportedSettings,
  applyStartupSettings,
  collectCurrentSettings,
  type SettingsExportSnapshot,
  type SettingsSetters,
} from "./settingsController";
import { fetchDefaultSettingsDocument } from "./settingsPersistence";
import {
  clearSavedSession,
  readSavedSession,
  serializeSession,
  writeSavedSession,
} from "./settingsSession";
import {
  SETTINGS_OWNER_IDS,
  ownedKeys,
  setterName,
  type OwnedSettings,
  type SettingsOwnerId,
} from "./settingsOwners";

/** Quiet period after the last change before the session is stored. */
export const SESSION_SAVE_DELAY_MS = 500;

export interface SettingsRegistry {
  /** Registers an owner's slice; `read` returns its current values and
   * setters. Returns the function that unregisters it. */
  register<O extends SettingsOwnerId>(owner: O, read: () => OwnedSettings<O>): () => void;
  /** Called by an owner when one of its values changed. */
  changed(): void;
  /** Runs the startup sequence. Returns a function that cancels it. */
  start(defaultsUrl: string): () => void;
  /** The current settings as a settings document, in the frozen key order. */
  collect(): DefaultSettingsFile;
  /** Applies the valid fields of an imported or restored document. */
  applyImported(settings: DefaultSettingsFile): void;
  /** Owners that are not registered; empty in a correctly composed app. */
  missingOwners(): SettingsOwnerId[];
  /** Stops saving and forgets the saved session (the caller then reloads). */
  forgetSession(): void;
}

type AnySlice = Record<string, unknown>;

export function createSettingsRegistry(): SettingsRegistry {
  const readers = new Map<SettingsOwnerId, () => AnySlice>();
  let ready = false;
  let lastSaved: string | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  function missingOwners() {
    return SETTINGS_OWNER_IDS.filter((owner) => !readers.has(owner));
  }

  function merged() {
    const missing = missingOwners();
    if (missing.length > 0) {
      throw new Error(`Settings owners not registered: ${missing.join(", ")}.`);
    }
    const snapshot: AnySlice = {};
    const setters: AnySlice = {};
    for (const [owner, read] of readers) {
      const slice = read();
      for (const key of ownedKeys(owner)) {
        snapshot[key] = slice[key];
        setters[setterName(key)] = slice[setterName(key)];
      }
      if (owner === "language") setters.changeLanguage = slice.changeLanguage;
    }
    return {
      snapshot: snapshot as SettingsExportSnapshot,
      setters: setters as unknown as SettingsSetters,
    };
  }

  function collect() {
    return collectCurrentSettings(merged().snapshot);
  }

  function save() {
    const serialized = serializeSession(collect());
    if (serialized === lastSaved) return;
    if (writeSavedSession(serialized)) lastSaved = serialized;
  }

  function scheduleSave() {
    if (!ready) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, SESSION_SAVE_DELAY_MS);
  }

  return {
    register(owner, read) {
      readers.set(owner, read as unknown as () => AnySlice);
      return () => {
        if (readers.get(owner) === (read as unknown)) readers.delete(owner);
      };
    },
    changed: scheduleSave,
    start(defaultsUrl) {
      let cancelled = false;
      void (async () => {
        let defaults: Awaited<ReturnType<typeof fetchDefaultSettingsDocument>> | undefined;
        try {
          defaults = await fetchDefaultSettingsDocument(defaultsUrl);
        } catch {
          /* The app still runs with built-in defaults if the editable file is missing or invalid. */
        }
        if (cancelled) return;
        // A missing owner is a programming error. Loading or saving a partial
        // document could overwrite the player's saved session, so do neither.
        const missing = missingOwners();
        if (missing.length > 0) {
          console.error(
            `Settings owners not registered: ${missing.join(", ")}. Settings are neither loaded nor saved.`,
          );
          return;
        }
        const { setters } = merged();
        try {
          if (defaults && typeof defaults === "object") applyStartupSettings(defaults, setters);
        } catch {
          /* As above: an unusable defaults file leaves the built-in defaults. */
        }
        // The previous session overrides the bundled defaults. It is applied
        // like an imported file: only valid fields take effect.
        const saved = readSavedSession();
        if (saved) {
          try {
            applyImportedSettings(saved, setters);
          } catch {
            clearSavedSession();
          }
        }
        ready = true;
        scheduleSave();
      })();
      return () => {
        cancelled = true;
        clearTimeout(saveTimer);
      };
    },
    collect,
    applyImported(settings) {
      applyImportedSettings(settings, merged().setters);
    },
    missingOwners,
    forgetSession() {
      ready = false;
      clearTimeout(saveTimer);
      clearSavedSession();
    },
  };
}
