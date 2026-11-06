/** Stradella Finder ownership and forwarding contracts. Heavy chord-search correctness
 * remains covered by the unchanged Stradella musical regression suite.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const path = "src/features/stradellaChordFinder/useStradellaChordFinder.ts";
const source = readFileSync(path, "utf8");
// Capture lives in the diagram module; the controller still selects synchronously.

const effects = [];
const calls = [];
const selected = [{ id: "bass-C" }, { id: "chord-G" }];
const visualGuide = { id: "visual-root-only" };
const alt = [{ id: "counterbass-E" }, { id: "chord-G" }];
const candidates = [
  { playable: true, buttons: [visualGuide, ...selected], playbackButtons: selected,
    rootBassButtonIds: ["visual-root-only"], primaryButtonIds: ["bass-C", "chord-G"] },
  { playable: true, buttons: alt, playbackButtons: alt,
    rootBassButtonIds: [], primaryButtonIds: ["counterbass-E", "chord-G"] },
];
const fallback = { playable: false, buttons: [], playbackButtons: [],
  rootBassButtonIds: [], primaryButtonIds: [] };
const mockReact = {
  useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
  useMemo: (factory) => factory(),
  useEffect: (fn) => effects.push(fn),
};
let noResultForBass = null; // when set, searches requesting this bass find nothing
const engines = {
  getStradellaChordFinderResults: (...args) => {
    calls.push(["many", args]);
    return noResultForBass !== null && args[7] === noResultForBass ? [fallback] : candidates;
  },
  getStradellaChordFinderResult: (...args) => {
    calls.push(["single", args]);
    return fallback;
  },
};
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
runInNewContext(compiled, {
  module, exports: module.exports,
  require(name) {
    if (name === "react") return mockReact;
    if (name === "../../tools/stradellaChordFinderTools") return engines;
    if (name === "../../tools/stradellaChordFinder/harmonicIdentity")
      return { ROOT_POSITION_BASS: "root", resolveRequestedBass: (root, choice) => choice === "root" ? root : choice };
    if (name === "../../tools/stradellaChordFinder/diagramAnnotations")
      return { DEFAULT_STRADELLA_NOTE_LEVELS: { essentials: true, harmonic: true, registral: true, voicing: true } };
    throw new Error(`Unexpected runtime dependency ${name}`);
  },
}, { filename: path });
const { useStradellaChordFinderState, useStradellaChordFinderResults } = module.exports;
const state = useStradellaChordFinderState();
for (const [key, expected] of Object.entries({
  stradellaChordFinderActive: false, stradellaChordFinderRoot: "C",
  stradellaChordFinderPattern: "major-triad", stradellaChordFinderMode: "bass-and-chords",
  // Requested bass defaults to root position, resolved to the current root.
  stradellaChordFinderRealizationIndex: 0, stradellaChordFinderRequestedBass: "C", stradellaChordFinderRootPreferred: true,
  finderMaxButtons: 3, finderSpanColumns: 4.3, stradellaMinimumNominalGap: 0,
  showFinderRealizationNote: true, finderExplanationFontSize: 26,
  pendingProgressionRealizationKey: null, stradellaChordFinderMarkRootBass: true,
})) assert.equal(state[key], expected, `Original default: ${key}`);
for (const key of [
  "setStradellaChordFinderActive", "setStradellaChordFinderRoot",
  "setStradellaChordFinderPattern", "setStradellaChordFinderMode",
  "setStradellaChordFinderRealizationIndex", "setStradellaChordFinderRequestedBass",
  "setFinderMaxButtons", "setFinderSpanColumns", "setStradellaMinimumNominalGap",
  "setShowFinderRealizationNote", "setStradellaNoteLevels",
  "setFinderExplanationFontSize", "setPendingProgressionRealizationKey",
  "setStradellaChordFinderMarkRootBass",
]) assert.equal(typeof state[key], "function", `Settings/UI setter still exposed: ${key}`);
assert.equal(typeof state.stradellaNoteLevels, "object", "Notes-level visibility remains a structured setting");

const registerModel = { bass: { octave: 2, grouping: "C-B" }, chord: { octave: 3, grouping: "C-B" } };
const buttons = [{ id: "physical1" }, { id: "physical2" }];
const updates = [];
const selection = {
  buttons, side: "stradella", stradellaRegisterModel: registerModel,
  stradellaChordFinderActive: true, stradellaChordFinderRoot: "E",
  stradellaChordFinderPattern: "minor7", stradellaChordFinderMode: "bass-and-chords",
  stradellaChordFinderRealizationIndex: 1, stradellaChordFinderRequestedBass: "G",
  finderMaxButtons: 4, finderSpanColumns: 5.5, stradellaMinimumNominalGap: 2,
  stradellaChordFinderMarkRootBass: false,
  pendingProgressionRealizationKey: "chord-G|counterbass-E",
  setPendingProgressionRealizationKey: (value) => updates.push(["pending", value]),
  setStradellaChordFinderRealizationIndex: (value) => updates.push(["index", value]),
};
let result = useStradellaChordFinderResults(selection);
assert.deepEqual(calls.at(-1), ["many", [
  buttons, "E", "minor7", "bass-and-chords", false, 4, 5.5, "G", registerModel, 2,
]], "Original finder parameters, order and exact instrument object forwarded");
assert.strictEqual(result.stradellaChordFinderRealizations, candidates);
assert.strictEqual(result.stradellaChordFinderResult, candidates[1]);
assert.strictEqual(result.stradellaChordFinderButtons, alt);
assert.strictEqual(result.stradellaChordFinderPlaybackButtons, alt);
assert.deepEqual([...result.stradellaPrimaryFinderButtonIds], ["counterbass-E", "chord-G"]);
assert.equal(effects.length, 2, "Both existing synchronization effects are retained");
effects.forEach((fn) => fn());
assert.deepEqual(updates, [["index", 0], ["index", 1], ["pending", null]],
  "Reset ordering and exact progression button-ID matching remain unchanged");

calls.length = 0; effects.length = 0;
result = useStradellaChordFinderResults({ ...selection,
  stradellaChordFinderRealizationIndex: 99, pendingProgressionRealizationKey: null });
assert.strictEqual(result.stradellaChordFinderResult, candidates[1], "Out-of-range selection is clamped");
assert.strictEqual(result.stradellaChordFinderPlaybackButtons, alt, "Actual playback recipe preserved");
assert.strictEqual(result.stradellaChordFinderButtons, alt,
  "Candidates without a visual guide may share the same button array");

calls.length = 0; effects.length = 0;
result = useStradellaChordFinderResults({ ...selection, stradellaChordFinderRealizationIndex: 0 });
assert.strictEqual(result.stradellaChordFinderButtons[0], visualGuide);
assert.strictEqual(result.stradellaChordFinderPlaybackButtons, selected);
assert.deepEqual([...result.stradellaRootBassFinderButtonIds], ["visual-root-only"]);

for (const disabled of [
  { stradellaChordFinderActive: false }, { side: "treble" },
]) {
  calls.length = 0; effects.length = 0;
  result = useStradellaChordFinderResults({ ...selection, ...disabled });
  assert.equal(calls.filter(([name]) => name === "many").length, 0,
    "No candidate enumeration for inactive/non-Stradella finder");
  assert.equal(calls.filter(([name]) => name === "single").length, 1,
    "Original non-playable fallback still computed");
  assert.strictEqual(result.stradellaChordFinderResult, fallback);
}
console.log("✓ Stradella Finder defaults, engine delegation, button identity, reset and progression handoff passed");

// Root position is a preference: with no root-position realization, any-bass
// results are shown and the effective requested bass becomes null.
calls.length = 0; effects.length = 0; noResultForBass = "E";
result = useStradellaChordFinderResults({ ...selection, stradellaChordFinderRequestedBass: "E",
  stradellaChordFinderRootPreferred: true, pendingProgressionRealizationKey: null });
assert.deepEqual(calls.map(([, args]) => args[7]), ["E", null], "Root search first, then any bass");
assert.equal(result.stradellaChordFinderRootFallback, true);
assert.equal(result.stradellaChordFinderEffectiveRequestedBass, null);
assert.strictEqual(result.stradellaChordFinderRealizations, candidates);
// An explicit slash bass stays strict.
calls.length = 0; effects.length = 0;
result = useStradellaChordFinderResults({ ...selection, stradellaChordFinderRequestedBass: "E",
  stradellaChordFinderRootPreferred: false, pendingProgressionRealizationKey: null });
assert.equal(calls.length, 1);
assert.equal(result.stradellaChordFinderRootFallback, false);
assert.equal(result.stradellaChordFinderEffectiveRequestedBass, "E");
noResultForBass = null;
console.log("✓ Root-position default falls back to any bass only when it has no realization");
