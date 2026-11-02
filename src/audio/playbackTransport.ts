import type { MutableRefObject } from "react";

/** Shared transport cancellation. Each feature retains its own timeout ref and
 * generation token: stopping ABC must not silently change bass/progression
 * run semantics. Never substitute sound events for highlighted button IDs.
 */
export function clearPlaybackTimers(timers: MutableRefObject<number[]>) {
  timers.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
  timers.current = [];
}

/** Preserve the browser monotonic playback clock used for ABC pause offsets. */
export function playbackClockMs() {
  return performance.now();
}
