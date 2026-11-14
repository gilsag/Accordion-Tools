import assert from "node:assert/strict";
import { notationLocation } from "../../../src/notation/notationSelection";
import { test } from "vitest";

test("A score goes right only beside an open inspector on a wide screen", () => {
  assert.equal(notationLocation("right", false, true), "right");

  assert.equal(
    notationLocation("right", false, false),
    "below",
    "Closed inspector falls back below",
  );

  assert.equal(notationLocation("right", true, true), "below", "Phone fallback");

  assert.equal(notationLocation("below", false, true), "below");
});
