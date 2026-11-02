/** Phase 3c: behavioral boundary tests for the extracted ABC state/selector.
 * Musical parsing and timing accuracy are covered separately by test:abc.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const path = "src/features/abcPlayer/useAbcPlayer.ts";
const source = readFileSync(path, "utf8");
const app = readFileSync("src/App.tsx", "utf8");
assert.match(app, /useAbcPlayerState\(\)/);
assert.match(app, /useAbcPlayerResults\(\{/);
assert.doesNotMatch(app, /const \[abcText,\s*setAbcText\] = useState/);
assert.doesNotMatch(app, /const abcParseResult = useMemo/);
assert.match(app, /function scheduleAbcPlayback\(/, "Playback orchestration remains in App for now");
assert.match(app, /renderNotationInto\(abcNotationRef\.current, abcText\)/);
const scheduling = readFileSync("src/audio/playbackScheduling.ts", "utf8");
assert.match(app, /scheduleAbcMappedPlayback\(\{abcMappedEvents/);
assert.match(scheduling, /playButtonSound\(button, soundOptions\)/);
assert.match(scheduling, /abcMappedEvents\.filter\(/);

let index = 0;
const slots = [];
const effects = [];
const stateCalls = [];
const mockReact = {
  useState(initial) {
    const slot = index++;
    if (!slots[slot]) {
      const value = typeof initial === "function" ? initial() : initial;
      slots[slot] = { value, set(next) {
        slots[slot].value = typeof next === "function" ? next(slots[slot].value) : next;
        stateCalls.push([slot, slots[slot].value]);
      } };
    }
    return [slots[slot].value, slots[slot].set];
  },
  useRef(value) {
    const slot = index++;
    if (!slots[slot]) slots[slot] = { current: value };
    return slots[slot];
  },
  useEffect(fn) { effects.push(fn); },
  useMemo(fn) { return fn(); },
};
const calls = [];
const scoreEvents = [{ startBeat: 0, durationBeats: 2, voiceId: "1" }, { startBeat: 2, durationBeats: 1, voiceId: "2" }];
const score = { events: scoreEvents, tempoBpm: 92, keyTonicPitchClass: 2, title: "Example", errors: [], key: "D", voiceIds: ["1", "2"] };
const mapped = [{ buttons: [{ id: "bass-D" }, { id: "chord-A" }], startBeat: 0, durationBeats: 2 }];
const tools = {
  parseAbc(value) { calls.push(["parse", value]); return score; },
  abcEventsForStradellaSide(events) { calls.push(["stradellaEvents", events]); return events; },
  abcEventsForTrebleSide(events) { calls.push(["trebleEvents", events]); return events; },
  mapAbcEventsToStradellaButtons(...args) { calls.push(["stradellaMap", args]); return mapped; },
  mapAbcEventsToTrebleButtons(...args) { calls.push(["trebleMap", args]); return mapped; },
  totalAbcBeats(events) { calls.push(["totalBeats", events]); return events.length ? 3 : 0; },
  abcMissingNotes(events) { calls.push(["missing", events]); return ["F#", "C#"]; },
};
const downloaded = "X:1\nT:Example\nK:D\nD2 A2|";
const fetchCalls = [];
const context = {
  module: { exports: {} },
  fetch: async (url, options) => {
    fetchCalls.push([url, options]);
    if (url.endsWith("examples.json")) return {
      ok: true,
      json: async () => [
        { value: "example", label: "Valid example", file: "abc/example.abc" },
        { value: "bad", label: 42, file: "abc/bad.abc" },
      ],
    };
    if (url.endsWith("example.abc")) return { ok: true, text: async () => downloaded };
    return { ok: false };
  },
};
context.exports = context.module.exports;
context.require = (name) => {
  if (name === "react") return mockReact;
  if (name === "../../tools/abcPlayerTools") return tools;
  throw new Error(`Unexpected dependency: ${name}`);
};
// Vite injects import.meta.env.BASE_URL. Supply the equivalent root URL
// only inside this isolated CommonJS hook test, not in production sources.
assert.equal((source.match(/import\.meta\.env\.BASE_URL/g) ?? []).length, 2);
const compiled = ts.transpileModule(source.replaceAll("import.meta.env.BASE_URL", '"/"'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
runInNewContext(compiled, context, { filename: path });
const { useAbcPlayerState, useAbcPlayerResults } = context.module.exports;
function stateRender() { index = 0; return useAbcPlayerState(); }
let state = stateRender();
for (const [key, expected] of Object.entries({
  abcText: "", abcEditorExpanded: false, abcFileName: "", abcExampleValue: "",
  abcTempoBpm: 80, abcPositionBeat: 0, abcPlaybackState: "stopped",
  abcStradellaMode: "bass-notes-and-chord-symbols", abcTrebleChordSymbolsMode: "ignore",
  abcRenderedNotationVisible: false,
})) assert.equal(state[key], expected, `Original ABC default ${key}`);
assert.equal(state.abcExampleOptions.length, 1, "Original example placeholder kept");
assert.equal(state.abcExampleOptions[0].value, "");
assert.equal(state.abcActiveButtonIds.length, 0);
assert.ok(state.abcNotationRef && state.abcNotationRef.current === null);
for (const key of [
  "setAbcText", "setAbcEditorExpanded", "setAbcFileName", "setAbcExampleValue",
  "setAbcTempoBpm", "setAbcPositionBeat", "setAbcPlaybackState", "setAbcActiveButtonIds",
  "setAbcStradellaMode", "setAbcTrebleChordSymbolsMode", "setAbcRenderedNotationVisible", "loadAbcExample",
]) assert.equal(typeof state[key], "function", `Controller interface ${key}`);

assert.equal(effects.length, 1, "Manifest effect retained");
effects.shift()();
await new Promise((resolve) => setImmediate(resolve));
state = stateRender();
assert.equal(state.abcExampleOptions.length, 2, "Invalid manifest entries still skipped");
assert.equal(state.abcExampleOptions[1].value, "example");
assert.equal(fetchCalls[0][0], "/abc/examples.json");
assert.equal(fetchCalls[0][1].cache, "no-store");
const previousSetText = state.setAbcText;
await state.loadAbcExample("example");
state = stateRender();
assert.equal(previousSetText, state.setAbcText, "Stable setter survives rerender");
assert.equal(state.abcText, downloaded);
assert.equal(state.abcFileName, "Valid example");
assert.equal(state.abcExampleValue, "example");
assert.equal(state.abcPositionBeat, 0);
assert.equal(state.abcPlaybackState, "stopped");
assert.equal(fetchCalls[1][0], "/abc/example.abc");
await state.loadAbcExample("");
assert.equal(stateRender().abcExampleValue, "", "Empty option does not load a file");

function results(input) {
  effects.length = 0; calls.length = 0;
  return useAbcPlayerResults({
    abcText: downloaded, abcPlaybackState: "stopped", setAbcTempoBpm: (value) => calls.push(["tempo", value]),
    abcActiveButtonIds: ["bass-D", "chord-A"],
    abcStradellaMode: "bass-notes-and-chord-symbols", abcTrebleChordSymbolsMode: "ignore",
    side: "stradella", isTrebleLikeSide: false, buttons: [{ id: "bass-D" }], ...input,
  });
}
const initial = results();
assert.equal(initial.abcParseResult, score);
assert.equal(initial.abcPlayableEvents, scoreEvents);
assert.equal(initial.abcMappedEvents, mapped, "Exact mapped event objects retained");
assert.equal(initial.abcTotalBeats, 3);
assert.equal(initial.abcMissingPitchText, "F#, C#");
assert.deepEqual([...initial.abcActiveButtonIdSet], ["bass-D", "chord-A"]);
assert.equal(calls.filter(([name]) => name === "stradellaMap").length, 1);
assert.equal(calls.find(([name]) => name === "stradellaMap")[1][3], "bass-notes-and-chord-symbols");
assert.equal(effects.length, 1);
effects[0]();
assert.deepEqual(calls.at(-1), ["tempo", 92], "Score tempo sync while stopped");

results({ abcPlaybackState: "playing" });
effects[0]();
assert.equal(calls.some(([name]) => name === "tempo"), false, "Tempo never replaced mid-playback");
results({ side: "treble", isTrebleLikeSide: true, abcTrebleChordSymbolsMode: "play" });
assert.equal(calls.filter(([name]) => name === "trebleMap").length, 1);
assert.equal(calls.find(([name]) => name === "trebleMap")[1][2], true);
results({ side: "treble", isTrebleLikeSide: true, abcTrebleChordSymbolsMode: "ignore" });
assert.equal(calls.find(([name]) => name === "trebleMap")[1][2], false);
results({ side: "treble", isTrebleLikeSide: false });
assert.equal(calls.some(([name]) => name.endsWith("Map")), false, "Unknown manual is nonplayable");
const empty = results({ abcText: "   " });
assert.equal(empty.abcMappedEvents.length, 0);
assert.equal(empty.abcPlayableEvents.length, 0);
assert.equal(empty.abcTotalBeats, 0, "Empty playable event list remains zero beats");
console.log("✓ ABC feature state, manifest, settings setters, mapping and tempo contracts passed");
