/* Stradella Chord Finder UI. The tools layer owns candidate generation,
   ranking, and registral analysis; this panel only displays the selected
   result and accepts settings/actions from the parent application. */

import type { FinderChordPattern, StradellaChordFinderMode } from "../../types";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import {
  STRADELLA_CHORD_FINDER_MODE_OPTIONS,
  type StradellaChordFinderResult,
} from "../../tools/stradellaChordFinderTools";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { explainStradellaRealization } from "../../tools/stradellaChordFinder/explainRealization";
import { HelpTip } from "../ui/HelpTip";
import { BinaryChoiceButton } from "../ui/BinaryChoiceButton";
import { analyzeConfiguredStradellaVoicing, formatModeledStradellaNotes, type StradellaRegisterModel } from "../../tools/stradellaChordFinder/registerModel";
import { permittedRequestedBasses, harmonicIdentitySymbol } from "../../tools/stradellaChordFinder/harmonicIdentity";
import type { StradellaNoteLevels } from "../../tools/stradellaChordFinder/diagramAnnotations";

type StradellaChordFinderPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  root: string;
  onRootChange: (value: string) => void;
  pattern: FinderChordPattern;
  onPatternChange: (value: FinderChordPattern) => void;
  requestedBass: string | null;
  onRequestedBassChange: (value: string | null) => void;
  mode: StradellaChordFinderMode;
  onModeChange: (value: StradellaChordFinderMode) => void;
  markRootBass: boolean;
  onMarkRootBassChange: (value: boolean) => void;
  result: StradellaChordFinderResult;
  registerModel: StradellaRegisterModel;
  showRealizationNote: boolean;
  noteLevels: StradellaNoteLevels;
  onNoteLevelChange: (level: keyof StradellaNoteLevels, enabled: boolean) => void;
  onShowRealizationNoteChange: (value: boolean) => void;
  explanationFontSize: number;
  onExplanationFontSizeChange: (value: number) => void;
  realizations: StradellaChordFinderResult[];
  realizationIndex: number;
  onRealizationChange: (index: number) => void;
  maxButtons: number;
  onMaxButtonsChange: (value: number) => void;
  spanColumns: number;
  onSpanColumnsChange: (value: number) => void;
  buttonCount: number;
  playbackButtonCount: number;
  isActive: boolean;
  onToggleActive: () => void;
  onPlay: () => void;
  onClear: () => void;
  canExploreHarmony: boolean;
  onExploreHarmony: () => void;
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
  requestedBass,
  onRequestedBassChange,
  mode,
  onModeChange,
  markRootBass,
  onMarkRootBassChange,
  result,
  registerModel,
  showRealizationNote,
  noteLevels,
  onNoteLevelChange,
  onShowRealizationNoteChange,
  explanationFontSize,
  onExplanationFontSizeChange,
  realizations,
  realizationIndex,
  onRealizationChange,
  maxButtons,
  onMaxButtonsChange,
  spanColumns,
  onSpanColumnsChange,
  buttonCount,
  playbackButtonCount,
  isActive,
  onToggleActive,
  onPlay,
  onClear,
  canExploreHarmony,
  onExploreHarmony,
  formatPitches,
  formatText,
}: StradellaChordFinderPanelProps) {
  const modeledVoicing = analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel);
  const identity = { root, pattern, requestedBass };
  const statusText = isActive && !result.playable ? "Not found" : result.exact ? "Exact / ready" : "Approximate / ready";

  return (
    <CollapsibleSection title="Chord Finder" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        Finds Stradella bass-row notes, chord-button recipes, and ranked mixed realizations, including conservative omissions in seventh and extended chords.
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
          <span className="label-line">Requested bass / inversion <HelpTip text="Optional: request a chord tone as the lowest modeled sounding pitch. The result depends on the analytical bass and chord register settings; this is not a claim about actual reeds." /></span>
          <select value={requestedBass ?? ""} onChange={(event) => onRequestedBassChange(event.target.value || null)}>
            <option value="">Any (no specified bass)</option>
            {permittedRequestedBasses(root, pattern).map((tone) => (
              <option key={tone} value={tone}>{tone}{tone === root ? " (root position)" : ""}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">Search mode <HelpTip text="Bass rows use single notes; Chord buttons only ignores bass notes; Bass + chord buttons prefers compact mixed realizations and can offer ranked exact or conservative approximate alternatives. Higher chords may omit selected fifths, ninths, or elevenths; major or dominant 11ths can omit the third as a suspended-style voicing. No foreign tones are added." /></span>
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
          <BinaryChoiceButton
            label={<>Root bass reference <HelpTip text="Shows the root bass button as a location reference only. It does not complete or play the chord." /></>}
            enabled={markRootBass}
            onToggle={() => onMarkRootBassChange(!markRootBass)}
            whenEnabled="Hide root bass reference"
            whenDisabled="Show root bass reference"
          />
        )}

        {mode === "bass-and-chords" && (
          <>
            <label>
              <span className="label-line">Maximum buttons</span>
              <select value={maxButtons} onChange={(event) => onMaxButtonsChange(Number(event.target.value))}>
                {[1, 2, 3, 4].map((count) => <option value={count} key={count}>Up to {count}</option>)}
              </select>
            </label>
            <label>
              <span className="label-line">Maximum hand span</span>
              <select value={spanColumns} onChange={(event) => onSpanColumnsChange(Number(event.target.value))}>
                <option value={3.2}>Compact</option>
                <option value={4.3}>Moderate</option>
                <option value={5.5}>Extended</option>
              </select>
            </label>
            <p className="hint">Recommended realizations appear first. {realizations.filter((item) => item.playable && item.exact).length} exact, {realizations.filter((item) => item.playable && !item.exact).length} approximate realizations</p>
          </>
        )}

        {mode === "bass-and-chords" && isActive && realizations.length > 1 && (
          <label>
            <span className="label-line">Realization <HelpTip text="Shows ranked musically distinct realizations, with ergonomic button choices. Recommended extended-chord examples appear first; they represent compact complete, minimally reduced, or functional-shell approaches. Exact and Approximate still describe their pitch-class content." /></span>
            <select value={realizationIndex} onChange={(event) => onRealizationChange(Number(event.target.value))}>
              {realizations.map((candidate, index) => (
                <option key={`${index}-${candidate.playbackButtons.map((button) => button.id).join("-")}`} value={index}>
                  {candidate.recommended ? "★ Recommended · " : ""}{index + 1}. {candidate.exact ? "Exact" : "Approx."} — {candidate.playbackButtons.map((button) => button.kind.startsWith("bass-") ? `${button.pitchClass} bass` : `${button.chordRoot} ${button.kind.replace("chord-", "")}`).join(" + ")}
                </option>
              ))}
            </select>
          </label>
        )}
        {mode === "bass-and-chords" && isActive && realizations.length > 1 && (
          <div className="realization-navigation" role="group" aria-label="Browse chord realizations">
            <button type="button" className="small-button" title="Previous realization" aria-label="Previous realization"
              disabled={realizationIndex <= 0}
              onClick={() => onRealizationChange(Math.max(0, realizationIndex - 1))}>←</button>
            <span className="hint" aria-live="polite">{realizationIndex + 1} / {realizations.length}</span>
            <button type="button" className="small-button" title="Next realization" aria-label="Next realization"
              disabled={realizationIndex >= realizations.length - 1}
              onClick={() => onRealizationChange(Math.min(realizations.length - 1, realizationIndex + 1))}>→</button>
          </div>
        )}

        <div className="result-card">
          <div className="result-card-title">Stradella chord result</div>
          <p>Requested chord: <strong>{harmonicIdentitySymbol(identity)}</strong></p>
          <p>Status: <strong>{statusText}</strong></p>
          <p>{isActive && !result.playable ? "Not found" : <>Buttons: <strong>{buttonCount}</strong></>}</p>
          {isActive && (
            <>
              <p><strong>{formatText(result.shortDescription)}</strong></p>
              <p>Target: {formatPitches(result.targetPitches)}</p>
              {modeledVoicing.notes.length > 0 && <p>Nominal pitches (low to high): <strong>{formatModeledStradellaNotes(modeledVoicing.notes)}</strong> <HelpTip text="Calculated from the configured Stradella registers, with one nominal pitch per played tone. The actual reed sound may include octave doublings." /></p>}
              <p>Covered: {formatPitches(result.coveredPitches)}</p>
              {result.missingPitches.length > 0 && <p>Missing: {formatPitches(result.missingPitches)}</p>}
              {result.extraPitches.length > 0 && <p>Extra: {formatPitches(result.extraPitches)}</p>}
            </>
          )}
        </div>

        {isActive && (
          <details className="tool-details">
            <summary>More explanation</summary>
            {explainStradellaRealization(root, pattern, result, mode, registerModel, requestedBass).split(/\n\s*\n/).map((paragraph, index) => (
              <p className="hint" key={index}>{formatText(paragraph)}</p>
            ))}
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
          <button className="small-button" onClick={onExploreHarmony} disabled={!canExploreHarmony}>
            Explore harmony
          </button>
        </div>
        <div className="finder-annotation-options">
          <label className="checkbox-line">
            <input type="checkbox" checked={showRealizationNote}
              onChange={(event) => onShowRealizationNoteChange(event.target.checked)} />
            <span>Show realization explanation below diagram</span>
            <HelpTip text="Controls only the concise diagram note and SVG/PNG export. More explanation remains available separately. If every level is off, no footer space is reserved." />
          </label>
          {showRealizationNote && (
            <div className="finder-note-level-options" role="group" aria-label="Concise explanation levels">
              <div className="label-line">Explanation levels
                <HelpTip text="Select which short explanations appear beneath the diagram and in exported SVG/PNG images. The four levels can be combined independently." />
              </div>
              {([
                ["identity", "1. Harmonic identity"],
                ["pitchClasses", "2. Pitch-class realization"],
                ["voicing", "3. Registral voicing"],
                ["physical", "4. Physical realization"],
              ] as const).map(([level, label]) => (
                <label className="checkbox-line" key={level}>
                  <input type="checkbox" checked={noteLevels[level]}
                    onChange={(event) => onNoteLevelChange(level, event.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
              <label htmlFor="finder-explanation-size">Explanation text size: {explanationFontSize} px</label>
              <input id="finder-explanation-size" type="range" min={16} max={40} step={1}
                value={explanationFontSize}
                disabled={!Object.values(noteLevels).some(Boolean)}
                onChange={(event) => onExplanationFontSizeChange(Number(event.target.value))} />
            </div>
          )}
        </div>
      </fieldset>
    </CollapsibleSection>
  );
}
