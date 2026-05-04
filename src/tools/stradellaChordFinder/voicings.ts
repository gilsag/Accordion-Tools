/*
  Stradella button voicings.

  These helpers describe what each generated Stradella button contributes
  musically. Keeping this separate from the search algorithm makes it easier to
  adjust real-instrument assumptions without changing UI code.
*/

import type { DiagramButton } from "../../types";
import { transpose } from "../../music";

export function isBassButton(button: DiagramButton) {
  return button.kind === "bass-root" || button.kind === "bass-counterbass";
}

export function isChordButton(button: DiagramButton) {
  return (
    button.kind === "chord-major" ||
    button.kind === "chord-minor" ||
    button.kind === "chord-dominant7" ||
    button.kind === "chord-diminished7"
  );
}

export function chordKindLabel(kind: DiagramButton["kind"]) {
  if (kind === "chord-major") return "major";
  if (kind === "chord-minor") return "minor";
  if (kind === "chord-dominant7") return "7";
  if (kind === "chord-diminished7") return "dim";
  return "";
}

export function buttonTones(button: DiagramButton) {
  if (isBassButton(button)) return button.pitchClass ? [button.pitchClass] : [];

  const root = button.chordRoot;
  if (!root) return [];

  if (button.kind === "chord-major") return [root, transpose(root, 4), transpose(root, 7)];
  if (button.kind === "chord-minor") return [root, transpose(root, 3), transpose(root, 7)];

  /* Standard Stradella dominant-seventh buttons sound root, third, and seventh; the fifth is omitted. */
  if (button.kind === "chord-dominant7") return [root, transpose(root, 4), transpose(root, 10)];

  /* Standard Stradella diminished buttons sound root, minor third, and diminished seventh; the diminished fifth is omitted. */
  if (button.kind === "chord-diminished7") return [root, transpose(root, 3), transpose(root, 9)];

  return [];
}

export function combinationTones(buttons: DiagramButton[]) {
  return Array.from(new Set(buttons.flatMap(buttonTones)));
}
