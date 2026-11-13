/** Transport start ordering and frozen diagram geometry outputs. No native bundler or browser required. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

const loadTs = (path, mocks = {}) => loadIsolated(path, { imports: mocks });
const { startAbcTransport, startBassPatternTransport } = loadTs("src/audio/playbackStart.ts");
const calls = [];
const mark = name => () => calls.push(name);

test("Playback-start ordering and reference SVG geometry snapshots", () => {
  const setFalse = name => value => { assert.equal(value, false); calls.push(name); };
  const setPlay = value => { assert.equal(value, "playing"); calls.push("playing"); };
  const abcStartedAt = { current: null };
  const abcStartingBeat = { current: 0 };
  const abcPorts = {
    eventCount: 3, startBeat: 2.5,
    clearTimers: mark("clearTimers"), stopBassPattern: mark("stopBass"),
    stopSound: mark("stopSound"), clearProgressionButtons: mark("clearProgression"),
    setScaleFinderActive: setFalse("disableScale"),
    setChordFinderActive: setFalse("disableChord"),
    setStradellaFinderActive: setFalse("disableStradella"),
    setPlaybackState: setPlay,
    setPosition: beat => calls.push(`beat:${beat}`),
    startedAtRef: abcStartedAt, startBeatRef: abcStartingBeat,
    nowMs: () => { calls.push("clock"); return 5000; },
    schedule: mark("schedule"),
  };
  assert.equal(startAbcTransport({...abcPorts, eventCount: 0}), false);
  assert.deepEqual(calls, [], "Empty ABC must not cancel existing playback");
  assert.equal(startAbcTransport(abcPorts), true);
  assert.deepEqual(calls, ["clearTimers", "stopBass", "stopSound", "clearProgression",
    "disableScale", "disableChord", "disableStradella", "playing", "beat:2.5", "clock", "schedule"]);
  assert.equal(abcStartedAt.current, 5000);
  assert.equal(abcStartingBeat.current, 2.5);
  calls.length = 0;
  const runRef = { current: 7 };
  const bassPorts = {
    eventCount: 2, runRef,
    clearTimers: mark("clearTimers"), stopAbc: mark("stopAbc"),
    clearActiveButtons: mark("clearButtons"), stopSound: mark("stopSound"),
    setScaleFinderActive: setFalse("disableScale"),
    setChordFinderActive: setFalse("disableChord"),
    setStradellaFinderActive: setFalse("disableStradella"),
    setPlaybackState: setPlay,
    schedule: runId => calls.push(`schedule:${runId}`),
  };
  assert.equal(startBassPatternTransport({...bassPorts, eventCount: 0}), false);
  assert.equal(runRef.current, 7);
  assert.deepEqual(calls, []);
  assert.equal(startBassPatternTransport(bassPorts), true);
  assert.equal(runRef.current, 8);
  assert.deepEqual(calls, ["clearTimers", "stopAbc", "clearButtons", "stopSound",
    "disableScale", "disableChord", "disableStradella", "playing", "schedule:8"]);
  const { calculateDiagramGeometry } = loadTs("src/diagram/diagramGeometry.ts", {
    "../pianoTreble": { pianoTrebleWhiteKeyCount: range => ({
      "two-octave": 15, "three-octave": 22, "four-octave": 29,
    })[range] },

  });
  const fixtures = JSON.parse(readFileSync("tests/fixtures/diagram-geometry-reference.json", "utf8"));
  for (const fixture of fixtures) {
    const actual = calculateDiagramGeometry({
      ...fixture.input,
      annotationLevelForLine: line => line.startsWith("Registral voicing:") ? "voicing"
        : line.startsWith("Identity:") ? "identity" : null,
    });
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), fixture.expected,
      `Geometry must preserve reference SVG sizing: ${fixture.name}`);
  }
});
