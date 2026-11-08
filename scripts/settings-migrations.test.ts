import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { migrateSettingsDocument, SETTINGS_VERSION } from "../src/settings/settingsMigrations";

// A v0.17.0 export: no version number and the retired approximation flag.
const legacy = { side: "stradella", soundNoteDurationMs: 420, progressionAllowApproximations: false };
const migrated = migrateSettingsDocument(legacy) as Record<string, unknown>;
assert.equal(migrated.settingsVersion, SETTINGS_VERSION);
assert.equal(migrated.side, "stradella", "unrelated keys pass through");
assert.equal(migrated.soundNoteDurationMs, 420);
assert.ok(!("progressionAllowApproximations" in migrated), "retired key dropped");
assert.ok(!("soundArticulation" in migrated), "missing new keys keep the built-in default");
assert.ok("progressionAllowApproximations" in legacy, "input is not mutated");

// A v0.18 export (version 2): the "select on click" switch is dropped
// because Selection is now a mode of Annotate Diagram.
const v018 = { settingsVersion: 2, selectionOnClick: true, sequenceThickness: 4 };
const fromV2 = migrateSettingsDocument(v018) as Record<string, unknown>;
assert.equal(fromV2.settingsVersion, SETTINGS_VERSION);
assert.ok(!("selectionOnClick" in fromV2), "retired selection switch dropped");
assert.equal(fromV2.sequenceThickness, 4, "unrelated keys pass through");
const legacyWithSelection = migrateSettingsDocument({ selectionOnClick: false, progressionAllowApproximations: true }) as Record<string, unknown>;
assert.deepEqual(legacyWithSelection, { settingsVersion: SETTINGS_VERSION }, "version 1 files run every step");

// Current and future files are left alone.
const current = { settingsVersion: SETTINGS_VERSION, soundArticulation: 0.7 };
assert.deepEqual(migrateSettingsDocument(current), current);
const future = { settingsVersion: SETTINGS_VERSION + 3, somethingNew: true };
assert.deepEqual(migrateSettingsDocument(future), future);

// Junk input yields an empty, versioned document instead of throwing.
for (const junk of [null, 7, "x", [1, 2]]) {
  assert.deepEqual(migrateSettingsDocument(junk), { settingsVersion: SETTINGS_VERSION });
}

// The shipped defaults file is already current, so migrating it changes nothing.
const defaults = JSON.parse(readFileSync("public/default-settings.json", "utf8"));
assert.equal(defaults.settingsVersion, SETTINGS_VERSION);
assert.deepEqual(migrateSettingsDocument(defaults), defaults);

console.log("✓ Settings migrations: legacy, current, future and malformed documents");
