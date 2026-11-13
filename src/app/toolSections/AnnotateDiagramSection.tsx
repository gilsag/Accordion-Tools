import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { ANNOTATE_MODES, type AnnotateMode } from "../../diagram/useDiagramOverlays";
import { translateKnownLabel, type TranslationKey } from "../../i18n/catalog";
import { stradellaRowLabel } from "../../stradella";
import type { DiagramAnnotationAnchor, FontFamily, NumberPosition, SequenceColorPreset, SequenceDisplayMode } from "../../types";
import type { AppControllerModel } from "../useAppController";

const FINGER_NUMBERS = ["1", "2", "3", "4", "5"] as const;

const ANNOTATE_MODE_LABELS: Record<AnnotateMode, TranslationKey> = {
  select: "ui.annotateModeSelect", finger: "ui.annotateModeFinger",
  sequence: "ui.annotateModeSequence", notes: "ui.annotateModeNotes",
};

/** The slice of the controller model this section reads. */
type AnnotateDiagramSectionModel = Pick<AppControllerModel["tools"],
  "annotateMode" | "annotationBold" | "annotationButtonAnchor" | "annotationItalic" |
  "annotationLocationLabel" | "annotationOffsetPercent" | "annotationPreview" |
  "applyFingerToSelected" | "clearAllFingerings" | "clearFingerForSelected" |
  "clearSelection" | "clearSequence" | "clearTextNotes" | "deleteTextNote" |
  "deselectButton" | "fingeringDraft" | "fingeringPosition" | "getMainLabel" | "language" |
  "playSelectedButtons" | "selectedButtons" | "SEQUENCE_DISPLAY_MODE_OPTIONS" |
  "sequenceArrowheadSize" | "sequenceColorPreset" | "sequenceDisplayMode" |
  "sequenceNumberColorPreset" | "sequenceNumberFontSize" | "sequenceNumberPosition" |
  "sequenceSteps" | "sequenceThickness" | "setAnnotateMode" | "setAnnotationBold" |
  "setAnnotationButtonAnchor" | "setAnnotationItalic" | "setAnnotationOffsetPercent" |
  "setFingeringDraft" | "setFingeringPosition" | "setSequenceArrowheadSize" |
  "setSequenceColorPreset" | "setSequenceDisplayMode" | "setSequenceNumberColorPreset" |
  "setSequenceNumberFontSize" | "setSequenceNumberPosition" | "setSequenceThickness" |
  "setTextNoteColor" | "setTextNoteFont" | "setTextNoteFontSize" | "side" | "t" |
  "textNoteColor" | "textNoteFont" | "textNoteFontSize" | "textNotes">;

/** Annotate Diagram: selection, fingering, sequences and text notes. */
export default function AnnotateDiagramSection({ model }: { model: AnnotateDiagramSectionModel }) {
  const {
    annotateMode, annotationBold, annotationButtonAnchor, annotationItalic,
    annotationLocationLabel, annotationOffsetPercent, annotationPreview, applyFingerToSelected,
    clearAllFingerings, clearFingerForSelected, clearSelection, clearSequence, clearTextNotes,
    deleteTextNote, deselectButton, fingeringDraft, fingeringPosition, getMainLabel, language,
    playSelectedButtons, selectedButtons, SEQUENCE_DISPLAY_MODE_OPTIONS, sequenceArrowheadSize,
    sequenceColorPreset, sequenceDisplayMode, sequenceNumberColorPreset, sequenceNumberFontSize,
    sequenceNumberPosition, sequenceSteps, sequenceThickness, setAnnotateMode, setAnnotationBold,
    setAnnotationButtonAnchor, setAnnotationItalic, setAnnotationOffsetPercent, setFingeringDraft,
    setFingeringPosition, setSequenceArrowheadSize, setSequenceColorPreset, setSequenceDisplayMode,
    setSequenceNumberColorPreset, setSequenceNumberFontSize, setSequenceNumberPosition,
    setSequenceThickness, setTextNoteColor, setTextNoteFont, setTextNoteFontSize, side, t,
    textNoteColor, textNoteFont, textNoteFontSize, textNotes,
  } = model;
  return (
    <>
      <SegmentedChoice
        label={t("ui.annotateMode")}
        value={annotateMode}
        onChange={setAnnotateMode}
        groupClassName="two-columns"
        options={ANNOTATE_MODES.map((mode) => ({ value: mode, label: t(ANNOTATE_MODE_LABELS[mode]) }))}
      />
      <p className="hint">{t("ui.annotateModeHint")}</p>

      {annotateMode === "select" && (
        <>
          <p className="hint">{t("ui.selectionIntro")}</p>
        <p className="hint">
          {t("ui.selectedButtons")}{" "}
          <strong>{selectedButtons.length}</strong>
        </p>

        <button
          type="button"
          className="small-button"
          onClick={playSelectedButtons}
          disabled={selectedButtons.length === 0}
        >
          {t("ui.playSelection")}
        </button>

        {selectedButtons.length > 0 ? (
          <div className="selected-list">
            {selectedButtons.map((button) => (
              <div key={button.id} className="selected-item">
                <span>{getMainLabel(button) || t("settings.blank")}</span>
                <span className="selected-meta">
                  {side === "stradella"
                    ? `${translateKnownLabel(language, stradellaRowLabel(button.kind))}, ${t("ui.columnShort")} ${button.column + 1}`
                    : `${t("ui.rowShort")} ${button.row + 1}, ${t("ui.columnShort")} ${button.column + 1}`}
                </span>
                <button
                  type="button"
                  className="selected-remove-button"
                  onClick={() => deselectButton(button.id)}
                  aria-label={t("ui.deselectButton", { button: getMainLabel(button) || t("ui.buttonGeneric") })}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">{t("ui.noButtonsSelected")}</p>
        )}

        <button className="small-button" onClick={clearSelection}>
          {t("ui.clearSelection")}
        </button>
        </>
      )}

      {annotateMode === "finger" && (
        <>
          <p className="hint">{t("ui.fingeringIntro")}</p>

        <SegmentedChoice label={t("ui.fingeringValue")} value={fingeringDraft} onChange={setFingeringDraft}
          options={FINGER_NUMBERS.map((finger) => ({ value: finger, label: finger }))} />

        <label>
          {t("ui.fingeringPosition")}
          <select
            value={fingeringPosition}
            onChange={(event) =>
              setFingeringPosition(
                event.target.value as NumberPosition,
              )
            }
          >
            <option value="inside-bottom">{t("ui.insideBottom")}</option>
            <option value="inside-top">{t("ui.insideTop")}</option>
            <option value="above">{t("ui.aboveButton")}</option>
          </select>
        </label>

        <div className="button-row">
          <button
            className="small-button"
            onClick={applyFingerToSelected}
          >
            {t("ui.applyToSelected")}
          </button>
          <button
            className="small-button"
            onClick={clearFingerForSelected}
          >
            {t("ui.clearSelected")}
          </button>
          <button
            className="small-button"
            onClick={clearAllFingerings}
          >
            {t("ui.clearAll")}
          </button>
        </div>
        </>
      )}

      {annotateMode === "sequence" && (
        <>
          <p className="hint">{t("ui.sequenceIntro")}</p>

        <label>
          {t("ui.display")}
          <select
            value={sequenceDisplayMode}
            onChange={(event) =>
              setSequenceDisplayMode(
                event.target.value as SequenceDisplayMode,
              )
            }
          >
            {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {translateKnownLabel(language, option.label)}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("ui.arrowColor")}
          <select
            value={sequenceColorPreset}
            onChange={(event) =>
              setSequenceColorPreset(
                event.target.value as SequenceColorPreset,
              )
            }
          >
            <option value="red">{t("ui.red")}</option>
            <option value="blue">{t("ui.blue")}</option>
            <option value="black">{t("ui.black")}</option>
            <option value="grey">{t("ui.grey")}</option>
            <option value="theme">{t("ui.themeAccent")}</option>
          </select>
        </label>

        <label>
          {t("ui.arrowThickness")} {sequenceThickness.toFixed(1)}
          <input
            type="range"
            min={1}
            max={8}
            step={0.25}
            value={sequenceThickness}
            onChange={(event) =>
              setSequenceThickness(Number(event.target.value))
            }
          />
        </label>

        <label>
          {t("ui.arrowheadSize")} {sequenceArrowheadSize.toFixed(1)}
          <input
            type="range"
            min={2}
            max={10}
            step={0.5}
            value={sequenceArrowheadSize}
            onChange={(event) =>
              setSequenceArrowheadSize(Number(event.target.value))
            }
          />
        </label>

        <label>
          {t("ui.numberColor")}
          <select
            value={sequenceNumberColorPreset}
            onChange={(event) =>
              setSequenceNumberColorPreset(
                event.target.value as SequenceColorPreset,
              )
            }
          >
            <option value="red">{t("ui.red")}</option>
            <option value="blue">{t("ui.blue")}</option>
            <option value="black">{t("ui.black")}</option>
            <option value="grey">{t("ui.grey")}</option>
            <option value="theme">{t("ui.themeAccent")}</option>
          </select>
        </label>

        <label>
          {t("ui.numberPosition")}
          <select
            value={sequenceNumberPosition}
            onChange={(event) =>
              setSequenceNumberPosition(
                event.target.value as NumberPosition,
              )
            }
          >
            <option value="above">{t("ui.aboveButton")}</option>
            <option value="inside-top">{t("ui.insideTop")}</option>
            <option value="inside-bottom">{t("ui.insideBottom")}</option>
            <option value="none">{t("ui.noNumbers")}</option>
          </select>
        </label>

        <label>
          {t("ui.numberFontSize")} {sequenceNumberFontSize}px
          <input
            type="range"
            min={7}
            max={18}
            value={sequenceNumberFontSize}
            onChange={(event) =>
              setSequenceNumberFontSize(Number(event.target.value))
            }
          />
        </label>

        <p className="hint">
          {t("ui.sequenceLength")} <strong>{sequenceSteps.length}</strong>
        </p>
        <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>

        <div className="button-row">
          <button className="small-button" onClick={clearSequence}>
            {t("ui.clearSequence")}
          </button>
        </div>

        <details className="compact-help-details">
          <summary>{t("ui.notationHelp")}</summary>
          <p>
            {t("ui.sequenceNotationHint")}
          </p>
        </details>
        </>
      )}

      {annotateMode === "notes" && (
        <>
          <p className="hint">{t("ui.annotateHintDetailed")}</p>

        <label>
          {t("ui.buttonPosition")}
          <select
            value={annotationButtonAnchor}
            onChange={(event) =>
              setAnnotationButtonAnchor(
                event.target.value as DiagramAnnotationAnchor,
              )
            }
          >
            <option value="center">{t("ui.center")}</option>
            <option value="top">{t("ui.top")}</option>
            <option value="bottom">{t("ui.bottom")}</option>
            <option value="left">{t("ui.left")}</option>
            <option value="right">{t("ui.right")}</option>
            <option value="topLeft">{t("ui.topLeft")}</option>
            <option value="topRight">{t("ui.topRight")}</option>
            <option value="bottomLeft">{t("ui.bottomLeft")}</option>
            <option value="bottomRight">{t("ui.bottomRight")}</option>
          </select>
        </label>

        <label>
          {t("ui.annotateTextSize")}: {textNoteFontSize}px
          <input
            type="range"
            min={8}
            max={32}
            value={textNoteFontSize}
            onChange={(event) =>
              setTextNoteFontSize(Number(event.target.value))
            }
          />
        </label>

        <label>
          {t("ui.distanceFromCenter")} {annotationOffsetPercent}%
          <input
            type="range"
            min={0}
            max={100}
            value={annotationOffsetPercent}
            onChange={(event) =>
              setAnnotationOffsetPercent(Number(event.target.value))
            }
          />
        </label>

        <div className="annotation-style-toggles" aria-label={t("ui.annotationStyle")}>
          <button
            type="button"
            className={annotationBold ? "style-toggle active" : "style-toggle"}
            onClick={() => setAnnotationBold((current) => !current)}
            aria-pressed={annotationBold}
            title={t("ui.bold")}
          >
            B
          </button>
          <button
            type="button"
            className={annotationItalic ? "style-toggle active" : "style-toggle"}
            onClick={() => setAnnotationItalic((current) => !current)}
            aria-pressed={annotationItalic}
            title={t("ui.italic")}
          >
            <em>I</em>
          </button>
        </div>

        <label>
          {t("ui.textColor")}
          <input
            type="color"
            value={textNoteColor}
            onChange={(event) => setTextNoteColor(event.target.value)}
          />
        </label>

        <label>
          {t("ui.font")}
          <select
            value={textNoteFont}
            onChange={(event) =>
              setTextNoteFont(event.target.value as FontFamily)
            }
          >
            <option value="system">{t("ui.system")}</option>
            <option value="serif">{t("ui.serif")}</option>
            <option value="mono">{t("ui.mono")}</option>
            <option value="rounded">{t("ui.rounded")}</option>
          </select>
        </label>

        <div className="annotation-list-block">
          <div className="annotation-list-header">
            <span>{t("ui.annotations")}</span>
            <strong>{textNotes.length}</strong>
          </div>

          {textNotes.length === 0 ? (
            <p className="hint">
              {t("ui.noAnnotationsYetClickTheDiagramToAddOne")}
            </p>
          ) : (
            <ul className="annotation-list">
              {textNotes.map((note, index) => (
                <li key={note.id} className="annotation-list-item">
                  <div className="annotation-list-text">
                    <strong>{index + 1}. {annotationPreview(note)}</strong>
                    <span>{annotationLocationLabel(note)}</span>
                  </div>
                  <button
                    type="button"
                    className="annotation-delete-button"
                    onClick={() => deleteTextNote(note.id)}
                    aria-label={t("ui.deleteAnnotation", { count: index + 1 })}
                    title={t("ui.deleteAnnotationTooltip")}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="small-button"
          onClick={clearTextNotes}
          disabled={textNotes.length === 0}
        >
          {t("ui.clearAnnotations")}
        </button>
        </>
      )}
    </>
  );
}
