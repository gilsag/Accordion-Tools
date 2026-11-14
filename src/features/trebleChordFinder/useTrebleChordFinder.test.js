/** Behavioral contracts of the treble Chord Finder hooks, rendered with
 * React; the selection engine is replaced so the tests see what the hooks
 * pass it. The engine has its own regression tests.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { renderHook } from "@testing-library/react";
import { test, vi } from "vitest";
import { useTrebleChordFinderButtons, useTrebleChordFinderState } from "./useTrebleChordFinder";

const { chordCalls, chordResultButtons } = vi.hoisted(() => ({
  chordCalls: [],
  chordResultButtons: [{ id: "treble-chord-C" }],
}));
vi.mock("./chordFinderTools", async (original) => ({
  ...(await original()),
  getChordFinderTrebleButtons: (...args) => {
    chordCalls.push(args);
    return chordResultButtons;
  },
}));

const render = (hook) => renderHook(hook).result.current;
const chord = {
  useTrebleChordFinderButtons: (args) => render(() => useTrebleChordFinderButtons(args)),
};
const chordState = render(useTrebleChordFinderState);

test("Treble Chord Finder defaults, button identities, and inactive/active selection contracts", () => {
  for (const [actual, expected] of [
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
