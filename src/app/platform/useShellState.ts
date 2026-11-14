import { useRef, useState } from "react";
import type { DownloadFormat, InterfaceDensity } from "../../types";

/** The application shell's own state: interface density and the remembered
 * download format (both saved settings), the phone's diagram view, and the
 * two drawn diagrams that Download and the batch export capture. */
export function useShellState() {
  const [interfaceDensity, setInterfaceDensity] = useState<InterfaceDensity>("compact");
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("svg");
  const [mobileDiagramView, setMobileDiagramView] = useState<"readable" | "fit">("readable");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const harmonySvgRef = useRef<SVGSVGElement | null>(null);
  return {
    interfaceDensity,
    setInterfaceDensity,
    downloadFormat,
    setDownloadFormat,
    mobileDiagramView,
    setMobileDiagramView,
    svgRef,
    harmonySvgRef,
  };
}
