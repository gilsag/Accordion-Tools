/* Mixed Stradella search: prefer chord buttons, then add bass notes only if needed. */

import type { DiagramButton, FinderChordPattern } from "../../types";
import { notPlayableResult, resultFromButtons, summarizeResult, type StradellaChordFinderResult } from "./results";
import { buttonTones, chordKindLabel, combinationTones } from "./voicings";
import {
  chooseClosestBassForPitch,
  chooseRootReference,
  chordButtonPool,
  chordCombinations,
  totalDistance,
  type ChordSearchCandidate,
} from "./utils";
import { chordButtonRecipeResult } from "./searchChordButtonsOnly";

function findBestBassAndChordCandidate(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
): ChordSearchCandidate | undefined {
  const rootReference = chooseRootReference(buttons, root);
  const targetSet = new Set(targetPitches);
  const pool = chordButtonPool(buttons).filter((button) =>
    buttonTones(button).every((tone) => targetSet.has(tone)),
  );

  const candidates: ChordSearchCandidate[] = [];

  for (const chordButtons of chordCombinations(pool, 3)) {
    const chordTones = combinationTones(chordButtons);
    const extraPitches = chordTones.filter((tone) => !targetSet.has(tone));
    if (extraPitches.length > 0) continue;

    const missingAfterChords = targetPitches.filter((pitch) => !chordTones.includes(pitch));
    const usedBassIds = new Set<string>();
    const bassButtons: DiagramButton[] = [];
    let canComplete = true;

    for (const pitch of missingAfterChords) {
      const bass = chooseClosestBassForPitch(buttons, pitch, rootReference, usedBassIds);
      if (!bass) {
        canComplete = false;
        break;
      }
      bassButtons.push(bass);
      usedBassIds.add(bass.id);
    }

    if (!canComplete) continue;

    const allButtons = [...chordButtons, ...bassButtons];
    const summary = summarizeResult(allButtons, targetPitches);
    if (!summary.exact) continue;

    candidates.push({
      chordButtons,
      bassButtons,
      primaryButtonIds: chordButtons[0] ? [chordButtons[0].id] : [],
      ...summary,
      distanceScore: totalDistance(allButtons, rootReference),
    });
  }

  /* Bass-only fallback is intentionally last, so mixed results prefer chord rows when they help. */
  const usedIds = new Set<string>();
  const bassButtons: DiagramButton[] = [];
  let canUseBassOnly = true;
  for (const pitch of targetPitches) {
    const bass = chooseClosestBassForPitch(buttons, pitch, rootReference, usedIds);
    if (!bass) {
      canUseBassOnly = false;
      break;
    }
    bassButtons.push(bass);
    usedIds.add(bass.id);
  }
  if (canUseBassOnly) {
    const summary = summarizeResult(bassButtons, targetPitches);
    if (summary.exact) {
      candidates.push({
        chordButtons: [],
        bassButtons,
        primaryButtonIds: bassButtons[0] ? [bassButtons[0].id] : [],
        ...summary,
        distanceScore: totalDistance(bassButtons, rootReference) + 1000,
      });
    }
  }

  return candidates.sort((a, b) => {
    if (a.bassButtons.length !== b.bassButtons.length) return a.bassButtons.length - b.bassButtons.length;
    if (a.chordButtons.length !== b.chordButtons.length) return b.chordButtons.length - a.chordButtons.length;
    const totalA = a.chordButtons.length + a.bassButtons.length;
    const totalB = b.chordButtons.length + b.bassButtons.length;
    if (totalA !== totalB) return totalA - totalB;
    return a.distanceScore - b.distanceScore;
  })[0];
}

export function bassAndChordResult(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
): StradellaChordFinderResult {
  const chordOnly = chordButtonRecipeResult(buttons, root, targetPitches, pattern, false);
  if (chordOnly.playable) {
    return {
      ...chordOnly,
      shortDescription: `${chordOnly.shortDescription} Chord buttons alone are enough.`,
      explanation: `${chordOnly.explanation} No bass-row notes are needed to complete this chord.`,
    };
  }

  const candidate = findBestBassAndChordCandidate(buttons, root, targetPitches);
  if (!candidate) {
    return notPlayableResult(
      targetPitches,
      "No exact bass-and-chord-button solution.",
      "No combination of Stradella chord buttons plus available bass/counterbass notes completes this chord without extra tones.",
    );
  }

  const chordNames = candidate.chordButtons.map((button) => `${button.chordRoot ?? "?"} ${chordKindLabel(button.kind)}`.trim());
  const bassNames = candidate.bassButtons.map((button) => button.pitchClass ?? "?");
  const selected = [...candidate.chordButtons, ...candidate.bassButtons];
  const selectedText = [
    chordNames.length ? `chord buttons: ${chordNames.join(" + ")}` : "",
    bassNames.length ? `bass notes: ${bassNames.join(", ")}` : "",
  ].filter(Boolean).join("; ");

  return resultFromButtons(
    selected,
    selected,
    candidate.primaryButtonIds,
    [],
    targetPitches,
    "Completes the chord with chord buttons plus needed bass notes.",
    `Preferred chord-buttons-only result was not available. Selected ${selectedText}.`,
  );
}
