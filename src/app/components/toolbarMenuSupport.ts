import { useEffect, type RefObject } from "react";
import type { DownloadFormat } from "../../types";

export const DOWNLOAD_FORMATS: readonly DownloadFormat[] = ["svg", "png"];

/** A toolbar menu closes when the pointer goes down outside it, and on
 * Escape, which returns focus to its button. */
export function useDismissibleMenu(menu: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (menu.current?.open && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !menu.current?.open) return;
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu]);
}
