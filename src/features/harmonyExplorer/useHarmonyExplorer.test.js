/** Harmony Explorer state ownership and musical engine forwarding, rendered
 * with React; the engine is replaced so the tests see what the hooks pass it.
 * The harmony algorithm suites validate the actual chord work.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { act, renderHook } from "@testing-library/react";
import { useHarmonyExplorerResults, useHarmonyExplorerState } from "./useHarmonyExplorer";
import { test, vi } from "vitest";

const doubles = vi.hoisted(() => ({
  refVisibility: { 0: true, 1: true, 2: true },
  sectorArgs: [],
  sectorResults: [],
  countArgs: [],
  explanationCalls: [],
  generatedArgs: [],
  optimizedArgs: [],
  progression: { playable: true },
  physicalButtons: [
    { id: "bass-C", kind: "bass-root" },
    { id: "chord-C", kind: "chord-major" },
  ],
  playbackButtons: null,
}));
doubles.playbackButtons = [doubles.physicalButtons[0], doubles.physicalButtons[1]];
const refVisibility = doubles.refVisibility;
vi.mock("./engine/music", async (original) => {
  const { refVisibility, sectorArgs, sectorResults, countArgs } = doubles;
  return {
    ...(await original()),
    DEFAULT_RING_VISIBILITY: refVisibility,
    buildSectorRelationships(...args) {
      sectorArgs.push(args);
      const sectors = [{ rootPc: 0, stamp: sectorArgs.length }];
      sectorResults.push(sectors);
      return sectors;
    },
    relationshipCounts(sectors) {
      countArgs.push(sectors);
      return [2, 1];
    },
    filterRelationshipCounts(counts, vis) {
      if (JSON.stringify(vis) !== JSON.stringify(refVisibility))
        throw new Error("ring visibility not forwarded");
      return counts;
    },
    chordFamily(id) {
      return { id, name: "Major triad" };
    },
    relatedFamilyName() {
      return "Minor seventh";
    },
    scaleDefinition(id) {
      return { id, name: "Ionian" };
    },
  };
});
vi.mock("../../i18n/musicTerms", async (original) => ({
  ...(await original()),
  familyName: (_id, name) => name,
  scaleName: (_id, name) => name,
}));
vi.mock("./engine/explanation", async (original) => ({
  ...(await original()),
  buildDiagramExplanation(options) {
    doubles.explanationCalls.push(options);
    return "expected explanation";
  },
}));

const render = (hook) => renderHook(hook).result.current;

test("Harmony Explorer defaults, selectors and engine forwarding", () => {
  const explorerHook = renderHook(() => useHarmonyExplorerState());
  let state = explorerHook.result.current;
  for (const [field, expected] of Object.entries({
    harmonyReferenceFamilyId: "major",
    harmonyRelatedFamilyId: "all",
    harmonyScaleId: "ionian",
    harmonyDiatonicOnly: false,
    harmonyHighlightDiatonic: true,
    harmonyShowEnharmonics: false,
    harmonyShowSeparators: true,
    harmonyShowLegend: true,
    harmonyShowExplanation: false,
    harmonyShowToneTooltips: true,
    harmonyShowNoteRing: true,
    harmonyColorByFamily: false,
    harmonyDiameter: 900,
    harmonyFontSize: 18,
    harmonyPlaybackStyle: "block",
    harmonyVoicingStyle: "root",
    harmonySelection: null,
    harmonyFocusedReferenceRootPc: null,
  }))
    assert.equal(state[field], expected, `Explorer default: ${field}`);
  assert.equal(JSON.stringify(state.harmonyRingVisibility), JSON.stringify(refVisibility));
  assert.notStrictEqual(
    state.harmonyRingVisibility,
    refVisibility,
    "ring visibility initialized independently",
  );
  const setter = state.setHarmonyShowNoteRing;
  act(() => state.setHarmonyShowNoteRing(false));
  state = explorerHook.result.current;
  assert.strictEqual(setter, state.setHarmonyShowNoteRing, "Stable setter across renders");
  assert.equal(state.harmonyShowNoteRing, false);
  const t = (key) => key;
  // One related family first; all families are checked below.
  const options = { ...state, harmonyRelatedFamilyId: "minor7", language: "en", t };
  let calculated = render(() => useHarmonyExplorerResults(options));
  assert.equal(calculated.harmonyAllFamiliesMode, false);
  assert.equal(calculated.harmonyEffectiveDiatonicOnly, false);
  assert.equal(calculated.harmonyEffectiveHighlightDiatonic, true);
  assert.deepEqual([...doubles.sectorArgs[0]], ["major", "minor7", "ionian", false, true]);
  assert.strictEqual(doubles.countArgs[0], doubles.sectorResults[0]);
  assert.strictEqual(calculated.harmonySectors, doubles.sectorResults[0]);
  assert.equal(calculated.harmonyExplanation, "expected explanation");
  assert.equal(doubles.explanationCalls[0].showNoteRing, false);
  assert.equal(doubles.explanationCalls[0].referenceFamilyName, "Major triad");
  calculated = render(() =>
    useHarmonyExplorerResults({ ...options, harmonyRelatedFamilyId: "all" }),
  );
  assert.equal(calculated.harmonyAllFamiliesMode, true);
  assert.equal(calculated.harmonyEffectiveDiatonicOnly, true);
  assert.equal(calculated.harmonyEffectiveHighlightDiatonic, false);
  assert.equal(doubles.explanationCalls.at(-1).relatedFamilyName, "ui.allDiatonicFamilies");
});
