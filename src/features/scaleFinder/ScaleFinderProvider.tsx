import { useCallback, type ReactNode } from "react";
import { KeepVisibleRequest } from "../../app/diagram/KeepVisible";
import { getScaleFinderTrebleButtons } from "./scaleFinderTools";
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
  // On a compact treble size, the diagram keeps the shown scale on screen.
  const { scaleFinderActive, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit } = state;
  const keepScaleVisible = useCallback(
    (reference: Parameters<typeof getScaleFinderTrebleButtons>[0]) =>
      scaleFinderActive
        ? getScaleFinderTrebleButtons(
            reference,
            scaleFinderRoot,
            scaleFinderPattern,
            scaleFinderRowLimit,
          )
        : [],
    [scaleFinderActive, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit],
  );
  return (
    <ScaleFinderContext.Provider value={state}>
      <KeepVisibleRequest request={keepScaleVisible}>{children}</KeepVisibleRequest>
    </ScaleFinderContext.Provider>
  );
}
