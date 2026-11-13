/** The Progression Assistant uses the Chord Finder's canonical chord types,
 * preserves legacy Harmony family transfers and keeps Finder ranking/IDs.
 */
import assert from 'node:assert/strict';
import { CHORD_FINDER_OPTIONS, intervalsForChordFinder } from '../../../src/music/chordDefinitions';
import { displayFinderChord } from '../../../src/tools/chordDisplay';
import { generateStradella } from '../../../src/stradella';
import { getStradellaChordFinderResults } from '../../../src/tools/stradellaChordFinderTools';
import {
  progressionFinderPattern, progressionChordLabel, progressionTargetPitchClasses,
  progressionRealizationsForChord, optimizeStradellaProgression, progressionRealizationKey,
} from '../../../src/tools/harmonyExplorer/progression';
import { convertProgressionPreset } from '../../../src/tools/harmonyExplorer/progressionPresets';
import { CHORD_FAMILIES } from '../../../src/tools/harmonyExplorer/music';
import { test } from "vitest";

test("All 35 chord types, legacy Harmony mapping, ranked candidates, pins, presets and UI terminology", () => {
  assert.equal(CHORD_FINDER_OPTIONS.length, 35);
  assert.equal(new Set(CHORD_FINDER_OPTIONS.map(({ value }) => value)).size, 35);
  assert.equal(CHORD_FAMILIES.length, 16, 'Harmony Explorer catalog must remain untouched');
  for (const { value: pattern } of CHORD_FINDER_OPTIONS) {
    const chord = { id: `c-${pattern}`, rootPc: 0, pattern, sectorIndex: 0 };
    assert.equal(progressionFinderPattern(chord), pattern);
    assert.deepEqual(progressionTargetPitchClasses(chord),
      [...new Set(intervalsForChordFinder(pattern).map((interval) => interval % 12))],
      `${pattern}: target notes use the canonical Finder formula`);
    for (const style of ['compact', 'letter', 'words']) {
      assert.equal(progressionChordLabel(chord, style), displayFinderChord('C', pattern, style),
        `${pattern}: symbol uses the existing Finder formatter`);
    }
  }
  const legacy = { id: 'from-harmony', rootPc: 0, familyId: 'halfDiminished7', sectorIndex: 0 };
  assert.equal(progressionFinderPattern(legacy), 'minor7b5', 'Legacy Harmony IDs still map without changing them');
  assert.equal(progressionFinderPattern({ ...legacy, familyId: 'augmentedMajor7' }), null,
    'No invented Finder equivalent for an unsupported Harmony family');
  const buttons = generateStradella('120', 24, 6, 'natural', 0);
  for (const pattern of ['major-triad', 'majorAdd9', 'dominant7b9', 'minorMajor9', 'major13', 'minor13']) {
    const chord = { id: `p-${pattern}`, rootPc: 0, pattern, sectorIndex: 0 };
    const original = getStradellaChordFinderResults(buttons, 'C', pattern, 'bass-and-chords', true);
    const displayed = progressionRealizationsForChord(buttons, chord, true);
    assert.equal(displayed.length, original.filter((result) => result.playable).length,
      `${pattern}: no new candidate or hidden playable alternative`);
    for (const { result, realizationIndex } of displayed) {
      assert.equal(result.playable, true);
      assert.equal(progressionRealizationKey(result), progressionRealizationKey(original[realizationIndex]),
        `${pattern}: original rank and physical playback buttons retained`);
    }
    if (displayed.length) {
      const zeroWeights = optimizeStradellaProgression(buttons, [chord], {
        allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0,
        maxRealizationsPerChord: 5,
      });
      assert.equal(zeroWeights.playable, true);
      assert.equal(zeroWeights.steps[0].realizationIndex, displayed[0].realizationIndex,
        `${pattern}: zero-weight Auto uses the original first Finder candidate`);
      const pinned = displayed.at(-1);
      const pinKey = progressionRealizationKey(pinned.result);
      const explicit = optimizeStradellaProgression(buttons, [chord], {
        allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0,
        maxRealizationsPerChord: 5, fixedRealizationKeys: { [chord.id]: pinKey },
      });
      assert.equal(explicit.steps[0].realizationIndex, pinned.realizationIndex,
        `${pattern}: arbitrary ranked option may be pinned`);
    }
  }
  const converted = convertProgressionPreset({ progression: 'ii V7 Imaj7' }, 'C');
  assert.deepEqual(converted.unsupported, []);
  assert.deepEqual(converted.chords.map((chord) => chord.pattern),
    ['minor-triad', 'dominant7', 'major7'], 'Presets use the same pattern IDs as manual selection');
});
