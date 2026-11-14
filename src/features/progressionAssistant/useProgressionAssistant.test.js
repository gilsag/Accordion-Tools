/** Progression Assistant state ownership, engine forwarding and preview
 * invariants, rendered with React; the optimizer is replaced so the tests see
 * what the hooks pass it. The progression suites validate the voice work.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { renderHook } from "@testing-library/react";
import {
  useHarmonyProgressionResults,
  useHarmonyProgressionState,
} from "./useProgressionAssistant";
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
vi.mock("./engine/progression", async (original) => {
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
vi.mock("../../instrument/stradella", async (original) => ({
  ...(await original()),
  generateStradella(...args) {
    doubles.generatedArgs.push(args);
    return doubles.physicalButtons;
  },
}));
vi.mock("./progressionNoteSelection", async (original) => ({
  ...(await original()),
  progressionNoteStep: (plan, id) =>
    plan.playable ? (plan.steps.find((step) => step.chord.id === id) ?? null) : null,
}));

const render = (hook) => renderHook(hook).result.current;

test("Progression Assistant defaults, plan forwarding, preview and playback highlights", () => {
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
