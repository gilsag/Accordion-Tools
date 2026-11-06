import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import { estimateStradellaButtonSpacing, optimizeStradellaProgression, physicalButtonMovement, progressionBassPulseButtons, progressionRealizationsForChord, progressionRealizationKey, type HarmonyProgressionChord } from "../src/tools/harmonyExplorer/progression";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { finderPatternForHarmonyFamily, pitchClassNameFromNumber } from "../src/tools/harmonyExplorer/integration";
import type { ChordFamilyId } from "../src/tools/harmonyExplorer/music";

function chord(id: string, rootPc: number, familyId: ChordFamilyId): HarmonyProgressionChord {
  return { id, rootPc, familyId, sectorIndex: 0 };
}

const buttons = generateStradella("120", 24, 6, "natural", 0);
const progression: HarmonyProgressionChord[] = [
  chord("c1", 0, "major"),
  chord("am7", 9, "minor7"),
  chord("dm7", 2, "minor7"),
  chord("g7", 7, "dominant7"),
  chord("c2", 0, "major"),
];

const plan = optimizeStradellaProgression(buttons, progression, {
  allowApproximations: false,
  handMovementWeight: 0.65,
  maxRealizationsPerChord: 5,
});

assert.equal(plan.playable, true, "ii/V-style test progression should be playable exactly");
assert.equal(plan.steps.length, progression.length);
assert.equal(plan.approximateCount, 0);
assert.ok(plan.totalPhysicalMovement >= 0);
assert.ok(plan.totalHarmonicMotion >= 0);
assert.ok(plan.steps.every((step) => step.result.playable && step.result.exact));

// Whole-progression optimization should beat simply choosing the first-ranked
// realization of every chord independently for this standard progression.
const spacing = estimateStradellaButtonSpacing(buttons);
const independent = progression.map((item) => {
  const pattern = "pattern" in item ? item.pattern : finderPatternForHarmonyFamily(item.familyId);
  assert.ok(pattern);
  return getStradellaChordFinderResults(
    buttons,
    pitchClassNameFromNumber(item.rootPc),
    pattern,
    "bass-and-chords",
    true,
  )[0];
});
const independentPhysical = independent.slice(1).reduce((sum, result, index) =>
  sum + physicalButtonMovement(
    independent[index].playbackButtons,
    result.playbackButtons,
    spacing,
  ), 0);
assert.ok(plan.totalPhysicalMovement < independentPhysical);

// Augmented dominant sevenths now have an exact Finder mapping (7#5).
const supportedAug7 = optimizeStradellaProgression(buttons, [chord("aug7", 0, "augmented7")], {
  allowApproximations: false,
  handMovementWeight: 0.65,
});
assert.equal(supportedAug7.playable, true, "augmented dominant sevenths should be supported exactly");
assert.equal(supportedAug7.approximateCount, 0);
assert.deepEqual(supportedAug7.unsupportedLabels, []);

// Augmented major sevenths remain unmapped: never guess a different family.
const unsupportedAugMaj7 = optimizeStradellaProgression(buttons, [chord("augMaj7", 0, "augmentedMajor7")], {
  allowApproximations: false,
  handMovementWeight: 0.65,
});
assert.equal(unsupportedAugMaj7.playable, false, "unsupported Harmony family should be reported, not guessed");
assert.deepEqual(unsupportedAugMaj7.unsupportedLabels, ["C+maj7"]);


// Browse the entire unchanged Finder ranking (beyond the automatic top-five)
// and pin the C-major preset chord button rather than bass/counterbass only.
const cMajorOptions = progressionRealizationsForChord(buttons, progression[0], false);
const cPreset = cMajorOptions.find(({ result }) => result.playbackButtons.some(
  (button) => button.kind === "chord-major" && button.chordRoot === "C",
));
assert.ok(cPreset, "C-major preset chord must remain an available manual realization");
const cPresetKey = progressionRealizationKey(cPreset.result);
const manualPlan = optimizeStradellaProgression(buttons, progression, {
  allowApproximations: false,
  handMovementWeight: 0.65,
  maxRealizationsPerChord: 5,
  fixedRealizationKeys: { c1: cPresetKey },
});
assert.equal(manualPlan.playable, true);
assert.equal(manualPlan.steps[0].realizationIndex, cPreset.realizationIndex);
assert.equal(progressionRealizationKey(manualPlan.steps[0].result), cPresetKey);
assert.ok(manualPlan.steps[0].result.playbackButtons.some((button) =>
  button.kind === "chord-major" && button.chordRoot === "C",
));
assert.ok(manualPlan.steps.slice(1).every((step) => step.result.playable));
assert.equal(manualPlan.steps[0].transitionFromPrevious, null);
assert.ok(manualPlan.steps[1].transitionFromPrevious !== null);
// The other C-major step is still optimized, not constrained by c1's ID.
assert.ok(manualPlan.steps[4].realizationIndex < 5);

// Rhythmic accompaniment must preserve the bass/counterbass button chosen by
// the optimized realization. Em7 is idiomatically E counterbass + G major;
// the rhythm layer must not replace that E with the fundamental-bass E.
const em7Plan = optimizeStradellaProgression(buttons, [chord("em7", 4, "minor7")], {
  allowApproximations: true,
  handMovementWeight: 0.65,
  maxRealizationsPerChord: 5,
});
assert.equal(em7Plan.playable, true);
const em7BassPulse = progressionBassPulseButtons(buttons, em7Plan.steps[0]);
assert.ok(
  em7BassPulse.some((button) => button.kind === "bass-counterbass" && button.pitchClass === "E"),
  "Em7 accompaniment should preserve the optimized E counterbass rather than force E fundamental bass",
);

// Finder results are cached per layout: a second request returns the same
// result objects, and a fresh layout (a new button array) is searched again.
const g7Again = progressionRealizationsForChord(buttons, chord("g7b", 7, "dominant7"), true);
const g7Once = progressionRealizationsForChord(buttons, chord("g7c", 7, "dominant7"), true);
assert.ok(g7Again.length > 0 && g7Again.every((entry, index) => entry.result === g7Once[index].result), "cached results are reused");
const freshLayout = generateStradella("120", 24, 6, "natural", 0);
const g7Fresh = progressionRealizationsForChord(freshLayout, chord("g7d", 7, "dominant7"), true);
assert.notEqual(g7Fresh[0].result, g7Once[0].result, "a new layout is searched again");
assert.deepEqual(g7Fresh.map(({ result }) => progressionRealizationKey(result)), g7Once.map(({ result }) => progressionRealizationKey(result)));

console.log("Harmony progression optimization tests passed.");
