// @vitest-environment jsdom
/** Which results panel the workspace offers beside the diagram: the open
 * tool's, or else an active Finder's, on the Stradella side of the accordion
 * workspace and only with the Tools panel showing. */
import { cleanup } from "@testing-library/react";
import { isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

/** Which tool's table the panel is, from what it is given. */
function panelOf(results: ReactNode | null) {
  if (!isValidElement<Record<string, unknown>>(results)) return null;
  if ("realizations" in results.props) return "stradellaChordFinder";
  if ("plan" in results.props) return "progressionAssistant";
  return "other";
}

async function finderActiveOnStradella() {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.setStradellaChordFinderActive(true));
  return app;
}

test("an active Stradella Chord Finder offers its realizations", async () => {
  const app = await finderActiveOnStradella();
  expect(panelOf(app.results)).toBe("stradellaChordFinder");
  await app.run((model) => model.tools.setStradellaChordFinderActive(false));
  expect(app.results).toBeNull();
});

test("the Finder keeps its panel after its section closes", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  expect(panelOf(app.results)).toBe("stradellaChordFinder");
  await app.run((model) => model.tools.toggleToolSection("stradellaChordFinder"));
  expect(app.model.tools.activeToolSection).toBeNull();
  expect(panelOf(app.results)).toBe("stradellaChordFinder");
});

test("no results panel on the treble side, in the Harmony workspace, or without the Tools panel", async () => {
  const app = await finderActiveOnStradella();
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  expect(app.results).toBeNull();
  // Changing side hides the Finder; even made active again, it shows nothing on treble.
  await app.run((model) => model.tools.setStradellaChordFinderActive(true));
  expect(app.results).toBeNull();
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  await app.run((model) => model.tools.setStradellaChordFinderActive(true));
  expect(app.results).not.toBeNull();
  await app.run((model) => model.workspace.setPanel("settings"));
  expect(app.results).toBeNull();
  // Choosing the open panel again hides it.
  await app.run((model) => model.workspace.setPanel("settings"));
  expect(app.model.leftPanelMode).toBe("hidden");
  expect(app.results).toBeNull();
  await app.run((model) => model.workspace.setPanel("tools"));
  await app.run((model) => model.workspace.navigateToTool("harmonyExplorer"));
  expect(app.results).toBeNull();
});

test("the open Progression Assistant offers its steps, ahead of an active Finder", async () => {
  const app = await finderActiveOnStradella();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  // Opening the assistant hides the Finders; re-activating one keeps it second.
  await app.run((model) => model.tools.setStradellaChordFinderActive(true));
  expect(panelOf(app.results)).toBe("progressionAssistant");
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  expect(app.results).toBeNull();
});

test("choosing a step in the assistant's panel previews it on the Stradella side", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("progressionAssistant"));
  await app.run((model) => model.tools.useHarmonyProgressionPreset("i-iv-v-i", "C"));
  await app.run((model) => model.workspace.selectAccordionSide("stradella"));
  const panel = app.results;
  if (!isValidElement<{ onPreviewStep(index: number): void }>(panel)) throw new Error("no panel");
  await app.run(() => panel.props.onPreviewStep(2));
  expect(app.model.tools.harmonyProgressionPreviewIndex).toBe(2);
  expect(app.model.tools.activeToolSection).toBe("progressionAssistant");
});
