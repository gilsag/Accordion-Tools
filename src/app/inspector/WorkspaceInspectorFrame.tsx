import { useContext, type ReactNode } from "react";
import { InspectorBlockedContext } from "./resultsEntries";

/** Shared responsive inspector shell. Tool-specific tables and analysis are children. */
export function WorkspaceInspectorFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const blocked = useContext(InspectorBlockedContext);
  return (
    <aside className="workspace-inspector" aria-label={title} inert={blocked}>
      <h2>{title}</h2>
      {children}
    </aside>
  );
}
