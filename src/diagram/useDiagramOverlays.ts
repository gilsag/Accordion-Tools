import { useState } from "react";
import type { NumberPosition, Overlay } from "../types";

/** Button overlay and fingering state is diagram-local: identifiers are the
 * original physical DiagramButton IDs, not pitches or sounded voices. */
export function useDiagramOverlays() {
  const [overlays, setOverlays] = useState<Record<string, Overlay>>({});
  const [fingeringPosition, setFingeringPosition] =
    useState<NumberPosition>("inside-bottom");
  const [fingeringDraft, setFingeringDraft] = useState("1");
  const [isApplyingFingering, setIsApplyingFingering] = useState(false);
  const [selectionOnClick, setSelectionOnClick] = useState(false);
  const selectedButtonIds = Object.entries(overlays)
    .filter(([, overlay]) => overlay.selected)
    .map(([id]) => id);

  function markButtonOverlay(id: string) {
    const trimmedFinger = fingeringDraft.trim();
    setOverlays((current) => {
      const existing = current[id] ?? {};
      return {
        ...current,
        [id]: {
          ...existing,
          selected: selectionOnClick ? !existing.selected : existing.selected,
          finger: isApplyingFingering && trimmedFinger ? trimmedFinger : existing.finger,
        },
      };
    });
    if (isApplyingFingering && trimmedFinger) setFingeringDraft("");
  }

  function applyFingerToSelected() {
    const trimmedFinger = fingeringDraft.trim();
    if (!trimmedFinger || selectedButtonIds.length === 0) return;
    setOverlays((current) => {
      const next = { ...current };
      selectedButtonIds.forEach((id) => { next[id] = { ...next[id], finger: trimmedFinger }; });
      return next;
    });
    setFingeringDraft("");
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
    fingeringDraft, setFingeringDraft, isApplyingFingering,
    setIsApplyingFingering, selectionOnClick, setSelectionOnClick,
    selectedButtonIds, markButtonOverlay, applyFingerToSelected,
    clearFingerForSelected, clearAllFingerings, clearSelection, deselectButton,
  };
}
