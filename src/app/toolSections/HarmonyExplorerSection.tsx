import { HarmonyExplorerPanel } from "../../components/tools/HarmonyExplorerPanel";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type HarmonyExplorerSectionModel = Pick<AppControllerModel["tools"],
  "addSelectedHarmonyRelationshipToProgression" | "chordDisplayStyle" |
  "clearHarmonyRecordedProgression" | "harmonyDiatonicOnly" | "harmonyHighlightDiatonic" |
  "harmonyProgressionRecording" | "harmonyRecordedProgression" | "harmonyReferenceFamilyId" |
  "harmonyRelatedFamilyId" | "harmonyScaleId" | "harmonySelection" | "harmonyShowEnharmonics" |
  "harmonyShowNoteRing" | "resetHarmonyExplorer" | "sendHarmonyRecordedProgressionToAssistant" |
  "setHarmonyDiatonicOnly" | "setHarmonyHighlightDiatonic" | "setHarmonyReferenceFamilyId" |
  "setHarmonyRelatedFamilyId" | "setHarmonyScaleId" | "setHarmonyShowNoteRing" |
  "showHarmonySelectionOnStradella" | "toggleHarmonyProgressionRecording">;

/** Harmony Explorer: connects the panel to the explorer state. */
export default function HarmonyExplorerSection({ model }: { model: HarmonyExplorerSectionModel }) {
  const {
    addSelectedHarmonyRelationshipToProgression, chordDisplayStyle,
    clearHarmonyRecordedProgression, harmonyDiatonicOnly, harmonyHighlightDiatonic,
    harmonyProgressionRecording, harmonyRecordedProgression, harmonyReferenceFamilyId,
    harmonyRelatedFamilyId, harmonyScaleId, harmonySelection, harmonyShowEnharmonics,
    harmonyShowNoteRing, resetHarmonyExplorer, sendHarmonyRecordedProgressionToAssistant,
    setHarmonyDiatonicOnly, setHarmonyHighlightDiatonic, setHarmonyReferenceFamilyId,
    setHarmonyRelatedFamilyId, setHarmonyScaleId, setHarmonyShowNoteRing,
    showHarmonySelectionOnStradella, toggleHarmonyProgressionRecording,
  } = model;
  return (
    <HarmonyExplorerPanel
      chordDisplayStyle={chordDisplayStyle}
      referenceFamilyId={harmonyReferenceFamilyId}
      onReferenceFamilyChange={setHarmonyReferenceFamilyId}
      relatedFamilyId={harmonyRelatedFamilyId}
      onRelatedFamilyChange={setHarmonyRelatedFamilyId}
      scaleId={harmonyScaleId}
      onScaleChange={setHarmonyScaleId}
      diatonicOnly={harmonyDiatonicOnly}
      onDiatonicOnlyChange={setHarmonyDiatonicOnly}
      highlightDiatonic={harmonyHighlightDiatonic}
      onHighlightDiatonicChange={setHarmonyHighlightDiatonic}
      showEnharmonics={harmonyShowEnharmonics}
      showNoteRing={harmonyShowNoteRing}
      onShowNoteRingChange={setHarmonyShowNoteRing}
      selected={harmonySelection}
      onShowOnStradella={showHarmonySelectionOnStradella}
      onAddSelectedRelationshipToProgression={addSelectedHarmonyRelationshipToProgression}
      isRecordingProgression={harmonyProgressionRecording}
      recordedProgression={harmonyRecordedProgression}
      onToggleProgressionRecording={toggleHarmonyProgressionRecording}
      onClearRecordedProgression={clearHarmonyRecordedProgression}
      onSendRecordedProgressionToAssistant={sendHarmonyRecordedProgressionToAssistant}
      onReset={resetHarmonyExplorer}
    />
  );
}
