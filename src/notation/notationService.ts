import { renderAbc } from "abcjs";
import { downloadSvg } from "../download";

/** All notation panels share exactly the same abcjs rendering options,
 * exception text and DOM reset behavior. Keep the abcjs dependency here so
 * it can later be loaded asynchronously without changing tool controllers.
 */
export function renderNotationInto(target: HTMLDivElement | null, abcSource: string, musicNotationScale: number, musicNotationStaffWidth: number) {
  if (!target) return;
  target.innerHTML = "";
  if (!abcSource.trim()) return;
  try {
    target.classList.remove("rendered-abc-error");
    renderAbc(target, abcSource, {
      add_classes: true,
      responsive: "resize",
      scale: musicNotationScale / 100,
      paddingleft: 0,
      paddingright: 0,
      paddingtop: 0,
      paddingbottom: 0,
      staffwidth: musicNotationStaffWidth,
    });
  } catch (error) {
    target.classList.add("rendered-abc-error");
    target.textContent = error instanceof Error
      ? `Could not render notation: ${error.message}`
      : "Could not render notation.";
  }
}

/** Use the original filename sanitization and export implementation. */
export function downloadRenderedNotationSvg(target: HTMLDivElement | null, filenameBase: string) {
  const svg = target?.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) return;
  const safeName = filenameBase.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "notation";
  downloadSvg(svg, `${safeName}.svg`);
}
