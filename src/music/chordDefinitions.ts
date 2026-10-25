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
  { value: "diminished-triad", label: "Diminished" },
  { value: "augmented-triad", label: "Augmented" },
  { value: "sus2", label: "Suspended 2" },
  { value: "sus4", label: "Suspended 4" },
  { value: "majorAdd9", label: "Major add9" },
  { value: "minorAdd9", label: "Minor add9" },
  { value: "major6", label: "Major 6" },
  { value: "minor6", label: "Minor 6" },
  { value: "dominant7", label: "Dominant 7" },
  { value: "dominant7sus4", label: "Dominant 7sus4" },
  { value: "dominant7sharp5", label: "Dominant 7♯5" },
  { value: "major7", label: "Major 7" },
  { value: "minor7", label: "Minor 7" },
  { value: "minorMajor7", label: "Minor-major 7" },
  { value: "diminished7", label: "Diminished 7" },
  { value: "minor7b5", label: "Minor 7♭5" },
  { value: "dominant7b5", label: "Dominant 7♭5" },
  { value: "major6add9", label: "Major 6/9" },
  { value: "minor6add9", label: "Minor 6/9" },
  { value: "dominant7sharp9", label: "Dominant 7♯9" },
  { value: "major7sharp11", label: "Major 7♯11" },
  { value: "dominant7b9", label: "Dominant 7♭9" },
  { value: "dominant9", label: "Dominant 9" },
  { value: "major9", label: "Major 9" },
  { value: "minor9", label: "Minor 9" },
  { value: "minorMajor9", label: "Minor-major 9" },
  { value: "dominant9sus4", label: "Dominant 9sus4" },
  { value: "dominant11", label: "Dominant 11" },
  { value: "major11", label: "Major 11" },
  { value: "minor11", label: "Minor 11" },
  { value: "dominant13", label: "Dominant 13" },
  { value: "major13", label: "Major 13" },
  { value: "minor13", label: "Minor 13" },
];

/** Returns the interval pattern, in semitones, for a Finder chord in root position. */
export function intervalsForChordFinder(pattern: FinderChordPattern) {
  if (pattern === "major-triad") return [0, 4, 7];
  if (pattern === "minor-triad") return [0, 3, 7];
  if (pattern === "augmented-triad") return [0, 4, 8];
  if (pattern === "diminished-triad") return [0, 3, 6];
  if (pattern === "sus2") return [0, 2, 7];
  if (pattern === "sus4") return [0, 5, 7];
  if (pattern === "majorAdd9") return [0, 4, 7, 14];
  if (pattern === "minorAdd9") return [0, 3, 7, 14];
  if (pattern === "major6") return [0, 4, 7, 9];
  if (pattern === "minor6") return [0, 3, 7, 9];
  if (pattern === "major6add9") return [0, 4, 7, 9, 14];
  if (pattern === "minor6add9") return [0, 3, 7, 9, 14];
  if (pattern === "dominant7") return [0, 4, 7, 10];
  if (pattern === "dominant7sus4") return [0, 5, 7, 10];
  if (pattern === "dominant7sharp5") return [0, 4, 8, 10];
  if (pattern === "dominant7sharp9") return [0, 4, 7, 10, 15];
  if (pattern === "major7") return [0, 4, 7, 11];
  if (pattern === "major7sharp11") return [0, 4, 7, 11, 18];
  if (pattern === "minor7") return [0, 3, 7, 10];
  if (pattern === "minorMajor7") return [0, 3, 7, 11];
  if (pattern === "diminished7") return [0, 3, 6, 9];
  if (pattern === "minor7b5") return [0, 3, 6, 10];
  if (pattern === "dominant7b5") return [0, 4, 6, 10];
  if (pattern === "dominant7b9") return [0, 4, 7, 10, 13];
  if (pattern === "dominant9") return [0, 4, 7, 10, 14];
  if (pattern === "dominant9sus4") return [0, 5, 7, 10, 14];
  if (pattern === "dominant11") return [0, 4, 7, 10, 14, 17];
  if (pattern === "major11") return [0, 4, 7, 11, 14, 17];
  if (pattern === "minor11") return [0, 3, 7, 10, 14, 17];
  if (pattern === "dominant13") return [0, 4, 7, 10, 14, 17, 21];
  if (pattern === "major13") return [0, 4, 7, 11, 14, 17, 21];
  if (pattern === "minor13") return [0, 3, 7, 10, 14, 17, 21];
  if (pattern === "major9" || pattern === "major7add9") return [0, 4, 7, 11, 14];
  if (pattern === "minor9") return [0, 3, 7, 10, 14];
  if (pattern === "minorMajor9") return [0, 3, 7, 11, 14];
  return [0];
}

export function chordFinderLabel(pattern: FinderChordPattern) {
  return CHORD_FINDER_OPTIONS.find((option) => option.value === pattern)?.label ?? pattern;
}
