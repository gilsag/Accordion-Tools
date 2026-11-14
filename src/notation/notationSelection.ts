/** Where a score goes. Which score is shown is the tools' (see
 * src/app/notation/scoreEntries.ts); location is never a tool's concern. */
export type NotationPlacement = "right" | "below";
export function notationLocation(
  placement: NotationPlacement,
  isPhone: boolean,
  inspectorVisible: boolean,
): "right" | "below" {
  // A hidden inspector must not hide the score: the content moves below.
  return placement === "right" && !isPhone && inspectorVisible ? "right" : "below";
}
