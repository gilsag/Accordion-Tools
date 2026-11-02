import { useEffect, useRef, useState } from "react";
import type { DiagramAnnotationAnchor, DiagramButton, FontFamily, TextNote } from "../../types";
import { makeTextNote } from "../../tools/textNoteTools";

/** Owns annotation drafts and stored text notes. The existing SVG renderer is
 * responsible for screen-to-viewBox conversion; these positions remain in the
 * unchanged SVG coordinate system for drawing and export.
 */
export function useDiagramAnnotations(buttonSize: number) {
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [textNoteFontSize, setTextNoteFontSize] = useState(15);
  const [textNoteColor, setTextNoteColor] = useState("#172033");
  const [textNoteFont, setTextNoteFont] = useState<FontFamily>("system");
  const [annotationBold, setAnnotationBold] = useState(false);
  const [annotationItalic, setAnnotationItalic] = useState(false);
  const [annotationOffsetPercent, setAnnotationOffsetPercent] = useState(50);
  const [annotationButtonAnchor, setAnnotationButtonAnchor] =
    useState<DiagramAnnotationAnchor>("center");
  const annotationEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [inlineAnnotationEditor, setInlineAnnotationEditor] = useState<{
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
    font: FontFamily;
    bold: boolean;
    italic: boolean;
    annotationOffsetPercent: number;
    attachedToButtonId?: string;
    annotationAnchor?: DiagramAnnotationAnchor;
  } | null>(null);
  useEffect(() => {
    if (inlineAnnotationEditor) {
      window.setTimeout(() => annotationEditorRef.current?.focus(), 0);
    }
  }, [inlineAnnotationEditor]);


  /** Removes all diagram annotations and closes any inline editor. */
  function clearTextNotes() {
    setTextNotes([]);
    setInlineAnnotationEditor(null);
  }

  /** Removes one diagram annotation. */
  function deleteTextNote(noteId: string) {
    setTextNotes((current) => current.filter((note) => note.id !== noteId));
  }

  function annotationLocationLabel(note: TextNote) {
    if (!note.attachedToButtonId) return "Free label";
    const anchorLabel = (note.annotationAnchor ?? "center")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase();
    return `Button · ${anchorLabel}`;
  }

  function annotationPreview(note: TextNote) {
    const compact = note.text.replace(/\s+/g, " ").trim();
    if (!compact) return "Untitled annotation";
    return compact.length > 34 ? `${compact.slice(0, 31)}...` : compact;
  }

  function annotationPointForButton(
    button: DiagramButton,
    anchor: DiagramAnnotationAnchor,
    offsetPercent = annotationOffsetPercent,
  ) {
    const halfWidth = (button.width ?? buttonSize * 2) / 2;
    const halfHeight = (button.height ?? buttonSize * 2) / 2;
    const offsetRatio = Math.max(0, Math.min(offsetPercent, 100)) / 100;
    const xOffset = Math.min(halfWidth * offsetRatio, buttonSize * 0.9);
    const yOffset = Math.min(halfHeight * offsetRatio, buttonSize * 0.9);

    const x =
      anchor === "left" || anchor === "topLeft" || anchor === "bottomLeft"
        ? button.x - xOffset
        : anchor === "right" || anchor === "topRight" || anchor === "bottomRight"
          ? button.x + xOffset
          : button.x;

    const y =
      anchor === "top" || anchor === "topLeft" || anchor === "topRight"
        ? button.y - yOffset
        : anchor === "bottom" || anchor === "bottomLeft" || anchor === "bottomRight"
          ? button.y + yOffset
          : button.y;

    return { x, y };
  }

  function beginButtonAnnotation(button: DiagramButton) {
    const point = annotationPointForButton(
      button,
      annotationButtonAnchor,
      annotationOffsetPercent,
    );
    setInlineAnnotationEditor({
      ...point,
      text: "",
      fontSize: textNoteFontSize,
      color: textNoteColor,
      font: textNoteFont,
      bold: annotationBold,
      italic: annotationItalic,
      annotationOffsetPercent,
      attachedToButtonId: button.id,
      annotationAnchor: annotationButtonAnchor,
    });
  }

  function beginFreeAnnotation(x: number, y: number) {
    setInlineAnnotationEditor({
      x,
      y,
      text: "",
      fontSize: textNoteFontSize,
      color: textNoteColor,
      font: textNoteFont,
      bold: annotationBold,
      italic: annotationItalic,
      annotationOffsetPercent,
    });
  }

  function commitInlineAnnotation() {
    if (!inlineAnnotationEditor) return;
    const text = inlineAnnotationEditor.text.trim();
    if (text) {
      setTextNotes((current) => [
        ...current,
        makeTextNote({
          x: inlineAnnotationEditor.x,
          y: inlineAnnotationEditor.y,
          text,
          fontSize: inlineAnnotationEditor.fontSize,
          color: inlineAnnotationEditor.color,
          font: inlineAnnotationEditor.font,
          anchor: "middle",
          bold: inlineAnnotationEditor.bold,
          italic: inlineAnnotationEditor.italic,
          annotationOffsetPercent: inlineAnnotationEditor.annotationOffsetPercent,
          attachedToButtonId: inlineAnnotationEditor.attachedToButtonId,
          annotationAnchor: inlineAnnotationEditor.annotationAnchor,
        }),
      ]);
    }
    setInlineAnnotationEditor(null);
  }

  function cancelInlineAnnotation() {
    setInlineAnnotationEditor(null);
  }

  return {
    textNotes, setTextNotes, textNoteFontSize, setTextNoteFontSize,
    textNoteColor, setTextNoteColor, textNoteFont, setTextNoteFont,
    annotationBold, setAnnotationBold, annotationItalic, setAnnotationItalic,
    annotationOffsetPercent, setAnnotationOffsetPercent,
    annotationButtonAnchor, setAnnotationButtonAnchor,
    annotationEditorRef, inlineAnnotationEditor, setInlineAnnotationEditor,
    clearTextNotes, deleteTextNote, annotationLocationLabel, annotationPreview,
    annotationPointForButton, beginButtonAnnotation, beginFreeAnnotation,
    commitInlineAnnotation, cancelInlineAnnotation,
  };
}
