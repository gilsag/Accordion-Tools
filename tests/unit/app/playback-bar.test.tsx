// @vitest-environment jsdom
/** The playback bar under the diagram shows the entry of the player the
 * workspace is showing, and nothing for tools that do not play. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

test("the bar follows the open player", async () => {
  const app = await renderApp();
  expect(app.playbackBar).toBeNull();
  await app.run((model) => model.tools.toggleToolSection("bassPatternPlayer"));
  expect(app.playbackBar?.label).toBe("Bass Pattern Player");
  expect(app.playbackBar?.state).toBe("stopped");
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  expect(app.playbackBar?.label).toBe("ABC Player");
  expect(app.playbackBar?.onPause).toBeTypeOf("function");
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  expect(app.playbackBar).toBeNull();
});

test("the Bass Pattern Player and the Progression Assistant have no bar on the treble side", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("bassPatternPlayer"));
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  expect(app.playbackBar).toBeNull();
});

test("Annotate Diagram has a bar only in Sequence mode", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("select"));
  expect(app.playbackBar).toBeNull();
  await app.run((model) => model.tools.setAnnotateMode("sequence"));
  expect(app.playbackBar?.label).toBe("Sequence");
  expect(app.playbackBar?.canPlay).toBe(false);
});

test("the Harmony workspace shows the recording's bar once something is recorded", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  expect(app.playbackBar).toBeNull();
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  await app.run((model) => model.workspace.handleHarmonyChordActivated(0, "major", 0));
  expect(app.playbackBar?.label).toBe("Harmony Explorer");
  expect(app.playbackBar?.canPlay).toBe(true);
});
