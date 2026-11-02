/**
 * Pure SVG viewBox and footer geometry: kept separate from React state,
 * musical rendering and export code. Preserve these calculations because
 * they affect SVG dimensions, PNG scale and annotation placement.
 */
import type { Side, TitleMode, PianoTrebleRange, TrebleSizePreset } from "../types";
import { pianoTrebleWhiteKeyCount } from "../pianoTreble";
/** Existing fixed widths for the larger treble presets, colocated with the
 * sizing selector to avoid a diagram-domain dependency on app presentation. */
const TREBLE_SIZE_VIEW_WIDTH: Record<TrebleSizePreset, number> = {
  "one-octave": 500,
  "two-octave": 650,
  small: 1080,
  full: 1220,
  large: 1460,
};

export interface DiagramGeometryInputs {
  side: Side;
  isPianoTreble: boolean;
  pianoTrebleRange: PianoTrebleRange;
  trebleSize: TrebleSizePreset;
  buttonSize: number;
  spacing: number;
  pianoKeyWidthScale: number;
  pianoKeyHeightScale: number;
  diagramVerticalSpacing: number;
  visibleRootCount: number;
  visibleRowCount: number;
  buttons: ReadonlyArray<{ x: number; y: number }>;
  titleMode: TitleMode;
  titleSize: number;
  finalTitle: string;
  trebleVoicingNote: string;
  finderAnnotationDisplayLines: readonly string[];
  finderExplanationFontSize: number;
  finderVoicingChartVisible: boolean;
  voicingChartHeight: number;
  annotationLevelForLine(line: string): "identity" | "pitchClasses" | "voicing" | "physical" | null;
  trebleFooterEnabled: boolean;
  finderFooterEnabled: boolean;
}

export function calculateDiagramGeometry(inputs: DiagramGeometryInputs) {
  const {
    side, isPianoTreble, pianoTrebleRange, trebleSize, buttonSize, spacing,
    pianoKeyWidthScale, pianoKeyHeightScale, diagramVerticalSpacing,
    visibleRootCount, visibleRowCount, buttons, titleMode, titleSize, finalTitle,
    trebleVoicingNote, finderAnnotationDisplayLines, finderExplanationFontSize,
    finderVoicingChartVisible, voicingChartHeight, annotationLevelForLine,
    trebleFooterEnabled, finderFooterEnabled,
  } = inputs;
  const viewWidth =
    side === "stradella"
      ? Math.max(1040, 275 + visibleRootCount * buttonSize * spacing * 1.15)
      : isPianoTreble
        ? Math.max(
            880,
            185 +
              pianoTrebleWhiteKeyCount(pianoTrebleRange) *
                buttonSize *
                spacing *
                0.92 *
                pianoKeyWidthScale,
          )
        : ["one-octave", "two-octave"].includes(trebleSize)
          ? Math.max(420, ...buttons.map((button) => button.x + buttonSize + 96))
          : TREBLE_SIZE_VIEW_WIDTH[trebleSize];

  // Longer contextual titles (especially selected treble inversions) must
  // remain within compact one-/two-octave SVG widths and exported PNGs.
  // Only contextual titles auto-fit; keep the user's custom font size intact.
  const effectiveTitleSize = titleMode === "contextual"
    ? Math.min(titleSize, Math.max(10, Math.floor((viewWidth - 64) / (Math.max(1, finalTitle.length) * 0.62))))
    : titleSize;

  const baseViewHeight =
    side === "stradella"
      ? Math.max(
          320,
          220 +
            visibleRowCount * buttonSize * spacing * 0.88 +
            diagramVerticalSpacing,
        )
      : isPianoTreble
        ? Math.max(
            360,
            285 +
              buttonSize * 5.9 * pianoKeyHeightScale +
              diagramVerticalSpacing,
          )
        : 450 + diagramVerticalSpacing;

  // Keep the Treble Chord Finder note close to the actual keyboard. A fixed
  // 450px base height leaves a large gap when the layout has only three rows.
  // Piano and Stradella retain their existing footer positioning.
  const buttonTrebleFooter = side === "treble" && !isPianoTreble && buttons.length > 0;
  const trebleFooterY = buttonTrebleFooter
    ? Math.max(...buttons.map((button) => button.y + buttonSize)) + Math.max(22, buttonSize * 0.8)
    : baseViewHeight - 21;
  // Reserve enough room for explanatory notes that wrap on narrow diagrams,
  // including the one- and two-octave presets.
  const trebleFooterFontSize = viewWidth < 600 ? 21 : 26;
  const trebleFooterLineEstimate = Math.max(1, Math.ceil(
    trebleVoicingNote.length * trebleFooterFontSize * 0.65 * 1.18 / Math.max(1, viewWidth - 64),
  ));
  const trebleFooterHeight = Math.max(
    80,
    Math.ceil(trebleFooterLineEstimate * trebleFooterFontSize * 1.15 + 20),
  );
  // Match the shared CSS label column using the longest enabled translated label.
  const finderAnnotationLabelWidth = Math.max(150, ...finderAnnotationDisplayLines.map((line) =>
    Math.ceil(Math.max(0, line.indexOf(":") + 1) * finderExplanationFontSize * 0.65)));
  const finderAnnotationContentWidth = Math.max(220, viewWidth - 64 - finderAnnotationLabelWidth - 18);
  const finderVoicingChartHeight = finderVoicingChartVisible ? voicingChartHeight : 0;
  const finderFooterHeight = (() => {
    let total = 16;
    for (const line of finderAnnotationDisplayLines) {
      const level = annotationLevelForLine(line);
      if (level === "voicing" && finderVoicingChartVisible) {
        total += finderVoicingChartHeight + 0.42 * finderExplanationFontSize;
        continue;
      }
      const colon = line.indexOf(":");
      const value = colon > 0 ? line.slice(colon + 1).trim() : line;
      const wrappedLines = Math.max(1, Math.ceil(
        value.length * finderExplanationFontSize * 0.59 / Math.max(1, finderAnnotationContentWidth),
      ));
      total += Math.max(finderExplanationFontSize * 1.3, wrappedLines * finderExplanationFontSize * 1.3) +
        0.42 * finderExplanationFontSize;
    }
    return Math.max(82, Math.ceil(total));
  })();
  // Place the annotation closer to the lowest physical button, retaining a
  // clearance for selection outlines and alternate Stradella row configurations.
  const stradellaFinderFooterY = Math.max(
    baseViewHeight - 90,
    Math.max(0, ...buttons.map((button) => button.y + buttonSize * 0.58)) + 24,
  );
  const viewHeight = trebleFooterEnabled && buttonTrebleFooter
    ? trebleFooterY + trebleFooterHeight + 8
    : finderFooterEnabled ? stradellaFinderFooterY + finderFooterHeight + 12
      : baseViewHeight + (trebleFooterEnabled ? 112 : 0);

  return {
    viewWidth, effectiveTitleSize, buttonTrebleFooter, trebleFooterY, trebleFooterFontSize,
    trebleFooterHeight, finderAnnotationLabelWidth, finderAnnotationContentWidth,
    finderVoicingChartHeight, finderFooterHeight, stradellaFinderFooterY, viewHeight,
  };
}
