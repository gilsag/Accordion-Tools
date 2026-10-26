import { familyName, scaleName } from "../../i18n/musicTerms";
import type { ChordDisplayStyle } from "../../tools/chordDisplay";
/* Harmony Explorer controls. The React panel adjusts filters and recording
   actions; music-theory relationships are computed in the tools layer. */

import { CollapsibleSection } from "../ui/CollapsibleSection";
import { useI18n } from "../../i18n/context";
import { HelpTip } from "../ui/HelpTip";
import type { HarmonySelection } from "../../tools/harmonyExplorer/types";
import type { ChordFamilyId, RelatedFamilyId, ScaleId } from "../../tools/harmonyExplorer/music";
import {
  CHORD_FAMILIES,
  SCALES,
  chordFamily,
  circleChordLabel,
  pitchName,
} from "../../tools/harmonyExplorer/music";
import { finderPatternForHarmonyFamily } from "../../tools/harmonyExplorer/integration";
import type { HarmonyRecordedEvent } from "../../tools/harmonyExplorer/progression";

type HarmonyExplorerPanelProps = {
  isOpen: boolean;
  chordDisplayStyle: ChordDisplayStyle;
  onToggle: () => void;
  referenceFamilyId: ChordFamilyId;
  onReferenceFamilyChange: (value: ChordFamilyId) => void;
  relatedFamilyId: RelatedFamilyId;
  onRelatedFamilyChange: (value: RelatedFamilyId) => void;
  scaleId: ScaleId;
  onScaleChange: (value: ScaleId) => void;
  diatonicOnly: boolean;
  onDiatonicOnlyChange: (value: boolean) => void;
  highlightDiatonic: boolean;
  onHighlightDiatonicChange: (value: boolean) => void;
  showEnharmonics: boolean;
  showNoteRing: boolean;
  onShowNoteRingChange: (value: boolean) => void;
  selected: HarmonySelection | null;
  onShowOnStradella: () => void;
  onAddSelectedRelationshipToProgression: () => void;
  isRecordingProgression: boolean;
  recordedProgression: HarmonyRecordedEvent[];
  onToggleProgressionRecording: () => void;
  onClearRecordedProgression: () => void;
  onSendRecordedProgressionToAssistant: () => void;
  isRecordedProgressionPlaying: boolean;
  onPlayRecordedProgression: () => void;
  onStopRecordedProgression: () => void;
  onReset: () => void;
};

export function HarmonyExplorerPanel({
  isOpen,
  chordDisplayStyle,
  onToggle,
  referenceFamilyId,
  onReferenceFamilyChange,
  relatedFamilyId,
  onRelatedFamilyChange,
  scaleId,
  onScaleChange,
  diatonicOnly,
  onDiatonicOnlyChange,
  highlightDiatonic,
  onHighlightDiatonicChange,
  showEnharmonics,
  showNoteRing,
  onShowNoteRingChange,
  selected,
  onShowOnStradella,
  onAddSelectedRelationshipToProgression,
  isRecordingProgression,
  recordedProgression,
  onToggleProgressionRecording,
  onClearRecordedProgression,
  onSendRecordedProgressionToAssistant,
  isRecordedProgressionPlaying,
  onPlayRecordedProgression,
  onStopRecordedProgression,
  onReset,
}: HarmonyExplorerPanelProps) {
  const allFamiliesMode = relatedFamilyId === "all";
  const { t, language } = useI18n();
  const effectiveDiatonicOnly = diatonicOnly || allFamiliesMode;
  const effectiveHighlightDiatonic = !effectiveDiatonicOnly && highlightDiatonic;
  const selectedFinderPattern = selected
    ? finderPatternForHarmonyFamily(selected.candidate.familyId)
    : null;
  const selectedReferenceFinderPattern = selected
    ? finderPatternForHarmonyFamily(selected.referenceFamilyId)
    : null;
  const selectedLabel = selected
    ? circleChordLabel(
        selected.candidate.rootPc,
        selected.candidate.familyId,
        selected.sectorIndex,
        showEnharmonics,
        chordDisplayStyle,
      )
    : null;

  const chooseSeventhPreset = (familyId: ChordFamilyId) => {
    onReferenceFamilyChange("major");
    onRelatedFamilyChange(familyId);
  };

  return (
    <CollapsibleSection title={t("tools.harmonyExplorer")} isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        {t("tools.harmonyIntro")}
      </p>

      <fieldset className="tool-fieldset">
        <legend>{t("ui.harmony")}</legend>
        <label>
          <span className="label-line">
            {t("tools.referenceFamily")}
            <HelpTip text={t("tools.referenceFamilyHelp")} />
          </span>
          <select value={referenceFamilyId} onChange={(event) => onReferenceFamilyChange(event.target.value as ChordFamilyId)}>
            {CHORD_FAMILIES.map((family) => (
              <option key={family.id} value={family.id}>{familyName(family.id, family.name, language)}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">
            {t("tools.relatedFamily")}
            <HelpTip text={t("tools.relatedFamilyHelp")} />
          </span>
          <select value={relatedFamilyId} onChange={(event) => onRelatedFamilyChange(event.target.value as RelatedFamilyId)}>
            <option value="all">{t("tools.allFamilies")}</option>
            {CHORD_FAMILIES.map((family) => (
              <option key={family.id} value={family.id}>{familyName(family.id, family.name, language)}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">{t("tools.parentScale")} <HelpTip text={t("ui.parentScaleHelp")} /></span>
          <select value={scaleId} onChange={(event) => onScaleChange(event.target.value as ScaleId)}>
            {SCALES.map((scale) => (
              <option key={scale.id} value={scale.id}>{scaleName(scale.id, scale.name, language)}</option>
            ))}
          </select>
        </label>

        <div className="button-row harmony-preset-row">
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("minor7")}>m7</button>
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("major7")}>maj7</button>
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("dominant7")}>7</button>
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("diminished7")}>°7</button>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={showNoteRing}
            onChange={(event) => onShowNoteRingChange(event.target.checked)}
          />
          {t("settings.noteRing")}
          <HelpTip text={t("tools.noteRingHelp")} />
        </label>
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend><span className="label-line">{t("tools.diatonicRelationships")}
          <HelpTip text={allFamiliesMode ? t("ui.allFamiliesDiatonicHint") : t("ui.diatonicContext")} />
        </span></legend>
        <label className={`check-row${allFamiliesMode ? " disabled-row" : ""}`}>
          <input
            type="checkbox"
            checked={effectiveDiatonicOnly}
            disabled={allFamiliesMode}
            onChange={(event) => onDiatonicOnlyChange(event.target.checked)}
          />
          {t("tools.diatonicOnly")}
          <HelpTip text={t("ui.diatonicOnlyHelp")} />
        </label>
        <label className={`check-row${effectiveDiatonicOnly ? " disabled-row" : ""}`}>
          <input
            type="checkbox"
            checked={effectiveHighlightDiatonic}
            disabled={effectiveDiatonicOnly}
            onChange={(event) => onHighlightDiatonicChange(event.target.checked)}
          />
          {t("tools.highlightDiatonic")}
        </label>
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend><span className="label-line">{t("tools.progressionRecording")}
          <HelpTip text={t("ui.recordASequenceByClickingChordsOrNotesInTheDiagramRepeatedClicksAreKeptAsRepeatedEvents")} />
        </span></legend>
        <div className="button-row">
          <button
            type="button"
            className={`small-button${isRecordingProgression ? " active-tool" : ""}`}
            onClick={onToggleProgressionRecording}
          >
            {isRecordingProgression ? t("tools.stopRecording") : t("tools.startRecording")}
          </button>
          <button
            type="button"
            className="small-button"
            disabled={recordedProgression.length === 0}
            onClick={onClearRecordedProgression}
          >
            {t("tools.clear")}
          </button>
          <button
            type="button"
            className="small-button"
            disabled={recordedProgression.length === 0}
            onClick={isRecordedProgressionPlaying ? onStopRecordedProgression : onPlayRecordedProgression}
          >
            {isRecordedProgressionPlaying ? t("tools.stop") : t("tools.playRecording")}
          </button>
          <button
            type="button"
            className="small-button"
            disabled={!recordedProgression.some((event) => event.kind !== "note")}
            onClick={onSendRecordedProgressionToAssistant}
          >
            {t("tools.sendAssistant")}
          </button>
        </div>
        {isRecordingProgression && (
          <p className="hint harmony-recording-indicator">
            <span className="harmony-recording-dot" aria-hidden="true" /> {t("tools.recording")}
          </p>
        )}
        {recordedProgression.length > 0 ? (
          <div className="harmony-recorded-progression" aria-label={t("ui.recordedHarmonySequence")}>
            {recordedProgression.map((event, index) => (
              <span className="harmony-recorded-chord" key={event.id}>
                {event.kind === "note"
                  ? `${index + 1}. ${t("ui.note")} ${pitchName(event.pitchClass, event.sectorIndex, showEnharmonics)}`
                  : `${index + 1}. ${circleChordLabel(event.rootPc, event.familyId, event.sectorIndex, showEnharmonics, chordDisplayStyle)}`}
              </span>
            ))}
          </div>
        ) : (
          <p className="hint">{t("tools.noRecording")}</p>
        )}
        {recordedProgression.some((event) => event.kind === "note") && (
          <p className="hint">
            {t("ui.noteRingEventsAreKeptInTheHarmonyRecordingAndNotationProgressionAssistantTransfersChordEventsOnly")}
          </p>
        )}
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>{t("tools.selectedRelationship")}</legend>
        {selected ? (
          <>
            <p className="hint">
              {t("tools.selected")}: <strong>{selectedLabel}</strong> · {familyName(selected.candidate.familyId, chordFamily(selected.candidate.familyId).name, language)}
            </p>
            <div className="button-row">
              <button
                type="button"
                className="small-button active-tool"
                disabled={!selectedFinderPattern}
                onClick={onShowOnStradella}
              >
                {t("tools.showStradella")}
              </button>
              <button
                type="button"
                className="small-button"
                disabled={!selectedFinderPattern || !selectedReferenceFinderPattern}
                onClick={onAddSelectedRelationshipToProgression}
              >
                {t("tools.addProgression")}
              </button>
            </div>
            {!selectedFinderPattern && (
              <p className="hint">{t("ui.theSelectedRelatedChordFamilyIsNotYetSupportedByTheStradellaChordFinder")}</p>
            )}
            {selectedFinderPattern && !selectedReferenceFinderPattern && (
              <p className="hint">{t("ui.theReferenceChordFamilyIsNotYetSupportedByTheStradellaProgressionAssistant")}</p>
            )}
          </>
        ) : (
          <p className="hint">{t("tools.noSelection")}</p>
        )}
      </fieldset>

      <div className="button-row">
        <button type="button" className="small-button" onClick={onReset}>
          {t("tools.resetHarmony")}
        </button>
      </div>
    </CollapsibleSection>
  );
}
