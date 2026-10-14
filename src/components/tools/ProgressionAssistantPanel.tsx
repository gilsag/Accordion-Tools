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

function realizationText(step: OptimizedProgressionPlan["steps"][number]) {
  return step.result.playbackButtons
    .map((button) => {
      if (button.kind === "bass-counterbass") return `${button.pitchClass} counterbass`;
      if (button.kind === "bass-root") return `${button.pitchClass} bass`;
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
  const previewStep =
    previewIndex !== null && plan.playable ? plan.steps[previewIndex] ?? null : null;

  return (
    <CollapsibleSection title="Progression Assistant" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        Build a chord sequence and optimize its Stradella realizations across the whole progression. Click an optimized step to preview its buttons on the Stradella diagram.
      </p>

      <fieldset className="tool-fieldset">
        <legend>Progression</legend>
        <div className="progression-add-grid">
          <label>
            Root
            <select value={manualRoot} onChange={(event) => onManualRootChange(event.target.value)}>
              {FINDER_ROOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chord family
            <select
              value={manualFamilyId}
              onChange={(event) => onManualFamilyChange(event.target.value as ChordFamilyId)}
            >
              {CHORD_FAMILIES.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </label>
          <button className="small-button progression-add-button" type="button" onClick={onAddManualChord}>
            Add chord
          </button>
        </div>

        <div className="button-row">
          <button className="small-button" type="button" disabled={progression.length === 0} onClick={onClear}>
            Clear progression
          </button>
        </div>

        {progression.length === 0 ? (
          <p className="hint">
            Add chords here, or send a selected relationship from Harmony Explorer.
          </p>
        ) : (
          <ol className="harmony-progression-list">
            {progression.map((chord, index) => (
              <li key={chord.id}>
                <span>
                  <strong>{chordLabel(chord.rootPc, chord.familyId, chord.sectorIndex, false)}</strong>
                  <small>{chordFamily(chord.familyId).shortName}</small>
                </span>
                <span className="progression-list-actions">
                  <button type="button" className="tiny-button" disabled={index === 0} onClick={() => onMoveChord(index, -1)} aria-label="Move chord earlier">↑</button>
                  <button type="button" className="tiny-button" disabled={index === progression.length - 1} onClick={() => onMoveChord(index, 1)} aria-label="Move chord later">↓</button>
                  <button type="button" className="tiny-button" onClick={() => onRemoveChord(index)} aria-label="Remove chord">×</button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>Optimization</legend>
        <label className="check-row">
          <input
            type="checkbox"
            checked={allowApproximations}
            onChange={(event) => onAllowApproximationsChange(event.target.checked)}
          />
          Allow conservative fifth-omission approximations
        </label>

        <label>
          <span className="label-line">
            Hand-movement emphasis: {Math.round(handMovementWeight * 100)}%
            <HelpTip text="Higher values favor nearby Stradella button combinations. Lower values give more weight to minimum pitch-class voice motion. Exact realizations are still preferred." />
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
        <legend>Playback</legend>
        <label>
          Rhythmic pattern
          <select
            value={rhythmPattern}
            onChange={(event) => onRhythmPatternChange(event.target.value as ProgressionRhythmPattern)}
          >
            <option value="block">All buttons together</option>
            <option value="oom-pah">Basic oom-pah (2/4)</option>
            <option value="waltz">Waltz (3/4)</option>
            <option value="march">March (4/4)</option>
          </select>
        </label>
        <label>
          Tempo: {tempoBpm} BPM
          <input
            type="range"
            min="40"
            max="200"
            step="5"
            value={tempoBpm}
            onChange={(event) => onTempoBpmChange(Number(event.target.value))}
          />
        </label>
        <p className="hint">During playback the active Stradella buttons are highlighted on the diagram.</p>
      </fieldset>

      {progression.length > 0 && !plan.playable && (
        <div className="result-card progression-result-card">
          <div className="result-card-title">Optimized Stradella path</div>
          <p><strong>Not available for the complete progression.</strong></p>
          {plan.unsupportedLabels.length > 0 && (
            <p className="hint">No supported realization: {plan.unsupportedLabels.join(", ")}.</p>
          )}
        </div>
      )}

      {plan.playable && (
        <div className="result-card progression-result-card">
          <div className="result-card-title">Optimized Stradella path</div>
          <p>
            Voice motion: <strong>{plan.totalHarmonicMotion} semitones</strong> · Hand movement:{" "}
            <strong>{plan.totalPhysicalMovement.toFixed(1)} button spacings</strong>
          </p>
          <p>Approximate realizations: <strong>{plan.approximateCount}</strong></p>
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
                    {index + 1}. {step.label} {step.result.exact ? "" : "(approx.)"}
                  </span>
                  <span>{realizationText(step)}</span>
                  {transition && (
                    <span className="progression-plan-metrics">
                      voice {transition.harmonicMotion} st · hand {transition.physicalMovement.toFixed(1)}
                      {transition.sharedPitchClasses.length > 0
                        ? ` · shared ${transition.sharedPitchClasses.map((pc) => pitchName(pc, step.chord.sectorIndex, false)).join(", ")}`
                        : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="button-row">
            <button type="button" className="small-button active-tool" onClick={onPlay}>
              Play optimized progression
            </button>
            <button type="button" className="small-button" onClick={onStop}>
              Stop
            </button>
            <button
              type="button"
              className="small-button"
              disabled={!previewStep}
              onClick={() => previewIndex !== null && onOpenStepInChordFinder(previewIndex)}
            >
              Open preview in Chord Finder
            </button>
          </div>
          {previewStep && (
            <p className="hint">
              Previewing <strong>{previewStep.label}</strong>: {realizationText(previewStep)}.
            </p>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
