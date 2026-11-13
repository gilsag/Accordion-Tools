// @vitest-environment jsdom
/** At most one tool's score is shown, and a tool's score is hidden when the
 * tool closes. Which score wins and where it goes are covered by the pure
 * tests of `selectNotationKind()` and `notationLocation()`. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

test("showing the Bass Pattern Player's score hides the ABC Player's and the sequence's", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await app.run((model) => model.workspace.toggleAbcNotation());
  expect(app.model.tools.abcRenderedNotationVisible).toBe(true);

  await app.run((model) => model.workspace.toggleBassPatternNotation());
  expect(app.model.tools.bassPatternRenderedNotationVisible).toBe(true);
  expect(app.model.tools.abcRenderedNotationVisible).toBe(false);
  expect(app.model.tools.sequenceRenderedNotationVisible).toBe(false);
});

test("closing a player hides its score", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await app.run((model) => model.workspace.toggleAbcNotation());
  await app.run((model) => model.tools.toggleToolSection("bassPatternPlayer"));
  expect(app.model.tools.abcRenderedNotationVisible).toBe(false);
});

test("the sequence's score is shown only in Annotate Diagram's Sequence mode", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("sequence"));
  await app.run((model) => model.workspace.toggleSequenceNotation());
  expect(app.model.tools.sequenceRenderedNotationVisible).toBe(true);

  await app.run((model) => model.tools.setAnnotateMode("select"));
  expect(app.model.tools.sequenceRenderedNotationVisible).toBe(false);
});

test("showing the Harmony recording's score hides the Progression Assistant's", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.workspace.toggleHarmonyProgressionNotation());
  expect(app.model.tools.harmonyProgressionNotationVisible).toBe(true);

  await app.run((model) => model.workspace.toggleHarmonyRecordedNotation());
  expect(app.model.tools.harmonyRecordedNotationVisible).toBe(true);
  expect(app.model.tools.harmonyProgressionNotationVisible).toBe(false);
});

test("closing the Progression Assistant hides its score and its lit buttons", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.workspace.toggleHarmonyProgressionNotation());
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  expect(app.model.tools.activeToolSection).toBeNull();
  expect(app.model.tools.harmonyProgressionNotationVisible).toBe(false);
  expect(app.model.workspace.harmonyProgressionActiveButtonIdSet.size).toBe(0);
});
