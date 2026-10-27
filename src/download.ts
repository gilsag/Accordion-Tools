import { createZip } from "./tools/zipExport";
import { makeSvgCanvasSafe } from "./svgRasterExport";
/**
 * Downloads the current SVG, including readable CSS rules.
 */

/** Clones the SVG and embeds readable CSS rules so downloaded files keep styling. */
function cloneSvgWithEmbeddedStyles(svgElement: SVGSVGElement, pngSafe = false) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.querySelectorAll("[data-export-ignore='true'], .annotation-editor-object").forEach((element) => element.remove());
  clone.querySelectorAll(".selected-chord, .selected-reference, .focused-reference").forEach((element) => {
    element.classList.remove("selected-chord", "selected-reference", "focused-reference");
  });

  let cssText = "";

  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      Array.from(styleSheet.cssRules).forEach((rule) => {
        cssText += rule.cssText + "\n";
      });
    } catch {
      /* Some browser/security contexts block stylesheet reading. */
    }
  });

  const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleElement.textContent = cssText;
  clone.insertBefore(styleElement, clone.firstChild);
  if (pngSafe) makeSvgCanvasSafe(svgElement, clone);

  return clone;
}

/** Serializes an SVG element into a complete SVG string. */
export function serializeSvg(svgElement: SVGSVGElement, pngSafe = false) {
  const clone = cloneSvgWithEmbeddedStyles(svgElement, pngSafe);
  return new XMLSerializer().serializeToString(clone);
}

/** Triggers a browser download for a Blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Serializes the current SVG element, embeds readable CSS rules, and downloads it. */
export function downloadSvg(svgElement: SVGSVGElement, filename: string) {
  const svgString = serializeSvg(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

/** Downloads a PNG without drawing XHTML foreignObject elements into canvas. */
export async function downloadPng(svgElement: SVGSVGElement, filename: string): Promise<void> {
  try {
    const svgString = serializeSvg(svgElement, true);
    const viewBox = svgElement.viewBox.baseVal;
    const width = Math.max(1, Math.ceil(viewBox.width || svgElement.clientWidth || 1200));
    const height = Math.max(1, Math.ceil(viewBox.height || svgElement.clientHeight || 800));
    const png = await svgStringToPngBytes(svgString, width, height);
    downloadBlob(new Blob([new Uint8Array(png)], { type: "image/png" }), filename);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Could not export PNG diagram.");
  }
}

/** Render an already-serialized diagram independently of the current React
 * selection, so multi-diagram PNG conversion can happen after state restore. */
export async function svgStringToPngBytes(svgString: string, width: number, height: number): Promise<Uint8Array> {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("SVG could not be rendered for PNG export."));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width);
    canvas.height = Math.ceil(height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PNG canvas is not available.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) =>
      value ? resolve(value) : reject(new Error("PNG encoding failed.")), "image/png"));
    return new Uint8Array(await png.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Trigger one download containing all the selected diagrams. */
export function downloadZip(entries: ReadonlyArray<{ name: string; data: Uint8Array }>, filename: string) {
  downloadBlob(createZip(entries), filename);
}
