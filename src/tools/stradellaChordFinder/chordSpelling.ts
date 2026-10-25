/* Musical spelling is a presentation layer: the Chord Finder continues to
 * search, compare and play chromatic pitch classes. Spell the requested chord
 * by diatonic scale degree, not by a global sharps/flats display setting.
 * For example Cmin7 = C–E♭–G–B♭, while C♯maj7 uses E♯ rather than F.
 */
import type { FinderChordPattern } from "../../types";
import { PITCH_INDEX, transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

function degreeIndex(interval: number, pattern: FinderChordPattern): number {
  if (interval === 0) return 0;
  if (interval === 2) return 1; // suspended second
  if (interval === 3 || interval === 4) return 2; // third
  if (interval === 5) return 3; // suspended fourth
  if (interval >= 6 && interval <= 8) return 4; // fifth
  if (interval === 9) return pattern === "diminished7" ? 6 : 5; // dim seventh vs sixth
  if (interval === 10 || interval === 11) return 6; // seventh
  if (interval === 13 || interval === 14 || interval === 15) return 8; // ninth
  if (interval === 17 || interval === 18) return 10; // eleventh
  if (interval === 21) return 12; // thirteenth
  return 0;
}

function formatAccidental(offset: number): string {
  if (offset === -2) return "𝄫";
  if (offset === -1) return "♭";
  if (offset === 1) return "♯";
  if (offset === 2) return "𝄪";
  return "";
}

/** Display the requested root, without changing its internal pitch-class ID. */
export function displayRoot(root: string): string {
  return root.replace(/#/g, "♯").replace(/b/g, "♭");
}

/** Spell the theoretical chord tones and index them by INTERNAL pitch class. */
export function chordToneSpellings(root: string, pattern: FinderChordPattern): Map<string, string> {
  const spelling = new Map<string, string>();
  const rootIndex = PITCH_INDEX[root];
  if (rootIndex === undefined) return spelling;
  const rootLetter = LETTERS.indexOf(root[0] as typeof LETTERS[number]);
  if (rootLetter < 0) return spelling;
  for (const interval of intervalsForChordFinder(pattern)) {
    const target = transpose(root, interval);
    const letterIndex = (rootLetter + degreeIndex(interval, pattern)) % 7;
    const unaltered = NATURAL_SEMITONES[letterIndex];
    // Choose an accidental within ±2 semitones of the natural note.
    const offset = ((PITCH_INDEX[target] - unaltered + 18) % 12) - 6;
    spelling.set(target, `${LETTERS[letterIndex]}${formatAccidental(offset)}`);
  }
  return spelling;
}

/** Chord-contextual note spelling; do not reinterpret the chord's identity. */
export function chordToneName(root: string, pattern: FinderChordPattern, pitchClass: string): string {
  return chordToneSpellings(root, pattern).get(pitchClass) ?? displayRoot(pitchClass);
}

/** The name of a played chord, which may have an inferred inversion. */
export function realizedChordName(
  root: string,
  pattern: FinderChordPattern,
  requestedBass: string | null,
  lowestPitchClass: string | null | undefined,
  symbol: string,
): string {
  const bass = requestedBass ?? lowestPitchClass;
  if (!bass || bass === root || !chordToneSpellings(root, pattern).has(bass)) return symbol;
  return `${symbol}/${chordToneName(root, pattern, bass)}`;
}

/** Numbered inversions are conventional for triads and seventh chords.
 * For six/nine/eleven/thirteen chords, describe the bass role instead.
 */
export function realizedInversionDescription(root: string, pattern: FinderChordPattern, bass: string | null): string | null {
  if (!bass || bass === root) return null;
  const intervals = intervalsForChordFinder(pattern);
  const bassIndex = intervals.findIndex((i) => transpose(root, i) === bass);
  if (bassIndex < 0) return null;
  const simpleTriad = ["major-triad", "minor-triad", "diminished-triad", "augmented-triad", "sus2", "sus4"].includes(pattern);
  const seventhChord = ["dominant7sus4", "dominant7sharp5", "dominant7", "major7", "minor7", "minorMajor7", "diminished7", "minor7b5", "dominant7b5"].includes(pattern);
  if ((simpleTriad || seventhChord) && bassIndex >= 1 && bassIndex <= 3) {
    return ["", "First inversion", "Second inversion", "Third inversion"][bassIndex];
  }
  const degree = degreeIndex(intervals[bassIndex], pattern);
  const roles: Record<number, string> = { 1: "second", 2: "third", 3: "fourth", 4: "fifth", 5: "sixth", 6: "seventh", 8: "ninth", 10: "eleventh", 12: "thirteenth" };
  return `${roles[degree] ?? "Chord tone"} in bass`;
}

/** Avoid slashes, accidentals, Unicode, reserved punctuation in exported names. */
export function safeChordFilenameKey(value: string): string {
  return value
    .replace(/𝄫/g, "doubleflat").replace(/𝄪/g, "doublesharp")
    .replace(/♭/g, "flat").replace(/♯/g, "sharp")
    .replace(/#/g, "sharp").replace(/\//g, "-over-")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Keep density warnings consistent with the chord-tone spelling. */
export function spellDensityNote(note: string, root: string, pattern: FinderChordPattern): string {
  return note.replace(/\b([A-G](?:#)?)(\d+)\b/g, (_, pc: string, oct: string) =>
    `${chordToneName(root, pattern, pc)}${oct}`);
}
