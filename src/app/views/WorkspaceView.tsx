import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useAbcPlayer } from "../../features/abcPlayer/abcPlayerContext";
import { useRhythmTrainer } from "../../features/rhythmTrainer/rhythmTrainerContext";
import { FINDER_ARROWHEAD_ID, SEQUENCE_ARROWHEAD_ID } from "../diagram/diagramMarkers";
import { useDiagramDownload } from "../diagram/useDiagramDownload";
import { useDiagramModel } from "../diagram/useDiagramModel";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformPlayback,
  usePlatformShell,
  usePlatformSound,
  usePlatformSpelling,
  usePlatformTools,
} from "../platform/platformContexts";
import type { DiagramButton, Side } from "../../types";
import { AbcHandsDiagram } from "../../diagram/components/AbcHandsDiagram";
import { NotationWorkspaceContent } from "../inspector/NotationWorkspaceContent";
import type { ScoreEntry } from "../notation/scoreEntries";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { PlaybackBar } from "../components/PlaybackBar";
import { useActivePlaybackTransport } from "../playback/playbackTransports";
import { stradellaDiagramRowLabel } from "../../i18n/musicTerms";
import { WorkspaceToolbar } from "../components/WorkspaceToolbar";
import { DiagramButtonLayer } from "../../diagram/components/DiagramButtonLayer";
import { DiagramConnections } from "../../diagram/components/DiagramConnections";
import { DiagramSvgSurface } from "../../diagram/components/DiagramSvgSurface";
import { musicLabelText } from "../../music";
import { stradellaRowLabel } from "../../instrument/stradella";
import { stopAllSound } from "../../audio/sound";
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

/** The workspace: toolbar, status line, the diagram or the harmonic circle,
 * the playback bar and the score. It reads the diagram model and the
 * platform; the tools supply what is drawn for them. */
export function WorkspaceView({
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
  score: ScoreEntry | null;
  isPhone?: boolean;
  phoneSheetOpen?: boolean;
  onOpenPhonePanel?: (mode: "tools" | "settings") => void;
  inspectorAvailable?: boolean;
  inspectorVisible?: boolean;
  onToggleInspector?: () => void;
  /** The score is in the results panel, so it is not drawn below the diagram. */
  notationInInspector?: boolean;
  /** Width handles on the workspace's left and right edges. */
  panelHandles?: ReactNode;
}) {
  const { t, language } = usePlatformLanguage();
  const { side } = usePlatformInstrument();
  const {
    workspaceMode,
    activeToolSection,
    leftPanelMode,
    navigateToTool,
    selectAccordionSide,
    setPanel,
    toggleFocusPanel,
  } = usePlatformNavigation();
  const { colorTheme, accidentalStyle, buttonSize, labelFont, labelFontSize, showButtonLabels } =
    usePlatformAppearance();
  const { chordLabelMode } = usePlatformSpelling();
  const { soundEnabled, setSoundEnabled } = usePlatformSound();
  const { samplesLoading } = usePlatformPlayback();
  const { coordinator, resetWork, resetTool } = usePlatformTools();
  const { svgRef, downloadFormat, setDownloadFormat, mobileDiagramView, setMobileDiagramView } =
    usePlatformShell();
  const { setAbcHands } = useAbcPlayer();
  const rhythmTrainer = useRhythmTrainer();
  const diagram = useDiagramModel();
  const downloadCurrentDiagram = useDiagramDownload(diagram);
  const { handsView, layers } = diagram;
  // The one transport under the diagram follows the active player; each
  // player provides its entry (src/app/playback/playbackTransports.ts).
  const transport = useActivePlaybackTransport();
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  // Re-centre when the view mode, layout or highlighted buttons change, not
  // during playback (those highlights move too fast to follow).
  const diagramFocusKey = [
    mobileDiagramView,
    side,
    diagram.buttons.length,
    [...layers.finderButtonIds].join(),
    [...layers.progressionPreviewButtonIds].join(),
    layers.scaleFinderButtons.map((button) => button.id).join(),
    layers.sequenceSteps.length,
  ].join("|");
  useEffect(() => {
    scrollDiagramToFocus(canvasWrapRef.current);
  }, [diagramFocusKey]);
  // Phones show one manual at a time in a two-hand view.
  const [phoneHand, setPhoneHand] = useState<Side | null>(null);
  const shownPhoneHand = phoneHand ?? side;
  const accessibleButtonLabel = (button: DiagramButton) => {
    const name = musicLabelText(diagram.getMainLabel(button));
    if (button.kind === "treble-note") {
      return button.octave !== undefined && !/\d$/.test(name) ? `${name}${button.octave}` : name;
    }
    return `${name}, ${stradellaDiagramRowLabel(button.kind, stradellaRowLabel(button.kind), language)}`;
  };
  // Changing side stops the ABC Player, whose mapping depends on the side,
  // and with it open shows that hand.
  function selectSide(next: Side) {
    selectAccordionSide(next);
    coordinator.stopTool("abcPlayer");
    if (activeToolSection === "abcPlayer") setAbcHands(next);
  }
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
        onSelectStradella={() => selectSide("stradella")}
        onSelectTreble={() => selectSide("treble")}
        onSelectHarmony={() => {
          navigateToTool("harmonyExplorer");
          coordinator.stopTool("abcPlayer");
          coordinator.stopTool("bassPatternPlayer");
          stopAllSound();
        }}
        onShowSettings={() => (isPhone ? onOpenPhonePanel?.("settings") : setPanel("settings"))}
        onShowTools={() => (isPhone ? onOpenPhonePanel?.("tools") : setPanel("tools"))}
        onToggleFocus={toggleFocusPanel}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((current) => !current)}
        onClearWork={() => resetWork(workspaceMode === "harmony" ? "harmony" : "accordion")}
        onRestoreToolDefaults={resetTool}
        downloadFormat={downloadFormat}
        setDownloadFormat={setDownloadFormat}
        onDownloadDiagram={downloadCurrentDiagram}
      />

      <WorkspaceStatusBar />

      {workspaceMode === "harmony" ? (
        <HarmonyWorkspace />
      ) : (
        <>
          {handsView && isPhone && (
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
          {handsView?.above}
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
              className={`canvas-wrap ${handsView?.compact ? "rhythm-compact-diagrams" : ""} ${mobileDiagramView === "readable" ? "diagram-readable" : "diagram-fit"}`}
              style={
                {
                  "--mobile-diagram-readable-width": `${Math.max(960, diagram.viewWidth * 0.75)}px`,
                } as CSSProperties
              }
            >
              {handsView ? (
                <AbcHandsDiagram
                  ref={svgRef}
                  hands={handsView.hands.filter((hand) => !isPhone || hand.key === shownPhoneHand)}
                  abcActiveButtonIdSet={handsView.activeButtonIds}
                  getMainLabel={diagram.getMainLabel}
                  getAccessibleLabel={accessibleButtonLabel}
                  onButton={diagram.toggleButton}
                  style={
                    handsView.compact
                      ? { ...diagram.svgStyle, maxWidth: "880px" }
                      : diagram.svgStyle
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
                  annotationActive={diagram.annotationActive}
                  viewWidth={diagram.viewWidth}
                  viewHeight={diagram.viewHeight}
                  onClick={diagram.handleSvgClick}
                  style={diagram.svgStyle}
                >
                  <DiagramMarkers />
                  <DiagramTitle diagram={diagram} />
                  <DiagramFooter diagram={diagram} />
                  <BellowsGuide diagram={diagram} />
                  <StradellaRowLabels diagram={diagram} />
                  <DiagramButtonLayer
                    {...diagram.layers}
                    buttons={diagram.buttons}
                    getMainLabel={diagram.getMainLabel}
                    getAccessibleLabel={accessibleButtonLabel}
                    toggleButton={diagram.toggleButton}
                    buttonSize={buttonSize}
                    chordLabelMode={chordLabelMode}
                    labelFontSize={labelFontSize}
                    showButtonLabels={showButtonLabels}
                    labelFont={labelFont}
                  />
                  <DiagramConnections
                    {...diagram.layers}
                    buttonSize={buttonSize}
                    finderArrowheadMarkerId={FINDER_ARROWHEAD_ID}
                    sequenceArrowheadMarkerId={SEQUENCE_ARROWHEAD_ID}
                  />
                  {diagram.overlays.map((overlay, index) => (
                    <Fragment key={index}>{overlay(diagram)}</Fragment>
                  ))}
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
