import type { ReactNode } from "react";
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
  return (
    <TrebleChordFinderContext.Provider value={state}>{children}</TrebleChordFinderContext.Provider>
  );
}
