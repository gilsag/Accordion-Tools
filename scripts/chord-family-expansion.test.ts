import assert from "node:assert/strict";
import { CHORD_FINDER_OPTIONS, intervalsForChordFinder } from "../src/music/chordDefinitions";
import { chordToneFunctions } from "../src/music/chordToneRoles";
import { isExtendedChord, permittedMissingTones } from "../src/music/chordVoicingPolicy";
import { displayFinderChord } from "../src/tools/chordDisplay";
import { chordToneName } from "../src/tools/stradellaChordFinder/chordSpelling";
import { extendedVoicingDensityPenalty } from "../src/tools/stradellaChordFinder/voicingDensity";
import { orderedTargetPitches } from "../src/tools/stradellaChordFinder/utils";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { chordButtonRecipeResult } from "../src/tools/stradellaChordFinder/searchChordButtonsOnly";
import type { FinderChordPattern } from "../src/types";
const families: Array<[FinderChordPattern, number[], string]> = [
  ["sus2", [0,2,7], "Csus2"],
  ["dominant7sus4", [0,5,7,10], "C7sus4"],
  ["majorAdd9", [0,4,7,14], "Cadd9"],
  ["minorAdd9", [0,3,7,14], "Cm(add9)"],
  ["major6add9", [0,4,7,9,14], "C6/9"],
  ["minor6add9", [0,3,7,9,14], "Cm6/9"],
  ["dominant7sharp5", [0,4,8,10], "C7♯5"],
  ["dominant7sharp9", [0,4,7,10,15], "C7♯9"],
  ["major7sharp11", [0,4,7,11,18], "Cmaj7♯11"],
];
const optionIds = new Set(CHORD_FINDER_OPTIONS.map((o) => o.value));
assert.deepEqual(CHORD_FINDER_OPTIONS.map((o) => intervalsForChordFinder(o.value).length),
  [...CHORD_FINDER_OPTIONS.map((o) => intervalsForChordFinder(o.value).length)].sort((a, b) => a-b),
  "Finder chord options should be grouped by theoretical number of tones");
for (const [pattern, intervals, symbol] of families) {
  assert.ok(optionIds.has(pattern));
  assert.deepEqual(intervalsForChordFinder(pattern), intervals);
  assert.equal(displayFinderChord("C", pattern, "compact"), symbol);
  assert.equal(chordToneFunctions(pattern).length, intervals.length);
  assert.equal(isExtendedChord(pattern), intervals.length >= 5);
  assert.ok(chordToneFunctions(pattern).find((tone) => tone.interval === 0)?.defining);
}
assert.equal(chordToneName("C", "dominant7sharp9", "D#"), "D♯");
assert.equal(chordToneName("C", "major7sharp11", "F#"), "F♯");
assert.equal(chordToneName("C", "dominant7sharp5", "G#"), "G♯");
assert.equal(chordToneName("C", "sus2", "D"), "D");
assert.equal(permittedMissingTones("C", "minorAdd9", ["D"]), false);
assert.equal(permittedMissingTones("C", "dominant7sharp5", ["G#"]), false);
assert.equal(permittedMissingTones("C", "major7sharp11", ["F#"]), false);
assert.equal(permittedMissingTones("C", "major6add9", ["G"]), true);
assert.equal(permittedMissingTones("C", "major6add9", ["D"]), false);
const mock = (midi: number) => ({ midi, pitchClass:"C", octave: Math.floor(midi/12)-1,
  buttonId:`${midi}`, source:"chord" as const });
assert.ok(extendedVoicingDensityPenalty([mock(47),mock(48)]) > 3);
assert.ok(extendedVoicingDensityPenalty([mock(47),mock(48)]) >
  extendedVoicingDensityPenalty([mock(71),mock(72)]));
assert.ok(extendedVoicingDensityPenalty([mock(47),mock(48),mock(49),mock(50)]) >
  extendedVoicingDensityPenalty([mock(47),mock(51),mock(55),mock(59)]));
assert.equal(extendedVoicingDensityPenalty([mock(48),mock(48),mock(52)]),0);
const buttons = generateStradella("48-8x6",38,1.18,"default");
assert.ok(chordButtonRecipeResult(buttons,"C",orderedTargetPitches("C","dominant7sharp9"),
  "dominant7sharp9",false).exact, "C7 + Cm realizes C7♯9 as pitch classes");
for (const [pattern] of families) {
  const results = getStradellaChordFinderResults(buttons,"C",pattern,"bass-and-chords",false,3,5.5);
  for (const result of results.filter((r)=>r.playable)) {
    assert.equal(result.extraPitches.length,0);
    assert.ok(result.exact || permittedMissingTones("C",pattern,result.missingPitches));
  }
  assert.ok(results.filter((r)=>r.recommended).length <= 3);
}
console.log("✓ New families, defining tone omissions, spelling, dense voicing costs and finder search passed");
