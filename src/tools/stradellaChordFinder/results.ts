/* Result shaping helpers for the Stradella Chord Finder. */

import type { DiagramButton } from "../../types";
import { combinationTones } from "./voicings";
import { analyzeStradellaRegistralVoicing, type StradellaRegistralAnalysis } from "./registralAnalysis";

/** Shared candidate contract. `buttons` may include non-sounding reference
 * markers; `playbackButtons` is authoritative for harmonic completeness,
 * audio and registral analysis. */
export type StradellaChordFinderResult = {
  buttons: DiagramButton[];
  playbackButtons: DiagramButton[];
  primaryButtonIds: string[];
  rootBassButtonIds: string[];
  /** Structural bass/preset-chord interpretation (not a literal octave map). */
  registral: StradellaRegistralAnalysis;
  targetPitches: string[];
  coveredPitches: string[];
  missingPitches: string[];
  extraPitches: string[];
  exact: boolean;
  recommended?: boolean;
  /** Short justification for the preferred teaching/playing shortlist. */
  recommendationReason?: string;
  playable: boolean;
  shortDescription: string;
  explanation: string;
};


export function summarizeResult(buttons: DiagramButton[], targetPitches: string[]) {
  const tones = combinationTones(buttons);
  const targetSet = new Set(targetPitches);
  const coveredPitches = targetPitches.filter((pitch) => tones.includes(pitch));
  const missingPitches = targetPitches.filter((pitch) => !tones.includes(pitch));
  const extraPitches = tones.filter((pitch) => !targetSet.has(pitch));

  return {
    coveredPitches,
    missingPitches,
    extraPitches,
    exact: missingPitches.length === 0 && extraPitches.length === 0,
  };
}


export function notPlayableResult(
  targetPitches: string[],
  shortDescription: string,
  explanation: string,
): StradellaChordFinderResult {
  return {
    buttons: [],
    playbackButtons: [],
    primaryButtonIds: [],
    rootBassButtonIds: [],
    registral: analyzeStradellaRegistralVoicing([], targetPitches[0] ?? null),
    targetPitches,
    coveredPitches: [],
    missingPitches: targetPitches,
    extraPitches: [],
    exact: false,
    playable: false,
    shortDescription,
    explanation,
  };
}

/** Shape a realization from played buttons and visual markers separately.
 * Harmonic exactness describes pitch classes, never octave placement. */
export function resultFromButtons(
  selectedButtons: DiagramButton[],
  playbackButtons: DiagramButton[],
  primaryButtonIds: string[],
  rootBassButtonIds: string[],
  targetPitches: string[],
  shortDescription: string,
  explanation: string,
): StradellaChordFinderResult {
  const summary = summarizeResult(playbackButtons, targetPitches);
  return {
    buttons: selectedButtons,
    playbackButtons,
    primaryButtonIds,
    rootBassButtonIds,
    registral: analyzeStradellaRegistralVoicing(playbackButtons, targetPitches[0] ?? null),
    targetPitches,
    ...summary,
    playable: summary.exact,
    shortDescription,
    explanation,
  };
}

