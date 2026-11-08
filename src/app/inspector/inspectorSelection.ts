/** The workspace reserves one inspector slot; each tool supplies its own content.
 * Adding a tool here must not create a second owner for its selection state.
 */
export type WorkspaceInspectorId = "stradellaChordFinder" | "progressionAssistant" | "abcNotation";

export type InspectorSelectionContext = {
  leftPanelMode: "tools" | "settings" | "hidden";
  workspaceMode: "accordion" | "harmony";
  side: string;
  stradellaChordFinderActive: boolean;
  activeToolSection?: string | null;
  /** The ABC Player's Show notation is on and there is a tune to draw. */
  abcNotationVisible?: boolean;
};

/** Returns the active inspector, not a new musical result or selection. */
export function resolveWorkspaceInspector(context: InspectorSelectionContext): WorkspaceInspectorId | null {
  if (context.leftPanelMode !== "tools") return null;
  if (context.workspaceMode === "accordion" && context.activeToolSection === "abcPlayer" && context.abcNotationVisible) return "abcNotation";
  if (context.workspaceMode === "accordion" && context.side === "stradella" && context.activeToolSection === "progressionAssistant") return "progressionAssistant";
  if (context.workspaceMode === "accordion" && context.side === "stradella" && context.stradellaChordFinderActive) {
    return "stradellaChordFinder";
  }
  return null;
}
