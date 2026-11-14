import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument, usePlatformSound } from "../../app/platform/platformContexts";
import { playButtonArpeggioThenChord, playButtonCombination } from "../../sound";
import {
  StradellaChordFinderOutputContext,
  useStradellaChordFinder,
} from "./stradellaChordFinderContext";
import { useStradellaChordFinderResults } from "./useStradellaChordFinder";

/** The ranked realizations of the requested chord on the generated buttons,
 * the selected one, what it lights and plays, and its Play command. */
export function StradellaChordFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side, stradellaRegisterModel } = usePlatformInstrument();
  const { soundOptions } = usePlatformSound();
  const state = useStradellaChordFinder();
  const results = useStradellaChordFinderResults({
    ...state,
    buttons,
    side,
    stradellaRegisterModel,
  });
  function playStradellaChordFinder() {
    const playback = results.stradellaChordFinderPlaybackButtons;
    if (state.stradellaChordFinderMode === "bass-only") {
      playButtonArpeggioThenChord(playback, soundOptions);
      return;
    }
    playButtonCombination(playback, soundOptions);
  }
  const value = { ...results, playStradellaChordFinder };
  return (
    <StradellaChordFinderOutputContext.Provider value={value}>
      {children}
    </StradellaChordFinderOutputContext.Provider>
  );
}
