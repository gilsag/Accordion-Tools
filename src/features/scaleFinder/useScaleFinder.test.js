/** Behavioral contracts of the Scale Finder hooks, rendered with React; the
 * selection engines are replaced so the tests see what the hooks pass them.
 * The engines have their own regression tests.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { renderHook } from "@testing-library/react";
import { test, vi } from "vitest";
import { useScaleFinderResults, useScaleFinderState } from "./useScaleFinder";

const { scaleCalls, scaleResultButtons, stradellaResultButtons } = vi.hoisted(() => ({
  scaleCalls: [],
  scaleResultButtons: [{ id: "treble-C" }, { id: "treble-E" }],
  stradellaResultButtons: [{ id: "stradella-C" }],
}));
vi.mock("./scaleFinderTools", async (original) => ({
  ...(await original()),
  getScaleFinderTrebleButtons: (...args) => {
    scaleCalls.push(["treble", args]);
    return scaleResultButtons;
  },
}));
vi.mock("./stradellaScaleFinderTools", async (original) => ({
  ...(await original()),
  getStradellaScaleFinderResult: (...args) => {
    scaleCalls.push(["stradella", args]);
    return {
      buttons: stradellaResultButtons,
      targetPitches: [0],
      targetNames: ["C"],
      missingPitches: [],
      missingNames: [],
      found: true,
    };
  },
}));

const render = (hook) => renderHook(hook).result.current;
const scale = { useScaleFinderResults: (args) => render(() => useScaleFinderResults(args)) };
const scaleState = render(useScaleFinderState);

test("Scale Finder defaults, button identities, and inactive/active selection contracts", () => {
  for (const [actual, expected] of [
    [scaleState.scaleFinderActive, false],
    [scaleState.scaleFinderRoot, "C"],
    [scaleState.scaleFinderPattern, "major-scale"],
    [scaleState.scaleFinderRowLimit, 5],
    [scaleState.scaleFinderDisplayMode, "numbers-and-straight-arrows"],
  ])
    assert.equal(actual, expected, "Feature default unchanged from verified baseline");
  for (const key of [
    "setScaleFinderActive",
    "setScaleFinderRoot",
    "setScaleFinderPattern",
    "setScaleFinderRowLimit",
    "setScaleFinderDisplayMode",
  ])
    assert.equal(typeof scaleState[key], "function", `Stable setter for ${key}`);
  const buttons = [{ id: "b1" }, { id: "b2" }];
  const scaleArgs = {
    buttons,
    side: "treble",
    isTrebleLikeSide: true,
    scaleFinderActive: false,
    scaleFinderRoot: "F",
    scaleFinderPattern: "minor-scale",
    scaleFinderRowLimit: 4,
  };
  let result = scale.useScaleFinderResults(scaleArgs);
  assert.equal(result.scaleFinderButtons.length, 0, "Hidden scale does not highlight buttons");
  assert.equal(
    result.stradellaScaleFinderResult.found,
    false,
    "Inactive Stradella result shape retained",
  );
  assert.equal(scaleCalls.length, 0, "Inactive treble tool does not run selection engine");
  result = scale.useScaleFinderResults({ ...scaleArgs, scaleFinderActive: true });
  assert.strictEqual(
    result.scaleFinderButtons,
    scaleResultButtons,
    "Original button identities retained",
  );
  assert.deepEqual(scaleCalls.at(-1), ["treble", [buttons, "F", "minor-scale", 4]]);
  result = scale.useScaleFinderResults({
    ...scaleArgs,
    side: "stradella",
    isTrebleLikeSide: false,
  });
  assert.equal(result.scaleFinderButtons.length, 0);
  assert.deepEqual(
    scaleCalls.at(-1),
    ["stradella", [buttons, "F", "minor-scale"]],
    "Stradella result computed while hidden",
  );
  result = scale.useScaleFinderResults({
    ...scaleArgs,
    side: "stradella",
    isTrebleLikeSide: false,
    scaleFinderActive: true,
  });
  assert.strictEqual(result.scaleFinderButtons, stradellaResultButtons);
  result = scale.useScaleFinderResults({
    ...scaleArgs,
    side: "other",
    isTrebleLikeSide: false,
    scaleFinderActive: true,
  });
  assert.equal(result.scaleFinderButtons.length, 0);
});
