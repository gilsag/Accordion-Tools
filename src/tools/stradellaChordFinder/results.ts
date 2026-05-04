/* Result shaping helpers for the Stradella Chord Finder. */

import type { DiagramButton } from "../../types";
import { combinationTones } from "./voicings";

export type StradellaChordFinderResult = {
  buttons: DiagramButton[];
  playbackButtons: DiagramButton[];
  primaryButtonIds: string[];
  rootBassButtonIds: string[];
  targetPitches: string[];
  coveredPitches: string[];
  missingPitches: string[];
  extraPitches: string[];
  exact: boolean;
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
    targetPitches,
    ...summary,
    playable: summary.exact,
    shortDescription,
    explanation,
  };
}

