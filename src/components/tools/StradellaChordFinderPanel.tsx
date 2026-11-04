import { translateKnownLabel } from "../../i18n/catalog";
/* Left-hand Stradella Finder controls. The inspector presents candidate
   results; the existing feature hook owns selection, search and rankings. */

import type { FinderChordPattern, StradellaChordFinderMode } from "../../types";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import {
  STRADELLA_CHORD_FINDER_MODE_OPTIONS,
  type StradellaChordFinderResult,
} from "../../tools/stradellaChordFinderTools";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { HelpTip } from "../ui/HelpTip";
import { BinaryChoiceButton } from "../ui/BinaryChoiceButton";
import { useI18n } from "../../i18n/useI18n";
import { permittedRequestedBasses } from "../../tools/stradellaChordFinder/harmonicIdentity";
import { chordToneName } from "../../tools/stradellaChordFinder/chordSpelling";
import type { StradellaNoteLevels } from "../../tools/stradellaChordFinder/diagramAnnotations";
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
  playbackButtonCount: number;
  isActive: boolean;
  onToggleActive: () => void;
  onPlay: () => void;
  canExploreHarmony: boolean;
  onExploreHarmony: () => void;
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
  playbackButtonCount,
  isActive,
  onToggleActive,
  onPlay,
  canExploreHarmony,
  onExploreHarmony,
}: StradellaChordFinderPanelProps) {
  const { t, language } = useI18n();
  const spell = (pc: string) => chordToneName(root, pattern, pc);
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
            {isActive && <p className="hint">{t("ui.recFirst")} {t("ui.approxCount", { exact: realizations.filter((item) => item.playable && item.exact).length, approx: realizations.filter((item) => item.playable && !item.exact).length })}</p>}
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

        <div className="button-row">
          <button type="button" className={`small-button ${isActive ? "active-tool" : ""}`} onClick={onToggleActive}>
            {isActive ? t("tools.hideChord") : t("tools.showChord")}
          </button>
          <button className="small-button" onClick={onPlay} disabled={!result.playable || playbackButtonCount === 0}>
            {mode === "bass-only" ? t("tools.playBassChord") : t("tools.playCombination")}
          </button>
          <button className="small-button" onClick={onExploreHarmony} disabled={!canExploreHarmony}>
            {t("tools.exploreHarmony")}
          </button>
        </div>
        <div className="finder-annotation-options">
          <label className="checkbox-line">
            <input type="checkbox" checked={showRealizationNote}
              onChange={(event) => onShowRealizationNoteChange(event.target.checked)} />
            <span className="label-line">{t("tools.showExplanationBelow")}
              <HelpTip text={t("ui.diagramNoteHelp")} />
            </span>
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
                      <span className="label-line">{t("ui.showVoicingIntervals")}
                        <HelpTip text={t("ui.voicingIntervalsHelp")} />
                      </span>
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
