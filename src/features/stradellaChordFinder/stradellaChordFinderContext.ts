import { createToolContext } from "../../app/tools/createToolContext";
import type { useStradellaChordFinderState } from "./useStradellaChordFinder";

export type StradellaChordFinderState = ReturnType<typeof useStradellaChordFinderState>;
export const [StradellaChordFinderContext, useStradellaChordFinder] =
  createToolContext<StradellaChordFinderState>("useStradellaChordFinder");
