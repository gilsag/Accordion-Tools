import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument } from "../../app/platform/platformContexts";
import {
  StradellaChordFinderOutputContext,
  useStradellaChordFinder,
} from "./stradellaChordFinderContext";
import { useStradellaChordFinderResults } from "./useStradellaChordFinder";

/** The ranked realizations of the requested chord on the generated buttons,
 * the selected one, and what it lights and plays. */
export function StradellaChordFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side, stradellaRegisterModel } = usePlatformInstrument();
  const state = useStradellaChordFinder();
  const value = useStradellaChordFinderResults({ ...state, buttons, side, stradellaRegisterModel });
  return (
    <StradellaChordFinderOutputContext.Provider value={value}>
      {children}
    </StradellaChordFinderOutputContext.Provider>
  );
}
