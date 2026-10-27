import assert from "node:assert/strict";
import {
  DEFAULT_RING_VISIBILITY,
  analyzeVoiceLeading,
  buildSectorRelationships,
  chordLabel,
  circleChordLabel,
  filterRelationshipCounts,
  isSubset,
  pitchClassesForChord,
  pitchClassesForScale,
  relationshipCounts,
  romanNumeralForChord,
} from "../src/tools/harmonyExplorer/music.ts";

const cMajor7Diatonic = buildSectorRelationships("major", "major7", "ionian", true)[0];
assert.ok(cMajor7Diatonic.bySharedCount.get(3)?.some((chord) => chord.rootPc === 0), "Cmaj7 should share three tones with C major");
assert.ok(cMajor7Diatonic.bySharedCount.get(2)?.some((chord) => chord.rootPc === 5), "Fmaj7 should share two tones with C major");

const cDominant7Diatonic = buildSectorRelationships("major", "dominant7", "ionian", true)[0];
assert.deepEqual(
  [...cDominant7Diatonic.bySharedCount.values()].flat().map((chord) => chord.rootPc),
  [7],
  "G7 should be the only diatonic dominant seventh chord in C Ionian",
);
assert.equal(cDominant7Diatonic.bySharedCount.get(1)?.[0]?.rootPc, 7, "G7 should share G with C major");

const diminishedDiatonic = buildSectorRelationships("major", "diminished7", "ionian", true);
assert.equal(relationshipCounts(diminishedDiatonic).length, 0, "No fully diminished seventh chord is diatonic to a major scale");

const allMajor7 = buildSectorRelationships("major", "major7", "ionian", false);
assert.deepEqual(relationshipCounts(allMajor7), [3, 2, 1], "Major-seventh relationships should populate three overlap rings");

for (const sector of allMajor7) {
  for (const candidates of sector.bySharedCount.values()) {
    assert.equal(new Set(candidates.map((candidate) => candidate.rootPc)).size, candidates.length, "Pitch-class duplicates must be suppressed");
  }
}

assert.deepEqual(pitchClassesForChord(0, "minor7"), [0, 3, 7, 10]);
assert.equal(chordLabel(6, "minor7", 4, false), "F♯m7");
assert.equal(chordLabel(6, "minor7", 4, true), "F♯m7/G♭m7");
// Only labels shown inside Harmony's circle use M to distinguish major chords
// from individual notes in the optional inner note ring.
assert.equal(chordLabel(0, "major", 0), "C", "Ordinary chordLabel stays unchanged");
assert.equal(circleChordLabel(0, "major", 0), "CM");
assert.equal(circleChordLabel(6, "major", 4, true), "F♯M/G♭M");
assert.equal(circleChordLabel(0, "minor", 0), "Cm");
assert.equal(circleChordLabel(0, "major7", 0), "Cmaj7");


const allFamiliesDiatonic = buildSectorRelationships("major", "all", "ionian", false)[0];
const allFamiliesDiatonicWithZero = buildSectorRelationships("major", "all", "ionian", false, true)[0];
const cMajorScale = pitchClassesForScale(0, "ionian");
const allFamiliesCandidates = [...allFamiliesDiatonic.bySharedCount.values()].flat();
const allFamiliesCandidatesWithZero = [...allFamiliesDiatonicWithZero.bySharedCount.values()].flat();
assert.ok(
  allFamiliesCandidates.some((chord) => chord.rootPc === 0 && chord.familyId === "major7"),
  "All-families mode should include Cmaj7 in C Ionian",
);
assert.ok(
  allFamiliesCandidatesWithZero.some((chord) => chord.rootPc === 2 && chord.familyId === "minor"),
  "All-families mode should include zero-overlap D minor in C Ionian when the 0-note ring is enabled",
);
assert.ok(
  allFamiliesCandidatesWithZero.some((chord) => chord.rootPc === 11 && chord.familyId === "diminished"),
  "All-families mode should include zero-overlap B diminished in C Ionian when the 0-note ring is enabled",
);
assert.ok(
  !allFamiliesCandidates.some((chord) => chord.rootPc === 0 && chord.familyId === "dominant7"),
  "All-families mode must exclude non-diatonic C7 in C Ionian",
);
assert.ok(
  !allFamiliesCandidates.some((chord) => chord.rootPc === 0 && chord.familyId === "major"),
  "The C-major reference chord should not be duplicated in the outer rings",
);
assert.ok(
  allFamiliesCandidatesWithZero.every((chord) => chord.diatonic && isSubset(chord.pitchClasses, cMajorScale)),
  "All-families mode must remain diatonic-only even when called with diatonicOnly=false",
);
assert.deepEqual(
  relationshipCounts(buildSectorRelationships("major", "all", "ionian", false)),
  [3, 2, 1],
  "All-families diagrams should omit the zero-overlap ring by default",
);
assert.deepEqual(
  relationshipCounts(buildSectorRelationships("major", "all", "ionian", false, true)),
  [3, 2, 1, 0],
  "All-families diagrams should include the zero-overlap ring when explicitly enabled",
);
assert.ok(
  relationshipCounts(buildSectorRelationships("major", "minor7", "ionian", false, true)).includes(0),
  "Single-family diagrams should also support an optional zero-overlap ring",
);

const availableAggregateCounts = relationshipCounts(
  buildSectorRelationships("major", "all", "ionian", false, true),
);
assert.deepEqual(
  filterRelationshipCounts(availableAggregateCounts, DEFAULT_RING_VISIBILITY),
  [3, 2, 1],
  "Default ring visibility should keep positive-overlap rings and hide the zero-overlap ring",
);
assert.deepEqual(
  filterRelationshipCounts(availableAggregateCounts, { ...DEFAULT_RING_VISIBILITY, 2: false, 0: true }),
  [3, 1, 0],
  "Any relationship ring should be independently hideable or showable",
);

const cToG7 = analyzeVoiceLeading(pitchClassesForChord(0, "major"), pitchClassesForChord(7, "dominant7"));
assert.equal(cToG7.totalMotion, 2, "C major to G7 should require two semitones of paired motion after holding G");
assert.deepEqual(cToG7.sharedPitchClasses, [7], "C major and G7 should hold G as their common tone");
assert.equal(cToG7.addedPitchClasses.length, 1, "G7 adds one voice relative to a C-major triad");

const cToAm7 = analyzeVoiceLeading(pitchClassesForChord(0, "major"), pitchClassesForChord(9, "minor7"));
assert.equal(cToAm7.totalMotion, 0, "C major to Am7 should hold C, E and G with no paired motion");
assert.deepEqual(new Set(cToAm7.sharedPitchClasses), new Set([0, 4, 7]));
assert.deepEqual(cToAm7.addedPitchClasses, [9], "Am7 should add A to the three held tones");

assert.equal(romanNumeralForChord(9, "minor7", 0, "ionian"), "vi7", "Am7 should be vi7 in C Ionian");
assert.equal(romanNumeralForChord(7, "dominant7", 0, "ionian"), "V7", "G7 should be V7 in C Ionian");
assert.equal(romanNumeralForChord(1, "major", 0, "ionian"), null, "Db is a chromatic root in C Ionian");

console.log("harmony-explorer.test.ts: all harmonic relationship tests passed");
