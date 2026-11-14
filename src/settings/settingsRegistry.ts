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
 * A shared link is shown over the saved session without replacing it
 * (`holdSession`): the session is stored again only once the settings differ
 * from what the link showed, that is, once the person changes something.
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
  /** Runs `callback` once startup has applied the defaults and the saved
   * session (at once if it already has). Returns a function that cancels it. */
  whenStarted(callback: () => void): () => void;
  /** Keeps the saved session as it is until the settings change after the
   * values now being applied have settled. */
  holdSession(): void;
}

type AnySlice = Record<string, unknown>;

export function createSettingsRegistry(): SettingsRegistry {
  const readers = new Map<SettingsOwnerId, () => AnySlice>();
  let ready = false;
  let lastSaved: string | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const startedCallbacks = new Set<() => void>();
  // While a shared view is held: null until the view has settled, then the
  // settings it showed. Saving resumes when the settings differ from it.
  let held: { shown: string | null } | null = null;

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
    if (held) {
      if (held.shown === null) held.shown = serialized;
      if (serialized === held.shown) return;
      held = null;
    }
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
        for (const callback of startedCallbacks) callback();
        startedCallbacks.clear();
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
    whenStarted(callback) {
      if (ready) {
        callback();
        return () => {};
      }
      startedCallbacks.add(callback);
      return () => startedCallbacks.delete(callback);
    },
    holdSession() {
      held = { shown: null };
    },
  };
}
