import {
  usePlatformPlayback,
  usePlatformSound,
  usePlatformTools,
} from "../../app/platform/platformContexts";
import { stopBassPatternTransport } from "../../audio/playbackLifecycle";
import { scheduleBassPatternEvents } from "../../audio/playbackScheduling";
import { startBassPatternTransport } from "../../audio/playbackStart";
import { clearPlaybackTimers } from "../../audio/playbackTransport";
import { stopAllSound } from "../../audio/sound";
import {
  bassPatternBeat,
  bassPatternEventsToLilyPond,
  bassPatternEventsToMidiBytes,
} from "./bassPatternPlayerTools";
import type { BassPatternPlayerState } from "./bassPatternPlayerContext";
import type { useBassPatternResults } from "./useBassPatternPlayer";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * The Bass Pattern Player's transport (Play and Stop, with its repeat
 * setting) and its export as ABC, MIDI or LilyPond. Starting stops the ABC
 * Player and hides the Finders, through the coordinator.
 */
export function useBassPatternTransport(
  state: BassPatternPlayerState,
  results: ReturnType<typeof useBassPatternResults>,
  bassPatternRenderedNotationAbc: string,
) {
  const { soundOptions } = usePlatformSound();
  const { startWhenSamplesReady } = usePlatformPlayback();
  const { coordinator } = usePlatformTools();
  const {
    bassPatternBarsPerChord,
    bassPatternExportFormat,
    bassPatternLoopCount,
    bassPatternLoopMode,
    bassPatternPlaybackRunRef,
    bassPatternRoot,
    bassPatternTempoBpm,
    bassPatternTimeoutsRef,
    setBassPatternActiveButtonIds,
    setBassPatternPlaybackState,
    setBassPatternLoopMode,
    setBassPatternLoopCount,
  } = state;
  const {
    bassPatternEvents,
    bassPatternTotalBeats,
    selectedBassPattern,
    selectedChordProgression,
  } = results;

  const clearBassPatternTimers = () => clearPlaybackTimers(bassPatternTimeoutsRef);

  function stopBassPatternPlayback() {
    stopBassPatternTransport({
      runRef: bassPatternPlaybackRunRef,
      clearTimers: clearBassPatternTimers,
      setState: setBassPatternPlaybackState,
      setActiveButtons: setBassPatternActiveButtonIds,
      stopSound: stopAllSound,
    });
  }

  function scheduleBassPatternPlayback() {
    startWhenSamplesReady(
      bassPatternEvents.flatMap((event) => event.buttons),
      () =>
        startBassPatternTransport({
          eventCount: bassPatternEvents.length,
          runRef: bassPatternPlaybackRunRef,
          clearTimers: clearBassPatternTimers,
          stopAbc: () => coordinator.stopTool("abcPlayer"),
          clearActiveButtons: () => setBassPatternActiveButtonIds([]),
          stopSound: stopAllSound,
          setScaleFinderActive: () => coordinator.deactivateTool("scaleFinder"),
          setChordFinderActive: () => coordinator.deactivateTool("chordFinder"),
          setStradellaFinderActive: () => coordinator.deactivateTool("stradellaChordFinder"),
          setPlaybackState: setBassPatternPlaybackState,
          schedule: (runId) =>
            scheduleBassPatternEvents({
              bassPatternEvents,
              bassPatternTempoBpm,
              bassPatternUnitsPerBeat: bassPatternBeat(selectedBassPattern?.meter ?? "4/4")
                .unitsPerBeat,
              bassPatternMeter: selectedBassPattern?.meter ?? "4/4",
              bassPatternTotalBeats,
              bassPatternLoopMode,
              bassPatternLoopCount,
              bassPatternTimeoutsRef,
              bassPatternPlaybackRunRef,
              runId,
              soundOptions,
              setBassPatternActiveButtonIds,
              setBassPatternPlaybackState,
            }),
        }),
    );
  }

  /** The Repeat menu: "1", a fixed count, or "loop". */
  const bassPatternRepeatSelection =
    bassPatternLoopMode === "infinite"
      ? "loop"
      : bassPatternLoopMode === "fixed"
        ? String(bassPatternLoopCount)
        : "1";

  function setBassPatternRepeatSelection(value: string) {
    stopBassPatternPlayback();
    if (value === "loop") {
      setBassPatternLoopMode("infinite");
      return;
    }
    const count = Math.max(1, Math.min(64, Math.round(Number(value) || 1)));
    if (count <= 1) {
      setBassPatternLoopMode("once");
      setBassPatternLoopCount(1);
    } else {
      setBassPatternLoopMode("fixed");
      setBassPatternLoopCount(count);
    }
  }

  function exportSelectedBassPattern() {
    if (!selectedBassPattern) return;
    const name = selectedBassPattern.id || "bass-pattern";
    if (bassPatternExportFormat === "abc") {
      if (!selectedChordProgression) return;
      downloadBlob(
        `${name}.abc`,
        new Blob([bassPatternRenderedNotationAbc], { type: "text/vnd.abc" }),
      );
    } else if (bassPatternExportFormat === "midi") {
      const bytes = bassPatternEventsToMidiBytes(
        bassPatternEvents,
        bassPatternTempoBpm,
        selectedBassPattern.meter,
      );
      downloadBlob(`${name}.mid`, new Blob([bytes], { type: "audio/midi" }));
    } else {
      if (!selectedChordProgression) return;
      downloadBlob(
        `${name}.ly`,
        new Blob(
          [
            bassPatternEventsToLilyPond(
              selectedBassPattern,
              selectedChordProgression,
              bassPatternEvents,
              bassPatternRoot,
              bassPatternBarsPerChord,
              bassPatternTempoBpm,
            ),
          ],
          { type: "text/x-lilypond" },
        ),
      );
    }
  }

  return {
    stopBassPatternPlayback,
    scheduleBassPatternPlayback,
    bassPatternRepeatSelection,
    setBassPatternRepeatSelection,
    exportSelectedBassPattern,
  };
}
