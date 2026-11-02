import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const download = readFileSync("src/download.ts", "utf8");
const raster = readFileSync("src/svgRasterExport.ts", "utf8");

assert.match(download, /if \(pngSafe\) makeSvgCanvasSafe\(svgElement, clone\)/);
assert.match(download, /downloadPng\([\s\S]*?serializeSvg\(svgElement, true\)/);
assert.match(download, /svgStringToPngBytes\(svgString, width, height\)/);
assert.match(download, /catch \(error\) \{[\s\S]*?window\.alert/);
// Regression: live Stradella batch capture must request PNG-safe SVG serialization
// only for PNG. Exercise the actual export boundary rather than assuming the
// implementation remains in App.tsx (it moved during modularization).
const source = readFileSync("src/diagram/stradellaBatchCapture.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const captureModule = { exports: {} };
const serializeModes = [];
runInNewContext(compiled, {
  module: captureModule,
  exports: captureModule.exports,
  require(name) {
    assert.equal(name, "../download");
    return { serializeSvg: (_svg, pngSafe) => {
      serializeModes.push(pngSafe);
      return "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>";
    } };
  },
}, { filename: "src/diagram/stradellaBatchCapture.ts" });
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
assert.match(raster, /emitNestedSvg\(original, replacement, inverse\)/);
assert.match(raster, /emitTextLines\(original, replacement, inverse\)/);
assert.match(raster, /copied\.replaceWith\(replacement\)/);
assert.match(raster, /source\.contains\(owningSvg\)/);
console.log("PNG export source integration regression passed.");
