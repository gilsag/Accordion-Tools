/**
 * Count-in and metronome for the rhythmic players (ABC Player, Bass Pattern
 * Player, Progression Assistant, Rhythm Trainer).
 *
 * A player computes its click grid from its meter, moves its own origin later
 * by `countInMs()` so the music starts after one bar of clicks, and calls
 * `scheduleCountIn()` and `scheduleBeatClicks()` with the same clock ports it
 * schedules notes on, so stopping the player cancels the clicks too. The
 * click sound is passed in, so this module has no audio of its own.
 */
import { scheduleAtAudioOffset, type AudioClockPorts } from "./audioClock";

/** The two playback-bar switches, read from the sound options. */
export type ClickOptions = { enabled: boolean; countIn?: boolean; metronome?: boolean };
/** Plays one click at an AudioContext time; the first beat of a bar is accented. */
export type PlayClick = (when: number, accent: boolean) => void;

/** One click per beat as players count it: dotted quarters in compound
 * meters (6/8 has two), otherwise the written beat (3/4 has three quarters,
 * 2/2 two halves). */
export type ClickGrid = { clickMs: number; clicksPerBar: number };

/** The click grid of a meter such as "3/4", "6/8", "C" or "C|", given the
 * length of a quarter note. An unreadable meter counts as 4/4. */
export function clickGrid(meter: string, quarterMs: number): ClickGrid {
  const written = meter.trim() === "C" ? "4/4" : meter.trim() === "C|" ? "2/2" : meter;
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(written.trim());
  const numerator = match ? Number(match[1]) : 4;
  const denominator = match ? Number(match[2]) : 4;
  const compound = denominator >= 8 && numerator > 3 && numerator % 3 === 0;
  const beatQuarters = (compound ? 3 : 1) * (4 / denominator);
  return {
    clickMs: beatQuarters * quarterMs,
    clicksPerBar: compound ? numerator / 3 : numerator,
  };
}

/** How long the count-in lasts: one bar when it is switched on, else 0. */
export function countInMs(grid: ClickGrid, options: ClickOptions) {
  return options.enabled && options.countIn ? grid.clickMs * grid.clicksPerBar : 0;
}

/** One bar of clicks ending at `origin`, the moment the music starts. */
export function scheduleCountIn(
  ports: AudioClockPorts,
  origin: number,
  grid: ClickGrid,
  options: ClickOptions,
  playClick: PlayClick,
) {
  if (!options.enabled || !options.countIn) return;
  for (let index = 0; index < grid.clicksPerBar; index += 1)
    scheduleAtAudioOffset(ports, origin, -(grid.clicksPerBar - index) * grid.clickMs, (when) =>
      playClick(when, index === 0),
    );
}

/** With the metronome on, a click on every beat of the music between
 * `fromMs` and `toMs` (music time, where beat 0 is the first downbeat).
 * `positionMs` is the music time heard at `origin`, for a resumed player. */
export function scheduleBeatClicks(
  ports: AudioClockPorts,
  origin: number,
  grid: ClickGrid,
  options: ClickOptions,
  playClick: PlayClick,
  span: { fromMs: number; toMs: number; positionMs?: number },
) {
  if (!options.enabled || !options.metronome || grid.clickMs <= 0) return;
  const positionMs = span.positionMs ?? 0;
  const epsilon = 1e-6;
  for (
    let beat = Math.ceil(span.fromMs / grid.clickMs - epsilon);
    beat * grid.clickMs < span.toMs - epsilon;
    beat += 1
  )
    scheduleAtAudioOffset(ports, origin, beat * grid.clickMs - positionMs, (when) =>
      playClick(when, beat % grid.clicksPerBar === 0),
    );
}
