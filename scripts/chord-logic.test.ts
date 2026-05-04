import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResult } from "../src/tools/stradellaChordFinderTools.ts";
import type { DiagramButton, FinderChordPattern, StradellaChordFinderMode } from "../src/types.ts";

const buttons = generateStradella("96", 38, 1.18, "default");

function result(root: string, pattern: FinderChordPattern, mode: StradellaChordFinderMode, markRootBass = true) {
  return getStradellaChordFinderResult(buttons, root, pattern, mode, markRootBass);
}

function buttonNames(buttonsToName: DiagramButton[]) {
  return buttonsToName.map((button) => `${button.kind}:${button.chordNaturalName ?? button.naturalName}`);
}

function chordButtonNames(buttonsToName: DiagramButton[]) {
  return buttonNames(buttonsToName.filter((button) => button.kind.startsWith("chord-")));
}

function assertSameSet(actual: string[], expected: string[], message: string) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);
}

{
  const c7 = result("C", "dominant7", "chord-buttons-only");
  assert.equal(c7.playable, true, "C7 should be playable with chord buttons only");
  assertSameSet(chordButtonNames(c7.buttons), ["chord-dominant7:C", "chord-diminished7:G"], "C7 should use C7 + G diminished");
  assertSameSet(c7.coveredPitches, ["C", "E", "G", "A#"], "C7 should cover only the target tones");
  assert.deepEqual(c7.extraPitches, [], "C7 should not add extra tones");
}

{
  const cm7b5 = result("C", "minor7b5", "chord-buttons-only");
  assert.equal(cm7b5.playable, true, "Cm7b5 should be playable with chord buttons only");
  assertSameSet(chordButtonNames(cm7b5.buttons), ["chord-minor:Eb", "chord-diminished7:Eb"], "Cm7b5 should use Eb minor + Eb diminished");
  assertSameSet(cm7b5.coveredPitches, ["C", "D#", "F#", "A#"], "Cm7b5 should cover only the target tones");
  assert.deepEqual(cm7b5.extraPitches, [], "Cm7b5 should not add extra tones");
}

{
  const augmented = result("C", "augmented-triad", "chord-buttons-only");
  assert.equal(augmented.playable, false, "C augmented should not be shown with chord buttons only");
  assert.deepEqual(augmented.buttons, [], "C augmented should not select approximate chord buttons");
}

{
  const minorMajor7 = result("C", "minorMajor7", "chord-buttons-only");
  assert.equal(minorMajor7.playable, false, "Cm(maj7) should be Not found with chord buttons only");
  assert.deepEqual(minorMajor7.buttons, [], "Cm(maj7) should not select a recipe with extra tones");
}

{
  const minorTriadBass = result("C", "minor-triad", "bass-only");
  assert.equal(minorTriadBass.playable, true, "C minor triad should be playable on bass rows in a 96-bass layout");
  assert.deepEqual(
    minorTriadBass.buttons.map((button) => `${button.kind}:${button.naturalName}`),
    ["bass-root:C", "bass-root:Eb", "bass-root:G"],
    "C minor triad bass-row result should use notes closest to the C root button",
  );
  assert.deepEqual(
    minorTriadBass.playbackButtons.map((button) => button.pitchClass),
    ["C", "D#", "G"],
    "Bass-row playback should be ordered by pitch before the final chord playback",
  );
}

{
  const minorMajor9 = result("C", "minorMajor9", "bass-and-chords");
  assert.equal(minorMajor9.playable, true, "Cm(maj9) should be playable in mixed mode");
  assert.deepEqual(minorMajor9.extraPitches, [], "Mixed mode should not add tones outside the requested chord");
  assertSameSet(minorMajor9.coveredPitches, ["C", "D#", "G", "B", "D"], "Mixed mode should cover the Cm(maj9) target tones");
}

console.log("✓ Stradella chord logic tests passed");
