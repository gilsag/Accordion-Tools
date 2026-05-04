import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { formatPitch } from "../src/music.tsx";
import { chordFinderLabel, intervalsForChordFinder } from "../src/music/chordDefinitions.ts";
import type { AccidentalMode, FinderChordPattern, NotationMode } from "../src/types.ts";

function formattedChordTones(
  root: string,
  pattern: FinderChordPattern,
  notation: NotationMode,
  accidental: AccidentalMode,
) {
  return intervalsForChordFinder(pattern).map((interval) => {
    const pitches = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const rootIndex = pitches.indexOf(root);
    return formatPitch(pitches[(rootIndex + interval + 120) % 12], notation, accidental);
  });
}

{
  assert.equal(formatPitch("A#", "english", "natural"), "Bb", "English natural spelling should use Bb for A#.");
  assert.equal(formatPitch("A#", "english", "sharps"), "A#", "English sharps should preserve A#.");
  assert.equal(formatPitch("A#", "english", "flats"), "Bb", "English flats should use Bb.");
}

{
  assert.equal(formatPitch("B", "german", "natural"), "H", "German notation should use H for English B.");
  assert.equal(formatPitch("A#", "german", "natural"), "B", "German notation should use B for English Bb.");
  assert.equal(formatPitch("F#", "german", "sharps"), "Fis", "German sharp names should use -is spellings.");
  assert.equal(formatPitch("D#", "german", "flats"), "Es", "German flat names should use traditional flat spellings.");
}

{
  assert.equal(formatPitch("A#", "solfege", "flats"), "Sib", "Solfege flats should use Sib.");
  assert.equal(formatPitch("F#", "solfege", "sharps"), "Fa#", "Solfege sharps should use Fa#.");
  assert.equal(formatPitch("D#", "intervals", "natural"), "b3", "Interval notation should ignore note spelling and show interval labels.");
  assert.equal(formatPitch("C", "blank", "natural"), "", "Blank notation should suppress note names.");
}

{
  const naturalButtons = generateStradella("96", 38, 1.18, "natural");
  const flatSide = naturalButtons.find((button) => button.kind === "bass-root" && button.chordNaturalName === "Bb");
  const sharpSide = naturalButtons.find((button) => button.kind === "bass-root" && button.chordNaturalName === "F#");
  assert.equal(flatSide?.naturalName, "Bb", "Stradella natural spelling should preserve flat-side button labels.");
  assert.equal(sharpSide?.naturalName, "F#", "Stradella natural spelling should preserve sharp-side button labels.");

  const forcedSharps = generateStradella("96", 38, 1.18, "sharps");
  const bbAsSharp = forcedSharps.find((button) => button.kind === "bass-root" && button.pitchClass === "A#");
  assert.equal(bbAsSharp?.naturalName, "A#", "Forced sharps should change Bb-pitch Stradella labels to A#.");

  const forcedFlats = generateStradella("96", 38, 1.18, "flats");
  const fSharpAsFlat = forcedFlats.find((button) => button.kind === "bass-root" && button.pitchClass === "F#");
  assert.equal(fSharpAsFlat?.naturalName, "Gb", "Forced flats should change F#-pitch Stradella labels to Gb.");
}

{
  assert.equal(chordFinderLabel("major9"), "Major 9 / Maj7(9)", "Major 9 should use the systematic combined dropdown label.");
  assert.deepEqual(
    formattedChordTones("C", "dominant7b9", "english", "flats"),
    ["C", "E", "G", "Bb", "Db"],
    "Dominant 7b9 explanation tones should format with the selected accidentals.",
  );
  assert.deepEqual(
    formattedChordTones("C", "minor7b5", "german", "flats"),
    ["C", "Es", "Ges", "B"],
    "German half-diminished tones should use the same spelling style as German labels.",
  );
}

console.log("✓ Notation and spelling tests passed");
