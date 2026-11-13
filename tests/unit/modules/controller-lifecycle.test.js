/** Behavior tests: ordered transport/reset effects and live SVG capture.
 * Each module is loaded on its own with test doubles for its imports. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

const load = (path, mocked = {}) => loadIsolated(path, { imports: mocked });
const trace = [];
const events = (names) => Object.fromEntries(names.map(name => [name, () => trace.push(name)]));
const audio = load("src/audio/playbackLifecycle.ts");
let startedAtRef = { current: 1234 };

test("ABC stop and pause run their effects in order", () => {
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
});

test("Pause keeps the last played buttons of each voice lit", () => {
  let kept = null;
  audio.pauseAbcTransport({ playbackState: "playing", startedAt: 1000, startingBeat: 2,
    tempoBpm: 120, totalBeats: 8, nowMs: () => 2500, setPosition() {}, setState() {},
    setActiveButtons: v => { kept = v; }, clearTimers() {}, stopBassPattern() {}, stopSound() {},
    clearProgressionButtons() {}, buttonsAtPosition: beat => [`at-${beat}`] });
  assert.deepEqual(kept, ["at-5"]);
  const twoHands = [
    { startBeat: 0, voiceId: "1", buttons: [{ id: "t-C" }] },
    { startBeat: 0, voiceId: "2", buttons: [{ id: "b-C" }] },
    { startBeat: 1, voiceId: "2", buttons: [{ id: "c-CM" }, { id: "c-CM" }] },
    { startBeat: 1.5, voiceId: "1", buttons: [] },
    { startBeat: 2, voiceId: "1", buttons: [{ id: "t-E" }] },
    { startBeat: 3, voiceId: "2", buttons: [{ id: "b-G" }] },
  ];
  assert.deepEqual([...audio.lastPlayedAbcButtonIds(twoHands, 2.4)], ["c-CM", "t-E"], "last note of each hand; rests skipped");
  assert.deepEqual([...audio.lastPlayedAbcButtonIds(twoHands, 0)], ["t-C", "b-C"]);
  assert.deepEqual([...audio.lastPlayedAbcButtonIds([{ startBeat: 0, buttons: [{ id: "x" }] }], 0.5)], ["x"], "single voice without voice id");
  let runRef = { current: 6 };
  audio.stopBassPatternTransport({runRef, ...events(["clearTimers", "stopSound"]),
    setState: v => trace.push(`state:${v}`), setActiveButtons: v => trace.push(`buttons:${v.length}`)});
  assert.equal(runRef.current, 7);
  assert.deepEqual(trace, ["clearTimers", "state:stopped", "buttons:0", "stopSound"]);
  trace.length = 0;
  const reset = load("src/app/resetCommands.ts", {
    "../tools/stradellaChordFinder/diagramAnnotations": { DEFAULT_STRADELLA_NOTE_LEVELS: {identity:true,pitchClasses:true,voicing:true,physical:true} },
    "../tools/stradellaChordFinder/harmonicIdentity": { ROOT_POSITION_BASS: "root" },
  });
  const finderMethods = ["setRoot","setPattern","setMode","setRequestedBass","setRealizationIndex", "setMaxButtons", "setSpanColumns", "setMinimumNominalGap", "setMarkRootBass", "setShowRealizationNote", "setShowVoicingIntervals", "setNoteLevels", "setExplanationFontSize"];
  const finderArgs = {};
  for (const method of finderMethods) finderArgs[method] = value => trace.push([method, value]);
  reset.resetStradellaFinder(finderArgs);
  assert.deepEqual(trace.map(([method])=>method), finderMethods);
  assert.equal(trace[0][1], "C");
   assert.equal(trace[7][1], 0);
   assert.equal(trace[10][1], true);
  assert.equal(trace[3][1], "root", "Restoring Finder defaults returns to root position");
  trace.length = 0;
  const workMethods = ["setOverlays", "setSequenceSteps", "setTextNotes", "setScaleFinderActive", "setChordFinderActive", "setStradellaChordFinderActive", "setProgressionPreview", "stopAbc", "stopBassPattern", "stopSound", "setProgressionActiveButtons"];
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
  const ui = load("src/app/workspacePresentation.ts", { "./toolRegistry": load("src/app/toolRegistry.ts") });
  const core = { side:"stradella", bassPatternPlaybackState:"stopped", abcPlaybackState:"stopped",
    activeToolSection:null, scaleFinderActive:false, stradellaChordFinderActive:false,
    chordFinderActive:false, t: key => key };
  assert.equal(ui.activeToolStatusLabel(core), "ui.noActiveTool");
  assert.equal(ui.activeToolStatusLabel({ ...core, scaleFinderActive:true, abcPlaybackState:"paused" }), "ui.abcDefault");
  assert.equal(ui.activeToolStatusLabel({ ...core, bassPatternPlaybackState:"playing", abcPlaybackState:"playing" }), "ui.bassPatternPlayer", "Bass playback historically takes label precedence on Stradella");
  assert.equal(ui.activeToolStatusLabel({ ...core, side:"treble", bassPatternPlaybackState:"playing", chordFinderActive:true }), "tools.chordFinder");
  // An open tool is the active tool even when nothing is playing.
  assert.equal(ui.activeToolStatusLabel({ ...core, activeToolSection:"abcPlayer" }), "ui.abcDefault");
  assert.equal(ui.activeToolStatusLabel({ ...core, activeToolSection:"rhythmTrainer" }), "rhythm.title");
  assert.equal(ui.activeToolStatusLabel({ ...core, activeToolSection:"bassPatternPlayer" }), "ui.bassPatternPlayer");
  assert.equal(ui.activeToolStatusLabel({ ...core, side:"treble", activeToolSection:"bassPatternPlayer" }), "ui.noActiveTool",
    "a Stradella-only tool left open is not reported on the treble side");
  assert.equal(ui.activeToolStatusLabel({ ...core, activeToolSection:"abcPlayer", scaleFinderActive:true }), "ui.scaleFinder");
  assert.equal(ui.workspaceGridColumns("compact", "hidden"), "minmax(0, 1fr)");
  assert.equal(ui.workspaceGridColumns("compact", "tools"), "clamp(230px, 15vw, 270px) minmax(0, 1fr)");
  // Panel widths: limits, room for the diagram, stored values and grid tracks.
  const panels = load("src/app/panelWidths.ts", { react: { useCallback: (fn) => fn, useState: (init) => [init, () => {}] } });
  assert.equal(panels.clampPanelWidth("left", 100, 1600, 0), 220, "left panel minimum");
  assert.equal(panels.clampPanelWidth("left", 900, 1600, 0), 560, "left panel maximum");
  assert.equal(panels.clampPanelWidth("left", 500, 1200, 360), 360, "the diagram keeps 480 px");
  assert.equal(panels.clampPanelWidth("inspector", 412.6, 1800, 300), 413);
  assert.deepEqual({ ...panels.parseStoredPanelWidths('{"left":9999,"inspector":"x"}') }, { left: 560, inspector: null });
  assert.deepEqual({ ...panels.parseStoredPanelWidths("not json") }, { left: null, inspector: null });
  assert.equal(panels.panelTrack(null, "minmax(300px, 360px)"), "minmax(300px, 360px)");
  assert.equal(panels.panelTrack(420, ""), "min(420px, 40vw)");
  assert.equal(ui.workspaceGridColumns("compact", "tools", "min(420px, 40vw)"), "min(420px, 40vw) minmax(0, 1fr)");
});
