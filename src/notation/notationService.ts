import { downloadSvg } from "../download";
import { addNativeNoteNames } from "./nativeNoteNames";

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
export async function renderNotationInto(target: HTMLDivElement | null, abcSource: string, musicNotationScale: number, musicNotationStaffWidth: number, showNoteNames = false,
  options: { staffSeparator?: number; barsPerLine?: number; chordFontSize?: number } = {}, imported = false): Promise<void> {
  if (!target) return;
  const generation = (renderGeneration.get(target) ?? 0) + 1;
  renderGeneration.set(target, generation);
  target.innerHTML = "";
  if (!abcSource.trim()) return;
  try {
    target.classList.remove("rendered-abc-error");
    const { renderAbc } = await loadNotationRenderer();
    if (renderGeneration.get(target) !== generation || target.isConnected === false) return;
    // Keep a single title in the shared score header. T: remains in original ABC
    // input, but need not be engraved again inside the score.
    const score = (showNoteNames ? addNativeNoteNames(abcSource, imported) : abcSource)
      .replace(/^T:[^\r\n]*(?:\r?\n)?/gm, "");
    // Keep the requested measure grouping at every inspector width. Give ABC.js
    // enough engraving space for a compact four-bar system, then fit the
    // resulting responsive SVG to the panel (never scroll horizontally).
    const measures = Math.max(1, Math.floor(options.barsPerLine ?? 4));
    const engravingWidth = Math.max(musicNotationStaffWidth, measures >= 4 ? measures * 170 : 0);
    const staffSeparator = Math.max(45, (options.staffSeparator ?? 14) * 3 + 18);
    // ABC.js supports staffsep through ABC directives (not the typed format API).
    const formatted = /^%%staffsep\s+\d+/m.test(score)
      ? score.replace(/^%%staffsep\s+\d+/m, `%%staffsep ${staffSeparator}`)
      : score.replace(/^X:(.*)$/m, `X:$1\n%%staffsep ${staffSeparator}`);
    renderAbc(target, formatted, {
      add_classes: true,
      responsive: "resize",
      scale: musicNotationScale / 100,
      paddingleft: 0,
      paddingright: 0,
      paddingtop: 0,
      paddingbottom: 0,
      staffwidth: engravingWidth,
      minPadding: 8,
      wrap: { preferredMeasuresPerLine: measures, minSpacing: 1.3, maxSpacing: 2.0 },
      format: {
        gchordfont: `Arial ${options.chordFontSize ?? 11}`,
        annotationfont: `Arial ${options.chordFontSize ?? 11}`,
      },
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
