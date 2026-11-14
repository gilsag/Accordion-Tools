// @vitest-environment jsdom
/** What clears the work on the diagram (selection, finger numbers, sequence,
 * Finder highlights) and what the Reset menu's scopes reset. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";
import type { RenderedApp } from "../../support/appHarness";
import type { HarmonySelection } from "../../../src/features/harmonyExplorer/engine/types";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

/** G major selected on the circle. */
const G_MAJOR_SELECTION: HarmonySelection = {
  sectorIndex: 1,
  sharedCount: 2,
  referenceRootPc: 0,
  referenceFamilyId: "major",
  candidate: {
    rootPc: 7,
    familyId: "major",
    pitchClasses: [7, 11, 2],
    sharedCount: 1,
    diatonic: true,
  },
};

/** Selects the first two buttons and records the third in a sequence. */
async function markDiagram(app: RenderedApp) {
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("select"));
  const [first, second, third] = app.model.workspace.buttons;
  await app.run((model) => model.workspace.toggleButton(first));
  await app.run((model) => model.workspace.toggleButton(second));
  await app.run((model) => model.tools.setAnnotateMode("sequence"));
  await app.run((model) => model.workspace.toggleButton(third));
  expect(app.model.tools.selectedButtons.map((button) => button.id)).toEqual([first.id, second.id]);
  expect(app.model.tools.sequenceSteps).toHaveLength(1);
}

test("changing the physical layout clears the marks and the Finder highlights", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.settings.setBasses("120"));
  expect(app.model.workspace.overlays).toEqual({});
  expect(app.model.tools.sequenceSteps).toEqual([]);
  expect(app.model.tools.textNotes).toEqual([]);
  expect(app.model.tools.scaleFinderActive).toBe(false);
  expect(app.model.tools.stradellaChordFinderActive).toBe(false);
});

test("choosing a chord or a scale is not a layout change", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.tools.setStradellaChordFinderRoot("F"));
  await app.run((model) => model.tools.setScaleFinderRoot("G"));
  expect(app.model.tools.selectedButtons).toHaveLength(2);
  expect(app.model.tools.sequenceSteps).toHaveLength(1);
});

test("Reset work clears the marks, the Finders and the progression preview but keeps preferences", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.tools.setStradellaChordFinderRoot("E"));
  await app.run((model) => model.tools.setFinderMaxButtons(4));
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.tools.setHarmonyProgressionPreviewIndex(0));
  expect(app.model.tools.harmonyProgressionPreviewIndex).toBe(0);
  await app.run((model) => model.workspace.setHarmonySelection(G_MAJOR_SELECTION));
  await app.run((model) => model.workspace.resetDiagramWork());
  expect(app.model.tools.harmonySelection).toEqual(G_MAJOR_SELECTION);
  expect(app.model.workspace.overlays).toEqual({});
  expect(app.model.tools.sequenceSteps).toEqual([]);
  expect(app.model.tools.scaleFinderActive).toBe(false);
  expect(app.model.tools.stradellaChordFinderActive).toBe(false);
  expect(app.model.tools.harmonyProgressionPreviewIndex).toBeNull();
  expect(app.model.tools.stradellaChordFinderRoot).toBe("E");
  expect(app.model.tools.finderMaxButtons).toBe(4);
});

test("Reset tool in the Stradella Chord Finder restores its defaults and clears the work", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  await app.run((model) => model.tools.setStradellaChordFinderRoot("E"));
  await app.run((model) => model.tools.setStradellaChordFinderPattern("minor7"));
  await app.run((model) => model.tools.setFinderMaxButtons(4));
  await app.run((model) => model.tools.setFinderSpanColumns(6));
  await app.run((model) => model.tools.setStradellaChordFinderRealizationIndex(2));
  expect(app.model.tools.stradellaChordFinderActive).toBe(true);
  await app.run((model) => model.workspace.resetCurrentToolDefaults());
  expect(app.model.tools.stradellaChordFinderRoot).toBe("C");
  expect(app.model.tools.stradellaChordFinderPattern).toBe("major-triad");
  expect(app.model.tools.stradellaChordFinderMode).toBe("bass-and-chords");
  expect(app.model.tools.stradellaChordFinderRealizationIndex).toBe(0);
  expect(app.model.tools.finderMaxButtons).toBe(3);
  expect(app.model.tools.finderSpanColumns).toBe(4.3);
  expect(app.model.workspace.overlays).toEqual({});
  expect(app.model.tools.sequenceSteps).toEqual([]);
  expect(app.model.tools.stradellaChordFinderActive).toBe(false);
});

test("Reset tool in the Harmony workspace restores the circle's defaults and leaves the diagram alone", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  await app.run((model) => model.settings.setHarmonyDiameter(700));
  await app.run((model) => model.tools.setHarmonyScaleId("dorian"));
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  await app.run((model) => model.workspace.handleHarmonyChordActivated(7, "major", 1));
  expect(app.model.tools.harmonyRecordedProgression).toHaveLength(1);
  await app.run((model) => model.workspace.resetCurrentToolDefaults());
  expect(app.model.workspace.workspaceMode).toBe("harmony");
  expect(app.model.settings.harmonyDiameter).toBe(900);
  expect(app.model.tools.harmonyScaleId).toBe("ionian");
  expect(app.model.tools.harmonyProgressionRecording).toBe(false);
  expect(app.model.tools.harmonyRecordedProgression).toEqual([]);
  expect(app.model.tools.selectedButtons).toHaveLength(2);
});

test("Reset work in the Harmony workspace clears the selection and the recording but keeps the circle's settings", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  await app.run((model) => model.settings.setHarmonyDiameter(700));
  await app.run((model) => model.workspace.setHarmonySelection(G_MAJOR_SELECTION));
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  await app.run((model) => model.workspace.handleHarmonyChordActivated(7, "major", 1));
  await app.run((model) => model.workspace.toggleHarmonyRecordedNotation());
  expect(app.model.tools.harmonyRecordedNotationVisible).toBe(true);

  await app.run((model) => model.workspace.clearHarmonyWork());
  expect(app.model.tools.harmonySelection).toBeNull();
  expect(app.model.tools.harmonyProgressionRecording).toBe(false);
  expect(app.model.tools.harmonyRecordedProgression).toEqual([]);
  expect(app.model.tools.harmonyRecordedNotationVisible).toBe(false);
  expect(app.model.settings.harmonyDiameter).toBe(700);
  expect(app.model.tools.selectedButtons).toHaveLength(2);
});

test("Reset tool does nothing in a tool without preferences to restore", async () => {
  const app = await renderApp();
  await markDiagram(app);
  await app.run((model) => model.tools.setStradellaChordFinderRoot("E"));
  expect(app.model.tools.activeToolSection).toBe("annotateDiagram");
  await app.run((model) => model.workspace.resetCurrentToolDefaults());
  expect(app.model.tools.stradellaChordFinderRoot).toBe("E");
  expect(app.model.tools.selectedButtons).toHaveLength(2);
});

test("Reset tool does nothing when the open tool is not offered on this side", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  await app.run((model) => model.tools.setStradellaChordFinderRoot("E"));
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  expect(app.model.tools.activeToolSection).toBe("stradellaChordFinder");
  await app.run((model) => model.workspace.resetCurrentToolDefaults());
  expect(app.model.tools.stradellaChordFinderRoot).toBe("E");
});
