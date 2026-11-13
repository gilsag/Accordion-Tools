/** Observable navigation contracts: the tool registry, section toggling and panel state. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

const source = (path) => readFileSync(path, "utf8");
const load = (path, imports) => loadIsolated(path, { imports });
const registry = load("src/app/toolRegistry.ts", {});
const ids = ["scaleFinder", "chordFinder", "bassPatternPlayer", "rhythmTrainer", "abcPlayer",
  "stradellaChordFinder", "harmonyExplorer", "progressionAssistant",
  "annotateDiagram"];

test("The registry lists nine tools with their workspace and default side", () => {
  assert.deepEqual(Object.keys(registry.TOOL_REGISTRY), ids, "All nine tool sections registered (Selection, Fingering and Sequence are Annotate Diagram modes)");
  for (const id of ids) {
    const destination = registry.toolDestination(id);
    assert.equal(destination.workspace, id === "harmonyExplorer" ? "harmony" : "accordion");
  }
  assert.equal(registry.toolDestination("progressionAssistant").defaultSide, "stradella");
  assert.equal(registry.toolDestination("stradellaChordFinder").defaultSide, "stradella");
  assert.equal(registry.toolDestination("scaleFinder").defaultSide, undefined);
});

test("Simulated React hook dispatcher retains setter semantics between renders", () => {
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
});
