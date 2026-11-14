/** Bass Pattern and Sequence behavioral contracts at their hooks, rendered
 * with React; the pattern engine is replaced so the tests see what the hook
 * passes it. Real notation, engine and sound algorithms have their own tests.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, test, vi } from "vitest";
import {
  useBassPatternResults,
  useBassPatternState,
} from "../../../src/features/bassPatternPlayer/useBassPatternPlayer";
import {
  useSequenceResults,
  useSequenceState,
} from "../../../src/features/annotateDiagram/useSequenceState";

const fixtures = vi.hoisted(() => {
  const calls = [];
  const engine = {
    validateBassPatternLibrary(library) {
      calls.push(["validate", library]);
      return library.patterns.some((p) => !p.id) ? ["missing id"] : [];
    },
    makeBassPatternEvents(...args) {
      calls.push(["events", args]);
      return [{ buttons: [args[0][0]], startBeat: 0, durationBeats: 1 }];
    },
    totalBassPatternBeats(events) {
      calls.push(["beats", events]);
      return events.length ? 8 : 0;
    },
    bassPatternMissingItems(events) {
      calls.push(["missing", events]);
      return ["D♭"];
    },
  };
  return { calls, engine };
});
const { calls } = fixtures;
vi.mock("../../../src/features/bassPatternPlayer/bassPatternPlayerTools", async (original) => ({
  ...(await original()),
  ...fixtures.engine,
}));
vi.mock("../../../src/diagram/sequenceTools", async (original) => ({
  ...(await original()),
  getSequenceStepsWithButtons(steps, buttons) {
    return steps
      .map((s) => ({ ...s, button: buttons.find((b) => b.id === s.id) }))
      .filter((s) => s.button);
  },
}));

const validPattern = {
  id: "custom-x",
  name: "New",
  meter: "4/4",
  tags: ["custom"],
  pattern: ">B C A C",
};
const patterns = {
  version: 2,
  legend: "Built-in legend",
  patterns: [{ id: "polka", name: "Polka", meter: "4/4", pattern: ">B C" }],
};
const progressions = [{ id: "i-iv-v-i", name: "I-IV-V-I", chords: ["C", "F", "G", "C"] }];
const fetches = [];
const fetchStub = async (url) => {
  fetches.push(url);
  return { ok: true, json: async () => (url.includes("bass-patterns/") ? patterns : progressions) };
};
const writes = [];
afterEach(() => vi.unstubAllGlobals());
const t = (key, params) => key + (params ? `:${Object.values(params).join(",")}` : "");
const base = import.meta.env.BASE_URL;

test("Bass Pattern library/editor/persistence/results and Sequence recording/identity contracts", async () => {
  localStorage.clear();
  vi.stubGlobal("fetch", fetchStub);
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
    writes.push([key, value]);
    return setItem.call(this, key, value);
  });
  const bassHook = renderHook(() => useBassPatternState(t));
  let state = bassHook.result.current;
  for (const [key, value] of Object.entries({
    bassPatternId: "polka",
    chordProgressionId: "i-iv-v-i",
    bassPatternRoot: "C",
    bassPatternTempoBpm: 80,
    bassPatternChordVoicing: "simple",
    bassPatternBarsPerChord: 2,
    bassPatternLoopMode: "fixed",
    bassPatternLoopCount: 2,
    bassPatternExportFormat: "abc",
    bassPatternEditorExpanded: false,
    bassPatternRenderedNotationVisible: false,
    bassPatternPlaybackState: "stopped",
  }))
    assert.equal(state[key], value, key);
  assert.equal(state.bassPatternDefinitions.length, 0);
  assert.equal(state.bassPatternEditorMessage, "");
  assert.equal(state.bassPatternActiveButtonIds.length, 0);
  assert.equal(state.bassPatternNotationRef.current, null);
  const setter = state.setBassPatternTempoBpm;
  // The libraries are fetched once the hook has rendered.
  await waitFor(() => assert.equal(bassHook.result.current.bassPatternDefinitions.length, 1));
  state = bassHook.result.current;
  assert.strictEqual(state.setBassPatternTempoBpm, setter, "React setter preserved");
  assert.equal(
    state.bassPatternDefinitions[0].legend,
    "Built-in legend",
    "Library legend inheritance",
  );
  assert.equal(state.chordProgressionDefinitions[0].id, "i-iv-v-i");
  assert.deepEqual(fetches, [
    `${base}bass-patterns/bass-patterns.json`,
    `${base}chord-progressions/chord-progressions.json`,
  ]);
  act(() => state.setBassPatternEditorText(JSON.stringify(validPattern)));
  state = bassHook.result.current;
  assert.equal(state.bassPatternEditorErrors.length, 0);
  act(() => state.saveCustomBassPattern());
  state = bassHook.result.current;
  assert.equal(state.bassPatternId, "custom-x");
  assert.equal(state.customBassPatternDefinitions.length, 1);
  assert.equal(state.bassPatternEditorMessage, "ui.savedCustomPattern:New");
  assert.equal(writes.at(-1)[0], "accordionTools.customBassPatterns.v2");
  assert.equal(JSON.parse(writes.at(-1)[1])[0].id, "custom-x");
  act(() => state.loadSelectedPatternIntoEditor());
  state = bassHook.result.current;
  assert.equal(JSON.parse(state.bassPatternEditorText).id, "custom-x");
  act(() => state.removeSelectedCustomBassPattern());
  state = bassHook.result.current;
  assert.equal(state.customBassPatternDefinitions.length, 0);
  assert.equal(state.bassPatternId, "polka", "Deletion returns to first built-in pattern");
  assert.equal(state.bassPatternEditorMessage, "ui.removedCustomPattern");
  act(() => state.setBassPatternEditorText("not JSON"));
  state = bassHook.result.current;
  assert.equal(state.bassPatternEditorErrors.length, 1, "JSON validation retained");
  act(() => state.saveCustomBassPattern());
  state = bassHook.result.current;
  assert.ok(
    state.bassPatternEditorMessage.includes("JSON") ||
      state.bassPatternEditorMessage.includes("token"),
    "Original syntax error shown to user",
  );
  const physical = [
    { id: "bass-1", kind: "bass-root" },
    { id: "chord-1", kind: "chord-major" },
  ];
  const input = {
    bassPatternDefinitions: state.bassPatternDefinitions,
    bassPatternId: state.bassPatternId,
    chordProgressionDefinitions: state.chordProgressionDefinitions,
    chordProgressionId: state.chordProgressionId,
    buttons: physical,
    side: "stradella",
    bassPatternRoot: "C",
    bassPatternChordVoicing: "simple",
    bassPatternBarsPerChord: 2,
    bassPatternActiveButtonIds: ["bass-1"],
  };
  const results = (args) => renderHook(() => useBassPatternResults(args)).result.current;
  let result = results(input);
  assert.strictEqual(result.selectedBassPattern, state.bassPatternDefinitions[0]);
  assert.equal(
    result.bassPatternEvents[0].buttons[0],
    physical[0],
    "Physical button identities preserved",
  );
  assert.equal(result.bassPatternTotalBeats, 8);
  assert.equal(result.bassPatternMissingText, "D♭");
  assert.ok(result.bassPatternActiveButtonIdSet.has("bass-1"));
  assert.equal(calls.find(([type]) => type === "events")[1][4], "simple");
  result = results({ ...input, side: "treble" });
  assert.equal(
    result.bassPatternEvents.length,
    0,
    "Treble cannot generate Stradella accompaniment",
  );
  // Existing custom definitions are loaded before asynchronous public patterns.
  localStorage.setItem("accordionTools.customBassPatterns.v2", JSON.stringify([validPattern]));
  assert.equal(
    renderHook(() => useBassPatternState(t)).result.current.customBassPatternDefinitions[0].id,
    "custom-x",
  );
  const seqHook = renderHook(() => useSequenceState());
  let seq = seqHook.result.current;
  for (const [key, value] of Object.entries({
    sequenceDisplayMode: "numbers-and-curved-arrows",
    sequenceColorPreset: "red",
    sequenceThickness: 3.2,
    sequenceArrowheadSize: 4,
    sequenceNumberFontSize: 10,
    sequenceNumberColorPreset: "red",
    sequenceNumberPosition: "above",
    sequenceRenderedNotationVisible: false,
  }))
    assert.equal(seq[key], value, key);
  act(() => {
    seq.appendRecordedButton("bass-1");
    seq.appendRecordedButton("chord-1");
    seq.appendRecordedButton("bass-1");
  });
  seq = seqHook.result.current;
  assert.equal(
    JSON.stringify(seq.sequenceSteps),
    JSON.stringify([
      { id: "bass-1", step: 1 },
      { id: "chord-1", step: 2 },
      { id: "bass-1", step: 3 },
    ]),
  );
  const selected = renderHook(() => useSequenceResults(seq.sequenceSteps, physical)).result.current;
  assert.strictEqual(selected[0].button, physical[0]);
  assert.strictEqual(selected[1].button, physical[1]);
  assert.strictEqual(selected[2].button, physical[0]);
  act(() => seq.clearSequence());
  assert.equal(seqHook.result.current.sequenceSteps.length, 0);
});
