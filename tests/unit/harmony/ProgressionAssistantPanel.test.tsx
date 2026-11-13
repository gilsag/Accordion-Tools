// @vitest-environment jsdom
/** The Progression Assistant panel as the player sees it: the per-chord
 * "show notes" toggle and the preset/manual entry modes. Rendered with the
 * real component, real translations and a real optimized plan. */
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ProgressionAssistantPanel } from "../../../src/components/tools/ProgressionAssistantPanel";
import { generateStradella } from "../../../src/stradella";
import { optimizeStradellaProgression, type HarmonyProgressionChord } from "../../../src/tools/harmonyExplorer/progression";

afterEach(cleanup);

const buttons = generateStradella("120", 24, 6, "natural", 0);
const progression: HarmonyProgressionChord[] = [
  { id: "first-C", rootPc: 0, pattern: "major-triad", sectorIndex: 0 },
  { id: "second-G", rootPc: 7, pattern: "dominant7", sectorIndex: 0 },
];
const plan = optimizeStradellaProgression(buttons, progression, {
  allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0, maxRealizationsPerChord: 5,
});

function renderPanel(overrides: Partial<Parameters<typeof ProgressionAssistantPanel>[0]> = {}) {
  const noop = () => {};
  const onToggleStepNotes = vi.fn();
  const props: Parameters<typeof ProgressionAssistantPanel>[0] = {
    chordDisplayStyle: "compact", progression, plan,
    presetDefinitions: [{ id: "i-iv-v-i", name: "I IV V I" }], onUsePreset: noop,
    realizationOptions: Object.fromEntries(progression.map((chord) =>
      [chord.id, [{ result: plan.steps.find((step) => step.chord.id === chord.id)!.result, realizationIndex: 0 }]])),
    realizationKeys: {}, onCycleRealization: noop, manualRoot: "C", onManualRootChange: noop,
    manualPattern: "major-triad", onManualPatternChange: noop, handMovementWeight: 0.65,
    rootPosition: true, onRootPositionChange: noop, pathVisible: false, onPathVisibleChange: noop,
    onHandMovementWeightChange: noop, voiceLeadingWeight: 0.35, onVoiceLeadingWeightChange: noop,
    rhythmPattern: "waltz", onRhythmPatternChange: noop, tempoBpm: 120, onTempoBpmChange: noop,
    noteStepId: "first-C", onToggleStepNotes, onAddManualChord: noop,
    onRemoveChord: noop, onMoveChord: noop, onClear: noop,
    ...overrides,
  };
  return { ...render(<ProgressionAssistantPanel {...props} />), onToggleStepNotes };
}

describe("show-notes toggle", () => {
  test("one toggle per chord, pressed only for the chord whose notes are shown", () => {
    renderPanel();
    const hide = screen.getByRole("button", { name: /Hide diagram notes for/ });
    const show = screen.getByRole("button", { name: /Show diagram notes for/ });
    expect(hide.getAttribute("aria-pressed")).toBe("true");
    expect(show.getAttribute("aria-pressed")).toBe("false");
  });

  test("clicking a toggle reports that chord's id and nothing else", () => {
    const { onToggleStepNotes } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /Show diagram notes for/ }));
    expect(onToggleStepNotes.mock.calls).toEqual([["second-G"]]);
  });
});

describe("entry mode", () => {
  const entryMode = () => within(screen.getByRole("group", { name: "Add chords" }));

  test("manual entry offers Add chord next to Clear, and no shortcut to the Chord Finder", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "Add chord" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open preview in Chord Finder" })).toBeNull();
  });

  test("switching to presets replaces Add chord with Load preset, and back again", () => {
    renderPanel();
    fireEvent.click(entryMode().getByRole("button", { name: /preset/i }));
    expect(screen.getByRole("button", { name: "Load preset" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add chord" })).toBeNull();

    fireEvent.click(entryMode().getByRole("button", { name: "Manual" }));
    expect(screen.getByRole("button", { name: "Add chord" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Load preset" })).toBeNull();
  });
});
