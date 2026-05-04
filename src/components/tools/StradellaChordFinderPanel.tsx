import type { FinderChordPattern, StradellaChordFinderMode } from "../../types";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import {
  STRADELLA_CHORD_FINDER_MODE_OPTIONS,
  type StradellaChordFinderResult,
} from "../../tools/stradellaChordFinderTools";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { HelpTip } from "../ui/HelpTip";

type StradellaChordFinderPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  root: string;
  onRootChange: (value: string) => void;
  pattern: FinderChordPattern;
  onPatternChange: (value: FinderChordPattern) => void;
  mode: StradellaChordFinderMode;
  onModeChange: (value: StradellaChordFinderMode) => void;
  markRootBass: boolean;
  onMarkRootBassChange: (value: boolean) => void;
  result: StradellaChordFinderResult;
  buttonCount: number;
  playbackButtonCount: number;
  isActive: boolean;
  onToggleActive: () => void;
  onPlay: () => void;
  onClear: () => void;
  formatPitches: (pitches: string[]) => string;
  formatText: (text: string) => string;
};

/** Left-hand chord finder panel for Stradella layouts. */
export function StradellaChordFinderPanel({
  isOpen,
  onToggle,
  root,
  onRootChange,
  pattern,
  onPatternChange,
  mode,
  onModeChange,
  markRootBass,
  onMarkRootBassChange,
  result,
  buttonCount,
  playbackButtonCount,
  isActive,
  onToggleActive,
  onPlay,
  onClear,
  formatPitches,
  formatText,
}: StradellaChordFinderPanelProps) {
  const statusText = isActive && !result.playable ? "Not found" : "Exact / ready";

  return (
    <CollapsibleSection title="Chord Finder" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        Finds Stradella bass-row notes, chord-button recipes, or exact mixed combinations.
      </p>

      <fieldset className="tool-fieldset">
        <label>
          <span className="label-line">Chord root <HelpTip text="The named root used to build the requested chord." /></span>
          <select value={root} onChange={(event) => onRootChange(event.target.value)}>
            {FINDER_ROOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">Chord type <HelpTip text="The target chord formula. Some formulas are impossible on Stradella without bass notes." /></span>
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
          <span className="label-line">Search mode <HelpTip text="Bass rows use single notes; Chord buttons only ignores bass notes; Bass + chord buttons adds bass/counterbass only when needed." /></span>
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as StradellaChordFinderMode)}
          >
            {STRADELLA_CHORD_FINDER_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {mode === "chord-buttons-only" && (
          <label>
            <span className="label-line">Mark root bass reference <HelpTip text="Shows the root bass button as a location reference only. It does not complete or play the chord." /></span>
            <select
              value={markRootBass ? "on" : "off"}
              onChange={(event) => onMarkRootBassChange(event.target.value === "on")}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
        )}

        <div className="result-card">
          <div className="result-card-title">Stradella chord result</div>
          <p>Status: <strong>{statusText}</strong></p>
          <p>{isActive && !result.playable ? "Not found" : <>Buttons: <strong>{buttonCount}</strong></>}</p>
          {isActive && (
            <>
              <p><strong>{formatText(result.shortDescription)}</strong></p>
              <p>Target: {formatPitches(result.targetPitches)}</p>
              <p>Covered: {formatPitches(result.coveredPitches)}</p>
              {result.missingPitches.length > 0 && <p>Missing: {formatPitches(result.missingPitches)}</p>}
              {result.extraPitches.length > 0 && <p>Extra: {formatPitches(result.extraPitches)}</p>}
            </>
          )}
        </div>

        {isActive && (
          <details className="tool-details">
            <summary>More explanation</summary>
            <p className="hint">{formatText(result.explanation)}</p>
          </details>
        )}

        <div className="button-row">
          <button type="button" className={`small-button ${isActive ? "active-tool" : ""}`} onClick={onToggleActive}>
            {isActive ? "Hide chord" : "Show chord"}
          </button>
          <button className="small-button" onClick={onPlay} disabled={!result.playable || playbackButtonCount === 0}>
            {mode === "bass-only" ? "Play bass tones + chord" : "Play combination"}
          </button>
          <button className="small-button" onClick={onClear}>
            Clear chord
          </button>
        </div>
      </fieldset>
    </CollapsibleSection>
  );
}
