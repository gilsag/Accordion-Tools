/*
  Scale Finder helpers.

  This module builds a one-octave treble scale path. It deliberately returns
  exact buttons instead of every matching pitch class so the diagram stays
  readable. The row-limit option lets the user restrict the path to the first
  3, 4, or 5 rows from the bottom of the treble side.
*/

import type { DiagramButton, FinderScalePattern } from "../types";
import { INDEX_TO_PITCH, PITCH_INDEX } from "../music";

/** Selectable roots for scale and chord finder UIs. */
export const FINDER_ROOT_OPTIONS = [
  { value: "C", label: "C" },
  { value: "C#", label: "C♯ / D♭" },
  { value: "D", label: "D" },
  { value: "D#", label: "D♯ / E♭" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "F#", label: "F♯ / G♭" },
  { value: "G", label: "G" },
  { value: "G#", label: "G♯ / A♭" },
  { value: "A", label: "A" },
  { value: "A#", label: "A♯ / B♭" },
  { value: "B", label: "B" },
];

/** Scale labels shown in the Scale Finder UI. */
export const SCALE_FINDER_OPTIONS: Array<{ value: FinderScalePattern; label: string }> = [
  { value: "major-scale", label: "Major scale" },
  { value: "natural-minor-scale", label: "Natural minor scale" },
  { value: "harmonic-minor-scale", label: "Harmonic minor scale" },
  { value: "major-pentatonic-scale", label: "Major pentatonic scale" },
  { value: "minor-pentatonic-scale", label: "Minor pentatonic scale" },
  { value: "major-blues-scale", label: "Major blues scale" },
  { value: "minor-blues-scale", label: "Minor blues scale" },
  { value: "chromatic-scale", label: "Chromatic scale" },
];

/** Row-limit labels shown in the Scale Finder UI. */
export const SCALE_FINDER_ROW_LIMIT_OPTIONS: Array<{ value: 3 | 4 | 5; label: string }> = [
  { value: 3, label: "First 3 rows" },
  { value: 4, label: "First 4 rows" },
  { value: 5, label: "First 5 rows" },
];

/** Returns the interval pattern, in semitones, for a Finder scale. */
export function intervalsForScaleFinder(pattern: FinderScalePattern) {
  if (pattern === "major-scale") return [0, 2, 4, 5, 7, 9, 11, 12];
  if (pattern === "natural-minor-scale") return [0, 2, 3, 5, 7, 8, 10, 12];
  if (pattern === "harmonic-minor-scale") return [0, 2, 3, 5, 7, 8, 11, 12];

  /*
    Pentatonic and blues scales are one-octave paths.

    Major pentatonic: 1-2-3-5-6
    Minor pentatonic: 1-b3-4-5-b7
    Major blues:      1-2-b3-3-5-6
    Minor blues:      1-b3-4-b5-5-b7
  */
  if (pattern === "major-pentatonic-scale") return [0, 2, 4, 7, 9, 12];
  if (pattern === "minor-pentatonic-scale") return [0, 3, 5, 7, 10, 12];
  if (pattern === "major-blues-scale") return [0, 2, 3, 4, 7, 9, 12];
  if (pattern === "minor-blues-scale") return [0, 3, 5, 6, 7, 10, 12];

  if (pattern === "chromatic-scale") return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return [0];
}

/** Converts an absolute semitone number into normalized pitch class and octave. */
function absoluteToPitch(absoluteSemitone: number) {
  const octave = Math.floor(absoluteSemitone / 12);
  const pitchClass = INDEX_TO_PITCH[((absoluteSemitone % 12) + 12) % 12];
  return { pitchClass, octave };
}

/** Returns the SVG distance between two buttons. */
function buttonDistance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Finds treble buttons for one pitch and octave, restricted to the requested row count. */
function candidatesForPitch(
  buttons: DiagramButton[],
  pitchClass: string,
  octave: number,
  rowLimit: 3 | 4 | 5,
) {
  return buttons.filter(
    (button) =>
      button.kind === "treble-note" &&
      button.row < rowLimit &&
      button.pitchClass === pitchClass &&
      (button.soundOctave ?? button.octave) === octave,
  );
}

/** Chooses the leftmost visible root candidate within the restricted row set. */
function chooseRootCandidate(candidates: DiagramButton[]) {
  if (candidates.length === 0) return undefined;

  return [...candidates].sort((a, b) => {
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

/** Chooses the next scale button near the previous one, avoiding repeated buttons when possible. */
function chooseNextCandidate(
  candidates: DiagramButton[],
  previous: DiagramButton | undefined,
  usedIds: Set<string>,
) {
  if (candidates.length === 0) return undefined;

  const unused = candidates.filter((button) => !usedIds.has(button.id));
  const pool = unused.length > 0 ? unused : candidates;

  if (!previous) return chooseRootCandidate(pool);

  return [...pool].sort((a, b) => {
    const distanceDifference = buttonDistance(a, previous) - buttonDistance(b, previous);
    if (Math.abs(distanceDifference) > 0.001) return distanceDifference;
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

/** Builds one scale path, limited to one octave around octave 4 and the selected rows. */
export function getScaleFinderTrebleButtons(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderScalePattern,
  rowLimit: 3 | 4 | 5,
) {
  if (!(root in PITCH_INDEX)) return [];

  const intervals = intervalsForScaleFinder(pattern);
  const rootAbsolute = 4 * 12 + PITCH_INDEX[root];
  const usedIds = new Set<string>();
  const result: DiagramButton[] = [];

  intervals.forEach((interval, index) => {
    const { pitchClass, octave } = absoluteToPitch(rootAbsolute + interval);
    const candidates = candidatesForPitch(buttons, pitchClass, octave, rowLimit);
    const selected =
      index === 0
        ? chooseRootCandidate(candidates)
        : chooseNextCandidate(candidates, result[result.length - 1], usedIds);

    if (selected) {
      usedIds.add(selected.id);
      result.push(selected);
    }
  });

  return result;
}
