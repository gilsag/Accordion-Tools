import { createToolContext } from "../../app/tools/createToolContext";
import type {
  useTrebleChordFinderButtons,
  useTrebleChordFinderState,
} from "./useTrebleChordFinder";

export type TrebleChordFinderState = ReturnType<typeof useTrebleChordFinderState>;
export const [TrebleChordFinderContext, useTrebleChordFinder] =
  createToolContext<TrebleChordFinderState>("useTrebleChordFinder");

/** What the tool derives from its state and the diagram's buttons. */
export type TrebleChordFinderOutput = {
  chordFinderButtons: ReturnType<typeof useTrebleChordFinderButtons>;
  /** Plays the shown chord as an arpeggio, then together. */
  playChordFinder(): void;
};
export const [TrebleChordFinderOutputContext, useTrebleChordFinderOutput] =
  createToolContext<TrebleChordFinderOutput>("useTrebleChordFinderOutput");
