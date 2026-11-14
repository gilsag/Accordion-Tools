import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformSound,
} from "../../app/platform/platformContexts";
import { describeTrebleChord } from "../../tools/trebleChordExplanation";
import { playButtonArpeggioThenChord } from "../../sound";
import { TrebleChordFinderOutputContext, useTrebleChordFinder } from "./trebleChordFinderContext";
import { useTrebleChordFinderButtons } from "./useTrebleChordFinder";

/** The chord's buttons on the treble diagram and how exact they are. */
export function TrebleChordFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const { soundOptions } = usePlatformSound();
  const state = useTrebleChordFinder();
  const chordFinderButtons = useTrebleChordFinderButtons({
    ...state,
    buttons,
    isTrebleLikeSide: side === "treble",
  });
  const { language } = usePlatformLanguage();
  // Report the actual highlighted buttons for every chord family.
  const trebleChordExplanation = describeTrebleChord(
    chordFinderButtons,
    state.chordFinderRoot,
    state.chordFinderPattern,
    state.trebleChordVoicingMode,
    language,
  );
  const value = {
    chordFinderButtons,
    trebleChordExplanation,
    playChordFinder: () => playButtonArpeggioThenChord(chordFinderButtons, soundOptions),
  };
  return (
    <TrebleChordFinderOutputContext.Provider value={value}>
      {children}
    </TrebleChordFinderOutputContext.Provider>
  );
}
