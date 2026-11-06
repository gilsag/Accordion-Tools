import { useI18n } from "../../i18n/useI18n";
import { pitchName } from "../../tools/harmonyExplorer/music";
import type { OptimizedProgressionPlan } from "../../tools/harmonyExplorer/progression";
import { realizationText } from "../../components/tools/progressionRealizationText";
import { WorkspaceInspectorFrame } from "./WorkspaceInspectorFrame";

/** Result-only view. Preview state and the optimized plan remain feature-owned;
 * chord editing stays in the left-side tool panel and playback in the shared
 * playback bar under the diagram. Step numbers match the path drawn there. */
export function ProgressionResultsInspector({ plan, hasProgression, previewIndex, onPreviewStep, blocked = false }: {
  plan: OptimizedProgressionPlan;
  hasProgression: boolean;
  previewIndex: number | null;
  onPreviewStep: (index: number) => void;
  blocked?: boolean;
}) {
  const { t, language } = useI18n();
  return <WorkspaceInspectorFrame title={t("ui.progressionStradellaPath")} blocked={blocked}>
    {!plan.playable ? <div className="result-card progression-result-card" role="status">
      <p><strong>{t(hasProgression ? "ui.notAvailableForTheCompleteProgression" : "ui.addChordsHereOrSendASelectedRelationshipFromHarmonyExplorer")}</strong></p>
      {plan.unsupportedLabels.length > 0 && <p className="hint">{t("ui.noSupportedRealization")}: {plan.unsupportedLabels.join(", ")}</p>}
    </div> : <>
      <p className="inspector-meta">{t("ui.voiceMotion")}: <strong>{plan.totalHarmonicMotion} {t("ui.semitones")}</strong> · {t("ui.handMovement")}: <strong>{plan.totalPhysicalMovement.toFixed(1)} {t("ui.buttonSpacings")}</strong></p>
      <p className="inspector-meta">{t("ui.approxRealizations")}: <strong>{plan.approximateCount}</strong></p>
      <div className="progression-plan-steps">
        {plan.steps.map((step, index) => {
          const transition = step.transitionFromPrevious;
          return <button key={step.chord.id} type="button"
            className={`progression-plan-step ${previewIndex === index ? "active-tool" : ""}`}
            aria-pressed={previewIndex === index}
            onClick={() => onPreviewStep(index)}>
            <span className="progression-plan-step-title">{index + 1}. {step.label} {step.result.exact ? "" : t("ui.approxAbbrev")}</span>
            <span>{realizationText(step, language)}</span>
            {transition && <span className="progression-plan-metrics">
              {t("ui.voiceMotion")} {transition.harmonicMotion} st · {t("ui.handMovement")} {transition.physicalMovement.toFixed(1)}
              {transition.sharedPitchClasses.length > 0
                ? ` · ${t("ui.sharedNotes")} ${transition.sharedPitchClasses.map((pc) => pitchName(pc, step.chord.sectorIndex, false)).join(", ")}` : ""}
            </span>}
          </button>;
        })}
      </div>
    </>}
  </WorkspaceInspectorFrame>;
}
