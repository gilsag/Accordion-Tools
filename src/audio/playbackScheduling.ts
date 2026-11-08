import type { Dispatch, RefObject, SetStateAction } from "react";
import type { SoundOptions } from "../sound";
import { audioClockNow, playButtonSound } from "../sound";
import { AUDIO_LOOKAHEAD_MS, audioTimelineOrigin, msUntilAudioTime, scheduleAtAudioOffset } from "./audioClock";
import type { MappedAbcEvent } from "../tools/abcPlayerTools";
import type { BassPatternPlaybackEvent } from "../tools/bassPatternPlayerTools";

type AbcScheduleArgs = {
  abcMappedEvents: MappedAbcEvent[];
  startBeat: number;
  abcTempoBpm: number;
  abcTotalBeats: number;
  abcPlaybackTimeoutsRef: RefObject<number[]>;
  abcPlaybackStartedAtRef: RefObject<number | null>;
  soundOptions: SoundOptions;
  setAbcPositionBeat: Dispatch<SetStateAction<number>>;
  setAbcActiveButtonIds: Dispatch<SetStateAction<string[]>>;
  setAbcPlaybackState: Dispatch<SetStateAction<"stopped" | "paused" | "playing">>;
};
/** Schedules ABC notes on the audio clock: each sounds at its exact beat for
 * its written length (times soundOptions.articulation), and its highlight and
 * position update when it is heard. App still controls transport exclusivity
 * and stop/seek transitions; the completion timer stays on wall-clock time.
 */
export function scheduleAbcMappedPlayback({abcMappedEvents, startBeat, abcTempoBpm,
  abcTotalBeats, abcPlaybackTimeoutsRef, abcPlaybackStartedAtRef,
  soundOptions, setAbcPositionBeat, setAbcActiveButtonIds, setAbcPlaybackState,
}: AbcScheduleArgs) {
    const beatMs = 60000 / Math.max(20, abcTempoBpm);
    // A note that ends exactly at the resume point has nothing left to play.
    const eventsToSchedule = abcMappedEvents.filter(
      (event) => event.startBeat + event.durationBeats > startBeat,
    );
    const ports = {
      now: audioClockNow,
      push: (id: number) => abcPlaybackTimeoutsRef.current.push(id),
    };
    const origin = audioTimelineOrigin(ports.now);

    eventsToSchedule.forEach((event) => {
      const offsetMs = Math.max(0, (event.startBeat - startBeat) * beatMs);
      // When resuming mid-note, only the remainder of that note sounds.
      const remainingBeats = event.startBeat + event.durationBeats - Math.max(startBeat, event.startBeat);
      const durationMs = remainingBeats * beatMs * soundOptions.articulation;
      scheduleAtAudioOffset(ports, origin, offsetMs,
        (when) => event.buttons.forEach((button) =>
          playButtonSound(button, soundOptions, { at: when, durationMs })),
        () => {
          setAbcPositionBeat(event.startBeat);
          // Add rather than replace: with both hands, a melody note and a
          // bass note can sound at once, each cleared when it ends.
          setAbcActiveButtonIds((current) => current.concat(
            event.buttons.map((button) => button.id).filter((id) => !current.includes(id))));
          const clearTimeoutId = window.setTimeout(
            () => {
              setAbcActiveButtonIds((current) => {
                const eventIds = new Set(
                  event.buttons.map((button) => button.id),
                );
                return current.filter((id) => !eventIds.has(id));
              });
            },
            Math.max(80, event.durationBeats * beatMs * soundOptions.articulation),
          );
          abcPlaybackTimeoutsRef.current.push(clearTimeoutId);
        });
    });

    const stopTimeout = window.setTimeout(
      () => {
        setAbcPlaybackState("stopped");
        setAbcPositionBeat(0);
        setAbcActiveButtonIds([]);
        abcPlaybackStartedAtRef.current = null;
      },
      Math.max(0, (abcTotalBeats - startBeat) * beatMs) + 120,
    );
    abcPlaybackTimeoutsRef.current.push(stopTimeout);
}

type BassPatternScheduleArgs = {
  bassPatternEvents: BassPatternPlaybackEvent[];
  bassPatternTempoBpm: number;
  /** Meter units in one tempo beat: 3 in compound meters such as 6/8, else 1. */
  bassPatternUnitsPerBeat?: number;
  bassPatternTotalBeats: number;
  bassPatternLoopMode: "once" | "fixed" | "infinite";
  bassPatternLoopCount: number;
  bassPatternTimeoutsRef: RefObject<number[]>;
  bassPatternPlaybackRunRef: RefObject<number>;
  runId: number;
  soundOptions: SoundOptions;
  setBassPatternActiveButtonIds: Dispatch<SetStateAction<string[]>>;
  setBassPatternPlaybackState: Dispatch<SetStateAction<"stopped" | "playing">>;
};
/** Schedules Bass Pattern events on the audio clock, preserving loop cadence,
 * per-event gain, cancellation by run ID and button highlight lifetime. Each
 * note sounds for its written length times soundOptions.articulation.
 */
export function scheduleBassPatternEvents({bassPatternEvents, bassPatternTempoBpm, bassPatternUnitsPerBeat = 1,
  bassPatternTotalBeats, bassPatternLoopMode, bassPatternLoopCount,
  bassPatternTimeoutsRef, bassPatternPlaybackRunRef, runId, soundOptions,
  setBassPatternActiveButtonIds, setBassPatternPlaybackState,
}: BassPatternScheduleArgs) {
    // Event times are meter units; the tempo counts beats of unitsPerBeat units.
    const beatMs = 60000 / Math.max(30, bassPatternTempoBpm) / Math.max(1, bassPatternUnitsPerBeat);
    const cycleBeats = Math.max(0, bassPatternTotalBeats);
    const repeats =
      bassPatternLoopMode === "fixed"
        ? Math.max(1, Math.min(64, Math.round(bassPatternLoopCount)))
        : 1;
    const ports = {
      now: audioClockNow,
      push: (id: number) => bassPatternTimeoutsRef.current.push(id),
    };
    const origin = audioTimelineOrigin(ports.now);

    const scheduleCycle = (cycleIndex: number) => {
      if (bassPatternPlaybackRunRef.current !== runId) return;
      const cycleOffsetMs = cycleIndex * cycleBeats * beatMs;

      bassPatternEvents.forEach((event) => {
        const eventSoundOptions = {
          ...soundOptions,
          volume: Math.min(1, soundOptions.volume * event.gain),
        };
        const durationMs = event.durationBeats * beatMs * soundOptions.articulation;
        scheduleAtAudioOffset(ports, origin, Math.max(0, cycleOffsetMs + event.startBeat * beatMs),
          (when) => {
            if (bassPatternPlaybackRunRef.current !== runId) return;
            event.buttons.forEach((button) =>
              playButtonSound(button, eventSoundOptions, { at: when, durationMs }),
            );
          },
          () => {
            if (bassPatternPlaybackRunRef.current !== runId) return;
            setBassPatternActiveButtonIds(
              event.buttons.map((button) => button.id),
            );
            const clearTimeoutId = window.setTimeout(
              () => {
                if (bassPatternPlaybackRunRef.current !== runId) return;
                setBassPatternActiveButtonIds((current) => {
                  const eventIds = new Set(
                    event.buttons.map((button) => button.id),
                  );
                  return current.filter((id) => !eventIds.has(id));
                });
              },
              Math.max(80, event.durationBeats * beatMs * soundOptions.articulation),
            );
            bassPatternTimeoutsRef.current.push(clearTimeoutId);
          });
      });
    };

    if (bassPatternLoopMode === "infinite") {
      const cycleMs = Math.max(120, cycleBeats * beatMs);
      const scheduleInfiniteCycle = (cycleIndex: number) => {
        if (bassPatternPlaybackRunRef.current !== runId) return;
        scheduleCycle(cycleIndex);
        // Wake early enough to place the next cycle's first notes on time.
        const nextCycleTimeout = window.setTimeout(
          () => {
            scheduleInfiniteCycle(cycleIndex + 1);
          },
          msUntilAudioTime(ports, origin + ((cycleIndex + 1) * cycleMs) / 1000, 2 * AUDIO_LOOKAHEAD_MS),
        );
        bassPatternTimeoutsRef.current.push(nextCycleTimeout);
      };
      scheduleInfiniteCycle(0);
      return;
    }

    for (let cycleIndex = 0; cycleIndex < repeats; cycleIndex += 1) {
      scheduleCycle(cycleIndex);
    }

    const stopTimeout = window.setTimeout(
      () => {
        if (bassPatternPlaybackRunRef.current !== runId) return;
        setBassPatternPlaybackState("stopped");
        setBassPatternActiveButtonIds([]);
      },
      Math.max(0, cycleBeats * repeats * beatMs) + 140,
    );
    bassPatternTimeoutsRef.current.push(stopTimeout);
}
