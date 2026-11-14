import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument } from "../../app/platform/platformContexts";
import { ScaleFinderOutputContext, useScaleFinder } from "./scaleFinderContext";
import { useScaleFinderResults } from "./useScaleFinder";

/** The scale's buttons on the diagram, taken from the generated buttons so
 * identities, order and row choices match what is drawn and played. */
export function ScaleFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const state = useScaleFinder();
  const value = useScaleFinderResults({
    ...state,
    buttons,
    side,
    isTrebleLikeSide: side === "treble",
  });
  return (
    <ScaleFinderOutputContext.Provider value={value}>{children}</ScaleFinderOutputContext.Provider>
  );
}
