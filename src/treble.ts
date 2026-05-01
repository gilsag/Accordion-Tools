import type { DiagramButton, TrebleSizePreset, TrebleSystem } from "./types";
import { PITCH_INDEX, transpose } from "./music";

/*
  Treble-side layout generation.

  Internal naming and interface spelling are intentionally separated here:

  - `start` and `step` define the internal pitch identity used by the code.
    These values are normalized pitch classes such as C, C#, D, etc.

  - `displayCycle` defines how those same pitches should be shown when the
    user selects Accidentals = Default spelling. This lets the interface show
    F# or Gb without changing the internal pitch identity.

  To customize a layout manually, edit TREBLE_SYSTEM_DEFINITIONS below.
*/

type TrebleRowDefinition = {
  /* Internal normalized pitch-class start, used for transposition. */
  start: string;

  /* Internal semitone movement from one button to the next in this row. */
  step: number;

  /* Interface labels used for Default spelling. Repeats every four buttons. */
  displayCycle: string[];

  /* Octave of the first button in the row. */
  startOctave: number;
};

type TrebleSystemDefinition = {
  rows: TrebleRowDefinition[];
};

type TrebleSizeDefinition = {
  baseColumns: number;
};

/*
  Musical mapping.

  Rows are counted bottom-to-top:
    row 0 = bottom row
    row 1 = second row
    row 2 = third row
    row 3 = fourth row
    row 4 = fifth/top row

  The notes in each row advance by minor thirds.
*/
const TREBLE_SYSTEM_DEFINITIONS: Record<TrebleSystem, TrebleSystemDefinition> = {
  "c-system": {
    rows: [
      { start: "F#", step: 3, displayCycle: ["F#", "A", "C", "Eb"], startOctave: 3 },
      { start: "E", step: 3, displayCycle: ["E", "G", "Bb", "C#"], startOctave: 3 },
      { start: "F", step: 3, displayCycle: ["F", "Ab", "B", "D"], startOctave: 3 },
      { start: "D#", step: 3, displayCycle: ["Eb", "F#", "A", "C"], startOctave: 3 },
      { start: "E", step: 3, displayCycle: ["E", "G", "Bb", "C#"], startOctave: 3 },
    ],
  },

  "b-system": {
    rows: [
      { start: "B", step: 3, displayCycle: ["B", "D", "F", "Ab"], startOctave: 3 },
      { start: "A#", step: 3, displayCycle: ["Bb", "C#", "E", "G"], startOctave: 3 },
      { start: "C", step: 3, displayCycle: ["C", "Eb", "Gb", "A"], startOctave: 4 },
      { start: "B", step: 3, displayCycle: ["B", "D", "F", "Ab"], startOctave: 3 },
      { start: "C#", step: 3, displayCycle: ["C#", "E", "G", "Bb"], startOctave: 4 },
    ],
  },
};

/*
  Treble size presets.

  baseColumns is the normal row length.
  Rows 2 and 4 receive one extra button automatically.

  To customize the size presets manually, edit these values.
*/
const TREBLE_SIZE_PRESETS: Record<TrebleSizePreset, TrebleSizeDefinition> = {
  small: {
    baseColumns: 14,
  },
  full: {
    baseColumns: 18,
  },
  large: {
    baseColumns: 24,
  },
};

/*
  Physical left-edge row grouping.

  These are full-button offsets.
*/
const ROW_GROUP_OFFSETS = [0, -1, -1, -2, -2];

/*
  Rows 2 and 4 have one extra button.

  Zero-indexed:
    row 1 = second row
    row 3 = fourth row
*/
/** Returns the extra button count for longer physical rows. */
function getExtraColumnsForRow(row: number) {
  return row === 1 || row === 3 ? 1 : 0;
}

/*
  Horizontal displacement needed so the diagonal is `angle` degrees
  from the vertical.
*/
/** Converts the requested diagonal angle into a horizontal row offset. */
function getDiagonalDx(yGap: number, angle: number) {
  const angleRadians = (angle * Math.PI) / 180;
  return yGap * Math.tan(angleRadians);
}

/** Picks the layout-defined spelling shown when Accidentals = Default spelling. */
function getDisplayNameForColumn(rowDefinition: TrebleRowDefinition, column: number) {
  return rowDefinition.displayCycle[column % rowDefinition.displayCycle.length];
}

/** Calculates the octave number for a button from the row start octave and semitone offset. */
function getOctaveNumber(rowDefinition: TrebleRowDefinition, semitoneOffset: number) {
  const startIndex = PITCH_INDEX[rowDefinition.start];
  const absoluteSemitone = rowDefinition.startOctave * 12 + startIndex + semitoneOffset;

  return Math.floor(absoluteSemitone / 12);
}

/** Builds the treble-side button geometry and note metadata for the selected preset. */
export function generateTreble(
  system: TrebleSystem,
  rows: 3 | 4 | 5,
  sizePreset: TrebleSizePreset,
  buttonSize: number,
  spacing: number,
  angle: number,
  showOctaves: boolean
): DiagramButton[] {
  const systemDefinition = TREBLE_SYSTEM_DEFINITIONS[system];
  const sizeDefinition = TREBLE_SIZE_PRESETS[sizePreset];

  const xGap = buttonSize * spacing;
  const yGap = buttonSize * spacing * 0.88;

  const diagonalDx = getDiagonalDx(yGap, angle);

  return Array.from({ length: rows }).flatMap((_, row) => {
    const rowDefinition = systemDefinition.rows[row];

    const columns = sizeDefinition.baseColumns + getExtraColumnsForRow(row);

    const groupOffsetPx = ROW_GROUP_OFFSETS[row] * xGap;
    const diagonalOffsetPx = row * diagonalDx;

    return Array.from({ length: columns }).map((_, column) => {
      const semitoneOffset = column * rowDefinition.step;
      const pitchClass = transpose(rowDefinition.start, semitoneOffset);
      const octave = getOctaveNumber(rowDefinition, semitoneOffset);
      const displayName = getDisplayNameForColumn(rowDefinition, column);

      const visualRow = rows - 1 - row;

      return {
        id: `treble-${row}-${column}`,
        x: 110 + column * xGap + groupOffsetPx + diagonalOffsetPx,
        y: 128 + visualRow * yGap,
        row,
        column,
        kind: "treble-note" as const,
        pitchClass,
        displayName,
        octave: showOctaves ? octave : undefined,
        soundOctave: octave,
      };
    });
  });
}
