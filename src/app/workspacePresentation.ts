import type { Side } from "../types";
import { TOOL_REGISTRY, toolOfferedOn, type ToolSection } from "./toolRegistry";
import type { translate } from "../i18n/catalog";

/** Pure status-label selector, in priority order: sounding audio, the
 * Progression Assistant, an active Finder, then whichever tool is open in the
 * Tools panel. This reports interface state only; it never affects musical
 * selection.
 */
export function activeToolStatusLabel({
  side, bassPatternPlaybackState, abcPlaybackState, activeToolSection,
  scaleFinderActive, stradellaChordFinderActive, chordFinderActive,
  t,
}: {
  side: Side;
  bassPatternPlaybackState: string;
  abcPlaybackState: string;
  activeToolSection: ToolSection;
  scaleFinderActive: boolean;
  stradellaChordFinderActive: boolean;
  chordFinderActive: boolean;
  t: (key: Parameters<typeof translate>[1]) => string;
}): string {
  if (side === "stradella" && bassPatternPlaybackState === "playing") return t("ui.bassPatternPlayer");
  if (abcPlaybackState === "playing" || abcPlaybackState === "paused") return t("ui.abcDefault");
  if (side === "stradella" && activeToolSection === "progressionAssistant") return t("ui.progressionAssistant");
  if (scaleFinderActive) return t("ui.scaleFinder");
  if (side === "stradella" ? stradellaChordFinderActive : chordFinderActive) return t("tools.chordFinder");
  // A Finder can stay active with its section closed; every other tool is
  // active exactly while its section is open.
  if (activeToolSection && toolOfferedOn(activeToolSection, side)) return t(TOOL_REGISTRY[activeToolSection].titleKey);
  return t("ui.noActiveTool");
}

/** Layout-only width policy: hiding the sidebar must keep the entire
 * workspace accessible without an empty left grid track. */
export function workspaceGridColumns(density: "compact" | "comfortable" | string, leftPanelMode: string,
  leftPanelTrack?: string) {
  const sidebarWidth = leftPanelTrack ?? (density === "compact"
    ? "clamp(230px, 15vw, 270px)"
    : "clamp(300px, 20vw, 380px)");
  return `${leftPanelMode === "hidden" ? "" : `${sidebarWidth} `}minmax(0, 1fr)`;
}
