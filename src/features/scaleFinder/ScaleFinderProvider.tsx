import type { ReactNode } from "react";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { finderHandle } from "../../app/tools/toolHandles";
import { ScaleFinderContext } from "./scaleFinderContext";
import { useScaleFinderState } from "./useScaleFinder";

/** Owns the Scale Finder's request, display preferences and active state. */
export function ScaleFinderProvider({ children }: { children: ReactNode }) {
  const state = useScaleFinderState();
  useOwnedSettings("scaleFinder", state);
  useToolHandle("scaleFinder", finderHandle(state.setScaleFinderActive));
  return <ScaleFinderContext.Provider value={state}>{children}</ScaleFinderContext.Provider>;
}
