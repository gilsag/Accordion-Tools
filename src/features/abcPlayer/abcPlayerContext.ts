import { createToolContext } from "../../app/tools/createToolContext";
import type { useAbcPlayerState } from "./useAbcPlayer";

export type AbcPlayerState = ReturnType<typeof useAbcPlayerState>;
export const [AbcPlayerContext, useAbcPlayer] = createToolContext<AbcPlayerState>("useAbcPlayer");
