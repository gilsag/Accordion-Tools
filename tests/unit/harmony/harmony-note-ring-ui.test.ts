import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDiagramExplanation } from "../../../src/tools/harmonyExplorer/explanation";
import { SUPPORTED_LANGUAGES, EN, ES, FR, PT, IT, DE } from "../../../src/i18n/allCatalogs";
import { test } from "vitest";

const inputs = {
  referenceFamilyName: "Major",
  relatedFamilyName: "minor",
  scaleName: "Ionian",
  diatonicOnly: false,
  highlightDiatonic: true,
  allFamiliesMode: false,
  counts: [2, 1],
  availableCounts: [2, 1],
  allCounts: [2, 1],
};
const catalogs = { en: EN, es: ES, fr: FR, pt: PT, it: IT, de: DE };

test("The explanation mentions the note ring only when it is shown, in every language", () => {
  for (const { code } of SUPPORTED_LANGUAGES) {
    const on = buildDiagramExplanation({ ...inputs, language: code, showNoteRing: true });
    const off = buildDiagramExplanation({ ...inputs, language: code, showNoteRing: false });
    const defaultText = buildDiagramExplanation({ ...inputs, language: code });
    assert.ok(on.includes(catalogs[code]["analysis.harmonyNoteRing"]), `${code}: missing note-ring explanation`);
    assert.ok(!off.includes(catalogs[code]["analysis.harmonyNoteRing"]), `${code}: explanation present when hidden`);
    assert.equal(defaultText, off, `${code}: legacy API should keep unchanged behavior`);
    assert.ok(catalogs[code]["ui.noteRingLegendTitle"]);
    assert.ok(catalogs[code]["ui.noteRingLegendDetail"]);
    assert.ok(catalogs[code]["ui.referenceChordRing"]);
    const allFamilies = buildDiagramExplanation({ ...inputs, language: code, allFamiliesMode: true, showNoteRing: true });
    assert.ok(allFamilies.includes(catalogs[code]["analysis.harmonyNoteRing"]), `${code}: all families`);
  }
});

test("Settings import/serialization contracts live in the settings controller", () => {
  const settings = JSON.parse(readFileSync("public/default-settings.json", "utf8"));
  assert.equal(settings.harmonyShowNoteRing, true);
  assert.equal(settings.stradellaShowNominalNoteSpacing, true);
});
