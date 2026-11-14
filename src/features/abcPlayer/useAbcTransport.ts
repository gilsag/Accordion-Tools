import { useEffect, useRef } from "react";
import {
  usePlatformPlayback,
  usePlatformSound,
  usePlatformTools,
} from "../../app/platform/platformContexts";
import {
  lastPlayedAbcButtonIds,
  pauseAbcTransport,
  stopAbcTransport,
} from "../../audio/playbackLifecycle";
import { scheduleAbcMappedPlayback } from "../../audio/playbackScheduling";
import { startAbcTransport } from "../../audio/playbackStart";
import { clearPlaybackTimers, playbackClockMs } from "../../audio/playbackTransport";
import { stopAllSound } from "../../sound";
import type { AbcPlayerState } from "./abcPlayerContext";
import type { useAbcPlayerResults } from "./useAbcPlayer";

/**
 * The ABC Player's transport: Play from the current position, Pause and
 * Stop. The order of each step is fixed in src/audio (playbackStart,
 * playbackLifecycle). Other tools are reached through the coordinator:
 * starting stops the Bass Pattern Player, clears the Progression Assistant's
 * lit buttons and hides the Finders.
 */
export function useAbcTransport(
  state: AbcPlayerState,
  results: Pick<ReturnType<typeof useAbcPlayerResults>, "abcMappedEvents" | "abcTotalBeats">,
) {
  const { soundOptions } = usePlatformSound();
  const { startWhenSamplesReady } = usePlatformPlayback();
  const { coordinator } = usePlatformTools();
  const {
    abcPlaybackState,
    abcPositionBeat,
    abcTempoBpm,
    setAbcActiveButtonIds,
    setAbcPlaybackState,
    setAbcPositionBeat,
  } = state;
  const { abcMappedEvents, abcTotalBeats } = results;
  const abcPlaybackTimeoutsRef = useRef<number[]>([]);
  const abcPlaybackStartedAtRef = useRef<number | null>(null);
  const abcPlaybackStartBeatRef = useRef(0);

  // Cancel pending ABC timers when the app unmounts.
  useEffect(() => () => clearPlaybackTimers(abcPlaybackTimeoutsRef), []);

  const clearAbcTimers = () => clearPlaybackTimers(abcPlaybackTimeoutsRef);
  const stopBassPattern = () => coordinator.stopTool("bassPatternPlayer");
  const clearProgressionButtons = () => coordinator.stopTool("progressionAssistant");

  function stopAbcPlayback() {
    stopAbcTransport({
      clearTimers: clearAbcTimers,
      setState: setAbcPlaybackState,
      setPosition: setAbcPositionBeat,
      setActiveButtons: setAbcActiveButtonIds,
      startedAtRef: abcPlaybackStartedAtRef,
      stopSound: stopAllSound,
    });
  }

  function pauseAbcPlayback() {
    pauseAbcTransport({
      playbackState: abcPlaybackState,
      startedAt: abcPlaybackStartedAtRef.current,
      startingBeat: abcPlaybackStartBeatRef.current,
      tempoBpm: abcTempoBpm,
      totalBeats: abcTotalBeats,
      nowMs: playbackClockMs,
      setPosition: setAbcPositionBeat,
      setState: setAbcPlaybackState,
      setActiveButtons: setAbcActiveButtonIds,
      clearTimers: clearAbcTimers,
      stopBassPattern,
      stopSound: stopAllSound,
      clearProgressionButtons,
      buttonsAtPosition: (beat) => lastPlayedAbcButtonIds(abcMappedEvents, beat),
    });
  }

  function scheduleAbcPlayback(startBeat = abcPositionBeat) {
    startWhenSamplesReady(
      abcMappedEvents.flatMap((event) => event.buttons),
      () =>
        startAbcTransport({
          eventCount: abcMappedEvents.length,
          startBeat,
          clearTimers: clearAbcTimers,
          clearActiveButtons: () => setAbcActiveButtonIds([]),
          stopBassPattern,
          stopSound: stopAllSound,
          clearProgressionButtons,
          setScaleFinderActive: () => coordinator.deactivateTool("scaleFinder"),
          setChordFinderActive: () => coordinator.deactivateTool("chordFinder"),
          setStradellaFinderActive: () => coordinator.deactivateTool("stradellaChordFinder"),
          setPlaybackState: setAbcPlaybackState,
          setPosition: setAbcPositionBeat,
          startedAtRef: abcPlaybackStartedAtRef,
          startBeatRef: abcPlaybackStartBeatRef,
          nowMs: playbackClockMs,
          schedule: () =>
            scheduleAbcMappedPlayback({
              abcMappedEvents,
              startBeat,
              abcTempoBpm,
              abcTotalBeats,
              abcPlaybackTimeoutsRef,
              abcPlaybackStartedAtRef,
              soundOptions,
              setAbcPositionBeat,
              setAbcActiveButtonIds,
              setAbcPlaybackState,
            }),
        }),
    );
  }

  return { stopAbcPlayback, pauseAbcPlayback, scheduleAbcPlayback };
}
