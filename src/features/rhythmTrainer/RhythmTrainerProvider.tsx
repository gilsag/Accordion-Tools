import { RhythmNotationPanel } from "../../app/inspector/RhythmNotationInspector";
import { useScoreRendering } from "../../app/platform/useScoreRendering";
import { ScoreEntryProvider } from "../../app/notation/ScoreEntryProvider";
import type { ScoreEntry, ScoreToggle } from "../../app/notation/scoreEntries";
import { PlaybackTransportEntry } from "../../app/playback/PlaybackTransportEntry";
import type { PlaybackTransport } from "../../app/playback/playbackTransports";
import type { ReactNode } from "react";
import {
  usePlatformNavigation,
  usePlatformNotation,
  usePlatformSound,
  usePlatformLanguage,
  usePlatformTools,
} from "../../app/platform/platformContexts";
import { useSideButtonSettings } from "../../app/platform/useSideButtonSettings";
import { useBassPatternPlayer } from "../bassPatternPlayer/bassPatternPlayerContext";
import { RhythmTrainerContext } from "./rhythmTrainerContext";
import { useRhythmTrainerState } from "./useRhythmTrainer";

/** Owns the Rhythm Trainer: exercise choices, its two-hand schedule and its
 * score. It reads the progression and pattern libraries from the Bass
 * Pattern Player, whose provider is outside this one. Its state is not saved. */
export function RhythmTrainerProvider({ children }: { children: ReactNode }) {
  const {
    stradellaNotationMode,
    stradellaChordQualityLabels,
    stradellaMarkCounterbass,
    musicNotationIncludeTitle,
  } = usePlatformNotation();
  const { renderNotationInto } = useScoreRendering();
  const { soundOptions } = usePlatformSound();
  const { activeToolSection } = usePlatformNavigation();
  const { stopAllPlayback } = usePlatformTools();
  const { bassPatternDefinitions, chordProgressionDefinitions } = useBassPatternPlayer();
  const value = useRhythmTrainerState({
    notationPreferences: {
      mode: stradellaNotationMode,
      chordQualityLabels: stradellaChordQualityLabels,
      markCounterbass: stradellaMarkCounterbass,
    },
    sideButtonSettings: useSideButtonSettings(),
    bassPatterns: bassPatternDefinitions,
    chordProgressions: chordProgressionDefinitions,
    soundOptions,
    activeToolSection,
    stopOtherPlayback: stopAllPlayback,
  });
  const { t } = usePlatformLanguage();
  const playbackEntry: PlaybackTransport = {
    label: t("rhythm.title"),
    state: value.playing ? "playing" : "stopped",
    canPlay: value.canPlay,
    onPlay: () => void value.play(),
    onStop: value.stop,
  };
  // The Rhythm Trainer's score is a panel of its own (two hands, cursor).
  const scoreToggle: ScoreToggle | null =
    value.exercise.barCount > 0
      ? {
          visible: value.notationVisible,
          toggle: () => value.setNotationVisible(!value.notationVisible),
        }
      : null;
  const scoreEntry: ScoreEntry | null =
    value.notationVisible && value.exercise.barCount > 0
      ? {
          panel: (
            <RhythmNotationPanel
              trainer={value}
              renderNotationInto={renderNotationInto}
              showTitle={musicNotationIncludeTitle}
            />
          ),
        }
      : null;
  return (
    <RhythmTrainerContext.Provider value={value}>
      <PlaybackTransportEntry tool="rhythmTrainer" transport={playbackEntry}>
        <ScoreEntryProvider tool="rhythmTrainer" score={scoreEntry} toggle={scoreToggle}>
          {children}
        </ScoreEntryProvider>
      </PlaybackTransportEntry>
    </RhythmTrainerContext.Provider>
  );
}
