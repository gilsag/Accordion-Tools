// @vitest-environment jsdom
/** What a click on a diagram button does: it sounds the button, and with
 * Annotate Diagram open its mode decides what else happens. Notes mode opens
 * a note editor on the button and keeps it silent. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

const sounded: string[] = [];
vi.mock("../../../src/audio/sound", async (original) => ({
  ...(await original<object>()),
  playButtonSound: (button: { id: string }) => sounded.push(button.id),
}));

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
  sounded.length = 0;
});
afterEach(cleanup);

test("with no tool that takes clicks open, a click only sounds the button", async () => {
  const app = await renderApp();
  const button = app.model.workspace.buttons[0];
  await app.run((model) => model.workspace.toggleButton(button));
  expect(sounded).toEqual([button.id]);
  expect(app.model.tools.overlays[button.id]?.selected).toBeFalsy();
});

test("Select mode marks the button and sounds it; Notes mode opens an editor silently", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("select"));
  const button = app.model.workspace.buttons[2];
  await app.run((model) => model.workspace.toggleButton(button));
  expect(app.model.tools.overlays[button.id]?.selected).toBe(true);
  expect(sounded).toEqual([button.id]);

  await app.run((model) => model.tools.setAnnotateMode("notes"));
  await app.run((model) => model.workspace.toggleButton(button));
  expect(app.model.tools.inlineAnnotationEditor).not.toBeNull();
  expect(sounded).toEqual([button.id]);
});
