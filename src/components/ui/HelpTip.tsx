import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type HelpTipProps = { text: string };

/** Viewport-positioned tooltip. Portaling avoids clipping by narrow panels,
 * fieldsets, and scroll containers; it also works with keyboard activation. */
export function HelpTip({ text }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancelHide() {
    if (hideTimer.current !== null) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }
  function scheduleHide() {
    cancelHide();
    if (!pinned) hideTimer.current = setTimeout(() => setOpen(false), 180);
  }
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const ref = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLSpanElement>(null);
  const tipId = `help-${useStableTipId()}`;
  useEffect(() => {
    if (!open) return;
    function reposition() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const actual = popupRef.current?.getBoundingClientRect();
      const width = Math.min(actual?.width ?? 340, window.innerWidth - 24);
      const height = Math.min(actual?.height ?? 120, window.innerHeight - 24);
      const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
      const below = rect.bottom + 8;
      const above = rect.top - 8 - height;
      const top = below + height <= window.innerHeight - 12 ? below
        : above >= 12 ? above
          : Math.max(12, Math.min(window.innerHeight - height - 12, below));
      setPosition({ left, top });
    }
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    function dismissOnOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node) &&
          !popupRef.current?.contains(event.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setPinned(false); setOpen(false); }
    }
    document.addEventListener("pointerdown", dismissOnOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => { document.removeEventListener("pointerdown", dismissOnOutside);
      document.removeEventListener("keydown", dismissOnEscape); };
  }, [open]);
  useEffect(() => () => {
    if (hideTimer.current !== null) clearTimeout(hideTimer.current);
  }, []);
  return <>
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      className="help-tip"
      aria-label={text}
      aria-describedby={open ? tipId : undefined}
      aria-expanded={open}
      onMouseEnter={() => { cancelHide(); setOpen(true); }}
      onMouseLeave={scheduleHide}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        cancelHide();
        setPinned((current) => !current);
        setOpen(true);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { setPinned(false); setOpen(false); return; }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault(); event.stopPropagation(); cancelHide(); setPinned((current) => !current); setOpen(true);
        }
      }}
      onBlur={() => { if (!pinned) scheduleHide(); }}
    >?</span>
    {open && createPortal(
      <span ref={popupRef} id={tipId} role="tooltip" className="help-tip-popup"
        tabIndex={0}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        style={{ left: position.left, top: position.top }}>{text}</span>, document.body)}
  </>;
}

import { useId } from "react";
function useStableTipId() { return useId().replace(/:/g, ""); }
