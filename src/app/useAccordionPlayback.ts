import { useEffect } from "react";
import type {
  useBassPatternState,
  useBassPatternResults,
} from "../features/bassPatternPlayer/useBassPatternPlayer";
import type { useAbcPlayerState, useAbcPlayerResults } from "../features/abcPlayer/useAbcPlayer";
import type { useHarmonyProgressionState } from "../features/progressionAssistant/useProgressionAssistant";
import type {
  useStradellaChordFinderState,
  useStradellaChordFinderResults,
} from "../features/stradellaChordFinder/useStradellaChordFinder";
import type {
  useScaleFinderState,
  useScaleFinderResults,
} from "../features/scaleFinder/useScaleFinder";
import type { useTrebleChordFinderState } from "../features/trebleChordFinder/useTrebleChordFinder";
import type { useSoundSettings } from "../audio/useSoundSettings";
import { playbackClockMs, clearPlaybackTimers } from "../audio/playbackTransport";
import {
  stopAbcTransport,
  pauseAbcTransport,
  stopBassPatternTransport,
  lastPlayedAbcButtonIds,
} from "../audio/playbackLifecycle";
import { startAbcTransport, startBassPatternTransport } from "../audio/playbackStart";
import { scheduleAbcMappedPlayback, scheduleBassPatternEvents } from "../audio/playbackScheduling";
import type { DiagramButton } from "../types";
import {
  bassPatternBeat,
  bassPatternEventsToMidiBytes,
  bassPatternEventsToLilyPond,
} from "../tools/bassPatternPlayerTools";
import {
  playButtonArpeggioThenChord,
  playButtonCombination,
  playButtonSequence,
  stopAllSound,
} from "../sound";
import type { RefObject } from "react";
import { usePlatformPlayback } from "./platform/platformContexts";
import type { SequenceStepWithButton } from "../tools/sequenceTools";

export type UseAccordionPlaybackDeps = Pick<
  ReturnType<typeof useAbcPlayerResults>,
  "abcMappedEvents" | "abcTotalBeats"
> &
  Pick<
    ReturnType<typeof useAbcPlayerState>,
    | "abcPlaybackState"
    | "abcPositionBeat"
    | "abcTempoBpm"
    | "setAbcActiveButtonIds"
    | "setAbcPlaybackState"
    | "setAbcPositionBeat"
  > &
  Pick<
    ReturnType<typeof useBassPatternState>,
    | "bassPatternBarsPerChord"
    | "bassPatternExportFormat"
    | "bassPatternLoopCount"
    | "bassPatternLoopMode"
    | "bassPatternPlaybackRunRef"
    | "bassPatternRoot"
    | "bassPatternTempoBpm"
    | "bassPatternTimeoutsRef"
    | "setBassPatternActiveButtonIds"
    | "setBassPatternPlaybackState"
  > &
  Pick<
    ReturnType<typeof useBassPatternResults>,
    | "bassPatternEvents"
    | "bassPatternTotalBeats"
    | "selectedBassPattern"
    | "selectedChordProgression"
  > &
  Pick<ReturnType<typeof useSoundSettings>, "soundOptions"> &
  Pick<ReturnType<typeof useScaleFinderResults>, "scaleFinderButtons"> &
  Pick<ReturnType<typeof useTrebleChordFinderState>, "setChordFinderActive"> &
  Pick<ReturnType<typeof useHarmonyProgressionState>, "setHarmonyProgressionActiveButtonIds"> &
  Pick<ReturnType<typeof useScaleFinderState>, "setScaleFinderActive"> &
  Pick<
    ReturnType<typeof useStradellaChordFinderState>,
    "setStradellaChordFinderActive" | "stradellaChordFinderMode"
  > &
  Pick<ReturnType<typeof useStradellaChordFinderResults>, "stradellaChordFinderPlaybackButtons"> & {
    abcPlaybackStartBeatRef: RefObject<number>;
    abcPlaybackStartedAtRef: RefObject<number | null>;
    abcPlaybackTimeoutsRef: RefObject<number[]>;
    bassPatternRenderedNotationAbc: string;
    chordFinderButtons: DiagramButton[];
    selectedButtons: DiagramButton[];
    sequenceStepsWithButtons: SequenceStepWithButton[];
  };

/** Sound and transports for the accordion workspace: sample preloading after the first gesture, the Finder, Selection and Sequence players, the ABC and Bass Pattern transports with their exports, and Stop. */
export function useAccordionPlayback(deps: UseAccordionPlaybackDeps) {
  const {
    abcMappedEvents,
    abcPlaybackStartBeatRef,
    abcPlaybackStartedAtRef,
    abcPlaybackState,
    abcPlaybackTimeoutsRef,
    abcPositionBeat,
    abcTempoBpm,
    abcTotalBeats,
    bassPatternBarsPerChord,
    bassPatternEvents,
    bassPatternExportFormat,
    bassPatternLoopCount,
    bassPatternLoopMode,
    bassPatternPlaybackRunRef,
    bassPatternRoot,
    bassPatternTempoBpm,
    bassPatternTimeoutsRef,
    bassPatternTotalBeats,
    bassPatternRenderedNotationAbc,
    chordFinderButtons,
    scaleFinderButtons,
    selectedBassPattern,
    selectedButtons,
    selectedChordProgression,
    sequenceStepsWithButtons,
    setAbcActiveButtonIds,
    setAbcPlaybackState,
    setAbcPositionBeat,
    setBassPatternActiveButtonIds,
    setBassPatternPlaybackState,
    setChordFinderActive,
    setHarmonyProgressionActiveButtonIds,
    setScaleFinderActive,
    setStradellaChordFinderActive,
    soundOptions,
    stradellaChordFinderMode,
    stradellaChordFinderPlaybackButtons,
  } = deps;
  // Shared with every player: see src/app/platform/usePlaybackState.ts.
  const { setSoundEnginePlayer, startWhenSamplesReady } = usePlatformPlayback();

  /** Plays the currently highlighted Stradella Chord Finder result. */
  function playStradellaChordFinder() {
    if (stradellaChordFinderMode === "bass-only") {
      playButtonArpeggioThenChord(stradellaChordFinderPlaybackButtons, soundOptions);
      return;
    }

    playButtonCombination(stradellaChordFinderPlaybackButtons, soundOptions);
  }

  /** Plays the currently highlighted Scale Finder path. */
  function playScaleFinder() {
    playButtonSequence(scaleFinderButtons, soundOptions);
  }

  /** Plays the currently highlighted Chord Finder path as an arpeggio, then as a chord. */
  function playChordFinder() {
    playButtonArpeggioThenChord(chordFinderButtons, soundOptions);
  }

  /**
   * Plays selected buttons first as an arpeggio and then together as a chord.
   * The selected-buttons order follows the current rendered diagram/list order.
   */
  function playSelectedButtons() {
    playButtonArpeggioThenChord(selectedButtons, soundOptions);
  }

  /** Plays the current recorded sequence using the sound settings. */
  function playRecordedSequence() {
    const sequenceButtons = sequenceStepsWithButtons.map((step) => step.button);
    startWhenSamplesReady(sequenceButtons, () => {
      playButtonSequence(sequenceButtons, soundOptions, () => setSoundEnginePlayer(null));
      // Set after the player's own stopAllSound(), which clears this state.
      if (soundOptions.enabled && sequenceButtons.length > 0) setSoundEnginePlayer("sequence");
    });
  }

  // Cancel pending ABC timers when the app unmounts.
  useEffect(() => () => clearPlaybackTimers(abcPlaybackTimeoutsRef), [abcPlaybackTimeoutsRef]);

  function clearAbcTimers() {
    clearPlaybackTimers(abcPlaybackTimeoutsRef);
  }

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
      stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      clearProgressionButtons: () => setHarmonyProgressionActiveButtonIds([]),
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
          stopBassPattern: stopBassPatternPlayback,
          stopSound: stopAllSound,
          clearProgressionButtons: () => setHarmonyProgressionActiveButtonIds([]),
          setScaleFinderActive,
          setChordFinderActive,
          setStradellaFinderActive: setStradellaChordFinderActive,
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

  function clearBassPatternTimers() {
    clearPlaybackTimers(bassPatternTimeoutsRef);
  }

  function stopBassPatternPlayback() {
    stopBassPatternTransport({
      runRef: bassPatternPlaybackRunRef,
      clearTimers: clearBassPatternTimers,
      setState: setBassPatternPlaybackState,
      setActiveButtons: setBassPatternActiveButtonIds,
      stopSound: stopAllSound,
    });
  }

  function downloadTextFile(filename: string, text: string, mimeType = "text/plain") {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSelectedBassPatternAbc() {
    if (!selectedBassPattern || !selectedChordProgression) return;
    downloadTextFile(
      `${selectedBassPattern.id || "bass-pattern"}.abc`,
      bassPatternRenderedNotationAbc,
      "text/vnd.abc",
    );
  }

  function exportSelectedBassPatternMidi() {
    if (!selectedBassPattern) return;
    const bytes = bassPatternEventsToMidiBytes(
      bassPatternEvents,
      bassPatternTempoBpm,
      selectedBassPattern.meter,
    );
    const blob = new Blob([bytes], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedBassPattern.id || "bass-pattern"}.mid`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSelectedBassPatternLilyPond() {
    if (!selectedBassPattern || !selectedChordProgression) return;
    downloadTextFile(
      `${selectedBassPattern.id || "bass-pattern"}.ly`,
      bassPatternEventsToLilyPond(
        selectedBassPattern,
        selectedChordProgression,
        bassPatternEvents,
        bassPatternRoot,
        bassPatternBarsPerChord,
        bassPatternTempoBpm,
      ),
      "text/x-lilypond",
    );
  }

  function exportSelectedBassPattern() {
    if (bassPatternExportFormat === "abc") {
      exportSelectedBassPatternAbc();
    } else if (bassPatternExportFormat === "midi") {
      exportSelectedBassPatternMidi();
    } else {
      exportSelectedBassPatternLilyPond();
    }
  }

  function scheduleBassPatternPlayback() {
    startWhenSamplesReady(
      bassPatternEvents.flatMap((event) => event.buttons),
      () =>
        startBassPatternTransport({
          eventCount: bassPatternEvents.length,
          runRef: bassPatternPlaybackRunRef,
          clearTimers: clearBassPatternTimers,
          stopAbc: stopAbcPlayback,
          clearActiveButtons: () => setBassPatternActiveButtonIds([]),
          stopSound: stopAllSound,
          setScaleFinderActive,
          setChordFinderActive,
          setStradellaFinderActive: setStradellaChordFinderActive,
          setPlaybackState: setBassPatternPlaybackState,
          schedule: (runId) =>
            scheduleBassPatternEvents({
              bassPatternEvents,
              bassPatternTempoBpm,
              bassPatternUnitsPerBeat: bassPatternBeat(selectedBassPattern?.meter ?? "4/4")
                .unitsPerBeat,
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

  /** Stops currently playing notes and any scheduled sequence playback. */

  return {
    playStradellaChordFinder,
    playScaleFinder,
    playChordFinder,
    playSelectedButtons,
    playRecordedSequence,
    stopAbcPlayback,
    pauseAbcPlayback,
    scheduleAbcPlayback,
    stopBassPatternPlayback,
    exportSelectedBassPattern,
    scheduleBassPatternPlayback,
  };
}
