import { audioTimelineOrigin, msUntilAudioTime, scheduleAtAudioOffset } from "../audio/audioClock";
import type { useHarmonyExplorerState } from "../features/harmonyExplorer/useHarmonyExplorer";
import type { useHarmonyProgressionState } from "../features/progressionAssistant/useProgressionAssistant";
import type { useSoundSettings } from "../audio/useSoundSettings";
import { clearPlaybackTimers } from "../audio/playbackTransport";
import { stopAllSound, audioClockNow, playHarmonyPitchClassChord, playHarmonyRelationship } from "../sound";
import type { ChordFamilyId } from "../tools/harmonyExplorer/music";
import { CIRCLE_OF_FIFTHS, pitchClassesForChord as harmonyPitchClassesForChord } from "../tools/harmonyExplorer/music";
import type { HarmonyPlaybackStyle } from "../tools/harmonyExplorer/types";
import type { HarmonyRecordedChord } from "../tools/harmonyExplorer/progression";
import { pitchClassNameFromNumber } from "../tools/harmonyExplorer/integration";

export type UseHarmonyActionsDeps = Pick<ReturnType<typeof useHarmonyExplorerState>,
    "harmonyPlaybackStyle"> &
  Pick<ReturnType<typeof useHarmonyProgressionState>,
    "harmonyProgressionIdRef" | "harmonyProgressionRecording" |
    "harmonyRecordedPlaybackTimeoutsRef" | "harmonyRecordedProgression" |
    "setHarmonyProgressionRecording" | "setHarmonyRecordedNotationVisible" |
    "setHarmonyRecordedProgression" | "setHarmonyRecordedProgressionPlaying"> &
  Pick<ReturnType<typeof useSoundSettings>,
    "soundOptions" | "soundSequenceTempoBpm">;

/** Harmony Explorer chord playback and the Harmony recording: record, play on the audio clock, stop and clear. */
export function useHarmonyActions(deps: UseHarmonyActionsDeps) {
  const {
    harmonyPlaybackStyle, harmonyProgressionIdRef, harmonyProgressionRecording,
    harmonyRecordedPlaybackTimeoutsRef, harmonyRecordedProgression, setHarmonyProgressionRecording,
    setHarmonyRecordedNotationVisible, setHarmonyRecordedProgression,
    setHarmonyRecordedProgressionPlaying, soundOptions, soundSequenceTempoBpm,
  } = deps;

  function harmonyPitchNames(rootPc: number, familyId: ChordFamilyId) {
    return harmonyPitchClassesForChord(rootPc, familyId).map(pitchClassNameFromNumber);
  }

  function playHarmonyChord(rootPc: number, familyId: ChordFamilyId, style: HarmonyPlaybackStyle) {
    playHarmonyPitchClassChord(harmonyPitchNames(rootPc, familyId), soundOptions, style);
  }

  function playHarmonyChordRelationship(
    referenceRootPc: number,
    referenceFamilyId: ChordFamilyId,
    targetRootPc: number,
    targetFamilyId: ChordFamilyId,
    style: HarmonyPlaybackStyle,
  ) {
    playHarmonyRelationship(
      harmonyPitchNames(referenceRootPc, referenceFamilyId),
      harmonyPitchNames(targetRootPc, targetFamilyId),
      soundOptions,
      style,
    );
  }

  function harmonyProgressionSectorIndex(rootPc: number) {
    const index = CIRCLE_OF_FIFTHS.indexOf(rootPc as (typeof CIRCLE_OF_FIFTHS)[number]);
    return index >= 0 ? index : 0;
  }

  function makeHarmonyProgressionChord(
    rootPc: number,
    familyId: ChordFamilyId,
    sectorIndex = harmonyProgressionSectorIndex(rootPc),
  ): HarmonyRecordedChord {
    const id = `harmony-progression-${harmonyProgressionIdRef.current++}`;
    return { id, rootPc, familyId, sectorIndex };
  }

  function playHarmonyNote(pitchClass: number) {
    playHarmonyPitchClassChord([pitchClassNameFromNumber(pitchClass)], soundOptions, "block");
    if (!harmonyProgressionRecording) return;
    setHarmonyRecordedProgression((current) => [
      ...current,
      {
        id: `harmony-note-${harmonyProgressionIdRef.current++}`,
        kind: "note",
        pitchClass,
        sectorIndex: harmonyProgressionSectorIndex(pitchClass),
      },
    ]);
  }

  function handleHarmonyChordActivated(rootPc: number, familyId: ChordFamilyId, sectorIndex: number) {
    if (!harmonyProgressionRecording) return;
    setHarmonyRecordedProgression((current) => [
      ...current,
      makeHarmonyProgressionChord(rootPc, familyId, sectorIndex),
    ]);
  }

  function toggleHarmonyProgressionRecording() {
    setHarmonyProgressionRecording((current) => !current);
  }

  function stopHarmonyRecordedProgressionPlayback() {
    clearPlaybackTimers(harmonyRecordedPlaybackTimeoutsRef);
    setHarmonyRecordedProgressionPlaying(false);
    stopAllSound();
  }

  function playHarmonyRecordedProgression() {
    if (harmonyRecordedProgression.length === 0) return;
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyRecordedProgressionPlaying(true);
    const beatMs = 60000 / Math.max(40, soundSequenceTempoBpm);
    // One recorded event per beat, placed on the audio clock like the other players.
    const ports = { now: audioClockNow, push: (id: number) => harmonyRecordedPlaybackTimeoutsRef.current.push(id) };
    const origin = audioTimelineOrigin(ports.now);
    const durationMs = beatMs * soundOptions.articulation;

    harmonyRecordedProgression.forEach((event, index) => {
      scheduleAtAudioOffset(ports, origin, index * beatMs, (when) => {
        if (event.kind === "note") {
          playHarmonyPitchClassChord(
            [pitchClassNameFromNumber(event.pitchClass)],
            soundOptions,
            "block",
            { at: when, durationMs },
          );
        } else {
          playHarmonyPitchClassChord(
            harmonyPitchNames(event.rootPc, event.familyId),
            soundOptions,
            harmonyPlaybackStyle,
            { at: when, durationMs },
          );
        }
      });
    });

    const stopTimeout = window.setTimeout(
      () => stopHarmonyRecordedProgressionPlayback(),
      msUntilAudioTime(ports, origin + (harmonyRecordedProgression.length * beatMs + Math.min(600, beatMs)) / 1000),
    );
    harmonyRecordedPlaybackTimeoutsRef.current.push(stopTimeout);
  }

  function clearHarmonyRecordedProgression() {
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyRecordedProgression([]);
    setHarmonyRecordedNotationVisible(false);
  }

  return {
    playHarmonyChord, playHarmonyChordRelationship, harmonyProgressionSectorIndex,
    makeHarmonyProgressionChord, playHarmonyNote, handleHarmonyChordActivated,
    toggleHarmonyProgressionRecording, stopHarmonyRecordedProgressionPlayback,
    playHarmonyRecordedProgression, clearHarmonyRecordedProgression,
  };
}
