/** The results panel beside the diagram: each tool that has one contributes
 * it while the tool is active, and the workspace shows the open tool's, or
 * else another active tool's (a Finder stays active with its section closed).
 * Only with the Tools panel showing, and only in the accordion workspace.
 * A visible score on the right takes the slot first; see `App`. */
import { createContext, useContext, type ReactNode } from "react";
import type { ToolId } from "../toolRegistry";
import { usePlatformNavigation } from "../platform/platformContexts";

export type ResultsEntries = Partial<Record<ToolId, ReactNode>>;

export const ResultsEntriesContext = createContext<ResultsEntries>({});

/** True while the phone's tool sheet covers the panel, which then takes no input. */
export const InspectorBlockedContext = createContext(false);

export function useActiveResults(): ReactNode | null {
  const results = useContext(ResultsEntriesContext);
  const { workspaceMode, leftPanelMode, activeToolSection } = usePlatformNavigation();
  if (workspaceMode !== "accordion" || leftPanelMode !== "tools") return null;
  const open = activeToolSection ? results[activeToolSection] : null;
  return open ?? Object.values(results).find((panel) => panel != null) ?? null;
}
