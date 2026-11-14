/** Behavioral contracts of the Scale Finder and treble Chord Finder hooks,
 * rendered with React; the selection engines are replaced so the tests see
 * what the hooks pass them. The engines have their own regression tests in
 * test:chords.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { renderHook } from "@testing-library/react";
import { test, vi } from "vitest";
import {
  useScaleFinderResults,
  useScaleFinderState,
} from "../../../src/features/scaleFinder/useScaleFinder";
import {
  useTrebleChordFinderButtons,
  useTrebleChordFinderState,
} from "../../../src/features/trebleChordFinder/useTrebleChordFinder";

const { scaleCalls, chordCalls, scaleResultButtons, stradellaResultButtons, chordResultButtons } =
  vi.hoisted(() => ({
    scaleCalls: [],
    chordCalls: [],
    scaleResultButtons: [{ id: "treble-C" }, { id: "treble-E" }],
    stradellaResultButtons: [{ id: "stradella-C" }],
    chordResultButtons: [{ id: "treble-chord-C" }],
  }));
vi.mock("../../../src/features/scaleFinder/scaleFinderTools", async (original) => ({
  ...(await original()),
  getScaleFinderTrebleButtons: (...args) => {
    scaleCalls.push(["treble", args]);
    return scaleResultButtons;
  },
}));
vi.mock("../../../src/features/scaleFinder/stradellaScaleFinderTools", async (original) => ({
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
vi.mock("../../../src/features/trebleChordFinder/chordFinderTools", async (original) => ({
  ...(await original()),
  getChordFinderTrebleButtons: (...args) => {
    chordCalls.push(args);
    return chordResultButtons;
  },
}));

const render = (hook) => renderHook(hook).result.current;
const scale = {
  useScaleFinderResults: (args) => render(() => useScaleFinderResults(args)),
};
const chord = {
  useTrebleChordFinderButtons: (args) => render(() => useTrebleChordFinderButtons(args)),
};
const scaleState = render(useScaleFinderState);
const chordState = render(useTrebleChordFinderState);

test("Finder module defaults, physical button identities, and inactive/active selection contracts", () => {
  for (const [actual, expected] of [
    [scaleState.scaleFinderActive, false],
    [scaleState.scaleFinderRoot, "C"],
    [scaleState.scaleFinderPattern, "major-scale"],
    [scaleState.scaleFinderRowLimit, 5],
    [scaleState.scaleFinderDisplayMode, "numbers-and-straight-arrows"],
    [chordState.chordFinderActive, false],
    [chordState.showTrebleVoicingNote, true],
    [chordState.trebleChordVoicingMode, "auto"],
    [chordState.chordFinderRoot, "C"],
    [chordState.chordFinderPattern, "major-triad"],
    [chordState.chordFinderInversion, "root"],
    [chordState.chordFinderOctave, 4],
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
  for (const key of [
    "setChordFinderActive",
    "setChordFinderRoot",
    "setChordFinderPattern",
    "setChordFinderInversion",
    "setChordFinderOctave",
    "setShowTrebleVoicingNote",
    "setTrebleChordVoicingMode",
  ])
    assert.equal(typeof chordState[key], "function", `Stable setter for ${key}`);
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
  const chordArgs = {
    buttons,
    isTrebleLikeSide: true,
    chordFinderActive: false,
    chordFinderRoot: "G",
    chordFinderPattern: "minor-triad",
    chordFinderInversion: "first",
    chordFinderOctave: 3,
    trebleChordVoicingMode: "auto",
  };
  assert.equal(chord.useTrebleChordFinderButtons(chordArgs).length, 0);
  assert.equal(
    chord.useTrebleChordFinderButtons({
      ...chordArgs,
      chordFinderActive: true,
      isTrebleLikeSide: false,
    }).length,
    0,
  );
  assert.equal(chordCalls.length, 0);
  const chordButtons = chord.useTrebleChordFinderButtons({ ...chordArgs, chordFinderActive: true });
  assert.strictEqual(chordButtons, chordResultButtons);
  assert.deepEqual(chordCalls.at(-1), [buttons, "G", "minor-triad", "first", 3, "auto"]);
});
