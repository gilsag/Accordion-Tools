/*
  Stradella Chord Finder public API.

  The concrete search modes live in src/tools/stradellaChordFinder/ so the
  musical rules for bass rows, chord buttons, and mixed searches stay separate.
*/

import type {
  DiagramButton,
  FinderChordPattern,
  StradellaChordFinderMode,
} from "../types";
import { notPlayableResult, type StradellaChordFinderResult } from "./stradellaChordFinder/results";
export type { StradellaChordFinderResult } from "./stradellaChordFinder/results";
import { orderedTargetPitches } from "./stradellaChordFinder/utils";
import { bassOnlyResult } from "./stradellaChordFinder/searchBassRows";
import { chordButtonRecipeResult } from "./stradellaChordFinder/searchChordButtonsOnly";
import { bassAndChordResult } from "./stradellaChordFinder/searchBassAndChordButtons";

export const STRADELLA_CHORD_FINDER_MODE_OPTIONS: Array<{
  value: StradellaChordFinderMode;
  label: string;
}> = [
  { value: "bass-only", label: "Bass rows only" },
  { value: "chord-buttons-only", label: "Chord buttons only" },
  { value: "bass-and-chords", label: "Bass + chord buttons" },
];

export function getStradellaChordFinderResult(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderChordPattern,
  mode: StradellaChordFinderMode,
  markRootBass = true,
): StradellaChordFinderResult {
  const targetPitches = orderedTargetPitches(root, pattern);

  if (targetPitches.length === 0) {
    return notPlayableResult([], "Choose a valid chord.", "Choose a valid root and chord type.");
  }

  if (mode === "bass-only") return bassOnlyResult(buttons, root, targetPitches);
  if (mode === "bass-and-chords") return bassAndChordResult(buttons, root, targetPitches, pattern);
  return chordButtonRecipeResult(buttons, root, targetPitches, pattern, markRootBass);
}
