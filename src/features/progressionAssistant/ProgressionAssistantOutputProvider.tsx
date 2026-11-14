import { ScoreEntryProvider } from "../../app/notation/ScoreEntryProvider";
import type { ScoreEntry } from "../../app/notation/scoreEntries";
import { PlaybackTransportEntry } from "../../app/playback/PlaybackTransportEntry";
import type { PlaybackTransport } from "../../app/playback/playbackTransports";
import { usePlatformLanguage, usePlatformTools } from "../../app/platform/platformContexts";
import { useMemo, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformNavigation,
  usePlatformNotation,
  usePlatformPlayback,
  usePlatformSound,
  usePlatformSpelling,
} from "../../app/platform/platformContexts";
import { playButtonRhythmProgression } from "../../sound";
import { progressionBassPulseButtons } from "../../tools/harmonyExplorer/progression";
import { useProgressionNotation } from "./useProgressionNotation";
import type { ProgressionSearchSettings } from "../../tools/harmonyExplorer/progression";
import { useStradellaChordFinder } from "../stradellaChordFinder/stradellaChordFinderContext";
import {
  ProgressionAssistantOutputContext,
  useProgressionAssistant,
} from "./progressionAssistantContext";
import { useHarmonyProgressionResults } from "./useProgressionAssistant";

/** The optimized plan for the progression, its realization options, the
 * previewed step, what is lit, its rhythm pulses and score, and Play. */
export function ProgressionAssistantOutputProvider({ children }: { children: ReactNode }) {
  const { basses, stradellaRegisterModel } = usePlatformInstrument();
  const { buttonSize, spacing, diagramVerticalSpacing } = usePlatformAppearance();
  const { accidental } = usePlatformSpelling();
  const { activeToolSection } = usePlatformNavigation();
  const state = useProgressionAssistant();
  const {
    stradellaRequestedBassOnBassButton,
    finderMaxButtons,
    finderSpanColumns,
    stradellaMinimumNominalGap,
  } = useStradellaChordFinder();
  const { harmonyProgressionRootPosition } = state;

  // The assistant searches each chord with the Chord Finder's own limits,
  // register model and bass rules, so that with both weights at 0 every chord
  // gets the Chord Finder's first realization.
  const progressionSearch = useMemo<ProgressionSearchSettings>(
    () => ({
      rootPosition: harmonyProgressionRootPosition,
      requestedBassOnBassButton: stradellaRequestedBassOnBassButton,
      maxButtons: finderMaxButtons,
      spanColumns: finderSpanColumns,
      registerModel: stradellaRegisterModel,
      minimumNominalGap: stradellaMinimumNominalGap,
    }),
    [
      harmonyProgressionRootPosition,
      stradellaRequestedBassOnBassButton,
      finderMaxButtons,
      finderSpanColumns,
      stradellaRegisterModel,
      stradellaMinimumNominalGap,
    ],
  );
  const results = useHarmonyProgressionResults({
    ...state,
    basses,
    buttonSize,
    spacing,
    // Stradella buttons have no enharmonic spelling mode.
    stradellaAccidental: accidental === "enharmonic" ? "natural" : accidental,
    diagramVerticalSpacing,
    activeToolSection,
    progressionSearch,
  });
  const { buttons } = useDiagramButtons();
  const { soundOptions, soundSequenceTempoBpm } = usePlatformSound();
  const { setSoundEnginePlayer, startWhenSamplesReady } = usePlatformPlayback();
  const { stradellaNotationMode, stradellaChordQualityLabels, stradellaMarkCounterbass } =
    usePlatformNotation();
  const { harmonyProgressionPlan } = results;
  const {
    harmonyProgressionRhythmPattern,
    setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionPulseSilent,
    setHarmonyProgressionPreviewIndex,
  } = state;
  const notation = useProgressionNotation({
    buttons,
    harmonyProgressionPlan,
    harmonyProgressionRhythmPattern,
    soundOptions,
    soundSequenceTempoBpm,
    stradellaNotationMode,
    stradellaChordQualityLabels,
    stradellaMarkCounterbass,
  });

  function playOptimizedHarmonyProgression() {
    if (!harmonyProgressionPlan.playable) return;
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionPulseSilent(false);
    const pulses = harmonyProgressionPlan.steps.map(notation.progressionRhythmPulses);
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

  const value = { ...results, ...notation, progressionSearch, playOptimizedHarmonyProgression };
  const { t } = usePlatformLanguage();
  const { side } = usePlatformInstrument();
  const { soundEnginePlayer } = usePlatformPlayback();
  const { stopAllPlayback } = usePlatformTools();
  // The assistant plays the Stradella side only.
  const playbackEntry: PlaybackTransport | null =
    side === "stradella"
      ? {
          label: t("ui.progressionAssistant"),
          state: soundEnginePlayer === "progression" ? "playing" : "stopped",
          canPlay: harmonyProgressionPlan.playable,
          onPlay: playOptimizedHarmonyProgression,
          onStop: stopAllPlayback,
        }
      : null;
  const scoreEntry: ScoreEntry | null =
    side === "stradella" &&
    state.harmonyProgressionNotationVisible &&
    harmonyProgressionPlan.playable
      ? {
          title: t("ui.optimizedStradellaProgression"),
          abc: notation.harmonyProgressionRenderedNotationAbc,
          filename: "optimized-stradella-progression-notation",
        }
      : null;
  return (
    <ProgressionAssistantOutputContext.Provider value={value}>
      <PlaybackTransportEntry tool="progressionAssistant" transport={playbackEntry}>
        <ScoreEntryProvider tool="progressionAssistant" score={scoreEntry}>
          {children}
        </ScoreEntryProvider>
      </PlaybackTransportEntry>
    </ProgressionAssistantOutputContext.Provider>
  );
}
