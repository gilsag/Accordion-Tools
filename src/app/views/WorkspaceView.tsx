import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { fittedRowLabelFontSize, measureRowLabelWidth, ROW_LABEL_FONT_SIZE } from "../../diagram/rowLabelFit";
import type { DiagramButton, Side } from "../../types";
import { AbcHandsDiagram } from "../../diagram/components/AbcHandsDiagram";
import { RhythmTrainerTimeline } from "../../components/tools/RhythmTrainerTimeline";
import { NotationWorkspaceContent } from "../inspector/NotationWorkspaceContent";
import type { NotationKind } from "../../notation/notationSelection";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { PlaybackBar, type PlaybackTransport } from "../components/PlaybackBar";
import { ProgressionPathLayer } from "../../diagram/components/ProgressionPathLayer";

import { stradellaDiagramRowLabel } from "../../i18n/musicTerms";
import { harmonyRelatedDisplayName, harmonyStatusText } from "../../i18n/diagramLabels";
import { WorkspaceToolbar } from "../../app/components/WorkspaceToolbar";
import { DiagramButtonLayer } from "../../diagram/components/DiagramButtonLayer";
import { DiagramConnections } from "../../diagram/components/DiagramConnections";
import { DiagramAnnotationsLayer } from "../../diagram/components/DiagramAnnotationsLayer";
import { DiagramSvgSurface } from "../../diagram/components/DiagramSvgSurface";
import type { CSSProperties } from "react";
import { fontClass, musicLabelText } from "../../music";
import { stradellaRowLabel } from "../../stradella";
import { stopAllSound } from "../../sound";
import { StradellaVoicingIntervals } from "../../components/tools/StradellaVoicingIntervals";
/**
 * In the scrollable (Readable) phone view, bring the highlighted buttons into
 * view, or the C reference button when nothing is highlighted. Targets that are
 * already visible are left alone so manual panning is not undone.
 */
function scrollDiagramToFocus(wrap: HTMLElement | null) {
  if (!wrap || wrap.scrollWidth <= wrap.clientWidth + 1) return;
  const active = wrap.querySelectorAll('[data-focus="active"]');
  const targets = active.length ? active : wrap.querySelectorAll('[data-focus="home"]');
  if (!targets.length) {
    if (wrap.scrollLeft === 0) wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
    return;
  }
  const box = wrap.getBoundingClientRect();
  let left = Infinity;
  let right = -Infinity;
  targets.forEach((element) => {
    const rect = element.getBoundingClientRect();
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
  });
  if (left >= box.left && right <= box.right) return;
  const centre = (left + right) / 2 - box.left + wrap.scrollLeft;
  wrap.scrollTo({ left: Math.max(0, centre - wrap.clientWidth / 2), behavior: "smooth" });
}

const HarmonicCircle = lazy(() => import("../../tools/harmonyExplorer/components/HarmonicCircle").then(module => ({ default: module.HarmonicCircle })));
import type { AppControllerModel } from "../useAppController";

/** View-only component: all state and commands originate in the controller. */
export function WorkspaceView({ model, tools, notationKind, isPhone = false, phoneSheetOpen = false, onOpenPhonePanel, inspectorAvailable = false, inspectorVisible = false, onToggleInspector, notationInInspector = false,
  panelHandles }: {
  model: AppControllerModel["workspace"];
  tools: AppControllerModel["tools"];
  notationKind: NotationKind | null;
  isPhone?: boolean;
  phoneSheetOpen?: boolean;
  onOpenPhonePanel?: (mode: "tools" | "settings") => void;
  inspectorAvailable?: boolean;
  inspectorVisible?: boolean;
  onToggleInspector?: () => void;
  /** The ABC notation is in the results panel, so it is not drawn below the diagram. */
  notationInInspector?: boolean;
  /** Width handles on the workspace's left and right edges. */
  panelHandles?: ReactNode;
}) {
  const {
    abcHandsView, setAbcHands, rhythmTrainer,
    abcActiveButtonIdSet, abcRenderedNotationVisible, abcText, accidentalStyle,
    activeToolSection, annotateMode, annotationButtonAnchor, annotationEditorRef, annotationLevelForLine, annotationPointForButton, bassPatternActiveButtonIdSet,
    bassPatternEvents, bassPatternRenderedNotationVisible, bellowsEndLabel, bellowsLabelY, bellowsStartLabel,
    bellowsStripY, buttonSize, buttonTrebleFooter, buttons, cancelInlineAnnotation, chordDisplayStyle,
    chordFinderActive, chordFinderButtons, chordLabelMode, clearHarmonyWork, colorTheme, commitInlineAnnotation,
    downloadCurrentDiagram, downloadFormat, effectiveTitleSize, finalTitle, diagramNoteRoot, diagramNotePattern, finderAnnotationDisplayLines, finderArrowheadMarkerId,
    finderButtonIds, finderExplanationFontSize, finderFooterEnabled, finderFooterHeight, finderVoicingAnalysis, finderVoicingChartVisible,
    fingeringPosition, getMainLabel, handleHarmonyChordActivated, handleSvgClick, harmonyAllFamiliesMode, harmonyAvailableCounts,
    harmonyColorByFamily, harmonyCounts, harmonyDiameter, harmonyEffectiveDiatonicOnly, harmonyEffectiveHighlightDiatonic, harmonyExplanation,
    harmonyFocusedReferenceRootPc, harmonyFontSize, harmonyPlaybackStyle, harmonyProgressionActiveButtonIdSet, harmonyProgressionNotationVisible,
    harmonyProgressionPlan, harmonyRecordedNotationVisible, harmonyRecordedProgression, harmonyReferenceFamily, harmonyReferenceFamilyId,
    harmonyRelatedFamilyId, harmonyRelatedName, harmonyScale, harmonyScaleId, harmonySectors, harmonyShowEnharmonics,
    harmonyShowExplanation, harmonyShowLegend, harmonyShowNoteRing, harmonyShowSeparators, harmonyShowToneTooltips, harmonySvgRef,
    harmonyVoicingStyle, inlineAnnotationEditor, labelFont, labelFontSize, language, leftPanelMode,
    mobileDiagramView, navigateToTool, overlays, playHarmonyChord, playHarmonyChordRelationship, playHarmonyNote,
    progressionPreviewButtonIds, resetCurrentToolDefaults, resetDiagramWork, scaleFinderArrowStyle, scaleFinderButtons, selectAccordionSide,
    sequenceArrowStyle, sequenceArrowheadMarkerId, sequenceArrowheadSize,
    sequenceNumberPosition, sequenceRenderedNotationVisible, sequenceSteps, sequenceStepsWithButtons, setDownloadFormat, setHarmonySelection,
    setInlineAnnotationEditor, setMobileDiagramView, setPanel, setSoundEnabled, showBellowsGuide, showButtonLabels,
    showScaleFinderArrows, showScaleFinderNumbers, showSequenceArrows, showSequenceNumbers, showStatusBar, showStradellaRowLabels,
    side, soundEnabled, statusBarText, stopAbcPlayback, stopBassPatternPlayback, stradellaChordFinderActive,
    stradellaFinderFooterY, stradellaPrimaryFinderButtonIds, stradellaRootBassFinderButtonIds, svgRef,
    svgStyle, t, textNotes, titleFont, titleMode, toggleAbcNotation,
    toggleBassPatternNotation, toggleButton, toggleFocusPanel, toggleHarmonyProgressionNotation, toggleHarmonyRecordedNotation, toggleSequenceNotation,
    trebleFooterEnabled, trebleFooterFontSize, trebleFooterHeight, trebleFooterY, trebleVoicingNote, viewHeight,
    viewWidth, visibleRows, workspaceMode,
    abcMappedEvents, abcPlaybackState, abcPositionBeat, bassPatternPlaybackState,
    harmonyRecordedProgressionPlaying, pauseAbcPlayback, playHarmonyRecordedProgression, playOptimizedHarmonyProgression,
    playRecordedSequence, samplesLoading, scheduleAbcPlayback, scheduleBassPatternPlayback, soundEnginePlayer,
    stopHarmonyRecordedProgressionPlayback, stopSoundPlayback, progressionPathVisible,
  } = model;
  // The one transport under the diagram follows the active player.
  // Annotate Diagram's Sequence mode owns the sequence transport and notation;
  // Notes mode owns the note cursor and the button anchor markers.
  const sequenceModeActive = activeToolSection === "annotateDiagram" && annotateMode === "sequence";
  const notesModeActive = activeToolSection === "annotateDiagram" && annotateMode === "notes";
  const transport: PlaybackTransport | null = workspaceMode === "harmony"
    ? harmonyRecordedProgression.length > 0
      ? { label: t("tools.harmonyExplorer"), state: harmonyRecordedProgressionPlaying ? "playing" : "stopped", canPlay: true,
          onPlay: playHarmonyRecordedProgression, onStop: stopHarmonyRecordedProgressionPlayback }
      : null
    : activeToolSection === "rhythmTrainer"
      ? {label:t("rhythm.title"),state:rhythmTrainer.playing?"playing":"stopped",canPlay:rhythmTrainer.canPlay,
          onPlay:()=>void rhythmTrainer.play(),onStop:rhythmTrainer.stop}
    : activeToolSection === "abcPlayer"
      ? { label: t("ui.abcDefault"), state: abcPlaybackState, canPlay: abcMappedEvents.length > 0,
          onPlay: () => scheduleAbcPlayback(abcPositionBeat), onPause: pauseAbcPlayback, onStop: stopAbcPlayback }
      : activeToolSection === "bassPatternPlayer" && side === "stradella"
        ? { label: t("ui.bassPatternPlayer"), state: bassPatternPlaybackState === "playing" ? "playing" : "stopped",
            canPlay: bassPatternEvents.length > 0, onPlay: scheduleBassPatternPlayback, onStop: stopBassPatternPlayback }
        : activeToolSection === "progressionAssistant" && side === "stradella"
          ? { label: t("ui.progressionAssistant"), state: soundEnginePlayer === "progression" ? "playing" : "stopped", canPlay: harmonyProgressionPlan.playable,
              onPlay: playOptimizedHarmonyProgression, onStop: stopSoundPlayback }
          : sequenceModeActive
            ? { label: t("ui.sequence"), state: soundEnginePlayer === "sequence" ? "playing" : "stopped", canPlay: sequenceSteps.length > 0,
                onPlay: playRecordedSequence, onStop: stopSoundPlayback }
            : null;
  const showProgressionPath = workspaceMode === "accordion" && side === "stradella"
    && activeToolSection === "progressionAssistant" && progressionPathVisible && harmonyProgressionPlan.playable;
  const progressionArrowheadMarkerId = `${finderArrowheadMarkerId}-progression`;
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  // Re-centre when the view mode, layout or highlighted buttons change, not
  // during playback (those highlights move too fast to follow).
  const diagramFocusKey = [mobileDiagramView, side, buttons.length, [...finderButtonIds].join(),
    [...progressionPreviewButtonIds].join(), scaleFinderButtons.map((button) => button.id).join(),
    sequenceSteps.length].join("|");
  useEffect(() => {
    scrollDiagramToFocus(canvasWrapRef.current);
  }, [diagramFocusKey]);
  // Phones show one manual at a time in the ABC Player's Both hands view.
  const [phoneHand, setPhoneHand] = useState<Side | null>(null);
  const shownPhoneHand = phoneHand ?? side;
  const combinedHandsView = abcHandsView ?? (activeToolSection === "rhythmTrainer"
    ? {trebleButtons:rhythmTrainer.trebleButtons,stradellaButtons:rhythmTrainer.bassButtons} : null);
  const accessibleButtonLabel = (button: DiagramButton) => {
    const name = musicLabelText(getMainLabel(button));
    if (button.kind === "treble-note") {
      return button.octave !== undefined && !/\d$/.test(name) ? `${name}${button.octave}` : name;
    }
    return `${name}, ${stradellaDiagramRowLabel(button.kind, stradellaRowLabel(button.kind), language)}`;
  };
  return (
    <section className="workspace" inert={phoneSheetOpen}>
      {panelHandles}
        <WorkspaceToolbar
          inspectorAvailable={inspectorAvailable} inspectorVisible={inspectorVisible} onToggleInspector={onToggleInspector}
          t={t} workspaceMode={workspaceMode} side={side} leftPanelMode={leftPanelMode}
          activeToolSection={activeToolSection}
          sequenceModeActive={sequenceModeActive}
          onSelectStradella={() => {
            selectAccordionSide("stradella"); stopAbcPlayback();
            if (activeToolSection === "abcPlayer") setAbcHands("stradella");
          }}
          onSelectTreble={() => {
            selectAccordionSide("treble"); stopAbcPlayback();
            if (activeToolSection === "abcPlayer") setAbcHands("treble");
          }}
          onSelectHarmony={() => {
            navigateToTool("harmonyExplorer");
            stopAbcPlayback(); stopBassPatternPlayback(); stopAllSound();
          }}
          onShowSettings={() => isPhone ? onOpenPhonePanel?.("settings") : setPanel("settings")}
          onShowTools={() => isPhone ? onOpenPhonePanel?.("tools") : setPanel("tools")}
          onToggleFocus={toggleFocusPanel}
          bassPatternEvents={bassPatternEvents}
          bassPatternRenderedNotationVisible={bassPatternRenderedNotationVisible}
          onToggleBassPatternNotation={toggleBassPatternNotation}
          harmonyRecordedProgression={harmonyRecordedProgression}
          harmonyRecordedNotationVisible={harmonyRecordedNotationVisible}
          onToggleHarmonyRecordedNotation={toggleHarmonyRecordedNotation}
          harmonyProgressionPlayable={harmonyProgressionPlan.playable}
          harmonyProgressionNotationVisible={harmonyProgressionNotationVisible}
          onToggleHarmonyProgressionNotation={toggleHarmonyProgressionNotation}
          abcText={abcText} abcRenderedNotationVisible={abcRenderedNotationVisible}
          onToggleAbcNotation={toggleAbcNotation}
          rhythmNotationVisible={rhythmTrainer.notationVisible}
          rhythmNotationAvailable={rhythmTrainer.exercise.barCount > 0}
          onToggleRhythmNotation={() => rhythmTrainer.setNotationVisible(!rhythmTrainer.notationVisible)}
          sequenceStepsWithButtons={sequenceStepsWithButtons}
          sequenceRenderedNotationVisible={sequenceRenderedNotationVisible}
          onToggleSequenceNotation={toggleSequenceNotation}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(current => !current)}
          onClearWork={() => { if (workspaceMode === "harmony") clearHarmonyWork(); else resetDiagramWork(); }}
          onRestoreToolDefaults={resetCurrentToolDefaults}
          downloadFormat={downloadFormat} setDownloadFormat={setDownloadFormat}
          onDownloadDiagram={downloadCurrentDiagram}
        />

        {showStatusBar && workspaceMode === "accordion" && (
          <div className="status-bar" title={statusBarText}>
            {statusBarText}
          </div>
        )}
        {showStatusBar && workspaceMode === "harmony" && (
          <div className="status-bar">
            {harmonyStatusText({
              referenceFamilyId: harmonyReferenceFamily.id,
              referenceFamilyEnglishName: harmonyReferenceFamily.name,
              relatedFamilyId: harmonyRelatedFamilyId,
              relatedFamilyEnglishName: harmonyRelatedName,
              scaleId: harmonyScale.id,
              scaleEnglishName: harmonyScale.name,
              soundEnabled, language,
            })}
          </div>
        )}

        {workspaceMode === "harmony" ? (
          <>
            {harmonyAvailableCounts.length === 0 && (
              <div className="harmony-empty-result">
                {t("ui.noChordRelationshipsSatisfyTheCurrentHarmonicFilter")}
              </div>
            )}
            {harmonyAvailableCounts.length > 0 && harmonyCounts.length === 0 && (
              <div className="harmony-empty-result">
                {t("ui.allAvailableOuterRingsAreHiddenReEnableAtLeastOneRingInHarmonyExplorer")}
              </div>
            )}
            <div className="canvas-wrap harmony-canvas-wrap">
              <div
                className="harmony-svg-host"
                style={{
                  width: `${harmonyDiameter + (harmonyShowLegend || harmonyShowExplanation ? Math.max(460, harmonyDiameter * 0.65) : 0)}px`,
                }}
              >
                <Suspense fallback={<div className="harmony-empty-result" aria-busy="true" />}><HarmonicCircle
                  chordDisplayStyle={chordDisplayStyle}
                  sectors={harmonySectors}
                  counts={harmonyCounts}
                  referenceFamilyId={harmonyReferenceFamilyId}
                  relatedFamilyName={harmonyRelatedDisplayName(harmonyRelatedFamilyId, harmonyRelatedName, language)}
                  allFamiliesMode={harmonyAllFamiliesMode}
                  scaleId={harmonyScaleId}
                  diatonicOnly={harmonyEffectiveDiatonicOnly}
                  highlightDiatonic={harmonyEffectiveHighlightDiatonic}
                  showEnharmonics={harmonyShowEnharmonics}
                  showSeparators={harmonyShowSeparators}
                  showLegend={harmonyShowLegend}
                  showExplanation={harmonyShowExplanation}
                  explanation={harmonyExplanation}
                  showToneTooltips={harmonyShowToneTooltips}
                  showNoteRing={harmonyShowNoteRing}
                  colorByFamily={harmonyColorByFamily}
                  diameter={harmonyDiameter}
                  fontSize={harmonyFontSize}
                  playbackStyle={harmonyPlaybackStyle}
                  voicingStyle={harmonyVoicingStyle}
                  svgRef={harmonySvgRef}
                  focusedReferenceRootPc={harmonyFocusedReferenceRootPc}
                  onPlayChord={playHarmonyChord}
                  onPlayNote={playHarmonyNote}
                  onChordActivated={handleHarmonyChordActivated}
                  onPlayRelationship={playHarmonyChordRelationship}
                  onSelectionChange={setHarmonySelection}
                /></Suspense>
              </div>
            </div>
          </>
        ) : (
        <>
        {combinedHandsView && isPhone && (
          <div className="abc-hand-switch">
            <SegmentedChoice label={t("ui.abcShowHand")} value={shownPhoneHand} onChange={setPhoneHand}
              options={[{ value: "treble", label: t("nav.treble") }, { value: "stradella", label: t("nav.stradella") }]} />
          </div>
        )}
        {activeToolSection === "rhythmTrainer" && (
          <RhythmTrainerTimeline exercise={rhythmTrainer.exercise} positionUnit={rhythmTrainer.positionUnit}
            playing={rhythmTrainer.playing} activeRhythmKeys={rhythmTrainer.activeRhythmKeys} t={t} />
        )}
        <div className="diagram-mobile-frame">
          <div className="mobile-diagram-view-control">
            <button type="button" className="mobile-diagram-toggle"
              aria-label={mobileDiagramView === "readable" ? t("ui.fitDiagram") : t("ui.readableScroll")}
              title={mobileDiagramView === "readable" ? t("ui.fitDiagram") : t("ui.readableScroll")}
              aria-pressed={mobileDiagramView === "fit"}
              onClick={() => setMobileDiagramView(current => current === "readable" ? "fit" : "readable")}
            >{mobileDiagramView === "readable" ? "⤢" : "↔"}</button>
          </div>
        <div
          ref={canvasWrapRef}
          className={`canvas-wrap ${activeToolSection === "rhythmTrainer" ? "rhythm-compact-diagrams" : ""} ${mobileDiagramView === "readable" ? "diagram-readable" : "diagram-fit"}`}
          style={{ "--mobile-diagram-readable-width": `${Math.max(960, viewWidth * 0.75)}px` } as CSSProperties}
        >
          {combinedHandsView ? (
            <AbcHandsDiagram
              ref={svgRef}
              hands={(activeToolSection === "rhythmTrainer" ? [
                { key: "stradella", caption: t("nav.stradella"), buttons: combinedHandsView.stradellaButtons },
                { key: "treble", caption: t("nav.treble"), buttons: combinedHandsView.trebleButtons },
              ] : [
                { key: "treble", caption: t("ui.abcHandCaption", { hand: t("nav.treble"), voice: 1 }), buttons: combinedHandsView.trebleButtons },
                { key: "stradella", caption: t("ui.abcHandCaption", { hand: t("nav.stradella"), voice: 2 }), buttons: combinedHandsView.stradellaButtons },
              ]).filter((hand) => !isPhone || hand.key === shownPhoneHand)}
              abcActiveButtonIdSet={activeToolSection === "rhythmTrainer" ? rhythmTrainer.activeButtonIdSet : abcActiveButtonIdSet}
              getMainLabel={getMainLabel} getAccessibleLabel={accessibleButtonLabel} onButton={toggleButton}
              style={activeToolSection === "rhythmTrainer" ? {...svgStyle, maxWidth:"880px"} : svgStyle} colorTheme={colorTheme} accidentalStyle={accidentalStyle} buttonSize={buttonSize}
              chordLabelMode={chordLabelMode} labelFontSize={labelFontSize}
              showButtonLabels={showButtonLabels} labelFont={labelFont}
            />
          ) : (
          <DiagramSvgSurface
            ref={svgRef} colorTheme={colorTheme} accidentalStyle={accidentalStyle}
            annotationActive={notesModeActive}
            viewWidth={viewWidth} viewHeight={viewHeight}
            onClick={handleSvgClick} style={svgStyle}
          >
            <defs>
              <marker
                id={sequenceArrowheadMarkerId}
                markerWidth={sequenceArrowheadSize + 1}
                markerHeight={sequenceArrowheadSize + 1}
                refX={sequenceArrowheadSize}
                refY={sequenceArrowheadSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d={`M 0 0 L ${sequenceArrowheadSize} ${sequenceArrowheadSize / 2} L 0 ${sequenceArrowheadSize} z`}
                  className="sequence-arrowhead"
                />
              </marker>

              <marker
                id={finderArrowheadMarkerId}
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 0 L 5 2.5 L 0 5 z" className="finder-arrowhead" />
              </marker>
              <marker id={progressionArrowheadMarkerId} markerWidth="9" markerHeight="9" refX="8" refY="4.5"
                orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 9 4.5 L 0 9 z" className="progression-path-arrowhead" />
              </marker>
            </defs>

            {titleMode !== "none" && (
              <text
                x={viewWidth / 2}
                y="34"
                textAnchor="middle"
                className={`title ${fontClass(titleFont)}`}
                style={{ fontSize: effectiveTitleSize }}
              >
                {finalTitle}
              </text>
            )}

            {(finderFooterEnabled || trebleFooterEnabled) && (
              <foreignObject
                x={32}
                y={trebleFooterEnabled ? trebleFooterY : stradellaFinderFooterY}
                width={viewWidth - 64}
                height={trebleFooterEnabled && buttonTrebleFooter ? trebleFooterHeight : trebleFooterEnabled ? 128 : finderFooterHeight}
              >
                <div style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: `${trebleFooterEnabled ? trebleFooterFontSize : finderExplanationFontSize}px`,
                  fontWeight: trebleFooterEnabled ? 600 : 400,
                  textAlign: finderFooterEnabled ? "left" : "center",
                  lineHeight: finderFooterEnabled ? 1.3 : 1.15,
                  overflowWrap: "anywhere", color: "#20252a",
                }}>
                  {finderFooterEnabled
                    ? (
                      <div className="finder-annotation-block">
                        {finderAnnotationDisplayLines.map((line, index) => {
                          const level = annotationLevelForLine(line);
                          const colon = line.indexOf(":");
                          const label = colon > 0 ? line.slice(0, colon + 1) : "";
                          const value = colon > 0 ? line.slice(colon + 1).trim() : line;
                          const showVoicingChart = level === "voicing" && finderVoicingChartVisible && finderVoicingAnalysis;
                          return (
                            <div
                              key={`${level ?? "line"}-${index}`}
                              className={`finder-annotation-line${showVoicingChart ? " finder-annotation-line-voicing" : ""}`}
                            >
                              {label && (
                                <div className="finder-annotation-label">
                                  <strong>{label}</strong>
                                </div>
                              )}
                              <div className="finder-annotation-value">
                                {showVoicingChart ? (
                                  <StradellaVoicingIntervals
                                    notes={finderVoicingAnalysis.notes}
                                    root={diagramNoteRoot}
                                    pattern={diagramNotePattern}
                                    fontSize={finderExplanationFontSize}
                                  />
                                ) : value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                    : trebleVoicingNote}
                </div>
              </foreignObject>
            )}

            {showBellowsGuide && (
              <>
                <text
                  x="76"
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  {bellowsStartLabel}
                </text>

                <text
                  x={viewWidth / 2}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-label"
                >
                  {t("ui.bellows")}
                </text>

                <text
                  x={viewWidth - 76}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  {bellowsEndLabel}
                </text>
              </>
            )}

            {showBellowsGuide && (
              <rect
                x="72"
                y={bellowsStripY}
                width={viewWidth - 150}
                height="12"
                rx="6"
                className="bellows-strip"
              />
            )}

            {side === "stradella" &&
              showStradellaRowLabels &&
              (() => {
                const rows = visibleRows.flatMap((kind) => {
                  const sample = buttons.find((button) => button.kind === kind && button.column === 0);
                  return sample ? [{ kind, sample, label: stradellaDiagramRowLabel(kind, stradellaRowLabel(kind), language) }] : [];
                });
                const fontSize = fittedRowLabelFontSize(
                  rows.map(({ sample, label }) => ({ label, rightEdge: sample.x - buttonSize - 10 })), measureRowLabelWidth);
                return rows.map(({ kind, sample, label }) => (
                  <text
                    key={kind}
                    x={sample.x - buttonSize - 10}
                    y={sample.y + 4}
                    textAnchor="end"
                    className="stradella-row-label"
                    style={fontSize < ROW_LABEL_FONT_SIZE ? { fontSize } : undefined}
                  >
                    {label}
                  </text>
                ));
              })()}

            <DiagramButtonLayer
              buttons={buttons} overlays={overlays} sequenceSteps={sequenceSteps}
              scaleFinderButtons={scaleFinderButtons} finderButtonIds={finderButtonIds}
              progressionPreviewButtonIds={progressionPreviewButtonIds}
              abcActiveButtonIdSet={abcActiveButtonIdSet}
              bassPatternActiveButtonIdSet={bassPatternActiveButtonIdSet}
              harmonyProgressionActiveButtonIdSet={harmonyProgressionActiveButtonIdSet}
              stradellaChordFinderActive={stradellaChordFinderActive}
              stradellaPrimaryFinderButtonIds={stradellaPrimaryFinderButtonIds}
              stradellaRootBassFinderButtonIds={stradellaRootBassFinderButtonIds}
              getMainLabel={getMainLabel} getAccessibleLabel={accessibleButtonLabel} toggleButton={toggleButton}
              buttonSize={buttonSize} chordLabelMode={chordLabelMode}
              showScaleFinderNumbers={showScaleFinderNumbers} labelFontSize={labelFontSize}
              showButtonLabels={showButtonLabels} labelFont={labelFont}
              showSequenceNumbers={showSequenceNumbers}
              sequenceNumberPosition={sequenceNumberPosition}
              annotationActive={notesModeActive}
              annotationPointForButton={annotationPointForButton}
              annotationButtonAnchor={annotationButtonAnchor}
              fingeringPosition={fingeringPosition}
            />

            <DiagramConnections
              showScaleFinderArrows={showScaleFinderArrows}
              scaleFinderButtons={scaleFinderButtons}
              chordFinderActive={chordFinderActive} chordFinderButtons={chordFinderButtons}
              showSequenceArrows={showSequenceArrows}
              sequenceStepsWithButtons={sequenceStepsWithButtons} buttonSize={buttonSize}
              scaleFinderArrowStyle={scaleFinderArrowStyle} sequenceArrowStyle={sequenceArrowStyle}
              finderArrowheadMarkerId={finderArrowheadMarkerId}
              sequenceArrowheadMarkerId={sequenceArrowheadMarkerId}
            />

            {showProgressionPath && (
              <ProgressionPathLayer steps={harmonyProgressionPlan.steps.map((step) => step.result.playbackButtons)}
                buttonSize={buttonSize} arrowheadMarkerId={progressionArrowheadMarkerId} />
            )}

            <DiagramAnnotationsLayer
              textNotes={textNotes} inlineAnnotationEditor={inlineAnnotationEditor}
              setInlineAnnotationEditor={setInlineAnnotationEditor}
              annotationEditorRef={annotationEditorRef}
              commitInlineAnnotation={commitInlineAnnotation}
              cancelInlineAnnotation={cancelInlineAnnotation}
              viewWidth={viewWidth} viewHeight={viewHeight}
              annotationPlaceholder={t("ui.annotationPlaceholder")}
            />
          </DiagramSvgSurface>
          )}
        </div>
        </div>
        </>
        )}

        {transport && <PlaybackBar transport={transport} loading={samplesLoading || rhythmTrainer.loading} t={t} />}

        {notationKind && !notationInInspector && (
          <div className="rendered-notation-panel">
            <NotationWorkspaceContent kind={notationKind} tools={tools} />
          </div>
        )}
      </section>
  );
}
