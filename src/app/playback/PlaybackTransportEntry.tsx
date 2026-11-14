import { useContext, useMemo, type ReactNode } from "react";
import type { ToolId } from "../toolRegistry";
import { PlaybackTransportsContext, type PlaybackTransport } from "./playbackTransports";

/** Adds a player's playback-bar entry to those of the providers above. */
export function PlaybackTransportEntry({
  tool,
  transport,
  children,
}: {
  tool: ToolId;
  transport: PlaybackTransport | null;
  children: ReactNode;
}) {
  const above = useContext(PlaybackTransportsContext);
  const value = useMemo(() => ({ ...above, [tool]: transport }), [above, tool, transport]);
  return (
    <PlaybackTransportsContext.Provider value={value}>
      {children}
    </PlaybackTransportsContext.Provider>
  );
}
