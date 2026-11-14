/** The tool coordinator applies the rules that span tools to whatever
 * handles are registered. What the rules do to real tool state is covered by
 * the other tests in this folder; these cover call order and which tools are
 * called, which the rendered application cannot show without audio. */
import { expect, test } from "vitest";
import { createToolCoordinator, type ToolHandle } from "../../../src/app/toolCoordinator";
import { TOOL_REGISTRY, type ToolId } from "../../../src/app/toolRegistry";

/** A coordinator whose every tool records the commands it receives. */
function recordingCoordinator() {
  const trace: string[] = [];
  const coordinator = createToolCoordinator({ stopAllSound: () => trace.push("stopAllSound") });
  const record = (id: string): ToolHandle => ({
    activate: () => trace.push(`${id}.activate`),
    deactivate: () => trace.push(`${id}.deactivate`),
    stop: () => trace.push(`${id}.stop`),
    resetWork: (workspace) => trace.push(`${id}.resetWork(${workspace})`),
    resetPreferences: () => trace.push(`${id}.resetPreferences`),
    onLayoutChange: () => trace.push(`${id}.onLayoutChange`),
  });
  for (const id of Object.keys(TOOL_REGISTRY) as ToolId[])
    coordinator.register(id, () => record(id));
  return { coordinator, trace };
}

test("Reset work reaches every tool before sound stops", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.resetWork("accordion");
  expect(trace.at(-1)).toBe("stopAllSound");
  expect(trace.slice(0, -1)).toEqual(
    Object.keys(TOOL_REGISTRY).map((id) => `${id}.resetWork(accordion)`),
  );
});

test("opening the Stradella Chord Finder hides the other Finders, then shows its own result", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.toolToggled("stradellaChordFinder", true);
  expect(trace).toEqual([
    "scaleFinder.deactivate",
    "chordFinder.deactivate",
    "stradellaChordFinder.activate",
  ]);
});

test("opening a tool that is not a chord Finder hides only the chord Finders", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.toolToggled("abcPlayer", true);
  expect(trace).toEqual(["chordFinder.deactivate", "stradellaChordFinder.deactivate"]);
});

test("closing a Finder changes no other tool", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.toolToggled("stradellaChordFinder", false);
  expect(trace).toEqual([]);
});

test("toggling the Progression Assistant hides every Finder and stops the ABC and Bass Pattern players", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.toolToggled("progressionAssistant", false);
  expect(trace).toEqual([
    "scaleFinder.deactivate",
    "chordFinder.deactivate",
    "stradellaChordFinder.deactivate",
    "abcPlayer.stop",
    "bassPatternPlayer.stop",
  ]);
});

const STOP_ALL = [...Object.keys(TOOL_REGISTRY).map((id) => `${id}.stop`), "stopAllSound"];

test("Stop reaches every tool before sound stops", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.stopAllPlayback();
  expect(trace).toEqual(STOP_ALL);
});

test("toggling the Rhythm Trainer stops all playback", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.toolToggled("rhythmTrainer", false);
  expect(trace).toEqual(STOP_ALL);
});

test("Reset tool restores only the target tool's preferences", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.resetTool("harmonyExplorer");
  coordinator.resetTool(null);
  expect(trace).toEqual(["harmonyExplorer.resetPreferences"]);
});

test("a layout change reaches every tool", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.layoutChanged();
  expect(trace).toEqual(Object.keys(TOOL_REGISTRY).map((id) => `${id}.onLayoutChange`));
});

test("unregistering an old handle keeps the one registered after it", () => {
  const trace: string[] = [];
  const coordinator = createToolCoordinator({ stopAllSound: () => {} });
  const unregisterFirst = coordinator.register("abcPlayer", () => ({
    stop: () => trace.push("first"),
  }));
  coordinator.register("abcPlayer", () => ({ stop: () => trace.push("second") }));
  unregisterFirst();
  coordinator.toolToggled("progressionAssistant", true);
  expect(trace).toEqual(["second"]);
});

test("showing or hiding a score hides the scores its tool's registry entry lists", () => {
  // Each player hides the other players' scores; the recording hides them all.
  expect(recordedScores("abcPlayer")).toEqual(["bassPatternPlayer", "annotateDiagram"]);
  expect(recordedScores("bassPatternPlayer")).toEqual(["abcPlayer", "annotateDiagram"]);
  expect(recordedScores("annotateDiagram")).toEqual(["bassPatternPlayer", "abcPlayer"]);
  expect(recordedScores("progressionAssistant")).toEqual([
    "bassPatternPlayer",
    "abcPlayer",
    "annotateDiagram",
  ]);
  expect(recordedScores("harmonyExplorer")).toEqual([
    "bassPatternPlayer",
    "abcPlayer",
    "annotateDiagram",
    "progressionAssistant",
  ]);
});

/** The tools whose `hideScore` runs when `id`'s score is toggled. */
function recordedScores(id: ToolId) {
  const hidden: string[] = [];
  const coordinator = createToolCoordinator({ stopAllSound: () => {} });
  for (const tool of Object.keys(TOOL_REGISTRY) as ToolId[])
    coordinator.register(tool, () => ({ hideScore: () => hidden.push(tool) }));
  coordinator.scoreToggled(id);
  return hidden;
}

test("a tool's handle is the union of the parts registered for it", () => {
  const trace: string[] = [];
  const coordinator = createToolCoordinator({ stopAllSound: () => trace.push("stopAllSound") });
  coordinator.register("abcPlayer", () => ({ stop: () => trace.push("stop") }));
  const unregisterScore = coordinator.register("abcPlayer", () => ({
    hideScore: () => trace.push("hideScore"),
  }));
  coordinator.scoreToggled("bassPatternPlayer");
  coordinator.stopAllPlayback();
  unregisterScore();
  coordinator.scoreToggled("bassPatternPlayer");
  expect(trace).toEqual(["hideScore", "stop", "stopAllSound"]);
});

test("a starting player can stop one other tool or hide one Finder", () => {
  const { coordinator, trace } = recordingCoordinator();
  coordinator.stopTool("bassPatternPlayer");
  coordinator.deactivateTool("stradellaChordFinder");
  expect(trace).toEqual(["bassPatternPlayer.stop", "stradellaChordFinder.deactivate"]);
});
