import { ProgressionAssistantPanel } from "./ProgressionAssistantPanel";
import { useBassPatternPlayer } from "../bassPatternPlayer/bassPatternPlayerContext";
import {
  useProgressionAssistant,
  useProgressionAssistantOutput,
} from "./progressionAssistantContext";
import { useCrossToolActions } from "../../app/crossTool/crossToolContext";
import {
  usePlatformSound,
  usePlatformSpelling,
  usePlatformTools,
} from "../../app/platform/platformContexts";

/** Progression Assistant: connects the panel to the progression state. */
export default function ProgressionAssistantSection() {
  const {
    addManualHarmonyProgressionChord,
    cycleHarmonyProgressionRealization,
    moveHarmonyProgressionChord,
    removeHarmonyProgressionChord,
    toggleHarmonyProgressionStepNotes,
    useHarmonyProgressionPreset,
  } = useCrossToolActions();
  const { chordProgressionDefinitions } = useBassPatternPlayer();
  const {
    harmonyProgression,
    harmonyProgressionHandMovementWeight,
    harmonyProgressionManualPattern,
    harmonyProgressionManualRoot,
    harmonyProgressionNoteStepId,
    harmonyProgressionRealizationKeys,
    harmonyProgressionRhythmPattern,
    harmonyProgressionRootPosition,
    harmonyProgressionVoiceLeadingWeight,
    setHarmonyProgression,
    setHarmonyProgressionHandMovementWeight,
    setHarmonyProgressionManualPattern,
    setHarmonyProgressionManualRoot,
    setHarmonyProgressionNoteStepId,
    setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionRhythmPattern,
    setHarmonyProgressionRootPosition,
    setHarmonyProgressionVoiceLeadingWeight,
    progressionPathVisible,
    setProgressionPathVisible,
  } = useProgressionAssistant();
  const { setSoundSequenceTempoBpm, soundSequenceTempoBpm } = usePlatformSound();
  const { chordDisplayStyle } = usePlatformSpelling();
  const { stopAllPlayback: stopSoundPlayback } = usePlatformTools();
  const { harmonyProgressionPlan, harmonyProgressionRealizationOptions } =
    useProgressionAssistantOutput();
  return (
    <ProgressionAssistantPanel
      chordDisplayStyle={chordDisplayStyle}
      progression={harmonyProgression}
      plan={harmonyProgressionPlan}
      presetDefinitions={chordProgressionDefinitions}
      onUsePreset={useHarmonyProgressionPreset}
      realizationOptions={harmonyProgressionRealizationOptions}
      realizationKeys={harmonyProgressionRealizationKeys}
      onCycleRealization={cycleHarmonyProgressionRealization}
      manualRoot={harmonyProgressionManualRoot}
      onManualRootChange={setHarmonyProgressionManualRoot}
      manualPattern={harmonyProgressionManualPattern}
      onManualPatternChange={setHarmonyProgressionManualPattern}
      handMovementWeight={harmonyProgressionHandMovementWeight}
      rootPosition={harmonyProgressionRootPosition}
      onRootPositionChange={(value) => {
        stopSoundPlayback();
        setHarmonyProgressionRootPosition(value);
      }}
      voiceLeadingWeight={harmonyProgressionVoiceLeadingWeight}
      onVoiceLeadingWeightChange={(value) => {
        stopSoundPlayback();
        setHarmonyProgressionVoiceLeadingWeight(value);
      }}
      onHandMovementWeightChange={(value) => {
        stopSoundPlayback();
        setHarmonyProgressionHandMovementWeight(value);
      }}
      rhythmPattern={harmonyProgressionRhythmPattern}
      onRhythmPatternChange={(value) => {
        stopSoundPlayback();
        setHarmonyProgressionRhythmPattern(value);
      }}
      tempoBpm={soundSequenceTempoBpm}
      onTempoBpmChange={(value) => {
        stopSoundPlayback();
        setSoundSequenceTempoBpm(value);
      }}
      noteStepId={harmonyProgressionNoteStepId}
      onToggleStepNotes={toggleHarmonyProgressionStepNotes}
      onAddManualChord={addManualHarmonyProgressionChord}
      onRemoveChord={removeHarmonyProgressionChord}
      onMoveChord={moveHarmonyProgressionChord}
      onClear={() => {
        stopSoundPlayback();
        setHarmonyProgression([]);
        setHarmonyProgressionPreviewIndex(null);
        setHarmonyProgressionNoteStepId(null);
      }}
      pathVisible={progressionPathVisible}
      onPathVisibleChange={setProgressionPathVisible}
    />
  );
}
