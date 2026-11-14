import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { DiagramButton, Side } from "../../types";
import { AbcHandsDiagram } from "../../diagram/components/AbcHandsDiagram";
import { RhythmTrainerTimeline } from "../../components/tools/RhythmTrainerTimeline";
import { NotationWorkspaceContent } from "../inspector/NotationWorkspaceContent";
import type { ScoreEntry } from "../notation/scoreEntries";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { PlaybackBar } from "../components/PlaybackBar";
import { useActivePlaybackTransport } from "../playback/playbackTransports";
import { ProgressionPathLayer } from "../../diagram/components/ProgressionPathLayer";
import { stradellaDiagramRowLabel } from "../../i18n/musicTerms";
import { WorkspaceToolbar } from "../components/WorkspaceToolbar";
import { DiagramButtonLayer } from "../../diagram/components/DiagramButtonLayer";
import { DiagramConnections } from "../../diagram/components/DiagramConnections";
import { DiagramAnnotationsLayer } from "../../diagram/components/DiagramAnnotationsLayer";
import { DiagramSvgSurface } from "../../diagram/components/DiagramSvgSurface";
import { musicLabelText } from "../../music";
import { stradellaRowLabel } from "../../stradella";
import { stopAllSound } from "../../sound";
import {
  BellowsGuide,
  DiagramFooter,
  DiagramMarkers,
  DiagramTitle,
  StradellaRowLabels,
  WorkspaceStatusBar,
} from "./DiagramDecorations";
import { HarmonyWorkspace } from "./HarmonyWorkspace";
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

import type { AppControllerModel } from "../useAppController";

/** View-only component: all state and commands originate in the controller. */
export function WorkspaceView({
  model,
  score,
  isPhone = false,
  phoneSheetOpen = false,
  onOpenPhonePanel,
  inspectorAvailable = false,
  inspectorVisible = false,
  onToggleInspector,
  notationInInspector = false,
  panelHandles,
}: {
  model: AppControllerModel["workspace"];
  score: ScoreEntry | null;
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
    abcHandsView,
    setAbcHands,
    rhythmTrainer,
    abcActiveButtonIdSet,
    accidentalStyle,
    activeToolSection,
    annotateMode,
    annotationButtonAnchor,
    annotationEditorRef,
    annotationPointForButton,
    bassPatternActiveButtonIdSet,
    buttonSize,
    buttons,
    cancelInlineAnnotation,
    chordFinderActive,
    chordFinderButtons,
    chordLabelMode,
    clearHarmonyWork,
    colorTheme,
    commitInlineAnnotation,
    downloadCurrentDiagram,
    downloadFormat,
    finderArrowheadMarkerId,
    finderButtonIds,
    fingeringPosition,
    getMainLabel,
    handleSvgClick,
    harmonyProgressionActiveButtonIdSet,
    harmonyProgressionPlan,
    inlineAnnotationEditor,
    labelFont,
    labelFontSize,
    language,
    leftPanelMode,
    mobileDiagramView,
    navigateToTool,
    overlays,
    progressionPreviewButtonIds,
    resetCurrentToolDefaults,
    resetDiagramWork,
    scaleFinderArrowStyle,
    scaleFinderButtons,
    selectAccordionSide,
    sequenceArrowStyle,
    sequenceArrowheadMarkerId,
    sequenceNumberPosition,
    sequenceSteps,
    sequenceStepsWithButtons,
    setDownloadFormat,
    setInlineAnnotationEditor,
    setMobileDiagramView,
    setPanel,
    setSoundEnabled,
    showButtonLabels,
    showScaleFinderArrows,
    showScaleFinderNumbers,
    showSequenceArrows,
    showSequenceNumbers,
    side,
    soundEnabled,
    stopAbcPlayback,
    stopBassPatternPlayback,
    stradellaChordFinderActive,
    stradellaPrimaryFinderButtonIds,
    stradellaRootBassFinderButtonIds,
    svgRef,
    svgStyle,
    t,
    textNotes,
    toggleButton,
    toggleFocusPanel,
    viewHeight,
    viewWidth,
    workspaceMode,
    samplesLoading,
    progressionPathVisible,
  } = model;
  // The one transport under the diagram follows the active player; each
  // player provides its entry (src/app/playback/playbackTransports.ts).
  // Annotate Diagram's Notes mode owns the note cursor and anchor markers.
  const notesModeActive = activeToolSection === "annotateDiagram" && annotateMode === "notes";
  const transport = useActivePlaybackTransport();
  const showProgressionPath =
    workspaceMode === "accordion" &&
    side === "stradella" &&
    activeToolSection === "progressionAssistant" &&
    progressionPathVisible &&
    harmonyProgressionPlan.playable;
  const progressionArrowheadMarkerId = `${finderArrowheadMarkerId}-progression`;
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  // Re-centre when the view mode, layout or highlighted buttons change, not
  // during playback (those highlights move too fast to follow).
  const diagramFocusKey = [
    mobileDiagramView,
    side,
    buttons.length,
    [...finderButtonIds].join(),
    [...progressionPreviewButtonIds].join(),
    scaleFinderButtons.map((button) => button.id).join(),
    sequenceSteps.length,
  ].join("|");
  useEffect(() => {
    scrollDiagramToFocus(canvasWrapRef.current);
  }, [diagramFocusKey]);
  // Phones show one manual at a time in the ABC Player's Both hands view.
  const [phoneHand, setPhoneHand] = useState<Side | null>(null);
  const shownPhoneHand = phoneHand ?? side;
  const combinedHandsView =
    abcHandsView ??
    (activeToolSection === "rhythmTrainer"
      ? { trebleButtons: rhythmTrainer.trebleButtons, stradellaButtons: rhythmTrainer.bassButtons }
      : null);
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
        inspectorAvailable={inspectorAvailable}
        inspectorVisible={inspectorVisible}
        onToggleInspector={onToggleInspector}
        t={t}
        workspaceMode={workspaceMode}
        side={side}
        leftPanelMode={leftPanelMode}
        activeToolSection={activeToolSection}
        onSelectStradella={() => {
          selectAccordionSide("stradella");
          stopAbcPlayback();
          if (activeToolSection === "abcPlayer") setAbcHands("stradella");
        }}
        onSelectTreble={() => {
          selectAccordionSide("treble");
          stopAbcPlayback();
          if (activeToolSection === "abcPlayer") setAbcHands("treble");
        }}
        onSelectHarmony={() => {
          navigateToTool("harmonyExplorer");
          stopAbcPlayback();
          stopBassPatternPlayback();
          stopAllSound();
        }}
        onShowSettings={() => (isPhone ? onOpenPhonePanel?.("settings") : setPanel("settings"))}
        onShowTools={() => (isPhone ? onOpenPhonePanel?.("tools") : setPanel("tools"))}
        onToggleFocus={toggleFocusPanel}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((current) => !current)}
        onClearWork={() => {
          if (workspaceMode === "harmony") clearHarmonyWork();
          else resetDiagramWork();
        }}
        onRestoreToolDefaults={resetCurrentToolDefaults}
        downloadFormat={downloadFormat}
        setDownloadFormat={setDownloadFormat}
        onDownloadDiagram={downloadCurrentDiagram}
      />

      <WorkspaceStatusBar model={model} />

      {workspaceMode === "harmony" ? (
        <HarmonyWorkspace model={model} />
      ) : (
        <>
          {combinedHandsView && isPhone && (
            <div className="abc-hand-switch">
              <SegmentedChoice
                label={t("ui.abcShowHand")}
                value={shownPhoneHand}
                onChange={setPhoneHand}
                options={[
                  { value: "treble", label: t("nav.treble") },
                  { value: "stradella", label: t("nav.stradella") },
                ]}
              />
            </div>
          )}
          {activeToolSection === "rhythmTrainer" && (
            <RhythmTrainerTimeline
              exercise={rhythmTrainer.exercise}
              positionUnit={rhythmTrainer.positionUnit}
              playing={rhythmTrainer.playing}
              activeRhythmKeys={rhythmTrainer.activeRhythmKeys}
              t={t}
            />
          )}
          <div className="diagram-mobile-frame">
            <div className="mobile-diagram-view-control">
              <button
                type="button"
                className="mobile-diagram-toggle"
                aria-label={
                  mobileDiagramView === "readable" ? t("ui.fitDiagram") : t("ui.readableScroll")
                }
                title={
                  mobileDiagramView === "readable" ? t("ui.fitDiagram") : t("ui.readableScroll")
                }
                aria-pressed={mobileDiagramView === "fit"}
                onClick={() =>
                  setMobileDiagramView((current) => (current === "readable" ? "fit" : "readable"))
                }
              >
                {mobileDiagramView === "readable" ? "⤢" : "↔"}
              </button>
            </div>
            <div
              ref={canvasWrapRef}
              className={`canvas-wrap ${activeToolSection === "rhythmTrainer" ? "rhythm-compact-diagrams" : ""} ${mobileDiagramView === "readable" ? "diagram-readable" : "diagram-fit"}`}
              style={
                {
                  "--mobile-diagram-readable-width": `${Math.max(960, viewWidth * 0.75)}px`,
                } as CSSProperties
              }
            >
              {combinedHandsView ? (
                <AbcHandsDiagram
                  ref={svgRef}
                  hands={(activeToolSection === "rhythmTrainer"
                    ? [
                        {
                          key: "stradella",
                          caption: t("nav.stradella"),
                          buttons: combinedHandsView.stradellaButtons,
                        },
                        {
                          key: "treble",
                          caption: t("nav.treble"),
                          buttons: combinedHandsView.trebleButtons,
                        },
                      ]
                    : [
                        {
                          key: "treble",
                          caption: t("ui.abcHandCaption", { hand: t("nav.treble"), voice: 1 }),
                          buttons: combinedHandsView.trebleButtons,
                        },
                        {
                          key: "stradella",
                          caption: t("ui.abcHandCaption", { hand: t("nav.stradella"), voice: 2 }),
                          buttons: combinedHandsView.stradellaButtons,
                        },
                      ]
                  ).filter((hand) => !isPhone || hand.key === shownPhoneHand)}
                  abcActiveButtonIdSet={
                    activeToolSection === "rhythmTrainer"
                      ? rhythmTrainer.activeButtonIdSet
                      : abcActiveButtonIdSet
                  }
                  getMainLabel={getMainLabel}
                  getAccessibleLabel={accessibleButtonLabel}
                  onButton={toggleButton}
                  style={
                    activeToolSection === "rhythmTrainer"
                      ? { ...svgStyle, maxWidth: "880px" }
                      : svgStyle
                  }
                  colorTheme={colorTheme}
                  accidentalStyle={accidentalStyle}
                  buttonSize={buttonSize}
                  chordLabelMode={chordLabelMode}
                  labelFontSize={labelFontSize}
                  showButtonLabels={showButtonLabels}
                  labelFont={labelFont}
                />
              ) : (
                <DiagramSvgSurface
                  ref={svgRef}
                  colorTheme={colorTheme}
                  accidentalStyle={accidentalStyle}
                  annotationActive={notesModeActive}
                  viewWidth={viewWidth}
                  viewHeight={viewHeight}
                  onClick={handleSvgClick}
                  style={svgStyle}
                >
                  <DiagramMarkers
                    model={model}
                    progressionMarkerId={progressionArrowheadMarkerId}
                  />

                  <DiagramTitle model={model} />

                  <DiagramFooter model={model} />

                  <BellowsGuide model={model} />

                  <StradellaRowLabels model={model} />

                  <DiagramButtonLayer
                    buttons={buttons}
                    overlays={overlays}
                    sequenceSteps={sequenceSteps}
                    scaleFinderButtons={scaleFinderButtons}
                    finderButtonIds={finderButtonIds}
                    progressionPreviewButtonIds={progressionPreviewButtonIds}
                    abcActiveButtonIdSet={abcActiveButtonIdSet}
                    bassPatternActiveButtonIdSet={bassPatternActiveButtonIdSet}
                    harmonyProgressionActiveButtonIdSet={harmonyProgressionActiveButtonIdSet}
                    stradellaChordFinderActive={stradellaChordFinderActive}
                    stradellaPrimaryFinderButtonIds={stradellaPrimaryFinderButtonIds}
                    stradellaRootBassFinderButtonIds={stradellaRootBassFinderButtonIds}
                    getMainLabel={getMainLabel}
                    getAccessibleLabel={accessibleButtonLabel}
                    toggleButton={toggleButton}
                    buttonSize={buttonSize}
                    chordLabelMode={chordLabelMode}
                    showScaleFinderNumbers={showScaleFinderNumbers}
                    labelFontSize={labelFontSize}
                    showButtonLabels={showButtonLabels}
                    labelFont={labelFont}
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
                    chordFinderActive={chordFinderActive}
                    chordFinderButtons={chordFinderButtons}
                    showSequenceArrows={showSequenceArrows}
                    sequenceStepsWithButtons={sequenceStepsWithButtons}
                    buttonSize={buttonSize}
                    scaleFinderArrowStyle={scaleFinderArrowStyle}
                    sequenceArrowStyle={sequenceArrowStyle}
                    finderArrowheadMarkerId={finderArrowheadMarkerId}
                    sequenceArrowheadMarkerId={sequenceArrowheadMarkerId}
                  />

                  {showProgressionPath && (
                    <ProgressionPathLayer
                      steps={harmonyProgressionPlan.steps.map(
                        (step) => step.result.playbackButtons,
                      )}
                      buttonSize={buttonSize}
                      arrowheadMarkerId={progressionArrowheadMarkerId}
                    />
                  )}

                  <DiagramAnnotationsLayer
                    textNotes={textNotes}
                    inlineAnnotationEditor={inlineAnnotationEditor}
                    setInlineAnnotationEditor={setInlineAnnotationEditor}
                    annotationEditorRef={annotationEditorRef}
                    commitInlineAnnotation={commitInlineAnnotation}
                    cancelInlineAnnotation={cancelInlineAnnotation}
                    viewWidth={viewWidth}
                    viewHeight={viewHeight}
                    annotationPlaceholder={t("ui.annotationPlaceholder")}
                  />
                </DiagramSvgSurface>
              )}
            </div>
          </div>
        </>
      )}

      {transport && (
        <PlaybackBar
          transport={transport}
          loading={samplesLoading || rhythmTrainer.loading}
          t={t}
        />
      )}

      {score && !notationInInspector && (
        <div className="rendered-notation-panel">
          <NotationWorkspaceContent score={score} />
        </div>
      )}
    </section>
  );
}
