/** Count-in and metronome: which beats click in each meter, and when.
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  clickGrid,
  countInMs,
  scheduleBeatClicks,
  scheduleCountIn,
} from "../../../src/audio/clickTrack";
import { abcMeter } from "../../../src/features/abcPlayer/abcMeter";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("clicks fall on the beats as players count them", () => {
  expect(clickGrid("3/4", 500)).toEqual({ clickMs: 500, clicksPerBar: 3 });
  expect(clickGrid("4/4", 500)).toEqual({ clickMs: 500, clicksPerBar: 4 });
  expect(clickGrid("2/2", 500)).toEqual({ clickMs: 1000, clicksPerBar: 2 });
  expect(clickGrid("C|", 500)).toEqual({ clickMs: 1000, clicksPerBar: 2 });
  expect(clickGrid("C", 500)).toEqual({ clickMs: 500, clicksPerBar: 4 });
  // Compound meters count dotted quarters.
  expect(clickGrid("6/8", 500)).toEqual({ clickMs: 750, clicksPerBar: 2 });
  expect(clickGrid("12/8", 500)).toEqual({ clickMs: 750, clicksPerBar: 4 });
  // 3/8 is simple: three eighths.
  expect(clickGrid("3/8", 500)).toEqual({ clickMs: 250, clicksPerBar: 3 });
  expect(clickGrid("nonsense", 500)).toEqual({ clickMs: 500, clicksPerBar: 4 });
});

test("the count-in lasts one bar, and only when sound and the switch are on", () => {
  const grid = clickGrid("3/4", 500);
  expect(countInMs(grid, { enabled: true, countIn: true })).toBe(1500);
  expect(countInMs(grid, { enabled: true, countIn: false })).toBe(0);
  expect(countInMs(grid, { enabled: false, countIn: true })).toBe(0);
});

/** Runs the scheduler on a fake clock and returns the click times and accents. */
function clicksOf(schedule: (ports: { now(): number; push(id: number): void }) => void) {
  const heard: [number, boolean][] = [];
  const ports = { now: () => 10, push: () => {} };
  (globalThis as unknown as { heard: typeof heard }).heard = heard;
  schedule(ports);
  vi.runAllTimers();
  return heard;
}
const record = (when: number, accent: boolean) =>
  (globalThis as unknown as { heard: [number, boolean][] }).heard.push([
    Math.round(when * 1000) / 1000,
    accent,
  ]);

test("the count-in ends exactly where the music starts, accenting its first click", () => {
  const grid = clickGrid("3/4", 500);
  const clicks = clicksOf((ports) =>
    scheduleCountIn(ports, 20, grid, { enabled: true, countIn: true }, record),
  );
  expect(clicks).toEqual([
    [18.5, true],
    [19, false],
    [19.5, false],
  ]);
});

test("the metronome clicks every beat of the span, accenting each downbeat", () => {
  const grid = clickGrid("3/4", 500);
  const clicks = clicksOf((ports) =>
    scheduleBeatClicks(ports, 20, grid, { enabled: true, metronome: true }, record, {
      fromMs: 0,
      toMs: 2500,
    }),
  );
  expect(clicks).toEqual([
    [20, true],
    [20.5, false],
    [21, false],
    [21.5, true],
    [22, false],
  ]);
});

test("a resumed player clicks on the beats still to come, in time with the music", () => {
  const grid = clickGrid("4/4", 500);
  // Resumed at 1.25 s of music: the next beats are at 1.5 s and 2 s, the
  // second bar's downbeat.
  const clicks = clicksOf((ports) =>
    scheduleBeatClicks(ports, 20, grid, { enabled: true, metronome: true }, record, {
      fromMs: 1250,
      toMs: 2100,
      positionMs: 1250,
    }),
  );
  expect(clicks).toEqual([
    [20.25, false],
    [20.75, true],
  ]);
});

test("nothing clicks with the switches off", () => {
  const grid = clickGrid("4/4", 500);
  const clicks = clicksOf((ports) => {
    scheduleCountIn(ports, 20, grid, { enabled: true, countIn: false }, record);
    scheduleBeatClicks(ports, 20, grid, { enabled: true, metronome: false }, record, {
      fromMs: 0,
      toMs: 2000,
    });
  });
  expect(clicks).toEqual([]);
});

test("an ABC tune's meter comes from its M: field", () => {
  expect(abcMeter("X:1\nM:6/8\nK:G\nGAB|")).toBe("6/8");
  expect(abcMeter("X:1\nM: 3 / 4\nK:C\nC|")).toBe("3/4");
  expect(abcMeter("X:1\nM:C|\nK:C\nC|")).toBe("C|");
  expect(abcMeter("X:1\nK:C\nC|")).toBe("4/4");
  expect(abcMeter("X:1\nM:none\nK:C\nC|")).toBe("4/4");
});
