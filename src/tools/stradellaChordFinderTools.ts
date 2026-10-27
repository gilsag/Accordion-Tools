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
import { bassAndChordResult, bassAndChordResults } from "./stradellaChordFinder/searchBassAndChordButtons";
import { analyzeConfiguredStradellaVoicing, DEFAULT_STRADELLA_REGISTER_MODEL, type StradellaRegisterModel } from "./stradellaChordFinder/registerModel";
import { validRequestedBass } from "./stradellaChordFinder/harmonicIdentity";
import { passesNominalGapFilter, type MinimumNominalGap } from "./stradellaChordFinder/voicingDensity";

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
  requestedBass: string | null = null,
  registerModel: StradellaRegisterModel = DEFAULT_STRADELLA_REGISTER_MODEL,
): StradellaChordFinderResult {
  const targetPitches = orderedTargetPitches(root, pattern);

  if (targetPitches.length === 0) {
    return notPlayableResult([], "Choose a valid chord.", "Choose a valid root and chord type.");
  }

  if (!validRequestedBass(root, pattern, requestedBass)) {
    return notPlayableResult(targetPitches, "Invalid requested bass.", "The requested bass must be a chord tone.");
  }
  if (mode === "bass-and-chords") return bassAndChordResult(buttons, root, targetPitches, pattern, requestedBass, registerModel);
  const result = mode === "bass-only"
    ? bassOnlyResult(buttons, root, targetPitches)
    : chordButtonRecipeResult(buttons, root, targetPitches, pattern, markRootBass);
  if (requestedBass && result.playable &&
      analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel).lowestPitchClass !== requestedBass) {
    return notPlayableResult(targetPitches, `No ${requestedBass}-bass realization in this mode.`,
      `This mode cannot put ${requestedBass} lowest under the configured register ranges. Try Bass + chord buttons.`);
  }
  return result;
}

/** Enumerate alternatives only for mixed search; single-mode results are
 * wrapped in an array for a consistent public interface. */
export function getStradellaChordFinderResults(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderChordPattern,
  mode: StradellaChordFinderMode,
  markRootBass = true,
  maxButtons = 3,
  spanColumns = 5.5,
  requestedBass: string | null = null,
  registerModel: StradellaRegisterModel = DEFAULT_STRADELLA_REGISTER_MODEL,
  minimumNominalGap: MinimumNominalGap = 0,
): StradellaChordFinderResult[] {
  const targetPitches = orderedTargetPitches(root, pattern);
  if (targetPitches.length === 0) {
    return [notPlayableResult([], "Choose a valid chord.", "Choose a valid root and chord type.")];
  }
  if (!validRequestedBass(root, pattern, requestedBass)) {
    return [notPlayableResult(targetPitches, "Invalid requested bass.", "The requested bass must be a chord tone.")];
  }
  if (mode === "bass-and-chords") return bassAndChordResults(buttons, root, targetPitches, pattern, maxButtons, spanColumns, requestedBass, registerModel, minimumNominalGap);
  const result = getStradellaChordFinderResult(buttons, root, pattern, mode, markRootBass, requestedBass, registerModel);
  if (!result.playable || passesNominalGapFilter(
    analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel).notes, minimumNominalGap,
  )) return [result];
  return [notPlayableResult(targetPitches, "No realization matches the nominal spacing filter.",
    `This realization contains adjacent nominal notes closer than ${minimumNominalGap} semitones.`)];
}
