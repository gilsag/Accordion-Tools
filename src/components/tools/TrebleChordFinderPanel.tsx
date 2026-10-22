/* Treble Chord Finder controls. Full theoretical harmony and a practical
   keyboard voicing are distinct options, even for the same chord symbol. */

import type {
  FinderChordInversion,
  FinderChordOctave,
  FinderChordPattern,
} from "../../types";
import { CHORD_FINDER_INVERSION_OPTIONS, type TrebleChordVoicingMode } from "../../tools/chordFinderTools";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
import { isExtendedChord } from "../../music/chordVoicingPolicy";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { HelpTip } from "../ui/HelpTip";

type TrebleChordFinderPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  targetToneText: string;
  root: string;
  onRootChange: (value: string) => void;
  octave: FinderChordOctave;
  onOctaveChange: (value: FinderChordOctave) => void;
  pattern: FinderChordPattern;
  onPatternChange: (value: FinderChordPattern) => void;
  inversion: FinderChordInversion;
  onInversionChange: (value: FinderChordInversion) => void;
  buttonCount: number;
  voicingMode: TrebleChordVoicingMode;
  onVoicingModeChange: (mode: TrebleChordVoicingMode) => void;
  realizationStatus: string;
  realizationExplanation: string;
  isActive: boolean;
  onToggleActive: () => void;
  onPlay: () => void;
  onClear: () => void;
  showVoicingNote: boolean;
  onShowVoicingNoteChange: (show: boolean) => void;
};

/** Right-hand chord finder panel for CBA and piano treble layouts. */
export function TrebleChordFinderPanel({
  isOpen,
  onToggle,
  targetToneText,
  root,
  onRootChange,
  octave,
  onOctaveChange,
  pattern,
  onPatternChange,
  inversion,
  onInversionChange,
  buttonCount,
  voicingMode,
  onVoicingModeChange,
  realizationStatus,
  realizationExplanation,
  isActive,
  onToggleActive,
  onPlay,
  onClear,
  showVoicingNote,
  onShowVoicingNoteChange,
}: TrebleChordFinderPanelProps) {
  return (
    <CollapsibleSection title="Chord Finder" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        Finds a compact right-hand shape for the selected chord.
      </p>
      <details className="tool-details">
        <summary>More explanation</summary>
        <p className="hint">
          The treble finder selects nearby buttons or piano keys at the chosen root octave and inversion. Auto displays all chord tones when a complete five-button-or-fewer shape is available. For larger chords it uses a practical reduced voicing; Full chord displays all available tones, including theoretical six- or seven-button shapes that are not simultaneously playable with five fingers.
        </p>
        {isActive && <p className="hint">{realizationExplanation}</p>}
      </details>

      <fieldset className="tool-fieldset">
        <label>
          <span className="label-line">Chord root <HelpTip text="The pitch that names the chord." /></span>
          <select value={root} onChange={(event) => onRootChange(event.target.value)}>
            {FINDER_ROOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">Root octave <HelpTip text="The octave used to place the chord on the treble layout." /></span>
          <select
            value={octave}
            onChange={(event) => onOctaveChange(Number(event.target.value) as FinderChordOctave)}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </label>

        <label>
          <span className="label-line">Chord type <HelpTip text="The chord formula to highlight on the treble side." /></span>
          <select
            value={pattern}
            onChange={(event) => onPatternChange(event.target.value as FinderChordPattern)}
          >
            {CHORD_FINDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">Inversion <HelpTip text="Changes which chord tone is placed lowest in the right-hand shape." /></span>
          <select
            value={inversion}
            onChange={(event) => onInversionChange(event.target.value as FinderChordInversion)}
          >
            {CHORD_FINDER_INVERSION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">Voicing <HelpTip text="Auto shows an exact chord when possible within five buttons; Full chord shows all available tones, including theoretical six- and seven-button shapes; Practical uses conventional omissions." /></span>
          <select
            value={voicingMode}
            onChange={(event) => onVoicingModeChange(event.target.value as TrebleChordVoicingMode)}
          >
            <option value="auto">Auto (exact when playable)</option>
            <option value="full">Full chord (all tones)</option>
            <option value="practical">Practical voicing</option>
          </select>
        </label>
        {isExtendedChord(pattern) && (
          <p className="hint">Full eleventh and thirteenth chords have six or seven tones. Practical voicings omit selected tones to make the chord manageable on the treble keyboard.</p>
        )}
        <div className="result-card">
          <div className="result-card-title">Treble chord result</div>
          <p>Target: {targetToneText}</p>
          <p>Buttons: <strong>{buttonCount}</strong></p>
          <p>Realization: <strong>{realizationStatus}</strong></p>
          <p>Status: <strong>{isActive && buttonCount > 0 ? "Shown" : "Ready"}</strong></p>
        </div>

        <div className="button-row">
          <button type="button" className={`small-button ${isActive ? "active-tool" : ""}`} onClick={onToggleActive}>
            {isActive ? "Hide chord" : "Show chord"}
          </button>
          <button className="small-button" onClick={onPlay} disabled={buttonCount === 0}>
            Play chord
          </button>
          <button className="small-button" onClick={onClear}>
            Clear chord
          </button>
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={showVoicingNote}
            onChange={(event) => onShowVoicingNoteChange(event.target.checked)}
          />
          <span>Show chord realization note below diagram</span>
        </label>
      </fieldset>
    </CollapsibleSection>
  );
}
