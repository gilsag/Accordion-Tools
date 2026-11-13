import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

const serializeModes = [];
const captureModule = { exports: loadIsolated("src/diagram/stradellaBatchCapture.ts", { imports: {
  "../download": { serializeSvg: (_svg, pngSafe) => {
    serializeModes.push(pngSafe);
    return "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>";
  } },
} }) };

test("PNG export source integration regression", () => {
  for (const format of ["png", "svg"]) {
    const selections = [];
    const snapshots = captureModule.exports.captureStradellaBatch({
      candidates: [{ candidate: {}, index: 2 }],
      originalIndex: 4,
      selectIndex: (index) => selections.push(index),
      currentSvg: () => ({ viewBox: { baseVal: { width: 400, height: 240 } } }),
      filenameKey: () => "C♯",
      format,
    });
    assert.deepEqual(selections, [2, 4], "Batch capture restores the selected realization");
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].name, "001-Csharp");
    assert.equal(snapshots[0].width, 400);
    assert.equal(snapshots[0].height, 240);
  }
  assert.deepEqual(serializeModes, [true, false], "PNG capture alone uses PNG-safe serialization");
});
