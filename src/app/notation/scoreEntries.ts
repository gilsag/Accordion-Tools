import { createContext, useContext, type ReactNode } from "react";
import { usePlatformNavigation } from "../platform/platformContexts";
import type { ToolId } from "../toolRegistry";

/** A tool's score, as the score area shows it: a generated ABC score with its
 * header and download name, or a panel of the tool's own (the Rhythm
 * Trainer's). Where it is placed is never the tool's concern. */
export type ScoreEntry =
  { title: string; abc: string; filename: string; imported?: boolean } | { panel: ReactNode };

/** The toolbar's Show/Hide notation button for a tool's score. */
export type ScoreToggle = { visible: boolean; toggle(): void };

/** Each tool's score, null while it is hidden, empty, or not offered on this
 * side; and its toggle, null while there is nothing it could show. */
export type ScoreEntries = Partial<
  Record<ToolId, { score: ScoreEntry | null; toggle: ScoreToggle | null }>
>;
export const ScoreEntriesContext = createContext<ScoreEntries>({});

function useActiveEntry() {
  const entries = useContext(ScoreEntriesContext);
  const { workspaceMode, activeToolSection } = usePlatformNavigation();
  if (workspaceMode === "harmony") return entries.harmonyExplorer;
  return activeToolSection ? entries[activeToolSection] : undefined;
}

/** The score of what the workspace shows: the Harmony recording's in the
 * Harmony workspace, otherwise the open tool's. At most one is shown, which
 * the tools' score toggles already guarantee (`score.hides`). */
export function useActiveScore(): ScoreEntry | null {
  return useActiveEntry()?.score ?? null;
}

/** The toolbar's notation button, for the same tool as `useActiveScore()`. */
export function useActiveScoreToggle(): ScoreToggle | null {
  return useActiveEntry()?.toggle ?? null;
}
