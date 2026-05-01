import type { AccidentalMode, BassCount, ButtonKind, DiagramButton, StradellaPreset } from "./types";
import { FLAT_NAMES, NATURAL_NAMES, transpose } from "./music";

/*
  Stradella layout logic.

  The diagram is drawn horizontally:
  - each row is a functional row
  - each column is a circle-of-fifths diagonal
  - each lower functional row is shifted to the right
    so roots and their chords align diagonally
*/

/** Canonical order of all standard six Stradella rows. */
export const ALL_STRADELLA_ROWS: ButtonKind[] = [
  "bass-counterbass",
  "bass-root",
  "chord-major",
  "chord-minor",
  "chord-dominant7",
  "chord-diminished7",
];

/** Maps each bass-count preset to its visible columns and available rows. */
export const STRADELLA_PRESETS: Record<BassCount, StradellaPreset> = {
  "8": {
    start: 8,
    count: 4,
    rows: ["bass-root", "chord-major"],
  },
  "12": {
    start: 7,
    count: 6,
    rows: ["bass-root", "chord-major"],
  },
  "24": {
    start: 6,
    count: 8,
    rows: ["bass-root", "chord-major", "chord-minor"],
  },
  "32": {
    start: 6,
    count: 8,
    rows: ["bass-root", "chord-major", "chord-minor", "chord-dominant7"],
  },
  "40": {
    start: 6,
    count: 8,
    rows: ["bass-counterbass", "bass-root", "chord-major", "chord-minor", "chord-dominant7"],
  },
  "48-8x6": {
    start: 6,
    count: 8,
    rows: ALL_STRADELLA_ROWS,
  },
  "48-12x4": {
    start: 4,
    count: 12,
    rows: ["bass-counterbass", "bass-root", "chord-major", "chord-minor"],
  },
  "60": {
    start: 4,
    count: 12,
    rows: ["bass-counterbass", "bass-root", "chord-major", "chord-minor", "chord-dominant7"],
  },
  "72": {
    start: 4,
    count: 12,
    rows: ALL_STRADELLA_ROWS,
  },
  "80": {
    start: 2,
    count: 16,
    rows: ["bass-counterbass", "bass-root", "chord-major", "chord-minor", "chord-dominant7"],
  },
  "96": {
    start: 2,
    count: 16,
    rows: ALL_STRADELLA_ROWS,
  },
  "100": {
    start: 0,
    count: 20,
    rows: ["bass-counterbass", "bass-root", "chord-major", "chord-minor", "chord-dominant7"],
  },
  "120": {
    start: 0,
    count: 20,
    rows: ALL_STRADELLA_ROWS,
  },
};

/*
  Full 120-bass fundamental-bass diagonal order.

  Moving right advances by fifths, so the right side naturally uses sharps.
  Moving left advances by fourths, so the left side naturally uses flats.
*/
/** Fundamental-bass column names for the full 120-bass circle-of-fifths span. */
export const STRADELLA_FULL_120 = [
  "Bbb",
  "Fb",
  "Cb",
  "Gb",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "G#",
  "D#",
  "A#",
];

/** Converts displayed Stradella spellings into normalized internal pitch classes. */
export const STRADELLA_NORMALIZED: Record<string, string> = {
  Bbb: "A",
  Fb: "E",
  Cb: "B",
  Gb: "F#",
  Db: "C#",
  Ab: "G#",
  Eb: "D#",
  Bb: "A#",
  F: "F",
  C: "C",
  G: "G",
  D: "D",
  A: "A",
  E: "E",
  B: "B",
  "F#": "F#",
  "C#": "C#",
  "G#": "G#",
  "D#": "D#",
  "A#": "A#",
};

/** Returns the human-readable row label for a Stradella row kind. */
export function stradellaRowLabel(kind: ButtonKind): string {
  if (kind === "bass-counterbass") return "Major 3rd note";
  if (kind === "bass-root") return "Root note";
  if (kind === "chord-major") return "Major chord";
  if (kind === "chord-minor") return "Minor chord";
  if (kind === "chord-dominant7") return "Dominant 7th chord";
  if (kind === "chord-diminished7") return "Diminished 7th chord";
  return "";
}

/** Returns the visible root column labels for the selected Stradella preset. */
export function stradellaVisibleRoots(basses: BassCount) {
  const preset = STRADELLA_PRESETS[basses];
  return STRADELLA_FULL_120.slice(preset.start, preset.start + preset.count);
}

/** Returns the visible functional rows for the selected Stradella preset. */
export function stradellaVisibleRows(basses: BassCount) {
  return STRADELLA_PRESETS[basses].rows;
}

/**
 * Returns a display name for a Stradella diagonal.
 * Natural mode preserves circle-of-fifths spelling: flats on the left, sharps on the right.
 */
export function stradellaDisplayName(rootName: string, accidental: AccidentalMode) {
  const pitch = STRADELLA_NORMALIZED[rootName];

  if (accidental === "flats") return FLAT_NAMES[pitch] ?? rootName;
  if (accidental === "sharps") return pitch;

  return rootName;
}

/** Chooses a display spelling for a normalized pitch class. */
export function naturalNameForPitch(pitch: string, accidental: AccidentalMode) {
  if (accidental === "sharps") return pitch;
  if (accidental === "flats") return FLAT_NAMES[pitch] ?? pitch;
  return NATURAL_NAMES[pitch] ?? pitch;
}

/**
 * Builds the full set of visible Stradella buttons.
 */
export function generateStradella(
  basses: BassCount,
  buttonSize: number,
  spacing: number,
  accidental: AccidentalMode
): DiagramButton[] {
  const visibleRoots = stradellaVisibleRoots(basses);
  const rows = stradellaVisibleRows(basses);
  const preset = STRADELLA_PRESETS[basses];

  const xGap = buttonSize * spacing * 1.15;
  const yGap = buttonSize * spacing * 0.88;
  const diagonalStep = xGap / 2;

  return rows.flatMap((kind, visualRow) =>
    visibleRoots.map((rootName, column) => {
      const rootPitch = STRADELLA_NORMALIZED[rootName];
      const originalRowIndex = ALL_STRADELLA_ROWS.indexOf(kind);
      const isCounterbass = kind === "bass-counterbass";
      const pitchClass = isCounterbass ? transpose(rootPitch, 4) : rootPitch;

      /* Counterbass is the major third above the fundamental bass. */
      const counterbassDiagonal = STRADELLA_FULL_120[column + preset.start + 4] ?? rootName;
      const counterbassName = isCounterbass
        ? stradellaDisplayName(counterbassDiagonal, accidental)
        : undefined;

      const x = 130 + column * xGap + originalRowIndex * diagonalStep;
      const y = 135 + visualRow * yGap;

      const isReference = kind === "bass-root" && ["C", "E", "G#"].includes(rootPitch);

      return {
        id: `stradella-${kind}-${column}`,
        x,
        y,
        row: visualRow,
        column,
        kind,
        pitchClass,
        naturalName: isCounterbass
          ? counterbassName ?? naturalNameForPitch(pitchClass, accidental)
          : stradellaDisplayName(rootName, accidental),
        chordRoot: rootPitch,
        chordNaturalName: stradellaDisplayName(rootName, accidental),
        isReference,
      };
    })
  );
}
