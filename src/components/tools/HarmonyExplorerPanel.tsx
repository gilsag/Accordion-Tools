import { CollapsibleSection } from "../ui/CollapsibleSection";
import { HelpTip } from "../ui/HelpTip";
import type { HarmonySelection } from "../../tools/harmonyExplorer/types";
import type { ChordFamilyId, RelatedFamilyId, ScaleId } from "../../tools/harmonyExplorer/music";
import {
  CHORD_FAMILIES,
  SCALES,
  chordFamily,
  chordLabel,
  relatedFamilyName,
  pitchName,
} from "../../tools/harmonyExplorer/music";
import { finderPatternForHarmonyFamily } from "../../tools/harmonyExplorer/integration";
import type { HarmonyRecordedEvent } from "../../tools/harmonyExplorer/progression";

type HarmonyExplorerPanelProps = {
  isOpen: boolean;
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
  const effectiveDiatonicOnly = diatonicOnly || allFamiliesMode;
  const effectiveHighlightDiatonic = !effectiveDiatonicOnly && highlightDiatonic;
  const selectedFinderPattern = selected
    ? finderPatternForHarmonyFamily(selected.candidate.familyId)
    : null;
  const selectedReferenceFinderPattern = selected
    ? finderPatternForHarmonyFamily(selected.referenceFamilyId)
    : null;
  const selectedLabel = selected
    ? chordLabel(
        selected.candidate.rootPc,
        selected.candidate.familyId,
        selected.sectorIndex,
        showEnharmonics,
      )
    : null;

  const chooseSeventhPreset = (familyId: ChordFamilyId) => {
    onReferenceFamilyChange("major");
    onRelatedFamilyChange(familyId);
  };

  return (
    <CollapsibleSection title="Harmony Explorer" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        Explore common-tone relationships. Display, ring, tooltip, and playback preferences are under Settings → Harmony.
      </p>

      <fieldset className="tool-fieldset">
        <legend>Harmony</legend>
        <label>
          <span className="label-line">
            Reference family (inner ring)
            <HelpTip text="The chord family placed in the innermost ring around the circle of fifths." />
          </span>
          <select value={referenceFamilyId} onChange={(event) => onReferenceFamilyChange(event.target.value as ChordFamilyId)}>
            {CHORD_FAMILIES.map((family) => (
              <option key={family.id} value={family.id}>{family.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">
            Related chord family (outer rings)
            <HelpTip text="Choose one chord family or aggregate all supported diatonic chord families." />
          </span>
          <select value={relatedFamilyId} onChange={(event) => onRelatedFamilyChange(event.target.value as RelatedFamilyId)}>
            <option value="all">All families (diatonic only)</option>
            {CHORD_FAMILIES.map((family) => (
              <option key={family.id} value={family.id}>{family.name}</option>
            ))}
          </select>
        </label>

        <label>
          Parent scale / mode
          <select value={scaleId} onChange={(event) => onScaleChange(event.target.value as ScaleId)}>
            {SCALES.map((scale) => (
              <option key={scale.id} value={scale.id}>{scale.name}</option>
            ))}
          </select>
        </label>

        <div className="button-row harmony-preset-row">
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("minor7")}>m7</button>
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("major7")}>maj7</button>
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("dominant7")}>7</button>
          <button className="small-button" type="button" onClick={() => chooseSeventhPreset("diminished7")}>°7</button>
        </div>
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>Diatonic relationships</legend>
        <label className={`check-row${allFamiliesMode ? " disabled-row" : ""}`}>
          <input
            type="checkbox"
            checked={effectiveDiatonicOnly}
            disabled={allFamiliesMode}
            onChange={(event) => onDiatonicOnlyChange(event.target.checked)}
          />
          Show only diatonic chords
        </label>
        <label className={`check-row${effectiveDiatonicOnly ? " disabled-row" : ""}`}>
          <input
            type="checkbox"
            checked={effectiveHighlightDiatonic}
            disabled={effectiveDiatonicOnly}
            onChange={(event) => onHighlightDiatonicChange(event.target.checked)}
          />
          Highlight diatonic chords when showing all
        </label>
        <p className="hint">
          {allFamiliesMode
            ? "All families mode stays diatonic-only to avoid overcrowding."
            : `Diatonic membership is relative to ${relatedFamilyName(relatedFamilyId) === "All chord families" ? "the selected mode" : "the selected parent scale/mode"} in each sector.`}
        </p>
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>Progression recording</legend>
        <p className="hint">
          Record a sequence by clicking chords or notes in the diagram. Repeated clicks are kept as repeated events.
        </p>
        <div className="button-row">
          <button
            type="button"
            className={`small-button${isRecordingProgression ? " active-tool" : ""}`}
            onClick={onToggleProgressionRecording}
          >
            {isRecordingProgression ? "Stop recording" : "Start recording"}
          </button>
          <button
            type="button"
            className="small-button"
            disabled={recordedProgression.length === 0}
            onClick={onClearRecordedProgression}
          >
            Clear
          </button>
          <button
            type="button"
            className="small-button"
            disabled={recordedProgression.length === 0}
            onClick={isRecordedProgressionPlaying ? onStopRecordedProgression : onPlayRecordedProgression}
          >
            {isRecordedProgressionPlaying ? "Stop" : "Play recording"}
          </button>
          <button
            type="button"
            className="small-button"
            disabled={!recordedProgression.some((event) => event.kind !== "note")}
            onClick={onSendRecordedProgressionToAssistant}
          >
            Send to Progression Assistant
          </button>
        </div>
        {isRecordingProgression && (
          <p className="hint harmony-recording-indicator">
            <span className="harmony-recording-dot" aria-hidden="true" /> Recording progression
          </p>
        )}
        {recordedProgression.length > 0 ? (
          <div className="harmony-recorded-progression" aria-label="Recorded harmony sequence">
            {recordedProgression.map((event, index) => (
              <span className="harmony-recorded-chord" key={event.id}>
                {event.kind === "note"
                  ? `${index + 1}. Note ${pitchName(event.pitchClass, event.sectorIndex, showEnharmonics)}`
                  : `${index + 1}. ${chordLabel(event.rootPc, event.familyId, event.sectorIndex, showEnharmonics)}`}
              </span>
            ))}
          </div>
        ) : (
          <p className="hint">No progression recorded yet.</p>
        )}
        {recordedProgression.some((event) => event.kind === "note") && (
          <p className="hint">
            Note-ring events are kept in the Harmony recording and notation. Progression Assistant transfers chord events only.
          </p>
        )}
      </fieldset>

      <fieldset className="tool-fieldset">
        <legend>Selected relationship</legend>
        {selected ? (
          <>
            <p className="hint">
              Selected: <strong>{selectedLabel}</strong> · {chordFamily(selected.candidate.familyId).name}
            </p>
            <div className="button-row">
              <button
                type="button"
                className="small-button active-tool"
                disabled={!selectedFinderPattern}
                onClick={onShowOnStradella}
              >
                Show on Stradella
              </button>
              <button
                type="button"
                className="small-button"
                disabled={!selectedFinderPattern || !selectedReferenceFinderPattern}
                onClick={onAddSelectedRelationshipToProgression}
              >
                Add relationship to Progression
              </button>
            </div>
            {!selectedFinderPattern && (
              <p className="hint">The selected related chord family is not yet supported by the Stradella Chord Finder.</p>
            )}
            {selectedFinderPattern && !selectedReferenceFinderPattern && (
              <p className="hint">The reference chord family is not yet supported by the Stradella Progression Assistant.</p>
            )}
          </>
        ) : (
          <p className="hint">Click an outer-ring chord to select it, hear it, and enable Stradella actions.</p>
        )}
      </fieldset>

      <div className="button-row">
        <button type="button" className="small-button" onClick={onReset}>
          Reset Harmony Explorer
        </button>
      </div>
    </CollapsibleSection>
  );
}
