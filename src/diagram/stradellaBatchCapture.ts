import type { DownloadFormat } from "../types";
import type { StradellaChordFinderResult } from "../tools/stradellaChordFinder/results";
import { serializeSvg } from "../download";
import type { DiagramBatchSnapshot } from "./diagramExport";

/** Take every playable realization as a LIVE, synchronous SVG snapshot.
 * The caller supplies React's flushSync selection adapter; this module neither
 * schedules renders nor encodes PNGs. Most importantly, it restores the original
 * selection even when a candidate, SVG lookup or serialization fails.
 */
export function captureStradellaBatch({
  candidates, originalIndex, selectIndex, currentSvg, filenameKey, format,
}: {
  candidates: readonly { candidate: StradellaChordFinderResult; index: number }[];
  originalIndex: number;
  selectIndex(index: number): void;
  currentSvg(): SVGSVGElement | null;
  filenameKey(candidate: StradellaChordFinderResult, ordinal: number): string | undefined;
  format: DownloadFormat;
}): DiagramBatchSnapshot[] {
  const snapshots: DiagramBatchSnapshot[] = [];
  try {
    for (let index = 0; index < candidates.length; index++) {
      const { candidate, index: originalCandidateIndex } = candidates[index];
      selectIndex(originalCandidateIndex);
      const svg = currentSvg();
      if (!svg) throw new Error("Diagram SVG is unavailable.");
      const safeName = (filenameKey(candidate, index) ?? `realization-${index + 1}`)
        .replace(/#/g, "sharp").replace(/♯/g, "sharp").replace(/♭/g, "flat")
        .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        .slice(0, 140);
      const rect = svg.viewBox.baseVal;
      snapshots.push({
        name: `${String(index + 1).padStart(3, "0")}-${safeName || "stradella"}`,
        svg: serializeSvg(svg, format === "png"),
        width: Math.ceil(rect.width || svg.clientWidth || 1200),
        height: Math.ceil(rect.height || svg.clientHeight || 800),
      });
    }
  } finally {
    selectIndex(originalIndex);
  }
  return snapshots;
}
