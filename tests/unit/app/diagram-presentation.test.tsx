// @vitest-environment jsdom
/** What the diagram presents for the active tool: its title in each title
 * mode, its footer, the buttons a Finder lights, the status line and the
 * downloaded file's name. The open tool's contribution comes first, then an
 * active Finder's; with none, the automatic title. Values recorded from the
 * app before the diagram's inputs moved into the tools. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  downloads,
  renderApp,
  resetBrowserState,
  serveBundledFiles,
} from "../../support/appHarness";

vi.mock("../../../src/diagram/diagramExport", async (original) => ({
  ...(await original<object>()),
  downloadDiagram: (_svg: unknown, name: string) => downloads.push(name),
}));

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

const STRADELLA = "Stradella · 96 bass · English notation · Sound off";
const TREBLE = "Treble · C-system · 5 rows · English notation · Sound off";

test("with no tool active, the automatic title", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  expect(app.diagram).toMatchObject({
    title: "96-Bass Stradella",
    footer: [],
    finderHighlights: 0,
    status: `${STRADELLA} · No active tool`,
  });
  expect(app.diagram.downloadName()).toBe("96-Bass-Stradella");
});

test("the Stradella Chord Finder titles the diagram with its realization and explains it below", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  await app.run((model) => model.tools.setStradellaChordFinderRoot("D"));
  await app.run((model) => model.tools.setStradellaChordFinderPattern("minor7"));
  expect(app.diagram).toMatchObject({
    title: "Dm7 - Exact - 2 buttons",
    footer: [
      "Harmonic identity: Dm7",
      "Pitch-class realization: D–F–A–C · Exact (complete)",
      "Physical realization: D counterbass + FM · 2 played buttons",
      "Registral voicing: D2 – C3 – F3 – A3",
    ],
    finderHighlights: 2,
    status: `${STRADELLA} · Chord Finder`,
  });
  expect(app.diagram.downloadName()).toBe("Dmin7-Exact-2buttons-D-counterbass-F-major");
  await app.run((model) => model.tools.setShowFinderRealizationNote(false));
  expect(app.diagram.footer).toEqual([]);
  expect(app.diagram.title).toBe("Dm7 - Exact - 2 buttons");
});

test("an eye-selected progression step titles and explains the diagram; the file keeps the automatic name", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.useHarmonyProgressionPreset("i-iv-v-i", "C"));
  expect(app.diagram.title).toBe("96-Bass Stradella");
  expect(app.diagram.status).toBe(`${STRADELLA} · Progression Assistant`);
  const step = app.model.tools.harmonyProgressionPlan.steps[1].chord.id;
  await app.run((model) => model.tools.toggleHarmonyProgressionStepNotes(step));
  expect(app.diagram).toMatchObject({
    title: "FM - Exact - 2 buttons",
    footer: [
      "Harmonic identity: FM",
      "Pitch-class realization: F–A–C · Exact (complete)",
      "Physical realization: F bass + FM · 2 played buttons",
      "Registral voicing: F2 – C3 – F3 – A3",
    ],
    finderHighlights: 0,
  });
  expect(app.diagram.downloadName()).toBe("96-Bass-Stradella");
});

test("the Scale Finder titles the diagram with its scale", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.toggleToolSection("scaleFinder"));
  await app.run((model) => model.tools.setScaleFinderActive(true));
  expect(app.diagram).toMatchObject({
    title: "C Major scale",
    footer: [],
    finderHighlights: 7,
    status: `${STRADELLA} · Scale Finder`,
  });
  expect(app.diagram.downloadName()).toBe("C-Major-scale");
});

test("the treble Chord Finder titles the diagram and notes its voicing below", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  await app.run((model) => model.tools.toggleToolSection("chordFinder"));
  expect(app.diagram).toMatchObject({
    title: "CM - Exact",
    footer: ["Exact · C–E–G · All chord tones present"],
    finderHighlights: 3,
    status: `${TREBLE} · Chord Finder`,
  });
  expect(app.diagram.downloadName()).toBe("Cmaj-Exact");
  await app.run((model) => model.tools.setShowTrebleVoicingNote(false));
  expect(app.diagram.footer).toEqual([]);
});

test("the title modes: automatic, custom and none", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  await app.run((model) => model.tools.toggleToolSection("chordFinder"));
  await app.run((model) => model.settings.setTitleMode("auto"));
  expect(app.diagram.title).toBe("C-system Treble");
  expect(app.diagram.downloadName()).toBe("C-system-Treble");
  await app.run((model) => model.settings.setTitleMode("custom"));
  expect(app.diagram.title).toBe("My accordion diagram");
  expect(app.diagram.downloadName()).toBe("My-accordion-diagram");
  await app.run((model) => model.settings.setTitleMode("none"));
  expect(app.diagram.title).toBe("");
  expect(app.diagram.downloadName()).toBe("c-system-treble-accordion-diagram");
});

test("the Harmony workspace downloads the circle under its families' names", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  expect(app.diagram.downloadName()).toBe("harmonic-circle-major-minor-seventh-ionian-major");
});

test("the ABC Player's two-hand view names the file after the tune", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await app.run((model) => model.tools.chooseAbcHands("both"));
  await expect
    .poll(() => app.diagram.downloadName(), { timeout: 3000 })
    .toBe("Happy-Birthday-both-hands");
});

test("the assistant's explanation steps aside while its plan sounds a pulse or a rest", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.useHarmonyProgressionPreset("i-iv-v-i", "C"));
  const step = app.model.tools.harmonyProgressionPlan.steps[1].chord.id;
  await app.run((model) => model.tools.toggleHarmonyProgressionStepNotes(step));
  expect(app.diagram.title).toBe("FM - Exact - 2 buttons");
  await app.run((model) => model.tools.setHarmonyProgressionPulseSilent(true));
  expect(app.diagram).toMatchObject({ title: "96-Bass Stradella", footer: [] });
  await app.run((model) => model.tools.setHarmonyProgressionPulseSilent(false));
  await app.run((model) => model.tools.setHarmonyProgressionActiveButtonIds(["x"]));
  expect(app.diagram.footer).toEqual([]);
});
