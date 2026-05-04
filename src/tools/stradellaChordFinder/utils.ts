/* Shared utilities for Stradella Chord Finder search modes. */

import type { DiagramButton, FinderChordPattern } from "../../types";
import { INDEX_TO_PITCH, PITCH_INDEX, transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
import type { ChordButtonRecipe } from "./recipes";
import { chordKindLabel, isBassButton, isChordButton } from "./voicings";

export type ChordSearchCandidate = {
  chordButtons: DiagramButton[];
  bassButtons: DiagramButton[];
  primaryButtonIds: string[];
  coveredPitches: string[];
  missingPitches: string[];
  extraPitches: string[];
  distanceScore: number;
};

export function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function orderedTargetPitches(root: string, pattern: FinderChordPattern) {
  if (!(root in PITCH_INDEX)) return [];
  const rootIndex = PITCH_INDEX[root];
  return unique(
    intervalsForChordFinder(pattern).map(
      (interval) => INDEX_TO_PITCH[(rootIndex + interval) % 12],
    ),
  );
}

export function pitchOrder(button: DiagramButton) {
  return PITCH_INDEX[button.pitchClass ?? button.chordRoot ?? "C"] ?? 0;
}

export function distance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rootBassCandidates(buttons: DiagramButton[], root: string) {
  return buttons
    .filter((button) => isBassButton(button) && button.pitchClass === root)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "bass-root" ? -1 : 1;
      if (a.column !== b.column) return a.column - b.column;
      return a.row - b.row;
    });
}

export function chooseRootReference(buttons: DiagramButton[], root: string) {
  return rootBassCandidates(buttons, root)[0] ?? buttons.find((button) => button.chordRoot === root) ?? buttons[0];
}

export function chooseClosestBassForPitch(
  buttons: DiagramButton[],
  pitch: string,
  rootReference: DiagramButton | undefined,
  usedIds: Set<string>,
) {
  const candidates = buttons.filter(
    (button) => isBassButton(button) && button.pitchClass === pitch && !usedIds.has(button.id),
  );

  if (candidates.length === 0) return undefined;

  return [...candidates].sort((a, b) => {
    if (rootReference) {
      const distanceDifference = distance(a, rootReference) - distance(b, rootReference);
      if (Math.abs(distanceDifference) > 0.001) return distanceDifference;
    }
    if (a.kind !== b.kind) return a.kind === "bass-root" ? -1 : 1;
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

export function sortButtonsByPitch(buttons: DiagramButton[]) {
  return [...buttons].sort((a, b) => {
    const pitchDifference = pitchOrder(a) - pitchOrder(b);
    if (pitchDifference !== 0) return pitchDifference;
    if (a.kind !== b.kind) return a.kind === "bass-root" ? -1 : 1;
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  });
}

export function chooseClosestChordButton(
  buttons: DiagramButton[],
  referenceRoot: string,
  kind: DiagramButton["kind"],
  chordRoot: string,
  usedIds: Set<string>,
) {
  const reference = chooseRootReference(buttons, referenceRoot);
  const candidates = buttons.filter(
    (button) => button.kind === kind && button.chordRoot === chordRoot && !usedIds.has(button.id),
  );

  if (candidates.length === 0) return undefined;

  return [...candidates].sort((a, b) => {
    if (reference) {
      const distanceDifference = distance(a, reference) - distance(b, reference);
      if (Math.abs(distanceDifference) > 0.001) return distanceDifference;
    }
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

export function recipeButtons(
  buttons: DiagramButton[],
  root: string,
  recipe: ChordButtonRecipe,
) {
  const usedIds = new Set<string>();
  const selectedButtons: DiagramButton[] = [];
  const primaryButtonIds: string[] = [];
  const missingSteps: string[] = [];

  for (const step of recipe.steps) {
    const chordRoot = transpose(root, step.rootOffset);
    const selected = chooseClosestChordButton(buttons, root, step.kind, chordRoot, usedIds);
    if (!selected) {
      missingSteps.push(`${chordRoot} ${chordKindLabel(step.kind)}`.trim());
      continue;
    }
    selectedButtons.push(selected);
    usedIds.add(selected.id);
    if (step.primary) primaryButtonIds.push(selected.id);
  }

  return { selectedButtons, primaryButtonIds, missingSteps };
}

export function chordButtonPool(buttons: DiagramButton[]) {
  return buttons.filter(isChordButton);
}

export function totalDistance(buttons: DiagramButton[], reference: DiagramButton | undefined) {
  if (!reference) return 0;
  return buttons.reduce((sum, button) => sum + distance(button, reference), 0);
}

export function chordCombinations(pool: DiagramButton[], maxSize: number) {
  const result: DiagramButton[][] = [];

  function walk(start: number, combo: DiagramButton[]) {
    if (combo.length > 0) result.push([...combo]);
    if (combo.length >= maxSize) return;
    for (let i = start; i < pool.length; i += 1) {
      combo.push(pool[i]);
      walk(i + 1, combo);
      combo.pop();
    }
  }

  walk(0, []);
  return result;
}
