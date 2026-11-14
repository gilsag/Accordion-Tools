/** Observable navigation contracts: the tool registry, section toggling and
 * panel state, with the navigation hook rendered by React.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { test } from "vitest";
import * as registry from "../../../src/app/toolRegistry";
import { useWorkspaceNavigation } from "../../../src/app/useWorkspaceNavigation";
const ids = [
  "scaleFinder",
  "chordFinder",
  "bassPatternPlayer",
  "rhythmTrainer",
  "abcPlayer",
  "stradellaChordFinder",
  "harmonyExplorer",
  "progressionAssistant",
  "annotateDiagram",
];

test("The registry lists nine tools with their workspace and default side", () => {
  assert.deepEqual(
    Object.keys(registry.TOOL_REGISTRY),
    ids,
    "All nine tool sections registered (Selection, Fingering and Sequence are Annotate Diagram modes)",
  );
  for (const id of ids) {
    const destination = registry.toolDestination(id);
    assert.equal(destination.workspace, id === "harmonyExplorer" ? "harmony" : "accordion");
  }
  assert.equal(registry.toolDestination("progressionAssistant").defaultSide, "stradella");
  assert.equal(registry.toolDestination("stradellaChordFinder").defaultSide, "stradella");
  assert.equal(registry.toolDestination("scaleFinder").defaultSide, undefined);
});

test("Navigation keeps its state between renders and moves the instrument side when a tool needs it", () => {
  const sideSetCalls = [];
  const hook = renderHook(() => {
    const [side, setSide] = useState("treble");
    const setInstrumentSide = (next) => {
      sideSetCalls.push(next);
      setSide(next);
    };
    return { navigation: useWorkspaceNavigation(side, setInstrumentSide), side };
  });
  const render = () => hook.result.current.navigation;
  const side = () => hook.result.current.side;
  let navigation = render();
  assert.equal(navigation.leftPanelMode, "tools");
  assert.equal(navigation.workspaceMode, "accordion");
  assert.equal(navigation.activeToolSection, null);
  assert.equal(navigation.activeSettingsSection, null);
  act(() => navigation.toggleToolSection("chordFinder"));
  navigation = render();
  assert.equal(navigation.activeToolSection, "chordFinder");
  assert.equal(side(), "treble", "Ordinary toggles do not change instrument side");
  act(() => navigation.toggleToolSection("chordFinder"));
  navigation = render();
  assert.equal(navigation.activeToolSection, null, "Clicking the open section collapses it");
  act(() => navigation.setPanel("tools"));
  navigation = render();
  assert.equal(navigation.leftPanelMode, "hidden");
  act(() => navigation.toggleToolSection("progressionAssistant"));
  navigation = render();
  assert.equal(side(), "stradella", "Progression panel keeps historical side switch");
  assert.equal(navigation.leftPanelMode, "hidden", "Accordion toggle does not force-open panel");
  assert.equal(navigation.activeToolSection, "progressionAssistant");
  act(() => navigation.navigateToTool("harmonyExplorer"));
  navigation = render();
  assert.equal(navigation.workspaceMode, "harmony");
  assert.equal(navigation.leftPanelMode, "tools");
  assert.equal(navigation.activeToolSection, "harmonyExplorer");
  act(() => navigation.setPanel("tools"));
  navigation = render();
  act(() => navigation.toggleFocusPanel());
  navigation = render();
  assert.equal(navigation.leftPanelMode, "tools", "Harmony focus returns to Tools");
  act(() => navigation.navigateToTool("stradellaChordFinder", { side: "stradella" }));
  navigation = render();
  assert.equal(navigation.workspaceMode, "accordion");
  assert.equal(navigation.activeToolSection, "stradellaChordFinder");
  assert.equal(side(), "stradella");
  act(() => navigation.setPanel("tools"));
  navigation = render();
  act(() => navigation.toggleFocusPanel());
  navigation = render();
  assert.equal(navigation.leftPanelMode, "settings", "Accordion focus returns to Settings");
  act(() => navigation.toggleSettingsSection("instrument"));
  navigation = render();
  assert.equal(navigation.activeSettingsSection, "instrument");
  // Changing the side or the workspace closes the open settings section.
  act(() => navigation.selectAccordionSide("treble"));
  navigation = render();
  assert.equal(navigation.activeSettingsSection, null);
  assert.equal(side(), "treble");
  assert.equal(navigation.workspaceMode, "accordion");
  assert.ok(sideSetCalls.length >= 3);
});
