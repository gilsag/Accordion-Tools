import { TrebleChordFinderPanel } from "../../components/tools/TrebleChordFinderPanel";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type TrebleChordFinderSectionModel = Pick<AppControllerModel["tools"],
  "chordFinderActive" | "chordFinderButtons" | "chordFinderInversion" | "chordFinderOctave" |
  "chordFinderPattern" | "chordFinderRoot" | "formatTrebleChordFinderPitches" |
  "playChordFinder" | "setChordFinderActive" | "setChordFinderInversion" |
  "setChordFinderOctave" | "setChordFinderPattern" | "setChordFinderRoot" |
  "setScaleFinderActive" | "setShowTrebleVoicingNote" | "setStradellaChordFinderActive" |
  "setTrebleChordVoicingMode" | "showTrebleVoicingNote" | "t" | "trebleChordExplanation" |
  "trebleChordVoicingMode">;

/** Treble Chord Finder: connects the panel to the finder state. */
export default function TrebleChordFinderSection({ model }: { model: TrebleChordFinderSectionModel }) {
  const {
    chordFinderActive, chordFinderButtons, chordFinderInversion, chordFinderOctave,
    chordFinderPattern, chordFinderRoot, formatTrebleChordFinderPitches, playChordFinder,
    setChordFinderActive, setChordFinderInversion, setChordFinderOctave, setChordFinderPattern,
    setChordFinderRoot, setScaleFinderActive, setShowTrebleVoicingNote,
    setStradellaChordFinderActive, setTrebleChordVoicingMode, showTrebleVoicingNote, t,
    trebleChordExplanation, trebleChordVoicingMode,
  } = model;
  return (
    <TrebleChordFinderPanel
      targetToneText={formatTrebleChordFinderPitches()}
      root={chordFinderRoot}
      onRootChange={setChordFinderRoot}
      octave={chordFinderOctave}
      onOctaveChange={setChordFinderOctave}
      pattern={chordFinderPattern}
      onPatternChange={setChordFinderPattern}
      inversion={chordFinderInversion}
      onInversionChange={setChordFinderInversion}
      buttonCount={chordFinderButtons.length}
      voicingMode={trebleChordVoicingMode}
      onVoicingModeChange={setTrebleChordVoicingMode}
      realizationStatus={chordFinderActive ? trebleChordExplanation.status : t("ui.notShown")}
      realizationExplanation={trebleChordExplanation.explanation}
      isActive={chordFinderActive}
      onToggleActive={() => {
        setChordFinderActive((current) => !current);
        setScaleFinderActive(false);
        setStradellaChordFinderActive(false);
      }}
      onPlay={playChordFinder}
      showVoicingNote={showTrebleVoicingNote}
      onShowVoicingNoteChange={setShowTrebleVoicingNote}
    />
  );
}
