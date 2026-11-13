import { useCallback, useEffect, useMemo, useRef } from "react";
import { rhythmExerciseToAbc } from "../../features/rhythmTrainer/rhythmNotation";
import type { useRhythmTrainer } from "../../features/rhythmTrainer/useRhythmTrainer";
import { mapRhythmScoreNotes, highlightRhythmScoreNotes } from "../../features/rhythmTrainer/rhythmScoreHighlight";
import { useI18n } from "../../i18n/useI18n";
import { NotationScore, type NotationRenderer } from "../../notation/NotationScore";

/** A rhythm feature adapter: only its score content and playback-specific
 * highlighting are special. Engraving, title, layout and export are shared. */
export function RhythmNotationPanel({ trainer, renderNotationInto, showTitle = true }: {
  trainer: ReturnType<typeof useRhythmTrainer>;
  renderNotationInto: NotationRenderer;
  showTitle?: boolean;
}) {
  const { t } = useI18n();
  const abc = useMemo(() => rhythmExerciseToAbc(trainer.exercise, t("rhythm.title"), trainer.notationPreferences),
    [trainer.exercise, trainer.notationPreferences, t]);
  const activeKeys = useRef(trainer.activeRhythmKeys);
  useEffect(() => { activeKeys.current = trainer.activeRhythmKeys; }, [trainer.activeRhythmKeys]);
  const onRendered = useCallback((host: HTMLDivElement) => {
    if (mapRhythmScoreNotes(host, trainer.exercise))
      highlightRhythmScoreNotes(host, activeKeys.current);
  }, [trainer.exercise]);
  const onActive = useCallback((host: HTMLDivElement) => {
    highlightRhythmScoreNotes(host, trainer.activeRhythmKeys);
  }, [trainer.activeRhythmKeys]);
  const styleName = trainer.availableStyles.find(s => s.id === trainer.bassStyleId)?.label ?? t("rhythm.title");
  const harmony = trainer.exercise.harmonicRoots;
  const sequence = harmony.length <= 6 ? harmony.join("–") : `${harmony.slice(0, 4).join("–")}…`;
  const title = `${styleName} · ${trainer.exercise.meter} · ${sequence}`;
  return <NotationScore title={title} abc={abc} filename="bass-treble-rhythm-notation"
    render={renderNotationInto} onRendered={onRendered} onActive={onActive}
    activeKey={trainer.activeRhythmKeys} showTitle={showTitle}
    help={t("rhythm.notationHelp")}/>;
}
