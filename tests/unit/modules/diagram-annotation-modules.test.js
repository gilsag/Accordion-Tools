/** Diagram annotation: the appearance, overlay and annotation hooks, rendered
 * with React, keep their defaults, button identity, SVG coordinates,
 * stored-note data and overlays. Diagram and export tests cover the SVG output.
 * @vitest-environment jsdom
 */
import assert from "node:assert/strict";
import { act, renderHook } from "@testing-library/react";
import { test, vi } from "vitest";
import { useDiagramAppearanceState } from "../../../src/diagram/useDiagramAppearanceState";
import { ANNOTATE_MODES, useDiagramOverlays } from "../../../src/diagram/useDiagramOverlays";
import { useDiagramAnnotations } from "../../../src/features/annotateDiagram/useDiagramAnnotations";

const { notesMade } = vi.hoisted(() => ({ notesMade: [] }));
vi.mock("../../../src/instrument/sizePresets", async (original) => ({
  ...(await original()),
  TREBLE_PRESET_BUTTON_SIZE: { small: 28 },
}));
vi.mock("../../../src/tools/textNoteTools", async (original) => ({
  ...(await original()),
  makeTextNote(args) {
    notesMade.push(args);
    return { id: "note-1", ...args };
  },
}));

test("Diagram appearance, overlays/fingering and annotation editor compatibility", () => {
  const appearanceHook = renderHook(() => useDiagramAppearanceState());
  let appearanceState = appearanceHook.result.current;
  for (const [key, expected] of Object.entries({
    buttonSize: 28,
    spacing: 2.3,
    diagramVerticalSpacing: 18,
    diagramScale: 100,
    pianoKeyWidthScale: 1,
    pianoKeyHeightScale: 1,
    pianoBlackKeyWidthScale: 1,
    pianoBlackKeyHeightScale: 1,
    showStatusBar: true,
    trebleAngle: 30,
    buttonStrokeWidth: 3,
    referenceStrokeWidth: 6,
    chordFillStrength: 100,
    accidentalStyle: "grey",
    labelFontSize: 13,
    showButtonLabels: true,
    showBellowsGuide: true,
    showStradellaRowLabels: true,
    titleMode: "contextual",
    customTitle: "My accordion diagram",
    titleFont: "system",
    titleSize: 24,
    labelFont: "system",
    colorTheme: "default",
  }))
    assert.equal(appearanceState[key], expected, `Appearance default: ${key}`);
  const scaleSetter = appearanceState.setDiagramScale;
  act(() => scaleSetter(86));
  appearanceState = appearanceHook.result.current;
  assert.equal(appearanceState.diagramScale, 86);
  assert.strictEqual(appearanceState.setDiagramScale, scaleSetter, "Settings setter is stable");
  const overlayHook = renderHook(() => useDiagramOverlays());
  let o = overlayHook.result.current;
  assert.equal(o.fingeringPosition, "inside-bottom");
  assert.equal(o.fingeringDraft, "1");
  assert.equal(o.annotateMode, "notes", "Annotate Diagram opens in Notes mode");
  assert.equal(
    JSON.stringify(ANNOTATE_MODES),
    JSON.stringify(["select", "finger", "sequence", "notes"]),
  );
  act(() => o.toggleButtonSelected("row-1"));
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].selected, true);
  assert.equal(o.overlays["row-1"].finger, undefined, "Select mode leaves fingering alone");
  assert.equal(JSON.stringify(o.selectedButtonIds), JSON.stringify(["row-1"]));
  act(() => o.toggleButtonSelected("row-1"));
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].selected, false, "A second click deselects");
  act(() => {
    o.toggleButtonSelected("row-1");
    o.toggleButtonSelected("row-2");
  });
  o = overlayHook.result.current;
  act(() => o.setFingeringDraft(" 3 "));
  o = overlayHook.result.current;
  act(() => o.toggleButtonFinger("row-2"));
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-2"].selected, true, "Finger mode leaves the selection alone");
  assert.equal(o.overlays["row-2"].finger, "3");
  assert.equal(o.fingeringDraft, " 3 ", "The finger value is kept for the next button");
  act(() => o.toggleButtonFinger("row-2"));
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-2"].finger, "", "Same finger again removes it");
  act(() => {
    o.toggleButtonFinger("row-2");
    o.setFingeringDraft("");
  });
  o = overlayHook.result.current;
  act(() => o.toggleButtonFinger("row-2"));
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-2"].finger, "", "An empty value clears the button");
  act(() => o.setFingeringDraft(" 4 "));
  o = overlayHook.result.current;
  act(() => o.applyFingerToSelected());
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].finger, "4");
  assert.equal(o.overlays["row-2"].finger, "4");
  act(() => o.clearFingerForSelected());
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].finger, "");
  act(() => o.deselectButton("row-1"));
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].selected, false);
  act(() => o.clearSelection());
  o = overlayHook.result.current;
  assert.equal(o.selectedButtonIds.length, 0);
  o.setOverlays({
    "row-1": { selected: true, finger: "2" },
    "row-2": { selected: false, finger: "5" },
  });
  o = overlayHook.result.current;
  act(() => o.setFingeringDraft("  "));
  o = overlayHook.result.current;
  act(() => o.applyFingerToSelected());
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].finger, "2", "An empty finger value is not applied");
  act(() => o.clearAllFingerings());
  o = overlayHook.result.current;
  assert.equal(o.overlays["row-1"].selected, true);
  assert.equal(o.overlays["row-1"].finger, "");
  assert.equal(o.overlays["row-2"].finger, "");
  const notesHook = renderHook(() => useDiagramAnnotations(24));
  let n = notesHook.result.current;
  for (const [key, expected] of Object.entries({
    textNoteFontSize: 15,
    textNoteColor: "#172033",
    textNoteFont: "system",
    annotationBold: false,
    annotationItalic: false,
    annotationOffsetPercent: 50,
    annotationButtonAnchor: "center",
  }))
    assert.equal(n[key], expected, `Annotation default ${key}`);
  assert.equal(n.textNotes.length, 0);
  assert.equal(n.inlineAnnotationEditor, null);
  const selected = { id: "button-C", x: 100, y: 200, width: 60, height: 40 };
  const left = n.annotationPointForButton(selected, "left", 50);
  assert.equal(left.x, 85);
  assert.equal(left.y, 200);
  const topRight = n.annotationPointForButton(selected, "topRight", 100);
  assert.equal(topRight.x, 121.6);
  assert.equal(topRight.y, 180);
  const unbounded = n.annotationPointForButton({ id: "button-x", x: 1, y: 1 }, "left", -100);
  assert.equal(unbounded.x, 1, "Negative offset clamped at zero");
  act(() => {
    n.setAnnotationButtonAnchor("topRight");
    n.setAnnotationBold(true);
    n.setTextNoteFontSize(18);
  });
  n = notesHook.result.current;
  act(() => n.beginButtonAnnotation(selected));
  n = notesHook.result.current;
  assert.equal(n.inlineAnnotationEditor.attachedToButtonId, "button-C");
  assert.equal(n.inlineAnnotationEditor.annotationAnchor, "topRight");
  assert.equal(n.inlineAnnotationEditor.bold, true);
  assert.equal(n.inlineAnnotationEditor.fontSize, 18);
  assert.equal(n.inlineAnnotationEditor.x, 115); // 50% of the 60px-wide button
  assert.equal(n.inlineAnnotationEditor.y, 190); // 50% of 40px high
  act(() => n.setInlineAnnotationEditor({ ...n.inlineAnnotationEditor, text: "  Test note  " }));
  n = notesHook.result.current;
  act(() => n.commitInlineAnnotation());
  n = notesHook.result.current;
  assert.equal(notesMade.length, 1);
  assert.equal(notesMade[0].text, "Test note");
  assert.equal(notesMade[0].anchor, "middle");
  assert.equal(notesMade[0].attachedToButtonId, "button-C");
  assert.equal(n.textNotes[0].id, "note-1");
  assert.equal(n.inlineAnnotationEditor, null);
  assert.equal(n.annotationLocationLabel(n.textNotes[0]), "Button · top right");
  assert.equal(
    n.annotationPreview({ ...n.textNotes[0], text: "A   long\n label" }),
    "A long label",
  );
  act(() => n.beginFreeAnnotation(25, 50));
  n = notesHook.result.current;
  assert.equal(n.inlineAnnotationEditor.x, 25);
  assert.equal(n.inlineAnnotationEditor.attachedToButtonId, undefined);
  act(() => n.cancelInlineAnnotation());
  n = notesHook.result.current;
  assert.equal(n.inlineAnnotationEditor, null);
  act(() => n.deleteTextNote("note-1"));
  n = notesHook.result.current;
  assert.equal(n.textNotes.length, 0);
  act(() => n.beginFreeAnnotation(5, 10));
  n = notesHook.result.current;
  act(() => n.setInlineAnnotationEditor({ ...n.inlineAnnotationEditor, text: "   " }));
  n = notesHook.result.current;
  act(() => n.commitInlineAnnotation());
  n = notesHook.result.current;
  assert.equal(n.textNotes.length, 0, "Whitespace-only note is not saved");
  n.setTextNotes([
    { id: "a", text: "one" },
    { id: "b", text: "two" },
  ]);
  n = notesHook.result.current;
  act(() => n.clearTextNotes());
  n = notesHook.result.current;
  assert.equal(n.textNotes.length, 0);
});
