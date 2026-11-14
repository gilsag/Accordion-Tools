import type { ReactNode } from "react";
import { usePlatformAppearance } from "../../app/platform/platformContexts";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { useDiagramOverlays } from "../../diagram/useDiagramOverlays";
import { useSequenceState } from "../sequences/useSequenceState";
import { AnnotateDiagramContext } from "./annotateDiagramContext";
import { useDiagramAnnotations } from "./useDiagramAnnotations";

/** Owns the marks on the diagram: selection, finger numbers, the sequence and
 * text notes, with their display preferences. Marks are tied to button
 * identities, so Reset work and a change of physical layout clear them. */
export function AnnotateDiagramProvider({ children }: { children: ReactNode }) {
  const { buttonSize } = usePlatformAppearance();
  const overlays = useDiagramOverlays();
  const sequence = useSequenceState();
  const annotations = useDiagramAnnotations(buttonSize);
  useOwnedSettings("annotateDiagram", { ...overlays, ...sequence, ...annotations });
  function clearMarks() {
    overlays.setOverlays({});
    sequence.setSequenceSteps([]);
    annotations.setTextNotes([]);
  }
  useToolHandle("annotateDiagram", {
    resetWork: (workspace) => {
      if (workspace === "accordion") clearMarks();
    },
    onLayoutChange: clearMarks,
  });
  return (
    <AnnotateDiagramContext.Provider value={{ overlays, sequence, annotations }}>
      {children}
    </AnnotateDiagramContext.Provider>
  );
}
