import { createToolContext } from "../tools/createToolContext";
import type { useProgressionActions } from "./useProgressionActions";

/** Progression Assistant editing and the commands that move chords between
 * Harmony Explorer, the Progression Assistant and the Stradella Chord Finder. */
export type CrossToolActions = ReturnType<typeof useProgressionActions>;

export const [CrossToolContext, useCrossToolActions] =
  createToolContext<CrossToolActions>("useCrossToolActions");
