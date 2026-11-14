import type { ReactNode } from "react";
import { usePlatformTools } from "../../app/platform/platformContexts";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { resetStradellaFinder } from "../../app/resetCommands";
import { finderHandle } from "../../app/tools/toolHandles";
import { StradellaChordFinderContext } from "./stradellaChordFinderContext";
import { useStradellaChordFinderState } from "./useStradellaChordFinder";

/** Owns the Stradella Chord Finder's request, limits, explanation display,
 * selected realization and active state. Its results need the diagram's
 * buttons and are still derived by the application controller. */
export function StradellaChordFinderProvider({ children }: { children: ReactNode }) {
  const state = useStradellaChordFinderState();
  const { resetWork } = usePlatformTools();
  useOwnedSettings("stradellaChordFinder", state);
  useToolHandle("stradellaChordFinder", {
    ...finderHandle(state.setStradellaChordFinderActive),
    // "Reset tool" restores the Finder's own preferences and clears the work
    // on the diagram; instrument and sound settings are untouched.
    resetPreferences() {
      resetStradellaFinder({
        setRoot: state.setStradellaChordFinderRoot,
        setPattern: state.setStradellaChordFinderPattern,
        setMode: state.setStradellaChordFinderMode,
        setRequestedBass: state.setStradellaChordFinderRequestedBass,
        setRealizationIndex: state.setStradellaChordFinderRealizationIndex,
        setMaxButtons: state.setFinderMaxButtons,
        setSpanColumns: state.setFinderSpanColumns,
        setMinimumNominalGap: state.setStradellaMinimumNominalGap,
        setMarkRootBass: state.setStradellaChordFinderMarkRootBass,
        setShowRealizationNote: state.setShowFinderRealizationNote,
        setShowVoicingIntervals: state.setShowStradellaVoicingIntervals,
        setNoteLevels: state.setStradellaNoteLevels,
        setExplanationFontSize: state.setFinderExplanationFontSize,
      });
      resetWork("accordion");
    },
  });
  return (
    <StradellaChordFinderContext.Provider value={state}>
      {children}
    </StradellaChordFinderContext.Provider>
  );
}
