/** The saved session: what is stored, what is read back, and how every
 * storage failure degrades to "nothing saved". */
import assert from "node:assert/strict";
import { SAVED_SESSION_KEY, clearSavedSession, readSavedSession, serializeSession, writeSavedSession } from "../../../src/settings/settingsSession";
import { SETTINGS_VERSION } from "../../../src/settings/settingsMigrations";
import { test } from "vitest";

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
    removeItem: (key: string) => { items.delete(key); },
  };
}
// Round trip.
const storage = memoryStorage();

test("Round trip", () => {
  assert.equal(readSavedSession(storage), null, "nothing saved yet");
  assert.equal(writeSavedSession(serializeSession({ settingsVersion: SETTINGS_VERSION, basses: "72" }), storage), true);
  assert.equal(readSavedSession(storage)?.basses, "72");
});

test("A session written by an older release goes through the settings migrations", () => {
  const legacy = memoryStorage({ [SAVED_SESSION_KEY]: JSON.stringify({ soundNoteDurationMs: 600, selectionOnClick: true }) });
  const migrated = readSavedSession(legacy) as Record<string, unknown>;
  assert.equal(migrated.settingsVersion, SETTINGS_VERSION);
  assert.ok(!("selectionOnClick" in migrated), "retired keys are dropped like in an imported file");
});

test("Damaged or foreign content is ignored, never thrown", () => {
  for (const raw of ["not json", "[1,2]", "null", '"text"', ""]) {
    assert.equal(readSavedSession(memoryStorage({ [SAVED_SESSION_KEY]: raw })), null, `ignored: ${raw}`);
  }
});

test("Unavailable storage (private browsing, quota) degrades quietly", () => {
  const broken = {
    getItem: () => { throw new Error("denied"); },
    setItem: () => { throw new Error("quota"); },
    removeItem: () => { throw new Error("denied"); },
  };
  assert.equal(readSavedSession(broken), null);
  assert.equal(writeSavedSession("{}", broken), false);
  assert.doesNotThrow(() => clearSavedSession(broken));
});

test("Reset forgets the session and the language, and keeps the user's own data", () => {
  const full = memoryStorage({
    [SAVED_SESSION_KEY]: "{}",
    "accordionTools.interfaceLanguage.v1": "fr",
    "accordionTools.customBassPatterns.v2": "[]",
  });
  clearSavedSession(full);
  assert.deepEqual([...full.items.keys()], ["accordionTools.customBassPatterns.v2"]);
});
