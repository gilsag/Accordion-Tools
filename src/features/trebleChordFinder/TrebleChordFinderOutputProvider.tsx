import { useMemo, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument } from "../../app/platform/platformContexts";
import { TrebleChordFinderOutputContext, useTrebleChordFinder } from "./trebleChordFinderContext";
import { useTrebleChordFinderButtons } from "./useTrebleChordFinder";

/** The chord's buttons on the treble diagram. */
export function TrebleChordFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const state = useTrebleChordFinder();
  const chordFinderButtons = useTrebleChordFinderButtons({
    ...state,
    buttons,
    isTrebleLikeSide: side === "treble",
  });
  const value = useMemo(() => ({ chordFinderButtons }), [chordFinderButtons]);
  return (
    <TrebleChordFinderOutputContext.Provider value={value}>
      {children}
    </TrebleChordFinderOutputContext.Provider>
  );
}
