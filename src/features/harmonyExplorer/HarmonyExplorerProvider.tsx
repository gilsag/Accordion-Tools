import type { ReactNode } from "react";
import { usePlatformTools } from "../../app/platform/platformContexts";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { DEFAULT_RING_VISIBILITY } from "./engine/music";
import { HarmonyExplorerContext } from "./harmonyExplorerContext";
import { DEFAULT_RELATED_FAMILY_ID, useHarmonyExplorerState } from "./useHarmonyExplorer";
import { useHarmonyRecordingState } from "./useHarmonyRecording";

/** Owns the Harmony circle (selection, filters, display preferences) and the
 * progression recorded on it. */
export function HarmonyExplorerProvider({ children }: { children: ReactNode }) {
  const explorer = useHarmonyExplorerState();
  const recording = useHarmonyRecordingState();
  useOwnedSettings("harmonyExplorer", explorer);

  function clearSelectionAndRecording() {
    explorer.setHarmonySelection(null);
    explorer.setHarmonyFocusedReferenceRootPc(null);
    recording.setHarmonyProgressionRecording(false);
    recording.setHarmonyRecordedProgression([]);
    recording.setHarmonyRecordedNotationVisible(false);
  }

  /** "Reset tool" in the Harmony workspace: the circle's defaults, without
   * the selection or the recording. */
  function resetHarmonyExplorer() {
    explorer.setHarmonyReferenceFamilyId("major");
    explorer.setHarmonyRelatedFamilyId(DEFAULT_RELATED_FAMILY_ID);
    explorer.setHarmonyScaleId("ionian");
    explorer.setHarmonyDiatonicOnly(false);
    explorer.setHarmonyHighlightDiatonic(true);
    explorer.setHarmonyShowEnharmonics(false);
    explorer.setHarmonyShowSeparators(true);
    explorer.setHarmonyShowLegend(true);
    explorer.setHarmonyShowExplanation(false);
    explorer.setHarmonyRingVisibility({ ...DEFAULT_RING_VISIBILITY });
    explorer.setHarmonyShowToneTooltips(true);
    explorer.setHarmonyShowNoteRing(true);
    explorer.setHarmonyColorByFamily(false);
    explorer.setHarmonyDiameter(900);
    explorer.setHarmonyFontSize(18);
    explorer.setHarmonyPlaybackStyle("block");
    explorer.setHarmonyVoicingStyle("root");
    clearSelectionAndRecording();
  }

  const { coordinator } = usePlatformTools();
  function toggleHarmonyRecordedNotation() {
    recording.setHarmonyRecordedNotationVisible((current) => !current);
    coordinator.scoreToggled("harmonyExplorer");
  }
  useToolHandle("harmonyExplorer", {
    hideScore: () => recording.setHarmonyRecordedNotationVisible(false),
    resetWork(workspace) {
      if (workspace === "harmony") clearSelectionAndRecording();
    },
    resetPreferences: resetHarmonyExplorer,
  });
  return (
    <HarmonyExplorerContext.Provider
      value={{ ...explorer, ...recording, resetHarmonyExplorer, toggleHarmonyRecordedNotation }}
    >
      {children}
    </HarmonyExplorerContext.Provider>
  );
}
