import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { PANEL_WIDTH_LIMITS, type ResizablePanel } from "../panelWidths";

const KEY_STEP = 16;

/**
 * Drag handle on the edge between the diagram and a side panel. Dragging,
 * or the arrow keys when focused, changes that panel's width; a double-click
 * or Enter restores the default width. `measure` returns the panel's current
 * rendered width, `clamp` applies the panel and window limits.
 */
export function PanelResizeHandle({ panel, label, measure, clamp, onResize }: {
  panel: ResizablePanel;
  label: string;
  measure: () => number;
  clamp: (width: number) => number;
  onResize: (width: number | null) => void;
}) {
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  // The left panel grows to the right; the results panel grows to the left.
  const direction = panel === "left" ? 1 : -1;
  const { min, max } = PANEL_WIDTH_LIMITS[panel];

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startWidth: measure() };
    document.body.classList.add("panel-resizing");
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    onResize(clamp(drag.current.startWidth + direction * (event.clientX - drag.current.startX)));
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    document.body.classList.remove("panel-resizing");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? KEY_STEP : event.key === "ArrowLeft" ? -KEY_STEP : 0;
    if (step) {
      event.preventDefault();
      onResize(clamp(measure() + direction * step));
    } else if (event.key === "Enter") {
      event.preventDefault();
      onResize(null);
    }
  }

  return (
    <div
      className={`panel-resize-handle panel-resize-${panel}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(measure())}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => onResize(null)}
      onKeyDown={onKeyDown}
    />
  );
}
