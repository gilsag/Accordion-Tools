import { useMemo, type ReactNode } from "react";
import { useScoreRendering } from "../../app/platform/useScoreRendering";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { playerHandle } from "../../app/tools/toolHandles";
import { bassPatternEventsToStradellaNotationAbc } from "../../tools/bassPatternPlayerTools";
import { useBassPatternTransport } from "./useBassPatternTransport";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument } from "../../app/platform/platformContexts";
import { BassPatternPlayerOutputContext, useBassPatternPlayer } from "./bassPatternPlayerContext";
import { useBassPatternResults } from "./useBassPatternPlayer";

/** The selected pattern and progression, their events on the buttons, what
 * is lit, the score, and the transport and export. */
export function BassPatternPlayerOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const state = useBassPatternPlayer();
  const results = useBassPatternResults({ ...state, buttons, side });
  const { musicNotationAbcOptions } = useScoreRendering();
  const {
    bassPatternBarsPerChord,
    bassPatternLoopCount,
    bassPatternLoopMode,
    bassPatternRoot,
    bassPatternTempoBpm,
  } = state;
  const { bassPatternEvents, selectedBassPattern, selectedChordProgression } = results;
  const bassPatternRenderedNotationAbc = useMemo(() => {
    if (!selectedBassPattern || !selectedChordProgression || bassPatternEvents.length === 0)
      return "";
    return bassPatternEventsToStradellaNotationAbc(
      selectedBassPattern,
      selectedChordProgression,
      bassPatternEvents,
      bassPatternRoot,
      bassPatternBarsPerChord,
      bassPatternTempoBpm,
      bassPatternLoopMode,
      bassPatternLoopCount,
      musicNotationAbcOptions,
    );
  }, [
    bassPatternBarsPerChord,
    bassPatternEvents,
    bassPatternLoopCount,
    bassPatternLoopMode,
    bassPatternRoot,
    bassPatternTempoBpm,
    musicNotationAbcOptions,
    selectedBassPattern,
    selectedChordProgression,
  ]);
  const transport = useBassPatternTransport(state, results, bassPatternRenderedNotationAbc);
  useToolHandle("bassPatternPlayer", playerHandle(transport.stopBassPatternPlayback));
  const value = { ...results, ...transport, bassPatternRenderedNotationAbc };
  return (
    <BassPatternPlayerOutputContext.Provider value={value}>
      {children}
    </BassPatternPlayerOutputContext.Provider>
  );
}
