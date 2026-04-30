import type { DiagramButton, TrebleSizePreset, TrebleSystem } from "./types";
import { NATURAL_NAMES, PITCH_INDEX, transpose } from "./music";

/*
  Treble-side layout generation.

  Geometry rule:
  A diagonal going up and right should be 30° from the vertical.

  Since SVG coordinates use:
    x = horizontal
    y = vertical

  the horizontal displacement needed for a 30° diagonal is:

    diagonalDx = yGap * tan(30°)

  or, more generally:

    diagonalDx = yGap * tan(angle)

  Row groups:
    rows 1
    rows 2–3 start one full button left
    rows 4–5 start two full buttons left

  Zero-indexed:
    row 0: group offset  0
    row 1: group offset -1
    row 2: group offset -1
    row 3: group offset -2
    row 4: group offset -2

  Then each row also receives the diagonal offset:
    row * diagonalDx

  This avoids accidental cancellation and keeps the diagonal angle explicit.
*/

type TrebleRowDefinition = {
  start: string;
  step: number;

  /*
    Optional explicit octave for the first button of this row.
    
    Example:
      A#3 -> B3 when moving down/right
      C4  -> C#4 when moving down/right
  */
  startOctave?: number;
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
      { start: "F#", step: 3, startOctave: 3 },
      { start: "E", step: 3, startOctave: 3 },
      { start: "F", step: 3, startOctave: 3 },
      { start: "D#", step: 3, startOctave: 3 },
      { start: "E", step: 3, startOctave: 3 },
    ],
  },

  "b-system": {
    rows: [
      { start: "B", step: 3, startOctave: 3 },
      { start: "A#", step: 3, startOctave: 3 },
      { start: "C", step: 3, startOctave: 4 },
      { start: "B", step: 3, startOctave: 3 },
      { start: "C#", step: 3, startOctave: 4 },
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
function getExtraColumnsForRow(row: number) {
  return row === 1 || row === 3 ? 1 : 0;
}

/*
  Horizontal displacement needed so the diagonal is `angle` degrees
  from the vertical.
*/
function getDiagonalDx(yGap: number, angle: number) {
  const angleRadians = (angle * Math.PI) / 180;
  return yGap * Math.tan(angleRadians);
}

/*
  Calculates octave numbers from an explicit starting octave.

*/
function getOctaveNumber(rowDefinition: TrebleRowDefinition, semitoneOffset: number) {
  const startIndex = PITCH_INDEX[rowDefinition.start];
  const startOctave = rowDefinition.startOctave ?? 3;
  const absoluteSemitone = startOctave * 12 + startIndex + semitoneOffset;

  return Math.floor(absoluteSemitone / 12);
}

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

      const visualRow = rows - 1 - row;
      const octaveSuffix = showOctaves ? String(octave) : "";

      return {
        id: `treble-${row}-${column}`,
        x: 110 + column * xGap + groupOffsetPx + diagonalOffsetPx,
        y: 128 + visualRow * yGap,
        row,
        column,
        kind: "treble-note" as const,
        pitchClass,
        naturalName: `${NATURAL_NAMES[pitchClass]}${octaveSuffix}`,
      };
    });
  });
}
