/** Font size for the Stradella row labels.
 *
 * The labels are right-aligned in the strip between the left edge of the
 * diagram and the first button of the top row. Translated labels and large
 * button sizes can make the longest label wider than that strip, so all
 * labels share one size at which each fits its own strip. The button geometry
 * itself is never changed.
 */
export const ROW_LABEL_FONT_SIZE = 12;
const MIN_ROW_LABEL_FONT_SIZE = 7;
const ROW_LABEL_EDGE_MARGIN = 8;
/** Used when text cannot be measured (no canvas): average advance of the
 * heavy label face, in em. */
const FALLBACK_EM_PER_CHARACTER = 0.52;

/** Width of a label at ROW_LABEL_FONT_SIZE, in SVG user units. */
export type LabelMeasure = (label: string) => number;

export const estimateRowLabelWidth: LabelMeasure = (label) =>
  label.length * ROW_LABEL_FONT_SIZE * FALLBACK_EM_PER_CHARACTER;

/** One shared size: the largest at which every label fits its own strip.
 * Rows are staggered, so each label has a different right edge. */
export function fittedRowLabelFontSize(
  rows: ReadonlyArray<{ label: string; rightEdge: number }>, measure: LabelMeasure = estimateRowLabelWidth,
): number {
  let fitted = ROW_LABEL_FONT_SIZE;
  for (const { label, rightEdge } of rows) {
    const width = measure(label);
    const available = rightEdge - ROW_LABEL_EDGE_MARGIN;
    if (width > available) fitted = Math.min(fitted, ROW_LABEL_FONT_SIZE * available / width);
  }
  return Math.floor(Math.max(MIN_ROW_LABEL_FONT_SIZE, fitted) * 10) / 10;
}

let measuringContext: CanvasRenderingContext2D | null | undefined;

/** Exact measurement in the browser, with the font the diagram really uses. */
export function measureRowLabelWidth(label: string): number {
  if (typeof document === "undefined") return estimateRowLabelWidth(label);
  measuringContext ??= document.createElement("canvas").getContext("2d");
  if (!measuringContext) return estimateRowLabelWidth(label);
  const family = getComputedStyle(document.querySelector("svg.diagram") ?? document.documentElement).fontFamily;
  measuringContext.font = `900 ${ROW_LABEL_FONT_SIZE}px ${family}`;
  return measuringContext.measureText(label).width;
}
