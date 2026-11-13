import { StradellaChordFinderPanel } from "../../components/tools/StradellaChordFinderPanel";
import { harmonyFamilyForFinderPattern } from "../../tools/harmonyExplorer/integration";
import { ROOT_POSITION_BASS } from "../../tools/stradellaChordFinder/harmonicIdentity";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type StradellaChordFinderSectionModel = Pick<AppControllerModel["tools"],
  "batchExporting" | "downloadAllStradellaRealizations" |
  "exploreCurrentStradellaChordInHarmony" | "finderExplanationFontSize" | "finderMaxButtons" |
  "finderSpanColumns" | "playStradellaChordFinder" | "setChordFinderActive" |
  "setFinderExplanationFontSize" | "setFinderMaxButtons" | "setFinderSpanColumns" |
  "setScaleFinderActive" | "setShowFinderRealizationNote" | "setShowStradellaVoicingIntervals" |
  "setStradellaChordFinderActive" | "setStradellaChordFinderMarkRootBass" |
  "setStradellaChordFinderMode" | "setStradellaChordFinderPattern" |
  "setStradellaChordFinderRealizationIndex" | "setStradellaChordFinderRequestedBass" |
  "setStradellaChordFinderRoot" | "setStradellaMinimumNominalGap" | "setStradellaNoteLevels" |
  "setStradellaRequestedBassOnBassButton" | "showFinderRealizationNote" |
  "showStradellaVoicingIntervals" | "stradellaChordFinderActive" |
  "stradellaChordFinderBassButtonFallback" | "stradellaChordFinderMarkRootBass" |
  "stradellaChordFinderMode" | "stradellaChordFinderPattern" |
  "stradellaChordFinderPlaybackButtons" | "stradellaChordFinderReachExtendedTo" |
  "stradellaChordFinderRealizationIndex" | "stradellaChordFinderRealizations" |
  "stradellaChordFinderRequestedBass" | "stradellaChordFinderResult" |
  "stradellaChordFinderRoot" | "stradellaChordFinderRootFallback" |
  "stradellaMinimumNominalGap" | "stradellaNoteLevels" | "stradellaRequestedBassOnBassButton">;

/** Stradella Chord Finder: connects the panel to the finder state. */
export default function StradellaChordFinderSection({ model }: { model: StradellaChordFinderSectionModel }) {
  const {
    batchExporting, downloadAllStradellaRealizations, exploreCurrentStradellaChordInHarmony,
    finderExplanationFontSize, finderMaxButtons, finderSpanColumns, playStradellaChordFinder,
    setChordFinderActive, setFinderExplanationFontSize, setFinderMaxButtons, setFinderSpanColumns,
    setScaleFinderActive, setShowFinderRealizationNote, setShowStradellaVoicingIntervals,
    setStradellaChordFinderActive, setStradellaChordFinderMarkRootBass,
    setStradellaChordFinderMode, setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex, setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot, setStradellaMinimumNominalGap, setStradellaNoteLevels,
    setStradellaRequestedBassOnBassButton, showFinderRealizationNote,
    showStradellaVoicingIntervals, stradellaChordFinderActive,
    stradellaChordFinderBassButtonFallback, stradellaChordFinderMarkRootBass,
    stradellaChordFinderMode, stradellaChordFinderPattern, stradellaChordFinderPlaybackButtons,
    stradellaChordFinderReachExtendedTo, stradellaChordFinderRealizationIndex,
    stradellaChordFinderRealizations, stradellaChordFinderRequestedBass,
    stradellaChordFinderResult, stradellaChordFinderRoot, stradellaChordFinderRootFallback,
    stradellaMinimumNominalGap, stradellaNoteLevels, stradellaRequestedBassOnBassButton,
  } = model;
  return (
    <StradellaChordFinderPanel
      root={stradellaChordFinderRoot}
      // A specific slash bass belongs to the old chord, so it falls back to
      // root position; "Any" stays "Any".
      onRootChange={(next) => { setStradellaChordFinderRoot(next); setStradellaChordFinderRequestedBass((choice) => choice === null ? null : ROOT_POSITION_BASS); }}
      pattern={stradellaChordFinderPattern}
      onPatternChange={(next) => { setStradellaChordFinderPattern(next); setStradellaChordFinderRequestedBass((choice) => choice === null ? null : ROOT_POSITION_BASS); }}
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
      onNoteLevelChange={(level, enabled) => setStradellaNoteLevels((current) => ({ ...current, [level]: enabled }))}
      explanationFontSize={finderExplanationFontSize}
      onExplanationFontSizeChange={setFinderExplanationFontSize}
      realizations={stradellaChordFinderRealizations}
      realizationIndex={Math.min(stradellaChordFinderRealizationIndex, Math.max(0, stradellaChordFinderRealizations.length - 1))}
      onRealizationChange={setStradellaChordFinderRealizationIndex}
      playbackButtonCount={
        stradellaChordFinderPlaybackButtons.length
      }
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
