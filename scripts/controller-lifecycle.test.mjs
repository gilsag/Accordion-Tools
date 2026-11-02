/** Phase 8 behavior tests: ordered transport/reset effects and live SVG capture.
 * Uses an in-memory TypeScript loader to avoid native Vite/esbuild requirements. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(path, mocked = {}) {
  const js = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const target = { exports: {} };
  runInNewContext(js, { module: target, exports: target.exports,
    require(name) { if (name in mocked) return mocked[name]; throw Error(`Unexpected ${name}`); },
  }, { filename: path });
  return target.exports;
}
const trace = [];
const events = (names) => Object.fromEntries(names.map(name => [name, () => trace.push(name)]));
const audio = load("src/audio/playbackLifecycle.ts");
let startedAtRef = { current: 1234 };
audio.stopAbcTransport({ ...events(["clearTimers", "stopSound"]),
  setState: (v) => trace.push(`state:${v}`), setPosition: v => trace.push(`beat:${v}`),
  setActiveButtons: v => trace.push(`buttons:${v.length}`), startedAtRef });
assert.deepEqual(trace, ["clearTimers", "state:stopped", "beat:0", "buttons:0", "stopSound"]);
assert.equal(startedAtRef.current, null);
trace.length = 0;
audio.pauseAbcTransport({ playbackState: "playing", startedAt: 1000, startingBeat: 2,
  tempoBpm: 120, totalBeats: 8, nowMs: () => 2500,
  setPosition: v => trace.push(`beat:${v}`), setState: v => trace.push(`state:${v}`),
  setActiveButtons: v => trace.push(`buttons:${v.length}`),
  ...events(["clearTimers", "stopBassPattern", "stopSound", "clearProgressionButtons"]) });
assert.deepEqual(trace, ["beat:5", "state:paused", "buttons:0", "clearTimers", "stopBassPattern", "stopSound", "clearProgressionButtons"]);
trace.length = 0;
audio.pauseAbcTransport({ playbackState: "stopped" });
assert.deepEqual(trace, [], "Paused/stopped ABC does not mutate transport state");
let runRef = { current: 6 };
audio.stopBassPatternTransport({runRef, ...events(["clearTimers", "stopSound"]),
  setState: v => trace.push(`state:${v}`), setActiveButtons: v => trace.push(`buttons:${v.length}`)});
assert.equal(runRef.current, 7);
assert.deepEqual(trace, ["clearTimers", "state:stopped", "buttons:0", "stopSound"]);

trace.length = 0;
const reset = load("src/app/resetCommands.ts", {
  "../tools/stradellaChordFinder/diagramAnnotations": { DEFAULT_STRADELLA_NOTE_LEVELS: {identity:true,pitchClasses:true,voicing:true,physical:true} },
});
const finderMethods = ["setRoot","setPattern","setMode","setRequestedBass","setRealizationIndex", "setMaxButtons", "setSpanColumns", "setMinimumNominalGap", "setMarkRootBass", "setShowRealizationNote", "setShowVoicingIntervals", "setNoteLevels", "setExplanationFontSize"];
const finderArgs = {};
for (const method of finderMethods) finderArgs[method] = value => trace.push([method, value]);
reset.resetStradellaFinder(finderArgs);
assert.deepEqual(trace.map(([method])=>method), finderMethods);
assert.equal(trace[0][1], "C"); assert.equal(trace[7][1], 0); assert.equal(trace[10][1], true);
trace.length = 0;
const workMethods = ["setOverlays", "setSequenceSteps", "setRecording", "setApplyingFingering", "setTextNotes", "setScaleFinderActive", "setChordFinderActive", "setStradellaChordFinderActive", "setProgressionPreview", "stopAbc", "stopBassPattern", "stopSound", "setProgressionActiveButtons"];
reset.resetDiagramWorkState(Object.fromEntries(workMethods.map(method => [method, () => trace.push(method)])));
assert.deepEqual(trace, workMethods, "Diagram reset preserves timer and audio cancellation order");

const batchTrace = [];
const capture = load("src/diagram/stradellaBatchCapture.ts", {
  "../download": { serializeSvg: (_svg, png) => `svg-${png}` },
});
let selected = 4;
const candidates = [{ index: 2, candidate: { playable: true } },{ index: 5, candidate: { playable: true } }];
const captureArgs = {
  candidates, originalIndex: 4,
  selectIndex: i => { selected = i; batchTrace.push(i); },
  currentSvg: () => ({ viewBox: { baseVal: {width: 500, height: 230} }, clientWidth: 900, clientHeight: 700 }),
  filenameKey: (_candidate, ordinal) => ordinal === 0 ? "C♯ Major" : "D♭/F",
  format: "png",
};
const snapshots = capture.captureStradellaBatch(captureArgs);
assert.deepEqual(batchTrace, [2,5,4], "All candidates captured synchronously before original selection restored");
assert.equal(selected,4);
assert.deepEqual(Array.from(snapshots, x => x.name), ["001-Csharp-Major", "002-Dflat-F"]);
assert.deepEqual(Array.from(snapshots, x => x.svg), ["svg-true", "svg-true"]);
assert.equal(snapshots[0].width,500);
const failed = { ...captureArgs, currentSvg: () => null };
batchTrace.length=0;
assert.throws(() => capture.captureStradellaBatch(failed), /Diagram SVG is unavailable/);
assert.deepEqual(batchTrace, [2,4], "Restore original realization even on capture failure");
const ui = load("src/app/workspacePresentation.ts");
const core = { side:"stradella", bassPatternPlaybackState:"stopped", abcPlaybackState:"stopped",
  activeToolSection:null, scaleFinderActive:false, stradellaChordFinderActive:false,
  chordFinderActive:false, isRecordingSequence:false, isApplyingFingering:false,
  selectionOnClick:false, t: key => key };
assert.equal(ui.activeToolStatusLabel(core), "ui.noActiveTool");
assert.equal(ui.activeToolStatusLabel({ ...core, scaleFinderActive:true, abcPlaybackState:"paused" }), "ui.abcDefault");
assert.equal(ui.activeToolStatusLabel({ ...core, bassPatternPlaybackState:"playing", abcPlaybackState:"playing" }), "ui.bassPatternPlayer", "Bass playback historically takes label precedence on Stradella");
assert.equal(ui.activeToolStatusLabel({ ...core, side:"treble", bassPatternPlaybackState:"playing", chordFinderActive:true }), "tools.chordFinder");
assert.equal(ui.workspaceGridColumns("compact", "hidden"), "minmax(0, 1fr)");
assert.equal(ui.workspaceGridColumns("compact", "tools"), "clamp(230px, 15vw, 270px) minmax(0, 1fr)");
console.log("✓ Phase 8 transport, reset, capture and workspace presentation contracts passed");
