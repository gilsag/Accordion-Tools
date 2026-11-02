import type { DownloadFormat } from "../types";
import { downloadPng, downloadSvg, downloadZip, svgStringToPngBytes } from "../download";

/** Centralize SVG/PNG download dispatch without changing serialization,
 * CSS embedding, raster dimensions or the existing filename conventions.
 */
export function downloadDiagram(svg: SVGSVGElement, filename: string, format: DownloadFormat) {
  if (format === "png") downloadPng(svg, `${filename}.png`);
  else downloadSvg(svg, `${filename}.svg`);
}

export function harmonyDiagramFilename(referenceFamily: string, relatedFamily: string, scaleName: string) {
  const safePart = (value: string) => value.toLowerCase()
    .replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `harmonic-circle-${safePart(referenceFamily)}-${safePart(relatedFamily)}-${safePart(scaleName)}`;
}

/** Keep the original ASCII normalization, truncation, and Windows reserved names. */
export function accordionDiagramFilename(rawName: string, layoutName: string) {
  const asciiName = rawName
    .replace(/#/g, "sharp").replace(/♯/g, "sharp").replace(/♭/g, "flat")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 160).replace(/-+$/g, "");
  const reservedName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  return asciiName && !reservedName.test(asciiName) ? asciiName : `${layoutName}-accordion-diagram`;
}

export type DiagramBatchSnapshot = { name: string; svg: string; width: number; height: number };

/** Batch capture must happen synchronously before this asynchronous encoding;
 * snapshots are already serialized so the selected realization can be restored.
 */
export async function downloadDiagramBatch(snapshots: readonly DiagramBatchSnapshot[], format: DownloadFormat, filename: string) {
  const encoder = new TextEncoder();
  const entries: Array<{ name: string; data: Uint8Array }> = [];
  for (const snapshot of snapshots) {
    const isPng = format === "png";
    entries.push({
      name: `${snapshot.name}.${isPng ? "png" : "svg"}`,
      data: isPng ? await svgStringToPngBytes(snapshot.svg, snapshot.width, snapshot.height) : encoder.encode(snapshot.svg),
    });
  }
  downloadZip(entries, filename);
}

/** Convert browser pointer coordinates to the unchanged SVG viewBox space. */
export function svgPointFromClient(svg: SVGSVGElement | null, clientX: number, clientY: number) {
  const screenMatrix = svg?.getScreenCTM();
  if (!svg || !screenMatrix) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(screenMatrix.inverse());
}
