/* Bass-row-only search for the Stradella Chord Finder. */

import type { DiagramButton } from "../../types";
import { chooseClosestBassForPitch, chooseRootReference, sortButtonsByPitch } from "./utils";
import { summarizeResult, type StradellaChordFinderResult } from "./results";

export function bassOnlyResult(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
): StradellaChordFinderResult {
  const usedIds = new Set<string>();
  const result: DiagramButton[] = [];
  const rootReference = chooseRootReference(buttons, root);

  for (const pitch of targetPitches) {
    const selected = chooseClosestBassForPitch(buttons, pitch, rootReference, usedIds);
    if (selected) {
      result.push(selected);
      usedIds.add(selected.id);
    }
  }

  const summary = summarizeResult(result, targetPitches);
  const playbackButtons = sortButtonsByPitch(result);

  return {
    buttons: result,
    playbackButtons,
    primaryButtonIds: result[0] ? [result[0].id] : [],
    rootBassButtonIds: [],
    targetPitches,
    ...summary,
    playable: summary.missingPitches.length === 0,
    shortDescription: "Uses individual bass notes only.",
    explanation:
      summary.missingPitches.length === 0
        ? "The highlighted bass buttons contain the chord tones. Playback sounds the pitches from low to high, then sounds them together."
        : "The visible bass rows do not contain every requested pitch.",
  };
}
