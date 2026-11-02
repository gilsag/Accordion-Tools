import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const download = readFileSync("src/download.ts", "utf8");
const raster = readFileSync("src/svgRasterExport.ts", "utf8");
const app = [readFileSync("src/App.tsx", "utf8"), readFileSync("src/app/useAppController.ts", "utf8"), readFileSync("src/app/views/SettingsView.tsx", "utf8"), readFileSync("src/app/views/ToolsView.tsx", "utf8"), readFileSync("src/app/views/WorkspaceView.tsx", "utf8")].join("\n");

assert.match(download, /if \(pngSafe\) makeSvgCanvasSafe\(svgElement, clone\)/);
assert.match(download, /downloadPng\([\s\S]*?serializeSvg\(svgElement, true\)/);
assert.match(download, /svgStringToPngBytes\(svgString, width, height\)/);
assert.match(download, /catch \(error\) \{[\s\S]*?window\.alert/);
assert.match(app, /svg: serializeSvg\(svg, downloadFormat === "png"\)/);
assert.match(raster, /emitNestedSvg\(original, replacement, inverse\)/);
assert.match(raster, /emitTextLines\(original, replacement, inverse\)/);
assert.match(raster, /copied\.replaceWith\(replacement\)/);
assert.match(raster, /source\.contains\(owningSvg\)/);
console.log("PNG export source integration regression passed.");
