import { PlaybackTransportEntry } from "../../app/playback/PlaybackTransportEntry";
import type { PlaybackTransport } from "../../app/playback/playbackTransports";
import { useMemo, type ReactNode } from "react";
import { usePlatformLanguage, usePlatformSound } from "../../app/platform/platformContexts";
import { HarmonyExplorerOutputContext, useHarmonyExplorer } from "./harmonyExplorerContext";
import { harmonyRecordingNotationAbc } from "./harmonyRecordingNotation";
import { useHarmonyActions } from "./useHarmonyActions";
import { useHarmonyExplorerResults } from "./useHarmonyExplorer";

/** The circle's sectors, counts, scale and explanation; what clicking the
 * circle plays and records; and the recording's score and playback. */
export function HarmonyExplorerOutputProvider({ children }: { children: ReactNode }) {
  const { language, t } = usePlatformLanguage();
  const { soundOptions, soundSequenceTempoBpm } = usePlatformSound();
  const state = useHarmonyExplorer();
  const results = useHarmonyExplorerResults({ ...state, language, t });
  const actions = useHarmonyActions({ ...state, soundOptions, soundSequenceTempoBpm });
  const { harmonyRecordedProgression, harmonyShowEnharmonics } = state;
  const harmonyRecordedProgressionNotationAbc = useMemo(
    () =>
      harmonyRecordingNotationAbc(
        harmonyRecordedProgression,
        harmonyShowEnharmonics,
        soundSequenceTempoBpm,
      ),
    [harmonyRecordedProgression, harmonyShowEnharmonics, soundSequenceTempoBpm],
  );
  const value = { ...results, ...actions, harmonyRecordedProgressionNotationAbc };
  // The recording's transport, once something is recorded.
  const playbackEntry: PlaybackTransport | null =
    harmonyRecordedProgression.length > 0
      ? {
          label: t("tools.harmonyExplorer"),
          state: state.harmonyRecordedProgressionPlaying ? "playing" : "stopped",
          canPlay: true,
          onPlay: actions.playHarmonyRecordedProgression,
          onStop: actions.stopHarmonyRecordedProgressionPlayback,
        }
      : null;
  return (
    <HarmonyExplorerOutputContext.Provider value={value}>
      <PlaybackTransportEntry tool="harmonyExplorer" transport={playbackEntry}>
        {children}
      </PlaybackTransportEntry>
    </HarmonyExplorerOutputContext.Provider>
  );
}
