/*
  Shared chord definitions used by both treble and Stradella chord finders.

  Treble finder uses these intervals directly to locate notes on the right-hand
  layout. Stradella finder uses the same target intervals, then applies
  Stradella-specific button recipes and voicings.
*/

import type { FinderChordPattern } from "../types";

/** Chord labels shown in the Chord Finder UI. */
export const CHORD_FINDER_OPTIONS: Array<{ value: FinderChordPattern; label: string }> = [
  { value: "major-triad", label: "Major" },
  { value: "minor-triad", label: "Minor" },
  { value: "augmented-triad", label: "Augmented" },
  { value: "diminished-triad", label: "Diminished" },
  { value: "sus4", label: "Suspended 4" },
  { value: "major6", label: "Major 6" },
  { value: "minor6", label: "Minor 6" },
  { value: "dominant7", label: "Dominant 7" },
  { value: "major7", label: "Major 7" },
  { value: "minor7", label: "Minor 7" },
  { value: "minorMajor7", label: "Minor major 7" },
  { value: "diminished7", label: "Diminished 7" },
  { value: "minor7b5", label: "Minor 7♭5" },
  { value: "dominant7b5", label: "Dominant 7♭5" },
  { value: "dominant7b9", label: "Dominant 7♭9" },
  { value: "dominant9", label: "Dominant 9" },
  { value: "dominant9sus4", label: "Dominant 9sus4" },
  { value: "dominant11", label: "Dominant 11" },
  { value: "major9", label: "Major 9 / Maj7(9)" },
  { value: "minor9", label: "Minor 9" },
  { value: "minorMajor9", label: "Minor major 9" },
];

/** Returns the interval pattern, in semitones, for a Finder chord in root position. */
export function intervalsForChordFinder(pattern: FinderChordPattern) {
  if (pattern === "major-triad") return [0, 4, 7];
  if (pattern === "minor-triad") return [0, 3, 7];
  if (pattern === "augmented-triad") return [0, 4, 8];
  if (pattern === "diminished-triad") return [0, 3, 6];
  if (pattern === "sus4") return [0, 5, 7];
  if (pattern === "major6") return [0, 4, 7, 9];
  if (pattern === "minor6") return [0, 3, 7, 9];
  if (pattern === "dominant7") return [0, 4, 7, 10];
  if (pattern === "major7") return [0, 4, 7, 11];
  if (pattern === "minor7") return [0, 3, 7, 10];
  if (pattern === "minorMajor7") return [0, 3, 7, 11];
  if (pattern === "diminished7") return [0, 3, 6, 9];
  if (pattern === "minor7b5") return [0, 3, 6, 10];
  if (pattern === "dominant7b5") return [0, 4, 6, 10];
  if (pattern === "dominant7b9") return [0, 4, 7, 10, 13];
  if (pattern === "dominant9") return [0, 4, 7, 10, 14];
  if (pattern === "dominant9sus4") return [0, 5, 7, 10, 14];
  if (pattern === "dominant11") return [0, 4, 7, 10, 14, 17];
  if (pattern === "major9" || pattern === "major7add9") return [0, 4, 7, 11, 14];
  if (pattern === "minor9") return [0, 3, 7, 10, 14];
  if (pattern === "minorMajor9") return [0, 3, 7, 11, 14];
  return [0];
}

export function chordFinderLabel(pattern: FinderChordPattern) {
  return CHORD_FINDER_OPTIONS.find((option) => option.value === pattern)?.label ?? pattern;
}
