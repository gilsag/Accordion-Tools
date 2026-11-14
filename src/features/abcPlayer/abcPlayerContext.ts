import { createToolContext } from "../../app/tools/createToolContext";
import type { useAbcPlayerState } from "./useAbcPlayer";

export type AbcPlayerState = ReturnType<typeof useAbcPlayerState> & {
  /** Shows or hides the score, hiding the other players' scores. */
  toggleAbcNotation(): void;
};
export const [AbcPlayerContext, useAbcPlayer] = createToolContext<AbcPlayerState>("useAbcPlayer");
