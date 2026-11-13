import { RhythmTrainerControls } from "../../components/tools/RhythmTrainerControls";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type RhythmTrainerSectionModel = Pick<AppControllerModel["tools"],
  "language" | "rhythmTrainer" | "t">;

/** Bass–Treble Rhythm Trainer: connects the controls to the trainer state. */
export default function RhythmTrainerSection({ model }: { model: RhythmTrainerSectionModel }) {
  const {
    language, rhythmTrainer, t,
  } = model;
  return (
    <RhythmTrainerControls trainer={rhythmTrainer} t={t} language={language} />
  );
}
