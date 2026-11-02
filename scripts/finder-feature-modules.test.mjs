/** Behavioral contracts for the first two feature-state extractions.
 * Load TypeScript via the compiler and stub React hooks only; the musical
 * selection engines have their own regression tests in test:chords.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = (path) => readFileSync(path, "utf8");
const app = [source("src/App.tsx"), source("src/app/useAppController.ts"), source("src/app/views/SettingsView.tsx"), source("src/app/views/ToolsView.tsx"), source("src/app/views/WorkspaceView.tsx")].join("\n");
const scaleSource = source("src/features/scaleFinder/useScaleFinder.ts");
const chordSource = source("src/features/trebleChordFinder/useTrebleChordFinder.ts");

for (const [name, content] of [
  ["scaleFinder", scaleSource], ["chordFinder", chordSource],
]) {
  assert.match(app, new RegExp(`use${name === "scaleFinder" ? "ScaleFinderState" : "TrebleChordFinderState"}\\(\\)`));
  assert.doesNotMatch(app, new RegExp(`\\[${name}Active,\\s*set${name[0].toUpperCase() + name.slice(1)}Active\\]\\s*=\\s*useState`));
  assert.match(content, /export function use.*State\(/);
}

const scaleCalls = [];
const chordCalls = [];
const scaleResultButtons = [{ id: "treble-C" }, { id: "treble-E" }];
const stradellaResultButtons = [{ id: "stradella-C" }];
const chordResultButtons = [{ id: "treble-chord-C" }];
const mockReact = {
  useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
  useMemo: (factory) => factory(),
};
const scaleEngines = {
  getScaleFinderTrebleButtons: (...args) => {
    scaleCalls.push(["treble", args]);
    return scaleResultButtons;
  },
  getStradellaScaleFinderResult: (...args) => {
    scaleCalls.push(["stradella", args]);
    return {
      buttons: stradellaResultButtons, targetPitches: [0], targetNames: ["C"],
      missingPitches: [], missingNames: [], found: true,
    };
  },
};
const chordEngines = {
  getChordFinderTrebleButtons: (...args) => {
    chordCalls.push(args);
    return chordResultButtons;
  },
};
function loadModule(file, imports) {
  const compiled = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(name) {
      if (name === "react") return mockReact;
      if (name in imports) return imports[name];
      throw new Error(`Unexpected import from ${file}: ${name}`);
    },
  }, { filename: file });
  return module.exports;
}
const scale = loadModule("src/features/scaleFinder/useScaleFinder.ts", {
  "../../tools/scaleFinderTools": scaleEngines,
  "../../tools/stradellaScaleFinderTools": scaleEngines,
});
const chord = loadModule("src/features/trebleChordFinder/useTrebleChordFinder.ts", {
  "../../tools/chordFinderTools": chordEngines,
});
const scaleState = scale.useScaleFinderState();
const chordState = chord.useTrebleChordFinderState();
for (const [actual, expected] of [
  [scaleState.scaleFinderActive, false],
  [scaleState.scaleFinderRoot, "C"],
  [scaleState.scaleFinderPattern, "major-scale"],
  [scaleState.scaleFinderRowLimit, 5],
  [scaleState.scaleFinderDisplayMode, "numbers-and-straight-arrows"],
  [chordState.chordFinderActive, false],
  [chordState.showTrebleVoicingNote, true],
  [chordState.trebleChordVoicingMode, "auto"],
  [chordState.chordFinderRoot, "C"],
  [chordState.chordFinderPattern, "major-triad"],
  [chordState.chordFinderInversion, "root"],
  [chordState.chordFinderOctave, 4],
]) assert.equal(actual, expected, "Feature default unchanged from Phase 2");
for (const key of [
  "setScaleFinderActive", "setScaleFinderRoot", "setScaleFinderPattern",
  "setScaleFinderRowLimit", "setScaleFinderDisplayMode",
]) assert.equal(typeof scaleState[key], "function", `Stable setter for ${key}`);
for (const key of [
  "setChordFinderActive", "setChordFinderRoot", "setChordFinderPattern",
  "setChordFinderInversion", "setChordFinderOctave", "setShowTrebleVoicingNote",
  "setTrebleChordVoicingMode",
]) assert.equal(typeof chordState[key], "function", `Stable setter for ${key}`);

const buttons = [{ id: "b1" }, { id: "b2" }];
const scaleArgs = {
  buttons, side: "treble", isTrebleLikeSide: true,
  scaleFinderActive: false, scaleFinderRoot: "F", scaleFinderPattern: "minor-scale",
  scaleFinderRowLimit: 4,
};
let result = scale.useScaleFinderResults(scaleArgs);
assert.equal(result.scaleFinderButtons.length, 0, "Hidden scale does not highlight buttons");
assert.equal(result.stradellaScaleFinderResult.found, false, "Inactive Stradella result shape retained");
assert.equal(scaleCalls.length, 0, "Inactive treble tool does not run selection engine");
result = scale.useScaleFinderResults({ ...scaleArgs, scaleFinderActive: true });
assert.strictEqual(result.scaleFinderButtons, scaleResultButtons, "Original button identities retained");
assert.deepEqual(scaleCalls.at(-1), ["treble", [buttons, "F", "minor-scale", 4]]);
result = scale.useScaleFinderResults({ ...scaleArgs, side: "stradella", isTrebleLikeSide: false });
assert.equal(result.scaleFinderButtons.length, 0);
assert.deepEqual(scaleCalls.at(-1), ["stradella", [buttons, "F", "minor-scale"]], "Stradella result computed while hidden");
result = scale.useScaleFinderResults({ ...scaleArgs, side: "stradella", isTrebleLikeSide: false, scaleFinderActive: true });
assert.strictEqual(result.scaleFinderButtons, stradellaResultButtons);
result = scale.useScaleFinderResults({ ...scaleArgs, side: "other", isTrebleLikeSide: false, scaleFinderActive: true });
assert.equal(result.scaleFinderButtons.length, 0);

const chordArgs = {
  buttons, isTrebleLikeSide: true, chordFinderActive: false,
  chordFinderRoot: "G", chordFinderPattern: "minor-triad",
  chordFinderInversion: "first", chordFinderOctave: 3,
  trebleChordVoicingMode: "auto",
};
assert.equal(chord.useTrebleChordFinderButtons(chordArgs).length, 0);
assert.equal(chord.useTrebleChordFinderButtons({ ...chordArgs, chordFinderActive: true, isTrebleLikeSide: false }).length, 0);
assert.equal(chordCalls.length, 0);
const chordButtons = chord.useTrebleChordFinderButtons({ ...chordArgs, chordFinderActive: true });
assert.strictEqual(chordButtons, chordResultButtons);
assert.deepEqual(chordCalls.at(-1), [buttons, "G", "minor-triad", "first", 3, "auto"]);
console.log("✓ Finder module defaults, physical button identities, and inactive/active selection contracts passed");
