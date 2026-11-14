import { createToolContext } from "../../app/tools/createToolContext";
import type { useDiagramOverlays } from "../../diagram/useDiagramOverlays";
import type { useSequenceState } from "../sequences/useSequenceState";
import type { useDiagramAnnotations } from "./useDiagramAnnotations";

/** Annotate Diagram's three parts: selection and finger numbers, the
 * recorded sequence, and text notes. */
export interface AnnotateDiagramState {
  overlays: ReturnType<typeof useDiagramOverlays>;
  sequence: ReturnType<typeof useSequenceState>;
  annotations: ReturnType<typeof useDiagramAnnotations>;
}
export const [AnnotateDiagramContext, useAnnotateDiagram] =
  createToolContext<AnnotateDiagramState>("useAnnotateDiagram");
