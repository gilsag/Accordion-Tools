import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import { estimateStradellaButtonSpacing, optimizeStradellaProgression, physicalButtonMovement, progressionBassPulseButtons, type HarmonyProgressionChord } from "../src/tools/harmonyExplorer/progression";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { finderPatternForHarmonyFamily, pitchClassNameFromNumber } from "../src/tools/harmonyExplorer/integration";

function chord(id: string, rootPc: number, familyId: HarmonyProgressionChord["familyId"]): HarmonyProgressionChord {
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
  const pattern = finderPatternForHarmonyFamily(item.familyId);
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

console.log("Harmony progression optimization tests passed.");
