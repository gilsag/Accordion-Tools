import { familyName } from "../../i18n/musicTerms";
import type { ChordDisplayStyle } from "../../tools/chordDisplay";
/* Progression controls and playback display. Selected button recipes must
   come from the global optimizer, not a per-chord greedy reconstruction. */

import { useI18n } from "../../i18n/context";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { HelpTip } from "../ui/HelpTip";
import type { ChordFamilyId } from "../../tools/harmonyExplorer/music";
import {
  CHORD_FAMILIES,
  chordFamily,
  chordLabel,
  pitchName,
} from "../../tools/harmonyExplorer/music";
import type {
  HarmonyProgressionChord,
  OptimizedProgressionPlan,
} from "../../tools/harmonyExplorer/progression";
import type { ProgressionRhythmPattern } from "../../sound";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";

function realizationText(step: OptimizedProgressionPlan["steps"][number], locale: "en" | "es" = "en") {
  return step.result.playbackButtons
    .map((button) => {
      if (button.kind === "bass-counterbass") return `${button.pitchClass} ${locale === "es" ? "contrabajo" : "counterbass"}`;
      if (button.kind === "bass-root") return `${button.pitchClass} ${locale === "es" ? "bajo" : "bass"}`;
      const kind = button.kind
        .replace("chord-", "")
        .replace("dominant7", "7")
        .replace("diminished7", "°7");
      return `${button.chordRoot} ${kind}`;
    })
    .join(" + ");
}

type ProgressionAssistantPanelProps = {
  isOpen: boolean;
  chordDisplayStyle: ChordDisplayStyle;
  onToggle: () => void;
  progression: HarmonyProgressionChord[];
  plan: OptimizedProgressionPlan;
  manualRoot: string;
  onManualRootChange: (value: string) => void;
  manualFamilyId: ChordFamilyId;
  onManualFamilyChange: (value: ChordFamilyId) => void;
  allowApproximations: boolean;
  onAllowApproximationsChange: (value: boolean) => void;
  handMovementWeight: number;
  onHandMovementWeightChange: (value: number) => void;
  rhythmPattern: ProgressionRhythmPattern;
  onRhythmPatternChange: (value: ProgressionRhythmPattern) => void;
  tempoBpm: number;
  onTempoBpmChange: (value: number) => void;
  previewIndex: number | null;
  onAddManualChord: () => void;
  onRemoveChord: (index: number) => void;
  onMoveChord: (index: number, direction: -1 | 1) => void;
  onClear: () => void;
  onPreviewStep: (index: number) => void;
  onOpenStepInChordFinder: (index: number) => void;
  onPlay: () => void;
  onStop: () => void;
};

export function ProgressionAssistantPanel({
  isOpen,
  chordDisplayStyle,
  onToggle,
  progression,
  plan,
  manualRoot,
  onManualRootChange,
  manualFamilyId,
  onManualFamilyChange,
  allowApproximations,
  onAllowApproximationsChange,
  handMovementWeight,
  onHandMovementWeightChange,
  rhythmPattern,
  onRhythmPatternChange,
  tempoBpm,
  onTempoBpmChange,
  previewIndex,
  onAddManualChord,
  onRemoveChord,
  onMoveChord,
  onClear,
  onPreviewStep,
  onOpenStepInChordFinder,
  onPlay,
  onStop,
}: ProgressionAssistantPanelProps) {
  const { t, language } = useI18n();
  const previewStep =
    previewIndex !== null && plan.playable ? plan.steps[previewIndex] ?? null : null;

  return (
    <CollapsibleSection title={t("ui.progressionAssistant")} isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        {t("ui.progressionIntro")}
      </p>

      <fieldset className="tool-fieldset">
        <legend>{t("ui.progression")}</legend>
        <div className="progression-add-grid">
          <label>
            {t("ui.root")}
            <select value={manualRoot} onChange={(event) => onManualRootChange(event.target.value)}>
              {FINDER_ROOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("ui.chordFamily")}
            <select
              value={manualFamilyId}
              onChange={(event) => onManualFamilyChange(event.target.value as ChordFamilyId)}
            >
              {CHORD_FAMILIES.map((family) => (
                <option key={family.id} value={family.id}>
                  {familyName(family.id, family.name, language)}
                </option>
              ))}
            </select>
          </label>
          <button className="small-button progression-add-button" type="button" onClick={onAddManualChord}>
            {t("ui.addChord")}
          </button>
        </div>

        <div className="button-row">
          <button className="small-button" type="button" disabled={progression.length === 0} onClick={onClear}>
            {t("ui.clearProgression")}
          </button>
        </div>

        {progression.length === 0 ? (
          <p className="hint">
            {t("ui.addChordsHereOrSendASelectedRelationshipFromHarmonyExplorer")}
          </p>
        ) : (
          <ol className="harmony-progression-list">
            {progression.map((chord, index) => (
              <li key={chord.id}>
                <span>
                  <strong>{chordLabel(chord.rootPc, chord.familyId, chord.sectorIndex, false, chordDisplayStyle)}</strong>
                  <small>{familyName(chord.familyId, chordFamily(chord.familyId).shortName, language)}</small>
                </span>
                <span className="progression-list-actions">
                  <button type="button" className="tiny-button" disabled={index === 0} onClick={() => onMoveChord(index, -1)} aria-label={t("ui.moveChordEarlier")}>↑</button>
                  <button type="button" className="tiny-button" disabled={index === progression.length - 1} onClick={() => onMoveChord(index, 1)} aria-label={t("ui.moveChordLater")}>↓</button>
                  <button type="button" className="tiny-button" onClick={() => onRemoveChord(index)} aria-label={t("ui.removeChord")}>×</button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>{t("ui.optimization")}</legend>
        <label className="check-row">
          <input
            type="checkbox"
            checked={allowApproximations}
            onChange={(event) => onAllowApproximationsChange(event.target.checked)}
          />
          {t("ui.allowConservativeFifthOmissionApproximations")}
          <HelpTip text={t("ui.progressionApproxHelp")} />
        </label>

        <label>
          <span className="label-line">
            {t("ui.handMovementEmphasis")}: {Math.round(handMovementWeight * 100)}%
            <HelpTip text={t("ui.progressionHandHelp")} />
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(handMovementWeight * 100)}
            onChange={(event) => onHandMovementWeightChange(Number(event.target.value) / 100)}
          />
        </label>
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>{t("ui.playback")}</legend>
        <label>
          {t("ui.rhythmicPattern")}
          <select
            value={rhythmPattern}
            onChange={(event) => onRhythmPatternChange(event.target.value as ProgressionRhythmPattern)}
          >
            <option value="block">{t("ui.allButtonsTogether")}</option>
            <option value="oom-pah">{t("ui.basicOomPah24")}</option>
            <option value="waltz">{t("ui.waltz34")}</option>
            <option value="march">{t("ui.march44")}</option>
          </select>
        </label>
        <label>
          {t("ui.tempoBpm", { tempo: tempoBpm })}
          <input
            type="range"
            min="40"
            max="200"
            step="5"
            value={tempoBpm}
            onChange={(event) => onTempoBpmChange(Number(event.target.value))}
          />
        </label>
        <p className="hint">{t("ui.duringPlaybackTheActiveStradellaButtonsAreHighlightedOnTheDiagram")}</p>
      </fieldset>

      {progression.length > 0 && !plan.playable && (
        <div className="result-card progression-result-card">
          <div className="result-card-title">{t("ui.optimizedStradellaPath")}</div>
          <p><strong>{t("ui.notAvailableForTheCompleteProgression")}</strong></p>
          {plan.unsupportedLabels.length > 0 && (
            <p className="hint">{t("ui.noSupportedRealization")}: {plan.unsupportedLabels.join(", ")}.</p>
          )}
        </div>
      )}

      {plan.playable && (
        <div className="result-card progression-result-card">
          <div className="result-card-title">{t("ui.optimizedStradellaPath")}</div>
          <p>
            {t("ui.voiceMotion")}: <strong>{plan.totalHarmonicMotion} {t("ui.semitones")}</strong> · {t("ui.handMovement")}: {" "}
            <strong>{plan.totalPhysicalMovement.toFixed(1)} {t("ui.buttonSpacings")}</strong>
          </p>
          <p>{t("ui.approxRealizations")}: <strong>{plan.approximateCount}</strong></p>
          <div className="progression-plan-steps">
            {plan.steps.map((step, index) => {
              const transition = step.transitionFromPrevious;
              return (
                <button
                  key={`${step.chord.id}-${index}`}
                  type="button"
                  className={`progression-plan-step ${previewIndex === index ? "active-tool" : ""}`}
                  onClick={() => onPreviewStep(index)}
                >
                  <span className="progression-plan-step-title">
                    {index + 1}. {step.label} {step.result.exact ? "" : t("ui.approxAbbrev")}
                  </span>
                  <span>{realizationText(step, language)}</span>
                  {transition && (
                    <span className="progression-plan-metrics">
                      {t("ui.voiceMotion")} {transition.harmonicMotion} st · {t("ui.handMovement")} {transition.physicalMovement.toFixed(1)}
                      {transition.sharedPitchClasses.length > 0
                        ? ` · ${t("ui.sharedNotes")} ${transition.sharedPitchClasses.map((pc) => pitchName(pc, step.chord.sectorIndex, false)).join(", ")}`
                        : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="button-row">
            <button type="button" className="small-button active-tool" onClick={onPlay}>
              {t("ui.playOptimizedProgression")}
            </button>
            <button type="button" className="small-button" onClick={onStop}>
              {t("ui.stop")}
            </button>
            <button
              type="button"
              className="small-button"
              disabled={!previewStep}
              onClick={() => previewIndex !== null && onOpenStepInChordFinder(previewIndex)}
            >
              {t("ui.openPreviewInChordFinder")}
            </button>
          </div>
          {previewStep && (
            <p className="hint">
              {t("ui.preview")} <strong>{previewStep.label}</strong>: {realizationText(previewStep, language)}.
            </p>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
