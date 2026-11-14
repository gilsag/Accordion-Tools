import { createToolContext } from "../../app/tools/createToolContext";
import type { ProgressionSearchSettings } from "../../tools/harmonyExplorer/progression";
import type {
  useHarmonyProgressionResults,
  useHarmonyProgressionState,
} from "./useProgressionAssistant";

export type ProgressionAssistantState = ReturnType<typeof useHarmonyProgressionState> & {
  /** Shows or hides the progression's score, hiding the players' scores. */
  toggleHarmonyProgressionNotation(): void;
};
export const [ProgressionAssistantContext, useProgressionAssistant] =
  createToolContext<ProgressionAssistantState>("useProgressionAssistant");

/** What the tool derives from its state and the diagram's buttons. */
export type ProgressionAssistantOutput = ReturnType<typeof useHarmonyProgressionResults> & {
  progressionSearch: ProgressionSearchSettings;
};
export const [ProgressionAssistantOutputContext, useProgressionAssistantOutput] =
  createToolContext<ProgressionAssistantOutput>("useProgressionAssistantOutput");
