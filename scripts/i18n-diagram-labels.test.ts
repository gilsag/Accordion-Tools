import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHORD_FAMILIES, SCALES } from "../src/tools/harmonyExplorer/music";
import { translate } from "../src/i18n/catalog";
import {
  accordionStatusText, diagramAutoTitle, harmonyLegendFamilyText, harmonyRelatedDisplayName,
  harmonyStatusText, notationStatusLabel, pianoRangeStatusLabel, trebleLayoutStatusLabel,
} from "../src/i18n/diagramLabels";
import { familyName, scaleName } from "../src/i18n/musicTerms";

// The examples reported in the UI, tested as actual formatted output in both languages.
assert.equal(diagramAutoTitle("stradella", 96, "c-system", "en"), "96-Bass Stradella");
assert.equal(diagramAutoTitle("stradella", 96, "c-system", "es"), "Stradella de 96 bajos");
assert.equal(diagramAutoTitle("treble", 96, "c-system", "en"), "C-system Treble");
assert.equal(diagramAutoTitle("treble", 96, "c-system", "es"), "Agudos · Sistema C");
assert.equal(diagramAutoTitle("treble", 96, "b-system", "en"), "B-system / Bayan Treble");
assert.equal(diagramAutoTitle("treble", 96, "b-system", "es"), "Agudos · Sistema B / bayán");
assert.equal(diagramAutoTitle("treble", 96, "piano", "es"), "Agudos de piano");

const common = { basses: 96, trebleLayout: "c-system" as const, pianoRange: "three-octave" as const,
  trebleRows: 5, notation: "english" as const, soundEnabled: true };
assert.equal(accordionStatusText({ ...common, side: "stradella", activeTool: "No active tool", language: "en" }),
  "Stradella · 96 bass · English notation · Sound on · No active tool");
assert.equal(accordionStatusText({ ...common, side: "stradella", activeTool: "Ninguna herramienta activa", language: "es" }),
  "Stradella · 96 bajos · notación inglesa · Sonido activado · Ninguna herramienta activa");
assert.equal(accordionStatusText({ ...common, side: "treble", activeTool: "Ninguna herramienta activa", language: "es" }),
  "Agudos · Sistema C · 5 filas · notación inglesa · Sonido activado · Ninguna herramienta activa");
assert.equal(accordionStatusText({ ...common, side: "treble", trebleLayout: "piano", activeTool: "Ninguna herramienta activa", language: "es" }),
  "Agudos · Piano · tres octavas, C3–C6 · notación inglesa · Sonido activado · Ninguna herramienta activa");
assert.equal(harmonyStatusText({ referenceFamilyId: "major", referenceFamilyEnglishName: "Major triad",
  relatedFamilyId: "minor7", relatedFamilyEnglishName: "Minor seventh", scaleId: "ionian", scaleEnglishName: "Ionian (Major)",
  soundEnabled: true, language: "es" }),
  "Armonía · tríada mayor → séptima menor · jónico (mayor) · Sonido activado");
assert.equal(harmonyStatusText({ referenceFamilyId: "major", referenceFamilyEnglishName: "Major triad",
  relatedFamilyId: "minor7", relatedFamilyEnglishName: "Minor seventh", scaleId: "ionian", scaleEnglishName: "Ionian (Major)",
  soundEnabled: true, language: "en" }),
  "Harmony · Major triad → Minor seventh · Ionian (Major) · Sound on");
assert.equal(harmonyRelatedDisplayName("minor7", "Minor seventh", "es"), "séptima menor");
assert.equal(harmonyLegendFamilyText(harmonyRelatedDisplayName("minor7", "Minor seventh", "es"), "es", false, false), "séptima menor");
assert.equal(harmonyLegendFamilyText("séptima menor", "es", true, false), "Acordes diatónicos: séptima menor");
assert.equal(harmonyLegendFamilyText("Minor seventh", "en", true, false), "Diatonic minor seventh");
assert.equal(harmonyLegendFamilyText("ignored", "es", true, true), "Acordes diatónicos (todas las familias)");

for (const language of ["en", "es"] as const) {
  for (const notation of ["english", "german", "solfege", "intervals", "blank"] as const) {
    const name = notationStatusLabel(notation, language);
    assert.ok(name && !name.startsWith("status."), `${language}/${notation}: untranslated notation`);
  }
  for (const layout of ["c-system", "b-system", "piano"] as const) {
    assert.ok(trebleLayoutStatusLabel(layout, language));
    assert.ok(diagramAutoTitle("treble", 96, layout, language));
  }
  for (const range of ["two-octave", "three-octave", "four-octave"] as const) {
    assert.ok(pianoRangeStatusLabel(range, language));
  }
  for (const family of CHORD_FAMILIES) {
    const displayed = familyName(family.id, family.name, language);
    assert.ok(displayed && !displayed.startsWith("ui."));
    assert.equal(harmonyRelatedDisplayName(family.id, family.name, language), displayed);
  }
  for (const scale of SCALES) {
    assert.ok(scaleName(scale.id, scale.name, language));
  }
}

// Source bindings: reject a correctly implemented helper that the UI forgets to call.
const app = readFileSync("src/App.tsx", "utf8");
const circle = readFileSync("src/tools/harmonyExplorer/components/HarmonicCircle.tsx", "utf8");
for (const binding of [
  "const statusBarText = accordionStatusText(",
  "harmonyStatusText({",
  "pianoRangeStatusLabel(option.value, language)",
  "relatedFamilyName={harmonyRelatedDisplayName(",
  "titleMode === \"auto\" ? localizedAutoTitle()",
  "return localizedAutoTitle();",
  "const rawName =",
  "? autoTitle()",
]) {
  assert.ok(app.includes(binding), `Missing UI or filename binding: ${binding}`);
}
assert.match(app, /if \(side === "stradella"\) return `\$\{basses\}-Bass Stradella`;/,
  "Keep pre-existing automatic title for exported filenames");
assert.ok(circle.includes("harmonyLegendFamilyText(relatedFamilyName, language, diatonicOnly, allFamiliesMode)"));
assert.ok(circle.includes("const referenceName = familyName(referenceFamilyId, referenceFamily.name, language);"),
  "Measure localized reference legend text, not English width");
assert.equal(translate("es", "ui.diatonicFamily", { family: "séptima menor" }), "Acordes diatónicos: séptima menor");
console.log("✓ Localized titles, status summaries, Harmony legends and unchanged filename policy passed (both languages)");
