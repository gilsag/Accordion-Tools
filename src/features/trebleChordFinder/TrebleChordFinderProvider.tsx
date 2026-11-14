import { useCallback, type ReactNode } from "react";
import { KeepVisibleRequest } from "../../app/diagram/KeepVisible";
import { getChordFinderTrebleButtons } from "./chordFinderTools";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { finderHandle } from "../../app/tools/toolHandles";
import { TrebleChordFinderContext } from "./trebleChordFinderContext";
import { useTrebleChordFinderState } from "./useTrebleChordFinder";

/** Owns the Treble Chord Finder's request, voicing preferences and active state. */
export function TrebleChordFinderProvider({ children }: { children: ReactNode }) {
  const state = useTrebleChordFinderState();
  useOwnedSettings("trebleChordFinder", state);
  useToolHandle("chordFinder", finderHandle(state.setChordFinderActive));
  // On a compact treble size, the diagram keeps the shown chord on screen.
  const {
    chordFinderActive,
    chordFinderRoot,
    chordFinderPattern,
    chordFinderInversion,
    chordFinderOctave,
    trebleChordVoicingMode,
  } = state;
  const keepChordVisible = useCallback(
    (reference: Parameters<typeof getChordFinderTrebleButtons>[0]) =>
      chordFinderActive
        ? getChordFinderTrebleButtons(
            reference,
            chordFinderRoot,
            chordFinderPattern,
            chordFinderInversion,
            chordFinderOctave,
            trebleChordVoicingMode,
          )
        : [],
    [
      chordFinderActive,
      chordFinderRoot,
      chordFinderPattern,
      chordFinderInversion,
      chordFinderOctave,
      trebleChordVoicingMode,
    ],
  );
  return (
    <TrebleChordFinderContext.Provider value={state}>
      <KeepVisibleRequest request={keepChordVisible}>{children}</KeepVisibleRequest>
    </TrebleChordFinderContext.Provider>
  );
}
