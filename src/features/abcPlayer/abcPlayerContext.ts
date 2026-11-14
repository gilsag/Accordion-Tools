import { createToolContext } from "../../app/tools/createToolContext";
import type { DiagramButton } from "../../types";
import type { useAbcPlayerResults, useAbcPlayerState } from "./useAbcPlayer";
import type { useAbcTransport } from "./useAbcTransport";

export type AbcPlayerState = ReturnType<typeof useAbcPlayerState> & {
  /** Shows or hides the score, hiding the other players' scores. */
  toggleAbcNotation(): void;
};
export const [AbcPlayerContext, useAbcPlayer] = createToolContext<AbcPlayerState>("useAbcPlayer");

/** What the tool derives from its state and the diagram's buttons. */
export type AbcPlayerOutput = ReturnType<typeof useAbcPlayerResults> &
  ReturnType<typeof useAbcTransport> & {
    abcCompanionButtons: DiagramButton[] | null;
  };
export const [AbcPlayerOutputContext, useAbcPlayerOutput] =
  createToolContext<AbcPlayerOutput>("useAbcPlayerOutput");
