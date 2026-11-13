import type { TranslationKey } from "../i18n/catalog";

/** Registry of currently implemented tool sections.
 *
 * The navigation contract is intentionally independent of musical engines,
 * panel imports and sound.
 * `defaultSide` is applied when a command explicitly opens a tool; existing
 * accordion-section toggles retain their historical side behavior.
 */
type ToolDefinition = {
  workspace: "accordion" | "harmony";
  category: "finder" | "player" | "harmony" | "diagram";
  /** Translation key of the name shown in the Tools panel and the status bar. */
  titleKey: TranslationKey;
  /** Translation key of the one-line description shown while the section is closed. */
  summaryKey: TranslationKey;
  /** The instrument sides on which the Tools panel offers the tool. */
  sides: "both" | "treble" | "stradella";
  defaultSide?: "stradella";
  /** Keep the section's controls mounted after it is closed, for a panel that
   * holds choices of its own (the Progression Assistant's preset picker). */
  keepMounted?: true;
};

export const TOOL_REGISTRY = {
  scaleFinder: { workspace: "accordion", category: "finder", titleKey: "ui.scaleFinder", summaryKey: "tools.summary.scaleFinder", sides: "both" },
  chordFinder: { workspace: "accordion", category: "finder", titleKey: "tools.chordFinder", summaryKey: "tools.summary.trebleChordFinder", sides: "treble" },
  bassPatternPlayer: { workspace: "accordion", category: "player", titleKey: "ui.bassPatternPlayer", summaryKey: "tools.summary.bassPatternPlayer", sides: "stradella" },
  rhythmTrainer: { workspace: "accordion", category: "player", titleKey: "rhythm.title", summaryKey: "rhythm.summary", sides: "both" },
  abcPlayer: { workspace: "accordion", category: "player", titleKey: "ui.abcDefault", summaryKey: "tools.summary.abcPlayer", sides: "both" },
  stradellaChordFinder: { workspace: "accordion", category: "finder", titleKey: "tools.chordFinder", summaryKey: "tools.summary.stradellaChordFinder", sides: "stradella", defaultSide: "stradella" },
  harmonyExplorer: { workspace: "harmony", category: "harmony", titleKey: "tools.harmonyExplorer", summaryKey: "tools.summary.harmonyExplorer", sides: "both" },
  progressionAssistant: { workspace: "accordion", category: "harmony", titleKey: "ui.progressionAssistant", summaryKey: "tools.summary.progressionAssistant", sides: "stradella", defaultSide: "stradella", keepMounted: true },
  annotateDiagram: { workspace: "accordion", category: "diagram", titleKey: "ui.annotateDiagram", summaryKey: "tools.summary.annotateDiagram", sides: "both" },
} as const satisfies Record<string, ToolDefinition>;

export type ToolId = keyof typeof TOOL_REGISTRY;
export type ToolSection = ToolId | null;
export type WorkspaceMode = "accordion" | "harmony";

/** A missing default side means the tool leaves the current instrument side unchanged. */
export function toolDestination(tool: ToolId): { workspace: WorkspaceMode; defaultSide?: "stradella" } {
  const definition = TOOL_REGISTRY[tool];
  return {
    workspace: definition.workspace,
    ...("defaultSide" in definition ? { defaultSide: definition.defaultSide } : {}),
  };
}

/** Whether the Tools panel offers a tool on the given instrument side. */
export function toolOfferedOn(tool: ToolId, side: "treble" | "stradella"): boolean {
  const { sides } = TOOL_REGISTRY[tool];
  return sides === "both" || sides === side;
}

/** Top-to-bottom order of the sections in the Tools panel. */
export const TOOLS_PANEL_ORDER: readonly ToolId[] = [
  "harmonyExplorer",
  "scaleFinder", "chordFinder", "stradellaChordFinder", "progressionAssistant",
  "annotateDiagram", "bassPatternPlayer", "rhythmTrainer", "abcPlayer",
];

/** The tools listed in the Tools panel for a workspace and instrument side. */
export function toolsListedFor(workspace: "accordion" | "harmony", side: "treble" | "stradella"): ToolId[] {
  return TOOLS_PANEL_ORDER.filter((tool) =>
    TOOL_REGISTRY[tool].workspace === workspace && (workspace === "harmony" || toolOfferedOn(tool, side)));
}
