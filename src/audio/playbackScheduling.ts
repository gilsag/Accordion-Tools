import type { Dispatch, RefObject, SetStateAction } from "react";
import type { SoundOptions } from "../sound";
import { playButtonSound } from "../sound";
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
/** Schedules identical ABC note-on, highlight-clear and completion timeouts.
 * App still controls transport exclusivity and stop/seek transitions.
 */
export function scheduleAbcMappedPlayback({abcMappedEvents, startBeat, abcTempoBpm,
  abcTotalBeats, abcPlaybackTimeoutsRef, abcPlaybackStartedAtRef,
  soundOptions, setAbcPositionBeat, setAbcActiveButtonIds, setAbcPlaybackState,
}: AbcScheduleArgs) {
    const beatMs = 60000 / Math.max(20, abcTempoBpm);
    const eventsToSchedule = abcMappedEvents.filter(
      (event) => event.startBeat + event.durationBeats >= startBeat,
    );

    eventsToSchedule.forEach((event) => {
      const delayMs = Math.max(0, (event.startBeat - startBeat) * beatMs);
      const onTimeout = window.setTimeout(() => {
        setAbcPositionBeat(event.startBeat);
        setAbcActiveButtonIds(event.buttons.map((button) => button.id));
        event.buttons.forEach((button) =>
          playButtonSound(button, soundOptions),
        );

        const clearTimeoutId = window.setTimeout(
          () => {
            setAbcActiveButtonIds((current) => {
              const eventIds = new Set(
                event.buttons.map((button) => button.id),
              );
              return current.filter((id) => !eventIds.has(id));
            });
          },
          Math.max(80, event.durationBeats * beatMs * 0.85),
        );
        abcPlaybackTimeoutsRef.current.push(clearTimeoutId);
      }, delayMs);
      abcPlaybackTimeoutsRef.current.push(onTimeout);
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
/** Preserve loop cadence, gain, cancellation generation, and button
 * highlight lifetime in one playback service shared by pattern controllers.
 */
export function scheduleBassPatternEvents({bassPatternEvents, bassPatternTempoBpm,
  bassPatternTotalBeats, bassPatternLoopMode, bassPatternLoopCount,
  bassPatternTimeoutsRef, bassPatternPlaybackRunRef, runId, soundOptions,
  setBassPatternActiveButtonIds, setBassPatternPlaybackState,
}: BassPatternScheduleArgs) {
    const beatMs = 60000 / Math.max(30, bassPatternTempoBpm);
    const cycleBeats = Math.max(0, bassPatternTotalBeats);
    const repeats =
      bassPatternLoopMode === "fixed"
        ? Math.max(1, Math.min(64, Math.round(bassPatternLoopCount)))
        : 1;

    const scheduleCycle = (cycleIndex: number) => {
      if (bassPatternPlaybackRunRef.current !== runId) return;
      const cycleOffsetMs = cycleIndex * cycleBeats * beatMs;

      bassPatternEvents.forEach((event) => {
        const onTimeout = window.setTimeout(
          () => {
            if (bassPatternPlaybackRunRef.current !== runId) return;
            setBassPatternActiveButtonIds(
              event.buttons.map((button) => button.id),
            );
            const eventSoundOptions = {
              ...soundOptions,
              volume: Math.min(1, soundOptions.volume * event.gain),
            };
            event.buttons.forEach((button) =>
              playButtonSound(button, eventSoundOptions),
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
              Math.max(80, event.durationBeats * beatMs * 0.85),
            );
            bassPatternTimeoutsRef.current.push(clearTimeoutId);
          },
          Math.max(0, cycleOffsetMs + event.startBeat * beatMs),
        );
        bassPatternTimeoutsRef.current.push(onTimeout);
      });
    };

    if (bassPatternLoopMode === "infinite") {
      const scheduleInfiniteCycle = (cycleIndex: number) => {
        if (bassPatternPlaybackRunRef.current !== runId) return;
        scheduleCycle(cycleIndex);
        const nextCycleTimeout = window.setTimeout(
          () => {
            scheduleInfiniteCycle(cycleIndex + 1);
          },
          Math.max(120, cycleBeats * beatMs),
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
