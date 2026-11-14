import { useRef, useState } from "react";
import type { HarmonyRecordedEvent } from "../progressionAssistant/engine/progression";

/** The progression recorded on the Harmony circle: the events, whether
 * recording is on, its score and its playback state.
 *
 * `harmonyProgressionIdRef` numbers every chord the Harmony workspace creates,
 * in the recording and in the Progression Assistant alike, so that ids stay
 * unique across both lists. It must survive renders; settings never touch it. */
export function useHarmonyRecordingState() {
  const [harmonyRecordedProgression, setHarmonyRecordedProgression] = useState<
    HarmonyRecordedEvent[]
  >([]);
  const [harmonyProgressionRecording, setHarmonyProgressionRecording] = useState(false);
  const [harmonyRecordedNotationVisible, setHarmonyRecordedNotationVisible] = useState(false);
  const [harmonyRecordedProgressionPlaying, setHarmonyRecordedProgressionPlaying] = useState(false);
  const harmonyRecordedPlaybackTimeoutsRef = useRef<number[]>([]);
  const harmonyRecordedNotationRef = useRef<HTMLDivElement | null>(null);
  const harmonyProgressionIdRef = useRef(1);
  return {
    harmonyRecordedProgression,
    setHarmonyRecordedProgression,
    harmonyProgressionRecording,
    setHarmonyProgressionRecording,
    harmonyRecordedNotationVisible,
    setHarmonyRecordedNotationVisible,
    harmonyRecordedProgressionPlaying,
    setHarmonyRecordedProgressionPlaying,
    harmonyRecordedPlaybackTimeoutsRef,
    harmonyRecordedNotationRef,
    harmonyProgressionIdRef,
  };
}
