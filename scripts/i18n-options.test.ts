import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { abcExampleName, bassPatternName, progressionName } from "../src/i18n/optionLabels";
import { EN, SUPPORTED_LANGUAGES, translate, translateKnownLabel } from "../src/i18n/catalog";
import { CHORD_FINDER_OPTIONS } from "../src/music/chordDefinitions";
import { stradellaRowLabel } from "../src/stradella";
import { stradellaDiagramRowLabel } from "../src/i18n/musicTerms";

assert.equal(translate("es", "tools.searchBassRowsOnly"), "Solo filas de bajos");
assert.equal(translate("es", "tools.searchChordButtonsOnly"), "Solo botones de acordes");
assert.equal(translate("es", "tools.searchBassAndChordButtons"), "Bajos y botones de acordes");
assert.equal(translate("es", "ui.chooseExample"), "Elegir ejemplo…");
assert.equal(translate("es", "ui.bassPatternPlayer"), "Patrones de bajo");
assert.equal(translate("es", "ui.top"), "Arriba");
assert.equal(translate("es", "ui.bottom"), "Abajo");
assert.equal(translate("en", "ui.bassPatternPlayer"), "Bass Pattern Player");
assert.equal(translate("fr", "ui.bassPatternPlayer"), "Lecteur de motifs de basses");
assert.equal(progressionName("pop-rock", "Pop-rock progression", "fr"), "Progression pop-rock");
assert.equal(bassPatternName("oom-pah-pah", "Waltz", "fr"), "Valse");
assert.equal(abcExampleName("c-major-scale", "C major scale", "fr"), "Gamme de do majeur");
assert.equal(abcExampleName("c-major-scale", "User example", "fr"), "User example");

assert.equal(progressionName("pop-rock", "Pop-rock progression", "es"), "Progresión pop-rock");
assert.equal(progressionName("pop-rock", "Pop-rock progression", "en"), "Pop-rock progression");
assert.equal(progressionName("custom", "My progression", "es"), "My progression");
assert.equal(progressionName("pop-rock", "My progression", "es"), "My progression");
assert.equal(bassPatternName("oom-pah-pah", "Waltz", "es"), "Vals");
assert.equal(bassPatternName("custom", "My rhythm", "es"), "My rhythm");
assert.equal(abcExampleName("c-major-scale", "C major scale", "es"), "Escala de C mayor");
assert.equal(abcExampleName("bella-ciao", "Bella Ciao", "es"), "Bella Ciao");
assert.equal(abcExampleName("c-major-scale", "User example", "es"), "User example");

for (const row of ["bass-counterbass", "bass-root", "chord-major", "chord-minor", "chord-dominant7", "chord-diminished7"] as const) {
  const english = stradellaRowLabel(row);
  const spanish = translateKnownLabel("es", english);
  assert.notEqual(spanish, english, `Missing translation for Stradella row ${row}`);
  assert.equal(translateKnownLabel("en", english), english);
  assert.notEqual(stradellaDiagramRowLabel(row, english, "fr"), english);
  assert.equal(stradellaDiagramRowLabel(row, english, "en"), english);
  assert.notEqual(stradellaDiagramRowLabel(row, english, "es"), english);
}

const app = [readFileSync("src/App.tsx", "utf8"), readFileSync("src/app/useAppController.ts", "utf8"), readFileSync("src/app/views/SettingsView.tsx", "utf8"), readFileSync("src/app/views/ToolsView.tsx", "utf8"), readFileSync("src/app/views/WorkspaceView.tsx", "utf8")].join("\n");
const controllerOptions = readFileSync("src/app/controllerOptions.ts", "utf8");
const toolsView = readFileSync("src/app/views/ToolsView.tsx", "utf8");
const finder = readFileSync("src/components/tools/StradellaChordFinderPanel.tsx", "utf8");
const assistant = readFileSync("src/components/tools/ProgressionAssistantPanel.tsx", "utf8");
const css = readFileSync("src/App.css", "utf8");
// Search modes are translated through a conditional key selection inside t(...).
// Verify the option-to-key bindings, rather than requiring direct t("key") calls.
assert.match(finder, /\{t\(\s*option\.value\s*===\s*"bass-only"/);
assert.match(finder, /option\.value\s*===\s*"bass-only"\s*\?\s*"tools\.searchBassRowsOnly"/);
assert.match(finder, /option\.value\s*===\s*"chord-buttons-only"\s*\?\s*"tools\.searchChordButtonsOnly"/);
assert.match(finder, /:\s*"tools\.searchBassAndChordButtons"\s*\)\}/);
// Progression Assistant now shares all 35 Chord Finder chord types. Check
// canonical options and their actual translation function, not a removed
// Harmony-family rendering expression from an earlier implementation.
assert.equal(CHORD_FINDER_OPTIONS.length, 35);
const englishUiLabels = new Set(
  Object.entries(EN).filter(([key]) => key.startsWith("ui.")).map(([, value]) => value),
);
for (const { value, label } of CHORD_FINDER_OPTIONS) {
  assert.ok(englishUiLabels.has(label), `${value}: chord label missing from the English UI catalog`);
  for (const { code } of SUPPORTED_LANGUAGES) {
    assert.ok(translateKnownLabel(code, label).trim(), `${code}/${value}: empty localized chord type`);
  }
}
for (const [pattern, key] of [
  ["majorAdd9", "ui.majorAdd9"],
  ["dominant7b9", "ui.dominant7b9"],
  ["major13", "ui.major13"],
] as const) {
  const option = CHORD_FINDER_OPTIONS.find(({ value }) => value === pattern);
  assert.ok(option, `Missing shared chord type: ${pattern}`);
  for (const { code } of SUPPORTED_LANGUAGES) {
    assert.equal(translateKnownLabel(code, option.label), translate(code, key));
  }
}
// Keep a small wiring check: the menu must consume the shared catalog and
// localized labels, rather than just having a working translation helper.
assert.ok(assistant.includes("CHORD_FINDER_OPTIONS.map("), "Progression must use the shared Finder chord catalog");
assert.ok(assistant.includes("translateKnownLabel("), "Progression chord-type options must use shared label translation");
assert.ok(assistant.includes('t("tools.chordType")'), "Progression must reuse the shared Chord type label");
assert.match(app, /abcExampleName\(option.value, option.label, language\)/);
// The progression-option label was extracted from App into controllerOptions in the controller.
// Verify both the localized helper and its binding in the tools UI.
assert.match(controllerOptions, /const localizedName = progressionName\(progression.id, progression.name, language\)/);
assert.match(toolsView, /formatProgressionOptionLabel\(progression, language\)/);
assert.match(app, /stradellaDiagramRowLabel\(kind, stradellaRowLabel\(kind\), language\)/);
assert.match(app, /const bellowsStartLabel = side === "stradella" \? t\("ui.bottom"\) : t\("ui.top"\)/);
assert.match(app, /const bellowsEndLabel = side === "stradella" \? t\("ui.top"\) : t\("ui.bottom"\)/);
assert.match(css, /\.section-title\s*\{[^}]*text-align:\s*left/s);
console.log("Shared chord-type dropdown translations and tool-heading tests passed (six languages).");
