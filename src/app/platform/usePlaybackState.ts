import { useEffect, useState } from "react";
import {
  currentPlaybackGeneration,
  onStopAllSound,
  preloadLaMelodiosa,
  prepareSamplesFor,
  samplesReadyFor,
  unlockAudio,
} from "../../audio/sound";
import type { DiagramButton, Side } from "../../types";
import type { WorkspaceMode } from "../toolRegistry";
import type { PlatformSound } from "./platformContexts";

/** Playback state shared by every player: unlocking audio and preloading
 * samples after the first gesture, the "Loading sounds" flag, the player that
 * runs inside the sound engine, and starting once samples are decoded. Each
 * tool's own transport is the tool's. */
export function usePlaybackState(
  sound: Pick<
    PlatformSound,
    | "soundEnabled"
    | "soundSource"
    | "soundOptions"
    | "laMelodiosaBassRegister"
    | "laMelodiosaTrebleRegister"
  >,
  side: Side,
  workspaceMode: WorkspaceMode,
) {
  const {
    soundEnabled,
    soundSource,
    soundOptions,
    laMelodiosaBassRegister,
    laMelodiosaTrebleRegister,
  } = sound;
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
  const [soundEnginePlayer, setSoundEnginePlayer] = useState<"progression" | "sequence" | null>(
    null,
  );
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
  }, [
    audioGestureSeen,
    sampleSide,
    soundEnabled,
    soundSource,
    laMelodiosaTrebleRegister,
    laMelodiosaBassRegister,
  ]);

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

  return { samplesLoading, soundEnginePlayer, setSoundEnginePlayer, startWhenSamplesReady };
}
