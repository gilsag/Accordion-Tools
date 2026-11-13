import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type MusicNotationSectionModel = Pick<AppControllerModel["settings"],
  "musicNotationBarsPerLine" | "musicNotationChordFontSize" |
  "musicNotationIncludeDescription" | "musicNotationIncludeSummary" |
  "musicNotationIncludeTitle" | "musicNotationNoteNamesInNoteheads" | "musicNotationPlacement" |
  "musicNotationScale" | "musicNotationStaffSeparator" | "musicNotationStaffWidth" |
  "musicNotationUseBarsPerLine" | "setMusicNotationBarsPerLine" |
  "setMusicNotationChordFontSize" | "setMusicNotationIncludeDescription" |
  "setMusicNotationIncludeSummary" | "setMusicNotationIncludeTitle" |
  "setMusicNotationNoteNamesInNoteheads" | "setMusicNotationPlacement" |
  "setMusicNotationScale" | "setMusicNotationStaffSeparator" | "setMusicNotationStaffWidth" |
  "setMusicNotationUseBarsPerLine" | "setStradellaChordQualityLabels" |
  "setStradellaMarkCounterbass" | "setStradellaNotationMode" | "stradellaChordQualityLabels" |
  "stradellaMarkCounterbass" | "stradellaNotationMode" | "t">;

/** Music notation: score position, engraving options and Stradella writing. */
export default function MusicNotationSection({ model }: { model: MusicNotationSectionModel }) {
  const {
    musicNotationBarsPerLine, musicNotationChordFontSize, musicNotationIncludeDescription,
    musicNotationIncludeSummary, musicNotationIncludeTitle, musicNotationNoteNamesInNoteheads,
    musicNotationPlacement, musicNotationScale, musicNotationStaffSeparator,
    musicNotationStaffWidth, musicNotationUseBarsPerLine, setMusicNotationBarsPerLine,
    setMusicNotationChordFontSize, setMusicNotationIncludeDescription,
    setMusicNotationIncludeSummary, setMusicNotationIncludeTitle,
    setMusicNotationNoteNamesInNoteheads, setMusicNotationPlacement, setMusicNotationScale,
    setMusicNotationStaffSeparator, setMusicNotationStaffWidth, setMusicNotationUseBarsPerLine,
    setStradellaChordQualityLabels, setStradellaMarkCounterbass, setStradellaNotationMode,
    stradellaChordQualityLabels, stradellaMarkCounterbass, stradellaNotationMode, t,
  } = model;
  return (
    <>
      <SegmentedChoice label={t("ui.musicNotationPlacement")}
        value={musicNotationPlacement} onChange={setMusicNotationPlacement}
        options={[{ value: "right", label: t("ui.musicNotationRight") },
          { value: "below", label: t("ui.musicNotationBelow") }]} />
      <SegmentedChoice label={t("ui.stradellaNotationMode")}
        value={stradellaNotationMode} onChange={setStradellaNotationMode}
        options={[{ value: "symbolic", label: t("ui.stradellaNotationSymbolic") },
          { value: "sounding", label: t("ui.stradellaNotationSounding") }]} />
      <p className="hint">{t("ui.stradellaNotationModeHelp")}</p>
      <SegmentedChoice label={t("ui.stradellaChordLabels")}
        value={stradellaChordQualityLabels} onChange={setStradellaChordQualityLabels}
        options={[{ value: "always", label: t("ui.stradellaChordLabelsAlways") },
          { value: "changes", label: t("ui.stradellaChordLabelsChanges") }]} />
      <label className="checkbox-label">
        <input type="checkbox" checked={stradellaMarkCounterbass}
          onChange={event=>setStradellaMarkCounterbass(event.target.checked)}/>
        <span>{t("ui.stradellaCounterbassDash")}</span>
      </label>
      <p className="hint">{t("ui.stradellaOctaveHelp")}</p>
      <label className="checkbox-label">
        <input type="checkbox" checked={musicNotationNoteNamesInNoteheads}
          onChange={event=>setMusicNotationNoteNamesInNoteheads(event.target.checked)}/>
        <span>{t("ui.musicNotationNoteNamesInNoteheads")}</span>
      </label>
      <p className="hint">{t("ui.musicNotationNoteNamesInNoteheadsHelp")}</p>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={musicNotationIncludeTitle}
          onChange={(event) =>
            setMusicNotationIncludeTitle(event.target.checked)
          }
        />
        <span>{t("ui.includeTitle")}</span>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={musicNotationIncludeDescription}
          onChange={(event) =>
            setMusicNotationIncludeDescription(
              event.target.checked,
            )
          }
        />
        <span>{t("ui.includeDescription")}</span>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={musicNotationIncludeSummary}
          onChange={(event) =>
            setMusicNotationIncludeSummary(event.target.checked)
          }
        />
        <span>{t("ui.includeSummaryNote")}</span>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={musicNotationUseBarsPerLine}
          onChange={(event) =>
            setMusicNotationUseBarsPerLine(event.target.checked)
          }
        />
        <span>{t("ui.limitBarsPerLine")}</span>
      </label>

      <label>
        {t("ui.barsPerLine")} {musicNotationBarsPerLine}
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={musicNotationBarsPerLine}
          disabled={!musicNotationUseBarsPerLine}
          onChange={(event) =>
            setMusicNotationBarsPerLine(
              Number(event.target.value),
            )
          }
        />
      </label>

      <label>
        {t("ui.chordTextSize")} {musicNotationChordFontSize}px
        <input
          type="range"
          min={8}
          max={24}
          step={1}
          value={musicNotationChordFontSize}
          onChange={(event) =>
            setMusicNotationChordFontSize(
              Number(event.target.value),
            )
          }
        />
      </label>

      <label>
        {t("ui.notationScale")} {musicNotationScale}%
        <input
          type="range"
          min={40}
          max={100}
          step={2}
          value={musicNotationScale}
          onChange={(event) =>
            setMusicNotationScale(Number(event.target.value))
          }
        />
      </label>

      <label>
        {t("ui.staffWidth")} {musicNotationStaffWidth}px
        <input
          type="range"
          min={320}
          max={900}
          step={20}
          value={musicNotationStaffWidth}
          onChange={(event) =>
            setMusicNotationStaffWidth(Number(event.target.value))
          }
        />
      </label>

      <label>
        {t("ui.staffSpacing")} {musicNotationStaffSeparator}
        <input
          type="range"
          min={8}
          max={32}
          step={1}
          value={musicNotationStaffSeparator}
          onChange={(event) =>
            setMusicNotationStaffSeparator(
              Number(event.target.value),
            )
          }
        />
      </label>

      <p className="hint">
        {t("ui.notesScope")}
      </p>
    </>
  );
}
