/*
  Chord Finder helpers.

  This module builds a compact treble chord path around a chosen root in octave
  4. It supports inversions and returns exact buttons so the diagram does not
  become cluttered by every duplicate pitch on the keyboard.
*/

import type { DiagramButton, FinderChordInversion, FinderChordPattern } from "../types";
import { INDEX_TO_PITCH, PITCH_INDEX } from "../music";

/** Chord labels shown in the Chord Finder UI. */
export const CHORD_FINDER_OPTIONS: Array<{ value: FinderChordPattern; label: string }> = [
  { value: "major-triad", label: "Major triad" },
  { value: "minor-triad", label: "Minor triad" },
  { value: "augmented-triad", label: "Augmented triad" },
  { value: "diminished-triad", label: "Diminished triad" },
  { value: "sus4", label: "Suspended 4th" },
  { value: "dominant7", label: "Dominant 7" },
  { value: "major7", label: "Major 7" },
  { value: "minor7", label: "Minor 7" },
  { value: "minor7b5", label: "Minor 7♭5" },
  { value: "diminished7", label: "Diminished 7" },
];

/** Chord inversion labels shown in the Chord Finder UI. */
export const CHORD_FINDER_INVERSION_OPTIONS: Array<{
  value: FinderChordInversion;
  label: string;
}> = [
  { value: "root", label: "Root position" },
  { value: "first", label: "1st inversion" },
  { value: "second", label: "2nd inversion" },
  { value: "third", label: "3rd inversion" },
];

/** Returns the interval pattern, in semitones, for a Finder chord in root position. */
export function intervalsForChordFinder(pattern: FinderChordPattern) {
  if (pattern === "major-triad") return [0, 4, 7];
  if (pattern === "minor-triad") return [0, 3, 7];
  if (pattern === "augmented-triad") return [0, 4, 8];
  if (pattern === "diminished-triad") return [0, 3, 6];
  if (pattern === "sus4") return [0, 5, 7];
  if (pattern === "dominant7") return [0, 4, 7, 10];
  if (pattern === "major7") return [0, 4, 7, 11];
  if (pattern === "minor7") return [0, 3, 7, 10];
  if (pattern === "minor7b5") return [0, 3, 6, 10];
  if (pattern === "diminished7") return [0, 3, 6, 9];
  return [0];
}

/** Converts root-position chord intervals into the requested inversion. */
export function applyChordFinderInversion(intervals: number[], inversion: FinderChordInversion) {
  const requestedIndex =
    inversion === "first" ? 1 : inversion === "second" ? 2 : inversion === "third" ? 3 : 0;

  const inversionIndex = Math.min(requestedIndex, Math.max(0, intervals.length - 1));

  return [
    ...intervals.slice(inversionIndex),
    ...intervals.slice(0, inversionIndex).map((interval) => interval + 12),
  ];
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

/** Finds treble buttons for one pitch and octave. */
function candidatesForPitch(buttons: DiagramButton[], pitchClass: string, octave: number) {
  return buttons.filter(
    (button) =>
      button.kind === "treble-note" &&
      button.pitchClass === pitchClass &&
      (button.soundOctave ?? button.octave) === octave,
  );
}

/** Chooses the root button in octave 4, preferring the first three rows. */
function chooseRootCandidate(candidates: DiagramButton[]) {
  if (candidates.length === 0) return undefined;

  const firstThreeRows = candidates.filter((button) => button.row <= 2);
  const pool = firstThreeRows.length > 0 ? firstThreeRows : candidates;

  return [...pool].sort((a, b) => {
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

/** Chooses the next chord button near the previous one, avoiding repeated buttons when possible. */
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

/** Builds one chord path around a root fixed in octave 4, with the requested inversion order. */
export function getChordFinderTrebleButtons(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderChordPattern,
  inversion: FinderChordInversion,
) {
  if (!(root in PITCH_INDEX)) return [];

  const intervals = applyChordFinderInversion(intervalsForChordFinder(pattern), inversion);
  const rootAbsolute = 4 * 12 + PITCH_INDEX[root];
  const usedIds = new Set<string>();
  const result: DiagramButton[] = [];

  intervals.forEach((interval, index) => {
    const { pitchClass, octave } = absoluteToPitch(rootAbsolute + interval);
    const candidates = candidatesForPitch(buttons, pitchClass, octave);
    const selected =
      index === 0 && inversion === "root"
        ? chooseRootCandidate(candidates)
        : chooseNextCandidate(candidates, result[result.length - 1], usedIds);

    if (selected) {
      usedIds.add(selected.id);
      result.push(selected);
    }
  });

  return result;
}
