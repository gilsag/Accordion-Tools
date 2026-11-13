/** Stradella row labels share one font size at which each fits its own strip. */
import assert from "node:assert/strict";
import { ROW_LABEL_FONT_SIZE, fittedRowLabelFontSize } from "../../../src/diagram/rowLabelFit";
import { test } from "vitest";

const measure = (label: string) => label.length * 6; // 6 units per character at the base size

test("Labels that fit keep the base size", () => {
  assert.equal(fittedRowLabelFontSize([], measure), ROW_LABEL_FONT_SIZE);
  assert.equal(fittedRowLabelFontSize([{ label: "Bass", rightEdge: 84 }], measure), ROW_LABEL_FONT_SIZE, "a label that fits keeps the base size");
});

test("14 characters need 84 units", () => {
  assert.equal(fittedRowLabelFontSize([{ label: "Major 3rd note", rightEdge: 84 }], measure), 10.8);
});

test("A long label lower down has a wider strip and does not shrink the others", () => {
  assert.equal(fittedRowLabelFontSize([
    { label: "Bass", rightEdge: 84 }, { label: "Diminished 7th chord", rightEdge: 190 },
  ], measure), ROW_LABEL_FONT_SIZE);
});

test("The tightest row decides for all rows", () => {
  assert.equal(fittedRowLabelFontSize([
    { label: "Major 3rd note", rightEdge: 84 }, { label: "Diminished 7th chord", rightEdge: 100 },
  ], measure), 9.2);
});

test("Very large buttons", () => {
  assert.equal(fittedRowLabelFontSize([{ label: "Major 3rd note", rightEdge: 20 }], measure), 7);
});
