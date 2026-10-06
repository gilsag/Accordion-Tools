import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResult, getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools.ts";
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

{
  const em7 = getStradellaChordFinderResults(buttons, "E", "minor7", "bass-and-chords");
  assert.equal(em7[0].exact, true, "Em7 first mixed realization should be exact");
  assert.ok(em7[0].playbackButtons.some((button) => button.kind === "chord-major" && button.chordRoot === "G"), "Em7 should prefer G major in its first mixed realization");
  assert.ok(em7[0].playbackButtons.some((button) => button.kind === "bass-counterbass" && button.pitchClass === "E"), "Em7 should prefer nearby E counterbass + G major");
  assert.ok(em7.length > 1, "Mixed mode should offer more than one realization when alternatives exist");
  for (const candidate of em7.filter((item) => !item.exact)) {
    assert.deepEqual(candidate.extraPitches, [], "Approximate Em7 realizations must not add foreign tones");
    assert.deepEqual(candidate.missingPitches, ["B"], "Approximate Em7 realizations may omit only the fifth, never the seventh");
  }
}

{
  const c7 = getStradellaChordFinderResults(buttons, "C", "dominant7", "bass-and-chords");
  const approximations = c7.filter((candidate) => !candidate.exact);
  assert.ok(approximations.length > 0, "C7 should offer a fifth-omitted approximation when available");
  for (const candidate of approximations) {
    assert.deepEqual(candidate.extraPitches, [], "Approximate C7 realizations must not add foreign tones");
    assert.deepEqual(candidate.missingPitches, ["G"], "Approximate C7 may omit only the fifth G; the seventh Bb must remain");
  }
}

{
  const cmaj7Approx = getStradellaChordFinderResults(buttons, "C", "major7", "bass-and-chords").filter((candidate) => !candidate.exact);
  for (const candidate of cmaj7Approx) {
    assert.deepEqual(candidate.extraPitches, [], "Approximate Cmaj7 realizations must not add foreign tones");
    assert.deepEqual(candidate.missingPitches, ["G"], "Approximate Cmaj7 may omit only the fifth G; the major seventh B must remain");
  }
}

{
  const c7b5 = getStradellaChordFinderResults(buttons, "C", "dominant7b5", "bass-and-chords");
  for (const candidate of c7b5.filter((item) => !item.exact)) {
    assert.equal(candidate.missingPitches.includes("F#"), false, "The altered fifth is defining in C7b5 and must not be omitted");
    assert.deepEqual(candidate.extraPitches, [], "Approximate altered chords must not add foreign tones");
  }
}

{
  const cmaj7 = getStradellaChordFinderResults(buttons, "C", "major7", "bass-and-chords");
  assert.equal(cmaj7[0].exact, true, "Cmaj7 first mixed realization should be exact");
  assert.ok(cmaj7[0].playbackButtons.some((button) => button.kind === "chord-major" && button.chordRoot === "C"), "Cmaj7 should include C major in its first mixed realization");
  assert.ok(cmaj7[0].playbackButtons.some((button) => button.pitchClass === "B" && button.kind.startsWith("bass-")), "Cmaj7 should combine B bass/counterbass with C major");
}

console.log("✓ Stradella chord logic tests passed");
