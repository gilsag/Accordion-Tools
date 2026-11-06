import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

const PHONE_QUERY = "(max-width: 620px)";
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Transient phone-only sheet visibility. Tool, settings and instrument state
 * remain in the existing controller; closing the sheet never resets them. */
export function usePhonePanel(activeTool: string | null, workspaceMode: string) {
  const [isPhone, setIsPhone] = useState(false);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const shouldRestoreFocus = useRef(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const update = () => setIsPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const close = useCallback(() => { setOpen(false); }, []);

  const show = useCallback(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!isPhone || !open) {
      if (!open && shouldRestoreFocus.current) {
        shouldRestoreFocus.current = false;
        openerRef.current?.focus();
      }
      return;
    }
    shouldRestoreFocus.current = true;
    closeRef.current?.focus();
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [isPhone, open, close]);

  // Expanding a tool inside the sheet must keep the sheet open: that is where
  // its controls are. A tool change made from elsewhere (a cross-tool command,
  // the toolbar) dismisses the sheet so the diagram is visible.
  useEffect(() => {
    if (panelRef.current?.contains(document.activeElement)) return;
    setOpen(false);
  }, [activeTool]);
  // Switching workspace (Stradella, Treble, Harmony) always shows the new diagram.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Navigation-driven dismissal, not derived application state.
  useEffect(() => { setOpen(false); }, [workspaceMode]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- A desktop sidebar is never a modal sheet.
  useEffect(() => { if (!isPhone) setOpen(false); }, [isPhone]);

  function onPanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isPhone || !open || event.key !== "Tab") return;
    const elements = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.getClientRects().length > 0);
    if (!elements.length) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { isPhone, open, show, close, panelRef, closeRef, onPanelKeyDown };
}
