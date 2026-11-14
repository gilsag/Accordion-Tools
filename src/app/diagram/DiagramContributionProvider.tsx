import { useContext, useMemo, type ReactNode } from "react";
import type { ToolId } from "../toolRegistry";
import { DiagramContributionsContext, type DiagramContribution } from "./diagramContributions";

/** Adds a tool's contribution to the diagram to those of the providers above. */
export function DiagramContributionProvider({
  tool,
  contribution,
  children,
}: {
  tool: ToolId;
  contribution: DiagramContribution;
  children: ReactNode;
}) {
  const above = useContext(DiagramContributionsContext);
  const value = useMemo(() => ({ ...above, [tool]: contribution }), [above, tool, contribution]);
  return (
    <DiagramContributionsContext.Provider value={value}>
      {children}
    </DiagramContributionsContext.Provider>
  );
}
