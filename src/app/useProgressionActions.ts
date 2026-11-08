import type { useAccordionPlayback } from "./useAccordionPlayback";
import type { useHarmonyActions } from "./useHarmonyActions";
import { ROOT_POSITION_BASS } from "../tools/stradellaChordFinder/harmonicIdentity";
import { convertProgressionPreset } from "../tools/harmonyExplorer/progressionPresets";
import { useState } from "react";
import type { useLanguageSettings } from "../settings/useLanguageSettings";
import type { useWorkspaceNavigation } from "../app/useWorkspaceNavigation";
import { enterProgressionAssistant, enterStradellaFinder, enterHarmonyExplorer } from "./crossToolCommands";
import type { useBassPatternState } from "../features/bassPatternPlayer/useBassPatternPlayer";
import type { useHarmonyExplorerState } from "../features/harmonyExplorer/useHarmonyExplorer";
import type { useHarmonyProgressionState, useHarmonyProgressionResults } from "../features/progressionAssistant/useProgressionAssistant";
import { progressionNoteStep, toggleProgressionNoteId } from "../features/progressionAssistant/progressionNoteSelection";
import type { useStradellaChordFinderState } from "../features/stradellaChordFinder/useStradellaChordFinder";
import type { useScaleFinderState } from "../features/scaleFinder/useScaleFinder";
import type { useTrebleChordFinderState } from "../features/trebleChordFinder/useTrebleChordFinder";
import type { useSoundSettings } from "../audio/useSoundSettings";
import type { DiagramButton } from "../types";
import { playButtonRhythmProgression, stopAllSound } from "../sound";
import { DEFAULT_RING_VISIBILITY } from "../tools/harmonyExplorer/music";
import type { HarmonyProgressionChord } from "../tools/harmonyExplorer/progression";
import { progressionFinderPattern } from "../tools/harmonyExplorer/progression";
import { isHarmonyProgressionChord } from "../tools/harmonyExplorer/progression";
import { progressionBassPulseButtons, progressionRealizationKey } from "../tools/harmonyExplorer/progression";
import { finderPatternForHarmonyFamily, harmonyFamilyForFinderPattern, pitchClassNameFromNumber, pitchClassNumberFromName } from "../tools/harmonyExplorer/integration";
import type { OptimizedProgressionStep } from "../tools/harmonyExplorer/progression";

export type UseProgressionActionsDeps = Pick<ReturnType<typeof useBassPatternState>,
    "chordProgressionDefinitions"> &
  Pick<ReturnType<typeof useHarmonyProgressionState>,
    "harmonyProgression" | "harmonyProgressionIdRef" | "harmonyProgressionManualPattern" |
    "harmonyProgressionManualRoot" | "harmonyProgressionNoteStepId" |
    "harmonyProgressionRealizationKeys" | "harmonyProgressionRhythmPattern" |
    "harmonyRecordedProgression" | "setHarmonyProgression" |
    "setHarmonyProgressionActiveButtonIds" | "setHarmonyProgressionNoteStepId" |
    "setHarmonyProgressionPreviewIndex" | "setHarmonyProgressionPulseSilent" |
    "setHarmonyProgressionRealizationKeys" | "setHarmonyProgressionRecording" |
    "setHarmonyRecordedNotationVisible" | "setHarmonyRecordedProgression"> &
  Pick<ReturnType<typeof useHarmonyProgressionResults>,
    "harmonyProgressionPlan" | "harmonyProgressionRealizationOptions"> &
  Pick<ReturnType<typeof useHarmonyActions>,
    "harmonyProgressionSectorIndex" | "makeHarmonyProgressionChord" |
    "stopHarmonyRecordedProgressionPlayback"> &
  Pick<ReturnType<typeof useHarmonyExplorerState>,
    "harmonySelection" | "setHarmonyColorByFamily" | "setHarmonyDiameter" |
    "setHarmonyDiatonicOnly" | "setHarmonyFocusedReferenceRootPc" | "setHarmonyFontSize" |
    "setHarmonyHighlightDiatonic" | "setHarmonyPlaybackStyle" | "setHarmonyReferenceFamilyId" |
    "setHarmonyRelatedFamilyId" | "setHarmonyRingVisibility" | "setHarmonyScaleId" |
    "setHarmonySelection" | "setHarmonyShowEnharmonics" | "setHarmonyShowExplanation" |
    "setHarmonyShowLegend" | "setHarmonyShowNoteRing" | "setHarmonyShowSeparators" |
    "setHarmonyShowToneTooltips" | "setHarmonyVoicingStyle"> &
  Pick<ReturnType<typeof useWorkspaceNavigation>,
    "navigateToTool"> &
  Pick<ReturnType<typeof useTrebleChordFinderState>,
    "setChordFinderActive"> &
  Pick<ReturnType<typeof useScaleFinderState>,
    "setScaleFinderActive"> &
  Pick<ReturnType<typeof useAccordionPlayback>,
    "setSoundEnginePlayer" | "startWhenSamplesReady" | "stopAbcPlayback" |
    "stopBassPatternPlayback" | "stopSoundPlayback"> &
  Pick<ReturnType<typeof useStradellaChordFinderState>,
    "setStradellaChordFinderActive" | "setStradellaChordFinderMode" |
    "setStradellaChordFinderPattern" | "setStradellaChordFinderRealizationIndex" |
    "setStradellaChordFinderRequestedBass" | "setStradellaChordFinderRoot" |
    "stradellaChordFinderPattern" | "stradellaChordFinderRoot"> &
  Pick<ReturnType<typeof useSoundSettings>,
    "soundOptions"> &
  Pick<ReturnType<typeof useLanguageSettings>,
    "t"> &
  {
    buttons: DiagramButton[];
    progressionRhythmPulses: (step: OptimizedProgressionStep) => DiagramButton[][];
  };

/** Progression Assistant editing, path display and playback, and the commands that move chords between Harmony Explorer, the Progression Assistant and the Stradella Chord Finder. */
export function useProgressionActions(deps: UseProgressionActionsDeps) {
  const {
    buttons, chordProgressionDefinitions, harmonyProgression, harmonyProgressionIdRef,
    harmonyProgressionManualPattern, harmonyProgressionManualRoot, harmonyProgressionNoteStepId,
    harmonyProgressionPlan, harmonyProgressionRealizationKeys, harmonyProgressionRealizationOptions,
    harmonyProgressionRhythmPattern, harmonyProgressionSectorIndex, harmonyRecordedProgression,
    harmonySelection, makeHarmonyProgressionChord, navigateToTool, progressionRhythmPulses,
    setChordFinderActive, setHarmonyColorByFamily, setHarmonyDiameter, setHarmonyDiatonicOnly,
    setHarmonyFocusedReferenceRootPc, setHarmonyFontSize, setHarmonyHighlightDiatonic,
    setHarmonyPlaybackStyle, setHarmonyProgression, setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionNoteStepId, setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionPulseSilent, setHarmonyProgressionRealizationKeys,
    setHarmonyProgressionRecording, setHarmonyRecordedNotationVisible, setHarmonyRecordedProgression,
    setHarmonyReferenceFamilyId, setHarmonyRelatedFamilyId, setHarmonyRingVisibility,
    setHarmonyScaleId, setHarmonySelection, setHarmonyShowEnharmonics, setHarmonyShowExplanation,
    setHarmonyShowLegend, setHarmonyShowNoteRing, setHarmonyShowSeparators,
    setHarmonyShowToneTooltips, setHarmonyVoicingStyle, setScaleFinderActive, setSoundEnginePlayer,
    setStradellaChordFinderActive, setStradellaChordFinderMode, setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex, setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot, soundOptions, startWhenSamplesReady, stopAbcPlayback,
    stopBassPatternPlayback, stopHarmonyRecordedProgressionPlayback, stopSoundPlayback,
    stradellaChordFinderPattern, stradellaChordFinderRoot, t,
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
      window.alert(t("ui.onlyChordsTransferred"));
    }
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyProgression(recordedChords.map((chord) => ({ ...chord, id: `harmony-progression-${harmonyProgressionIdRef.current++}` })));
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedNotationVisible(false);
    setHarmonyProgressionNoteStepId(null);
    enterProgressionAssistant(progressionDestinationPorts(), "transfer");
  }

  function sameHarmonyProgressionChord(a: HarmonyProgressionChord | undefined, b: HarmonyProgressionChord) {
    return !!a && a.rootPc === b.rootPc && progressionFinderPattern(a) === progressionFinderPattern(b);
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
    setHarmonyProgression(converted.chords.map(({ rootPc, pattern, sectorIndex }) => ({
      id: `harmony-progression-${harmonyProgressionIdRef.current++}`, rootPc, pattern, sectorIndex,
    })));
  }

  function addManualHarmonyProgressionChord() {
    const rootPc = pitchClassNumberFromName(harmonyProgressionManualRoot);
    if (rootPc === null) return;
    setHarmonyProgression((current) => [
      ...current,
      { id: `harmony-progression-${harmonyProgressionIdRef.current++}`,
        rootPc, pattern: harmonyProgressionManualPattern,
        sectorIndex: harmonyProgressionSectorIndex(rootPc) },
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
    if (harmonyProgressionNoteStepId && harmonyProgressionNoteStepId !== chord.id) setHarmonyProgressionNoteStepId(null);
    setHarmonyProgressionPreviewIndex(index);
  }

  function previewHarmonyProgressionStepOnStradella(index: number) {
    const step = harmonyProgressionPlan.steps[index];
    if (!step) return;
    setHarmonyProgressionPreviewIndex(index);
    setHarmonyProgressionNoteStepId(step.chord.id);
    enterProgressionAssistant(progressionDestinationPorts(), "preview");
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

  function playOptimizedHarmonyProgression() {
    if (!harmonyProgressionPlan.playable) return;
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionPulseSilent(false);
    const pulses = harmonyProgressionPlan.steps.map(progressionRhythmPulses);
    startWhenSamplesReady(pulses.flat(2), () => {
      playButtonRhythmProgression(
        harmonyProgressionPlan.steps.map((step) => step.result.playbackButtons),
        soundOptions,
        harmonyProgressionRhythmPattern,
        {
          onActiveButtons: (buttonIds, progressionIndex) => {
            setHarmonyProgressionPulseSilent(buttonIds.length === 0);
            setHarmonyProgressionActiveButtonIds(buttonIds);
            setHarmonyProgressionPreviewIndex(progressionIndex);
          },
          onDone: () => {
            setHarmonyProgressionActiveButtonIds([]);
            setHarmonyProgressionPulseSilent(false);
            setSoundEnginePlayer(null);
          },
        },
        harmonyProgressionPlan.steps.map((step) => progressionBassPulseButtons(buttons, step)),
        pulses,
      );
      // Set after the player's own stopAllSound(), which clears this state.
      if (soundOptions.enabled) setSoundEnginePlayer("progression");
    });
  }

  function resetHarmonyExplorer() {
    setHarmonyReferenceFamilyId("major");
    setHarmonyRelatedFamilyId("minor7");
    setHarmonyScaleId("ionian");
    setHarmonyDiatonicOnly(false);
    setHarmonyHighlightDiatonic(true);
    setHarmonyShowEnharmonics(false);
    setHarmonyShowSeparators(true);
    setHarmonyShowLegend(true);
    setHarmonyShowExplanation(false);
    setHarmonyRingVisibility({ ...DEFAULT_RING_VISIBILITY });
    setHarmonyShowToneTooltips(true);
    setHarmonyShowNoteRing(true);
    setHarmonyColorByFamily(false);
    setHarmonyDiameter(900);
    setHarmonyFontSize(18);
    setHarmonyPlaybackStyle("block");
    setHarmonyVoicingStyle("root");
    setHarmonySelection(null);
    setHarmonyFocusedReferenceRootPc(null);
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedProgression([]);
    setHarmonyRecordedNotationVisible(false);
  }

  function showHarmonySelectionOnStradella() {
    if (!harmonySelection) return;
    const pattern = finderPatternForHarmonyFamily(harmonySelection.candidate.familyId);
    if (!pattern) return;
    enterStradellaFinder(stradellaFinderDestinationPorts(() => {
      setStradellaChordFinderRoot(pitchClassNameFromNumber(harmonySelection.candidate.rootPc));
      setStradellaChordFinderRequestedBass(ROOT_POSITION_BASS);
      setStradellaChordFinderPattern(pattern);
      setStradellaChordFinderMode("bass-and-chords");
    }), "harmony-selection");
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
      stopAllSound, stopAbc: stopAbcPlayback,
      stopBassPattern: stopBassPatternPlayback,
    });
  }

  // Session-only: draw the Progression Assistant path (numbered steps) on the diagram. Off by default.
  const [progressionPathVisible, setProgressionPathVisible] = useState(false);

  return {
    sendHarmonyRecordedProgressionToAssistant, useHarmonyProgressionPreset,
    addManualHarmonyProgressionChord, addSelectedHarmonyRelationshipToProgression,
    removeHarmonyProgressionChord, moveHarmonyProgressionChord, cycleHarmonyProgressionRealization,
    previewHarmonyProgressionStepOnStradella, toggleHarmonyProgressionStepNotes,
    playOptimizedHarmonyProgression, resetHarmonyExplorer, showHarmonySelectionOnStradella,
    exploreCurrentStradellaChordInHarmony, progressionPathVisible, setProgressionPathVisible,
  };
}
