/*
  Stradella Scale Finder helpers.

  This finder uses only the single-note Stradella rows: root bass and
  counterbass. It deliberately avoids chord buttons. Each scale degree is
  matched to the available button closest to the selected root bass button.
*/

import type { DiagramButton, FinderScalePattern } from "../types";
import { INDEX_TO_PITCH, PITCH_INDEX, transpose } from "../music";
import { intervalsForScaleFinder } from "./scaleFinderTools";

export type StradellaScaleFinderResult = {
  buttons: DiagramButton[];
  targetPitches: string[];
  missingPitches: string[];
  found: boolean;
};

function isBassNoteButton(button: DiagramButton) {
  return button.kind === "bass-root" || button.kind === "bass-counterbass";
}

function buttonDistance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function uniqueScalePitches(root: string, pattern: FinderScalePattern) {
  if (!(root in PITCH_INDEX)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  intervalsForScaleFinder(pattern).forEach((interval) => {
    const pitch = transpose(root, interval);
    if (!seen.has(pitch)) {
      seen.add(pitch);
      result.push(pitch);
    }
  });

  return result;
}

function chooseRootButton(buttons: DiagramButton[], root: string) {
  const rootButtons = buttons.filter(
    (button) => button.kind === "bass-root" && button.pitchClass === root,
  );

  if (rootButtons.length > 0) {
    return [...rootButtons].sort((a, b) => a.column - b.column || a.row - b.row)[0];
  }

  const counterbassButtons = buttons.filter(
    (button) => button.kind === "bass-counterbass" && button.pitchClass === root,
  );

  return [...counterbassButtons].sort((a, b) => a.column - b.column || a.row - b.row)[0];
}

function chooseClosestButton(
  candidates: DiagramButton[],
  referenceButton: DiagramButton,
  rootButton: DiagramButton,
  usedIds: Set<string>,
) {
  const unused = candidates.filter((button) => !usedIds.has(button.id));
  const pool = unused.length > 0 ? unused : candidates;

  return [...pool].sort((a, b) => {
    /*
      For scales, a smooth physical path matters more than always returning
      to the root neighborhood. Compare mainly against the previous scale
      degree, with a small root-distance tie breaker so equally smooth
      options still stay near the home position. This lets enharmonic
      choices such as D#/Eb use the nearby physical button when the printed
      root-row spelling would cause an unnecessarily large jump.
    */
    const scoreA = buttonDistance(a, referenceButton) + buttonDistance(a, rootButton) * 0.18;
    const scoreB = buttonDistance(b, referenceButton) + buttonDistance(b, rootButton) * 0.18;
    const distanceDifference = scoreA - scoreB;
    if (Math.abs(distanceDifference) > 0.001) return distanceDifference;

    /* Prefer root row over counterbass if both are equally suitable. */
    if (a.kind !== b.kind) return a.kind === "bass-root" ? -1 : 1;
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

export function getStradellaScaleFinderResult(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderScalePattern,
): StradellaScaleFinderResult {
  const targetPitches = uniqueScalePitches(root, pattern);
  const rootButton = chooseRootButton(buttons, root);

  if (!rootButton || targetPitches.length === 0) {
    return {
      buttons: [],
      targetPitches,
      missingPitches: targetPitches,
      found: false,
    };
  }

  const usedIds = new Set<string>();
  const foundButtons: DiagramButton[] = [];
  const missingPitches: string[] = [];

  targetPitches.forEach((pitch) => {
    const candidates = buttons.filter(
      (button) => isBassNoteButton(button) && button.pitchClass === pitch,
    );

    const previousButton = foundButtons[foundButtons.length - 1] ?? rootButton;
    const selected = pitch === root
      ? rootButton
      : chooseClosestButton(candidates, previousButton, rootButton, usedIds);

    if (selected) {
      usedIds.add(selected.id);
      foundButtons.push(selected);
    } else {
      missingPitches.push(pitch);
    }
  });

  return {
    buttons: missingPitches.length === 0 ? foundButtons : [],
    targetPitches,
    missingPitches,
    found: missingPitches.length === 0,
  };
}
