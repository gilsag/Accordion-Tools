import { downloadSvg } from "../download";

/** The renderer is loaded only when a notation panel first becomes visible.
 * This is deliberately independent from the (separately lazy) ABC parser: a
 * Bass Pattern, sequence, or progression can request notation first. */
let rendererPromise: Promise<typeof import("abcjs")> | undefined;
const renderGeneration = new WeakMap<HTMLDivElement, number>();

function loadNotationRenderer() {
  return rendererPromise ??= import("abcjs").catch(error => {
    rendererPromise = undefined; // A failed chunk download can be retried.
    throw error;
  });
}

/** Keep original abcjs options and error text, and discard stale requests if
 * the ABC source or notation dimensions change before the chunk arrives. */
export async function renderNotationInto(target: HTMLDivElement | null, abcSource: string, musicNotationScale: number, musicNotationStaffWidth: number): Promise<void> {
  if (!target) return;
  const generation = (renderGeneration.get(target) ?? 0) + 1;
  renderGeneration.set(target, generation);
  target.innerHTML = "";
  if (!abcSource.trim()) return;
  try {
    target.classList.remove("rendered-abc-error");
    const { renderAbc } = await loadNotationRenderer();
    if (renderGeneration.get(target) !== generation || target.isConnected === false) return;
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
    if (renderGeneration.get(target) !== generation) return;
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
