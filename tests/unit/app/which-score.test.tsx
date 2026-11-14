// @vitest-environment jsdom
/** Which score the workspace shows: the open tool's, if its score is shown
 * and has content, and only on the sides that tool plays; in the Harmony
 * workspace, the recording's. Where it goes is `notationLocation()`'s. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";
import type { ScoreEntry } from "../../../src/app/notation/scoreEntries";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

const titleOf = (score: ScoreEntry | null) => (score && "title" in score ? score.title : null);

test("the ABC Player's score shows the tune's own ABC, under its title", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await expect.poll(() => app.model.tools.abcText).toContain("T:Happy Birthday");
  expect(app.score).toBeNull();
  await app.run((model) => model.workspace.toggleAbcNotation());
  // The ABC parser loads on demand; until it has, the title is the placeholder's.
  await expect.poll(() => titleOf(app.score), { timeout: 3000 }).toBe("Happy Birthday");
  expect(app.score && "abc" in app.score && app.score.abc).toBe(app.model.tools.abcText);
});

test("the Bass Pattern Player's score shows on the Stradella side only", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("bassPatternPlayer"));
  await app.run((model) => model.workspace.toggleBassPatternNotation());
  expect(titleOf(app.score)).toMatch(/ over /);
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  expect(app.score).toBeNull();
});

test("the Progression Assistant's score shows on the Stradella side only", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.tools.useHarmonyProgressionPreset("i-iv-v-i", "C"));
  await app.run((model) => model.workspace.toggleHarmonyProgressionNotation());
  expect(app.score).not.toBeNull();
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  expect(app.score).toBeNull();
});

test("the sequence's score needs Sequence mode and at least one step", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("sequence"));
  await app.run((model) => model.workspace.toggleSequenceNotation());
  expect(app.score).toBeNull();
  await app.run((model) => model.workspace.toggleButton(model.workspace.buttons[0]));
  expect(titleOf(app.score)).toBe("Sequence notation");
});

test("the Rhythm Trainer's score is its own panel", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("rhythmTrainer"));
  if (!app.model.tools.rhythmTrainer.notationVisible)
    await app.run((model) => model.tools.rhythmTrainer.setNotationVisible(true));
  expect(app.score && "panel" in app.score).toBe(true);
});

test("the Harmony workspace shows the recording's score, not the open tool's", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("bassPatternPlayer"));
  await app.run((model) => model.workspace.toggleBassPatternNotation());
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  expect(app.score).toBeNull();
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  await app.run((model) => model.workspace.handleHarmonyChordActivated(0, "major", 0));
  await app.run((model) => model.workspace.toggleHarmonyRecordedNotation());
  expect(titleOf(app.score)).toBe("Recorded Harmony progression");
});

test("the toolbar's notation button appears once the open tool has something to show", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("sequence"));
  expect(app.scoreToggle).toBeNull();
  await app.run((model) => model.workspace.toggleButton(model.workspace.buttons[0]));
  expect(app.scoreToggle).toMatchObject({ visible: false });
  await app.run(() => app.scoreToggle?.toggle());
  expect(app.scoreToggle).toMatchObject({ visible: true });
  expect(titleOf(app.score)).toBe("Sequence notation");
  // Notes mode has no score, so no button.
  await app.run((model) => model.tools.setAnnotateMode("notes"));
  expect(app.scoreToggle).toBeNull();
});

test("the Harmony workspace's button is the recording's, whatever tool is open", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("rhythmTrainer"));
  expect(app.scoreToggle).not.toBeNull();
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  expect(app.scoreToggle).toBeNull();
  await app.run((model) => model.tools.toggleHarmonyProgressionRecording());
  await app.run((model) => model.workspace.handleHarmonyChordActivated(0, "major", 0));
  expect(app.scoreToggle).toMatchObject({ visible: false });
});
