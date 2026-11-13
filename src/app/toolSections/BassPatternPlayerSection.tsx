import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { translateKnownLabel, type TranslationKey } from "../../i18n/catalog";
import { bassPatternName, progressionName } from "../../i18n/optionLabels";
import { bassPatternBeat, patternBarCount, type BassPatternBeatName } from "../../tools/bassPatternPlayerTools";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";
import type { AppControllerModel } from "../useAppController";

const BEAT_LABEL_KEYS: Record<BassPatternBeatName, TranslationKey> = {
  "half": "ui.beatHalf", "quarter": "ui.beatQuarter", "dotted-quarter": "ui.beatDottedQuarter",
  "eighth": "ui.beatEighth", "dotted-eighth": "ui.beatDottedEighth", "sixteenth": "ui.beatSixteenth",
};

/** The slice of the controller model this section reads. */
type BassPatternPlayerSectionModel = Pick<AppControllerModel["tools"],
  "bassPatternBarsPerChord" | "bassPatternChordVoicing" | "bassPatternDefinitions" |
  "bassPatternEditorErrors" | "bassPatternEditorExpanded" | "bassPatternEditorMessage" |
  "bassPatternEditorText" | "bassPatternEvents" | "bassPatternExportFormat" | "bassPatternId" |
  "bassPatternMissingText" | "bassPatternRepeatSelection" | "bassPatternRoot" |
  "bassPatternTempoBpm" | "bassPatternTotalBeats" | "bassPatternValidationErrors" |
  "chordProgressionDefinitions" | "chordProgressionId" | "customBassPatternDefinitions" |
  "exportSelectedBassPattern" | "formatProgressionOptionLabel" | "language" |
  "loadSelectedPatternIntoEditor" | "removeSelectedCustomBassPattern" |
  "saveCustomBassPattern" | "selectedBassPattern" | "selectedChordProgression" |
  "setBassPatternBarsPerChord" | "setBassPatternChordVoicing" | "setBassPatternEditorExpanded" |
  "setBassPatternEditorText" | "setBassPatternExportFormat" | "setBassPatternId" |
  "setBassPatternRepeatSelection" | "setBassPatternRoot" | "setBassPatternTempoBpm" |
  "setChordProgressionId" | "stopBassPatternPlayback" | "t">;

/** Bass Pattern Player: pattern, progression, tempo, editor and export. */
export default function BassPatternPlayerSection({ model }: { model: BassPatternPlayerSectionModel }) {
  const {
    bassPatternBarsPerChord, bassPatternChordVoicing, bassPatternDefinitions,
    bassPatternEditorErrors, bassPatternEditorExpanded, bassPatternEditorMessage,
    bassPatternEditorText, bassPatternEvents, bassPatternExportFormat, bassPatternId,
    bassPatternMissingText, bassPatternRepeatSelection, bassPatternRoot, bassPatternTempoBpm,
    bassPatternTotalBeats, bassPatternValidationErrors, chordProgressionDefinitions,
    chordProgressionId, customBassPatternDefinitions, exportSelectedBassPattern,
    formatProgressionOptionLabel, language, loadSelectedPatternIntoEditor,
    removeSelectedCustomBassPattern, saveCustomBassPattern, selectedBassPattern,
    selectedChordProgression, setBassPatternBarsPerChord, setBassPatternChordVoicing,
    setBassPatternEditorExpanded, setBassPatternEditorText, setBassPatternExportFormat,
    setBassPatternId, setBassPatternRepeatSelection, setBassPatternRoot, setBassPatternTempoBpm,
    setChordProgressionId, stopBassPatternPlayback, t,
  } = model;
  return (
    <>
      <p className="hint">
        {t("ui.playsStradellaBassPatternsOverAChordProgression")}
      </p>

      <label>
        {t("ui.progression")}
        <select
          value={chordProgressionId}
          onChange={(event) => {
            stopBassPatternPlayback();
            setChordProgressionId(event.target.value);
          }}
        >
          {chordProgressionDefinitions.map((progression) => (
            <option key={progression.id} value={progression.id}>
              {formatProgressionOptionLabel(progression, language)}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t("ui.root")}
        <select
          value={bassPatternRoot}
          onChange={(event) => {
            stopBassPatternPlayback();
            setBassPatternRoot(event.target.value);
          }}
        >
          {FINDER_ROOT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {translateKnownLabel(language, option.label)}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t("ui.rhythm")}
        <select
          value={bassPatternId}
          onChange={(event) => {
            stopBassPatternPlayback();
            setBassPatternId(event.target.value);
          }}
        >
          {bassPatternDefinitions.map((pattern) => (
            <option key={pattern.id} value={pattern.id}>
              {bassPatternName(pattern.id, pattern.name, language)}
            </option>
          ))}
        </select>
      </label>

      <SegmentedChoice label={<>{t("ui.chordVoicing")} <HelpTip text={t("ui.simpleFullVoicingHelp")} /></>} value={bassPatternChordVoicing} onChange={(next) => { stopBassPatternPlayback(); setBassPatternChordVoicing(next); }} options={[{ value: "simple", label: t("ui.simple") }, { value: "full", label: t("ui.full") }]} />

      <div className="compact-control-grid">
        <label>
          {t("ui.repeatsPerChord")}: {bassPatternBarsPerChord}
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={bassPatternBarsPerChord}
            onChange={(event) => {
              stopBassPatternPlayback();
              setBassPatternBarsPerChord(
                Number(event.target.value),
              );
            }}
          />
        </label>

        <label>
          {t("ui.tempo")}: {t("ui.tempoBeats", {
            tempo: bassPatternTempoBpm,
            beat: t(BEAT_LABEL_KEYS[bassPatternBeat(selectedBassPattern?.meter ?? "4/4").beat]),
          })}
          <input
            type="range"
            min={30}
            max={220}
            step={1}
            value={bassPatternTempoBpm}
            onChange={(event) =>
              setBassPatternTempoBpm(Number(event.target.value))
            }
          />
        </label>
      </div>

      <div className="compact-control-grid">
        <label>
          {t("ui.playbackRepeat")}
          <select
            value={bassPatternRepeatSelection}
            onChange={(event) =>
              setBassPatternRepeatSelection(event.target.value)
            }
          >
            <option value="1">{t("ui.firstTime")}</option>
            <option value="2">{t("ui.twoTimes")}</option>
            <option value="4">{t("ui.fourTimes")}</option>
            <option value="loop">{t("ui.loopUntilStopped")}</option>
          </select>
        </label>
      </div>

      <div className="result-card">
        <div className="result-card-title">
          {selectedBassPattern ? bassPatternName(selectedBassPattern.id, selectedBassPattern.name, language) : t("ui.noPattern")}
        </div>
        <p>
          {selectedChordProgression ? progressionName(selectedChordProgression.id, selectedChordProgression.name, language) :
            t("ui.noProgression")}{" "}
          · {t("ui.patternBars")}:{" "}
          {selectedBassPattern
            ? patternBarCount(selectedBassPattern)
            : 1}{" "}
          · {bassPatternBarsPerChord} {t("ui.repeatPerChord")} ·
          {t("ui.length")}: {bassPatternTotalBeats.toFixed(1)} {t("ui.meterUnits")}
          {bassPatternMissingText
            ? ` · ${t("ui.missingShort")}: ${bassPatternMissingText}`
            : ""}
        </p>
        {bassPatternValidationErrors.length > 0 && (
          <div className="bass-pattern-errors" role="alert">
            <strong>{t("ui.patternErrors")}</strong>
            <ul>
              {bassPatternValidationErrors
                .slice(0, 6)
                .map((message) => (
                  <li key={message}>{message}</li>
                ))}
            </ul>
            {bassPatternValidationErrors.length > 6 && (
              <p>
                {t("ui.andMore", { count: bassPatternValidationErrors.length - 6 })}
              </p>
            )}
          </div>
        )}
        {selectedBassPattern?.tags &&
          selectedBassPattern.tags.length > 0 && (
            <p className="hint">
              {t("ui.tags")}: {selectedBassPattern.tags.join(", ")}
            </p>
          )}
      </div>

      <details className="compact-help-details">
        <summary>{t("ui.notationHelp")}</summary>
        <p>
          {t("ui.bassPatternNotationHelp")}
        </p>
      </details>

      <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>
      <div className="button-row">
        <div className="compact-export-row">
          <span>{t("ui.export")}</span>
          <select
            value={bassPatternExportFormat}
            onChange={(event) =>
              setBassPatternExportFormat(
                event.target.value as
                  | "abc"
                  | "midi"
                  | "lilypond",
              )
            }
            aria-label={t("ui.stradellaExportFormat")}
          >
            <option value="abc">ABC</option>
            <option value="midi">MIDI</option>
            <option value="lilypond">LilyPond</option>
          </select>
          <button
            type="button"
            className="small-button compact-export-download"
            onClick={exportSelectedBassPattern}
            disabled={bassPatternEvents.length === 0}
          >
            {t("ui.download")}
          </button>
        </div>
      </div>

      <div
        className={`result-card bass-pattern-editor ${bassPatternEditorExpanded ? "expanded" : "collapsed"}`}
      >
        <button
          type="button"
          className="inline-section-toggle"
          onClick={() =>
            setBassPatternEditorExpanded((current) => !current)
          }
        >
          <span>{t("ui.customPatternEditor")}</span>
          <span>{bassPatternEditorExpanded ? "−" : "+"}</span>
        </button>
        {bassPatternEditorExpanded && (
          <>
            <p className="hint">
              {t("ui.patternEditorIntro")}
            </p>
            <textarea
              value={bassPatternEditorText}
              onChange={(event) =>
                setBassPatternEditorText(event.target.value)
              }
              rows={12}
              spellCheck={false}
            />
            {bassPatternEditorErrors.length > 0 ? (
              <div className="bass-pattern-errors" role="alert">
                <strong>{t("ui.editorValidation")}</strong>
                <ul>
                  {bassPatternEditorErrors
                    .slice(0, 4)
                    .map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="hint">{t("ui.editorValidationOK")}</p>
            )}
            {bassPatternEditorMessage && (
              <p className="hint">{bassPatternEditorMessage}</p>
            )}
            <div className="button-row">
              <button
                type="button"
                className="small-button"
                onClick={loadSelectedPatternIntoEditor}
              >
                {t("ui.loadSelected")}
              </button>
              <button
                type="button"
                className="small-button"
                onClick={saveCustomBassPattern}
                disabled={bassPatternEditorErrors.length > 0}
              >
                {t("ui.saveCustom")}
              </button>
              <button
                type="button"
                className="small-button"
                onClick={removeSelectedCustomBassPattern}
                disabled={
                  !customBassPatternDefinitions.some(
                    (pattern) => pattern.id === bassPatternId,
                  )
                }
              >
                {t("ui.removeCustom")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
