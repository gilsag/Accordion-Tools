import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument } from "../../app/platform/platformContexts";
import { BassPatternPlayerOutputContext, useBassPatternPlayer } from "./bassPatternPlayerContext";
import { useBassPatternResults } from "./useBassPatternPlayer";

/** The selected pattern and progression, their events on the buttons, and
 * what is lit. */
export function BassPatternPlayerOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const state = useBassPatternPlayer();
  const value = useBassPatternResults({ ...state, buttons, side });
  return (
    <BassPatternPlayerOutputContext.Provider value={value}>
      {children}
    </BassPatternPlayerOutputContext.Provider>
  );
}
