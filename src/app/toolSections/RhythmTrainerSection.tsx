import { RhythmTrainerControls } from "../../components/tools/RhythmTrainerControls";
import { useRhythmTrainer } from "../../features/rhythmTrainer/rhythmTrainerContext";
import { usePlatformLanguage } from "../platform/platformContexts";

/** Bass–Treble Rhythm Trainer: connects the controls to the trainer state. */
export default function RhythmTrainerSection() {
  const { language, t } = usePlatformLanguage();
  const rhythmTrainer = useRhythmTrainer();
  return <RhythmTrainerControls trainer={rhythmTrainer} t={t} language={language} />;
}
