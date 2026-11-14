import { createToolContext } from "../../app/tools/createToolContext";
import type { useBassPatternState } from "./useBassPatternPlayer";

export type BassPatternPlayerState = ReturnType<typeof useBassPatternState>;
export const [BassPatternPlayerContext, useBassPatternPlayer] =
  createToolContext<BassPatternPlayerState>("useBassPatternPlayer");
