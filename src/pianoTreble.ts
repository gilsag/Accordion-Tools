import type { DiagramButton, PianoTrebleRange } from "./types";
import { FLAT_NAMES, INDEX_TO_PITCH } from "./music";

/*
  Piano-treble layout generation.

  The piano view returns the same DiagramButton data shape as the accordion
  layouts. That lets selection, fingering, sequences, sound playback, the Scale
  Finder, and the Chord Finder reuse the existing music logic.
*/

type PianoRangeDefinition = {
  startOctave: number;
  octaveCount: number;
  label: string;
};

export const PIANO_TREBLE_RANGE_PRESETS: Record<PianoTrebleRange, PianoRangeDefinition> = {
  "two-octave": {
    startOctave: 4,
    octaveCount: 2,
    label: "Two octaves, C4–C6",
  },
  "three-octave": {
    startOctave: 3,
    octaveCount: 3,
    label: "Three octaves, C3–C6",
  },
  "four-octave": {
    startOctave: 2,
    octaveCount: 4,
    label: "Four octaves, C2–C6",
  },
};

const WHITE_PITCH_CLASSES = new Set(["C", "D", "E", "F", "G", "A", "B"]);

function isWhitePitch(pitchClass: string) {
  return WHITE_PITCH_CLASSES.has(pitchClass);
}

function absoluteToPitch(absoluteSemitone: number) {
  const octave = Math.floor(absoluteSemitone / 12);
  const pitchClass = INDEX_TO_PITCH[((absoluteSemitone % 12) + 12) % 12];
  return { pitchClass, octave };
}

function countWhiteKeysBefore(startAbsolute: number, targetAbsolute: number) {
  let count = 0;

  for (let absolute = startAbsolute; absolute < targetAbsolute; absolute += 1) {
    const { pitchClass } = absoluteToPitch(absolute);
    if (isWhitePitch(pitchClass)) count += 1;
  }

  return count;
}

/** Generates a horizontal piano keyboard, including the final upper C key. */
export type PianoTrebleGeometryOptions = {
  keyWidthScale?: number;
  keyHeightScale?: number;
  blackKeyWidthScale?: number;
  blackKeyHeightScale?: number;
  verticalOffset?: number;
};

export function generatePianoTreble(
  range: PianoTrebleRange,
  buttonSize: number,
  spacing: number,
  showOctaves: boolean,
  geometry: PianoTrebleGeometryOptions = {},
): DiagramButton[] {
  const preset = PIANO_TREBLE_RANGE_PRESETS[range];
  const startAbsolute = preset.startOctave * 12;
  const endAbsolute = (preset.startOctave + preset.octaveCount) * 12;

  const keyWidthScale = geometry.keyWidthScale ?? 1;
  const keyHeightScale = geometry.keyHeightScale ?? 1;
  const blackKeyWidthScale = geometry.blackKeyWidthScale ?? 1;
  const blackKeyHeightScale = geometry.blackKeyHeightScale ?? 1;

  const whiteKeyWidth = Math.max(22, buttonSize * spacing * 0.92 * keyWidthScale);
  const whiteKeyHeight = Math.max(135, buttonSize * 5.9 * keyHeightScale);
  const blackKeyWidth = whiteKeyWidth * 0.58 * blackKeyWidthScale;
  const blackKeyHeight = whiteKeyHeight * 0.62 * blackKeyHeightScale;
  const keyboardX = 90;
  const keyboardY = 118 + (geometry.verticalOffset ?? 0);

  const whiteKeys: DiagramButton[] = [];
  const blackKeys: DiagramButton[] = [];

  for (let absolute = startAbsolute; absolute <= endAbsolute; absolute += 1) {
    const { pitchClass, octave } = absoluteToPitch(absolute);
    const whiteIndexBefore = countWhiteKeysBefore(startAbsolute, absolute);
    const isWhite = isWhitePitch(pitchClass);
    const column = absolute - startAbsolute;

    if (isWhite) {
      whiteKeys.push({
        id: `piano-treble-${column}`,
        x: keyboardX + whiteIndexBefore * whiteKeyWidth + whiteKeyWidth / 2,
        y: keyboardY + whiteKeyHeight / 2,
        row: 0,
        column,
        kind: "treble-note",
        pitchClass,
        displayName: pitchClass,
        octave: showOctaves ? octave : undefined,
        soundOctave: octave,
        visualShape: "piano-white-key",
        width: whiteKeyWidth,
        height: whiteKeyHeight,
      });
    } else {
      blackKeys.push({
        id: `piano-treble-${column}`,
        x: keyboardX + whiteIndexBefore * whiteKeyWidth,
        y: keyboardY + blackKeyHeight / 2,
        row: 1,
        column,
        kind: "treble-note",
        pitchClass,
        displayName: FLAT_NAMES[pitchClass] ?? pitchClass,
        octave: showOctaves ? octave : undefined,
        soundOctave: octave,
        visualShape: "piano-black-key",
        width: blackKeyWidth,
        height: blackKeyHeight,
      });
    }
  }

  return [...whiteKeys, ...blackKeys];
}

export function pianoTrebleWhiteKeyCount(range: PianoTrebleRange) {
  const preset = PIANO_TREBLE_RANGE_PRESETS[range];
  return preset.octaveCount * 7 + 1;
}
