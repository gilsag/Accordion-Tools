import type { AccidentalMode, ButtonKind, FontFamily, NotationMode } from "./types";

/*
  Shared pitch spelling tables.

  Internally, the app stores pitch classes using sharp names:
  C, C#, D, D#, etc.

  Display names are then chosen based on notation settings.
*/

export const FLAT_NAMES: Record<string, string> = {
  C: "C",
  "C#": "Db",
  D: "D",
  "D#": "Eb",
  E: "E",
  F: "F",
  "F#": "Gb",
  G: "G",
  "G#": "Ab",
  A: "A",
  "A#": "Bb",
  B: "B",
};

export const SOLFEGE_SHARP: Record<string, string> = {
  C: "Do",
  "C#": "Do#",
  D: "Re",
  "D#": "Re#",
  E: "Mi",
  F: "Fa",
  "F#": "Fa#",
  G: "Sol",
  "G#": "Sol#",
  A: "La",
  "A#": "La#",
  B: "Si",
};

export const SOLFEGE_FLAT: Record<string, string> = {
  C: "Do",
  "C#": "Reb",
  D: "Re",
  "D#": "Mib",
  E: "Mi",
  F: "Fa",
  "F#": "Solb",
  G: "Sol",
  "G#": "Lab",
  A: "La",
  "A#": "Sib",
  B: "Si",
};

export const INTERVALS_FROM_C: Record<string, string> = {
  C: "1",
  "C#": "b2",
  D: "2",
  "D#": "b3",
  E: "3",
  F: "4",
  "F#": "b5",
  G: "5",
  "G#": "b6",
  A: "6",
  "A#": "b7",
  B: "7",
};

export const NATURAL_NAMES: Record<string, string> = {
  C: "C",
  "C#": "Db",
  D: "D",
  "D#": "Eb",
  E: "E",
  F: "F",
  "F#": "Gb",
  G: "G",
  "G#": "Ab",
  A: "A",
  "A#": "Bb",
  B: "B",
};

export const PITCH_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export const INDEX_TO_PITCH = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/**
 * Transposes a pitch class by a number of semitones.
 */
export function transpose(pitch: string, semitones: number): string {
  const index = PITCH_INDEX[pitch];
  return INDEX_TO_PITCH[(index + semitones + 120) % 12];
}

/**
 * Converts an internal pitch class into the selected visible notation.
 */
export function formatPitch(
  pitch: string | undefined,
  notation: NotationMode,
  accidental: AccidentalMode,
  naturalName?: string
): string {
  if (!pitch || notation === "blank") return "";

  if (notation === "intervals") return INTERVALS_FROM_C[pitch] ?? pitch;

  if (notation === "solfege") {
    if (accidental === "sharps") return SOLFEGE_SHARP[pitch] ?? pitch;
    return SOLFEGE_FLAT[pitch] ?? pitch;
  }

  if (accidental === "natural") return naturalName ?? NATURAL_NAMES[pitch] ?? pitch;
  if (accidental === "flats") return FLAT_NAMES[pitch] ?? pitch;
  return pitch;
}

/**
 * Renders b/# characters as proper music symbols.
 * The symbols are slightly lowered to mimic accordion chart notation.
 */
export function renderMusicLabel(label: string) {
  return label.split("").map((char, index) => {
    if (char === "#") {
      return (
        <tspan key={index} className="accidental-symbol" baselineShift="-18%">
          ♯
        </tspan>
      );
    }

    if (char === "b") {
      return (
        <tspan key={index} className="accidental-symbol" baselineShift="-18%">
          ♭
        </tspan>
      );
    }

    return <tspan key={index}>{char}</tspan>;
  });
}

export function isAccidentalPitch(pitch: string | undefined): boolean {
  return Boolean(pitch && pitch.includes("#"));
}

export function chordSuffix(kind: ButtonKind): string {
  if (kind === "chord-major") return "";
  if (kind === "chord-minor") return "m";
  if (kind === "chord-dominant7") return "7";
  if (kind === "chord-diminished7") return "d";
  return "";
}

export function rowFunction(kind: ButtonKind): string {
  if (kind === "chord-major") return "M";
  if (kind === "chord-minor") return "m";
  if (kind === "chord-dominant7") return "7";
  if (kind === "chord-diminished7") return "d";
  return "";
}

export function isChordKind(kind: ButtonKind) {
  return kind.startsWith("chord");
}

/**
 * Generates visible chord tones for chord-tone label mode.
 *
 * Modern Stradella dominant seventh and diminished buttons usually omit the fifth:
 * - 7th chord: 1-3-b7
 * - diminished chord: 1-b3-bb7
 */
export function chordTones(
  root: string,
  kind: ButtonKind,
  notation: NotationMode,
  accidental: AccidentalMode
) {
  if (notation === "blank") return "";

  const intervals =
    kind === "chord-major"
      ? [0, 4, 7]
      : kind === "chord-minor"
      ? [0, 3, 7]
      : kind === "chord-dominant7"
      ? [0, 4, 10]
      : kind === "chord-diminished7"
      ? [0, 3, 9]
      : [0];

  return intervals.map((i) => formatPitch(transpose(root, i), notation, accidental)).join("-");
}

export function fontClass(font: FontFamily): string {
  return `font-${font}`;
}
