/** Ranking policy: a requested bass is played on the bass rows (by default),
 * leaving out only the plain fifth costs little, and the Progression
 * Assistant at zero weights picks the Chord Finder's first realization. */
import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults, nextWiderHandSpan } from "../src/tools/stradellaChordFinderTools";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import { optimizeStradellaProgression, type ProgressionSearchSettings } from "../src/tools/harmonyExplorer/progression";
import { convertProgressionPreset } from "../src/tools/harmonyExplorer/progressionPresets";
import type { FinderChordPattern } from "../src/types";
import type { StradellaChordFinderResult } from "../src/tools/stradellaChordFinder/results";

const buttons = generateStradella("120", 40, 1.2, "sharps", 6);
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const label = (result: StradellaChordFinderResult) => result.playbackButtons.map((button) =>
  button.kind === "bass-root" || button.kind === "bass-counterbass" ? `${button.pitchClass} bass`
    : `${button.chordRoot} ${button.kind.replace("chord-", "")}`).sort().join(" + ");
// Extended reach (5.5 columns), so that C6 can play its root on the bass rows.
const finder = (root: string, pattern: FinderChordPattern, requestedBass: string | null, onBassButton: boolean, span = 5.5) =>
  getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true, 3, span,
    requestedBass, DEFAULT_STRADELLA_REGISTER_MODEL, 0, onBassButton).filter((result) => result.playable);

// The usual left-hand fingerings come first in root position.
const expectedFirst: Array<[string, FinderChordPattern, string]> = [
  ["C", "major-triad", "C bass + C major"],
  ["C", "minor-triad", "C bass + C minor"],
  ["C", "dominant7", "C bass + C dominant7"],
  ["G", "dominant7", "G bass + G dominant7"],
  ["C", "major6", "A minor + C bass"],
  ["C", "minor6", "C bass + C diminished7"],
  ["C", "major7", "C bass + E minor"],
  ["C", "minor7", "C bass + D# major"],
];
for (const [root, pattern, first] of expectedFirst) {
  const results = finder(root, pattern, root, true);
  assert.equal(label(results[0]), first, `${root} ${pattern}`);
  // Every result plays the root on a bass or counterbass button.
  for (const result of results) {
    assert.ok(result.playbackButtons.some((button) =>
      (button.kind === "bass-root" || button.kind === "bass-counterbass") && button.pitchClass === root),
    `${root} ${pattern}: ${label(result)} has the root on the bass rows`);
  }
}

// With the rule off, chord buttons alone can still count as root position.
assert.ok(finder("C", "major6", "C", false).some((result) =>
  result.playbackButtons.every((button) => button.kind.startsWith("chord-"))));

// A missing plain fifth no longer sends the usual C7 fingering to the bottom.
const anyC7 = finder("C", "dominant7", null, false).map(label);
assert.ok(anyC7.indexOf("C bass + C dominant7") < anyC7.length - 1, "C bass + C7 is not last");

// Progression Assistant consistency: with both weights at 0, every chord gets
// the Chord Finder's first realization under the same settings.
const search: ProgressionSearchSettings = {
  rootPosition: true, requestedBassOnBassButton: true, maxButtons: 3, spanColumns: 5.5,
  registerModel: DEFAULT_STRADELLA_REGISTER_MODEL, minimumNominalGap: 0,
};
for (const progression of ["I vi ii V7 I", "ii7 V7 Imaj7", "I IV V7 I", "I vi IV V", "i iv V7 i"]) {
  const chords = convertProgressionPreset({ id: "test", name: "test", progression }, "C").chords
    .map((chord, index) => ({ ...chord, id: `step-${index}` }));
  const plan = optimizeStradellaProgression(buttons, chords, {
    allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0, maxRealizationsPerChord: 5, search,
  });
  plan.steps.forEach((step, index) => {
    const chord = chords[index];
    const root = NAMES[chord.rootPc];
    assert.equal(label(step.result), label(finder(root, chord.pattern, root, true)[0]), `${progression}, step ${index + 1}`);
  });
}

// Moderate reach: no C6 realization plays C on the bass rows. The search first
// allows the next hand span (Extended), so C counterbass + A minor is played;
// only at Extended does it fall back to C as the lowest note without a bass button.
assert.equal(finder("C", "major6", "C", true, 4.3).length, 0);
assert.equal(nextWiderHandSpan(4.3), 5.5);
assert.equal(nextWiderHandSpan(3.2), 4.3);
assert.equal(nextWiderHandSpan(5.5), null);
const c6 = convertProgressionPreset({ id: "c6", name: "c6", progression: "I" }, "C").chords
  .map((chord) => ({ ...chord, pattern: "major6" as FinderChordPattern, id: "c6" }));
const c6Plan = (spanColumns: number) => optimizeStradellaProgression(buttons, c6, {
  allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0, maxRealizationsPerChord: 5, search: { ...search, spanColumns },
});
assert.equal(label(c6Plan(4.3).steps[0].result), label(finder("C", "major6", "C", true, 5.5)[0]), "one step more reach keeps the bass button");
assert.equal(label(c6Plan(4.3).steps[0].result), "A minor + C bass");

// Triads keep their own chord button in Auto, even when hand movement is
// weighted: the default weights used to spell Dm as three single bass notes.
const fifties = convertProgressionPreset({ id: "t", name: "t", progression: "I vi ii V7 I" }, "C").chords
  .map((chord, index) => ({ ...chord, id: `t-${index}` }));
for (const [handMovementWeight, voiceLeadingWeight] of [[0.65, 0.35], [1, 1], [1, 0]]) {
  const plan = optimizeStradellaProgression(buttons, fifties, {
    allowApproximations: true, handMovementWeight, voiceLeadingWeight, maxRealizationsPerChord: 5, search: { ...search, spanColumns: 4.3 },
  });
  for (const index of [0, 1, 2, 4]) {
    const chord = fifties[index];
    assert.ok(plan.steps[index].result.playbackButtons.some((button) =>
      button.kind === (chord.pattern === "major-triad" ? "chord-major" : "chord-minor") && button.chordRoot === NAMES[chord.rootPc]),
    `weights ${handMovementWeight}/${voiceLeadingWeight}, step ${index + 1} uses its chord button`);
  }
}

console.log("✓ Bass on the bass rows (one step more reach if needed), light fifth omission, triads on their chord button, and Progression Assistant matches the Chord Finder at zero weights");
