import { useCallback, useRef, useState } from "react";
import type { DiagramButton, SequenceColorPreset, SequenceDisplayMode,
  SequenceStep, NumberPosition } from "../../types";
import { getSequenceStepsWithButtons } from "../../tools/sequenceTools";

/** Owns sequence steps (added by clicks in Annotate Diagram's Sequence mode)
 * and visual-path preferences, not shared playback, manual geometry, diagrams
 * or notation rendering. Settings setters retain
 * their original identity and default values for saved JSON compatibility.
 */
export function useSequenceState() {
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [sequenceDisplayMode, setSequenceDisplayMode] =
    useState<SequenceDisplayMode>("numbers-and-curved-arrows");
  const [sequenceColorPreset, setSequenceColorPreset] =
    useState<SequenceColorPreset>("red");
  const [sequenceThickness, setSequenceThickness] = useState(3.2);
  const [sequenceArrowheadSize, setSequenceArrowheadSize] = useState(4);
  const [sequenceNumberFontSize, setSequenceNumberFontSize] = useState(10);
  const [sequenceNumberColorPreset, setSequenceNumberColorPreset] =
    useState<SequenceColorPreset>("red");
  const [sequenceNumberPosition, setSequenceNumberPosition] =
    useState<NumberPosition>("above");
  const [sequenceRenderedNotationVisible, setSequenceRenderedNotationVisible] =
    useState(false);
  const sequenceNotationRef = useRef<HTMLDivElement | null>(null);
  const appendRecordedButton = useCallback((id: string) => {
    // The step number is append-order, not a pitch, row, or sound event.
    setSequenceSteps((current) => [...current, { id, step: current.length + 1 }]);
  }, []);
  const clearSequence = useCallback(() => setSequenceSteps([]), []);
  return {
    sequenceSteps, setSequenceSteps,
    sequenceDisplayMode, setSequenceDisplayMode,
    sequenceColorPreset, setSequenceColorPreset,
    sequenceThickness, setSequenceThickness,
    sequenceArrowheadSize, setSequenceArrowheadSize,
    sequenceNumberFontSize, setSequenceNumberFontSize,
    sequenceNumberColorPreset, setSequenceNumberColorPreset,
    sequenceNumberPosition, setSequenceNumberPosition,
    sequenceRenderedNotationVisible, setSequenceRenderedNotationVisible, sequenceNotationRef,
    appendRecordedButton, clearSequence,
  };
}

/** Reconnects saved IDs to the currently rendered geometry without modifying
 * sequence order or replacing the DiagramButton instances used by sound/UI.
 */
export function useSequenceResults(sequenceSteps: SequenceStep[], buttons: DiagramButton[]) {
  return getSequenceStepsWithButtons(sequenceSteps, buttons);
}
