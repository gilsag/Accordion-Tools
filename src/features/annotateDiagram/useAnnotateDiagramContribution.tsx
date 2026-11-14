import type { CSSProperties } from "react";
import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import { COLOR_PRESETS } from "../../app/optionLists";
import { usePlatformLanguage, usePlatformNavigation } from "../../app/platform/platformContexts";
import { DiagramAnnotationsLayer } from "../../diagram/components/DiagramAnnotationsLayer";
import {
  sequenceArrowStyleFromMode,
  sequenceModeShowsArrows,
  sequenceModeShowsNumbers,
  type SequenceStepWithButton,
} from "../../tools/sequenceTools";
import { useAnnotateDiagram } from "./annotateDiagramContext";

/** What Annotate Diagram draws, whether or not it is open: marks and
 * fingerings, the recorded sequence with its numbers and arrows, and text
 * notes. While it is open, its mode decides what a click does: Select toggles
 * the selection, Finger writes the finger, Sequence adds a step (each also
 * sounds the button), and Notes opens a note editor, on a button without
 * sound or anywhere on the diagram. */
export function useAnnotateDiagramContribution(
  sequenceStepsWithButtons: SequenceStepWithButton[],
): DiagramContribution {
  const { t } = usePlatformLanguage();
  const { activeToolSection } = usePlatformNavigation();
  const { overlays, sequence, annotations } = useAnnotateDiagram();
  const { annotateMode } = overlays;
  const notesMode = activeToolSection === "annotateDiagram" && annotateMode === "notes";
  return {
    layers: {
      overlays: overlays.overlays,
      fingeringPosition: overlays.fingeringPosition,
      sequenceSteps: sequence.sequenceSteps,
      sequenceStepsWithButtons,
      sequenceNumberPosition: sequence.sequenceNumberPosition,
      showSequenceNumbers:
        sequence.sequenceNumberPosition !== "none" &&
        sequenceModeShowsNumbers(sequence.sequenceDisplayMode),
      showSequenceArrows: sequenceModeShowsArrows(sequence.sequenceDisplayMode),
      sequenceArrowStyle: sequenceArrowStyleFromMode(sequence.sequenceDisplayMode),
      annotationActive: notesMode,
      annotationPointForButton: annotations.annotationPointForButton,
      annotationButtonAnchor: annotations.annotationButtonAnchor,
    },
    style: {
      "--sequence-color": COLOR_PRESETS[sequence.sequenceColorPreset],
      "--sequence-thickness": sequence.sequenceThickness,
      "--sequence-number-color": COLOR_PRESETS[sequence.sequenceNumberColorPreset],
      "--sequence-number-size": `${sequence.sequenceNumberFontSize}px`,
    } as CSSProperties,
    overlay: ({ viewWidth, viewHeight }) => (
      <DiagramAnnotationsLayer
        textNotes={annotations.textNotes}
        inlineAnnotationEditor={annotations.inlineAnnotationEditor}
        setInlineAnnotationEditor={annotations.setInlineAnnotationEditor}
        annotationEditorRef={annotations.annotationEditorRef}
        commitInlineAnnotation={annotations.commitInlineAnnotation}
        cancelInlineAnnotation={annotations.cancelInlineAnnotation}
        viewWidth={viewWidth}
        viewHeight={viewHeight}
        annotationPlaceholder={t("ui.annotationPlaceholder")}
      />
    ),
    onButton(button) {
      if (annotateMode === "notes") {
        annotations.beginButtonAnnotation(button);
        return "silent";
      }
      if (annotateMode === "select") overlays.toggleButtonSelected(button.id);
      else if (annotateMode === "finger") overlays.toggleButtonFinger(button.id);
      else sequence.appendRecordedButton(button.id);
    },
    onSurfaceClick: notesMode
      ? (point) => annotations.beginFreeAnnotation(point.x, point.y)
      : undefined,
  };
}
