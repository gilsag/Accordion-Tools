import type { TextNote } from "../../types";
import type { useDiagramAnnotations } from "../../features/annotateDiagram/useDiagramAnnotations";
import { fontClass } from "../../music";
import { splitMultilineText } from "../../tools/textNoteTools";

type EditorController = ReturnType<typeof useDiagramAnnotations>;
type DiagramAnnotationsLayerProps = {
  textNotes: TextNote[];
  inlineAnnotationEditor: EditorController["inlineAnnotationEditor"];
  setInlineAnnotationEditor: EditorController["setInlineAnnotationEditor"];
  annotationEditorRef: EditorController["annotationEditorRef"];
  commitInlineAnnotation: EditorController["commitInlineAnnotation"];
  cancelInlineAnnotation: EditorController["cancelInlineAnnotation"];
  viewWidth: number;
  viewHeight: number;
  annotationPlaceholder: string;
};

/** Render saved SVG text and the interactive editor in the original SVG
 * coordinate system. The editor remains excluded from SVG/PNG serialization.
 */
export function DiagramAnnotationsLayer({textNotes, inlineAnnotationEditor,
  setInlineAnnotationEditor, annotationEditorRef, commitInlineAnnotation,
  cancelInlineAnnotation, viewWidth, viewHeight, annotationPlaceholder,
}: DiagramAnnotationsLayerProps) {
  return <>
            {textNotes.map((note) => (
              <text
                key={note.id}
                x={note.x}
                y={note.y}
                textAnchor={note.anchor}
                className={`free-text-note ${fontClass(note.font)}`}
                style={{
                  fontSize: note.fontSize,
                  fill: note.color,
                  fontWeight: note.bold ? 800 : 500,
                  fontStyle: note.italic ? "italic" : undefined,
                }}
              >
                {splitMultilineText(note.text).map((line, index) => (
                  <tspan
                    key={index}
                    x={note.x}
                    dy={index === 0 ? 0 : note.fontSize * 1.25}
                  >
                    {line || " "}
                  </tspan>
                ))}
              </text>
            ))}

            {inlineAnnotationEditor && (() => {
              const editorWidth = 180;
              const editorHeight = 68;
              const editorX = Math.max(8, Math.min(inlineAnnotationEditor.x - editorWidth / 2, viewWidth - editorWidth - 8));
              const editorY = Math.max(8, Math.min(inlineAnnotationEditor.y - editorHeight / 2, viewHeight - editorHeight - 8));

              return (
                <foreignObject
                  x={editorX}
                  y={editorY}
                  width={editorWidth}
                  height={editorHeight}
                  className="annotation-editor-object"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="annotation-editor">
                    <textarea
                      ref={annotationEditorRef}
                      value={inlineAnnotationEditor.text}
                      placeholder={annotationPlaceholder}
                      style={{
                        fontSize: inlineAnnotationEditor.fontSize,
                        color: inlineAnnotationEditor.color,
                        fontWeight: inlineAnnotationEditor.bold ? 800 : 500,
                        fontStyle: inlineAnnotationEditor.italic ? "italic" : undefined,
                      }}
                      onChange={(event) =>
                        setInlineAnnotationEditor((current) =>
                          current ? { ...current, text: event.target.value } : current,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          commitInlineAnnotation();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelInlineAnnotation();
                        }
                      }}
                      onBlur={commitInlineAnnotation}
                    />
                  </div>
                </foreignObject>
              );
            })()}
  </>;
}
