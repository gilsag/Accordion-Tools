/** Layout-only App contracts, typed view boundaries and cross-tool
 * command ordering. Independent of React DOM and platform-native bundlers. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
const read = path => readFileSync(path, "utf8");
const app = read("src/App.tsx");
const controller = read("src/app/useAppController.ts");
const settings = read("src/app/views/SettingsView.tsx");
const tools = read("src/app/views/ToolsView.tsx");
const workspace = read("src/app/views/WorkspaceView.tsx");

assert.match(app, /useAppController\(\)/, "App consumes the typed application controller");
for (const section of ["SettingsView", "ToolsView", "WorkspaceView"])
  assert.ok(app.includes(`<${section} model={model.${section.replace("View", "").toLowerCase()}}`), `${section} remains assembled by App`);
assert.match(settings, /settings\.language/, "Settings controls render from their own view");
assert.match(tools, /stradellaChordFinder/, "Tool UI renders from its own view");
assert.match(workspace, /DiagramSvgSurface/, "Workspace SVG remains in its own view");
assert.doesNotMatch(app, /useState\(|<DiagramSvgSurface|<HarmonyExplorerPanel|<section className="control-section"/, "App has no feature state or tool markup");
assert.ok(controller.includes("settings: {") && controller.includes("tools: {") && controller.includes("workspace: {"), "Views receive separate typed prop groups");
assert.doesNotMatch(controller, /<section className="control-section"|<DiagramSvgSurface/, "Controller does not render view markup");

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
assert.ok(/realizationAnnotation\(progressionNoteRoot, progressionNotePattern, harmonyProgressionNoteStep\.result/.test(controller),
  "Progression notes use the selected step's actual Finder result, not guide highlights");
// Eye toggle and single-step selection are verified by progression-eye-entry.test.cjs.
console.log("✓ Layout/view contracts and 5 cross-tool command traces passed");
