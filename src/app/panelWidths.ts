import { useCallback, useState } from "react";

/** Widths the user dragged the Tools/Settings panel and the results panel to.
 * `null` means the density's default width. Remembered in this browser only:
 * a good width depends on the screen, so it is not part of settings files. */
export type PanelWidths = { left: number | null; inspector: number | null };
export type ResizablePanel = keyof PanelWidths;

export const PANEL_WIDTHS_STORAGE_KEY = "accordionTools.panelWidths.v1";
export const PANEL_WIDTH_LIMITS: Record<ResizablePanel, { min: number; max: number }> = {
  left: { min: 220, max: 560 },
  inspector: { min: 260, max: 640 },
};
/** The diagram always keeps at least this much width while dragging. */
export const MIN_WORKSPACE_WIDTH = 480;
/** On narrow windows a saved width gives way, so it never takes over the screen. */
export const MAX_PANEL_VIEWPORT_SHARE = "40vw";

/** Clamps a dragged width to the panel's limits and to what the window can
 * spare beside the other panel and the diagram. */
export function clampPanelWidth(panel: ResizablePanel, width: number, viewportWidth: number, otherPanelWidth: number) {
  const { min, max } = PANEL_WIDTH_LIMITS[panel];
  const room = viewportWidth - otherPanelWidth - MIN_WORKSPACE_WIDTH;
  return Math.round(Math.max(min, Math.min(max, room, width)));
}

/** Grid track for a resized panel, or `fallback` (the density default). */
export function panelTrack(width: number | null, fallback: string) {
  return width === null ? fallback : `min(${width}px, ${MAX_PANEL_VIEWPORT_SHARE})`;
}

export function parseStoredPanelWidths(raw: string | null): PanelWidths {
  const widths: PanelWidths = { left: null, inspector: null };
  if (!raw) return widths;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const panel of ["left", "inspector"] as const) {
      const value = parsed?.[panel];
      const { min, max } = PANEL_WIDTH_LIMITS[panel];
      if (typeof value === "number" && Number.isFinite(value)) widths[panel] = Math.max(min, Math.min(max, Math.round(value)));
    }
  } catch {
    // A damaged entry falls back to the default widths.
  }
  return widths;
}

function readStoredWidths(): PanelWidths {
  try {
    return parseStoredPanelWidths(window.localStorage.getItem(PANEL_WIDTHS_STORAGE_KEY));
  } catch {
    return { left: null, inspector: null };
  }
}

export function usePanelWidths() {
  const [widths, setWidths] = useState<PanelWidths>(readStoredWidths);
  const setPanelWidth = useCallback((panel: ResizablePanel, width: number | null) => {
    setWidths((current) => {
      const next = { ...current, [panel]: width };
      try {
        window.localStorage.setItem(PANEL_WIDTHS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private browsing can refuse storage; the width still applies now.
      }
      return next;
    });
  }, []);
  return { widths, setPanelWidth };
}
