import { useState } from "react";
import type { NumberPosition, Overlay } from "../types";

/** What a diagram click does while Annotate Diagram is open. Only the chosen
 * mode reacts; every mark (selection, finger, sequence step, note) stays
 * visible whatever the mode. */
export type AnnotateMode = "select" | "finger" | "sequence" | "notes";
export const ANNOTATE_MODES: readonly AnnotateMode[] = ["select", "finger", "sequence", "notes"];

/** Button overlay and fingering state is diagram-local: identifiers are the
 * original physical DiagramButton IDs, not pitches or sounded voices. */
export function useDiagramOverlays() {
  const [overlays, setOverlays] = useState<Record<string, Overlay>>({});
  const [fingeringPosition, setFingeringPosition] =
    useState<NumberPosition>("inside-bottom");
  const [fingeringDraft, setFingeringDraft] = useState("1");
  const [annotateMode, setAnnotateMode] = useState<AnnotateMode>("notes");
  const selectedButtonIds = Object.entries(overlays)
    .filter(([, overlay]) => overlay.selected)
    .map(([id]) => id);

  /** Select mode: a click adds the button to the selection or removes it. */
  function toggleButtonSelected(id: string) {
    setOverlays((current) => {
      const existing = current[id] ?? {};
      return { ...current, [id]: { ...existing, selected: !existing.selected } };
    });
  }

  /** Finger mode: a click writes the current finger value. Clicking a button
   * that already shows that value removes it, and an empty value clears the
   * button. The value is kept so several buttons can take the same finger. */
  function toggleButtonFinger(id: string) {
    const trimmedFinger = fingeringDraft.trim();
    setOverlays((current) => {
      const existing = current[id] ?? {};
      const finger = existing.finger === trimmedFinger ? "" : trimmedFinger;
      return { ...current, [id]: { ...existing, finger } };
    });
  }

  function applyFingerToSelected() {
    const trimmedFinger = fingeringDraft.trim();
    if (!trimmedFinger || selectedButtonIds.length === 0) return;
    setOverlays((current) => {
      const next = { ...current };
      selectedButtonIds.forEach((id) => { next[id] = { ...next[id], finger: trimmedFinger }; });
      return next;
    });
  }

  function clearFingerForSelected() {
    if (selectedButtonIds.length === 0) return;
    setOverlays((current) => {
      const next = { ...current };
      selectedButtonIds.forEach((id) => { next[id] = { ...next[id], finger: "" }; });
      return next;
    });
  }

  function clearAllFingerings() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], finger: "" }; });
      return next;
    });
  }

  function clearSelection() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => { next[id] = { ...next[id], selected: false }; });
      return next;
    });
  }

  function deselectButton(id: string) {
    setOverlays((current) => ({
      ...current,
      [id]: { ...current[id], selected: false },
    }));
  }

  return {
    overlays, setOverlays, fingeringPosition, setFingeringPosition,
    fingeringDraft, setFingeringDraft, annotateMode, setAnnotateMode,
    selectedButtonIds, toggleButtonSelected, toggleButtonFinger, applyFingerToSelected,
    clearFingerForSelected, clearAllFingerings, clearSelection, deselectButton,
  };
}
