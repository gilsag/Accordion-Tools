import { createToolContext } from "../../app/tools/createToolContext";
import type { useBassPatternResults, useBassPatternState } from "./useBassPatternPlayer";
import type { useBassPatternTransport } from "./useBassPatternTransport";

export type BassPatternPlayerState = ReturnType<typeof useBassPatternState> & {
  /** Shows or hides the score, hiding the other players' scores. */
  toggleBassPatternNotation(): void;
};
export const [BassPatternPlayerContext, useBassPatternPlayer] =
  createToolContext<BassPatternPlayerState>("useBassPatternPlayer");

/** What the tool derives from its state and the diagram's buttons. */
export type BassPatternPlayerOutput = ReturnType<typeof useBassPatternResults> &
  ReturnType<typeof useBassPatternTransport> & {
    /** The pattern's score, for the score panel and the ABC export. */
    bassPatternRenderedNotationAbc: string;
  };
export const [BassPatternPlayerOutputContext, useBassPatternPlayerOutput] =
  createToolContext<BassPatternPlayerOutput>("useBassPatternPlayerOutput");
