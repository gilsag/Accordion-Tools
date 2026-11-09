import { useEffect, useMemo, useRef } from "react";
import { downloadRenderedNotationSvg } from "../../notation/notationService";
import { rhythmExerciseToAbc } from "../../features/rhythmTrainer/rhythmNotation";
import type { useRhythmTrainer } from "../../features/rhythmTrainer/useRhythmTrainer";
import { useI18n } from "../../i18n/useI18n";
import { WorkspaceInspectorFrame } from "./WorkspaceInspectorFrame";

/** Both desktop inspector and narrow screen fallback use identical ABC source. */
export function RhythmNotationPanel({trainer,renderNotationInto}: {
  trainer:ReturnType<typeof useRhythmTrainer>;
  renderNotationInto:(host:HTMLDivElement|null,abc:string)=>void;
}) {
  const { t } = useI18n();
  const host=useRef<HTMLDivElement|null>(null);
  const abc=useMemo(()=>rhythmExerciseToAbc(trainer.exercise,t("rhythm.title"),trainer.notationPreferences),[trainer.exercise,trainer.notationPreferences,t]);
  useEffect(()=>{renderNotationInto(host.current,abc);},[abc,renderNotationInto]);
  return <>
    <div className="rendered-notation-header">
      <div className="rendered-notation-title">{t("rhythm.notationTitle")}</div>
      <button type="button" className="small-button notation-download-button"
        onClick={()=>downloadRenderedNotationSvg(host.current,"bass-treble-rhythm-notation")}>{t("ui.downloadSVG")}</button>
    </div>
    <div ref={host} className="rendered-abc abc-notation-inspector" aria-label={t("rhythm.notationTitle")}/>
    <p className="hint">{t("rhythm.notationHelp")}</p>
  </>;
}
export function RhythmNotationInspector({trainer,renderNotationInto,blocked=false}: {
  trainer:ReturnType<typeof useRhythmTrainer>;
  renderNotationInto:(host:HTMLDivElement|null,abc:string)=>void;
  blocked?:boolean;
}) {
  const {t}=useI18n();
  return <WorkspaceInspectorFrame title={t("rhythm.notationTitle")} blocked={blocked}>
    <RhythmNotationPanel trainer={trainer} renderNotationInto={renderNotationInto}/>
  </WorkspaceInspectorFrame>;
}
