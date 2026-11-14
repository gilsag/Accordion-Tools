import { useContext, useMemo, type ReactNode } from "react";
import type { ToolId } from "../toolRegistry";
import { ResultsEntriesContext } from "./resultsEntries";

/** Adds a tool's results panel, or null while it has none, to those of the providers above. */
export function ResultsEntryProvider({
  tool,
  panel,
  children,
}: {
  tool: ToolId;
  panel: ReactNode | null;
  children: ReactNode;
}) {
  const above = useContext(ResultsEntriesContext);
  const value = useMemo(() => ({ ...above, [tool]: panel }), [above, tool, panel]);
  return <ResultsEntriesContext.Provider value={value}>{children}</ResultsEntriesContext.Provider>;
}
