import { useContext, useMemo, type ReactNode } from "react";
import type { ToolId } from "../toolRegistry";
import { ScoreEntriesContext, type ScoreEntry, type ScoreToggle } from "./scoreEntries";

/** Adds a tool's score and its toolbar toggle to those of the providers above. */
export function ScoreEntryProvider({
  tool,
  score,
  toggle,
  children,
}: {
  tool: ToolId;
  score: ScoreEntry | null;
  toggle: ScoreToggle | null;
  children: ReactNode;
}) {
  const above = useContext(ScoreEntriesContext);
  const value = useMemo(
    () => ({ ...above, [tool]: { score, toggle } }),
    [above, tool, score, toggle],
  );
  return <ScoreEntriesContext.Provider value={value}>{children}</ScoreEntriesContext.Provider>;
}
