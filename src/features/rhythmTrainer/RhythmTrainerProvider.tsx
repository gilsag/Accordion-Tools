import type { ReactNode } from "react";
import {
  usePlatformNavigation,
  usePlatformNotation,
  usePlatformSound,
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
  const { stradellaNotationMode, stradellaChordQualityLabels, stradellaMarkCounterbass } =
    usePlatformNotation();
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
  return <RhythmTrainerContext.Provider value={value}>{children}</RhythmTrainerContext.Provider>;
}
