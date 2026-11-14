import { useMemo, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument, usePlatformNavigation } from "../../app/platform/platformContexts";
import { useSideButtonSettings } from "../../app/platform/useSideButtonSettings";
import { stradellaButtonsFor, trebleButtonsFor } from "../../app/sideButtons";
import { AbcPlayerOutputContext, useAbcPlayer } from "./abcPlayerContext";
import { useAbcPlayerResults } from "./useAbcPlayer";

/** The parsed tune, its events mapped to buttons, and what is lit. */
export function AbcPlayerOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const { workspaceMode } = usePlatformNavigation();
  const sideButtonSettings = useSideButtonSettings();
  const state = useAbcPlayer();
  const { abcHands, abcText } = state;

  /* The Both hands view plays voice 1 on the treble and voice 2 on the
   * Stradella, so it also needs the buttons of the side not on screen. */
  const abcCompanionButtons = useMemo(() => {
    if (workspaceMode !== "accordion" || abcHands !== "both" || !abcText.trim()) return null;
    return side === "stradella"
      ? trebleButtonsFor(sideButtonSettings)
      : stradellaButtonsFor(sideButtonSettings);
  }, [workspaceMode, abcHands, abcText, side, sideButtonSettings]);

  const results = useAbcPlayerResults({
    ...state,
    side,
    isTrebleLikeSide: side === "treble",
    buttons,
    companionButtons: abcCompanionButtons,
  });
  const value = useMemo(
    () => ({ ...results, abcCompanionButtons }),
    [results, abcCompanionButtons],
  );
  return (
    <AbcPlayerOutputContext.Provider value={value}>{children}</AbcPlayerOutputContext.Provider>
  );
}
