/** What the workspace draws around the buttons: the status line, the
 * diagram's arrowheads, title, footer, bellows guide and Stradella row names. */
import { StradellaVoicingIntervals } from "../../components/tools/StradellaVoicingIntervals";
import {
  fittedRowLabelFontSize,
  measureRowLabelWidth,
  ROW_LABEL_FONT_SIZE,
} from "../../diagram/rowLabelFit";
import { harmonyStatusText } from "../../i18n/diagramLabels";
import { stradellaDiagramRowLabel } from "../../i18n/musicTerms";
import { fontClass } from "../../music";
import { stradellaRowLabel } from "../../stradella";
import { useAnnotateDiagram } from "../../features/annotateDiagram/annotateDiagramContext";
import {
  useHarmonyExplorer,
  useHarmonyExplorerOutput,
} from "../../features/harmonyExplorer/harmonyExplorerContext";
import {
  FINDER_ARROWHEAD_ID,
  PROGRESSION_ARROWHEAD_ID,
  SEQUENCE_ARROWHEAD_ID,
} from "../diagram/diagramMarkers";
import type { DiagramModel } from "../diagram/useDiagramModel";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformSound,
} from "../platform/platformContexts";
import { useAccordionStatusText } from "./useAccordionStatusText";

/** The status line under the toolbar, when shown: the diagram's in the accordion workspace, the circle's in the Harmony workspace. */
export function WorkspaceStatusBar() {
  const { language } = usePlatformLanguage();
  const { showStatusBar } = usePlatformAppearance();
  const { soundEnabled } = usePlatformSound();
  const { workspaceMode } = usePlatformNavigation();
  const { harmonyRelatedFamilyId } = useHarmonyExplorer();
  const { harmonyReferenceFamily, harmonyRelatedName, harmonyScale } = useHarmonyExplorerOutput();
  const statusBarText = useAccordionStatusText();
  return (
    <>
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
            soundEnabled,
            language,
          })}
        </div>
      )}
    </>
  );
}

/** Arrowheads for the sequence, the Finders and the progression path. */
export function DiagramMarkers() {
  const { sequenceArrowheadSize } = useAnnotateDiagram().sequence;
  return (
    <defs>
      <marker
        id={SEQUENCE_ARROWHEAD_ID}
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
        id={FINDER_ARROWHEAD_ID}
        markerWidth="5"
        markerHeight="5"
        refX="4"
        refY="2.5"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M 0 0 L 5 2.5 L 0 5 z" className="finder-arrowhead" />
      </marker>
      <marker
        id={PROGRESSION_ARROWHEAD_ID}
        markerWidth="9"
        markerHeight="9"
        refX="8"
        refY="4.5"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M 0 0 L 9 4.5 L 0 9 z" className="progression-path-arrowhead" />
      </marker>
    </defs>
  );
}

/** The diagram's title, unless titles are off. */
export function DiagramTitle({ diagram }: { diagram: DiagramModel }) {
  const { titleFont, titleMode } = usePlatformAppearance();
  const { effectiveTitleSize, finalTitle, viewWidth } = diagram;
  return (
    titleMode !== "none" && (
      <text
        x={viewWidth / 2}
        y="34"
        textAnchor="middle"
        className={`title ${fontClass(titleFont)}`}
        style={{ fontSize: effectiveTitleSize }}
      >
        {finalTitle}
      </text>
    )
  );
}

/** The footer under the diagram: the Stradella explanation (the Chord
 * Finder's realization or the assistant's step), or the treble voicing note. */
export function DiagramFooter({ diagram }: { diagram: DiagramModel }) {
  const {
    stradellaFooter,
    trebleFooter,
    buttonTrebleFooter,
    finderFooterHeight,
    stradellaFinderFooterY,
    trebleFooterFontSize,
    trebleFooterHeight,
    trebleFooterY,
    viewWidth,
  } = diagram;
  const finderFooterEnabled = stradellaFooter !== null;
  const trebleFooterEnabled = trebleFooter !== null;
  return (
    (finderFooterEnabled || trebleFooterEnabled) && (
      <foreignObject
        x={32}
        y={trebleFooterEnabled ? trebleFooterY : stradellaFinderFooterY}
        width={viewWidth - 64}
        height={
          trebleFooterEnabled && buttonTrebleFooter
            ? trebleFooterHeight
            : trebleFooterEnabled
              ? 128
              : finderFooterHeight
        }
      >
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: `${trebleFooter ? trebleFooterFontSize : stradellaFooter?.fontSize}px`,
            fontWeight: trebleFooterEnabled ? 600 : 400,
            textAlign: finderFooterEnabled ? "left" : "center",
            lineHeight: finderFooterEnabled ? 1.3 : 1.15,
            overflowWrap: "anywhere",
            color: "#20252a",
          }}
        >
          {stradellaFooter ? (
            <div className="finder-annotation-block">
              {stradellaFooter.lines.map((line, index) => {
                const level = stradellaFooter.levelForLine(line);
                const colon = line.indexOf(":");
                const label = colon > 0 ? line.slice(0, colon + 1) : "";
                const value = colon > 0 ? line.slice(colon + 1).trim() : line;
                const voicing = level === "voicing" ? stradellaFooter.voicing : null;
                return (
                  <div
                    key={`${level ?? "line"}-${index}`}
                    className={`finder-annotation-line${voicing ? " finder-annotation-line-voicing" : ""}`}
                  >
                    {label && (
                      <div className="finder-annotation-label">
                        <strong>{label}</strong>
                      </div>
                    )}
                    <div className="finder-annotation-value">
                      {voicing ? (
                        <StradellaVoicingIntervals
                          notes={voicing.notes}
                          root={stradellaFooter.root}
                          pattern={stradellaFooter.pattern}
                          fontSize={stradellaFooter.fontSize}
                        />
                      ) : (
                        value
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            trebleFooter?.text
          )}
        </div>
      </foreignObject>
    )
  );
}

/** The bellows direction guide above the buttons. */
export function BellowsGuide({ diagram }: { diagram: DiagramModel }) {
  const { t } = usePlatformLanguage();
  const { showBellowsGuide } = usePlatformAppearance();
  const { bellowsEndLabel, bellowsLabelY, bellowsStartLabel, bellowsStripY, viewWidth } = diagram;
  return (
    <>
      {showBellowsGuide && (
        <>
          <text x="76" y={bellowsLabelY} textAnchor="middle" className="bellows-end-label">
            {bellowsStartLabel}
          </text>

          <text x={viewWidth / 2} y={bellowsLabelY} textAnchor="middle" className="bellows-label">
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
    </>
  );
}

/** The Stradella row names left of the first column, shrunk to fit. */
export function StradellaRowLabels({ diagram }: { diagram: DiagramModel }) {
  const { language } = usePlatformLanguage();
  const { side } = usePlatformInstrument();
  const { buttonSize, showStradellaRowLabels } = usePlatformAppearance();
  const { buttons, visibleRows } = diagram;
  return (
    side === "stradella" &&
    showStradellaRowLabels &&
    (() => {
      const rows = visibleRows.flatMap((kind) => {
        const sample = buttons.find((button) => button.kind === kind && button.column === 0);
        return sample
          ? [
              {
                kind,
                sample,
                label: stradellaDiagramRowLabel(kind, stradellaRowLabel(kind), language),
              },
            ]
          : [];
      });
      const fontSize = fittedRowLabelFontSize(
        rows.map(({ sample, label }) => ({
          label,
          rightEdge: sample.x - buttonSize - 10,
        })),
        measureRowLabelWidth,
      );
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
    })()
  );
}
