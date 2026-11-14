import { bassPatternName, progressionName } from "../../i18n/optionLabels";
import { ScoreEntryProvider } from "../../app/notation/ScoreEntryProvider";
import { DiagramContributionProvider } from "../../app/diagram/DiagramContributionProvider";
import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import type { ScoreEntry, ScoreToggle } from "../../app/notation/scoreEntries";
import { PlaybackTransportEntry } from "../../app/playback/PlaybackTransportEntry";
import type { PlaybackTransport } from "../../app/playback/playbackTransports";
import { usePlatformLanguage } from "../../app/platform/platformContexts";
import { useMemo, type ReactNode } from "react";
import { useScoreRendering } from "../../app/platform/useScoreRendering";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { playerHandle } from "../../app/tools/toolHandles";
import { bassPatternEventsToStradellaNotationAbc } from "./bassPatternPlayerTools";
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
  const { t } = usePlatformLanguage();
  // The Bass Pattern Player plays the Stradella side only.
  const playbackEntry: PlaybackTransport | null =
    side === "stradella"
      ? {
          label: t("ui.bassPatternPlayer"),
          state: state.bassPatternPlaybackState === "playing" ? "playing" : "stopped",
          canPlay: results.bassPatternEvents.length > 0,
          onPlay: transport.scheduleBassPatternPlayback,
          onStop: transport.stopBassPatternPlayback,
          rhythmic: true,
        }
      : null;
  const { language } = usePlatformLanguage();
  // The pattern has no events off the Stradella side, so the score needs no side check.
  const scoreToggle: ScoreToggle | null =
    results.bassPatternEvents.length > 0
      ? {
          visible: state.bassPatternRenderedNotationVisible,
          toggle: state.toggleBassPatternNotation,
        }
      : null;
  const scoreEntry: ScoreEntry | null =
    state.bassPatternRenderedNotationVisible && results.bassPatternEvents.length > 0
      ? {
          title: `${selectedBassPattern ? bassPatternName(selectedBassPattern.id, selectedBassPattern.name, language) : t("ui.bassPatternPlayer")} ${t("ui.over")} ${selectedChordProgression ? progressionName(selectedChordProgression.id, selectedChordProgression.name, language) : t("ui.progression")}`,
          abc: bassPatternRenderedNotationAbc,
          filename: `${selectedBassPattern?.id ?? "bass-pattern"}-notation`,
        }
      : null;
  // The pattern's sounding buttons, lit as they play.
  const diagram: DiagramContribution = {
    layers: { bassPatternActiveButtonIdSet: results.bassPatternActiveButtonIdSet },
  };
  return (
    <BassPatternPlayerOutputContext.Provider value={value}>
      <PlaybackTransportEntry tool="bassPatternPlayer" transport={playbackEntry}>
        <ScoreEntryProvider tool="bassPatternPlayer" score={scoreEntry} toggle={scoreToggle}>
          <DiagramContributionProvider tool="bassPatternPlayer" contribution={diagram}>
            {children}
          </DiagramContributionProvider>
        </ScoreEntryProvider>
      </PlaybackTransportEntry>
    </BassPatternPlayerOutputContext.Provider>
  );
}
