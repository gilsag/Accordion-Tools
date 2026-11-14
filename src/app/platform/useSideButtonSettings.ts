import { useMemo } from "react";
import type { SideButtonSettings } from "../sideButtons";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformSpelling,
} from "./platformContexts";

/** The layout settings that generate either side's buttons: the main diagram,
 * the ABC Player's second manual and the Rhythm Trainer's two manuals. */
export function useSideButtonSettings(): SideButtonSettings {
  const { basses, trebleLayout, trebleRows, trebleSize, pianoTrebleRange, showTrebleOctaves } =
    usePlatformInstrument();
  const {
    buttonSize,
    spacing,
    diagramVerticalSpacing,
    pianoKeyWidthScale,
    pianoKeyHeightScale,
    pianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale,
    trebleAngle,
  } = usePlatformAppearance();
  const { accidental } = usePlatformSpelling();
  // Stradella buttons have no enharmonic spelling mode.
  const stradellaAccidental = accidental === "enharmonic" ? "natural" : accidental;
  return useMemo<SideButtonSettings>(
    () => ({
      basses,
      stradellaAccidental,
      trebleLayout,
      trebleRows,
      trebleSize,
      pianoTrebleRange,
      buttonSize,
      spacing,
      diagramVerticalSpacing,
      pianoKeyWidthScale,
      pianoKeyHeightScale,
      pianoBlackKeyWidthScale,
      pianoBlackKeyHeightScale,
      trebleAngle,
      showTrebleOctaves,
    }),
    [
      basses,
      stradellaAccidental,
      trebleLayout,
      trebleRows,
      trebleSize,
      pianoTrebleRange,
      buttonSize,
      spacing,
      diagramVerticalSpacing,
      pianoKeyWidthScale,
      pianoKeyHeightScale,
      pianoBlackKeyWidthScale,
      pianoBlackKeyHeightScale,
      trebleAngle,
      showTrebleOctaves,
    ],
  );
}
