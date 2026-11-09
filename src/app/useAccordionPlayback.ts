import { useEffect, useState } from "react";
import type { useWorkspaceNavigation } from "../app/useWorkspaceNavigation";
import type { useInstrumentState } from "../instrument/useInstrumentState";
import type { useBassPatternState, useBassPatternResults } from "../features/bassPatternPlayer/useBassPatternPlayer";
import type { useAbcPlayerState, useAbcPlayerResults } from "../features/abcPlayer/useAbcPlayer";
import type { useHarmonyProgressionState } from "../features/progressionAssistant/useProgressionAssistant";
import type { useStradellaChordFinderState, useStradellaChordFinderResults } from "../features/stradellaChordFinder/useStradellaChordFinder";
import type { useScaleFinderState, useScaleFinderResults } from "../features/scaleFinder/useScaleFinder";
import type { useTrebleChordFinderState } from "../features/trebleChordFinder/useTrebleChordFinder";
import type { useSoundSettings } from "../audio/useSoundSettings";
import { playbackClockMs, clearPlaybackTimers } from "../audio/playbackTransport";
import { stopAbcTransport, pauseAbcTransport, stopBassPatternTransport, lastPlayedAbcButtonIds } from "../audio/playbackLifecycle";
import { startAbcTransport, startBassPatternTransport } from "../audio/playbackStart";
import { scheduleAbcMappedPlayback, scheduleBassPatternEvents } from "../audio/playbackScheduling";
import type { DiagramButton } from "../types";
import { bassPatternBeat, bassPatternEventsToMidiBytes, bassPatternEventsToLilyPond } from "../tools/bassPatternPlayerTools";
import { playButtonArpeggioThenChord, playButtonCombination, playButtonSequence, stopAllSound, preloadLaMelodiosa, unlockAudio, samplesReadyFor, prepareSamplesFor, currentPlaybackGeneration, onStopAllSound } from "../sound";
import type { RefObject } from "react";
import type { SequenceStepWithButton } from "../tools/sequenceTools";

export type UseAccordionPlaybackDeps = Pick<ReturnType<typeof useAbcPlayerResults>,
    "abcMappedEvents" | "abcTotalBeats"> &
  Pick<ReturnType<typeof useAbcPlayerState>,
    "abcPlaybackState" | "abcPositionBeat" | "abcTempoBpm" | "setAbcActiveButtonIds" |
    "setAbcPlaybackState" | "setAbcPositionBeat"> &
  Pick<ReturnType<typeof useBassPatternState>,
    "bassPatternBarsPerChord" | "bassPatternExportFormat" | "bassPatternLoopCount" |
    "bassPatternLoopMode" | "bassPatternPlaybackRunRef" | "bassPatternRoot" |
    "bassPatternTempoBpm" | "bassPatternTimeoutsRef" | "setBassPatternActiveButtonIds" |
    "setBassPatternPlaybackState"> &
  Pick<ReturnType<typeof useBassPatternResults>,
    "bassPatternEvents" | "bassPatternTotalBeats" | "selectedBassPattern" |
    "selectedChordProgression"> &
  Pick<ReturnType<typeof useSoundSettings>,
    "laMelodiosaBassRegister" | "laMelodiosaTrebleRegister" | "soundEnabled" | "soundOptions" |
    "soundSource"> &
  Pick<ReturnType<typeof useScaleFinderResults>,
    "scaleFinderButtons"> &
  Pick<ReturnType<typeof useTrebleChordFinderState>,
    "setChordFinderActive"> &
  Pick<ReturnType<typeof useHarmonyProgressionState>,
    "setHarmonyProgressionActiveButtonIds" | "setHarmonyProgressionPulseSilent"> &
  Pick<ReturnType<typeof useScaleFinderState>,
    "setScaleFinderActive"> &
  Pick<ReturnType<typeof useStradellaChordFinderState>,
    "setStradellaChordFinderActive" | "stradellaChordFinderMode"> &
  Pick<ReturnType<typeof useInstrumentState>,
    "side"> &
  Pick<ReturnType<typeof useStradellaChordFinderResults>,
    "stradellaChordFinderPlaybackButtons"> &
  Pick<ReturnType<typeof useWorkspaceNavigation>,
    "workspaceMode"> &
  {
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
    abcMappedEvents, abcPlaybackStartBeatRef, abcPlaybackStartedAtRef, abcPlaybackState,
    abcPlaybackTimeoutsRef, abcPositionBeat, abcTempoBpm, abcTotalBeats, bassPatternBarsPerChord,
    bassPatternEvents, bassPatternExportFormat, bassPatternLoopCount, bassPatternLoopMode,
    bassPatternPlaybackRunRef, bassPatternRoot, bassPatternTempoBpm, bassPatternTimeoutsRef,
    bassPatternTotalBeats, bassPatternRenderedNotationAbc, chordFinderButtons, laMelodiosaBassRegister, laMelodiosaTrebleRegister,
    scaleFinderButtons, selectedBassPattern, selectedButtons, selectedChordProgression,
    sequenceStepsWithButtons, setAbcActiveButtonIds, setAbcPlaybackState, setAbcPositionBeat,
    setBassPatternActiveButtonIds, setBassPatternPlaybackState, setChordFinderActive,
    setHarmonyProgressionActiveButtonIds, setHarmonyProgressionPulseSilent, setScaleFinderActive,
    setStradellaChordFinderActive, side, soundEnabled, soundOptions, soundSource,
    stradellaChordFinderMode, stradellaChordFinderPlaybackButtons, workspaceMode,
  } = deps;

  // Sample preloading waits for the first user gesture, so a visit that never
  // plays anything downloads no audio and no AudioContext starts before
  // interaction. It also fetches only the side the workspace plays: Stradella
  // and Harmony use bass samples, Treble uses treble samples.
  const [audioGestureSeen, setAudioGestureSeen] = useState(false);
  // True while a transport waits for its samples; the playback bar says so.
  const [samplesLoading, setSamplesLoading] = useState(false);
  // The Progression Assistant and Sequence players run entirely inside the
  // sound engine, so their playing state ends when they finish or when any
  // stopAllSound() runs (Stop, Reset, or another player starting).
  const [soundEnginePlayer, setSoundEnginePlayer] = useState<"progression" | "sequence" | null>(null);
  useEffect(() => onStopAllSound(() => setSoundEnginePlayer(null)), []);
  useEffect(() => {
    if (audioGestureSeen) return;
    const onFirstGesture = () => {
      unlockAudio();
      setAudioGestureSeen(true);
    };
    const options = { capture: true } as const;
    window.addEventListener("pointerdown", onFirstGesture, options);
    window.addEventListener("keydown", onFirstGesture, options);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture, options);
      window.removeEventListener("keydown", onFirstGesture, options);
    };
  }, [audioGestureSeen]);
  const sampleSide = workspaceMode === "harmony" || side === "stradella" ? "bass" : "treble";
  useEffect(() => {
    if (!audioGestureSeen || !soundEnabled || soundSource !== "la-melodiosa") return;
    void preloadLaMelodiosa(
      sampleSide === "treble" ? laMelodiosaTrebleRegister : null,
      sampleSide === "bass" ? laMelodiosaBassRegister : null,
    );
  }, [audioGestureSeen, sampleSide, soundEnabled, soundSource, laMelodiosaTrebleRegister, laMelodiosaBassRegister]);

  /** Plays the currently highlighted Stradella Chord Finder result. */
  function playStradellaChordFinder() {
    if (stradellaChordFinderMode === "bass-only") {
      playButtonArpeggioThenChord(
        stradellaChordFinderPlaybackButtons,
        soundOptions,
      );
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
      clearTimers: clearAbcTimers, setState: setAbcPlaybackState,
      setPosition: setAbcPositionBeat, setActiveButtons: setAbcActiveButtonIds,
      startedAtRef: abcPlaybackStartedAtRef, stopSound: stopAllSound,
    });
  }

  function pauseAbcPlayback() {
    pauseAbcTransport({
      playbackState: abcPlaybackState,
      startedAt: abcPlaybackStartedAtRef.current,
      startingBeat: abcPlaybackStartBeatRef.current,
      tempoBpm: abcTempoBpm, totalBeats: abcTotalBeats,
      nowMs: playbackClockMs, setPosition: setAbcPositionBeat,
      setState: setAbcPlaybackState, setActiveButtons: setAbcActiveButtonIds,
      clearTimers: clearAbcTimers, stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      clearProgressionButtons: () => setHarmonyProgressionActiveButtonIds([]),
      buttonsAtPosition: (beat) => lastPlayedAbcButtonIds(abcMappedEvents, beat),
    });
  }

  /**
   * Starts a transport once the samples it needs are decoded, so the first
   * notes are not late. Usually they already are (see the preload effect). A
   * Stop, or any other playback start, while they load cancels this start.
   */
  function startWhenSamplesReady(buttonsToPlay: DiagramButton[], start: () => void) {
    if (samplesReadyFor(buttonsToPlay, soundOptions)) {
      start();
      return;
    }
    const generation = currentPlaybackGeneration();
    setSamplesLoading(true);
    void prepareSamplesFor(buttonsToPlay, soundOptions).then(() => {
      setSamplesLoading(false);
      if (currentPlaybackGeneration() === generation) start();
    });
  }

  function scheduleAbcPlayback(startBeat = abcPositionBeat) {
    startWhenSamplesReady(abcMappedEvents.flatMap((event) => event.buttons), () => startAbcTransport({
      eventCount: abcMappedEvents.length, startBeat,
      clearTimers: clearAbcTimers, clearActiveButtons: () => setAbcActiveButtonIds([]),
      stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      clearProgressionButtons: () => setHarmonyProgressionActiveButtonIds([]),
      setScaleFinderActive, setChordFinderActive, setStradellaFinderActive: setStradellaChordFinderActive,
      setPlaybackState: setAbcPlaybackState, setPosition: setAbcPositionBeat,
      startedAtRef: abcPlaybackStartedAtRef, startBeatRef: abcPlaybackStartBeatRef,
      nowMs: playbackClockMs,
      schedule: () => scheduleAbcMappedPlayback({abcMappedEvents, startBeat, abcTempoBpm,
        abcTotalBeats, abcPlaybackTimeoutsRef, abcPlaybackStartedAtRef,
        soundOptions, setAbcPositionBeat, setAbcActiveButtonIds, setAbcPlaybackState}),
    }));
  }

  function clearBassPatternTimers() {
    clearPlaybackTimers(bassPatternTimeoutsRef);
  }

  function stopBassPatternPlayback() {
    stopBassPatternTransport({
      runRef: bassPatternPlaybackRunRef, clearTimers: clearBassPatternTimers,
      setState: setBassPatternPlaybackState,
      setActiveButtons: setBassPatternActiveButtonIds, stopSound: stopAllSound,
    });
  }

  function downloadTextFile(
    filename: string,
    text: string,
    mimeType = "text/plain",
  ) {
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
    startWhenSamplesReady(bassPatternEvents.flatMap((event) => event.buttons), () => startBassPatternTransport({
      eventCount: bassPatternEvents.length, runRef: bassPatternPlaybackRunRef,
      clearTimers: clearBassPatternTimers, stopAbc: stopAbcPlayback,
      clearActiveButtons: () => setBassPatternActiveButtonIds([]),
      stopSound: stopAllSound,
      setScaleFinderActive, setChordFinderActive, setStradellaFinderActive: setStradellaChordFinderActive,
      setPlaybackState: setBassPatternPlaybackState,
      schedule: (runId) => scheduleBassPatternEvents({bassPatternEvents, bassPatternTempoBpm,
        bassPatternUnitsPerBeat: bassPatternBeat(selectedBassPattern?.meter ?? "4/4").unitsPerBeat,
        bassPatternTotalBeats, bassPatternLoopMode, bassPatternLoopCount,
        bassPatternTimeoutsRef, bassPatternPlaybackRunRef, runId, soundOptions,
        setBassPatternActiveButtonIds, setBassPatternPlaybackState}),
    }));
  }

  /** Stops currently playing notes and any scheduled sequence playback. */
  function stopSoundPlayback() {
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionPulseSilent(false);
  }

  return {
    samplesLoading, soundEnginePlayer, setSoundEnginePlayer, playStradellaChordFinder,
    playScaleFinder, playChordFinder, playSelectedButtons, playRecordedSequence,
    stopAbcPlayback, pauseAbcPlayback, startWhenSamplesReady, scheduleAbcPlayback,
    stopBassPatternPlayback, exportSelectedBassPattern, scheduleBassPatternPlayback,
    stopSoundPlayback,
  };
}
