import type { PlatformAppearance, PlatformInstrument } from "./platform/platformContexts";

/** Identifies the physical keyboard on the diagram: when it changes, button
 * identities change and tool-created marks (selection, fingering, sequence,
 * notes, Finder results) are stale.
 *
 * Chord and scale selections and diagram markings do not change the physical
 * keyboard configuration. Including them here would clear the Finder as soon
 * as the player selects a chord or scale (notably in compact layouts). */
export function physicalLayoutSignature(
  layout: Pick<
    PlatformInstrument,
    "side" | "basses" | "trebleLayout" | "trebleRows" | "trebleSize" | "pianoTrebleRange"
  > &
    Pick<PlatformInstrument, "showTrebleOctaves"> &
    Pick<
      PlatformAppearance,
      | "buttonSize"
      | "spacing"
      | "diagramVerticalSpacing"
      | "pianoKeyWidthScale"
      | "pianoKeyHeightScale"
      | "pianoBlackKeyWidthScale"
      | "pianoBlackKeyHeightScale"
      | "trebleAngle"
    >,
): string {
  return [
    layout.side,
    layout.basses,
    layout.trebleLayout,
    layout.trebleRows,
    layout.trebleSize,
    layout.pianoTrebleRange,
    layout.buttonSize,
    layout.spacing,
    layout.diagramVerticalSpacing,
    layout.pianoKeyWidthScale,
    layout.pianoKeyHeightScale,
    layout.pianoBlackKeyWidthScale,
    layout.pianoBlackKeyHeightScale,
    layout.trebleAngle,
    layout.showTrebleOctaves,
  ].join("|");
}
