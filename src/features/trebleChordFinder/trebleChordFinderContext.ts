import { createToolContext } from "../../app/tools/createToolContext";
import type { useTrebleChordFinderState } from "./useTrebleChordFinder";

export type TrebleChordFinderState = ReturnType<typeof useTrebleChordFinderState>;
export const [TrebleChordFinderContext, useTrebleChordFinder] =
  createToolContext<TrebleChordFinderState>("useTrebleChordFinder");
