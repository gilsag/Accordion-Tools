import { useMemo, useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { displayRealizedChord, type ChordDisplayStyle } from "../../tools/chordDisplay";
import { chordToneName, displayRoot, realizedChordName } from "../../tools/stradellaChordFinder/chordSpelling";
import { finderChordSymbol } from "../../tools/stradellaChordFinder/chordSymbol";
import { analyzeConfiguredStradellaVoicing, formatModeledStradellaNotes, type StradellaRegisterModel } from "../../tools/stradellaChordFinder/registerModel";
import { explainStradellaRealization } from "../../tools/stradellaChordFinder/explainRealization";
import type { StradellaChordFinderResult } from "../../tools/stradellaChordFinder/results";
import type { FinderChordPattern, StradellaChordFinderMode, DiagramButton } from "../../types";
import { HelpTip } from "../../components/ui/HelpTip";
import { filterRealizationRows, type RealizationFilters } from "./stradellaInspectorRows";
import { WorkspaceInspectorFrame } from "./WorkspaceInspectorFrame";

type Props = {
  blocked?: boolean;
  root: string;
  pattern: FinderChordPattern;
  requestedBass: string | null;
  mode: StradellaChordFinderMode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  realizations: StradellaChordFinderResult[];
  result: StradellaChordFinderResult;
  registerModel: StradellaRegisterModel;
  chordDisplayStyle: ChordDisplayStyle;
  formatPitches: (pitches: string[]) => string;
  formatText: (value: string) => string;
};

/** The inspector never owns a realization. Filter checkboxes only narrow the
 * visible projection; selection is passed back to the existing Finder hook. */
export function StradellaResultsInspector({ root, pattern, requestedBass, mode, selectedIndex,
  onSelect, realizations, result, registerModel, chordDisplayStyle, formatPitches, formatText, blocked }: Props) {
  const { t, language } = useI18n();
  const [filters, setFilters] = useState<RealizationFilters>({rootInBass: false, exactOnly: false, atMostTwo: false});
  const rows = useMemo(() => filterRealizationRows(realizations, root, filters), [realizations, root, filters]);
  const selectedHidden = !rows.some((row) => row.originalIndex === selectedIndex);
  const spell = (pc: string) => chordToneName(root, pattern, pc);
  const buttonName = (button: DiagramButton) => button.kind.startsWith("bass-")
    ? `${spell(button.pitchClass ?? root)} ${t("ui.bass")}`
    : `${spell(button.chordRoot ?? root)} ${t(button.kind === "chord-major" ? "inspector.major" : button.kind === "chord-minor" ? "inspector.minor" : button.kind === "chord-dominant7" ? "inspector.seventh" : "inspector.diminished")}`;
  const bassName = (candidate: StradellaChordFinderResult) => {
    const basses = candidate.playbackButtons.filter((button) => button.kind.startsWith("bass-"));
    return basses.length ? basses.map((button) => spell(button.pitchClass ?? root)).join(" + ") : "—";
  };
  const modeledVoicing = analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel);
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  return (
    <WorkspaceInspectorFrame title={t("inspector.title")} blocked={blocked}>
      <div className="inspector-filters" role="group" aria-label={t("inspector.filters")}>
        {([
          ["rootInBass", "inspector.rootInBass"],
          ["exactOnly", "inspector.exactOnly"],
          ["atMostTwo", "inspector.atMostTwo"],
        ] as const).map(([key, label]) => (
          <span className="inspector-filter-option" key={key}>
            <label><input type="checkbox" checked={filters[key]}
              onChange={(event) => setFilters((current) => ({...current, [key]: event.target.checked}))} />
              {t(label)}</label>
            {key === "rootInBass" && <HelpTip text={t("inspector.bassHelp")} />}
          </span>
        ))}
      </div>
      <p className="inspector-meta" aria-live="polite">{t("inspector.showing", {visible: rows.length, total: realizations.length})}</p>
      {selectedHidden && result.playable && <p className="inspector-selection-note">{t("inspector.hiddenSelection")}</p>}
      <div className="inspector-table-scroll" tabIndex={0} role="region" aria-label={t("inspector.tableLabel")}>
        <table className="inspector-table">
          <thead><tr>
            <th scope="col">{t("inspector.rank")}</th>
            <th scope="col">{t("inspector.played")}</th>
            <th scope="col">{t("inspector.bass")}</th>
            <th scope="col">{t("tools.status")}</th>
            <th scope="col">{t("inspector.omits")}</th>
            <th scope="col">{t("inspector.count")}</th>
          </tr></thead>
          <tbody>{rows.map(({candidate, originalIndex}) => (
            <tr key={candidate.playbackButtons.map((button) => button.id).join("|") + `-${originalIndex}`}
              className={originalIndex === selectedIndex ? "inspector-row-selected" : ""}
              aria-selected={originalIndex === selectedIndex} onClick={() => onSelect(originalIndex)}>
              <td><button type="button" className="inspector-select" aria-pressed={originalIndex === selectedIndex}
                aria-label={t("inspector.selectRank", {rank: originalIndex + 1})}
                onClick={(event) => {event.stopPropagation(); onSelect(originalIndex);}}>
                {candidate.recommended ? "★ " : ""}{originalIndex + 1}
              </button></td>
              <td>{candidate.playbackButtons.map(buttonName).join(" + ")}</td>
              <td>{bassName(candidate)}</td>
              <td className="inspector-status">
                <span className={`inspector-status-badge ${candidate.exact ? "exact" : "approx"}`}>
                  {candidate.exact ? t("inspector.exact") : t("inspector.approx")}
                </span>
              </td>
              <td>{candidate.missingPitches.length ? formatPitches(candidate.missingPitches) : "—"}</td>
              <td>{candidate.playbackButtons.length}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="inspector-empty" role="status">{t("inspector.noMatches")}</p>}
      <section className="inspector-details" aria-label={t("tools.stradellaResult")}>
        <h3>{t("tools.stradellaResult")}</h3>
        <p>{t("tools.requestedChord")}: <strong>{displayRealizedChord(root, pattern,
          realizedChordName(root, pattern, requestedBass, requestedBass, requestedSymbol), chordDisplayStyle)}</strong></p>
        <p>{t("tools.status")}: <strong>{!result.playable ? t("common.notFound") : result.exact ? t("common.exactReady") : t("common.approxReady")}</strong></p>
        {!result.playable ? <p>{t("common.notFound")}</p> : <>
          <p>{t("tools.buttons")}: <strong>{result.playbackButtons.length}</strong></p>
          <p><strong>{formatText(result.shortDescription)}</strong></p>
          <p>{t("tools.target")}: {formatPitches(result.targetPitches)}</p>
          {modeledVoicing.notes.length > 0 && <p>{t("tools.nominalPitches")}: <strong>{formatModeledStradellaNotes(modeledVoicing.notes, spell)}</strong> <HelpTip text={t("ui.modelPitchesHelp")} /></p>}
          <p>{t("tools.covered")}: {formatPitches(result.coveredPitches)}</p>
          {result.missingPitches.length > 0 && <p>{t("tools.missing")}: {formatPitches(result.missingPitches)}</p>}
          {result.extraPitches.length > 0 && <p>{t("tools.extra")}: {formatPitches(result.extraPitches)}</p>}
        </>}
        <details className="tool-details"><summary>{t("tools.moreExplanation")}</summary>
          {explainStradellaRealization(root, pattern, result, mode, registerModel, requestedBass, chordDisplayStyle, language)
            .split(/\n\s*\n/).map((paragraph, index) => <p className="hint" key={index}>{formatText(paragraph)}</p>)}
        </details>
      </section>
    </WorkspaceInspectorFrame>
  );
}
