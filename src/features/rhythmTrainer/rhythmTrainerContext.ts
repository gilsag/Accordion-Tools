import { createToolContext } from "../../app/tools/createToolContext";
import type { useRhythmTrainerState } from "./useRhythmTrainer";

export type RhythmTrainerState = ReturnType<typeof useRhythmTrainerState>;
export const [RhythmTrainerContext, useRhythmTrainer] =
  createToolContext<RhythmTrainerState>("useRhythmTrainer");
