import { useHarmonyExplorerOutput } from "../../features/harmonyExplorer/harmonyExplorerContext";
import {
  accordionDiagramFilename,
  downloadDiagram,
  harmonyDiagramFilename,
} from "../../diagram/diagramExport";
import type { DownloadFormat } from "../../types";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformNavigation,
  usePlatformShell,
} from "../platform/platformContexts";
import { useDiagramLabels } from "../useDiagramLabels";
import type { DiagramModel } from "./useDiagramModel";

/** Download of the drawn diagram. The file is named after the musical
 * content: the circle's families and scale in the Harmony workspace;
 * otherwise a two-hand view's own name, else in the contextual title mode
 * the active tool's file name (the shown title if it has none, the
 * automatic title if it asks for that, or the automatic title with no tool),
 * the automatic title in the automatic mode, and the shown title otherwise.
 * The export service normalizes the name and adds the layout. */
export function useDiagramDownload(
  diagram: Pick<DiagramModel, "finalTitle" | "note" | "handsView">,
) {
  const { workspaceMode } = usePlatformNavigation();
  const { side, trebleLayout } = usePlatformInstrument();
  const { titleMode } = usePlatformAppearance();
  const { svgRef, harmonySvgRef, downloadFormat } = usePlatformShell();
  const { autoTitle } = useDiagramLabels();
  const { harmonyReferenceFamily, harmonyRelatedName, harmonyScale } = useHarmonyExplorerOutput();

  function downloadCurrentDiagram(format: DownloadFormat = downloadFormat) {
    if (workspaceMode === "harmony") {
      if (!harmonySvgRef.current) return;
      const name = harmonyDiagramFilename(
        harmonyReferenceFamily.shortName,
        harmonyRelatedName,
        harmonyScale.name,
      );
      downloadDiagram(harmonySvgRef.current, name, format);
      return;
    }
    if (!svgRef.current) return;
    const layoutName =
      side === "stradella"
        ? "stradella"
        : trebleLayout === "piano"
          ? "piano-treble"
          : `${trebleLayout}-treble`;
    const displayedTitle = titleMode !== "none" ? diagram.finalTitle : "";
    const { note } = diagram;
    const contextualName = !note
      ? autoTitle()
      : note.filename === undefined
        ? displayedTitle
        : (note.filename ?? autoTitle());
    const rawName =
      diagram.handsView?.filename ??
      (titleMode === "auto"
        ? autoTitle()
        : titleMode === "contextual"
          ? contextualName
          : displayedTitle);
    downloadDiagram(svgRef.current, accordionDiagramFilename(rawName, layoutName), format);
  }

  return downloadCurrentDiagram;
}
