import type { PlatformTools } from "../platform/platformContexts";
import type { useHarmonyRecordingState } from "../../features/harmonyExplorer/useHarmonyRecording";
import type { ProgressionAssistantOutput } from "../../features/progressionAssistant/progressionAssistantContext";
import type { AbcPlayerOutput } from "../../features/abcPlayer/abcPlayerContext";
import type { BassPatternPlayerOutput } from "../../features/bassPatternPlayer/bassPatternPlayerContext";
import type { useHarmonyActions } from "../../features/harmonyExplorer/useHarmonyActions";
import { ROOT_POSITION_BASS } from "../../features/stradellaChordFinder/engine/harmonicIdentity";
import { convertProgressionPreset } from "../../features/progressionAssistant/engine/progressionPresets";
import type { useLanguageSettings } from "../../settings/useLanguageSettings";
import type { useWorkspaceNavigation } from "../useWorkspaceNavigation";
import {
  enterProgressionAssistant,
  enterStradellaFinder,
  enterHarmonyExplorer,
} from "../crossToolCommands";
import type { useBassPatternState } from "../../features/bassPatternPlayer/useBassPatternPlayer";
import type { useHarmonyExplorerState } from "../../features/harmonyExplorer/useHarmonyExplorer";
import type {
  useHarmonyProgressionState,
  useHarmonyProgressionResults,
} from "../../features/progressionAssistant/useProgressionAssistant";
import {
  progressionNoteStep,
  toggleProgressionNoteId,
} from "../../features/progressionAssistant/progressionNoteSelection";
import type { useStradellaChordFinderState } from "../../features/stradellaChordFinder/useStradellaChordFinder";
import type { useScaleFinderState } from "../../features/scaleFinder/useScaleFinder";
import type { useTrebleChordFinderState } from "../../features/trebleChordFinder/useTrebleChordFinder";
import { stopAllSound } from "../../audio/sound";
import type { HarmonyProgressionChord } from "../../features/progressionAssistant/engine/progression";
import { progressionFinderPattern } from "../../features/progressionAssistant/engine/progression";
import { isHarmonyProgressionChord } from "../../features/progressionAssistant/engine/progression";
import { progressionRealizationKey } from "../../features/progressionAssistant/engine/progression";
import {
  finderPatternForHarmonyFamily,
  harmonyFamilyForFinderPattern,
  pitchClassNameFromNumber,
  pitchClassNumberFromName,
} from "../../features/harmonyExplorer/engine/integration";
import type { PlatformNotices } from "../platform/platformContexts";

export type UseProgressionActionsDeps = Pick<
  ReturnType<typeof useBassPatternState>,
  "chordProgressionDefinitions"
> &
  Pick<
    ReturnType<typeof useHarmonyProgressionState>,
    | "harmonyProgression"
    | "harmonyProgressionManualPattern"
    | "harmonyProgressionManualRoot"
    | "harmonyProgressionNoteStepId"
    | "harmonyProgressionRealizationKeys"
    | "setHarmonyProgression"
    | "setHarmonyProgressionActiveButtonIds"
    | "setHarmonyProgressionNoteStepId"
    | "setHarmonyProgressionPreviewIndex"
    | "setHarmonyProgressionRealizationKeys"
  > &
  Pick<
    ReturnType<typeof useHarmonyRecordingState>,
    | "harmonyProgressionIdRef"
    | "harmonyRecordedProgression"
    | "setHarmonyProgressionRecording"
    | "setHarmonyRecordedNotationVisible"
  > &
  Pick<
    ReturnType<typeof useHarmonyProgressionResults>,
    "harmonyProgressionPlan" | "harmonyProgressionRealizationOptions"
  > &
  Pick<ProgressionAssistantOutput, "previewHarmonyProgressionStepOnStradella"> &
  Pick<
    ReturnType<typeof useHarmonyActions>,
    | "harmonyProgressionSectorIndex"
    | "makeHarmonyProgressionChord"
    | "stopHarmonyRecordedProgressionPlayback"
  > &
  Pick<
    ReturnType<typeof useHarmonyExplorerState>,
    | "harmonySelection"
    | "setHarmonyFocusedReferenceRootPc"
    | "setHarmonyRelatedFamilyId"
    | "setHarmonySelection"
  > &
  Pick<ReturnType<typeof useWorkspaceNavigation>, "navigateToTool"> &
  Pick<ReturnType<typeof useTrebleChordFinderState>, "setChordFinderActive"> &
  Pick<ReturnType<typeof useScaleFinderState>, "setScaleFinderActive"> &
  Pick<AbcPlayerOutput, "stopAbcPlayback"> &
  Pick<BassPatternPlayerOutput, "stopBassPatternPlayback"> & {
    stopSoundPlayback: PlatformTools["stopAllPlayback"];
  } & Pick<
    ReturnType<typeof useStradellaChordFinderState>,
    | "setStradellaChordFinderActive"
    | "setStradellaChordFinderMode"
    | "setStradellaChordFinderPattern"
    | "setStradellaChordFinderRealizationIndex"
    | "setStradellaChordFinderRequestedBass"
    | "setStradellaChordFinderRoot"
    | "stradellaChordFinderPattern"
    | "stradellaChordFinderRoot"
  > &
  Pick<ReturnType<typeof useLanguageSettings>, "t"> &
  Pick<PlatformNotices, "notify">;

/** Progression Assistant editing, and the commands that move chords between Harmony Explorer, the Progression Assistant and the Stradella Chord Finder. */
export function useProgressionActions(deps: UseProgressionActionsDeps) {
  const {
    chordProgressionDefinitions,
    harmonyProgression,
    harmonyProgressionIdRef,
    harmonyProgressionManualPattern,
    harmonyProgressionManualRoot,
    harmonyProgressionNoteStepId,
    harmonyProgressionPlan,
    previewHarmonyProgressionStepOnStradella,
    harmonyProgressionRealizationKeys,
    harmonyProgressionRealizationOptions,
    harmonyProgressionSectorIndex,
    harmonyRecordedProgression,
    harmonySelection,
    makeHarmonyProgressionChord,
    navigateToTool,
    setChordFinderActive,
    setHarmonyFocusedReferenceRootPc,
    setHarmonyProgression,
    setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionNoteStepId,
    setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionRealizationKeys,
    setHarmonyProgressionRecording,
    setHarmonyRecordedNotationVisible,
    setHarmonyRelatedFamilyId,
    setHarmonySelection,
    setScaleFinderActive,
    setStradellaChordFinderActive,
    setStradellaChordFinderMode,
    setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex,
    setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot,
    stopAbcPlayback,
    stopBassPatternPlayback,
    stopHarmonyRecordedProgressionPlayback,
    stopSoundPlayback,
    stradellaChordFinderPattern,
    stradellaChordFinderRoot,
    t,
    notify,
  } = deps;

  /** Ports make cross-tool side-effect order testable without coupling a tool to
   * another tool's React state. Musical payload construction stays at the call site. */
  function progressionDestinationPorts() {
    return {
      navigate: () => navigateToTool("progressionAssistant", { side: "stradella" }),
      clearPreview: () => setHarmonyProgressionPreviewIndex(null),
      disableStradellaFinder: () => setStradellaChordFinderActive(false),
      disableScaleFinder: () => setScaleFinderActive(false),
      disableTrebleChordFinder: () => setChordFinderActive(false),
      stopAbc: stopAbcPlayback,
      stopBassPattern: stopBassPatternPlayback,
    };
  }

  function stradellaFinderDestinationPorts(assignChord: () => void) {
    return {
      navigate: () => navigateToTool("stradellaChordFinder", { side: "stradella" }),
      assignChord,
      resetRealization: () => setStradellaChordFinderRealizationIndex(0),
      enableFinder: () => setStradellaChordFinderActive(true),
      disableScaleFinder: () => setScaleFinderActive(false),
      disableTrebleChordFinder: () => setChordFinderActive(false),
      stopAbc: stopAbcPlayback,
    };
  }

  function sendHarmonyRecordedProgressionToAssistant() {
    const recordedChords = harmonyRecordedProgression.filter(isHarmonyProgressionChord);
    if (recordedChords.length === 0) return;
    if (recordedChords.length < harmonyRecordedProgression.length) {
      notify(t("ui.onlyChordsTransferred"), "info");
    }
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyProgression(
      recordedChords.map((chord) => ({
        ...chord,
        id: `harmony-progression-${harmonyProgressionIdRef.current++}`,
      })),
    );
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedNotationVisible(false);
    setHarmonyProgressionNoteStepId(null);
    enterProgressionAssistant(progressionDestinationPorts(), "transfer");
  }

  function sameHarmonyProgressionChord(
    a: HarmonyProgressionChord | undefined,
    b: HarmonyProgressionChord,
  ) {
    return (
      !!a && a.rootPc === b.rootPc && progressionFinderPattern(a) === progressionFinderPattern(b)
    );
  }

  function useHarmonyProgressionPreset(id: string, keyRoot: string) {
    const definition = chordProgressionDefinitions.find((item) => item.id === id);
    if (!definition) return;
    const converted = convertProgressionPreset(definition, keyRoot);
    if (converted.unsupported.length > 0 || converted.chords.length === 0) return;
    stopSoundPlayback();
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionRealizationKeys({});
    setHarmonyProgressionPreviewIndex(null);
    setHarmonyProgressionNoteStepId(null);
    setHarmonyProgression(
      converted.chords.map(({ rootPc, pattern, sectorIndex }) => ({
        id: `harmony-progression-${harmonyProgressionIdRef.current++}`,
        rootPc,
        pattern,
        sectorIndex,
      })),
    );
  }

  function addManualHarmonyProgressionChord() {
    const rootPc = pitchClassNumberFromName(harmonyProgressionManualRoot);
    if (rootPc === null) return;
    setHarmonyProgression((current) => [
      ...current,
      {
        id: `harmony-progression-${harmonyProgressionIdRef.current++}`,
        rootPc,
        pattern: harmonyProgressionManualPattern,
        sectorIndex: harmonyProgressionSectorIndex(rootPc),
      },
    ]);
  }

  function addSelectedHarmonyRelationshipToProgression() {
    if (!harmonySelection) return;
    const reference = makeHarmonyProgressionChord(
      harmonySelection.referenceRootPc,
      harmonySelection.referenceFamilyId,
      harmonySelection.sectorIndex,
    );
    const target = makeHarmonyProgressionChord(
      harmonySelection.candidate.rootPc,
      harmonySelection.candidate.familyId,
      harmonySelection.sectorIndex,
    );
    setHarmonyProgression((current) => {
      const next = [...current];
      if (!sameHarmonyProgressionChord(next[next.length - 1], reference)) next.push(reference);
      if (!sameHarmonyProgressionChord(next[next.length - 1], target)) next.push(target);
      return next;
    });
    enterProgressionAssistant(progressionDestinationPorts(), "transfer");
  }

  function removeHarmonyProgressionChord(index: number) {
    setHarmonyProgression((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  }

  function moveHarmonyProgressionChord(index: number, direction: -1 | 1) {
    setHarmonyProgression((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function cycleHarmonyProgressionRealization(index: number, direction: -1 | 1) {
    const chord = harmonyProgression[index];
    if (!chord) return;
    const available = harmonyProgressionRealizationOptions[chord.id] ?? [];
    if (available.length === 0) return;
    // The first position is Auto (global optimized path), followed by every
    // original-ranked Chord Finder candidate, including ranks beyond five.
    const choices = [null, ...available.map(({ result }) => progressionRealizationKey(result))];
    const current = harmonyProgressionRealizationKeys[chord.id] ?? null;
    const position = Math.max(0, choices.indexOf(current));
    const selected = choices[(position + direction + choices.length) % choices.length];
    stopSoundPlayback(); // An old scheduled rhythm must never play against a new visible plan.
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionRealizationKeys((previous) => {
      const next = { ...previous };
      if (selected === null) delete next[chord.id];
      else next[chord.id] = selected;
      return next;
    });
    // If a different chord owns the eye, its notes must not override the
    // realization now being navigated with the arrows.
    if (harmonyProgressionNoteStepId && harmonyProgressionNoteStepId !== chord.id)
      setHarmonyProgressionNoteStepId(null);
    setHarmonyProgressionPreviewIndex(index);
  }

  function toggleHarmonyProgressionStepNotes(id: string) {
    if (!progressionNoteStep(harmonyProgressionPlan, id)) return;
    const index = harmonyProgressionPlan.steps.findIndex((step) => step.chord.id === id);
    if (index < 0) return;
    if (toggleProgressionNoteId(harmonyProgressionNoteStepId, id) === null) {
      setHarmonyProgressionNoteStepId(null);
      setHarmonyProgressionPreviewIndex(null);
    } else {
      stopSoundPlayback();
      setHarmonyProgressionNoteStepId(id);
      // Routing retains the tool and the Stradella side; it cannot pin or
      // change this step's sounding realization.
      previewHarmonyProgressionStepOnStradella(index);
    }
  }

  function showHarmonySelectionOnStradella() {
    if (!harmonySelection) return;
    const pattern = finderPatternForHarmonyFamily(harmonySelection.candidate.familyId);
    if (!pattern) return;
    enterStradellaFinder(
      stradellaFinderDestinationPorts(() => {
        setStradellaChordFinderRoot(pitchClassNameFromNumber(harmonySelection.candidate.rootPc));
        setStradellaChordFinderRequestedBass(ROOT_POSITION_BASS);
        setStradellaChordFinderPattern(pattern);
        setStradellaChordFinderMode("bass-and-chords");
      }),
      "harmony-selection",
    );
  }

  function exploreCurrentStradellaChordInHarmony() {
    const familyId = harmonyFamilyForFinderPattern(stradellaChordFinderPattern);
    const rootPc = pitchClassNumberFromName(stradellaChordFinderRoot);
    if (!familyId || rootPc === null) return;

    const previousSelectionMatches =
      harmonySelection?.candidate.familyId === familyId &&
      harmonySelection.candidate.rootPc === rootPc;

    if (!previousSelectionMatches) {
      // A chord coming from the Stradella finder belongs in the outer-ring
      // family. Preserve the user's current reference family instead of
      // replacing it with the target chord family.
      setHarmonyRelatedFamilyId(familyId);
      setHarmonySelection(null);
      setHarmonyFocusedReferenceRootPc(null);
    }

    enterHarmonyExplorer({
      navigate: () => navigateToTool("harmonyExplorer"),
      stopAllSound,
      stopAbc: stopAbcPlayback,
      stopBassPattern: stopBassPatternPlayback,
    });
  }

  return {
    sendHarmonyRecordedProgressionToAssistant,
    useHarmonyProgressionPreset,
    addManualHarmonyProgressionChord,
    addSelectedHarmonyRelationshipToProgression,
    removeHarmonyProgressionChord,
    moveHarmonyProgressionChord,
    cycleHarmonyProgressionRealization,
    toggleHarmonyProgressionStepNotes,
    showHarmonySelectionOnStradella,
    exploreCurrentStradellaChordInHarmony,
  };
}
