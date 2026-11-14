import type { ComponentType, ReactNode } from "react";
import { AbcPlayerOutputProvider } from "../../features/abcPlayer/AbcPlayerOutputProvider";
import { AnnotateDiagramOutputProvider } from "../../features/annotateDiagram/AnnotateDiagramOutputProvider";
import { BassPatternPlayerOutputProvider } from "../../features/bassPatternPlayer/BassPatternPlayerOutputProvider";
import { HarmonyExplorerOutputProvider } from "../../features/harmonyExplorer/HarmonyExplorerOutputProvider";
import { ProgressionAssistantOutputProvider } from "../../features/progressionAssistant/ProgressionAssistantOutputProvider";
import { ScaleFinderOutputProvider } from "../../features/scaleFinder/ScaleFinderOutputProvider";
import { StradellaChordFinderOutputProvider } from "../../features/stradellaChordFinder/StradellaChordFinderOutputProvider";
import { TrebleChordFinderOutputProvider } from "../../features/trebleChordFinder/TrebleChordFinderOutputProvider";
import { TOOL_REGISTRY, type ToolId } from "../toolRegistry";

type Provider = ComponentType<{ children: ReactNode }>;

/** Each tool's output provider: what the tool derives from its state and
 * the diagram's buttons. A tool that derives nothing has none. */
const TOOL_OUTPUT_PROVIDERS: Partial<Record<ToolId, Provider>> = {
  scaleFinder: ScaleFinderOutputProvider,
  chordFinder: TrebleChordFinderOutputProvider,
  bassPatternPlayer: BassPatternPlayerOutputProvider,
  abcPlayer: AbcPlayerOutputProvider,
  stradellaChordFinder: StradellaChordFinderOutputProvider,
  harmonyExplorer: HarmonyExplorerOutputProvider,
  progressionAssistant: ProgressionAssistantOutputProvider,
  annotateDiagram: AnnotateDiagramOutputProvider,
};

/** Nests the output providers in `TOOL_REGISTRY` order, below the diagram's
 * buttons. */
export function ToolOutputProviders({ children }: { children: ReactNode }) {
  return (Object.keys(TOOL_REGISTRY) as ToolId[]).reduceRight<ReactNode>((inner, id) => {
    const OutputProvider = TOOL_OUTPUT_PROVIDERS[id];
    return OutputProvider ? <OutputProvider>{inner}</OutputProvider> : inner;
  }, children);
}
