import { useMemo, type ReactNode } from "react";
import { usePlatformInstrument } from "../platform/platformContexts";
import { useSideButtonSettings } from "../platform/useSideButtonSettings";
import { stradellaButtonsFor, trebleButtonsFor } from "../sideButtons";
import { DiagramButtonsContext, useKeepVisibleRequests } from "./diagramButtonsContext";

/**
 * Generates the buttons of the side on screen from the instrument and
 * appearance settings. On the compact treble sizes the window follows the
 * buttons that tools ask to keep visible (the Treble Chord Finder's and Scale
 * Finder's results, the marked buttons): see `KeepVisibleRequest`.
 *
 * It sits below every tool's state provider, which may add requests, and
 * above every tool's output provider, which derives results from the buttons.
 */
export function DiagramButtonsProvider({ children }: { children: ReactNode }) {
  const { side } = usePlatformInstrument();
  const settings = useSideButtonSettings();
  const requests = useKeepVisibleRequests();
  const value = useMemo(
    () => ({
      buttons:
        side === "stradella"
          ? stradellaButtonsFor(settings)
          : trebleButtonsFor(settings, (reference) =>
              requests.flatMap((request) => request(reference)),
            ),
    }),
    [side, settings, requests],
  );
  return <DiagramButtonsContext.Provider value={value}>{children}</DiagramButtonsContext.Provider>;
}
