import assert from "node:assert/strict";
import { generateTreble } from "../src/treble";
import { generatePianoTreble } from "../src/pianoTreble";
import { getChordFinderTrebleButtons } from "../src/tools/chordFinderTools";
import { describeTrebleChord } from "../src/tools/trebleChordExplanation";
import { intervalsForChordFinder } from "../src/music/chordDefinitions";
import { transpose } from "../src/music";
import type { FinderChordPattern } from "../src/types";

const roots = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const patterns: FinderChordPattern[] = [
  "major-triad", "minor-triad", "augmented-triad", "dominant7", "minor7", "major7",
  "dominant9", "major9", "minor9", "dominant11", "major11", "minor11",
  "dominant13", "major13", "minor13",
];
const layouts = [
  generateTreble("c-system", 5, "large", 38, 1.18, 11, true),
  generateTreble("b-system", 5, "large", 38, 1.18, 11, true),
  generatePianoTreble("three-octave", 38, 1.18, true),
];
let checked = 0;
for (const buttons of layouts) {
  for (const root of roots) {
    for (const pattern of patterns) {
      const wanted = new Set(intervalsForChordFinder(pattern).map((interval) => transpose(root, interval)));
      const exactButtons = getChordFinderTrebleButtons(buttons, root, pattern, "root", 4, "full");
      const autoButtons = getChordFinderTrebleButtons(buttons, root, pattern, "root", 4, "auto");
      if (wanted.size <= 5 && new Set(exactButtons.map((button) => button.pitchClass)).size === wanted.size) {
        assert.equal(new Set(autoButtons.map((button) => button.pitchClass)).size, wanted.size,
          `Auto omitted available chord tones in ${root} ${pattern}`);
        checked += 1;
      }
      const note = describeTrebleChord(autoButtons, root, pattern, "auto");
      assert.ok(note.note.length > 0, `${root} ${pattern} needs a note, including triads`);
      assert.ok(note.status.length > 0, `${root} ${pattern} needs a classification`);
      if (wanted.size > 5) assert.ok(autoButtons.length <= 5, "Auto must prefer one-hand reductions");
    }
  }
}
const trebleButtons = layouts[0];
const full13 = getChordFinderTrebleButtons(trebleButtons, "C", "major13", "root", 4, "full");
assert.equal(full13.length, 7, "Full Cmaj13 should expose all seven tones on a sufficiently large keyboard");
assert.match(describeTrebleChord(full13, "C", "major13", "full").note, /Exact/);
assert.match(describeTrebleChord(full13, "C", "major13", "full").explanation, /not a simultaneous one-hand fingering/);
assert.match(describeTrebleChord(
  getChordFinderTrebleButtons(trebleButtons, "C", "major-triad", "root", 4),
  "C", "major-triad", "auto",
).note, /Exact/);
console.log(`✓ Treble chord finder: ${checked} complete Auto cases; diagram notes for all chord families`);
