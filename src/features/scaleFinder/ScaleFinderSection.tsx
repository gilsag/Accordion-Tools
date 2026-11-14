import { HelpTip } from "../../components/ui/HelpTip";
import { translateKnownLabel } from "../../i18n/catalog";
import {
  FINDER_ROOT_OPTIONS,
  SCALE_FINDER_OPTIONS,
  SCALE_FINDER_ROW_LIMIT_OPTIONS,
} from "./scaleFinderTools";
import type { FinderScalePattern, SequenceDisplayMode } from "../../types";
import { useScaleFinder, useScaleFinderOutput } from "./scaleFinderContext";
import { useStradellaChordFinder } from "../stradellaChordFinder/stradellaChordFinderContext";
import { useTrebleChordFinder } from "../trebleChordFinder/trebleChordFinderContext";
import { SEQUENCE_DISPLAY_MODE_OPTIONS } from "../../app/optionLists";
import { usePlatformInstrument, usePlatformLanguage } from "../../app/platform/platformContexts";
import { useDiagramLabels } from "../../app/useDiagramLabels";
import { CopyLinkButton } from "../../app/shareLink/CopyLinkButton";

/** Scale Finder: scale, root, display mode and row limit. */
export default function ScaleFinderSection() {
  const { language, t } = usePlatformLanguage();
  const { formatStradellaScaleFinderNames } = useDiagramLabels();
  const {
    scaleFinderActive,
    scaleFinderDisplayMode,
    scaleFinderPattern,
    scaleFinderRoot,
    scaleFinderRowLimit,
    setScaleFinderActive,
    setScaleFinderDisplayMode,
    setScaleFinderPattern,
    setScaleFinderRoot,
    setScaleFinderRowLimit,
  } = useScaleFinder();
  const { setStradellaChordFinderActive } = useStradellaChordFinder();
  const { setChordFinderActive } = useTrebleChordFinder();
  const { side } = usePlatformInstrument();
  const { playScaleFinder, scaleFinderButtons, stradellaScaleFinderResult } =
    useScaleFinderOutput();
  const isTrebleLikeSide = side === "treble";
  return (
    <>
      <p className="hint">
        {side === "stradella" ? t("ui.scaleIntroBass") : t("ui.scaleIntroTreble")}
      </p>

      <fieldset className="tool-fieldset">
        <label>
          {t("ui.scaleRoot")}
          <select
            value={scaleFinderRoot}
            onChange={(event) => setScaleFinderRoot(event.target.value)}
          >
            {FINDER_ROOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("ui.scaleType")}
          <select
            value={scaleFinderPattern}
            onChange={(event) => setScaleFinderPattern(event.target.value as FinderScalePattern)}
          >
            {SCALE_FINDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="label-line">
            {t("ui.display")} <HelpTip text={t("ui.scaleDisplayHelp")} />
          </span>
          <select
            value={scaleFinderDisplayMode}
            onChange={(event) =>
              setScaleFinderDisplayMode(event.target.value as SequenceDisplayMode)
            }
          >
            {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        {isTrebleLikeSide && (
          <label>
            {t("ui.rowsUsed")}
            <select
              value={scaleFinderRowLimit}
              onChange={(event) => setScaleFinderRowLimit(Number(event.target.value) as 3 | 4 | 5)}
            >
              {SCALE_FINDER_ROW_LIMIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {translateKnownLabel(language, option.label)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="result-card">
          <div className="result-card-title">
            {side === "stradella" && scaleFinderActive && !stradellaScaleFinderResult.found
              ? t("common.notFound")
              : t("ui.scaleButtons", { count: scaleFinderButtons.length })}
          </div>
          {side === "stradella" && (
            <p>
              {t("ui.targetNotes")}:{" "}
              {formatStradellaScaleFinderNames(
                stradellaScaleFinderResult.targetNames,
                stradellaScaleFinderResult.targetPitches,
              )}
              {stradellaScaleFinderResult.missingPitches.length > 0
                ? ` · ${t("ui.missingShort")}: ${formatStradellaScaleFinderNames(
                    stradellaScaleFinderResult.missingNames,
                    stradellaScaleFinderResult.missingPitches,
                  )}`
                : ""}
            </p>
          )}
        </div>

        <div className="button-row">
          <button
            type="button"
            className={`small-button ${scaleFinderActive ? "active-tool" : ""}`}
            onClick={() => {
              setScaleFinderActive((current) => !current);
              setChordFinderActive(false);
              setStradellaChordFinderActive(false);
            }}
          >
            {scaleFinderActive ? t("ui.hideScale") : t("ui.showScale")}
          </button>

          <button
            className="small-button"
            onClick={playScaleFinder}
            disabled={scaleFinderButtons.length === 0}
          >
            {t("ui.playScale")}
          </button>
          <CopyLinkButton />
        </div>
      </fieldset>
    </>
  );
}
