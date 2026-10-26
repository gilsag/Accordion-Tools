import { createZip } from "./tools/zipExport";
/**
 * Downloads the current SVG, including readable CSS rules.
 */

/** Clones the SVG and embeds readable CSS rules so downloaded files keep styling. */
function cloneSvgWithEmbeddedStyles(svgElement: SVGSVGElement) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.querySelectorAll("[data-export-ignore='true']").forEach((element) => element.remove());
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

  return clone;
}

/** Serializes an SVG element into a complete SVG string. */
export function serializeSvg(svgElement: SVGSVGElement) {
  const clone = cloneSvgWithEmbeddedStyles(svgElement);
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
  URL.revokeObjectURL(url);
}

/** Serializes the current SVG element, embeds readable CSS rules, and downloads it. */
export function downloadSvg(svgElement: SVGSVGElement, filename: string) {
  const svgString = serializeSvg(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

/** Renders the current SVG to a canvas and downloads it as a PNG image. */
export function downloadPng(svgElement: SVGSVGElement, filename: string) {
  const svgString = serializeSvg(svgElement);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();
  const viewBox = svgElement.viewBox.baseVal;
  const width = Math.max(1, Math.ceil(viewBox.width || svgElement.clientWidth || 1200));
  const height = Math.max(1, Math.ceil(viewBox.height || svgElement.clientHeight || 800));

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(url);
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      downloadBlob(pngBlob, filename);
    }, "image/png");
  };

  image.onerror = () => URL.revokeObjectURL(url);
  image.src = url;
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
