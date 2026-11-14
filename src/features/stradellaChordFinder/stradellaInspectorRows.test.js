import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterRealizationRows } from "./stradellaInspectorRows";
import { test } from "vitest";

const bass = (pitchClass, id = `bass-${pitchClass}`) => ({ id, kind: "bass-root", pitchClass });
const chord = (name) => ({ id: `chord-${name}`, kind: "chord-major", chordRoot: name });
const make = (playbackButtons, other = {}) => ({
  playable: true,
  exact: false,
  missingPitches: ["D"],
  buttons: playbackButtons,
  playbackButtons,
  ...other,
});
const candidates = [
  make([bass("A"), chord("C")], { recommended: true }),
  make([bass("C"), bass("D"), chord("F")]),
  make([chord("C")], {
    buttons: [bass("C", "visual-guide"), chord("C")],
    exact: true,
    missingPitches: [],
  }),
  make([bass("C"), chord("C")], { exact: true, missingPitches: [] }),
  make([bass("C"), chord("F"), chord("G")]),
];
const original = candidates.map((candidate) => candidate.playbackButtons.map((b) => b.id));
const all = filterRealizationRows(candidates, "C", {
  rootInBass: false,
  exactOnly: false,
  atMostTwo: false,
});

test("Result filters keep engine order and never treat reference markers as played", () => {
  assert.deepEqual(
    all.map((row) => row.originalIndex),
    [0, 1, 2, 3, 4],
  );
  const root = filterRealizationRows(candidates, "C", {
    rootInBass: true,
    exactOnly: false,
    atMostTwo: false,
  });
  assert.deepEqual(
    root.map((row) => row.originalIndex),
    [1, 3, 4],
    "root filter includes played root in multi-bass recipes, never reference markers",
  );
  const combined = filterRealizationRows(candidates, "C", {
    rootInBass: true,
    exactOnly: true,
    atMostTwo: true,
  });
  assert.deepEqual(
    combined.map((row) => row.originalIndex),
    [3],
  );
  assert.strictEqual(
    combined[0].candidate,
    candidates[3],
    "inspector does not copy/reconstruct musical results",
  );
  const small = filterRealizationRows(candidates, "C", {
    rootInBass: false,
    exactOnly: false,
    atMostTwo: true,
  });
  assert.deepEqual(
    small.map((row) => row.originalIndex),
    [0, 2, 3],
    "three played buttons are excluded",
  );
  assert.deepEqual(
    candidates.map((candidate) => candidate.playbackButtons.map((b) => b.id)),
    original,
    "filter is read-only",
  );
  assert.deepEqual(
    filterRealizationRows([], "C", { rootInBass: true, exactOnly: true, atMostTwo: true }),
    [],
  );
});
