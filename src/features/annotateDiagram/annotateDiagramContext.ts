import { createToolContext } from "../../app/tools/createToolContext";
import type { useDiagramOverlays } from "../../diagram/useDiagramOverlays";
import type { useSequenceResults, useSequenceState } from "../sequences/useSequenceState";
import type { DiagramButton } from "../../types";
import type { useDiagramAnnotations } from "./useDiagramAnnotations";

/** Annotate Diagram's three parts: selection and finger numbers, the
 * recorded sequence, and text notes. */
export interface AnnotateDiagramState {
  overlays: ReturnType<typeof useDiagramOverlays>;
  sequence: ReturnType<typeof useSequenceState>;
  annotations: ReturnType<typeof useDiagramAnnotations>;
  /** Shows or hides the sequence's score, hiding the players' scores. */
  toggleSequenceNotation(): void;
}
export const [AnnotateDiagramContext, useAnnotateDiagram] =
  createToolContext<AnnotateDiagramState>("useAnnotateDiagram");

/** What the tool derives from its state and the diagram's buttons. */
export type AnnotateDiagramOutput = {
  selectedButtons: DiagramButton[];
  sequenceStepsWithButtons: ReturnType<typeof useSequenceResults>;
};
export const [AnnotateDiagramOutputContext, useAnnotateDiagramOutput] =
  createToolContext<AnnotateDiagramOutput>("useAnnotateDiagramOutput");
