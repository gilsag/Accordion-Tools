import type { ComponentType, ReactNode } from "react";
import { AbcPlayerProvider } from "../../features/abcPlayer/AbcPlayerProvider";
import { AnnotateDiagramProvider } from "../../features/annotateDiagram/AnnotateDiagramProvider";
import { HarmonyExplorerProvider } from "../../features/harmonyExplorer/HarmonyExplorerProvider";
import { ProgressionAssistantProvider } from "../../features/progressionAssistant/ProgressionAssistantProvider";
import { BassPatternPlayerProvider } from "../../features/bassPatternPlayer/BassPatternPlayerProvider";
import { ScaleFinderProvider } from "../../features/scaleFinder/ScaleFinderProvider";
import { StradellaChordFinderProvider } from "../../features/stradellaChordFinder/StradellaChordFinderProvider";
import { TrebleChordFinderProvider } from "../../features/trebleChordFinder/TrebleChordFinderProvider";
import { TOOL_REGISTRY, type ToolId } from "../toolRegistry";

type Provider = ComponentType<{ children: ReactNode }>;

/** Each tool's provider, which owns its state, registers its settings and
 * its handle. Tools without one are still composed by the application
 * controller (docs/internal/controller-split-plan.md). */
const TOOL_PROVIDERS: Partial<Record<ToolId, Provider>> = {
  scaleFinder: ScaleFinderProvider,
  chordFinder: TrebleChordFinderProvider,
  bassPatternPlayer: BassPatternPlayerProvider,
  abcPlayer: AbcPlayerProvider,
  stradellaChordFinder: StradellaChordFinderProvider,
  harmonyExplorer: HarmonyExplorerProvider,
  progressionAssistant: ProgressionAssistantProvider,
  annotateDiagram: AnnotateDiagramProvider,
};

/** Nests the tool providers in `TOOL_REGISTRY` order, outermost first. They
 * stay mounted for the whole session, whichever tool is open. */
export function ToolProviders({ children }: { children: ReactNode }) {
  return (Object.keys(TOOL_REGISTRY) as ToolId[]).reduceRight<ReactNode>((inner, id) => {
    const ToolProvider = TOOL_PROVIDERS[id];
    return ToolProvider ? <ToolProvider>{inner}</ToolProvider> : inner;
  }, children);
}
