import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EN, ES, FR, SUPPORTED_LANGUAGES, detectBrowserLanguage, translate } from "../src/i18n/catalog";
import { generateStradella } from "../src/stradella";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { explainStradellaRealization } from "../src/tools/stradellaChordFinder/explainRealization";
import { buildDiagramExplanation } from "../src/tools/harmonyExplorer/explanation";
import { abcExampleName, bassPatternName } from "../src/i18n/optionLabels";

assert.deepEqual(SUPPORTED_LANGUAGES.map(({ code }) => code), ["en", "es", "fr", "pt", "it", "de"]);
assert.equal(detectBrowserLanguage(["fr-CA", "en-US"]), "fr");
assert.equal(detectBrowserLanguage(["nl-NL"]), "en");
const keys = Object.keys(EN) as (keyof typeof EN)[];
assert.equal(keys.length, Object.keys(FR).length);
for (const key of keys) {
  assert.ok(FR[key].trim(), `French translation missing: ${key}`);
  const params = (value: string) => [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((m) => m[1]).sort();
  assert.deepEqual(params(FR[key]), params(EN[key]), `French placeholders changed: ${key}`);
  assert.equal(ES[key] !== undefined, true, `Spanish key lost: ${key}`);
}
assert.equal(translate("fr", "tools.upTo", { count: 4 }), "Jusqu’à 4");
assert.equal(bassPatternName("oom-pah-pah", "Waltz", "fr"), "Valse");
assert.equal(abcExampleName("c-major-scale", "Custom title", "fr"), "Custom title");

const buttons = generateStradella("96", 38, 1.18, "natural");
const result = getStradellaChordFinderResults(buttons, "C", "major-triad", "chord-buttons-only", false, 4, 5.5)
  .find((candidate) => candidate.exact && candidate.playable);
assert.ok(result);
const en = realizationAnnotation("C", "major-triad", result, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", "en");
const fr = realizationAnnotation("C", "major-triad", result, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", "fr");
assert.equal(fr.filenameKey, en.filenameKey);
assert.equal(fr.title, en.title);
assert.match(fr.lines.join("\n"), /Identité harmonique/);
assert.match(fr.lines.join("\n"), /Réalisation physique: CM · 1 bouton joué/);
assert.match(explainStradellaRealization("C", "major-triad", result, "chord-buttons-only", DEFAULT_STRADELLA_REGISTER_MODEL, null, "letter", "fr"), /utilise/);
const explanation = buildDiagramExplanation({
  referenceFamilyName: "triade majeure", relatedFamilyName: "septième mineure", scaleName: "ionien (majeur)",
  diatonicOnly: true, highlightDiatonic: false, allFamiliesMode: false,
  counts: [1], availableCounts: [1, 2], allCounts: [1, 2], language: "fr",
});
assert.match(explanation, /anneau intérieur/);
assert.match(explanation, /masqué/);
const app = readFileSync("src/App.tsx", "utf8");
assert.match(app, /SUPPORTED_LANGUAGES\.map/);
assert.match(readFileSync("README.md", "utf8"), /\*\*Version:\*\* 0\.15\.20/);
assert.match(readFileSync("docs/internal/adding-interface-languages.md", "utf8"), /SUPPORTED_LANGUAGES/);
console.log("✓ French catalog, registry, chord and Harmony explanations, labels, and filename invariants passed");
