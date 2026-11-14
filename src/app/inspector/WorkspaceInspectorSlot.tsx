import { Suspense, type ReactNode } from "react";
import { InspectorBlockedContext } from "./resultsEntries";
// Small, and it owns the notation host element, so it is not lazy.
import { NotationWorkspaceContent } from "./NotationWorkspaceContent";
import type { ScoreEntry } from "../notation/scoreEntries";

/** The one panel right of the diagram: the score, when it goes there, or the
 * active tool's results. Tools load their own panels lazily. */
export function WorkspaceInspectorSlot({
  score,
  results,
  blocked = false,
}: {
  score: ScoreEntry | null;
  results: ReactNode | null;
  blocked?: boolean;
}) {
  if (score)
    return (
      <aside
        className="workspace-inspector notation-inspector"
        aria-label="Music notation"
        inert={blocked}
      >
        <NotationWorkspaceContent score={score} />
      </aside>
    );
  return (
    <InspectorBlockedContext.Provider value={blocked}>
      <Suspense
        fallback={<aside className="workspace-inspector" aria-busy="true" inert={blocked} />}
      >
        {results}
      </Suspense>
    </InspectorBlockedContext.Provider>
  );
}
