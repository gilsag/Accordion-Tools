import assert from "node:assert/strict";
import { displayFinderChord, displayRealizedChord, displayStradellaButtonChord } from "../src/tools/chordDisplay";
import { chordLabel, circleChordLabel } from "../src/tools/harmonyExplorer/music";
import { stradellaContextualTitle, trebleContextualTitle } from "../src/tools/contextualTitles";

assert.deepEqual(["compact", "letter", "words"].map((style) =>
  displayFinderChord("C", "major-triad", style as "compact" | "letter" | "words")),
  ["C", "CM", "Cmaj"]);
assert.deepEqual(["compact", "letter", "words"].map((style) =>
  displayFinderChord("C", "minor7", style as "compact" | "letter" | "words")),
  ["Cm7", "Cm7", "Cmin7"]);
assert.equal(displayRealizedChord("C", "minor7", "Cmin7/B♭", "letter"), "Cm7/B♭");
assert.equal(displayFinderChord("F#", "major-triad", "letter"), "F♯M");
assert.equal(displayStradellaButtonChord("C", "chord-major", "letter"), "CM");
assert.equal(circleChordLabel(0, "major", 0, false, "compact"), "C");
assert.equal(circleChordLabel(0, "major", 0, false, "letter"), "CM");
assert.equal(circleChordLabel(0, "major", 0, false, "words"), "Cmaj");
assert.equal(circleChordLabel(6, "major", 6, true, "letter"), "F♯M/G♭M");
assert.equal(chordLabel(0, "minor7", 0, false, "words"), "Cmin7");
assert.equal(stradellaContextualTitle({root:"C",pattern:"minor7",requestedBass:"A#",modeledLowest:"A#2",exact:true,buttonCount:2,bassOnly:false,displayStyle:"letter"}), "Cm7/B♭ - Exact - 2 buttons");
assert.equal(trebleContextualTitle({root:"C",pattern:"major-triad",inversion:"root",hasButtons:true,exact:true,displayStyle:"letter"}),"CM - Exact");
console.log("Chord display notation tests passed");
