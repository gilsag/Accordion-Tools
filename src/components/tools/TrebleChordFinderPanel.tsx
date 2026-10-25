import { translateKnownLabel } from "../../i18n/catalog";
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
import { useI18n } from "../../i18n/context";

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
  const { t, language } = useI18n();
  return (
    <CollapsibleSection title={t("tools.chordFinder")} isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        {t("tools.trebleIntro")}
      </p>
      <details className="tool-details">
        <summary>{t("tools.moreExplanation")}</summary>
        <p className="hint">
          {t("ui.trebleMoreHelp")}
        </p>
        {isActive && <p className="hint">{realizationExplanation}</p>}
      </details>

      <fieldset className="tool-fieldset">
        <label>
          <span className="label-line">{t("tools.chordRoot")} <HelpTip text={t("tools.chordRootHelp")} /></span>
          <select value={root} onChange={(event) => onRootChange(event.target.value)}>
            {FINDER_ROOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">{t("tools.rootOctave")} <HelpTip text={t("ui.trebleRootOctaveHelp")} /></span>
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
          <span className="label-line">{t("tools.chordType")} <HelpTip text={t("ui.trebleChordTypeHelp")} /></span>
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
          <span className="label-line">{t("tools.inversion")} <HelpTip text={t("ui.trebleInversionHelp")} /></span>
          <select
            value={inversion}
            onChange={(event) => onInversionChange(event.target.value as FinderChordInversion)}
          >
            {CHORD_FINDER_INVERSION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">{t("tools.voicing")} <HelpTip text={t("ui.trebleVoicingHelp")} /></span>
          <select
            value={voicingMode}
            onChange={(event) => onVoicingModeChange(event.target.value as TrebleChordVoicingMode)}
          >
            <option value="auto">{t("tools.autoVoicing")}</option>
            <option value="full">{t("tools.fullVoicing")}</option>
            <option value="practical">{t("tools.practicalVoicing")}</option>
          </select>
        </label>
        {isExtendedChord(pattern) && (
          <p className="hint">{t("ui.extendedTrebleHint")}</p>
        )}
        <div className="result-card">
          <div className="result-card-title">{t("tools.trebleResult")}</div>
          <p>{t("tools.target")}: {targetToneText}</p>
          <p>{t("tools.buttons")}: <strong>{buttonCount}</strong></p>
          <p>{t("tools.realizationStatus")}: <strong>{realizationStatus}</strong></p>
          <p>{t("tools.status")}: <strong>{isActive && buttonCount > 0 ? t("tools.shown") : t("tools.ready")}</strong></p>
        </div>

        <div className="button-row">
          <button type="button" className={`small-button ${isActive ? "active-tool" : ""}`} onClick={onToggleActive}>
            {isActive ? t("tools.hideChord") : t("tools.showChord")}
          </button>
          <button className="small-button" onClick={onPlay} disabled={buttonCount === 0}>
            {t("tools.playChord")}
          </button>
          <button className="small-button" onClick={onClear}>
            {t("tools.clearChord")}
          </button>
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={showVoicingNote}
            onChange={(event) => onShowVoicingNoteChange(event.target.checked)}
          />
          <span>{t("tools.showNote")}</span>
        </label>
      </fieldset>
    </CollapsibleSection>
  );
}
