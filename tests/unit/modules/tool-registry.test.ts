/** The registries that drive the Tools and Settings panels: which sections
 * are listed where, in which order, and that each one is complete. */
import { describe, expect, test } from "vitest";
import { TOOL_REGISTRY, toolsListedFor, type ToolId } from "../../../src/app/toolRegistry";
import { TOOL_SECTIONS } from "../../../src/app/toolSections";
import { SETTINGS_SECTIONS } from "../../../src/app/settingsSections";
import { translate } from "../../../src/i18n/catalog";

const TOOL_IDS = Object.keys(TOOL_REGISTRY) as ToolId[];

describe("Tools panel", () => {
  test("the Stradella side lists its finder, the assistant and the bass player", () => {
    expect(toolsListedFor("accordion", "stradella")).toEqual([
      "scaleFinder", "stradellaChordFinder", "progressionAssistant",
      "annotateDiagram", "bassPatternPlayer", "rhythmTrainer", "abcPlayer",
    ]);
  });

  test("the treble side lists its own Chord Finder and no Stradella-only tool", () => {
    expect(toolsListedFor("accordion", "treble")).toEqual([
      "scaleFinder", "chordFinder", "annotateDiagram", "rhythmTrainer", "abcPlayer",
    ]);
  });

  test("the Harmony workspace lists the Harmony Explorer alone, on either side", () => {
    expect(toolsListedFor("harmony", "stradella")).toEqual(["harmonyExplorer"]);
    expect(toolsListedFor("harmony", "treble")).toEqual(["harmonyExplorer"]);
  });

  test("every registered tool has controls, a name and a summary, and is listed somewhere", () => {
    const listed = new Set([
      ...toolsListedFor("accordion", "stradella"), ...toolsListedFor("accordion", "treble"), ...toolsListedFor("harmony", "treble"),
    ]);
    for (const tool of TOOL_IDS) {
      expect(TOOL_SECTIONS[tool], `${tool} has no section component`).toBeTruthy();
      expect(listed.has(tool), `${tool} is never listed`).toBe(true);
      const { titleKey, summaryKey } = TOOL_REGISTRY[tool];
      expect(translate("en", titleKey)).not.toBe(titleKey);
      expect(translate("en", summaryKey)).not.toBe(summaryKey);
    }
    expect(Object.keys(TOOL_SECTIONS).sort()).toEqual([...TOOL_IDS].sort());
  });
});

describe("Settings panel", () => {
  const listedIn = (workspace: "accordion" | "harmony") =>
    SETTINGS_SECTIONS.filter((section) => section.workspace === "both" || section.workspace === workspace).map(({ id }) => id);

  test("accordion workspaces list the instrument, notation, appearance, sound and title sections", () => {
    expect(listedIn("accordion")).toEqual(["instrument", "notation", "musicNotation", "appearance", "sound", "title", "about"]);
  });

  test("the Harmony workspace lists its own appearance and Harmony sections", () => {
    expect(listedIn("harmony")).toEqual(["musicNotation", "appearance", "sound", "harmony", "about"]);
  });

  test("a section id appears once per workspace, so one section is open at a time", () => {
    for (const workspace of ["accordion", "harmony"] as const) {
      const ids = listedIn(workspace);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test("every section has a translated title", () => {
    for (const { titleKey, introKey } of SETTINGS_SECTIONS) {
      expect(translate("en", titleKey)).not.toBe(titleKey);
      if (introKey) expect(translate("en", introKey)).not.toBe(introKey);
    }
  });
});
