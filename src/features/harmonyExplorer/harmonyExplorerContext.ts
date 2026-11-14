import { createToolContext } from "../../app/tools/createToolContext";
import type { useHarmonyExplorerResults, useHarmonyExplorerState } from "./useHarmonyExplorer";
import type { useHarmonyRecordingState } from "./useHarmonyRecording";
import type { useHarmonyActions } from "./useHarmonyActions";

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

/** What the tool derives from its state and the diagram's buttons. */
export type HarmonyExplorerOutput = ReturnType<typeof useHarmonyExplorerResults> &
  ReturnType<typeof useHarmonyActions> & {
    /** The recording's score. */
    harmonyRecordedProgressionNotationAbc: string;
  };
export const [HarmonyExplorerOutputContext, useHarmonyExplorerOutput] =
  createToolContext<HarmonyExplorerOutput>("useHarmonyExplorerOutput");
