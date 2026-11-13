// @vitest-environment jsdom
/** What opening and closing tools does to the other tools. These rules live
 * in the application's composition today and will move to the tool
 * coordinator; the expectations must not change when they do. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

test("opening the Stradella Chord Finder shows its chord and hides the Scale Finder", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  expect(app.model.tools.activeToolSection).toBe("stradellaChordFinder");
  expect(app.model.tools.stradellaChordFinderActive).toBe(true);
  expect(app.model.tools.scaleFinderActive).toBe(false);
  expect(app.model.tools.chordFinderActive).toBe(false);
});

test("opening another tool hides a Chord Finder's highlights but keeps its chord and realization", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  await app.run((model) => model.tools.setStradellaChordFinderRoot("D"));
  await app.run((model) => model.tools.setStradellaChordFinderRealizationIndex(1));
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  expect(app.model.tools.stradellaChordFinderActive).toBe(false);
  expect(app.model.tools.stradellaChordFinderRoot).toBe("D");
  expect(app.model.tools.stradellaChordFinderRealizationIndex).toBe(1);

  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  expect(app.model.tools.stradellaChordFinderActive).toBe(true);
  expect(app.model.tools.stradellaChordFinderRealizationIndex).toBe(1);
});

test("opening a tool other than a Finder leaves the Scale Finder's path on the diagram", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  expect(app.model.tools.scaleFinderActive).toBe(true);
});

test("opening the Progression Assistant hides all three Finders", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  await app.run((model) => model.tools.setScaleFinderActive(true));
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  expect(app.model.tools.activeToolSection).toBe("progressionAssistant");
  expect(app.model.tools.stradellaChordFinderActive).toBe(false);
  expect(app.model.tools.scaleFinderActive).toBe(false);
  expect(app.model.tools.chordFinderActive).toBe(false);
});

test("the first time the ABC Player opens empty it loads Happy Birthday, and only once", async () => {
  const app = await renderApp();
  expect(app.model.tools.abcText).toBe("");
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await expect.poll(() => app.model.tools.abcText).toContain("T:Happy Birthday");
  expect(app.model.tools.abcExampleValue).toBe("happy-birthday");

  await app.run((model) => model.tools.setAbcText(""));
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  expect(app.model.tools.activeToolSection).toBe("abcPlayer");
  expect(app.model.tools.abcText).toBe("");
});
