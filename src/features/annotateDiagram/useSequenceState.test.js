/** Annotate Diagram's sequence recording and button identities, rendered
 * with React. Sequence notation and drawing have their own tests.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { act, renderHook } from "@testing-library/react";
import { test, vi } from "vitest";
import { useSequenceResults, useSequenceState } from "./useSequenceState";

vi.mock("../../diagram/sequenceTools", async (original) => ({
  ...(await original()),
  getSequenceStepsWithButtons(steps, buttons) {
    return steps
      .map((s) => ({ ...s, button: buttons.find((b) => b.id === s.id) }))
      .filter((s) => s.button);
  },
}));

test("Sequence defaults, recording and button identities", () => {
  const physical = [
    { id: "bass-1", kind: "bass-root" },
    { id: "chord-1", kind: "chord-major" },
  ];
  const seqHook = renderHook(() => useSequenceState());
  let seq = seqHook.result.current;
  for (const [key, value] of Object.entries({
    sequenceDisplayMode: "numbers-and-curved-arrows",
    sequenceColorPreset: "red",
    sequenceThickness: 3.2,
    sequenceArrowheadSize: 4,
    sequenceNumberFontSize: 10,
    sequenceNumberColorPreset: "red",
    sequenceNumberPosition: "above",
    sequenceRenderedNotationVisible: false,
  }))
    assert.equal(seq[key], value, key);
  act(() => {
    seq.appendRecordedButton("bass-1");
    seq.appendRecordedButton("chord-1");
    seq.appendRecordedButton("bass-1");
  });
  seq = seqHook.result.current;
  assert.equal(
    JSON.stringify(seq.sequenceSteps),
    JSON.stringify([
      { id: "bass-1", step: 1 },
      { id: "chord-1", step: 2 },
      { id: "bass-1", step: 3 },
    ]),
  );
  const selected = renderHook(() => useSequenceResults(seq.sequenceSteps, physical)).result.current;
  assert.strictEqual(selected[0].button, physical[0]);
  assert.strictEqual(selected[1].button, physical[1]);
  assert.strictEqual(selected[2].button, physical[0]);
  act(() => seq.clearSequence());
  assert.equal(seqHook.result.current.sequenceSteps.length, 0);
});
