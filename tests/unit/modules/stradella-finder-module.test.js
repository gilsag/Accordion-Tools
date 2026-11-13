/** Stradella Finder ownership and forwarding contracts. Heavy chord-search correctness
 * remains covered by the unchanged Stradella musical regression suite.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

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
let onlyWithoutBassButton = false; // when set, that bass is found only without the bass-button rule
let onlyAtSpan = null; // when set, that bass is found on a bass button only at this hand span
const engines = {
  nextWiderHandSpan: (span) => [3.2, 4.3, 5.5].find((step) => step > span + 1e-9) ?? null,
  getStradellaChordFinderResults: (...args) => {
    calls.push(["many", args]);
    const blocked = noResultForBass !== null && args[7] === noResultForBass &&
      (!onlyWithoutBassButton || args[10] === true) && (onlyAtSpan === null || args[6] !== onlyAtSpan);
    return blocked ? [fallback] : candidates;
  },
  getStradellaChordFinderResult: (...args) => {
    calls.push(["single", args]);
    return fallback;
  },
};
const module = { exports: loadIsolated(path, { imports: {
  react: mockReact,
  "../../tools/stradellaChordFinderTools": engines,
  "../../tools/stradellaChordFinder/harmonicIdentity":
    { ROOT_POSITION_BASS: "root", resolveRequestedBass: (root, choice) => choice === "root" ? root : choice },
  "../../tools/stradellaChordFinder/diagramAnnotations":
    { DEFAULT_STRADELLA_NOTE_LEVELS: { essentials: true, harmonic: true, registral: true, voicing: true } },
} }) };
const { useStradellaChordFinderState, useStradellaChordFinderResults } = module.exports;
const state = useStradellaChordFinderState();

test("Requested bass tries one step more reach, then falls back from bass button to lowest note, and the root…", () => {
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
    stradellaChordFinderMarkRootBass: false, stradellaRequestedBassOnBassButton: true,
    pendingProgressionRealizationKey: "chord-G|counterbass-E",
    setPendingProgressionRealizationKey: (value) => updates.push(["pending", value]),
    setStradellaChordFinderRealizationIndex: (value) => updates.push(["index", value]),
  };
  let result = useStradellaChordFinderResults(selection);
  assert.deepEqual(calls.at(-1), ["many", [
    buttons, "E", "minor7", "bass-and-chords", false, 4, 5.5, "G", registerModel, 2, true,
  ]], "Finder parameters, order, exact instrument object and bass-button rule forwarded");
  assert.strictEqual(result.stradellaChordFinderRealizations, candidates);
  assert.strictEqual(result.stradellaChordFinderResult, candidates[1]);
  assert.strictEqual(result.stradellaChordFinderButtons, alt);
  assert.strictEqual(result.stradellaChordFinderPlaybackButtons, alt);
  assert.deepEqual([...result.stradellaPrimaryFinderButtonIds], ["counterbass-E", "chord-G"]);
  assert.equal(effects.length, 2, "Both existing synchronization effects are retained");
  effects.forEach((fn) => fn());
  assert.deepEqual(updates, [["index", 0], ["index", 1], ["pending", null]],
    "Reset ordering and exact progression button-ID matching remain unchanged");
  calls.length = 0;
   effects.length = 0;
  result = useStradellaChordFinderResults({ ...selection,
    stradellaChordFinderRealizationIndex: 99, pendingProgressionRealizationKey: null });
  assert.strictEqual(result.stradellaChordFinderResult, candidates[1], "Out-of-range selection is clamped");
  assert.strictEqual(result.stradellaChordFinderPlaybackButtons, alt, "Actual playback recipe preserved");
  assert.strictEqual(result.stradellaChordFinderButtons, alt,
    "Candidates without a visual guide may share the same button array");
  calls.length = 0;
   effects.length = 0;
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
  // Root position is a preference: with no root-position realization, any-bass
  // results are shown and the effective requested bass becomes null.
  calls.length = 0;
   effects.length = 0;
   noResultForBass = "E";
  result = useStradellaChordFinderResults({ ...selection, stradellaChordFinderRequestedBass: "E",
    stradellaChordFinderRootPreferred: true, pendingProgressionRealizationKey: null });
  assert.deepEqual(calls.map(([, args]) => [args[7], args[10]]), [["E", true], ["E", false], [null, true]],
    "Root on a bass button first, then root as the lowest note, then any bass");
  assert.equal(result.stradellaChordFinderRootFallback, true);
  assert.equal(result.stradellaChordFinderEffectiveRequestedBass, null);
  assert.strictEqual(result.stradellaChordFinderRealizations, candidates);
  // An explicit slash bass stays strict.
  calls.length = 0;
   effects.length = 0;
  result = useStradellaChordFinderResults({ ...selection, stradellaChordFinderRequestedBass: "E",
    stradellaChordFinderRootPreferred: false, pendingProgressionRealizationKey: null });
  assert.equal(calls.length, 2, "an explicit bass only relaxes the bass-button rule");
  assert.equal(result.stradellaChordFinderRootFallback, false);
  assert.equal(result.stradellaChordFinderEffectiveRequestedBass, "E");
  // When only the bass-button rule fails, the requested bass is kept as the lowest note.
  calls.length = 0;
   effects.length = 0;
   onlyWithoutBassButton = true;
  result = useStradellaChordFinderResults({ ...selection, stradellaChordFinderRequestedBass: "E",
    stradellaChordFinderRootPreferred: true, pendingProgressionRealizationKey: null });
  assert.deepEqual(calls.map(([, args]) => [args[7], args[10]]), [["E", true], ["E", false]]);
  assert.equal(result.stradellaChordFinderBassButtonFallback, true);
  assert.equal(result.stradellaChordFinderRootFallback, false);
  assert.equal(result.stradellaChordFinderEffectiveRequestedBass, "E");
  // One step more reach is tried before giving up the bass button.
  calls.length = 0;
   effects.length = 0;
   onlyWithoutBassButton = false;
   onlyAtSpan = 5.5;
  result = useStradellaChordFinderResults({ ...selection, finderSpanColumns: 4.3, stradellaChordFinderRequestedBass: "E",
    stradellaChordFinderRootPreferred: true, pendingProgressionRealizationKey: null });
  assert.deepEqual(calls.map(([, args]) => [args[7], args[10], args[6]]), [["E", true, 4.3], ["E", true, 5.5]]);
  assert.equal(result.stradellaChordFinderReachExtendedTo, 5.5);
  assert.equal(result.stradellaChordFinderBassButtonFallback, false);
  assert.strictEqual(result.stradellaChordFinderRealizations, candidates);
  noResultForBass = null;
   onlyWithoutBassButton = false;
   onlyAtSpan = null;
});
