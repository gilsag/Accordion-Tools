/** Harmony and Progression Assistant state ownership, musical engine
 * forwarding and cross-tool invariants, rendered with React; the engines are
 * replaced so the tests see what the hooks pass them. The harmony and
 * progression algorithm suites validate the actual chord and voice work.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { act, renderHook } from "@testing-library/react";
import { test, vi } from "vitest";
import {
  useHarmonyExplorerResults,
  useHarmonyExplorerState,
} from "../../../src/features/harmonyExplorer/useHarmonyExplorer";
import {
  useHarmonyProgressionResults,
  useHarmonyProgressionState,
} from "../../../src/features/progressionAssistant/useProgressionAssistant";

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
vi.mock("../../../src/tools/harmonyExplorer/music", async (original) => {
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
vi.mock("../../../src/i18n/musicTerms", async (original) => ({
  ...(await original()),
  familyName: (_id, name) => name,
  scaleName: (_id, name) => name,
}));
vi.mock("../../../src/tools/harmonyExplorer/explanation", async (original) => ({
  ...(await original()),
  buildDiagramExplanation(options) {
    doubles.explanationCalls.push(options);
    return "expected explanation";
  },
}));
vi.mock("../../../src/tools/harmonyExplorer/progression", async (original) => {
  const { progression } = doubles;
  const playbackButtons = () => doubles.playbackButtons;
  return {
    ...(await original()),
    progressionRealizationKey(result) {
      return result.playbackButtons
        .map((button) => button.id)
        .sort()
        .join("|");
    },
    progressionRealizationsForChord() {
      return [
        {
          result: { playbackButtons: playbackButtons(), playable: true, exact: true },
          realizationIndex: 0,
        },
      ];
    },
    optimizeStradellaProgression(...args) {
      doubles.optimizedArgs.push(args);
      return {
        playable: progression.playable,
        steps: progression.playable
          ? [
              {
                result: { playbackButtons: playbackButtons() },
                chord: { rootPc: 0, familyId: "major" },
              },
            ]
          : [],
      };
    },
  };
});
vi.mock("../../../src/stradella", async (original) => ({
  ...(await original()),
  generateStradella(...args) {
    doubles.generatedArgs.push(args);
    return doubles.physicalButtons;
  },
}));
vi.mock(
  "../../../src/features/progressionAssistant/progressionNoteSelection",
  async (original) => ({
    ...(await original()),
    progressionNoteStep: (plan, id) =>
      plan.playable ? (plan.steps.find((step) => step.chord.id === id) ?? null) : null,
  }),
);

const render = (hook) => renderHook(hook).result.current;

test("Harmony and progression defaults, selectors, physical IDs, and commands", () => {
  const explorerHook = renderHook(() => useHarmonyExplorerState());
  let state = explorerHook.result.current;
  for (const [field, expected] of Object.entries({
    harmonyReferenceFamilyId: "major",
    harmonyRelatedFamilyId: "minor7",
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
  const options = { ...state, language: "en", t };
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
  const physicalButtons = doubles.physicalButtons;
  let prog = render(useHarmonyProgressionState);
  for (const [field, expected] of Object.entries({
    harmonyProgressionManualRoot: "C",
    harmonyProgressionManualPattern: "major-triad",
    harmonyProgressionHandMovementWeight: 0.65,
    harmonyProgressionRhythmPattern: "block",
    harmonyProgressionPreviewIndex: null,
    harmonyProgressionNoteStepId: null,
    harmonyProgressionNotationVisible: false,
  }))
    assert.equal(prog[field], expected, `Progression default: ${field}`);
  for (const k of ["harmonyProgression", "harmonyProgressionActiveButtonIds"])
    assert.equal(prog[k].length, 0, `${k} initially empty`);
  assert.equal(prog.harmonyProgressionNotationRef.current, null);
  let updates = [];
  const selection = {
    basses: "96",
    buttonSize: 40,
    spacing: 1.2,
    stradellaAccidental: "sharps",
    diagramVerticalSpacing: 6,
    harmonyProgression: [{ id: "p1", rootPc: 0, familyId: "major" }],
    harmonyProgressionHandMovementWeight: 0.4,
    harmonyProgressionRealizationKeys: {},
    setHarmonyProgressionRealizationKeys: () => {},
    harmonyProgressionPreviewIndex: 0,
    setHarmonyProgressionPreviewIndex: (v) => updates.push(v),
    harmonyProgressionActiveButtonIds: [],
    activeToolSection: "progressionAssistant",
  };
  let result = render(() => useHarmonyProgressionResults(selection));
  assert.deepEqual([...doubles.generatedArgs[0]], ["96", 40, 1.2, "sharps", 6]);
  assert.strictEqual(doubles.optimizedArgs[0][0], physicalButtons);
  assert.strictEqual(doubles.optimizedArgs[0][1], selection.harmonyProgression);
  assert.equal(
    JSON.stringify(doubles.optimizedArgs[0][2]),
    JSON.stringify({
      allowApproximations: true,
      handMovementWeight: 0.4,
      maxRealizationsPerChord: 5,
      fixedRealizationKeys: {},
    }),
  );
  assert.strictEqual(
    result.harmonyProgressionPlan.steps[0].result.playbackButtons,
    doubles.playbackButtons,
  );
  assert.equal(
    JSON.stringify([...result.progressionPreviewButtonIds]),
    JSON.stringify(["bass-C", "chord-C"]),
  );
  // The preview-clamping effect ran when the hook rendered.
  assert.equal(updates[0](0), 0, "Existing preview-clamping updater retained");
  result = render(() =>
    useHarmonyProgressionResults({
      ...selection,
      activeToolSection: "scaleFinder",
    }),
  );
  assert.equal(result.progressionPreviewButtonIds.size, 0, "Preview hidden outside Assistant");
  result = render(() =>
    useHarmonyProgressionResults({
      ...selection,
      harmonyProgressionActiveButtonIds: ["chord-C"],
    }),
  );
  assert.equal(result.progressionPreviewButtonIds.size, 0, "Playback markings supersede preview");
  assert.ok(result.harmonyProgressionActiveButtonIdSet.has("chord-C"));
  doubles.progression.playable = false;
  result = render(() => useHarmonyProgressionResults(selection));
  assert.equal(result.harmonyProgressionPlan.playable, false);
  assert.equal(result.progressionPreviewButtonIds.size, 0);
  assert.equal(updates.at(-1), null, "Unplayable plan clears stale preview");
});
