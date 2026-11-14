import { useCallback, useEffect, type ReactNode } from "react";
import { KeepVisibleRequest } from "../../app/diagram/KeepVisible";
import type { DiagramButton } from "../../types";
import {
  usePlatformAppearance,
  usePlatformNavigation,
  usePlatformTools,
} from "../../app/platform/platformContexts";
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
  const { activeToolSection } = usePlatformNavigation();
  const { coordinator } = usePlatformTools();
  const { setSequenceRenderedNotationVisible } = sequence;
  useToolHandle("annotateDiagram", {
    resetWork: (workspace) => {
      if (workspace === "accordion") clearMarks();
    },
    onLayoutChange: clearMarks,
    hideScore: () => setSequenceRenderedNotationVisible(false),
  });
  function toggleSequenceNotation() {
    setSequenceRenderedNotationVisible((current) => !current);
    coordinator.scoreToggled("annotateDiagram");
  }
  // The sequence's score belongs to Sequence mode: leaving the mode or
  // closing the tool hides it.
  const { annotateMode } = overlays;
  useEffect(() => {
    if (activeToolSection !== "annotateDiagram" || annotateMode !== "sequence")
      setSequenceRenderedNotationVisible(false);
  }, [activeToolSection, annotateMode, setSequenceRenderedNotationVisible]);
  // On a compact treble size, the diagram keeps the marked buttons on screen.
  const { overlays: overlayMap } = overlays;
  const { sequenceSteps } = sequence;
  const keepMarksVisible = useCallback(
    (reference: DiagramButton[]) => {
      const markedIds = new Set([
        ...Object.entries(overlayMap)
          .filter(([, overlay]) => overlay.selected || overlay.finger)
          .map(([id]) => id),
        ...sequenceSteps.map((step) => step.id),
      ]);
      return reference.filter((button) => markedIds.has(button.id));
    },
    [overlayMap, sequenceSteps],
  );
  return (
    <AnnotateDiagramContext.Provider
      value={{ overlays, sequence, annotations, toggleSequenceNotation }}
    >
      <KeepVisibleRequest request={keepMarksVisible}>{children}</KeepVisibleRequest>
    </AnnotateDiagramContext.Provider>
  );
}
