import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { calculateDiagramGeometry } from "../../diagram/diagramGeometry";
import { svgPointFromClient } from "../../diagram/diagramExport";
import { playButtonSound } from "../../sound";
import { stradellaVisibleRoots, stradellaVisibleRows } from "../../stradella";
import type { DiagramButton } from "../../types";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformShell,
  usePlatformSound,
} from "../platform/platformContexts";
import { useDiagramLabels } from "../useDiagramLabels";
import { useDiagramButtons } from "./diagramButtonsContext";
import { useDiagramContributions } from "./diagramContributions";

/** Everything the accordion diagram draws: the generated buttons with the
 * tools' highlight layers, the title for the title mode, the active tool's
 * footer, the geometry that fits them, the SVG style, and what a click does.
 * Read once per render of the workspace and passed down. */
export function useDiagramModel() {
  const { t } = usePlatformLanguage();
  const instrument = usePlatformInstrument();
  const appearance = usePlatformAppearance();
  const { soundOptions } = usePlatformSound();
  const { svgRef } = usePlatformShell();
  const { buttons } = useDiagramButtons();
  const { getMainLabel, localizedAutoTitle } = useDiagramLabels();
  const contributions = useDiagramContributions();
  const { note } = contributions;
  const { side, basses, trebleLayout, pianoTrebleRange, trebleSize } = instrument;
  const { titleMode, customTitle, diagramVerticalSpacing } = appearance;
  const isPianoTreble = side === "treble" && trebleLayout === "piano";

  const finalTitle =
    titleMode === "auto"
      ? localizedAutoTitle()
      : titleMode === "contextual"
        ? (note?.title ?? localizedAutoTitle())
        : titleMode === "custom"
          ? customTitle
          : "";
  const footer = note?.footer ?? null;
  const stradellaFooter = footer?.kind === "stradella" ? footer : null;
  const trebleFooter = footer?.kind === "treble" ? footer : null;
  const visibleRoots = side === "stradella" ? stradellaVisibleRoots(basses) : [];
  const visibleRows = side === "stradella" ? stradellaVisibleRows(basses) : [];
  const geometry = calculateDiagramGeometry({
    side,
    isPianoTreble,
    pianoTrebleRange,
    trebleSize,
    buttonSize: appearance.buttonSize,
    spacing: appearance.spacing,
    pianoKeyWidthScale: appearance.pianoKeyWidthScale,
    pianoKeyHeightScale: appearance.pianoKeyHeightScale,
    diagramVerticalSpacing,
    visibleRootCount: visibleRoots.length,
    visibleRowCount: visibleRows.length,
    buttons,
    titleMode,
    titleSize: appearance.titleSize,
    finalTitle,
    trebleVoicingNote: trebleFooter?.text ?? "",
    finderAnnotationDisplayLines: stradellaFooter?.lines ?? [],
    finderExplanationFontSize: stradellaFooter?.fontSize ?? 0,
    finderVoicingChartVisible: Boolean(stradellaFooter?.voicing),
    voicingChartHeight: stradellaFooter?.voicing?.height ?? 0,
    annotationLevelForLine: stradellaFooter?.levelForLine ?? (() => null),
    trebleFooterEnabled: trebleFooter !== null,
    finderFooterEnabled: stradellaFooter !== null,
  });

  /* CSS variables passed into the SVG so sliders can affect styling. */
  const svgStyle = {
    "--button-stroke-width": appearance.buttonStrokeWidth,
    "--reference-stroke-width": appearance.referenceStrokeWidth,
    "--chord-fill-strength": appearance.chordFillStrength / 100,
    ...contributions.style,
    width: `${appearance.diagramScale}%`,
  } as CSSProperties;

  /** A click on a button: the open tool's handler, then the button's sound
   * unless the handler keeps it silent. */
  function toggleButton(button: DiagramButton) {
    if (contributions.onButton?.(button) === "silent") return;
    playButtonSound(button, soundOptions);
  }

  /** A click on the diagram's background, for the open tool, in SVG coordinates. */
  function handleSvgClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (!contributions.onSurfaceClick) return;
    const point = svgPointFromClient(svgRef.current, event.clientX, event.clientY);
    if (point) contributions.onSurfaceClick(point);
  }

  return {
    ...geometry,
    buttons,
    getMainLabel,
    finalTitle,
    note,
    stradellaFooter,
    trebleFooter,
    visibleRows,
    layers: contributions.layers,
    overlays: contributions.overlays,
    handsView: contributions.handsView,
    annotationActive: contributions.layers.annotationActive,
    svgStyle,
    toggleButton,
    handleSvgClick,
    /* The treble and Stradella sides are viewed from opposite sides of the
     * instrument, so the bellows guide follows the physical ends. */
    bellowsLabelY: 70 + diagramVerticalSpacing * 0.35,
    bellowsStripY: 82 + diagramVerticalSpacing * 0.35,
    bellowsStartLabel: side === "stradella" ? t("ui.bottom") : t("ui.top"),
    bellowsEndLabel: side === "stradella" ? t("ui.top") : t("ui.bottom"),
  };
}

export type DiagramModel = ReturnType<typeof useDiagramModel>;
