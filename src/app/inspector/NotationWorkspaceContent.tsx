import { NotationScore } from "../../notation/NotationScore";
import type { ScoreEntry } from "../notation/scoreEntries";
import { usePlatformNotation } from "../platform/platformContexts";
import { useScoreRendering } from "../platform/useScoreRendering";

/** Renders a tool's score entry wherever the view placed it. Views decide
 * placement; tools decide the notes, the title and the download name. */
export function NotationWorkspaceContent({ score }: { score: ScoreEntry }) {
  const { renderNotationInto } = useScoreRendering();
  const { musicNotationIncludeTitle } = usePlatformNotation();
  if ("panel" in score) return <>{score.panel}</>;
  if (!score.abc.trim()) return null;
  return (
    <NotationScore
      title={score.title}
      abc={score.abc}
      filename={score.filename}
      render={renderNotationInto}
      showTitle={musicNotationIncludeTitle}
      imported={score.imported ?? false}
    />
  );
}
