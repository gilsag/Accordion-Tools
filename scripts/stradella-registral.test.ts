import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResult, getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools.ts";
import { analyzeStradellaRegistralVoicing } from "../src/tools/stradellaChordFinder/registralAnalysis.ts";
import type { DiagramButton } from "../src/types.ts";

const buttons = generateStradella("96", 38, 1.18, "natural");
const bass = (pitch: string, kind: DiagramButton["kind"] = "bass-root") => {
  const found = buttons.find((button) => button.kind === kind && button.pitchClass === pitch);
  assert.ok(found, `Expected ${pitch} ${kind} button`);
  return found;
};
const chord = (pitch: string, kind: DiagramButton["kind"] = "chord-major") => {
  const found = buttons.find((button) => button.kind === kind && button.chordRoot === pitch);
  assert.ok(found, `Expected ${pitch} ${kind} button`);
  return found;
};
const analyze = (root: string, selected: DiagramButton[]) => analyzeStradellaRegistralVoicing(selected, root);

// A single root bass establishes separate bass support, regardless of
// whether the root was already supplied by the preset chord.
{
  const a = analyze("C", [bass("C"), chord("C")]);
  assert.equal(a.confidence, "button-structure-only");
  assert.equal(a.rootBassSupported, true);
  assert.equal(a.rootInPresetChords, true);
  assert.equal(a.bassRole, "root");
  assert.deepEqual(a.bassChordOverlaps, ["C"]);
  assert.equal(a.inversionCharacter, "root-supported");
  assert.equal(a.potentialSlashBass, null);
}

// Seventh-in-the-bass: a structural slash-like character, not a claim that
// the actual instrument's lowest sounding reed is B.
{
  const a = analyze("C", [bass("B", "bass-counterbass"), chord("C")]);
  assert.equal(a.rootPitchClassPresent, true);
  assert.equal(a.rootBassSupported, false);
  assert.equal(a.rootInPresetChords, true);
  assert.equal(a.bassRole, "non-root");
  assert.equal(a.emphasizedBassPitchClass, "B");
  assert.equal(a.potentialSlashBass, "B");
  assert.equal(a.inversionCharacter, "potential-slash");
}

// If no bass button is played, root support must not be inferred from chord tones.
{
  const a = analyze("C", [chord("C")]);
  assert.equal(a.rootPitchClassPresent, true);
  assert.equal(a.rootBassSupported, false);
  assert.equal(a.bassRole, "none");
  assert.deepEqual(a.bassPitchClasses, []);
  assert.equal(a.inversionCharacter, "indeterminate");
  assert.equal(a.hasPresetChordRegister, true);
}

// Several bass pitch classes do not imply one unambiguous lowest note.
{
  const a = analyze("C", [bass("C"), bass("E"), chord("C")]);
  assert.equal(a.bassRole, "multiple-with-root");
  assert.equal(a.rootBassSupported, true);
  assert.equal(a.emphasizedBassPitchClass, null);
  assert.equal(a.potentialSlashBass, null);
  assert.equal(a.inversionCharacter, "indeterminate");
  const b = analyze("C", [bass("B"), bass("D"), chord("C")]);
  assert.equal(b.bassRole, "multiple-without-root");
  assert.equal(b.rootBassSupported, false);
  assert.equal(b.inversionCharacter, "indeterminate");
}

// Bass-only mode contains multiple notes; do not invent a chord-register voicing.
{
  const a = analyze("C", [bass("C"), bass("E"), bass("G")]);
  assert.equal(a.chordButtonCount, 0);
  assert.equal(a.hasPresetChordRegister, false);
  assert.equal(a.inversionCharacter, "indeterminate");
  assert.equal(a.rootBassSupported, true);
  assert.deepEqual(a.presetChordPitchClasses, []);
}

// Actual Chord Finder results: playing metadata, not diagram highlights.
{
  const em7 = getStradellaChordFinderResults(buttons, "E", "minor7", "bass-and-chords")[0];
  assert.equal(em7.registral.bassRole, "root");
  assert.equal(em7.registral.rootBassSupported, true);
  assert.equal(em7.registral.inversionCharacter, "root-supported");

  const cmaj7 = getStradellaChordFinderResults(buttons, "C", "major7", "bass-and-chords")[0];
  assert.equal(cmaj7.registral.bassRole, "non-root");
  assert.equal(cmaj7.registral.potentialSlashBass, "B");

  const withMarker = getStradellaChordFinderResult(buttons, "C", "major-triad", "chord-buttons-only", true);
  const withoutMarker = getStradellaChordFinderResult(buttons, "C", "major-triad", "chord-buttons-only", false);
  assert.ok(withMarker.rootBassButtonIds.length > 0, "Visual root marker should exist");
  assert.ok(withMarker.buttons.length > withMarker.playbackButtons.length, "Marker must not sound");
  assert.deepEqual(withMarker.registral, withoutMarker.registral, "Visual marker must not affect registral analysis");
  assert.equal(withMarker.registral.rootBassSupported, false);
  assert.equal(withMarker.registral.bassRole, "none");

  const bassOnly = getStradellaChordFinderResult(buttons, "C", "major-triad", "bass-only");
  assert.equal(bassOnly.registral.bassRole, "multiple-with-root");
  assert.equal(bassOnly.registral.hasPresetChordRegister, false);

  const unplayable = getStradellaChordFinderResult(buttons, "C", "augmented-triad", "chord-buttons-only");
  assert.equal(unplayable.playable, false);
  assert.equal(unplayable.registral.bassRole, "none");
  assert.equal(unplayable.registral.rootPitchClassPresent, false);
}

// Representative extensions: registral fields must correspond to the exact
// physical realization that survives existing search/ranking filtering.
{
  const candidates = getStradellaChordFinderResults(buttons, "C", "major13", "bass-and-chords", true, 4, 5.5);
  const isRecipe = (candidate: (typeof candidates)[number], requested: string[]) => {
    const names = candidate.playbackButtons.map((button) =>
      button.kind.startsWith("bass-") ? `bass:${button.pitchClass}` : `${button.kind}:${button.chordRoot}`);
    return names.length === requested.length && requested.every((name) => names.includes(name));
  };
  const aMinorWithBBass = candidates.find((item) => isRecipe(item, ["chord-minor:A", "bass:B"]));
  assert.ok(aMinorWithBBass, "Cmaj13 harmonic shell should remain present");
  assert.equal(aMinorWithBBass.registral.potentialSlashBass, "B");
  assert.equal(aMinorWithBBass.registral.rootBassSupported, false);
  assert.equal(aMinorWithBBass.exact, false);

  const aMinorWithDDiminished = candidates.find((item) =>
    isRecipe(item, ["chord-minor:A", "chord-diminished7:D"]));
  assert.ok(aMinorWithDDiminished, "Cmaj13 compact chord-only realization should remain present");
  assert.equal(aMinorWithDDiminished.registral.bassRole, "none");
  assert.equal(aMinorWithDDiminished.registral.hasPresetChordRegister, true);
  assert.equal(aMinorWithDDiminished.registral.inversionCharacter, "indeterminate");
}

console.log("✓ Stradella registral structural interpretation tests passed");
