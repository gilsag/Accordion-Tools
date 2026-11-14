import { useMemo, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import type { DiagramButton } from "../../types";
import { useSequenceResults } from "../sequences/useSequenceState";
import { AnnotateDiagramOutputContext, useAnnotateDiagram } from "./annotateDiagramContext";

/** The selected buttons and the sequence's steps as generated buttons, in
 * selection and step order. */
export function AnnotateDiagramOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { overlays, sequence } = useAnnotateDiagram();
  const { selectedButtonIds } = overlays;
  const selectedButtons = useMemo(
    () =>
      selectedButtonIds
        .map((id) => buttons.find((button) => button.id === id))
        .filter(Boolean) as DiagramButton[],
    [selectedButtonIds, buttons],
  );
  const sequenceStepsWithButtons = useSequenceResults(sequence.sequenceSteps, buttons);
  const value = useMemo(
    () => ({ selectedButtons, sequenceStepsWithButtons }),
    [selectedButtons, sequenceStepsWithButtons],
  );
  return (
    <AnnotateDiagramOutputContext.Provider value={value}>
      {children}
    </AnnotateDiagramOutputContext.Provider>
  );
}
