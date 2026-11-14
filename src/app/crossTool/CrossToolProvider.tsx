import type { ReactNode } from "react";
import { useAbcPlayerOutput } from "../../features/abcPlayer/abcPlayerContext";
import { useBassPatternPlayer } from "../../features/bassPatternPlayer/bassPatternPlayerContext";
import { useBassPatternPlayerOutput } from "../../features/bassPatternPlayer/bassPatternPlayerContext";
import {
  useHarmonyExplorer,
  useHarmonyExplorerOutput,
} from "../../features/harmonyExplorer/harmonyExplorerContext";
import {
  useProgressionAssistant,
  useProgressionAssistantOutput,
} from "../../features/progressionAssistant/progressionAssistantContext";
import { useScaleFinder } from "../../features/scaleFinder/scaleFinderContext";
import { useStradellaChordFinder } from "../../features/stradellaChordFinder/stradellaChordFinderContext";
import { useTrebleChordFinder } from "../../features/trebleChordFinder/trebleChordFinderContext";
import {
  usePlatformLanguage,
  usePlatformNotices,
  usePlatformNavigation,
  usePlatformTools,
} from "../platform/platformContexts";
import { CrossToolContext } from "./crossToolContext";
import { useProgressionActions } from "./useProgressionActions";

/** The commands that span tools. They need every tool's state and results,
 * so this provider sits below the tool output providers. */
export function CrossToolProvider({ children }: { children: ReactNode }) {
  const { t } = usePlatformLanguage();
  const { notify } = usePlatformNotices();
  const { navigateToTool } = usePlatformNavigation();
  const { stopAllPlayback } = usePlatformTools();
  const { chordProgressionDefinitions } = useBassPatternPlayer();
  const { stopBassPatternPlayback } = useBassPatternPlayerOutput();
  const { stopAbcPlayback } = useAbcPlayerOutput();
  const { setChordFinderActive } = useTrebleChordFinder();
  const { setScaleFinderActive } = useScaleFinder();
  const progression = useProgressionAssistant();
  const progressionOutput = useProgressionAssistantOutput();
  const harmony = useHarmonyExplorer();
  const harmonyOutput = useHarmonyExplorerOutput();
  const finder = useStradellaChordFinder();
  const value = useProgressionActions({
    chordProgressionDefinitions,
    harmonyProgression: progression.harmonyProgression,
    harmonyProgressionManualPattern: progression.harmonyProgressionManualPattern,
    harmonyProgressionManualRoot: progression.harmonyProgressionManualRoot,
    harmonyProgressionNoteStepId: progression.harmonyProgressionNoteStepId,
    harmonyProgressionRealizationKeys: progression.harmonyProgressionRealizationKeys,
    setHarmonyProgression: progression.setHarmonyProgression,
    setHarmonyProgressionActiveButtonIds: progression.setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionNoteStepId: progression.setHarmonyProgressionNoteStepId,
    setHarmonyProgressionPreviewIndex: progression.setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionRealizationKeys: progression.setHarmonyProgressionRealizationKeys,
    harmonyProgressionPlan: progressionOutput.harmonyProgressionPlan,
    harmonyProgressionRealizationOptions: progressionOutput.harmonyProgressionRealizationOptions,
    previewHarmonyProgressionStepOnStradella:
      progressionOutput.previewHarmonyProgressionStepOnStradella,
    harmonyProgressionIdRef: harmony.harmonyProgressionIdRef,
    harmonyRecordedProgression: harmony.harmonyRecordedProgression,
    setHarmonyProgressionRecording: harmony.setHarmonyProgressionRecording,
    setHarmonyRecordedNotationVisible: harmony.setHarmonyRecordedNotationVisible,
    harmonySelection: harmony.harmonySelection,
    setHarmonyFocusedReferenceRootPc: harmony.setHarmonyFocusedReferenceRootPc,
    setHarmonyRelatedFamilyId: harmony.setHarmonyRelatedFamilyId,
    setHarmonySelection: harmony.setHarmonySelection,
    harmonyProgressionSectorIndex: harmonyOutput.harmonyProgressionSectorIndex,
    makeHarmonyProgressionChord: harmonyOutput.makeHarmonyProgressionChord,
    stopHarmonyRecordedProgressionPlayback: harmonyOutput.stopHarmonyRecordedProgressionPlayback,
    navigateToTool,
    setChordFinderActive,
    setScaleFinderActive,
    setStradellaChordFinderActive: finder.setStradellaChordFinderActive,
    setStradellaChordFinderMode: finder.setStradellaChordFinderMode,
    setStradellaChordFinderPattern: finder.setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex: finder.setStradellaChordFinderRealizationIndex,
    setStradellaChordFinderRequestedBass: finder.setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot: finder.setStradellaChordFinderRoot,
    stradellaChordFinderPattern: finder.stradellaChordFinderPattern,
    stradellaChordFinderRoot: finder.stradellaChordFinderRoot,
    stopAbcPlayback,
    stopBassPatternPlayback,
    stopSoundPlayback: stopAllPlayback,
    t,
    notify,
  });
  return <CrossToolContext.Provider value={value}>{children}</CrossToolContext.Provider>;
}
