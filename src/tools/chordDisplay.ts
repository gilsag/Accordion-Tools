/** Visual chord notation only. Do not use these names as chord identifiers,
 * notation-parser input, or download filenames. */
import type { FinderChordPattern, ButtonKind } from "../types";

export type ChordDisplayStyle = "compact" | "letter" | "words";
export const DEFAULT_CHORD_DISPLAY_STYLE: ChordDisplayStyle = "letter";

const SUFFIXES: Record<ChordDisplayStyle, Partial<Record<FinderChordPattern, string>>> = {
  compact: { "majorAdd9": "add9", "minorAdd9": "m(add9)", "major6add9": "6/9", "minor6add9": "m6/9", "major7sharp11": "maj7♯11", "major-triad": "", "minor-triad": "m", "major6": "6", "minor6": "m6", "major7": "maj7", "minor7": "m7", "major9": "maj9", "minor9": "m9", "major11": "maj11", "minor11": "m11", "major13": "maj13", "minor13": "m13", "minorMajor7": "m(maj7)", "minorMajor9": "m(maj9)", "minor7b5": "m7♭5" },
  letter: { "majorAdd9": "Madd9", "minorAdd9": "m(add9)", "major6add9": "M6/9", "minor6add9": "m6/9", "major7sharp11": "M7♯11", "major-triad": "M", "minor-triad": "m", "major6": "M6", "minor6": "m6", "major7": "M7", "minor7": "m7", "major9": "M9", "minor9": "m9", "major11": "M11", "minor11": "m11", "major13": "M13", "minor13": "m13", "minorMajor7": "m(M7)", "minorMajor9": "m(M9)", "minor7b5": "m7♭5" },
  words: { "majorAdd9": "maj(add9)", "minorAdd9": "min(add9)", "major6add9": "maj6/9", "minor6add9": "min6/9", "major7sharp11": "maj7♯11", "major-triad": "maj", "minor-triad": "min", "major6": "maj6", "minor6": "min6", "major7": "maj7", "minor7": "min7", "major9": "maj9", "minor9": "min9", "major11": "maj11", "minor11": "min11", "major13": "maj13", "minor13": "min13", "minorMajor7": "minMaj7", "minorMajor9": "minMaj9", "minor7b5": "min7♭5" },
};

const OTHER_SUFFIXES: Partial<Record<FinderChordPattern, string>> = {
  "augmented-triad": "aug", "diminished-triad": "dim", sus4: "sus4", sus2: "sus2", dominant7sus4: "7sus4", dominant7sharp5: "7♯5", dominant7sharp9: "7♯9",
  dominant7: "7", diminished7: "dim7", dominant7b5: "7♭5", dominant7b9: "7♭9",
  dominant9: "9", dominant9sus4: "9sus4", dominant11: "11", dominant13: "13",
  major7add9: "maj7add9",
};

export function displayFinderChord(root: string, pattern: FinderChordPattern, style: ChordDisplayStyle): string {
  const suffix = SUFFIXES[style][pattern] ?? OTHER_SUFFIXES[pattern] ?? "";
  return `${root.replace(/#/g, "♯").replace(/([A-G])b(?=$|[0-9])/g, "$1♭")}${suffix}`;
}

/** Keep the selected realization's slash bass, but never reinterpret its root. */
export function displayRealizedChord(root: string, pattern: FinderChordPattern, canonical: string, style: ChordDisplayStyle): string {
  const slash = canonical.indexOf("/");
  return `${displayFinderChord(root, pattern, style)}${slash >= 0 ? canonical.slice(slash) : ""}`;
}

export function displayStradellaButtonChord(root: string, kind: ButtonKind, style: ChordDisplayStyle): string {
  const pattern: FinderChordPattern = kind === "chord-major" ? "major-triad"
    : kind === "chord-minor" ? "minor-triad"
    : kind === "chord-dominant7" ? "dominant7" : "diminished7";
  return displayFinderChord(root, pattern, style);
}
