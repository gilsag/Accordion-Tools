/** Phase 5: observable navigation contracts without a DOM or native bundler. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = (path) => readFileSync(path, "utf8");
function load(path, imports) {
  const output = ts.transpileModule(source(path), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  runInNewContext(output, { module: mod, exports: mod.exports, require(id) {
    if (id in imports) return imports[id];
    throw new Error(`Unexpected dependency ${id}`);
  } }, { filename: path });
  return mod.exports;
}

const registry = load("src/app/toolRegistry.ts", {});
const ids = ["scaleFinder", "chordFinder", "abcPlayer", "bassPatternPlayer",
  "stradellaChordFinder", "harmonyExplorer", "progressionAssistant",
  "fingering", "selection", "sequences", "annotateDiagram"];
assert.deepEqual(Object.keys(registry.TOOL_REGISTRY), ids, "All eleven original tool sections registered");
for (const id of ids) {
  const destination = registry.toolDestination(id);
  assert.equal(destination.workspace, id === "harmonyExplorer" ? "harmony" : "accordion");
}
assert.equal(registry.toolDestination("progressionAssistant").defaultSide, "stradella");
assert.equal(registry.toolDestination("stradellaChordFinder").defaultSide, "stradella");
assert.equal(registry.toolDestination("scaleFinder").defaultSide, undefined);

// Simulated React hook dispatcher retains setter semantics between renders.
const slots = [];
let cursor = 0;
let pendingEffects = [];
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], value => {
      slots[index] = typeof value === "function" ? value(slots[index]) : value;
    }];
  },
  useEffect(effect) { pendingEffects.push(effect); },
};
const { useWorkspaceNavigation } = load("src/app/useWorkspaceNavigation.ts", {
  react, "./toolRegistry": registry,
});
let instrumentSide = "treble";
const sideSetCalls = [];
function setInstrumentSide(next) {
  sideSetCalls.push(next);
  instrumentSide = typeof next === "function" ? next(instrumentSide) : next;
}
function render() {
  cursor = 0;
  pendingEffects = [];
  return useWorkspaceNavigation(instrumentSide, setInstrumentSide);
}
let navigation = render();
assert.equal(navigation.leftPanelMode, "tools");
assert.equal(navigation.workspaceMode, "accordion");
assert.equal(navigation.activeToolSection, null);
assert.equal(navigation.activeSettingsSection, null);

navigation.toggleToolSection("chordFinder");
navigation = render();
assert.equal(navigation.activeToolSection, "chordFinder");
assert.equal(instrumentSide, "treble", "Ordinary toggles do not change instrument side");
navigation.toggleToolSection("chordFinder");
navigation = render();
assert.equal(navigation.activeToolSection, null, "Clicking the open section collapses it");

navigation.setPanel("tools");
navigation = render();
assert.equal(navigation.leftPanelMode, "hidden");
navigation.toggleToolSection("progressionAssistant");
navigation = render();
assert.equal(instrumentSide, "stradella", "Progression panel keeps historical side switch");
assert.equal(navigation.leftPanelMode, "hidden", "Accordion toggle does not force-open panel");
assert.equal(navigation.activeToolSection, "progressionAssistant");

navigation.navigateToTool("harmonyExplorer");
navigation = render();
assert.equal(navigation.workspaceMode, "harmony");
assert.equal(navigation.leftPanelMode, "tools");
assert.equal(navigation.activeToolSection, "harmonyExplorer");
navigation.setPanel("tools");
navigation = render();
navigation.toggleFocusPanel();
navigation = render();
assert.equal(navigation.leftPanelMode, "tools", "Harmony focus returns to Tools");

navigation.navigateToTool("stradellaChordFinder", { side: "stradella" });
navigation = render();
assert.equal(navigation.workspaceMode, "accordion");
assert.equal(navigation.activeToolSection, "stradellaChordFinder");
assert.equal(instrumentSide, "stradella");
navigation.setPanel("tools");
navigation = render();
navigation.toggleFocusPanel();
navigation = render();
assert.equal(navigation.leftPanelMode, "settings", "Accordion focus returns to Settings");
navigation.toggleSettingsSection("instrument");
navigation = render();
assert.equal(navigation.activeSettingsSection, "instrument");
// React calls the effect when the side or workspace changes; it closes settings.
pendingEffects[0]();
navigation = render();
assert.equal(navigation.activeSettingsSection, null);

navigation.selectAccordionSide("treble");
navigation = render();
assert.equal(instrumentSide, "treble");
assert.equal(navigation.workspaceMode, "accordion");
assert.ok(sideSetCalls.length >= 3);

// Keep the shell DOM classes and toolbar interactive controls stable.
const shell = source("src/app/components/AppShell.tsx");
const toolbar = source("src/app/components/WorkspaceToolbar.tsx");
const app = [source("src/App.tsx"), source("src/app/useAppController.ts"), source("src/app/views/SettingsView.tsx"), source("src/app/views/ToolsView.tsx"), source("src/app/views/WorkspaceView.tsx")].join("\n");
assert.match(shell, /className={`app density-\${density}`}/);
assert.match(shell, /style={{ gridTemplateColumns }}/);
assert.match(toolbar, /className="topbar"/);
assert.match(toolbar, /className="reset-menu-options"/);
assert.match(toolbar, /addEventListener\("keydown", closeOnEscape\)/);
assert.match(toolbar, /onToggleSound/);
assert.match(toolbar, /onDownloadDiagram/);
assert.match(app, /navigateToTool\("stradellaChordFinder", \{ side: "stradella" \}\)/);
assert.match(app, /navigateToTool\("progressionAssistant", \{ side: "stradella" \}\)/);
assert.match(app, /onSelectHarmony=\{\(\) => \{\s*navigateToTool\("harmonyExplorer"\);\s*stopAbcPlayback\(\); stopBassPatternPlayback\(\); stopAllSound\(\);/);
assert.match(app, /onSelectStradella=\{\(\) => \{ selectAccordionSide\("stradella"\); stopAbcPlayback\(\); \}\}/);
assert.match(app, /onClearWork=\{\(\) => \{ if \(workspaceMode === "harmony"\) clearHarmonyWork\(\); else resetDiagramWork\(\); \}\}/);
console.log("✓ Registry, workspace navigation, section toggles, focus behavior, toolbar command ordering and shell structure passed");
