/** Layout-only App contracts, typed view boundaries and cross-tool
 * command ordering. Independent of React DOM and platform-native bundlers. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
const read = path => readFileSync(path, "utf8");

const js = ts.transpileModule(read("src/app/crossToolCommands.ts"), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const result = { exports: {} };
runInNewContext(js, { module: result, exports: result.exports });
const { enterProgressionAssistant, enterStradellaFinder, enterHarmonyExplorer } = result.exports;
function recorder(names) {
  const trace=[]; const ports={};
  for(const name of names) ports[name]=()=>trace.push(name);
  return {trace, ports};
}
const progression = ["navigate","clearPreview","disableStradellaFinder","disableScaleFinder","disableTrebleChordFinder","stopAbc","stopBassPattern"];
{
  const {trace,ports}=recorder(progression);
  enterProgressionAssistant(ports, "transfer");
  assert.deepEqual(trace,progression,"Transfer preserves navigation/reset/stop ordering");
}
{
  const {trace,ports}=recorder(progression);
  enterProgressionAssistant(ports, "preview");
  assert.deepEqual(trace, progression.filter(s=>s!=="clearPreview"&&s!=="stopBassPattern"),"Preview preserves current index and historical Bass Pattern behavior");
}
const finder = ["navigate","assignChord","resetRealization","enableFinder","disableScaleFinder","disableTrebleChordFinder","stopAbc"];
{
  const {trace,ports}=recorder(finder);
  enterStradellaFinder(ports,"harmony-selection");
  assert.deepEqual(trace,finder,"Harmony selection resets realization before activation");
}
{
  const {trace,ports}=recorder(finder);
  enterStradellaFinder(ports,"progression-step");
  assert.deepEqual(trace,finder.filter(s=>s!=="resetRealization"),"Progression step preserves pending realization");
}
{
  const names=["navigate","stopAllSound","stopAbc","stopBassPattern"];
  const {trace,ports}=recorder(names);
  enterHarmonyExplorer(ports);
  assert.deepEqual(trace,names,"Harmony transfer preserves audio-stop order");
}
// Eye toggle and single-step selection are verified by progression-eye-entry.test.cjs.
console.log("✓ Layout/view contracts and 5 cross-tool command traces passed");
