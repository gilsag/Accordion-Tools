import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { abcExampleName, bassPatternName, progressionName } from "../src/i18n/optionLabels";
import { translate, translateKnownLabel } from "../src/i18n/catalog";
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

const app = readFileSync("src/App.tsx", "utf8");
const finder = readFileSync("src/components/tools/StradellaChordFinderPanel.tsx", "utf8");
const assistant = readFileSync("src/components/tools/ProgressionAssistantPanel.tsx", "utf8");
const css = readFileSync("src/App.css", "utf8");
// Search modes are translated through a conditional key selection inside t(...).
// Verify the option-to-key bindings, rather than requiring direct t("key") calls.
assert.match(finder, /\{t\(\s*option\.value\s*===\s*"bass-only"/);
assert.match(finder, /option\.value\s*===\s*"bass-only"\s*\?\s*"tools\.searchBassRowsOnly"/);
assert.match(finder, /option\.value\s*===\s*"chord-buttons-only"\s*\?\s*"tools\.searchChordButtonsOnly"/);
assert.match(finder, /:\s*"tools\.searchBassAndChordButtons"\s*\)\}/);
assert.match(assistant, /familyName\(family.id, family.name, language\)/);
assert.match(app, /abcExampleName\(option.value, option.label, language\)/);
assert.match(app, /progressionName\(progression.id, progression.name, language\)/);
assert.match(app, /stradellaDiagramRowLabel\(kind, stradellaRowLabel\(kind\), language\)/);
assert.match(app, /const bellowsStartLabel = side === "stradella" \? t\("ui.bottom"\) : t\("ui.top"\)/);
assert.match(app, /const bellowsEndLabel = side === "stradella" \? t\("ui.top"\) : t\("ui.bottom"\)/);
assert.match(css, /\.section-title\s*\{[^}]*text-align:\s*left/s);
console.log("Dropdown translation and left-aligned tool heading tests passed.");
