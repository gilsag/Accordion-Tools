import { StradellaChordFinderPanel } from "./StradellaChordFinderPanel";
import { harmonyFamilyForFinderPattern } from "../harmonyExplorer/engine/integration";
import { ROOT_POSITION_BASS } from "./engine/harmonicIdentity";
import { useScaleFinder } from "../scaleFinder/scaleFinderContext";
import {
  useStradellaChordFinder,
  useStradellaChordFinderOutput,
} from "./stradellaChordFinderContext";
import { useTrebleChordFinder } from "../trebleChordFinder/trebleChordFinderContext";
import { useCrossToolActions } from "../../app/crossTool/crossToolContext";

/** Stradella Chord Finder: connects the panel to the finder state. */
export default function StradellaChordFinderSection() {
  const { exploreCurrentStradellaChordInHarmony } = useCrossToolActions();
  const { setScaleFinderActive } = useScaleFinder();
  const {
    finderExplanationFontSize,
    finderMaxButtons,
    finderSpanColumns,
    setFinderExplanationFontSize,
    setFinderMaxButtons,
    setFinderSpanColumns,
    setShowFinderRealizationNote,
    setShowStradellaVoicingIntervals,
    setStradellaChordFinderActive,
    setStradellaChordFinderMarkRootBass,
    setStradellaChordFinderMode,
    setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex,
    setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot,
    setStradellaMinimumNominalGap,
    setStradellaNoteLevels,
    setStradellaRequestedBassOnBassButton,
    showFinderRealizationNote,
    showStradellaVoicingIntervals,
    stradellaChordFinderActive,
    stradellaChordFinderMarkRootBass,
    stradellaChordFinderMode,
    stradellaChordFinderPattern,
    stradellaChordFinderRealizationIndex,
    stradellaChordFinderRequestedBass,
    stradellaChordFinderRoot,
    stradellaMinimumNominalGap,
    stradellaNoteLevels,
    stradellaRequestedBassOnBassButton,
  } = useStradellaChordFinder();
  const { setChordFinderActive } = useTrebleChordFinder();
  const {
    batchExporting,
    downloadAllStradellaRealizations,
    playStradellaChordFinder,
    stradellaChordFinderBassButtonFallback,
    stradellaChordFinderPlaybackButtons,
    stradellaChordFinderReachExtendedTo,
    stradellaChordFinderRealizations,
    stradellaChordFinderResult,
    stradellaChordFinderRootFallback,
  } = useStradellaChordFinderOutput();
  return (
    <StradellaChordFinderPanel
      root={stradellaChordFinderRoot}
      // A specific slash bass belongs to the old chord, so it falls back to
      // root position; "Any" stays "Any".
      onRootChange={(next) => {
        setStradellaChordFinderRoot(next);
        setStradellaChordFinderRequestedBass((choice) =>
          choice === null ? null : ROOT_POSITION_BASS,
        );
      }}
      pattern={stradellaChordFinderPattern}
      onPatternChange={(next) => {
        setStradellaChordFinderPattern(next);
        setStradellaChordFinderRequestedBass((choice) =>
          choice === null ? null : ROOT_POSITION_BASS,
        );
      }}
      requestedBass={stradellaChordFinderRequestedBass}
      onRequestedBassChange={setStradellaChordFinderRequestedBass}
      rootFallback={stradellaChordFinderRootFallback}
      bassButtonFallback={stradellaChordFinderBassButtonFallback}
      reachExtendedTo={stradellaChordFinderReachExtendedTo}
      mode={stradellaChordFinderMode}
      onModeChange={setStradellaChordFinderMode}
      markRootBass={stradellaChordFinderMarkRootBass}
      onMarkRootBassChange={setStradellaChordFinderMarkRootBass}
      requestedBassOnBassButton={stradellaRequestedBassOnBassButton}
      onRequestedBassOnBassButtonChange={setStradellaRequestedBassOnBassButton}
      result={stradellaChordFinderResult}
      maxButtons={finderMaxButtons}
      onMaxButtonsChange={setFinderMaxButtons}
      spanColumns={finderSpanColumns}
      minimumNominalGap={stradellaMinimumNominalGap}
      onMinimumNominalGapChange={setStradellaMinimumNominalGap}
      onDownloadAll={downloadAllStradellaRealizations}
      batchExporting={batchExporting}
      onSpanColumnsChange={setFinderSpanColumns}
      showRealizationNote={showFinderRealizationNote}
      onShowRealizationNoteChange={setShowFinderRealizationNote}
      noteLevels={stradellaNoteLevels}
      showVoicingIntervals={showStradellaVoicingIntervals}
      onShowVoicingIntervalsChange={setShowStradellaVoicingIntervals}
      onNoteLevelChange={(level, enabled) =>
        setStradellaNoteLevels((current) => ({ ...current, [level]: enabled }))
      }
      explanationFontSize={finderExplanationFontSize}
      onExplanationFontSizeChange={setFinderExplanationFontSize}
      realizations={stradellaChordFinderRealizations}
      realizationIndex={Math.min(
        stradellaChordFinderRealizationIndex,
        Math.max(0, stradellaChordFinderRealizations.length - 1),
      )}
      onRealizationChange={setStradellaChordFinderRealizationIndex}
      playbackButtonCount={stradellaChordFinderPlaybackButtons.length}
      isActive={stradellaChordFinderActive}
      onToggleActive={() => {
        setStradellaChordFinderActive((current) => !current);
        setScaleFinderActive(false);
        setChordFinderActive(false);
      }}
      onPlay={playStradellaChordFinder}
      canExploreHarmony={harmonyFamilyForFinderPattern(stradellaChordFinderPattern) !== null}
      onExploreHarmony={exploreCurrentStradellaChordInHarmony}
    />
  );
}
