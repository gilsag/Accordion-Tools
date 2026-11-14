import { createToolContext } from "../../app/tools/createToolContext";
import type { useHarmonyExplorerState } from "./useHarmonyExplorer";
import type { useHarmonyRecordingState } from "./useHarmonyRecording";

/** The circle's selection and display preferences, the recording made on
 * it, and the command that restores the circle's defaults. */
export type HarmonyExplorerState = ReturnType<typeof useHarmonyExplorerState> &
  ReturnType<typeof useHarmonyRecordingState> & {
    resetHarmonyExplorer(): void;
    /** Shows or hides the recording's score, hiding every other tool's score. */
    toggleHarmonyRecordedNotation(): void;
  };
export const [HarmonyExplorerContext, useHarmonyExplorer] =
  createToolContext<HarmonyExplorerState>("useHarmonyExplorer");
