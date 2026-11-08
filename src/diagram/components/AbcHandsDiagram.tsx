import { forwardRef } from "react";
import type { CSSProperties } from "react";
import type { AccidentalStyle, ChordLabelMode, ColorTheme, DiagramButton, FontFamily, Overlay, SequenceStep } from "../../types";
import { DiagramButtonLayer } from "./DiagramButtonLayer";

const NO_IDS: ReadonlySet<string> = new Set();
const NO_OVERLAYS: Record<string, Overlay> = {};
const NO_STEPS: SequenceStep[] = [];
const NO_BUTTONS: DiagramButton[] = [];
const CAPTION_HEIGHT = 34;
const SECTION_GAP = 18;

export type AbcHand = { key: string; caption: string; buttons: DiagramButton[] };

type AbcHandsDiagramProps = {
  /** Manuals in display order, treble first; phones pass only the one shown. */
  hands: AbcHand[];
  abcActiveButtonIdSet: ReadonlySet<string>;
  getMainLabel: (button: DiagramButton) => string;
  getAccessibleLabel: (button: DiagramButton) => string;
  onButton: (button: DiagramButton) => void;
  style: CSSProperties;
  colorTheme: ColorTheme;
  accidentalStyle: AccidentalStyle;
  buttonSize: number;
  chordLabelMode: ChordLabelMode;
  labelFontSize: number;
  showButtonLabels: boolean;
  labelFont: FontFamily;
};

/**
 * The ABC Player's Both hands view: the treble and Stradella manuals in one
 * SVG, at the same scale and width, each under a caption such as
 * "Treble, voice 1". Only the ABC highlights are drawn: no title, bellows
 * guide, row names, marks or Finder results. Download saves this SVG.
 */
export const AbcHandsDiagram = forwardRef<SVGSVGElement, AbcHandsDiagramProps>(function AbcHandsDiagram({
  hands, abcActiveButtonIdSet, getMainLabel, getAccessibleLabel, onButton, style, colorTheme,
  accidentalStyle, buttonSize, chordLabelMode, labelFontSize, showButtonLabels, labelFont,
}, ref) {
  const half = (size: number | undefined) => (size ?? buttonSize * 2) / 2;
  const margin = buttonSize * 0.9;
  const sideMargin = buttonSize * 1.5;
  const measured = hands.filter((hand) => hand.buttons.length > 0).map((hand) => {
    const left = Math.min(...hand.buttons.map((button) => button.x - half(button.width)));
    const right = Math.max(...hand.buttons.map((button) => button.x + half(button.width)));
    const top = Math.min(...hand.buttons.map((button) => button.y - half(button.height)));
    const bottom = Math.max(...hand.buttons.map((button) => button.y + half(button.height)));
    return { hand, left, width: right - left, top, height: bottom - top };
  });
  const viewWidth = Math.max(1, ...measured.map((item) => item.width)) + sideMargin * 2;
  let y = 0;
  const sections = measured.map((item, index) => {
    const sectionTop = y + (index > 0 ? SECTION_GAP : 0);
    const offsetX = (viewWidth - item.width) / 2 - item.left;
    const offsetY = sectionTop + CAPTION_HEIGHT + margin - item.top;
    y = sectionTop + CAPTION_HEIGHT + item.height + margin * 2;
    return { ...item, sectionTop, offsetX, offsetY, captionX: (viewWidth - item.width) / 2 };
  });
  const viewHeight = Math.max(1, y);
  return (
    <svg
      ref={ref}
      className={`diagram abc-hands-diagram diagram-theme-${colorTheme} accidental-style-${accidentalStyle}`}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="xMinYMin meet"
      role="img"
      aria-label={hands.map((hand) => hand.caption).join(" · ")}
      style={style}
    >
      {sections.map((section, index) => (
        <g key={section.hand.key} className="abc-hand" data-hand={section.hand.key}>
          {index > 0 && (
            <line x1={sideMargin} x2={viewWidth - sideMargin} y1={section.sectionTop - SECTION_GAP / 2}
              y2={section.sectionTop - SECTION_GAP / 2} className="abc-hand-divider" />
          )}
          <text x={section.captionX} y={section.sectionTop + 24} className="abc-hand-caption">{section.hand.caption}</text>
          <g transform={`translate(${section.offsetX} ${section.offsetY})`}>
            <DiagramButtonLayer
              buttons={section.hand.buttons} overlays={NO_OVERLAYS} sequenceSteps={NO_STEPS}
              scaleFinderButtons={NO_BUTTONS} finderButtonIds={NO_IDS}
              progressionPreviewButtonIds={NO_IDS}
              abcActiveButtonIdSet={abcActiveButtonIdSet}
              bassPatternActiveButtonIdSet={NO_IDS}
              harmonyProgressionActiveButtonIdSet={NO_IDS}
              stradellaChordFinderActive={false}
              stradellaPrimaryFinderButtonIds={NO_IDS}
              stradellaRootBassFinderButtonIds={NO_IDS}
              getMainLabel={getMainLabel} getAccessibleLabel={getAccessibleLabel} toggleButton={onButton}
              buttonSize={buttonSize} chordLabelMode={chordLabelMode}
              showScaleFinderNumbers={false} labelFontSize={labelFontSize}
              showButtonLabels={showButtonLabels} labelFont={labelFont}
              showSequenceNumbers={false} sequenceNumberPosition="none"
              annotationActive={false}
              annotationPointForButton={(button) => ({ x: button.x, y: button.y })}
              annotationButtonAnchor="center"
              fingeringPosition="inside-bottom"
            />
          </g>
        </g>
      ))}
    </svg>
  );
});
