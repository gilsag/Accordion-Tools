import { translateKnownLabel } from "../../i18n/catalog";
/* Stradella Chord Finder UI. The tools layer owns candidate generation,
   ranking, and registral analysis; this panel only displays the selected
   result and accepts settings/actions from the parent application. */

import type { FinderChordPattern, StradellaChordFinderMode } from "../../types";
import { displayRealizedChord, type ChordDisplayStyle } from "../../tools/chordDisplay";
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
import { useI18n } from "../../i18n/context";
import { analyzeConfiguredStradellaVoicing, formatModeledStradellaNotes, type StradellaRegisterModel } from "../../tools/stradellaChordFinder/registerModel";
import { permittedRequestedBasses } from "../../tools/stradellaChordFinder/harmonicIdentity";
import type { StradellaNoteLevels } from "../../tools/stradellaChordFinder/diagramAnnotations";
import { chordToneName, displayRoot, realizedChordName } from "../../tools/stradellaChordFinder/chordSpelling";
import { finderChordSymbol } from "../../tools/stradellaChordFinder/chordSymbol";
import type { MinimumNominalGap } from "../../tools/stradellaChordFinder/voicingDensity";

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
  chordDisplayStyle: ChordDisplayStyle;
  showRealizationNote: boolean;
  noteLevels: StradellaNoteLevels;
  showVoicingIntervals: boolean;
  onShowVoicingIntervalsChange: (value: boolean) => void;
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
  minimumNominalGap: MinimumNominalGap;
  onMinimumNominalGapChange: (value: MinimumNominalGap) => void;
  onDownloadAll: () => void;
  batchExporting: boolean;
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
  chordDisplayStyle,
  showRealizationNote,
  noteLevels,
  showVoicingIntervals,
  onShowVoicingIntervalsChange,
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
  minimumNominalGap,
  onMinimumNominalGapChange,
  onDownloadAll,
  batchExporting,
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
  const { t, language } = useI18n();
  const modeledVoicing = analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel);
  const spell = (pc: string) => chordToneName(root, pattern, pc);
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  const statusText = isActive && !result.playable ? t("common.notFound") : result.exact ? t("common.exactReady") : t("common.approxReady");
  const noteLevelOptions = [
    ["identity", t("tools.harmonicIdentity")],
    ["pitchClasses", t("tools.pitchClassRealization")],
    ["physical", t("tools.physicalRealization")],
    ["voicing", t("tools.registralVoicing")],
  ] as const;

  return (
    <CollapsibleSection title={t("tools.chordFinder")} isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        {t("tools.stradellaIntro")}
      </p>

      <fieldset className="tool-fieldset">
        <label>
          <span className="label-line">{t("tools.chordRoot")} <HelpTip text={t("tools.stradellaRootHelp")} /></span>
          <select value={root} onChange={(event) => onRootChange(event.target.value)}>
            {FINDER_ROOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">{t("tools.chordType")} <HelpTip text={t("tools.chordTypeHelp")} /></span>
          <select
            value={pattern}
            onChange={(event) => onPatternChange(event.target.value as FinderChordPattern)}
          >
            {CHORD_FINDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">{t("tools.requestedBass")} <HelpTip text={t("tools.requestedBassHelp")} /></span>
          <select value={requestedBass ?? ""} onChange={(event) => onRequestedBassChange(event.target.value || null)}>
            <option value="">{t("tools.anyBass")}</option>
            {permittedRequestedBasses(root, pattern).map((tone) => (
              <option key={tone} value={tone}>{spell(tone)}{tone === root ? t("tools.rootPosition") : ""}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">{t("tools.searchMode")} <HelpTip text={t("ui.stradellaSearchHelp")} /></span>
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as StradellaChordFinderMode)}
          >
            {STRADELLA_CHORD_FINDER_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.value === "bass-only" ? "tools.searchBassRowsOnly"
                  : option.value === "chord-buttons-only" ? "tools.searchChordButtonsOnly"
                  : "tools.searchBassAndChordButtons")}
              </option>
            ))}
          </select>
        </label>

        {mode === "chord-buttons-only" && (
          <BinaryChoiceButton
            label={<>{t("ui.rootBassReference")} <HelpTip text={t("ui.rootBassHelp")} /></>}
            enabled={markRootBass}
            onToggle={() => onMarkRootBassChange(!markRootBass)}
            whenEnabled={t("ui.hideRootBass")}
            whenDisabled={t("ui.showRootBass")}
          />
        )}

        {mode === "bass-and-chords" && (
          <>
            <label>
              <span className="label-line">{t("tools.maxButtons")} <HelpTip text={t("ui.maxButtonsHelp")} /></span>
              <select value={maxButtons} onChange={(event) => onMaxButtonsChange(Number(event.target.value))}>
                {[1, 2, 3, 4].map((count) => <option value={count} key={count}>{t("tools.upTo", { count })}</option>)}
              </select>
            </label>
            <label>
              <span className="label-line">{t("tools.maxSpan")} <HelpTip text={t("ui.maxSpanHelp")} /></span>
              <select value={spanColumns} onChange={(event) => onSpanColumnsChange(Number(event.target.value))}>
                <option value={3.2}>{t("tools.compact")}</option>
                <option value={4.3}>{t("tools.moderate")}</option>
                <option value={5.5}>{t("tools.extended")}</option>
              </select>
            </label>
            <p className="hint">{t("ui.recFirst")} {t("ui.approxCount", { exact: realizations.filter((item) => item.playable && item.exact).length, approx: realizations.filter((item) => item.playable && !item.exact).length })}</p>
          </>
        )}

        <label>
          <span className="label-line">{t("ui.nominalGapFilter")} <HelpTip text={t("ui.nominalGapFilterHelp")} /></span>
          <select value={minimumNominalGap} onChange={(event) => onMinimumNominalGapChange(Number(event.target.value) as MinimumNominalGap)}>
            <option value={0}>{t("ui.nominalGapAllowAll")}</option>
            <option value={2}>{t("ui.nominalGapNoSemitone")}</option>
            <option value={3}>{t("ui.nominalGapNoWholeTone")}</option>
          </select>
        </label>

        {mode === "bass-and-chords" && isActive && realizations.length > 1 && (
          <label>
            <span className="label-line">{t("tools.realization")} <HelpTip text={t("ui.realizationHelp")} /></span>
            <select value={realizationIndex} onChange={(event) => onRealizationChange(Number(event.target.value))}>
              {realizations.map((candidate, index) => (
                <option key={`${index}-${candidate.playbackButtons.map((button) => button.id).join("-")}`} value={index}>
                  {candidate.recommended ? `★ ${t("tools.recommended")} · ` : ""}{index + 1}. {candidate.exact ? t("common.exactReady").split(" /")[0] : t("ui.approxAbbrev")} — {candidate.playbackButtons.map((button) => button.kind.startsWith("bass-") ? `${button.pitchClass} ${t("ui.bass")}` : `${button.chordRoot} ${button.kind.replace("chord-", "")}`).join(" + ")}
                </option>
              ))}
            </select>
          </label>
        )}
        {mode === "bass-and-chords" && isActive && realizations.length > 1 && (
          <div className="realization-navigation" role="group" aria-label={t("ui.browseChordRealizations")}>
            <button type="button" className="small-button" title={t("tools.previous")} aria-label={t("tools.previous")}
              disabled={realizationIndex <= 0}
              onClick={() => onRealizationChange(Math.max(0, realizationIndex - 1))}>←</button>
            <span className="hint" aria-live="polite">{realizationIndex + 1} / {realizations.length}</span>
            <button type="button" className="small-button" title={t("tools.next")} aria-label={t("tools.next")}
              disabled={realizationIndex >= realizations.length - 1}
              onClick={() => onRealizationChange(Math.min(realizations.length - 1, realizationIndex + 1))}>→</button>
          </div>
        )}

        {isActive && realizations.some((candidate) => candidate.playable) && (
          <button type="button" className="small-button finder-download-all" onClick={onDownloadAll}
            disabled={batchExporting}>
            {batchExporting ? t("ui.batchExportWorking") : t("ui.downloadAllRealizations")}
          </button>
        )}

        <div className="result-card">
          <div className="result-card-title">{t("tools.stradellaResult")}</div>
          <p>{t("tools.requestedChord")}: <strong>{displayRealizedChord(root, pattern, realizedChordName(root, pattern, requestedBass, requestedBass, requestedSymbol), chordDisplayStyle)}</strong></p>
          <p>{t("tools.status")}: <strong>{statusText}</strong></p>
          <p>{isActive && !result.playable ? t("common.notFound") : <>{t("tools.buttons")}: <strong>{buttonCount}</strong></>}</p>
          {isActive && (
            <>
              <p><strong>{formatText(result.shortDescription)}</strong></p>
              <p>{t("tools.target")}: {formatPitches(result.targetPitches)}</p>
              {modeledVoicing.notes.length > 0 && <p>{t("tools.nominalPitches")}: <strong>{formatModeledStradellaNotes(modeledVoicing.notes, spell)}</strong> <HelpTip text={t("ui.modelPitchesHelp")} /></p>}
              <p>{t("tools.covered")}: {formatPitches(result.coveredPitches)}</p>
              {result.missingPitches.length > 0 && <p>{t("tools.missing")}: {formatPitches(result.missingPitches)}</p>}
              {result.extraPitches.length > 0 && <p>{t("tools.extra")}: {formatPitches(result.extraPitches)}</p>}
            </>
          )}
        </div>

        {isActive && (
          <details className="tool-details">
            <summary>{t("tools.moreExplanation")}</summary>
            {explainStradellaRealization(root, pattern, result, mode, registerModel, requestedBass, chordDisplayStyle, language).split(/\n\s*\n/).map((paragraph, index) => (
              <p className="hint" key={index}>{formatText(paragraph)}</p>
            ))}
          </details>
        )}

        <div className="button-row">
          <button type="button" className={`small-button ${isActive ? "active-tool" : ""}`} onClick={onToggleActive}>
            {isActive ? t("tools.hideChord") : t("tools.showChord")}
          </button>
          <button className="small-button" onClick={onPlay} disabled={!result.playable || playbackButtonCount === 0}>
            {mode === "bass-only" ? t("tools.playBassChord") : t("tools.playCombination")}
          </button>
          <button className="small-button" onClick={onClear}>
            {t("tools.clearChord")}
          </button>
          <button className="small-button" onClick={onExploreHarmony} disabled={!canExploreHarmony}>
            {t("tools.exploreHarmony")}
          </button>
        </div>
        <div className="finder-annotation-options">
          <label className="checkbox-line">
            <input type="checkbox" checked={showRealizationNote}
              onChange={(event) => onShowRealizationNoteChange(event.target.checked)} />
            <span>{t("tools.showExplanationBelow")}</span>
            <HelpTip text={t("ui.diagramNoteHelp")} />
          </label>
          {showRealizationNote && (
            <div className="finder-note-level-options" role="group" aria-label={t("tools.noteLevels")}>
              <div className="label-line">{t("tools.explanationLevels")}
                <HelpTip text={t("ui.fourLevelsHelp")} />
              </div>
              {noteLevelOptions.map(([level, label]) => (
                <div key={level} className="finder-note-option">
                  <label className="checkbox-line">
                    <input type="checkbox" checked={noteLevels[level]}
                      onChange={(event) => onNoteLevelChange(level, event.target.checked)} />
                    <span>{label}</span>
                  </label>
                  {level === "voicing" && (
                    <label className="checkbox-line finder-voicing-spacing-option">
                      <input type="checkbox" checked={showVoicingIntervals} disabled={!noteLevels.voicing}
                        onChange={(event) => onShowVoicingIntervalsChange(event.target.checked)} />
                      <span>{t("ui.showVoicingIntervals")}</span>
                      <HelpTip text={t("ui.voicingIntervalsHelp")} />
                    </label>
                  )}
                </div>
              ))}
              <label htmlFor="finder-explanation-size">{t("tools.explanationSize")}: {explanationFontSize} px</label>
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
