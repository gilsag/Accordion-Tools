import { TrebleChordFinderPanel } from "./TrebleChordFinderPanel";
import { useScaleFinder } from "../scaleFinder/scaleFinderContext";
import { useStradellaChordFinder } from "../stradellaChordFinder/stradellaChordFinderContext";
import { useTrebleChordFinder, useTrebleChordFinderOutput } from "./trebleChordFinderContext";
import { usePlatformLanguage } from "../../app/platform/platformContexts";
import { useDiagramLabels } from "../../app/useDiagramLabels";

/** Treble Chord Finder: connects the panel to the finder state. */
export default function TrebleChordFinderSection() {
  const { t } = usePlatformLanguage();
  const { formatTrebleChordFinderPitches } = useDiagramLabels();
  const { setScaleFinderActive } = useScaleFinder();
  const { setStradellaChordFinderActive } = useStradellaChordFinder();
  const {
    chordFinderActive,
    chordFinderInversion,
    chordFinderOctave,
    chordFinderPattern,
    chordFinderRoot,
    setChordFinderActive,
    setChordFinderInversion,
    setChordFinderOctave,
    setChordFinderPattern,
    setChordFinderRoot,
    setShowTrebleVoicingNote,
    setTrebleChordVoicingMode,
    showTrebleVoicingNote,
    trebleChordVoicingMode,
  } = useTrebleChordFinder();
  const { chordFinderButtons, playChordFinder, trebleChordExplanation } =
    useTrebleChordFinderOutput();
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
