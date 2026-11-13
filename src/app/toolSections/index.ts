import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ToolId } from "../toolRegistry";
import type { AppControllerModel } from "../useAppController";

type ToolSectionComponent = LazyExoticComponent<ComponentType<{ model: AppControllerModel["tools"] }>>;

/** The controls of each tool, fetched the first time its section is opened.
 *
 * Every section declares, as a `Pick` of the controller model, exactly the
 * fields it reads; the Tools panel passes the whole model and TypeScript
 * checks that it satisfies each slice. To add a tool: register it in
 * `toolRegistry.ts`, add its section component here, and nothing else in the
 * Tools panel changes.
 */
export const TOOL_SECTIONS: Record<ToolId, ToolSectionComponent> = {
  scaleFinder: lazy(() => import("./ScaleFinderSection")),
  chordFinder: lazy(() => import("./TrebleChordFinderSection")),
  stradellaChordFinder: lazy(() => import("./StradellaChordFinderSection")),
  progressionAssistant: lazy(() => import("./ProgressionAssistantSection")),
  annotateDiagram: lazy(() => import("./AnnotateDiagramSection")),
  bassPatternPlayer: lazy(() => import("./BassPatternPlayerSection")),
  rhythmTrainer: lazy(() => import("./RhythmTrainerSection")),
  abcPlayer: lazy(() => import("./AbcPlayerSection")),
  harmonyExplorer: lazy(() => import("./HarmonyExplorerSection")),
};

/** Extra class on a section's content wrapper, where its layout needs one. */
export const TOOL_SECTION_CONTENT_CLASS: Partial<Record<ToolId, string>> = {
  abcPlayer: "abc-player-panel",
};
