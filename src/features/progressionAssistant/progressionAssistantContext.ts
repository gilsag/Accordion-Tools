import { createToolContext } from "../../app/tools/createToolContext";
import type { useHarmonyProgressionState } from "./useProgressionAssistant";

export type ProgressionAssistantState = ReturnType<typeof useHarmonyProgressionState>;
export const [ProgressionAssistantContext, useProgressionAssistant] =
  createToolContext<ProgressionAssistantState>("useProgressionAssistant");
