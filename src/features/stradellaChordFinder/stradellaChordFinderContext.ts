import { createToolContext } from "../../app/tools/createToolContext";
import type {
  useStradellaChordFinderResults,
  useStradellaChordFinderState,
} from "./useStradellaChordFinder";

export type StradellaChordFinderState = ReturnType<typeof useStradellaChordFinderState>;
export const [StradellaChordFinderContext, useStradellaChordFinder] =
  createToolContext<StradellaChordFinderState>("useStradellaChordFinder");

/** What the tool derives from its state and the diagram's buttons. */
export type StradellaChordFinderOutput = ReturnType<typeof useStradellaChordFinderResults>;
export const [StradellaChordFinderOutputContext, useStradellaChordFinderOutput] =
  createToolContext<StradellaChordFinderOutput>("useStradellaChordFinderOutput");
