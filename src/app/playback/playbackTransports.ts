import { createContext, useContext } from "react";
import type { ToolId } from "../toolRegistry";
import { usePlatformNavigation } from "../platform/platformContexts";

export type PlaybackBarState = "stopped" | "playing" | "paused";

/** What the shared playback bar controls for a tool. Players without a
 * tracked transport state (Progression Assistant, Sequence) stay "stopped":
 * Play restarts them and Stop silences everything. */
export type PlaybackTransport = {
  label: string;
  state: PlaybackBarState;
  canPlay: boolean;
  onPlay: () => void;
  onPause?: () => void;
  onStop: () => void;
  /** Plays in time, so the bar offers the count-in and metronome switches
   * (ABC Player, Bass Pattern Player, Progression Assistant, Rhythm Trainer). */
  rhythmic?: boolean;
};

/** Each player's entry for the playback bar, keyed by tool. A player whose
 * entry is null has nothing to play in the current situation (the Bass
 * Pattern Player on the treble side, Annotate Diagram outside Sequence mode). */
export type PlaybackTransports = Partial<Record<ToolId, PlaybackTransport | null>>;
export const PlaybackTransportsContext = createContext<PlaybackTransports>({});

/** The entry of the player the workspace is showing: the Harmony recording in
 * the Harmony workspace, otherwise the open tool's. */
export function useActivePlaybackTransport(): PlaybackTransport | null {
  const transports = useContext(PlaybackTransportsContext);
  const { workspaceMode, activeToolSection } = usePlatformNavigation();
  if (workspaceMode === "harmony") return transports.harmonyExplorer ?? null;
  return activeToolSection ? (transports[activeToolSection] ?? null) : null;
}
