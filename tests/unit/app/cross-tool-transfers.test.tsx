// @vitest-environment jsdom
/** The commands that carry a chord or a progression from one tool to another.
 * The order of their side effects is covered by the pure `crossToolCommands`
 * tests; these check where each command lands and what it hands over. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { HarmonySelection } from "../../../src/features/harmonyExplorer/engine/types";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

/** A minor chord on A selected on the circle, as the circle reports it. */
const A_MINOR_SELECTION: HarmonySelection = {
  sectorIndex: 3,
  sharedCount: 2,
  referenceRootPc: 0,
  referenceFamilyId: "major",
  candidate: {
    rootPc: 9,
    familyId: "minor",
    pitchClasses: [9, 0, 4],
    sharedCount: 2,
    diatonic: true,
  },
};

test("Show on Stradella opens the Chord Finder on the selected chord in root position", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.setStradellaChordFinderRealizationIndex(2));
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  await app.run((model) => model.workspace.setHarmonySelection(A_MINOR_SELECTION));
  await app.run((model) => model.tools.showHarmonySelectionOnStradella());
  const { tools } = app.model;
  expect(tools.workspaceMode).toBe("accordion");
  expect(tools.side).toBe("stradella");
  expect(tools.activeToolSection).toBe("stradellaChordFinder");
  expect(tools.stradellaChordFinderActive).toBe(true);
  expect(tools.stradellaChordFinderRoot).toBe("A");
  expect(tools.stradellaChordFinderPattern).toBe("minor-triad");
  // Root position: the requested bass resolves to the chord's root.
  expect(tools.stradellaChordFinderRequestedBass).toBe("A");
  expect(tools.stradellaChordFinderMode).toBe("bass-and-chords");
  expect(tools.stradellaChordFinderRealizationIndex).toBe(0);
  expect(tools.scaleFinderActive).toBe(false);
});

test("Explore in Harmony puts the Finder's chord family on the outer ring and keeps the reference family", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.setHarmonyReferenceFamilyId("minor"));
  await app.run((model) => model.workspace.setHarmonySelection(A_MINOR_SELECTION));
  await app.run((model) => model.tools.setStradellaChordFinderRoot("D"));
  await app.run((model) => model.tools.setStradellaChordFinderPattern("minor7"));
  await app.run((model) => model.tools.exploreCurrentStradellaChordInHarmony());
  expect(app.model.workspace.workspaceMode).toBe("harmony");
  expect(app.model.tools.harmonyRelatedFamilyId).toBe("minor7");
  expect(app.model.tools.harmonyReferenceFamilyId).toBe("minor");
  expect(app.model.tools.harmonySelection).toBeNull();
});

test("Explore in Harmony keeps a selection that already shows the Finder's chord", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.setHarmonySelection(A_MINOR_SELECTION));
  await app.run((model) => model.tools.setStradellaChordFinderRoot("A"));
  await app.run((model) => model.tools.setStradellaChordFinderPattern("minor-triad"));
  await app.run((model) => model.tools.exploreCurrentStradellaChordInHarmony());
  expect(app.model.tools.harmonySelection).toEqual(A_MINOR_SELECTION);
});

test("sending a Harmony recording gives the Progression Assistant new copies of its chords", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  await app.run((model) => model.workspace.handleHarmonyChordActivated(0, "major", 0));
  await app.run((model) => model.workspace.handleHarmonyChordActivated(7, "dominant7", 1));
  const recorded = app.model.tools.harmonyRecordedProgression;
  expect(recorded).toHaveLength(2);

  await app.run((model) => model.tools.sendHarmonyRecordedProgressionToAssistant());
  const { tools } = app.model;
  expect(tools.workspaceMode).toBe("accordion");
  expect(tools.side).toBe("stradella");
  expect(tools.activeToolSection).toBe("progressionAssistant");
  expect(tools.harmonyProgressionRecording).toBe(false);
  expect(tools.scaleFinderActive).toBe(false);
  expect(tools.harmonyProgression.map(({ rootPc, sectorIndex }) => [rootPc, sectorIndex])).toEqual([
    [0, 0],
    [7, 1],
  ]);
  const recordedIds = new Set(recorded.map((event) => event.id));
  expect(tools.harmonyProgression.some((chord) => recordedIds.has(chord.id))).toBe(false);
});

test("previewing a progression step keeps the step selected; a new transfer clears it", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.tools.useHarmonyProgressionPreset("i-iv-v-i", "C"));
  expect(app.model.tools.harmonyProgressionPlan.steps.length).toBeGreaterThan(1);

  await app.run((model) => model.tools.previewHarmonyProgressionStepOnStradella(1));
  expect(app.model.tools.activeToolSection).toBe("progressionAssistant");
  expect(app.model.tools.harmonyProgressionPreviewIndex).toBe(1);

  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  // Three chords, so that step 1 still exists in the new progression.
  await app.run((model) => model.workspace.handleHarmonyChordActivated(0, "major", 0));
  await app.run((model) => model.workspace.handleHarmonyChordActivated(5, "major", 11));
  await app.run((model) => model.workspace.handleHarmonyChordActivated(7, "major", 1));
  await app.run((model) => model.tools.sendHarmonyRecordedProgressionToAssistant());
  expect(app.model.tools.harmonyProgressionPlan.steps).toHaveLength(3);
  expect(app.model.tools.harmonyProgressionPreviewIndex).toBeNull();
});
