/** Behavior-based contract checks for rendering/exports, notation,
 * and playback scheduling. This module runs with node, no browser or tsx.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const read = (path) => readFileSync(path, "utf8");
function loadTs(path, imports, extras = {}) {
  const compiled = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  runInNewContext(compiled, {
    module: mod, exports: mod.exports, TextEncoder, Uint8Array, require(name) {
      if (name in imports) return imports[name];
      throw new Error(`${path}: unexpected import ${name}`);
    }, ...extras,
  }, { filename: path });
  return mod.exports;
}

// Exports retain filename selection, dispatch, raster ordering and dimensions.
const exportCalls = [];
const svgExport = loadTs("src/diagram/diagramExport.ts", {
  "../download": {
    downloadPng: (_svg, name) => exportCalls.push(["png", name]),
    downloadSvg: (_svg, name) => exportCalls.push(["svg", name]),
    downloadZip: (entries, name) => exportCalls.push(["zip", entries, name]),
    svgStringToPngBytes: async (svg, w, h) => {
      exportCalls.push(["convert", svg, w, h]);
      return new Uint8Array([42]);
    },
  },
});
assert.equal(svgExport.accordionDiagramFilename("C♯m / E♭", "stradella"), "Csharpm-Eflat");
assert.equal(svgExport.accordionDiagramFilename("CON", "stradella"), "stradella-accordion-diagram");
assert.equal(svgExport.accordionDiagramFilename(" ", "piano-treble"), "piano-treble-accordion-diagram");
assert.equal(svgExport.harmonyDiagramFilename("m(M7)", "Relative MAJOR", "C Major"), "harmonic-circle-mm7-relative-major-c-major");
svgExport.downloadDiagram({}, "Test", "png");
svgExport.downloadDiagram({}, "Test", "svg");
assert.deepEqual(exportCalls.slice(0, 2).map((x) => [...x]), [["png", "Test.png"], ["svg", "Test.svg"]]);
const snapshots = [
  { name: "001-a", svg: "<svg>a</svg>", width: 401, height: 209 },
  { name: "002-b", svg: "<svg>b</svg>", width: 402, height: 210 },
];
await svgExport.downloadDiagramBatch(snapshots, "png", "batch.zip");
assert.deepEqual(exportCalls.filter((c) => c[0] === "convert").map((c) => c.slice(2)), [[401, 209], [402, 210]]);
const zipped = exportCalls.at(-1);
assert.equal(zipped[0], "zip");
assert.equal(zipped[2], "batch.zip");
assert.deepEqual(Array.from(zipped[1], (e) => e.name), ["001-a.png", "002-b.png"]);
exportCalls.length = 0;
await svgExport.downloadDiagramBatch(snapshots, "svg", "svgs.zip");
assert.equal(exportCalls.filter((c) => c[0] === "convert").length, 0);
assert.deepEqual(Array.from(exportCalls.at(-1)[1], (e) => e.name), ["001-a.svg", "002-b.svg"]);
const mockSvg = { getScreenCTM: () => ({ inverse: () => "inverse" }), createSVGPoint() {
  return { x: 0, y: 0, matrixTransform(matrix) { return { x: this.x, y: this.y, matrix }; } };
} };
assert.equal(svgExport.svgPointFromClient(null, 2, 3), null);
assert.equal(svgExport.svgPointFromClient(mockSvg, 41, 62).x, 41);
assert.equal(svgExport.svgPointFromClient(mockSvg, 41, 62).matrix, "inverse");

// Notation keeps identical options, DOM replacement, failure UI and SVG download.
const renderCalls = [];
class TestSvg {}
const notation = loadTs("src/notation/notationService.ts", {
  abcjs: { renderAbc: (...args) => renderCalls.push(args) },
  "../download": { downloadSvg: (_svg, filename) => renderCalls.push(["download", filename]) },
}, { SVGSVGElement: TestSvg });
const cls = new Set(["rendered-abc-error"]);
const target = { innerHTML: "old", textContent: "old", classList: {
  remove: (c) => cls.delete(c), add: (c) => cls.add(c),
} };
await notation.renderNotationInto(target, "X:1\nK:C\nC|", 110, 690);
assert.equal(target.innerHTML, "");
assert.equal(cls.has("rendered-abc-error"), false);
assert.equal(renderCalls[0][2].scale, 1.1);
assert.equal(renderCalls[0][2].staffwidth, 690);
assert.equal(renderCalls[0][2].responsive, "resize");
assert.equal(renderCalls[0][2].add_classes, true);
assert.equal(renderCalls[0][2].paddingtop, 0);
// Two requests for one target can overlap while the shared abcjs chunk loads.
// Only the latest score may be painted, including when options differ.
const priorRenderCount = renderCalls.length;
const stale = notation.renderNotationInto(target, "X:2\nK:C\nD|", 80, 420);
const newest = notation.renderNotationInto(target, "X:3\nK:C\nE|", 75, 480);
await Promise.all([stale, newest]);
assert.equal(renderCalls.length, priorRenderCount + 1, "Superseded render never paints stale notes");
assert.equal(renderCalls.at(-1)[1], "X:3\nK:C\nE|");
assert.equal(renderCalls.at(-1)[2].staffwidth, 480);

await notation.renderNotationInto(target, "  ", 100, 500);
assert.equal(renderCalls.length, 2);
const noteSvg = new TestSvg();
notation.downloadRenderedNotationSvg({ querySelector: () => noteSvg }, " C♯ - notation ");
assert.deepEqual(renderCalls.at(-1), ["download", "c-notation.svg"]);
notation.downloadRenderedNotationSvg({ querySelector: () => null }, "missing");
assert.equal(renderCalls.length, 3);

// Timer cancellation remains per-feature. ABC and Bass Pattern notes are placed
// on the audio clock: a timer wakes AUDIO_LOOKAHEAD_MS (150 ms) early, each note
// gets an exact AudioContext time and its written length times the articulation
// (0.85), and highlights wait until the note is heard.
const timeouts = new Map(); let nextTimer = 1;
const cancelled = [];
const windowMock = {
  setTimeout(fn, delay) { const id = nextTimer++; timeouts.set(id, { fn, delay }); return id; },
  clearTimeout(id) { cancelled.push(id); timeouts.delete(id); },
};
let audioNow = 10; // AudioContext seconds; origin = now + 0.04 s start latency
const soundCalls = [];
const audioClock = loadTs("src/audio/audioClock.ts", {}, { window: windowMock });
const scheduling = loadTs("src/audio/playbackScheduling.ts", {
  "./audioClock": audioClock,
  "../sound": {
    playButtonSound: (button, options, timing) => soundCalls.push([button.id, options.volume, timing]),
    audioClockNow: () => audioNow,
    TIMED_NOTE_ARTICULATION: 0.85,
  },
}, { window: windowMock });
const transport = loadTs("src/audio/playbackTransport.ts", {}, { window: windowMock, performance: { now: () => 1234 } });
assert.equal(transport.playbackClockMs(), 1234);
const delays = ids => ids.map((id) => Math.round(timeouts.get(id).delay));
const timing = ([, , value]) => ({ at: Math.round(value.at * 1000) / 1000, durationMs: Math.round(value.durationMs) });
const ref = { current: [] }; let active = []; let position = -1; let state = "stopped";
const btn = { id: "bass-C" };
scheduling.scheduleAbcMappedPlayback({
  abcMappedEvents: [{ startBeat: 0, durationBeats: 2, buttons: [btn] }, { startBeat: 3, durationBeats: 1, buttons: [btn] }],
  startBeat: 1, abcTempoBpm: 60, abcTotalBeats: 5,
  abcPlaybackTimeoutsRef: ref, abcPlaybackStartedAtRef: { current: 123 },
  soundOptions: { volume: .4, articulation: .85 }, setAbcPositionBeat: (x) => { position = x; },
  setAbcActiveButtonIds: (next) => { active = typeof next === "function" ? next(active) : next; },
  setAbcPlaybackState: (x) => { state = x; },
});
// Note 1 is under way at beat 1 (now); note 2 is 2 s later, woken 150 ms early;
// the completion timer stays on wall-clock time.
assert.deepEqual(delays(ref.current), [0, 1890, 4120]);
timeouts.get(ref.current[0]).fn();
assert.deepEqual(soundCalls[0].slice(0, 2), ["bass-C", .4]);
assert.deepEqual(timing(soundCalls[0]), { at: 10.04, durationMs: 850 }, "Resumed note sounds only its remaining beat");
assert.deepEqual(active, [], "Highlight waits until the note is heard");
assert.equal(ref.current.length, 4, "Highlight timer appended when the note is placed");
assert.deepEqual(delays([ref.current[3]]), [40]);
timeouts.get(ref.current[3]).fn();
assert.deepEqual(active, ["bass-C"]);
assert.equal(position, 0);
assert.equal(ref.current.length, 5, "Highlight clear timeout appended after the note is heard");
timeouts.get(ref.current[1]).fn();
assert.deepEqual(timing(soundCalls[1]), { at: 12.04, durationMs: 850 }, "Placed at its exact beat even when its timer fires early");
transport.clearPlaybackTimers(ref);
assert.equal(ref.current.length, 0);
assert.equal(cancelled.length, 6);
assert.equal(state, "stopped");

// The Note length in players setting scales each written duration.
const legatoRef = { current: [] };
const legatoCalls = soundCalls.length;
scheduling.scheduleAbcMappedPlayback({
  abcMappedEvents: [{ startBeat: 0, durationBeats: 2, buttons: [btn] }],
  startBeat: 0, abcTempoBpm: 60, abcTotalBeats: 2,
  abcPlaybackTimeoutsRef: legatoRef, abcPlaybackStartedAtRef: { current: 0 },
  soundOptions: { volume: .4, articulation: .5 }, setAbcPositionBeat: () => {},
  setAbcActiveButtonIds: () => {}, setAbcPlaybackState: () => {},
});
timeouts.get(legatoRef.current[0]).fn();
assert.equal(timing(soundCalls[legatoCalls]).durationMs, 1000, "50% of a 2-beat note at 60 BPM");
transport.clearPlaybackTimers(legatoRef);

const bassTimers = { current: [] }; const runRef = { current: 2 }; active = []; state = "stopped";
scheduling.scheduleBassPatternEvents({
  bassPatternEvents: [{ startBeat: 1, durationBeats: 1, gain: .5, buttons: [btn] }],
  bassPatternTempoBpm: 120, bassPatternTotalBeats: 4,
  bassPatternLoopMode: "fixed", bassPatternLoopCount: 2,
  bassPatternTimeoutsRef: bassTimers, bassPatternPlaybackRunRef: runRef, runId: 2,
  soundOptions: { volume: .4, articulation: .85 },
  setBassPatternActiveButtonIds: (next) => { active = typeof next === "function" ? next(active) : next; },
  setBassPatternPlaybackState: (next) => { state = next; },
});
assert.deepEqual(delays(bassTimers.current), [390, 2390, 4140]);
timeouts.get(bassTimers.current[0]).fn();
assert.deepEqual(soundCalls.at(-1).slice(0, 2), ["bass-C", .2]);
assert.deepEqual(timing(soundCalls.at(-1)), { at: 10.54, durationMs: 425 });
assert.equal(bassTimers.current.length, 4);
runRef.current += 1; // previously scheduled callbacks must never play after stop
const count = soundCalls.length;
timeouts.get(bassTimers.current[1]).fn();
assert.equal(soundCalls.length, count);
timeouts.get(bassTimers.current[3]).fn();
assert.deepEqual(active, [], "A stopped run never lights its buttons");

const loopTimers = { current: [] }; const loopRun = { current: 7 };
scheduling.scheduleBassPatternEvents({
  bassPatternEvents: [{ startBeat: 0, durationBeats: 1, gain: 1, buttons: [btn] }],
  bassPatternTempoBpm: 120, bassPatternTotalBeats: 4,
  bassPatternLoopMode: "infinite", bassPatternLoopCount: 1,
  bassPatternTimeoutsRef: loopTimers, bassPatternPlaybackRunRef: loopRun, runId: 7,
  soundOptions: { volume: 1, articulation: .85 },
  setBassPatternActiveButtonIds: () => {}, setBassPatternPlaybackState: () => {},
});
// The next 2 s cycle is prepared 300 ms (twice the look-ahead) before it starts.
assert.deepEqual(delays(loopTimers.current), [0, 1740]);
audioNow = 11.8;
timeouts.get(loopTimers.current[1]).fn();
assert.deepEqual(delays([loopTimers.current[2]]), [90], "Cycle 2 notes are placed against the audio clock, not timer drift");
// Compound meters: the tempo counts dotted beats of three meter units, so at
// 60 BPM in 6/8 each eighth-note unit lasts a third of a second.
const compoundTimers = { current: [] }; const compoundRun = { current: 9 };
const compoundCalls = soundCalls.length;
scheduling.scheduleBassPatternEvents({
  bassPatternEvents: [{ startBeat: 3, durationBeats: 3, gain: 1, buttons: [btn] }],
  bassPatternTempoBpm: 60, bassPatternUnitsPerBeat: 3, bassPatternTotalBeats: 6,
  bassPatternLoopMode: "once", bassPatternLoopCount: 1,
  bassPatternTimeoutsRef: compoundTimers, bassPatternPlaybackRunRef: compoundRun, runId: 9,
  soundOptions: { volume: 1, articulation: 1 },
  setBassPatternActiveButtonIds: () => {}, setBassPatternPlaybackState: () => {},
});
timeouts.get(compoundTimers.current[0]).fn();
assert.equal(timing(soundCalls[compoundCalls]).durationMs, 1000, "a dotted-quarter beat at 60 BPM lasts one second");
transport.clearPlaybackTimers(compoundTimers);
console.log("✓ Diagram/export, notation rendering, ABC and Bass Pattern scheduling contracts passed");
