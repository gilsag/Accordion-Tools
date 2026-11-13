import assert from "node:assert/strict";
import { selectNotationKind, notationLocation } from "../../../src/notation/notationSelection";
import { test } from "vitest";

const base = {workspaceMode: "accordion" as const, side: "stradella", activeToolSection: "rhythmTrainer", rhythm: true};

test("Shared score selection, position, inspector-close and phone fallbacks", () => {
  assert.equal(selectNotationKind(base), "rhythm");

  assert.equal(selectNotationKind({...base, activeToolSection: "abcPlayer", rhythm: false, abc: true}), "abc");

  assert.equal(selectNotationKind({...base, activeToolSection: "bassPatternPlayer", rhythm: false, bassPattern: true}), "bassPattern");

  assert.equal(selectNotationKind({...base, activeToolSection: "annotateDiagram", annotateMode: "sequence", rhythm: false, sequence: true}), "sequence");

  assert.equal(selectNotationKind({...base, activeToolSection: "progressionAssistant", rhythm: false, progression: true}), "progression");

  assert.equal(selectNotationKind({...base, workspaceMode: "harmony", rhythm: false, recording: true}), "recording");

  assert.equal(selectNotationKind({...base, rhythm: false}), null);

  assert.equal(notationLocation("right", false, true), "right");

  assert.equal(notationLocation("right", false, false), "below", "Closed inspector falls back below");

  assert.equal(notationLocation("right", true, true), "below", "Phone fallback");

  assert.equal(notationLocation("below", false, true), "below");
});
