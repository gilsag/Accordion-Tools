import { createToolContext } from "../../app/tools/createToolContext";
import type {
  useStradellaChordFinderResults,
  useStradellaChordFinderState,
} from "./useStradellaChordFinder";

export type StradellaChordFinderState = ReturnType<typeof useStradellaChordFinderState>;
export const [StradellaChordFinderContext, useStradellaChordFinder] =
  createToolContext<StradellaChordFinderState>("useStradellaChordFinder");

/** What the tool derives from its state and the diagram's buttons. */
export type StradellaChordFinderOutput = ReturnType<typeof useStradellaChordFinderResults> & {
  /** Plays the selected realization (bass-only: arpeggio, then together). */
  playStradellaChordFinder(): void;
  /** True while every realization is being exported. */
  batchExporting: boolean;
  /** Downloads every playable realization in the remembered format, as a ZIP. */
  downloadAllStradellaRealizations(): Promise<void>;
};
export const [StradellaChordFinderOutputContext, useStradellaChordFinderOutput] =
  createToolContext<StradellaChordFinderOutput>("useStradellaChordFinderOutput");
