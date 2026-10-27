import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EN, ES, FR, PT, IT, DE, SUPPORTED_LANGUAGES, translate, translateKnownLabel, detectBrowserLanguage, isInterfaceLanguagePreference, resolveInterfaceLanguage } from "../src/i18n/catalog";
import { abcExampleName, bassPatternName, progressionName } from "../src/i18n/optionLabels";
import { chordRole, familyName, scaleName, stradellaButtonFunction, stradellaDiagramRowLabel } from "../src/i18n/musicTerms";
import { generateStradella } from "../src/stradella";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { explainStradellaRealization } from "../src/tools/stradellaChordFinder/explainRealization";
import { buildDiagramExplanation } from "../src/tools/harmonyExplorer/explanation";
import { describeTrebleChord } from "../src/tools/trebleChordExplanation";

const languages = ["en", "es", "fr", "pt", "it", "de"] as const;
const catalogs = { en: EN, es: ES, fr: FR, pt: PT, it: IT, de: DE };
assert.deepEqual(SUPPORTED_LANGUAGES.map((item) => item.code), languages);
const keys = Object.keys(EN) as (keyof typeof EN)[];
assert.ok(keys.length >= 768);
const tokens = (text: string) => [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map((m) => m[1]).sort();
for (const language of languages) {
  assert.deepEqual(Object.keys(catalogs[language]).sort(), [...keys].sort(), `${language}: exact key parity`);
  for (const key of keys) {
    assert.ok(catalogs[language][key]?.trim(), `${language}: missing ${key}`);
    assert.deepEqual(tokens(catalogs[language][key]), tokens(EN[key]), `${language}: placeholders in ${key}`);
  }
}
for (const [raw, expected] of [
  ["pt-BR", "pt"], ["pt-PT", "pt"], ["it-IT", "it"], ["de-DE", "de"],
  ["de-AT", "de"], ["fr-CH", "fr"], ["es-CL", "es"], ["nl-NL", "en"],
] as const) {
  assert.equal(detectBrowserLanguage([raw]), expected);
  assert.equal(resolveInterfaceLanguage("auto", [raw]), expected);
}
assert.equal(resolveInterfaceLanguage("es", ["de-DE"]), "es");
for (const language of languages) assert.ok(isInterfaceLanguagePreference(language));
assert.equal(isInterfaceLanguagePreference("pt-BR"), false);
assert.equal(translate("pt", "tools.upTo", { count: 4 }), "Até 4");
assert.equal(translate("it", "tools.upTo", { count: 4 }), "Fino a 4");
assert.equal(translate("de", "tools.upTo", { count: 4 }), "Bis zu 4");
assert.equal(translate("de", "ui.cannotSave", { reason: "X" }), "Speichern nicht möglich: X");

const newLanguages = ["pt", "it", "de"] as const;
for (const language of newLanguages) {
  assert.notEqual(translateKnownLabel(language, "Major scale"), "Major scale");
  assert.notEqual(familyName("minor7", "Minor seventh", language), "Minor seventh");
  assert.notEqual(scaleName("dorian", "Dorian", language), "Dorian");
  assert.notEqual(chordRole("thirteenth", language), "thirteenth");
  assert.notEqual(stradellaButtonFunction("major", language), "major");
  assert.notEqual(stradellaDiagramRowLabel("bass-counterbass", "Counterbass", language), "Counterbass");
  assert.notEqual(progressionName("ii-v-i", "ii–V–I progression", language), "ii–V–I progression");
  assert.notEqual(bassPatternName("oom-pah-pah", "Waltz", language), "Waltz");
  assert.notEqual(abcExampleName("c-major-scale", "C major scale", language), "C major scale");
  assert.equal(abcExampleName("c-major-scale", "Custom", language), "Custom");
  assert.equal(bassPatternName("oom-pah-pah", "My personal waltz", language), "My personal waltz");
}
const buttons = generateStradella("96", 38, 1.18, "natural");
const result = getStradellaChordFinderResults(buttons, "C", "major13", "bass-and-chords", false, 4, 5.5, null, DEFAULT_STRADELLA_REGISTER_MODEL)
  .find((candidate) => candidate.playable);
assert.ok(result);
const base = realizationAnnotation("C", "major13", result, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", "en");
for (const [language, expectedIdentity, expectedPhysical, expectedExplanation] of [
  ["pt", "Identidade harmônica:", "Realização física:", /usa/],
  ["it", "Identità armonica:", "Realizzazione fisica:", /utilizza/],
  ["de", "Harmonische Identität:", "Physische Realisierung:", /verwendet/],
] as const) {
  const localized = realizationAnnotation("C", "major13", result, DEFAULT_STRADELLA_REGISTER_MODEL, null, undefined, "letter", language);
  assert.equal(localized.title, base.title);
  assert.equal(localized.filenameKey, base.filenameKey);
  assert.equal(localized.lines.length, base.lines.length);
  assert.ok(localized.lines.some((line) => line.startsWith(expectedIdentity)), `${language}: identity annotation`);
  assert.ok(localized.lines.some((line) => line.startsWith(expectedPhysical)), `${language}: physical annotation`);
  const description = explainStradellaRealization("C", "major13", result, "bass-and-chords", DEFAULT_STRADELLA_REGISTER_MODEL, null, "letter", language);
  assert.match(description, expectedExplanation);
  assert.doesNotMatch(description, /Why recommended|Identidad armónica/);
  const treble = describeTrebleChord([], "C", "major-triad", "auto", language);
  assert.notEqual(treble.status, "No matching buttons");
  const relation = buildDiagramExplanation({
    referenceFamilyName: familyName("major", "Major triad", language),
    relatedFamilyName: familyName("minor7", "Minor seventh", language),
    scaleName: scaleName("ionian", "Ionian (Major)", language),
    diatonicOnly: true, highlightDiatonic: false, allFamiliesMode: false,
    counts: [1], availableCounts: [1, 2], allCounts: [0, 1, 2], language,
  });
  assert.ok(relation.length > 100);
  assert.doesNotMatch(relation, /The inner ring|The rings for|No related chords/);
}
const app = readFileSync("src/App.tsx", "utf8");
assert.match(app, /SUPPORTED_LANGUAGES\.map/);
assert.match(app, /document\.documentElement\.lang/);
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
assert.equal(version, "0.15.20");
assert.equal(lock.version, version);
assert.equal(lock.packages[""].version, version);
assert.match(readFileSync("src/config/appInfo.ts", "utf8"), /version: "0\.15\.20"/);
assert.match(readFileSync("README.md", "utf8"), /\*\*Version:\*\* 0\.15\.20/);
assert.match(readFileSync("VERSION_HISTORY.md", "utf8"), /^## v0\.15\.20/);
assert.match(readFileSync("docs/internal/adding-interface-languages.md", "utf8"), /pt\.ts/);
console.log("✓ Six complete catalogs, browser/persisted locales, new music terms, built-ins, notes, explanations, filenames and release references passed");
