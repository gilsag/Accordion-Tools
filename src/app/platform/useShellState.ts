import { useEffect, useRef, useState } from "react";
import type { DownloadFormat, InterfaceDensity, InterfaceTheme } from "../../types";

/** The application shell's own state: interface density, the interface theme
 * and the remembered download format (all saved settings), the phone's diagram view, and the
 * two drawn diagrams that Download and the batch export capture. */
export function useShellState() {
  const [interfaceDensity, setInterfaceDensity] = useState<InterfaceDensity>("compact");
  const [interfaceTheme, setInterfaceTheme] = useState<InterfaceTheme>("system");
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("svg");
  const [mobileDiagramView, setMobileDiagramView] = useState<"readable" | "fit">("readable");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const harmonySvgRef = useRef<SVGSVGElement | null>(null);
  useDocumentTheme(interfaceTheme);
  return {
    interfaceDensity,
    setInterfaceDensity,
    interfaceTheme,
    setInterfaceTheme,
    downloadFormat,
    setDownloadFormat,
    mobileDiagramView,
    setMobileDiagramView,
    svgRef,
    harmonySvgRef,
  };
}

/** Puts the chosen theme on the root element, where the colour tokens read it
 * (src/styles/tokens.css). "system" removes the attribute, so the page
 * follows prefers-color-scheme. */
function useDocumentTheme(theme: InterfaceTheme) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
}
