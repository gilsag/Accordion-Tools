import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ToolId } from "../toolRegistry";

type ToolSectionComponent = LazyExoticComponent<ComponentType>;

/** The controls of each tool, fetched the first time its section is opened.
 *
 * Every section reads its tool's contexts, and the platform's, itself. To add
 * a tool: register it in `toolRegistry.ts`, add its section component here,
 * and nothing else in the Tools panel changes.
 */
export const TOOL_SECTIONS: Record<ToolId, ToolSectionComponent> = {
  scaleFinder: lazy(() => import("../../features/scaleFinder/ScaleFinderSection")),
  chordFinder: lazy(() => import("../../features/trebleChordFinder/TrebleChordFinderSection")),
  stradellaChordFinder: lazy(
    () => import("../../features/stradellaChordFinder/StradellaChordFinderSection"),
  ),
  progressionAssistant: lazy(
    () => import("../../features/progressionAssistant/ProgressionAssistantSection"),
  ),
  annotateDiagram: lazy(() => import("../../features/annotateDiagram/AnnotateDiagramSection")),
  bassPatternPlayer: lazy(
    () => import("../../features/bassPatternPlayer/BassPatternPlayerSection"),
  ),
  rhythmTrainer: lazy(() => import("../../features/rhythmTrainer/RhythmTrainerSection")),
  abcPlayer: lazy(() => import("../../features/abcPlayer/AbcPlayerSection")),
  harmonyExplorer: lazy(() => import("../../features/harmonyExplorer/HarmonyExplorerSection")),
};

/** Extra class on a section's content wrapper, where its layout needs one. */
export const TOOL_SECTION_CONTENT_CLASS: Partial<Record<ToolId, string>> = {
  abcPlayer: "abc-player-panel",
};
