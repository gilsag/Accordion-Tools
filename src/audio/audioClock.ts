/**
 * Look-ahead scheduling on the Web Audio clock.
 *
 * Browser timers can fire tens of milliseconds late while React renders, so a
 * note started from inside a timer inherits that jitter. Here a timer only wakes
 * the scheduler AUDIO_LOOKAHEAD_MS early; the note itself is placed at an exact
 * AudioContext time, and the visual highlight waits until that time arrives.
 * Times passed around are AudioContext seconds; offsets are milliseconds from a
 * transport's origin.
 */

/** How early a timer wakes before the sound it places. */
export const AUDIO_LOOKAHEAD_MS = 150;
/** Gap between pressing Play and the first scheduled note, in seconds. */
export const AUDIO_START_LATENCY_S = 0.04;

export interface AudioClockPorts {
  /** Current AudioContext time in seconds. */
  now(): number;
  /** Records a timer id so the owning transport can cancel it. */
  push(id: number): void;
}

/** Origin (AudioContext seconds) for a transport starting now. */
export function audioTimelineOrigin(now: () => number) {
  return now() + AUDIO_START_LATENCY_S;
}

/** Milliseconds until a given audio time, minus an optional early margin. */
export function msUntilAudioTime(ports: Pick<AudioClockPorts, "now">, when: number, earlyMs = 0) {
  return Math.max(0, (when - ports.now()) * 1000 - earlyMs);
}

/**
 * Schedules `onAudio(when)` shortly before `origin + offsetMs`, so it can place
 * sounds exactly at `when`, then `onHeard()` when that moment is reached.
 */
export function scheduleAtAudioOffset(
  ports: AudioClockPorts,
  origin: number,
  offsetMs: number,
  onAudio: (when: number) => void,
  onHeard?: () => void,
) {
  const when = origin + offsetMs / 1000;
  ports.push(window.setTimeout(() => {
    onAudio(when);
    if (onHeard) ports.push(window.setTimeout(onHeard, msUntilAudioTime(ports, when)));
  }, msUntilAudioTime(ports, when, AUDIO_LOOKAHEAD_MS)));
}
