/** One display policy for every tool that exposes a staff score. The musical
 * generators remain in their features; location is never a feature concern. */
export type NotationPlacement = "right" | "below";
export type NotationKind = "rhythm" | "abc" | "bassPattern" | "sequence" | "progression" | "recording";

export type NotationSelection = {
  workspaceMode: "accordion" | "harmony";
  side: string;
  activeToolSection: string | null | undefined;
  annotateMode?: string;
  rhythm?: boolean;
  abc?: boolean;
  bassPattern?: boolean;
  sequence?: boolean;
  progression?: boolean;
  recording?: boolean;
};

export function selectNotationKind(input: NotationSelection): NotationKind | null {
  if (input.workspaceMode === "harmony") return input.recording ? "recording" : null;
  if (input.activeToolSection === "rhythmTrainer" && input.rhythm) return "rhythm";
  if (input.activeToolSection === "abcPlayer" && input.abc) return "abc";
  if (input.side !== "stradella") return input.activeToolSection === "annotateDiagram" && input.annotateMode === "sequence" && input.sequence ? "sequence" : null;
  if (input.activeToolSection === "bassPatternPlayer" && input.bassPattern) return "bassPattern";
  if (input.activeToolSection === "progressionAssistant" && input.progression) return "progression";
  if (input.activeToolSection === "annotateDiagram" && input.annotateMode === "sequence" && input.sequence) return "sequence";
  return null;
}

export function notationLocation(placement: NotationPlacement, isPhone: boolean, inspectorVisible: boolean): "right" | "below" {
  // A hidden inspector must not hide the score: the content moves below.
  return placement === "right" && !isPhone && inspectorVisible ? "right" : "below";
}
