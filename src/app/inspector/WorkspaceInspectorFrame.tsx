import type { ReactNode } from "react";

/** Shared responsive inspector shell. Tool-specific tables and analysis are children. */
export function WorkspaceInspectorFrame({ title, children, blocked = false }: { title: string; children: ReactNode; blocked?: boolean }) {
  return <aside className="workspace-inspector" aria-label={title} inert={blocked}>
    <h2>{title}</h2>
    {children}
  </aside>;
}
