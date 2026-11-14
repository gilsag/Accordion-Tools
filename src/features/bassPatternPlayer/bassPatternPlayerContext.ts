import { createToolContext } from "../../app/tools/createToolContext";
import type { useBassPatternState } from "./useBassPatternPlayer";

export type BassPatternPlayerState = ReturnType<typeof useBassPatternState> & {
  /** Shows or hides the score, hiding the other players' scores. */
  toggleBassPatternNotation(): void;
};
export const [BassPatternPlayerContext, useBassPatternPlayer] =
  createToolContext<BassPatternPlayerState>("useBassPatternPlayer");
