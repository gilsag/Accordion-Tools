import { createToolContext } from "../../app/tools/createToolContext";
import type { useBassPatternResults, useBassPatternState } from "./useBassPatternPlayer";

export type BassPatternPlayerState = ReturnType<typeof useBassPatternState> & {
  /** Shows or hides the score, hiding the other players' scores. */
  toggleBassPatternNotation(): void;
};
export const [BassPatternPlayerContext, useBassPatternPlayer] =
  createToolContext<BassPatternPlayerState>("useBassPatternPlayer");

/** What the tool derives from its state and the diagram's buttons. */
export type BassPatternPlayerOutput = ReturnType<typeof useBassPatternResults>;
export const [BassPatternPlayerOutputContext, useBassPatternPlayerOutput] =
  createToolContext<BassPatternPlayerOutput>("useBassPatternPlayerOutput");
