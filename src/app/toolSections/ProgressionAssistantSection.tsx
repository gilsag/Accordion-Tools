import { ProgressionAssistantPanel } from "../../components/tools/ProgressionAssistantPanel";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type ProgressionAssistantSectionModel = Pick<AppControllerModel["tools"],
  "addManualHarmonyProgressionChord" | "chordDisplayStyle" | "chordProgressionDefinitions" |
  "cycleHarmonyProgressionRealization" | "harmonyProgression" |
  "harmonyProgressionHandMovementWeight" | "harmonyProgressionManualPattern" |
  "harmonyProgressionManualRoot" | "harmonyProgressionNoteStepId" | "harmonyProgressionPlan" |
  "harmonyProgressionRealizationKeys" | "harmonyProgressionRealizationOptions" |
  "harmonyProgressionRhythmPattern" | "harmonyProgressionRootPosition" |
  "harmonyProgressionVoiceLeadingWeight" | "moveHarmonyProgressionChord" |
  "progressionPathVisible" | "removeHarmonyProgressionChord" | "setHarmonyProgression" |
  "setHarmonyProgressionHandMovementWeight" | "setHarmonyProgressionManualPattern" |
  "setHarmonyProgressionManualRoot" | "setHarmonyProgressionNoteStepId" |
  "setHarmonyProgressionPreviewIndex" | "setHarmonyProgressionRhythmPattern" |
  "setHarmonyProgressionRootPosition" | "setHarmonyProgressionVoiceLeadingWeight" |
  "setProgressionPathVisible" | "setSoundSequenceTempoBpm" | "soundSequenceTempoBpm" |
  "stopSoundPlayback" | "toggleHarmonyProgressionStepNotes" | "useHarmonyProgressionPreset">;

/** Progression Assistant: connects the panel to the progression state. */
export default function ProgressionAssistantSection({ model }: { model: ProgressionAssistantSectionModel }) {
  const {
    addManualHarmonyProgressionChord, chordDisplayStyle, chordProgressionDefinitions,
    cycleHarmonyProgressionRealization, harmonyProgression, harmonyProgressionHandMovementWeight,
    harmonyProgressionManualPattern, harmonyProgressionManualRoot, harmonyProgressionNoteStepId,
    harmonyProgressionPlan, harmonyProgressionRealizationKeys,
    harmonyProgressionRealizationOptions, harmonyProgressionRhythmPattern,
    harmonyProgressionRootPosition, harmonyProgressionVoiceLeadingWeight,
    moveHarmonyProgressionChord, progressionPathVisible, removeHarmonyProgressionChord,
    setHarmonyProgression, setHarmonyProgressionHandMovementWeight,
    setHarmonyProgressionManualPattern, setHarmonyProgressionManualRoot,
    setHarmonyProgressionNoteStepId, setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionRhythmPattern, setHarmonyProgressionRootPosition,
    setHarmonyProgressionVoiceLeadingWeight, setProgressionPathVisible, setSoundSequenceTempoBpm,
    soundSequenceTempoBpm, stopSoundPlayback, toggleHarmonyProgressionStepNotes,
    useHarmonyProgressionPreset,
  } = model;
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
      onRootPositionChange={(value) => { stopSoundPlayback(); setHarmonyProgressionRootPosition(value); }}
      voiceLeadingWeight={harmonyProgressionVoiceLeadingWeight}
      onVoiceLeadingWeightChange={(value) => { stopSoundPlayback(); setHarmonyProgressionVoiceLeadingWeight(value); }}
      onHandMovementWeightChange={(value) => { stopSoundPlayback(); setHarmonyProgressionHandMovementWeight(value); }}
      rhythmPattern={harmonyProgressionRhythmPattern}
      onRhythmPatternChange={(value) => { stopSoundPlayback(); setHarmonyProgressionRhythmPattern(value); }}
      tempoBpm={soundSequenceTempoBpm}
      onTempoBpmChange={(value) => { stopSoundPlayback(); setSoundSequenceTempoBpm(value); }}
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
