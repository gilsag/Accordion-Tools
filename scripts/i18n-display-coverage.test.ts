import assert from "node:assert/strict";
import { EN, ES, FR, PT, IT, DE, translateKnownLabel, type TranslationKey } from "../src/i18n/catalog";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { explainStradellaRealization } from "../src/tools/stradellaChordFinder/explainRealization";
import { describeTrebleChord } from "../src/tools/trebleChordExplanation";
import { buildDiagramExplanation } from "../src/tools/harmonyExplorer/explanation";
import { familyName, scaleName } from "../src/i18n/musicTerms";

const keys = Object.keys(EN) as TranslationKey[];
assert.ok(keys.length > 400, "Expected a broad interface vocabulary");
for (const [language, catalog] of [["Spanish", ES], ["French", FR], ["Portuguese", PT], ["Italian", IT], ["German", DE]] as const) {
  assert.deepEqual(keys.filter((key) => !catalog[key]?.trim()), [], `${language} catalog must be complete`);
}
for (const key of keys) {
  // Parameterized strings must use the same placeholders in every language.
  const english = [...EN[key].matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((m) => m[1]).sort();
  for (const catalog of [ES, FR, PT, IT, DE]) {
    const translated = [...catalog[key].matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(translated, english, `Interpolation mismatch: ${key}`);
  }
}
assert.equal(translateKnownLabel("es", "Major scale"), "Escala mayor");
assert.equal(translateKnownLabel("fr", "Major scale"), "Gamme majeure");
assert.equal(familyName("major7", "Major seventh", "fr"), "septième majeure");
assert.equal(scaleName("dorian", "Dorian", "fr"), "dorien");
assert.equal(translateKnownLabel("en", "Major scale"), "Major scale");
assert.equal(translateKnownLabel("es", "C♯ / D♭"), "C♯ / D♭", "Pitch labels must be unaffected");
assert.equal(familyName("major7", "Major seventh", "es"), "séptima mayor");
assert.equal(scaleName("dorian", "Dorian", "es"), "dórico");

const buttons = generateStradella("96", 38, 1.18, "natural");
const playable = getStradellaChordFinderResults(buttons, "C", "major13", "bass-and-chords", false, 4, 5.5, null, DEFAULT_STRADELLA_REGISTER_MODEL).find((candidate) => candidate.playable);
assert.ok(playable, "Expected at least one 96-bass Cmaj13 realization");
const en = realizationAnnotation("C", "major13", playable, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", "en");
const es = realizationAnnotation("C", "major13", playable, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", "es");
assert.equal(es.filenameKey, en.filenameKey, "Interface language must never modify download filenames");
assert.equal(es.title, en.title, "Canonical contextual title should retain its musical spelling");
assert.equal(es.lines.length, en.lines.length);
assert.ok(es.lines.some((line) => line.startsWith("Identidad armónica:")));
assert.ok(es.lines.some((line) => line.startsWith("Realización por clases de altura:")));
assert.ok(es.lines.some((line) => line.startsWith("Disposición registral:")));
assert.ok(es.lines.some((line) => line.startsWith("Realización física:")));
const fr = realizationAnnotation("C", "major13", playable, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", "fr");
assert.equal(fr.filenameKey, en.filenameKey, "French interface must preserve canonical filenames");
assert.ok(fr.lines.some((line) => line.startsWith("Identité harmonique:")));
assert.ok(fr.lines.some((line) => line.startsWith("Disposition des registres:")));
const frDetails = explainStradellaRealization("C", "major13", playable, "bass-and-chords", DEFAULT_STRADELLA_REGISTER_MODEL, null, "letter", "fr");
assert.match(frDetails, /utilise/);
assert.doesNotMatch(frDetails, /Why recommended|Identidad armónica/);
const esDetails = explainStradellaRealization("C", "major13", playable, "bass-and-chords", DEFAULT_STRADELLA_REGISTER_MODEL, null, "letter", "es");
assert.match(esDetails, /utiliza/);
assert.match(esDetails, /Identidad armónica/);
assert.ok(!esDetails.includes("Why Recommended"));
const trebleFr = describeTrebleChord([], "C", "major-triad", "auto", "fr");
assert.equal(trebleFr.status, "Aucun bouton correspondant");
const treble = describeTrebleChord([], "C", "major-triad", "auto", "es");
assert.equal(treble.status, "No se encontraron botones");
const relation = {
  referenceFamilyName: "tríada mayor", relatedFamilyName: "séptima menor", scaleName: "jónico (mayor)",
  diatonicOnly: true, highlightDiatonic: false, allFamiliesMode: false,
  counts: [1, 2], availableCounts: [1, 2], allCounts: [0, 1, 2],
};
const explanationEs = buildDiagramExplanation({ ...relation, language: "es" });
const explanationEn = buildDiagramExplanation({ ...relation, language: "en" });
assert.match(explanationEs, /anillo interior/);
assert.match(explanationEs, /diatónicos/);
assert.match(explanationEn, /inner ring/);
const explanationFr = buildDiagramExplanation({ ...relation, referenceFamilyName: "triade majeure", relatedFamilyName: "septième mineure", scaleName: "ionien (majeur)", language: "fr" });
assert.match(explanationFr, /anneau intérieur/);
assert.match(explanationFr, /diatoniques/);
console.log("✓ All six catalog coverages, Finder/Harmony explanations, and language-neutral filenames passed");
