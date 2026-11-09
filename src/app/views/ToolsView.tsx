import { ROOT_POSITION_BASS } from "../../tools/stradellaChordFinder/harmonicIdentity";
import { lazy, Suspense } from "react";

import { translateKnownLabel } from "../../i18n/catalog";
import { abcExampleName, bassPatternName, progressionName } from "../../i18n/optionLabels";
import type { TranslationKey } from "../../i18n/catalog";

const BEAT_LABEL_KEYS: Record<BassPatternBeatName, TranslationKey> = {
  "half": "ui.beatHalf", "quarter": "ui.beatQuarter", "dotted-quarter": "ui.beatDottedQuarter",
  "eighth": "ui.beatEighth", "dotted-eighth": "ui.beatDottedEighth", "sixteenth": "ui.beatSixteenth",
};
import type { AbcStradellaMode, DiagramAnnotationAnchor, FinderScalePattern, FontFamily, NumberPosition, SequenceColorPreset, SequenceDisplayMode } from "../../types";
import { stradellaRowLabel } from "../../stradella";
import { FINDER_ROOT_OPTIONS, SCALE_FINDER_OPTIONS, SCALE_FINDER_ROW_LIMIT_OPTIONS } from "../../tools/scaleFinderTools";
import { bassPatternBeat, patternBarCount, type BassPatternBeatName } from "../../tools/bassPatternPlayerTools";
// The panel is fetched on first render; its state stays in its feature hook.
const TrebleChordFinderPanel = lazy(() => import("../../components/tools/TrebleChordFinderPanel").then(module => ({ default: module.TrebleChordFinderPanel })));
// The panel is fetched on first render; its state stays in its feature hook.
const StradellaChordFinderPanel = lazy(() => import("../../components/tools/StradellaChordFinderPanel").then(module => ({ default: module.StradellaChordFinderPanel })));
import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { RhythmTrainerControls } from "../../components/tools/RhythmTrainerControls";
// The panel is fetched on first render; its state stays in its feature hook.
const HarmonyExplorerPanel = lazy(() => import("../../components/tools/HarmonyExplorerPanel").then(module => ({ default: module.HarmonyExplorerPanel })));
// The panel is fetched on first render; its state stays in its feature hook.
const ProgressionAssistantPanel = lazy(() => import("../../components/tools/ProgressionAssistantPanel").then(module => ({ default: module.ProgressionAssistantPanel })));
import { harmonyFamilyForFinderPattern } from "../../tools/harmonyExplorer/integration";
import type { AppControllerModel } from "../useAppController";
import { ANNOTATE_MODES, type AnnotateMode } from "../../diagram/useDiagramOverlays";

const FINGER_NUMBERS = ["1", "2", "3", "4", "5"] as const;

const ANNOTATE_MODE_LABELS: Record<AnnotateMode, TranslationKey> = {
  select: "ui.annotateModeSelect", finger: "ui.annotateModeFinger",
  sequence: "ui.annotateModeSequence", notes: "ui.annotateModeNotes",
};

/** View-only component: all state and commands originate in the controller. */
export function ToolsView({model}:{model:AppControllerModel["tools"]}) {
  const {
    SEQUENCE_DISPLAY_MODE_OPTIONS, abcEditorExpanded, abcExampleOptions, abcExampleValue, abcFileName, abcMappedEvents,
    abcMissingPitchText, abcParseResult, abcPositionBeat, abcStradellaMode, abcTempoBpm,
    abcText, abcTotalBeats, abcTrebleChordSymbolsMode, activeToolSection, useHarmonyProgressionPreset, addManualHarmonyProgressionChord, addSelectedHarmonyRelationshipToProgression,
    annotationBold, annotationButtonAnchor, annotationItalic, annotationLocationLabel, annotationOffsetPercent, annotationPreview,
    applyFingerToSelected, bassPatternBarsPerChord, bassPatternChordVoicing, bassPatternDefinitions, bassPatternEditorErrors, bassPatternEditorExpanded,
    bassPatternEditorMessage, bassPatternEditorText, bassPatternEvents, bassPatternExportFormat, bassPatternId, bassPatternMissingText,
    bassPatternRepeatSelection, bassPatternRoot, bassPatternTempoBpm, bassPatternTotalBeats, bassPatternValidationErrors,
    batchExporting, chordDisplayStyle, chordFinderActive, chordFinderButtons, chordFinderInversion, chordFinderOctave,
    chordFinderPattern, chordFinderRoot, chordProgressionDefinitions, chordProgressionId, clearAllFingerings, clearFingerForSelected,
    clearHarmonyRecordedProgression, clearSelection, clearSequence, clearTextNotes, customBassPatternDefinitions, deleteTextNote,
    deselectButton, downloadAllStradellaRealizations, exploreCurrentStradellaChordInHarmony, exportSelectedBassPattern, finderExplanationFontSize, finderMaxButtons,
    finderSpanColumns, fingeringDraft, fingeringPosition, formatProgressionOptionLabel,
    formatStradellaScaleFinderNames, formatTrebleChordFinderPitches, getMainLabel, harmonyDiatonicOnly, harmonyHighlightDiatonic, harmonyProgression,
    harmonyProgressionHandMovementWeight, harmonyProgressionRootPosition, setHarmonyProgressionRootPosition, harmonyProgressionManualPattern, harmonyProgressionManualRoot, harmonyProgressionVoiceLeadingWeight, harmonyProgressionPlan, harmonyProgressionRealizationOptions, harmonyProgressionRealizationKeys, cycleHarmonyProgressionRealization, harmonyProgressionNoteStepId, toggleHarmonyProgressionStepNotes,
    harmonyProgressionRecording, harmonyProgressionRhythmPattern, harmonyRecordedProgression, harmonyReferenceFamilyId, harmonyRelatedFamilyId,
    harmonyScaleId, harmonySelection, harmonyShowEnharmonics, harmonyShowNoteRing, annotateMode,
    abcHands, chooseAbcHands, abcVoiceCount, abcBothHands,
    isTrebleLikeSide, language, loadAbcExample, loadSelectedPatternIntoEditor, moveHarmonyProgressionChord,
    pauseAbcPlayback, playChordFinder, playScaleFinder,
    playSelectedButtons, playStradellaChordFinder, removeHarmonyProgressionChord, removeSelectedCustomBassPattern, resetHarmonyExplorer,
    saveCustomBassPattern, scaleFinderActive, scaleFinderButtons, scaleFinderDisplayMode, scaleFinderPattern, scaleFinderRoot,
    scaleFinderRowLimit, selectedBassPattern, selectedButtons, selectedChordProgression,
    sendHarmonyRecordedProgressionToAssistant, sequenceArrowheadSize, sequenceColorPreset, sequenceDisplayMode, sequenceNumberColorPreset,
    sequenceNumberFontSize, sequenceNumberPosition, sequenceSteps, sequenceThickness, setAbcActiveButtonIds, setAbcEditorExpanded,
    setAbcExampleValue, setAbcFileName, setAbcPlaybackState, setAbcPositionBeat, setAbcStradellaMode, setAbcTempoBpm,
    setAbcText, setAbcTrebleChordSymbolsMode, setAnnotationBold, setAnnotationButtonAnchor, setAnnotationItalic, setAnnotationOffsetPercent,
    setBassPatternBarsPerChord, setBassPatternChordVoicing, setBassPatternEditorExpanded, setBassPatternEditorText, setBassPatternExportFormat, setBassPatternId,
    setBassPatternRepeatSelection, setBassPatternRoot, setBassPatternTempoBpm, setChordFinderActive, setChordFinderInversion, setChordFinderOctave,
    setChordFinderPattern, setChordFinderRoot, setChordProgressionId, setFinderExplanationFontSize, setFinderMaxButtons, setFinderSpanColumns,
    setFingeringDraft, setFingeringPosition, setHarmonyDiatonicOnly, setHarmonyHighlightDiatonic, setHarmonyProgression,
    setHarmonyProgressionHandMovementWeight, setHarmonyProgressionManualPattern, setHarmonyProgressionManualRoot, setHarmonyProgressionVoiceLeadingWeight, setHarmonyProgressionPreviewIndex, setHarmonyProgressionNoteStepId, setHarmonyProgressionRhythmPattern, setHarmonyReferenceFamilyId,
    setHarmonyRelatedFamilyId, setHarmonyScaleId, setHarmonyShowNoteRing, setAnnotateMode, setScaleFinderActive,
    setScaleFinderDisplayMode, setScaleFinderPattern, setScaleFinderRoot, setScaleFinderRowLimit, setSequenceArrowheadSize,
    setSequenceColorPreset, setSequenceDisplayMode, setSequenceNumberColorPreset, setSequenceNumberFontSize, setSequenceNumberPosition, setSequenceThickness,
    setShowFinderRealizationNote, setShowStradellaVoicingIntervals, setShowTrebleVoicingNote, setSoundSequenceTempoBpm, setStradellaChordFinderActive, setStradellaChordFinderMarkRootBass,
    setStradellaChordFinderMode, setStradellaChordFinderPattern, setStradellaChordFinderRealizationIndex, setStradellaChordFinderRequestedBass, setStradellaChordFinderRoot, setStradellaMinimumNominalGap,
    setStradellaNoteLevels, setTextNoteColor, setTextNoteFont, setTextNoteFontSize, setTrebleChordVoicingMode, showFinderRealizationNote,
    showHarmonySelectionOnStradella, showStradellaVoicingIntervals, showTrebleVoicingNote, side, soundSequenceTempoBpm, stopAbcPlayback,
    stopBassPatternPlayback, stopSoundPlayback, stradellaChordFinderActive, stradellaChordFinderMarkRootBass, stradellaRequestedBassOnBassButton, setStradellaRequestedBassOnBassButton,
    stradellaChordFinderMode, stradellaChordFinderPattern, stradellaChordFinderPlaybackButtons, stradellaChordFinderRealizationIndex, stradellaChordFinderRealizations, stradellaChordFinderRequestedBass,
    stradellaChordFinderResult, stradellaChordFinderRoot, stradellaMinimumNominalGap, stradellaNoteLevels, stradellaScaleFinderResult,
    t, textNoteColor, textNoteFont, textNoteFontSize, textNotes, toggleHarmonyProgressionRecording,
    toggleToolSection, trebleChordExplanation, trebleChordVoicingMode, workspaceMode,
    rhythmTrainer, progressionPathVisible, setProgressionPathVisible,
    stradellaChordFinderRootFallback, stradellaChordFinderBassButtonFallback, stradellaChordFinderReachExtendedTo,
  } = model;
  return (
    <>
              {workspaceMode === "harmony" ? (
                <Suspense fallback={<div className="section-content" aria-busy="true" />}><HarmonyExplorerPanel
                  chordDisplayStyle={chordDisplayStyle}
                  isOpen={activeToolSection === "harmonyExplorer"}
                  onToggle={() => toggleToolSection("harmonyExplorer")}
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
                /></Suspense>
              ) : (
                <>
              {(isTrebleLikeSide || side === "stradella") && (
                <section className="control-section">
                  <button
                    className="section-title"
                    aria-expanded={activeToolSection === "scaleFinder"}
                    onClick={() => toggleToolSection("scaleFinder")}
                  >
                    {t("ui.scaleFinder")}{" "}
                    <span aria-hidden="true">
                      {activeToolSection === "scaleFinder" ? "−" : "+"}
                    </span>
                  </button>
                  {activeToolSection !== "scaleFinder" && <p className="section-summary">{t("tools.summary.scaleFinder")}</p>}

                  {activeToolSection === "scaleFinder" && (
                    <div className="section-content">
                      <p className="hint">
                        {side === "stradella"
                          ? t("ui.scaleIntroBass")
                          : t("ui.scaleIntroTreble")}
                      </p>

                      <fieldset className="tool-fieldset">
                        <label>
                          {t("ui.scaleRoot")}
                          <select
                            value={scaleFinderRoot}
                            onChange={(event) =>
                              setScaleFinderRoot(event.target.value)
                            }
                          >
                            {FINDER_ROOT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {translateKnownLabel(language, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          {t("ui.scaleType")}
                          <select
                            value={scaleFinderPattern}
                            onChange={(event) =>
                              setScaleFinderPattern(
                                event.target.value as FinderScalePattern,
                              )
                            }
                          >
                            {SCALE_FINDER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {translateKnownLabel(language, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span className="label-line">
                            {t("ui.display")}{" "}
                            <HelpTip text={t("ui.scaleDisplayHelp")} />
                          </span>
                          <select
                            value={scaleFinderDisplayMode}
                            onChange={(event) =>
                              setScaleFinderDisplayMode(
                                event.target.value as SequenceDisplayMode,
                              )
                            }
                          >
                            {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {translateKnownLabel(language, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>

                        {isTrebleLikeSide && (
                          <label>
                            {t("ui.rowsUsed")}
                            <select
                              value={scaleFinderRowLimit}
                              onChange={(event) =>
                                setScaleFinderRowLimit(
                                  Number(event.target.value) as 3 | 4 | 5,
                                )
                              }
                            >
                              {SCALE_FINDER_ROW_LIMIT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {translateKnownLabel(language, option.label)}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        <div className="result-card">
                          <div className="result-card-title">
                            {side === "stradella" &&
                            scaleFinderActive &&
                            !stradellaScaleFinderResult.found
                              ? t("common.notFound")
                              : t("ui.scaleButtons", {count: scaleFinderButtons.length})}
                          </div>
                          {side === "stradella" && (
                            <p>
                              {t("ui.targetNotes")}: {" "}
                              {formatStradellaScaleFinderNames(
                                stradellaScaleFinderResult.targetNames,
                                stradellaScaleFinderResult.targetPitches,
                              )}
                              {stradellaScaleFinderResult.missingPitches
                                .length > 0
                                ? ` · ${t("ui.missingShort")}: ${formatStradellaScaleFinderNames(
                                    stradellaScaleFinderResult.missingNames,
                                    stradellaScaleFinderResult.missingPitches,
                                  )}`
                                : ""}
                            </p>
                          )}
                        </div>

                        <div className="button-row">
                          <button
                            type="button"
                            className={`small-button ${scaleFinderActive ? "active-tool" : ""}`}
                            onClick={() => {
                              setScaleFinderActive((current) => !current);
                              setChordFinderActive(false);
                              setStradellaChordFinderActive(false);
                            }}
                          >
                            {scaleFinderActive ? t("ui.hideScale") : t("ui.showScale")}
                          </button>

                          <button
                            className="small-button"
                            onClick={playScaleFinder}
                            disabled={scaleFinderButtons.length === 0}
                          >
                            {t("ui.playScale")}
                          </button>

                        </div>
                      </fieldset>
                    </div>
                  )}
                </section>
              )}

              {isTrebleLikeSide && (
                <Suspense fallback={<div className="section-content" aria-busy="true" />}><TrebleChordFinderPanel
                  isOpen={activeToolSection === "chordFinder"}
                  onToggle={() => toggleToolSection("chordFinder")}
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
                /></Suspense>
              )}

              {side === "stradella" && (
                <Suspense fallback={<div className="section-content" aria-busy="true" />}><StradellaChordFinderPanel
                  isOpen={activeToolSection === "stradellaChordFinder"}
                  onToggle={() => toggleToolSection("stradellaChordFinder")}
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
                /></Suspense>
              )}

              {side === "stradella" && (
                <Suspense fallback={<div className="section-content" aria-busy="true" />}><ProgressionAssistantPanel
                  chordDisplayStyle={chordDisplayStyle}
                  isOpen={activeToolSection === "progressionAssistant"}
                  onToggle={() => toggleToolSection("progressionAssistant")}
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
                /></Suspense>
              )}

              <section className="control-section">
                <button
                  className="section-title"
                  aria-expanded={activeToolSection === "annotateDiagram"}
                  onClick={() => toggleToolSection("annotateDiagram")}
                >
                  {t("ui.annotateDiagram")}{" "}
                  <span>{activeToolSection === "annotateDiagram" ? "−" : "+"}</span>
                </button>
                {activeToolSection !== "annotateDiagram" && <p className="section-summary">{t("tools.summary.annotateDiagram")}</p>}

                {activeToolSection === "annotateDiagram" && (
                  <div className="section-content">
                    <SegmentedChoice
                      label={t("ui.annotateMode")}
                      value={annotateMode}
                      onChange={setAnnotateMode}
                      groupClassName="two-columns"
                      options={ANNOTATE_MODES.map((mode) => ({ value: mode, label: t(ANNOTATE_MODE_LABELS[mode]) }))}
                    />
                    <p className="hint">{t("ui.annotateModeHint")}</p>

                    {annotateMode === "select" && (
                      <>
                        <p className="hint">{t("ui.selectionIntro")}</p>
                      <p className="hint">
                        {t("ui.selectedButtons")}{" "}
                        <strong>{selectedButtons.length}</strong>
                      </p>

                      <button
                        type="button"
                        className="small-button"
                        onClick={playSelectedButtons}
                        disabled={selectedButtons.length === 0}
                      >
                        {t("ui.playSelection")}
                      </button>

                      {selectedButtons.length > 0 ? (
                        <div className="selected-list">
                          {selectedButtons.map((button) => (
                            <div key={button.id} className="selected-item">
                              <span>{getMainLabel(button) || t("settings.blank")}</span>
                              <span className="selected-meta">
                                {side === "stradella"
                                  ? `${translateKnownLabel(language, stradellaRowLabel(button.kind))}, ${t("ui.columnShort")} ${button.column + 1}`
                                  : `${t("ui.rowShort")} ${button.row + 1}, ${t("ui.columnShort")} ${button.column + 1}`}
                              </span>
                              <button
                                type="button"
                                className="selected-remove-button"
                                onClick={() => deselectButton(button.id)}
                                aria-label={t("ui.deselectButton", { button: getMainLabel(button) || t("ui.buttonGeneric") })}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="hint">{t("ui.noButtonsSelected")}</p>
                      )}

                      <button className="small-button" onClick={clearSelection}>
                        {t("ui.clearSelection")}
                      </button>
                      </>
                    )}

                    {annotateMode === "finger" && (
                      <>
                        <p className="hint">{t("ui.fingeringIntro")}</p>

                      <SegmentedChoice label={t("ui.fingeringValue")} value={fingeringDraft} onChange={setFingeringDraft}
                        options={FINGER_NUMBERS.map((finger) => ({ value: finger, label: finger }))} />

                      <label>
                        {t("ui.fingeringPosition")}
                        <select
                          value={fingeringPosition}
                          onChange={(event) =>
                            setFingeringPosition(
                              event.target.value as NumberPosition,
                            )
                          }
                        >
                          <option value="inside-bottom">{t("ui.insideBottom")}</option>
                          <option value="inside-top">{t("ui.insideTop")}</option>
                          <option value="above">{t("ui.aboveButton")}</option>
                        </select>
                      </label>

                      <div className="button-row">
                        <button
                          className="small-button"
                          onClick={applyFingerToSelected}
                        >
                          {t("ui.applyToSelected")}
                        </button>
                        <button
                          className="small-button"
                          onClick={clearFingerForSelected}
                        >
                          {t("ui.clearSelected")}
                        </button>
                        <button
                          className="small-button"
                          onClick={clearAllFingerings}
                        >
                          {t("ui.clearAll")}
                        </button>
                      </div>
                      </>
                    )}

                    {annotateMode === "sequence" && (
                      <>
                        <p className="hint">{t("ui.sequenceIntro")}</p>

                      <label>
                        {t("ui.display")}
                        <select
                          value={sequenceDisplayMode}
                          onChange={(event) =>
                            setSequenceDisplayMode(
                              event.target.value as SequenceDisplayMode,
                            )
                          }
                        >
                          {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {translateKnownLabel(language, option.label)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {t("ui.arrowColor")}
                        <select
                          value={sequenceColorPreset}
                          onChange={(event) =>
                            setSequenceColorPreset(
                              event.target.value as SequenceColorPreset,
                            )
                          }
                        >
                          <option value="red">{t("ui.red")}</option>
                          <option value="blue">{t("ui.blue")}</option>
                          <option value="black">{t("ui.black")}</option>
                          <option value="grey">{t("ui.grey")}</option>
                          <option value="theme">{t("ui.themeAccent")}</option>
                        </select>
                      </label>

                      <label>
                        {t("ui.arrowThickness")} {sequenceThickness.toFixed(1)}
                        <input
                          type="range"
                          min={1}
                          max={8}
                          step={0.25}
                          value={sequenceThickness}
                          onChange={(event) =>
                            setSequenceThickness(Number(event.target.value))
                          }
                        />
                      </label>

                      <label>
                        {t("ui.arrowheadSize")} {sequenceArrowheadSize.toFixed(1)}
                        <input
                          type="range"
                          min={2}
                          max={10}
                          step={0.5}
                          value={sequenceArrowheadSize}
                          onChange={(event) =>
                            setSequenceArrowheadSize(Number(event.target.value))
                          }
                        />
                      </label>

                      <label>
                        {t("ui.numberColor")}
                        <select
                          value={sequenceNumberColorPreset}
                          onChange={(event) =>
                            setSequenceNumberColorPreset(
                              event.target.value as SequenceColorPreset,
                            )
                          }
                        >
                          <option value="red">{t("ui.red")}</option>
                          <option value="blue">{t("ui.blue")}</option>
                          <option value="black">{t("ui.black")}</option>
                          <option value="grey">{t("ui.grey")}</option>
                          <option value="theme">{t("ui.themeAccent")}</option>
                        </select>
                      </label>

                      <label>
                        {t("ui.numberPosition")}
                        <select
                          value={sequenceNumberPosition}
                          onChange={(event) =>
                            setSequenceNumberPosition(
                              event.target.value as NumberPosition,
                            )
                          }
                        >
                          <option value="above">{t("ui.aboveButton")}</option>
                          <option value="inside-top">{t("ui.insideTop")}</option>
                          <option value="inside-bottom">{t("ui.insideBottom")}</option>
                          <option value="none">{t("ui.noNumbers")}</option>
                        </select>
                      </label>

                      <label>
                        {t("ui.numberFontSize")} {sequenceNumberFontSize}px
                        <input
                          type="range"
                          min={7}
                          max={18}
                          value={sequenceNumberFontSize}
                          onChange={(event) =>
                            setSequenceNumberFontSize(Number(event.target.value))
                          }
                        />
                      </label>

                      <p className="hint">
                        {t("ui.sequenceLength")} <strong>{sequenceSteps.length}</strong>
                      </p>
                      <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>

                      <div className="button-row">
                        <button className="small-button" onClick={clearSequence}>
                          {t("ui.clearSequence")}
                        </button>
                      </div>

                      <details className="compact-help-details">
                        <summary>{t("ui.notationHelp")}</summary>
                        <p>
                          {t("ui.sequenceNotationHint")}
                        </p>
                      </details>
                      </>
                    )}

                    {annotateMode === "notes" && (
                      <>
                        <p className="hint">{t("ui.annotateHintDetailed")}</p>

                      <label>
                        {t("ui.buttonPosition")}
                        <select
                          value={annotationButtonAnchor}
                          onChange={(event) =>
                            setAnnotationButtonAnchor(
                              event.target.value as DiagramAnnotationAnchor,
                            )
                          }
                        >
                          <option value="center">{t("ui.center")}</option>
                          <option value="top">{t("ui.top")}</option>
                          <option value="bottom">{t("ui.bottom")}</option>
                          <option value="left">{t("ui.left")}</option>
                          <option value="right">{t("ui.right")}</option>
                          <option value="topLeft">{t("ui.topLeft")}</option>
                          <option value="topRight">{t("ui.topRight")}</option>
                          <option value="bottomLeft">{t("ui.bottomLeft")}</option>
                          <option value="bottomRight">{t("ui.bottomRight")}</option>
                        </select>
                      </label>

                      <label>
                        {t("ui.annotateTextSize")}: {textNoteFontSize}px
                        <input
                          type="range"
                          min={8}
                          max={32}
                          value={textNoteFontSize}
                          onChange={(event) =>
                            setTextNoteFontSize(Number(event.target.value))
                          }
                        />
                      </label>

                      <label>
                        {t("ui.distanceFromCenter")} {annotationOffsetPercent}%
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={annotationOffsetPercent}
                          onChange={(event) =>
                            setAnnotationOffsetPercent(Number(event.target.value))
                          }
                        />
                      </label>

                      <div className="annotation-style-toggles" aria-label={t("ui.annotationStyle")}>
                        <button
                          type="button"
                          className={annotationBold ? "style-toggle active" : "style-toggle"}
                          onClick={() => setAnnotationBold((current) => !current)}
                          aria-pressed={annotationBold}
                          title={t("ui.bold")}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          className={annotationItalic ? "style-toggle active" : "style-toggle"}
                          onClick={() => setAnnotationItalic((current) => !current)}
                          aria-pressed={annotationItalic}
                          title={t("ui.italic")}
                        >
                          <em>I</em>
                        </button>
                      </div>

                      <label>
                        {t("ui.textColor")}
                        <input
                          type="color"
                          value={textNoteColor}
                          onChange={(event) => setTextNoteColor(event.target.value)}
                        />
                      </label>

                      <label>
                        {t("ui.font")}
                        <select
                          value={textNoteFont}
                          onChange={(event) =>
                            setTextNoteFont(event.target.value as FontFamily)
                          }
                        >
                          <option value="system">{t("ui.system")}</option>
                          <option value="serif">{t("ui.serif")}</option>
                          <option value="mono">{t("ui.mono")}</option>
                          <option value="rounded">{t("ui.rounded")}</option>
                        </select>
                      </label>

                      <div className="annotation-list-block">
                        <div className="annotation-list-header">
                          <span>{t("ui.annotations")}</span>
                          <strong>{textNotes.length}</strong>
                        </div>

                        {textNotes.length === 0 ? (
                          <p className="hint">
                            {t("ui.noAnnotationsYetClickTheDiagramToAddOne")}
                          </p>
                        ) : (
                          <ul className="annotation-list">
                            {textNotes.map((note, index) => (
                              <li key={note.id} className="annotation-list-item">
                                <div className="annotation-list-text">
                                  <strong>{index + 1}. {annotationPreview(note)}</strong>
                                  <span>{annotationLocationLabel(note)}</span>
                                </div>
                                <button
                                  type="button"
                                  className="annotation-delete-button"
                                  onClick={() => deleteTextNote(note.id)}
                                  aria-label={t("ui.deleteAnnotation", { count: index + 1 })}
                                  title={t("ui.deleteAnnotationTooltip")}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        className="small-button"
                        onClick={clearTextNotes}
                        disabled={textNotes.length === 0}
                      >
                        {t("ui.clearAnnotations")}
                      </button>
                      </>
                    )}
                  </div>
                )}
              </section>

              {side === "stradella" && (
                <section className="control-section">
                  <button
                    className="section-title"
                    aria-expanded={activeToolSection === "bassPatternPlayer"}
                    onClick={() => toggleToolSection("bassPatternPlayer")}
                  >
                    {t("ui.bassPatternPlayer")}{" "}
                    <span>
                      {activeToolSection === "bassPatternPlayer" ? "−" : "+"}
                    </span>
                  </button>
                  {activeToolSection !== "bassPatternPlayer" && <p className="section-summary">{t("tools.summary.bassPatternPlayer")}</p>}

                  {activeToolSection === "bassPatternPlayer" && (
                    <div className="section-content">
                      <p className="hint">
                        {t("ui.playsStradellaBassPatternsOverAChordProgression")}
                      </p>

                      <label>
                        {t("ui.progression")}
                        <select
                          value={chordProgressionId}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setChordProgressionId(event.target.value);
                          }}
                        >
                          {chordProgressionDefinitions.map((progression) => (
                            <option key={progression.id} value={progression.id}>
                              {formatProgressionOptionLabel(progression, language)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {t("ui.root")}
                        <select
                          value={bassPatternRoot}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternRoot(event.target.value);
                          }}
                        >
                          {FINDER_ROOT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {translateKnownLabel(language, option.label)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {t("ui.rhythm")}
                        <select
                          value={bassPatternId}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternId(event.target.value);
                          }}
                        >
                          {bassPatternDefinitions.map((pattern) => (
                            <option key={pattern.id} value={pattern.id}>
                              {bassPatternName(pattern.id, pattern.name, language)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <SegmentedChoice label={<>{t("ui.chordVoicing")} <HelpTip text={t("ui.simpleFullVoicingHelp")} /></>} value={bassPatternChordVoicing} onChange={(next) => { stopBassPatternPlayback(); setBassPatternChordVoicing(next); }} options={[{ value: "simple", label: t("ui.simple") }, { value: "full", label: t("ui.full") }]} />

                      <div className="compact-control-grid">
                        <label>
                          {t("ui.repeatsPerChord")}: {bassPatternBarsPerChord}
                          <input
                            type="range"
                            min={1}
                            max={8}
                            step={1}
                            value={bassPatternBarsPerChord}
                            onChange={(event) => {
                              stopBassPatternPlayback();
                              setBassPatternBarsPerChord(
                                Number(event.target.value),
                              );
                            }}
                          />
                        </label>

                        <label>
                          {t("ui.tempo")}: {t("ui.tempoBeats", {
                            tempo: bassPatternTempoBpm,
                            beat: t(BEAT_LABEL_KEYS[bassPatternBeat(selectedBassPattern?.meter ?? "4/4").beat]),
                          })}
                          <input
                            type="range"
                            min={30}
                            max={220}
                            step={1}
                            value={bassPatternTempoBpm}
                            onChange={(event) =>
                              setBassPatternTempoBpm(Number(event.target.value))
                            }
                          />
                        </label>
                      </div>

                      <div className="compact-control-grid">
                        <label>
                          {t("ui.playbackRepeat")}
                          <select
                            value={bassPatternRepeatSelection}
                            onChange={(event) =>
                              setBassPatternRepeatSelection(event.target.value)
                            }
                          >
                            <option value="1">{t("ui.firstTime")}</option>
                            <option value="2">{t("ui.twoTimes")}</option>
                            <option value="4">{t("ui.fourTimes")}</option>
                            <option value="loop">{t("ui.loopUntilStopped")}</option>
                          </select>
                        </label>
                      </div>

                      <div className="result-card">
                        <div className="result-card-title">
                          {selectedBassPattern ? bassPatternName(selectedBassPattern.id, selectedBassPattern.name, language) : t("ui.noPattern")}
                        </div>
                        <p>
                          {selectedChordProgression ? progressionName(selectedChordProgression.id, selectedChordProgression.name, language) :
                            t("ui.noProgression")}{" "}
                          · {t("ui.patternBars")}:{" "}
                          {selectedBassPattern
                            ? patternBarCount(selectedBassPattern)
                            : 1}{" "}
                          · {bassPatternBarsPerChord} {t("ui.repeatPerChord")} ·
                          {t("ui.length")}: {bassPatternTotalBeats.toFixed(1)} {t("ui.meterUnits")}
                          {bassPatternMissingText
                            ? ` · ${t("ui.missingShort")}: ${bassPatternMissingText}`
                            : ""}
                        </p>
                        {bassPatternValidationErrors.length > 0 && (
                          <div className="bass-pattern-errors" role="alert">
                            <strong>{t("ui.patternErrors")}</strong>
                            <ul>
                              {bassPatternValidationErrors
                                .slice(0, 6)
                                .map((message) => (
                                  <li key={message}>{message}</li>
                                ))}
                            </ul>
                            {bassPatternValidationErrors.length > 6 && (
                              <p>
                                {t("ui.andMore", { count: bassPatternValidationErrors.length - 6 })}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedBassPattern?.tags &&
                          selectedBassPattern.tags.length > 0 && (
                            <p className="hint">
                              {t("ui.tags")}: {selectedBassPattern.tags.join(", ")}
                            </p>
                          )}
                      </div>

                      <details className="compact-help-details">
                        <summary>{t("ui.notationHelp")}</summary>
                        <p>
                          {t("ui.bassPatternNotationHelp")}
                        </p>
                      </details>

                      <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>
                      <div className="button-row">
                        <div className="compact-export-row">
                          <span>{t("ui.export")}</span>
                          <select
                            value={bassPatternExportFormat}
                            onChange={(event) =>
                              setBassPatternExportFormat(
                                event.target.value as
                                  | "abc"
                                  | "midi"
                                  | "lilypond",
                              )
                            }
                            aria-label={t("ui.stradellaExportFormat")}
                          >
                            <option value="abc">ABC</option>
                            <option value="midi">MIDI</option>
                            <option value="lilypond">LilyPond</option>
                          </select>
                          <button
                            type="button"
                            className="small-button compact-export-download"
                            onClick={exportSelectedBassPattern}
                            disabled={bassPatternEvents.length === 0}
                          >
                            {t("ui.download")}
                          </button>
                        </div>
                      </div>

                      <div
                        className={`result-card bass-pattern-editor ${bassPatternEditorExpanded ? "expanded" : "collapsed"}`}
                      >
                        <button
                          type="button"
                          className="inline-section-toggle"
                          onClick={() =>
                            setBassPatternEditorExpanded((current) => !current)
                          }
                        >
                          <span>{t("ui.customPatternEditor")}</span>
                          <span>{bassPatternEditorExpanded ? "−" : "+"}</span>
                        </button>
                        {bassPatternEditorExpanded && (
                          <>
                            <p className="hint">
                              {t("ui.patternEditorIntro")}
                            </p>
                            <textarea
                              value={bassPatternEditorText}
                              onChange={(event) =>
                                setBassPatternEditorText(event.target.value)
                              }
                              rows={12}
                              spellCheck={false}
                            />
                            {bassPatternEditorErrors.length > 0 ? (
                              <div className="bass-pattern-errors" role="alert">
                                <strong>{t("ui.editorValidation")}</strong>
                                <ul>
                                  {bassPatternEditorErrors
                                    .slice(0, 4)
                                    .map((message) => (
                                      <li key={message}>{message}</li>
                                    ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="hint">{t("ui.editorValidationOK")}</p>
                            )}
                            {bassPatternEditorMessage && (
                              <p className="hint">{bassPatternEditorMessage}</p>
                            )}
                            <div className="button-row">
                              <button
                                type="button"
                                className="small-button"
                                onClick={loadSelectedPatternIntoEditor}
                              >
                                {t("ui.loadSelected")}
                              </button>
                              <button
                                type="button"
                                className="small-button"
                                onClick={saveCustomBassPattern}
                                disabled={bassPatternEditorErrors.length > 0}
                              >
                                {t("ui.saveCustom")}
                              </button>
                              <button
                                type="button"
                                className="small-button"
                                onClick={removeSelectedCustomBassPattern}
                                disabled={
                                  !customBassPatternDefinitions.some(
                                    (pattern) => pattern.id === bassPatternId,
                                  )
                                }
                              >
                                {t("ui.removeCustom")}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {(isTrebleLikeSide || side === "stradella") && (
                <section className="control-section">
                  <button className="section-title" aria-expanded={activeToolSection === "rhythmTrainer"}
                    onClick={() => toggleToolSection("rhythmTrainer")}>
                    {t("rhythm.title")} <span aria-hidden="true">{activeToolSection === "rhythmTrainer" ? "−" : "+"}</span>
                  </button>
                  {activeToolSection !== "rhythmTrainer" && <p className="section-summary">{t("rhythm.summary")}</p>}
                  {activeToolSection === "rhythmTrainer" && <RhythmTrainerControls trainer={rhythmTrainer} t={t} language={language} />}
                </section>
              )}

              {(isTrebleLikeSide || side === "stradella") && (
                <section className="control-section">
                  <button
                    className="section-title"
                    aria-expanded={activeToolSection === "abcPlayer"}
                    onClick={() => toggleToolSection("abcPlayer")}
                  >
                    {t("ui.abcDefault")}{" "}
                    <span>{activeToolSection === "abcPlayer" ? "−" : "+"}</span>
                  </button>
                  {activeToolSection !== "abcPlayer" && <p className="section-summary">{t("tools.summary.abcPlayer")}</p>}

                  {activeToolSection === "abcPlayer" && (
                    <div className="section-content abc-player-panel">
                      <p className="hint">
                        {side === "stradella"
                          ? t("ui.abcIntroStradella")
                          : t("ui.abcIntroTreble")}
                      </p>

                      <SegmentedChoice label={t("ui.abcHands")} value={abcHands} onChange={chooseAbcHands} groupClassName="whole-words"
                        options={[{ value: "stradella", label: t("nav.stradella") }, { value: "treble", label: t("nav.treble") },
                          { value: "both", label: t("ui.abcHandsBoth") }]} />
                      {abcHands === "both" && abcText.trim() && (
                        <p className="hint">{abcVoiceCount >= 2 ? t("ui.abcHandsHint") : t("ui.abcHandsOneVoice")}</p>
                      )}

                      {(side === "stradella" || abcBothHands) && (
                        <label>
                          <span className="label-line">
                            {t("ui.abcStradellaMapping")}{" "}
                            <HelpTip text={t("ui.abcStradellaMappingHelp")} />
                          </span>
                          <select
                            value={abcStradellaMode}
                            onChange={(event) => {
                              pauseAbcPlayback();
                              setAbcActiveButtonIds([]);
                              setAbcStradellaMode(
                                event.target.value as AbcStradellaMode,
                              );
                            }}
                          >
                            <option value="bass-notes-only">
                              {t("ui.bassNotesOnly")}
                            </option>
                            <option value="chord-symbols-only">
                              {t("ui.chordSymbolsOnly")}
                            </option>
                            <option value="bass-notes-and-chord-symbols">
                              {t("ui.bassNotesChordSymbols")}
                            </option>
                          </select>
                        </label>
                      )}

                      {(isTrebleLikeSide || abcBothHands) && (
                        <SegmentedChoice label={<>{t("ui.chordSymbols")} <HelpTip text={t("ui.abcTrebleSymbolsHelp")} /></>} value={abcTrebleChordSymbolsMode} onChange={(next) => { pauseAbcPlayback(); setAbcActiveButtonIds([]); setAbcTrebleChordSymbolsMode(next); }} options={[{ value: "ignore", label: t("ui.ignore") }, { value: "play", label: t("tools.play") }]} />
                      )}

                      <label>
                        {t("ui.exampleTune")}
                        <select
                          value={abcExampleValue}
                          onChange={(event) =>
                            void loadAbcExample(event.target.value)
                          }
                        >
                          {abcExampleOptions.map((option) => (
                            <option
                              key={option.value || "empty"}
                              value={option.value}
                            >
                              {option.value === "" ? t("ui.chooseExample") : abcExampleName(option.value, option.label, language)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="button-row">
                        <label className="small-button file-button">
                          {t("ui.loadAbcFile")}
                          <input
                            type="file"
                            accept=".abc,text/plain"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              setAbcFileName(file.name);
                              setAbcExampleValue("");
                              file.text().then((text) => {
                                setAbcText(text);
                                setAbcPositionBeat(0);
                                setAbcActiveButtonIds([]);
                                setAbcPlaybackState("stopped");
                              });
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => {
                            setAbcText("");
                            setAbcFileName("");
                            setAbcExampleValue("");
                            stopAbcPlayback();
                          }}
                        >
                          {t("ui.clearABC")}
                        </button>
                      </div>

                      {abcFileName && (
                        <p className="hint">{t("ui.file")} {abcFileName}</p>
                      )}

                      <label>
                        {t("ui.tempo")}: {abcTempoBpm} BPM
                        <input
                          type="range"
                          min={40}
                          max={220}
                          step={1}
                          value={abcTempoBpm}
                          onChange={(event) =>
                            setAbcTempoBpm(Number(event.target.value))
                          }
                        />
                      </label>

                      <label>
                        {t("ui.position")}
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, abcTotalBeats)}
                          step={0.25}
                          value={Math.min(abcPositionBeat, abcTotalBeats)}
                          onChange={(event) => {
                            pauseAbcPlayback();
                            setAbcPositionBeat(Number(event.target.value));
                            setAbcActiveButtonIds([]);
                          }}
                          disabled={abcTotalBeats === 0}
                        />
                      </label>

                      <div className="result-card">
                        <div className="result-card-title">
                          {abcText.trim()
                            ? abcParseResult.title
                            : t("ui.noAbcLoaded")}
                        </div>
                        {abcParseResult.errors.length > 0 ? (
                          <p>{abcParseResult.errors.map((error) => translateKnownLabel(language, error)).join(" ")}</p>
                        ) : (
                          <p>
                            {t("ui.events")} {abcMappedEvents.length} · {t("ui.key")}: {" "}
                            {abcParseResult.key}
                            {abcBothHands
                              ? ` · ${t("ui.abcVoicesBoth")}`
                              : abcParseResult.voiceIds.length > 1
                                ? ` · ${t("ui.voice")}: ${side === "stradella" ? "2" : "1"}`
                                : ""} · {t("ui.length")}: {" "}
                            {abcTotalBeats.toFixed(1)} {t("ui.beats")}
                            {abcMissingPitchText
                              ? ` · ${side === "stradella" && !abcBothHands ? t("ui.unavailableNotes") : t("ui.missingShort")}: ${abcMissingPitchText}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>

                      <details className="compact-help-details">
                        <summary>{t("ui.notationHelp")}</summary>
                        <p>
                          {t("ui.abcNotationInstructions")}
                        </p>
                      </details>

                      <div
                        className={`result-card abc-editor ${abcEditorExpanded ? "expanded" : "collapsed"}`}
                      >
                        <button
                          type="button"
                          className="inline-section-toggle"
                          onClick={() =>
                            setAbcEditorExpanded((current) => !current)
                          }
                        >
                          <span>{t("ui.abcEditor")}</span>
                          <span>{abcEditorExpanded ? "−" : "+"}</span>
                        </button>
                        {abcEditorExpanded && (
                          <label>
                            {t("ui.abcText")}
                            <textarea
                              className="abc-textarea"
                              value={abcText}
                              onChange={(event) => {
                                setAbcText(event.target.value);
                                setAbcExampleValue("");
                                setAbcPositionBeat(0);
                                setAbcActiveButtonIds([]);
                                setAbcPlaybackState("stopped");
                              }}
                              placeholder={
                                "X:1\nT:Simple tune\nM:4/4\nL:1/4\nQ:120\nK:C\nC D E F | G A B c |"
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

                </>
              )}
            </>
  );
}
