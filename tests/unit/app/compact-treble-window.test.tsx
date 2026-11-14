// @vitest-environment jsdom
/** On the compact treble sizes the diagram shows a window of the full
 * keyboard. The window follows what the tools ask to keep visible: the
 * Treble Chord Finder's and Scale Finder's results, and the marked buttons. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";
import type { RenderedApp } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

async function compactTreble(app: RenderedApp) {
  await app.run((model) => model.workspace.selectAccordionSide("treble"));
  await app.run((model) => model.settings.changeTrebleLayout("c-system"));
  await app.run((model) => model.settings.changeTrebleSize("two-octave"));
}
const drawnIds = (app: RenderedApp) => new Set(app.model.workspace.buttons.map((b) => b.id));
const lowestColumn = (app: RenderedApp) =>
  Math.min(...app.model.workspace.buttons.map((button) => button.column));

test("the window moves to show a high chord from the Treble Chord Finder", async () => {
  const app = await renderApp();
  await compactTreble(app);
  const before = lowestColumn(app);
  await app.run((model) => model.tools.toggleToolSection("chordFinder"));
  await app.run((model) => model.tools.setChordFinderOctave(6));
  const chord = app.model.tools.chordFinderButtons;
  expect(chord.length).toBeGreaterThan(0);
  expect(lowestColumn(app)).toBeGreaterThan(before);
  for (const button of chord) expect(drawnIds(app).has(button.id)).toBe(true);
});

test("the window widens to show the whole scale, and narrows again when it is hidden", async () => {
  const app = await renderApp();
  await compactTreble(app);
  await app.run((model) => model.settings.changeTrebleSize("one-octave"));
  const columns = () => new Set(app.model.workspace.buttons.map((button) => button.column)).size;
  const before = columns();
  await app.run((model) => model.tools.setScaleFinderRoot("A"));
  await app.run((model) => model.tools.setScaleFinderActive(true));
  const scale = app.model.tools.scaleFinderButtons;
  expect(scale.length).toBeGreaterThan(0);
  expect(columns()).toBeGreaterThan(before);
  for (const button of scale) expect(drawnIds(app).has(button.id)).toBe(true);

  await app.run((model) => model.tools.setScaleFinderActive(false));
  expect(columns()).toBe(before);
});

test("marked buttons stay on screen when the result that widened the window is hidden", async () => {
  const app = await renderApp();
  await compactTreble(app);
  await app.run((model) => model.settings.changeTrebleSize("one-octave"));
  await app.run((model) => model.tools.setScaleFinderRoot("A"));
  await app.run((model) => model.tools.setScaleFinderActive(true));
  const farthest = app.model.workspace.buttons.reduce((a, b) => (b.column > a.column ? b : a));
  await app.run((model) => model.tools.toggleToolSection("annotateDiagram"));
  await app.run((model) => model.tools.setAnnotateMode("select"));
  await app.run((model) => model.workspace.toggleButton(farthest));
  await app.run((model) => model.tools.setScaleFinderActive(false));
  expect(drawnIds(app).has(farthest.id)).toBe(true);
});
