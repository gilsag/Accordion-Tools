import { createToolContext } from "../../app/tools/createToolContext";
import type { useHarmonyProgressionState } from "./useProgressionAssistant";

export type ProgressionAssistantState = ReturnType<typeof useHarmonyProgressionState> & {
  /** Shows or hides the progression's score, hiding the players' scores. */
  toggleHarmonyProgressionNotation(): void;
};
export const [ProgressionAssistantContext, useProgressionAssistant] =
  createToolContext<ProgressionAssistantState>("useProgressionAssistant");
