import assert from "node:assert/strict";
import { addNativeNoteNames, noteName } from "../../../src/notation/nativeNoteNames";
import { test } from "vitest";

test("Native note annotations, intact durations and imported-score safeguards", () => {
  assert.equal(noteName("C,,"), "C");

  assert.equal(noteName("^f"), "F♯");

  assert.equal(noteName("_B,"), "B♭");

  assert.equal(noteName("=C"), "C♮");

  assert.equal(noteName("z"), null);

  const original = 'X:1\n%%score 1 2\nM:3/4\nL:1/4\nK:C\nV:1 clef=treble\nV:2 clef=bass\n[V:1] C D E | F2 G |]\n[V:2] C, "^CM"E "^CM"E | z3 |]';

  const annotated = addNativeNoteNames(original);

  assert.match(annotated,/"_C"C "_D"D "_E"E/);

  assert.match(annotated,/"\^CM""_E"E/);

  assert.match(annotated,/"_C"C,/);

  assert.equal(addNativeNoteNames("X:1\nK:G\nF G |",true),"X:1\nK:G\nF G |","Unsafe imported key is unchanged");

  assert.match(addNativeNoteNames("X:1\nK:C\nC D |",true),/"_C"C/);

  assert.match(addNativeNoteNames("X:1\nK:C\nCDEF |",true),/"_C"C"_D"D"_E"E"_F"F/, "Contiguous ABC notes each get one native annotation");
});
