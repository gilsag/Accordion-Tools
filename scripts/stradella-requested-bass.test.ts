import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { permittedRequestedBasses, harmonicIdentitySymbol } from "../src/tools/stradellaChordFinder/harmonicIdentity";
import { analyzeConfiguredStradellaVoicing, DEFAULT_STRADELLA_REGISTER_MODEL, type StradellaRegisterModel } from "../src/tools/stradellaChordFinder/registerModel";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { explainStradellaRealization } from "../src/tools/stradellaChordFinder/explainRealization";

const buttons = generateStradella("96", 38, 1.18, "natural");
const model = DEFAULT_STRADELLA_REGISTER_MODEL;
const results = (root: string, pattern: Parameters<typeof getStradellaChordFinderResults>[2], bass: string | null, register: StradellaRegisterModel = model, count = 4) =>
  getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", false, count, 5.5, bass, register);

assert.deepEqual(permittedRequestedBasses("E", "minor7"), ["E", "G", "B", "D"]);
assert.equal(harmonicIdentitySymbol({ root: "E", pattern: "minor7", requestedBass: "G" }), "Emin7/G");
assert.equal(harmonicIdentitySymbol({ root: "G", pattern: "major6", requestedBass: null }), "Gmaj6");

const em7 = results("E", "minor7", null);
const em7g = results("E", "minor7", "G");
assert.ok(em7.some((result) => result.playable));
assert.ok(em7g.some((result) => result.playable && result.exact), "Expected exact Em7/G candidate");
assert.ok(em7g.some((result) => result.playbackButtons.some((button) => button.pitchClass === "G" && button.kind.startsWith("bass-"))),
  "G bass reinforcement should be considered even though G is already a chord tone");
assert.ok(em7g.every((result) => !result.playable ||
  analyzeConfiguredStradellaVoicing(result.playbackButtons, "E", model).lowestPitchClass === "G"));
assert.ok(em7.some((result) => result.playable &&
  analyzeConfiguredStradellaVoicing(result.playbackButtons, "E", model).lowestPitchClass !== "G"));

const g6 = results("G", "major6", null);
assert.ok(g6.some((r) => r.playable), "G6 must still have a distinct harmonic identity and valid realization");
assert.deepEqual(new Set(em7g.find((r) => r.playable && r.exact)!.coveredPitches),
  new Set(g6.find((r) => r.playable && r.exact)!.coveredPitches));

const selected = em7g.find((r) => r.playable && r.exact)!;
const note = realizationAnnotation("E", "minor7", selected, model, "G");
assert.match(note.title, /Emin7\/G/);
assert.match(note.filenameKey, /Emin7-over-G/);
assert.match(note.detail, /Harmonic identity: Emin7\/G · First inversion/);
assert.match(explainStradellaRealization("E", "minor7", selected, "bass-and-chords", model, "G"), /Harmonic identity: Emin7\/G/);

const raised: StradellaRegisterModel = {
  bass: { startOctave: 4, grouping: "C-B" },
  chord: { startOctave: 3, grouping: "C-B" },
};
const altered = results("E", "minor7", "G", raised);
assert.ok(altered.every((r) => !r.playable ||
  analyzeConfiguredStradellaVoicing(r.playbackButtons, "E", raised).lowestPitchClass === "G"),
  "Changing register settings must not silently preserve an invalid inversion");
assert.ok(results("E", "minor7", "C")[0] && !results("E", "minor7", "C")[0].playable,
  "Foreign slash-bass notes must not be silently accepted");
assert.ok(results("E", "minor7", "G", model, 1).every((r) => !r.playable ||
  analyzeConfiguredStradellaVoicing(r.playbackButtons, "E", model).lowestPitchClass === "G"));

console.log("Stradella requested-bass tests passed.");
