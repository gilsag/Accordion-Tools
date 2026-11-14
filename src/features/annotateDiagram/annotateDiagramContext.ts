import { createToolContext } from "../../app/tools/createToolContext";
import type { useDiagramOverlays } from "../../diagram/useDiagramOverlays";
import type { useSequenceResults, useSequenceState } from "./useSequenceState";
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
  /** The sequence's score. */
  sequenceRenderedNotationAbc: string;
  /** Plays the selection as an arpeggio, then together, in selection order. */
  playSelectedButtons(): void;
  /** Plays the sequence in step order once its samples are ready. */
  playRecordedSequence(): void;
};
export const [AnnotateDiagramOutputContext, useAnnotateDiagramOutput] =
  createToolContext<AnnotateDiagramOutput>("useAnnotateDiagramOutput");
