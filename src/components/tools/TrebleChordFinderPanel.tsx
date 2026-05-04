import type {
  FinderChordInversion,
  FinderChordOctave,
  FinderChordPattern,
} from "../../types";
import { CHORD_FINDER_INVERSION_OPTIONS } from "../../tools/chordFinderTools";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
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
  isActive: boolean;
  onToggleActive: () => void;
  onPlay: () => void;
  onClear: () => void;
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
  isActive,
  onToggleActive,
  onPlay,
  onClear,
}: TrebleChordFinderPanelProps) {
  return (
    <CollapsibleSection title="Chord Finder" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        Finds a compact right-hand shape for the selected chord.
      </p>
      <details className="tool-details">
        <summary>More explanation</summary>
        <p className="hint">
          The treble finder uses the selected root, octave, and inversion to look for nearby buttons or piano keys. It is a layout aid: on chromatic-button treble there may be several possible positions for the same pitch.
        </p>
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

        <div className="result-card">
          <div className="result-card-title">Treble chord result</div>
          <p>Target: {targetToneText}</p>
          <p>Buttons: <strong>{buttonCount}</strong></p>
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
      </fieldset>
    </CollapsibleSection>
  );
}
