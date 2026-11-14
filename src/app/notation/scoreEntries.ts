import { createContext, useContext, type ReactNode } from "react";
import { usePlatformNavigation } from "../platform/platformContexts";
import type { ToolId } from "../toolRegistry";

/** A tool's score, as the score area shows it: a generated ABC score with its
 * header and download name, or a panel of the tool's own (the Rhythm
 * Trainer's). Where it is placed is never the tool's concern. */
export type ScoreEntry =
  { title: string; abc: string; filename: string; imported?: boolean } | { panel: ReactNode };

/** Each tool's score entry, keyed by tool; null while its score is hidden,
 * empty, or not offered on this side. */
export type ScoreEntries = Partial<Record<ToolId, ScoreEntry | null>>;
export const ScoreEntriesContext = createContext<ScoreEntries>({});

/** The score of what the workspace shows: the Harmony recording's in the
 * Harmony workspace, otherwise the open tool's. At most one is shown, which
 * the tools' score toggles already guarantee (`score.hides`). */
export function useActiveScore(): ScoreEntry | null {
  const scores = useContext(ScoreEntriesContext);
  const { workspaceMode, activeToolSection } = usePlatformNavigation();
  if (workspaceMode === "harmony") return scores.harmonyExplorer ?? null;
  return activeToolSection ? (scores[activeToolSection] ?? null) : null;
}
