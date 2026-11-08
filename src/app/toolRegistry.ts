/** Registry of currently implemented tool sections.
 *
 * The navigation contract is intentionally independent of musical engines,
 * panel imports and sound. It does not yet determine lazy-loaded components.
 * `defaultSide` is applied when a command explicitly opens a tool; existing
 * accordion-section toggles retain their historical side behavior.
 */
export const TOOL_REGISTRY = {
  scaleFinder: { workspace: "accordion", category: "finder" },
  chordFinder: { workspace: "accordion", category: "finder" },
  abcPlayer: { workspace: "accordion", category: "player" },
  bassPatternPlayer: { workspace: "accordion", category: "player" },
  stradellaChordFinder: { workspace: "accordion", category: "finder", defaultSide: "stradella" },
  harmonyExplorer: { workspace: "harmony", category: "harmony" },
  progressionAssistant: { workspace: "accordion", category: "harmony", defaultSide: "stradella" },
  annotateDiagram: { workspace: "accordion", category: "diagram" },
} as const;

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
