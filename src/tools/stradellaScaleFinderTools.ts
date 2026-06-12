/*
  Stradella Scale Finder helpers.

  This finder uses only the single-note Stradella rows: root bass and
  counterbass. It deliberately avoids chord buttons. Each scale degree is
  matched to a physical button using three priorities:
  - correct pitch class,
  - conventional scale spelling when that spelling exists on the layout,
  - a compact path near the center of the Stradella manual.
*/

import type { DiagramButton, FinderScalePattern } from "../types";
import { INDEX_TO_PITCH, PITCH_INDEX, transpose } from "../music";
import { intervalsForScaleFinder } from "./scaleFinderTools";

export type StradellaScaleFinderResult = {
  buttons: DiagramButton[];
  targetPitches: string[];
  targetNames: string[];
  missingPitches: string[];
  missingNames: string[];
  found: boolean;
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_TO_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};
const NATURAL_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Letter offsets used for conventional scale-degree spelling. */
const SCALE_LETTER_OFFSETS: Record<FinderScalePattern, number[]> = {
  "major-scale": [0, 1, 2, 3, 4, 5, 6, 7],
  "natural-minor-scale": [0, 1, 2, 3, 4, 5, 6, 7],
  "harmonic-minor-scale": [0, 1, 2, 3, 4, 5, 6, 7],
  "major-pentatonic-scale": [0, 1, 2, 4, 5, 7],
  "minor-pentatonic-scale": [0, 2, 3, 4, 6, 7],
  "major-blues-scale": [0, 1, 2, 2, 4, 5, 7],
  "minor-blues-scale": [0, 2, 3, 4, 4, 6, 7],
  "chromatic-scale": [],
};

function isBassNoteButton(button: DiagramButton) {
  return button.kind === "bass-root" || button.kind === "bass-counterbass";
}

function buttonDistance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function visibleName(button: DiagramButton) {
  return button.naturalName ?? button.displayName ?? button.pitchClass ?? "";
}

function accidentalString(offset: number) {
  if (offset === -2) return "bb";
  if (offset === -1) return "b";
  if (offset === 0) return "";
  if (offset === 1) return "#";
  if (offset === 2) return "##";
  return offset > 0 ? "#".repeat(offset) : "b".repeat(Math.abs(offset));
}

function normalizeIntervalDifference(value: number) {
  let result = ((value + 6) % 12) - 6;
  if (result === -6) result = 6;
  return result;
}

function pitchClassForSpelledNote(name: string) {
  const letter = name[0];
  if (!(letter in NATURAL_SEMITONES)) return undefined;

  const accidentalOffset = [...name.slice(1)].reduce((sum, char) => {
    if (char === "#") return sum + 1;
    if (char === "b") return sum - 1;
    return sum;
  }, 0);

  const semitone = NATURAL_SEMITONES[letter] + accidentalOffset;
  return INDEX_TO_PITCH[((semitone % 12) + 12) % 12];
}

function spelledScaleNotes(root: string, pattern: FinderScalePattern) {
  const intervals = intervalsForScaleFinder(pattern);
  const rootLetter = root[0];
  const rootLetterIndex = LETTER_TO_INDEX[rootLetter];

  /* Chromatic paths are used mainly as physical pitch-class paths. */
  if (pattern === "chromatic-scale" || rootLetterIndex === undefined) {
    return intervals.map((interval) => {
      const pitch = transpose(root, interval);
      return { pitch, name: pitch };
    });
  }

  const letterOffsets = SCALE_LETTER_OFFSETS[pattern];

  return intervals.map((interval, index) => {
    const pitch = transpose(root, interval);
    const letterOffset = letterOffsets[index] ?? index;
    const targetLetter = LETTERS[(rootLetterIndex + letterOffset) % LETTERS.length];
    const targetSemitone = PITCH_INDEX[pitch];
    const naturalSemitone = NATURAL_SEMITONES[targetLetter];
    const accidentalOffset = normalizeIntervalDifference(targetSemitone - naturalSemitone);
    const name = `${targetLetter}${accidentalString(accidentalOffset)}`;

    return { pitch: pitchClassForSpelledNote(name) ?? pitch, name };
  });
}

function centerReference(buttons: DiagramButton[]) {
  const bassButtons = buttons.filter(isBassNoteButton);
  if (bassButtons.length === 0) return undefined;

  const minX = Math.min(...bassButtons.map((button) => button.x));
  const maxX = Math.max(...bassButtons.map((button) => button.x));
  const minY = Math.min(...bassButtons.map((button) => button.y));
  const maxY = Math.max(...bassButtons.map((button) => button.y));

  return {
    id: "stradella-scale-center",
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    row: 0,
    column: 0,
    kind: "bass-root" as const,
  };
}

function exactSpellingPenalty(button: DiagramButton, targetName: string) {
  return visibleName(button) === targetName ? 0 : 420;
}

function rowPenalty(button: DiagramButton) {
  return button.kind === "bass-root" ? 0 : 4;
}

function chooseScalePath(
  candidatePools: DiagramButton[][],
  targetNames: string[],
  centerButton: DiagramButton,
) {
  if (candidatePools.length === 0 || candidatePools.some((pool) => pool.length === 0)) return [];

  type State = { score: number; path: DiagramButton[] };

  let states: State[] = candidatePools[0].map((button) => ({
    score:
      buttonDistance(button, centerButton) * 0.28 +
      exactSpellingPenalty(button, targetNames[0]) +
      rowPenalty(button),
    path: [button],
  }));

  for (let index = 1; index < candidatePools.length; index += 1) {
    const nextStates: State[] = [];

    candidatePools[index].forEach((button) => {
      const bestPrevious = [...states].sort((a, b) => {
        const prevA = a.path[a.path.length - 1];
        const prevB = b.path[b.path.length - 1];
        const scoreA =
          a.score +
          buttonDistance(prevA, button) * 1.0 +
          buttonDistance(button, centerButton) * 0.2 +
          exactSpellingPenalty(button, targetNames[index]) +
          rowPenalty(button);
        const scoreB =
          b.score +
          buttonDistance(prevB, button) * 1.0 +
          buttonDistance(button, centerButton) * 0.2 +
          exactSpellingPenalty(button, targetNames[index]) +
          rowPenalty(button);
        return scoreA - scoreB;
      })[0];

      if (bestPrevious) {
        const previousButton = bestPrevious.path[bestPrevious.path.length - 1];
        nextStates.push({
          score:
            bestPrevious.score +
            buttonDistance(previousButton, button) * 1.0 +
            buttonDistance(button, centerButton) * 0.2 +
            exactSpellingPenalty(button, targetNames[index]) +
            rowPenalty(button),
          path: [...bestPrevious.path, button],
        });
      }
    });

    states = nextStates;
  }

  return [...states].sort((a, b) => a.score - b.score)[0]?.path ?? [];
}

export function getStradellaScaleFinderResult(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderScalePattern,
): StradellaScaleFinderResult {
  if (!(root in PITCH_INDEX)) {
    return {
      buttons: [],
      targetPitches: [],
      targetNames: [],
      missingPitches: [],
      missingNames: [],
      found: false,
    };
  }

  const scaleNotes = spelledScaleNotes(root, pattern);
  const targetPitches = scaleNotes.map((note) => note.pitch);
  const targetNames = scaleNotes.map((note) => note.name);
  const centerButton = centerReference(buttons);

  if (!centerButton || scaleNotes.length === 0) {
    return {
      buttons: [],
      targetPitches,
      targetNames,
      missingPitches: targetPitches,
      missingNames: targetNames,
      found: false,
    };
  }

  const candidatePools = scaleNotes.map((note) =>
    buttons.filter(
      (button) => isBassNoteButton(button) && button.pitchClass === note.pitch,
    ),
  );

  const missingIndexes = candidatePools
    .map((pool, index) => (pool.length === 0 ? index : -1))
    .filter((index) => index >= 0);

  if (missingIndexes.length > 0) {
    return {
      buttons: [],
      targetPitches,
      targetNames,
      missingPitches: missingIndexes.map((index) => targetPitches[index]),
      missingNames: missingIndexes.map((index) => targetNames[index]),
      found: false,
    };
  }

  const foundButtons = chooseScalePath(candidatePools, targetNames, centerButton);

  return {
    buttons: foundButtons,
    targetPitches,
    targetNames,
    missingPitches: [],
    missingNames: [],
    found: foundButtons.length === scaleNotes.length,
  };
}
