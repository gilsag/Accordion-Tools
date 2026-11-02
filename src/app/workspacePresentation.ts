import type { Side } from "../types";
import type { ToolSection } from "./toolRegistry";
import type { translate } from "../i18n/catalog";

/** Pure status-label selector. Its priority order is the historical UI order:
 * active audio overrides tool selection, then active Finder/recording modes.
 * This reports interface state only; it never affects musical selection.
 */
export function activeToolStatusLabel({
  side, bassPatternPlaybackState, abcPlaybackState, activeToolSection,
  scaleFinderActive, stradellaChordFinderActive, chordFinderActive,
  isRecordingSequence, isApplyingFingering, selectionOnClick, t,
}: {
  side: Side;
  bassPatternPlaybackState: string;
  abcPlaybackState: string;
  activeToolSection: ToolSection;
  scaleFinderActive: boolean;
  stradellaChordFinderActive: boolean;
  chordFinderActive: boolean;
  isRecordingSequence: boolean;
  isApplyingFingering: boolean;
  selectionOnClick: boolean;
  t: (key: Parameters<typeof translate>[1]) => string;
}): string {
  return side === "stradella"
      ? bassPatternPlaybackState === "playing"
        ? t("ui.bassPatternPlayer")
        : abcPlaybackState === "playing" || abcPlaybackState === "paused"
          ? t("ui.abcDefault")
          : activeToolSection === "progressionAssistant"
            ? t("ui.progressionAssistant")
            : scaleFinderActive
              ? t("ui.scaleFinder")
              : stradellaChordFinderActive
                ? t("tools.chordFinder")
                : isRecordingSequence
                ? t("ui.sequenceRecording")
                : isApplyingFingering
                  ? t("ui.fingering")
                  : activeToolSection === "annotateDiagram"
                    ? t("ui.annotateDiagram")
                    : selectionOnClick
                      ? t("ui.selection")
                      : activeToolSection === "stradellaChordFinder"
                        ? t("tools.chordFinder")
                        : activeToolSection === "scaleFinder"
                          ? t("ui.scaleFinder")
                          : t("ui.noActiveTool")
      : abcPlaybackState === "playing" || abcPlaybackState === "paused"
        ? t("ui.abcDefault")
        : scaleFinderActive
          ? t("ui.scaleFinder")
          : chordFinderActive
            ? t("tools.chordFinder")
            : isRecordingSequence
              ? t("ui.sequenceRecording")
              : isApplyingFingering
                ? t("ui.fingering")
                : activeToolSection === "annotateDiagram"
                  ? t("ui.annotateDiagram")
                  : selectionOnClick
                    ? t("ui.selection")
                    : activeToolSection === "chordFinder"
                      ? t("tools.chordFinder")
                      : activeToolSection === "scaleFinder"
                        ? t("ui.scaleFinder")
                        : t("ui.noActiveTool");

}

/** Layout-only width policy: hiding the sidebar must keep the entire
 * workspace accessible without an empty left grid track. */
export function workspaceGridColumns(density: "compact" | "comfortable" | string, leftPanelMode: string) {
  const sidebarWidth = density === "compact"
    ? "clamp(230px, 15vw, 270px)"
    : "clamp(300px, 20vw, 380px)";
  return `${leftPanelMode === "hidden" ? "" : `${sidebarWidth} `}minmax(0, 1fr)`;
}
