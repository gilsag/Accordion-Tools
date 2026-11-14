import { useContext, useMemo, type ReactNode } from "react";
import type { ToolId } from "../toolRegistry";
import { ScoreEntriesContext, type ScoreEntry } from "./scoreEntries";

/** Adds a tool's score entry to those of the providers above. */
export function ScoreEntryProvider({
  tool,
  score,
  children,
}: {
  tool: ToolId;
  score: ScoreEntry | null;
  children: ReactNode;
}) {
  const above = useContext(ScoreEntriesContext);
  const value = useMemo(() => ({ ...above, [tool]: score }), [above, tool, score]);
  return <ScoreEntriesContext.Provider value={value}>{children}</ScoreEntriesContext.Provider>;
}
