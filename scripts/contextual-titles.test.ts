import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { stradellaContextualTitle, trebleContextualTitle } from "../src/tools/contextualTitles";
import { realizationAnnotation, DEFAULT_STRADELLA_NOTE_LEVELS } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";

const stradella = (requestedBass: string | null, modeledLowest: string | null) => stradellaContextualTitle({
  root: "E", pattern: "minor7", requestedBass, exact: true, buttonCount: 2,
  bassOnly: false, modeledLowest,
});
assert.equal(stradella(null, "E2"), "Emin7 - Exact - 2 buttons");
assert.equal(stradella(null, "G2"), "Emin7 - Exact - 2 buttons - modeled lowest G2");
assert.equal(stradella("G", "G2"), "Emin7/G - Exact - 2 buttons");
assert.equal(stradella("E", "E2"), "Emin7/E - Exact - 2 buttons");
assert.equal(stradella("G", "E2"), "Emin7/G - Exact - 2 buttons",
  "Do not silently replace requested harmonic identity with a modeled pitch");
assert.equal(stradella(null, null), "Emin7 - Exact - 2 buttons");
assert.equal(stradellaContextualTitle({ root: "C", pattern: "augmented-triad", requestedBass: null,
  exact: true, buttonCount: 3, bassOnly: true, modeledLowest: "C2" }), "Caug - Exact - 3 bass buttons");

const treble = (inversion: "root" | "first" | "second" | "third", hasButtons: boolean, exact: boolean) =>
  trebleContextualTitle({ root: "G", pattern: "major6", inversion, hasButtons, exact });
assert.equal(treble("root", true, true), "Gmaj6 - Exact");
assert.equal(treble("first", true, false), "Gmaj6 - selected 1st inversion - Approximate");
assert.equal(treble("second", true, true), "Gmaj6 - selected 2nd inversion - Exact");
assert.equal(treble("third", false, false), "Gmaj6 - selected 3rd inversion - No realization");
assert.equal(treble("root", false, false), "Gmaj6 - No realization");

const buttons = generateStradella("96", 38, 1.18, "natural");
const candidates = getStradellaChordFinderResults(buttons, "E", "minor7", "bass-and-chords", false,
  4, 5.5, "G", DEFAULT_STRADELLA_REGISTER_MODEL);
const exact = candidates.find((candidate) => candidate.playable && candidate.exact);
assert.ok(exact, "Expected a complete Em7/G result");
const annotation = realizationAnnotation("E", "minor7", exact, DEFAULT_STRADELLA_REGISTER_MODEL, "G");
assert.equal(annotation.title, `Emin7/G - Exact - ${exact.playbackButtons.length} buttons`);
assert.match(annotation.filenameKey, new RegExp(`^Emin7-over-G-Exact-${exact.playbackButtons.length}buttons-`));
const allOff = realizationAnnotation("E", "minor7", exact, DEFAULT_STRADELLA_REGISTER_MODEL, "G",
  { identity: false, pitchClasses: false, voicing: false, physical: false });
assert.equal(allOff.title, annotation.title);
assert.equal(allOff.filenameKey, annotation.filenameKey);
assert.deepEqual(allOff.lines, []);
// A selected non-root bass changes the nominal inversion, not the chord's name.
const cmaj13 = getStradellaChordFinderResults(buttons, "C", "major13", "bass-and-chords", false, 4, 5.5)
  .find((candidate) => candidate.playable && candidate.playbackButtons.some((button) =>
    button.pitchClass === "B" && button.kind.startsWith("bass-")));
assert.ok(cmaj13, "Expect a Cmaj13 alternative with B in the bass");
const shell = realizationAnnotation("C", "major13", cmaj13, DEFAULT_STRADELLA_REGISTER_MODEL);
assert.match(shell.title, /^Cmaj13 - (Exact|Approximate) - \d+ buttons - modeled lowest B2$/);
assert.doesNotMatch(shell.title, /Cmaj13\/B/, "Inferred voicing must not become an explicit slash chord");
assert.ok(shell.filenameKey.startsWith("Cmaj13-"));
assert.doesNotMatch(shell.filenameKey, /modeled|B2/, "Export recipe names must remain model-neutral");

assert.deepEqual(Object.values(DEFAULT_STRADELLA_NOTE_LEVELS), [true, true, true, true]);

const app = readFileSync("src/App.tsx", "utf8");
assert.match(app, /trebleContextualTitle\(\{/);
assert.match(app, /exact: trebleChordExplanation\.exact/);
assert.match(app, /inversion: chordFinderInversion/);
assert.match(app, /finderAnnotation\?\.title/);
assert.match(app, /finderAnnotation\.filenameKey/);
assert.match(app, /const effectiveTitleSize = titleMode === "contextual"/);
assert.match(app, /style=\{\{ fontSize: effectiveTitleSize \}\}/);
console.log("Contextual title and export-identity tests passed.");
