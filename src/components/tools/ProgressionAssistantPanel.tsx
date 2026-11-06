import { realizationText } from "./progressionRealizationText";
import { useMemo, useState } from "react";
import { translateKnownLabel } from "../../i18n/catalog";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
import type { FinderChordPattern } from "../../types";
import type { ChordDisplayStyle } from "../../tools/chordDisplay";
/* Progression controls display the global optimized path with optional per-step
   pinning to an existing Chord Finder recipe. Playback/notation use that same plan. */

import { useI18n } from "../../i18n/useI18n";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { SegmentedChoice } from "../ui/SegmentedChoice";
import { HelpTip } from "../ui/HelpTip";
import {
  progressionRealizationKey,
  progressionChordLabel,
  type HarmonyProgressionChord,
  type OptimizedProgressionPlan,
  type progressionRealizationsForChord,
} from "../../tools/harmonyExplorer/progression";
import type { ProgressionRhythmPattern } from "../../sound";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import { convertProgressionPreset } from "../../tools/harmonyExplorer/progressionPresets";
import type { ChordProgressionDefinition } from "../../tools/bassPatternPlayerTools";


type ProgressionAssistantPanelProps = {
  isOpen: boolean;
  chordDisplayStyle: ChordDisplayStyle;
  onToggle: () => void;
  progression: HarmonyProgressionChord[];
  plan: OptimizedProgressionPlan;
  presetDefinitions: ChordProgressionDefinition[];
  onUsePreset: (id: string, keyRoot: string) => void;
  realizationOptions: Record<string, ReturnType<typeof progressionRealizationsForChord>>;
  realizationKeys: Readonly<Record<string, string>>;
  onCycleRealization: (index: number, direction: -1 | 1) => void;
  manualRoot: string;
  onManualRootChange: (value: string) => void;
  manualPattern: FinderChordPattern;
  onManualPatternChange: (value: FinderChordPattern) => void;
  handMovementWeight: number;
  onHandMovementWeightChange: (value: number) => void;
  voiceLeadingWeight: number;
  onVoiceLeadingWeightChange: (value: number) => void;
  rhythmPattern: ProgressionRhythmPattern;
  onRhythmPatternChange: (value: ProgressionRhythmPattern) => void;
  tempoBpm: number;
  onTempoBpmChange: (value: number) => void;
  noteStepId: string | null;
  onToggleStepNotes: (id: string) => void;
  onAddManualChord: () => void;
  onRemoveChord: (index: number) => void;
  onMoveChord: (index: number, direction: -1 | 1) => void;
  onClear: () => void;
  /** Draw the optimized path (numbered steps and arrows) on the diagram. */
  pathVisible: boolean;
  onPathVisibleChange: (visible: boolean) => void;
};

export function ProgressionAssistantPanel({
  isOpen,
  chordDisplayStyle,
  onToggle,
  progression,
  plan,
  presetDefinitions,
  onUsePreset,
  realizationOptions,
  realizationKeys,
  onCycleRealization,
  manualRoot,
  onManualRootChange,
  manualPattern,
  onManualPatternChange,
  handMovementWeight,
  onHandMovementWeightChange,
  voiceLeadingWeight,
  onVoiceLeadingWeightChange,
  rhythmPattern,
  onRhythmPatternChange,
  tempoBpm,
  onTempoBpmChange,
  noteStepId,
  onToggleStepNotes,
  onAddManualChord,
  onRemoveChord,
  onMoveChord,
  onClear,
  pathVisible,
  onPathVisibleChange,
}: ProgressionAssistantPanelProps) {
  const { t, language } = useI18n();
  const [presetId, setPresetId] = useState("i-iv-v-i");
  const [presetRoot, setPresetRoot] = useState("C");
  const [entryMode, setEntryMode] = useState<"manual" | "preset">("manual");
  const selectedPreset = presetDefinitions.find((item) => item.id === presetId) ?? presetDefinitions[0];
  const presetConversion = useMemo(
    () => selectedPreset ? convertProgressionPreset(selectedPreset, presetRoot) : null,
    [selectedPreset, presetRoot],
  );

  return (
    <CollapsibleSection title={t("ui.progressionAssistant")} summary={t("tools.summary.progressionAssistant")} isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        {t("ui.progressionIntro")}
      </p>

      <fieldset className="tool-fieldset">
        <legend>{t("ui.progression")}</legend>
        <SegmentedChoice
          label={t("ui.progressionEntryMode")}
          value={entryMode}
          options={[
            { value: "preset", label: t("ui.progressionUsePreset") },
            { value: "manual", label: t("ui.progressionManual") },
          ]}
          onChange={setEntryMode}
        />
        {entryMode === "preset" ? <>
          <div className="progression-preset-controls">
            <label>{t("ui.progressionPreset")}
              <select value={selectedPreset?.id ?? ""} disabled={presetDefinitions.length === 0} onChange={(event) => setPresetId(event.target.value)}>
                {presetDefinitions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
              </select>
            </label>
            <label>{t("ui.progressionPresetKey")}
              <select value={presetRoot} onChange={(event) => setPresetRoot(event.target.value)}>
                {FINDER_ROOT_OPTIONS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
              </select>
            </label>
          </div>
          {presetConversion && presetConversion.unsupported.length > 0 && (
            <p className="hint" role="status">{t("ui.progressionUnsupportedPreset")}: {presetConversion.unsupported.join(", ")}</p>
          )}
        </> : <div className="progression-add-grid">
          <label>
            {t("ui.root")}
            <select value={manualRoot} onChange={(event) => onManualRootChange(event.target.value)}>
              {FINDER_ROOT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label-line">{t("tools.chordType")} <HelpTip text={t("tools.chordTypeHelp")} /></span>
            <select value={manualPattern} onChange={(event) => onManualPatternChange(event.target.value as FinderChordPattern)}>
              {CHORD_FINDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{translateKnownLabel(language, option.label)}</option>
              ))}
            </select>
          </label>
        </div>}
        <div className="button-row progression-entry-actions">
          {entryMode === "preset" ? <button type="button" className="small-button" disabled={!selectedPreset || !presetConversion || presetConversion.chords.length === 0 || presetConversion.unsupported.length > 0}
            onClick={() => selectedPreset && onUsePreset(selectedPreset.id, presetRoot)}>{t("ui.progressionLoadPreset")}</button>
            : <button className="small-button" type="button" onClick={onAddManualChord}>{t("ui.addChord")}</button>}
          <button className="small-button" type="button" disabled={progression.length === 0} onClick={onClear}>{t("tools.clear")}</button>
        </div>

        {progression.length === 0 ? (
          <p className="hint">
            {t("ui.addChordsHereOrSendASelectedRelationshipFromHarmonyExplorer")}
          </p>
        ) : (
          <ol className="harmony-progression-list">
            {progression.map((chord, index) => {
              const available = realizationOptions[chord.id] ?? [];
              const pinnedKey = realizationKeys[chord.id] ?? null;
              const selected = available.find(({ result }) => progressionRealizationKey(result) === pinnedKey);
              const step = plan.playable ? plan.steps[index] : undefined;
              const choiceLabel = selected
                ? t("ui.progressionRealizationRank", { rank: selected.realizationIndex + 1 })
                : t("ui.progressionAuto");
              return (
                <li key={chord.id}>
                  <div className="progression-chord-row">
                    <div className="progression-chord-detail">
                      <div className="progression-chord-name">
                        <button type="button" className={`tiny-button progression-note-eye ${noteStepId === chord.id ? "active-tool" : ""}`}
                          aria-pressed={noteStepId === chord.id}
                          disabled={!step}
                          aria-label={t(noteStepId === chord.id ? "ui.progressionHideNotesFor" : "ui.progressionShowNotesFor", { chord: progressionChordLabel(chord, chordDisplayStyle) })}
                          title={t(noteStepId === chord.id ? "ui.progressionHideNotesFor" : "ui.progressionShowNotesFor", { chord: progressionChordLabel(chord, chordDisplayStyle) })}
                          onClick={() => onToggleStepNotes(chord.id)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                        </button>
                        <strong>{progressionChordLabel(chord, chordDisplayStyle)}</strong>
                      </div>
                      {step && <span className="progression-chord-recipe">{realizationText(step, language)}</span>}
                    </div>
                    <div className="progression-list-actions">
                      <div className="progression-realization-navigation" role="group" aria-label={t("ui.progressionRealizationFor", { chord: progressionChordLabel(chord, chordDisplayStyle) })}>
                        <button className="tiny-button" type="button" disabled={available.length === 0} onClick={() => onCycleRealization(index, -1)} aria-label={t("ui.progressionPreviousRealization")}>←</button>
                        <span className="progression-realization-position" title={choiceLabel}>{choiceLabel}</span>
                        <button className="tiny-button" type="button" disabled={available.length === 0} onClick={() => onCycleRealization(index, 1)} aria-label={t("ui.progressionNextRealization")}>→</button>
                      </div>
                      <div className="progression-order-actions">
                        <button type="button" className="tiny-button" disabled={index === 0} onClick={() => onMoveChord(index, -1)} aria-label={t("ui.moveChordEarlier")} title={t("ui.moveChordEarlier")}>↑</button>
                        <button type="button" className="tiny-button" disabled={index === progression.length - 1} onClick={() => onMoveChord(index, 1)} aria-label={t("ui.moveChordLater")} title={t("ui.moveChordLater")}>↓</button>
                        <button type="button" className="tiny-button" onClick={() => onRemoveChord(index)} aria-label={t("ui.removeChord")} title={t("ui.removeChord")}>×</button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>{t("ui.optimization")}</legend>

        <label>
          <span className="label-line">
            {t("ui.progressionPhysicalMovement")}: {Math.round(handMovementWeight * 100)}%
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
        <label>
          <span className="label-line">{t("ui.progressionVoiceLeading")}: {Math.round(voiceLeadingWeight * 100)}%
            <HelpTip text={t("ui.progressionVoiceLeadingHelp")} />
          </span>
          <input
            type="range" min="0" max="100" step="5"
            value={Math.round(voiceLeadingWeight * 100)}
            onChange={(event) => onVoiceLeadingWeightChange(Number(event.target.value) / 100)}
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
        <label className="checkbox-line">
          <input type="checkbox" checked={pathVisible} onChange={(event) => onPathVisibleChange(event.target.checked)} />
          {t("ui.progressionShowPath")}
        </label>
        <p className="hint">{t("ui.duringPlaybackTheActiveStradellaButtonsAreHighlightedOnTheDiagram")}</p>
        <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>
      </fieldset>

    </CollapsibleSection>
  );
}
