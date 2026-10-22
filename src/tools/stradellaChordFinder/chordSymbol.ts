import type { FinderChordPattern } from "../../types";

const suffix: Partial<Record<FinderChordPattern, string>> = {
  "major-triad": "maj", "minor-triad": "min", "augmented-triad": "aug",
  "diminished-triad": "dim", "sus4": "sus4", "major6": "maj6",
  "minor6": "min6", "dominant7": "7", "major7": "maj7", "minor7": "min7",
  "minorMajor7": "minMaj7", "diminished7": "dim7", "minor7b5": "min7b5",
  "dominant7b5": "7b5", "dominant7b9": "7b9", "dominant9": "9",
  "dominant9sus4": "9sus4", "dominant11": "11", "major9": "maj9",
  "major7add9": "maj7add9", "minor9": "min9", "minorMajor9": "minMaj9",
  "major11": "maj11", "minor11": "min11", "dominant13": "13",
  "major13": "maj13", "minor13": "min13",
};

export function finderChordSymbol(root: string, pattern: FinderChordPattern) {
  return `${root}${suffix[pattern] ?? ""}`;
}
