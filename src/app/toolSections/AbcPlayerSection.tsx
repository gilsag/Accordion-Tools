import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { translateKnownLabel } from "../../i18n/catalog";
import { abcExampleName } from "../../i18n/optionLabels";
import type { AbcStradellaMode } from "../../types";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type AbcPlayerSectionModel = Pick<AppControllerModel["tools"],
  "abcBothHands" | "abcEditorExpanded" | "abcExampleOptions" | "abcExampleValue" |
  "abcFileName" | "abcHands" | "abcMappedEvents" | "abcMissingPitchText" | "abcParseResult" |
  "abcPositionBeat" | "abcStradellaMode" | "abcTempoBpm" | "abcText" | "abcTotalBeats" |
  "abcTrebleChordSymbolsMode" | "abcVoiceCount" | "chooseAbcHands" | "isTrebleLikeSide" |
  "language" | "loadAbcExample" | "pauseAbcPlayback" | "setAbcActiveButtonIds" |
  "setAbcEditorExpanded" | "setAbcExampleValue" | "setAbcFileName" | "setAbcPlaybackState" |
  "setAbcPositionBeat" | "setAbcStradellaMode" | "setAbcTempoBpm" | "setAbcText" |
  "setAbcTrebleChordSymbolsMode" | "side" | "stopAbcPlayback" | "t">;

/** ABC Player: tune source, hands, tempo and mapping options. */
export default function AbcPlayerSection({ model }: { model: AbcPlayerSectionModel }) {
  const {
    abcBothHands, abcEditorExpanded, abcExampleOptions, abcExampleValue, abcFileName, abcHands,
    abcMappedEvents, abcMissingPitchText, abcParseResult, abcPositionBeat, abcStradellaMode,
    abcTempoBpm, abcText, abcTotalBeats, abcTrebleChordSymbolsMode, abcVoiceCount, chooseAbcHands,
    isTrebleLikeSide, language, loadAbcExample, pauseAbcPlayback, setAbcActiveButtonIds,
    setAbcEditorExpanded, setAbcExampleValue, setAbcFileName, setAbcPlaybackState,
    setAbcPositionBeat, setAbcStradellaMode, setAbcTempoBpm, setAbcText,
    setAbcTrebleChordSymbolsMode, side, stopAbcPlayback, t,
  } = model;
  return (
    <>
      <p className="hint">
        {side === "stradella"
          ? t("ui.abcIntroStradella")
          : t("ui.abcIntroTreble")}
      </p>

      <SegmentedChoice label={t("ui.abcHands")} value={abcHands} onChange={chooseAbcHands} groupClassName="whole-words"
        options={[{ value: "stradella", label: t("nav.stradella") }, { value: "treble", label: t("nav.treble") },
          { value: "both", label: t("ui.abcHandsBoth") }]} />
      {abcHands === "both" && abcText.trim() && (
        <p className="hint">{abcVoiceCount >= 2 ? t("ui.abcHandsHint") : t("ui.abcHandsOneVoice")}</p>
      )}

      {(side === "stradella" || abcBothHands) && (
        <label>
          <span className="label-line">
            {t("ui.abcStradellaMapping")}{" "}
            <HelpTip text={t("ui.abcStradellaMappingHelp")} />
          </span>
          <select
            value={abcStradellaMode}
            onChange={(event) => {
              pauseAbcPlayback();
              setAbcActiveButtonIds([]);
              setAbcStradellaMode(
                event.target.value as AbcStradellaMode,
              );
            }}
          >
            <option value="bass-notes-only">
              {t("ui.bassNotesOnly")}
            </option>
            <option value="chord-symbols-only">
              {t("ui.chordSymbolsOnly")}
            </option>
            <option value="bass-notes-and-chord-symbols">
              {t("ui.bassNotesChordSymbols")}
            </option>
          </select>
        </label>
      )}

      {(isTrebleLikeSide || abcBothHands) && (
        <SegmentedChoice label={<>{t("ui.chordSymbols")} <HelpTip text={t("ui.abcTrebleSymbolsHelp")} /></>} value={abcTrebleChordSymbolsMode} onChange={(next) => { pauseAbcPlayback(); setAbcActiveButtonIds([]); setAbcTrebleChordSymbolsMode(next); }} options={[{ value: "ignore", label: t("ui.ignore") }, { value: "play", label: t("tools.play") }]} />
      )}

      <label>
        {t("ui.exampleTune")}
        <select
          value={abcExampleValue}
          onChange={(event) =>
            void loadAbcExample(event.target.value)
          }
        >
          {abcExampleOptions.map((option) => (
            <option
              key={option.value || "empty"}
              value={option.value}
            >
              {option.value === "" ? t("ui.chooseExample") : abcExampleName(option.value, option.label, language)}
            </option>
          ))}
        </select>
      </label>

      <div className="button-row">
        <label className="small-button file-button">
          {t("ui.loadAbcFile")}
          <input
            type="file"
            accept=".abc,text/plain"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setAbcFileName(file.name);
              setAbcExampleValue("");
              file.text().then((text) => {
                setAbcText(text);
                setAbcPositionBeat(0);
                setAbcActiveButtonIds([]);
                setAbcPlaybackState("stopped");
              });
              event.currentTarget.value = "";
            }}
          />
        </label>
        <button
          className="small-button"
          type="button"
          onClick={() => {
            setAbcText("");
            setAbcFileName("");
            setAbcExampleValue("");
            stopAbcPlayback();
          }}
        >
          {t("ui.clearABC")}
        </button>
      </div>

      {abcFileName && (
        <p className="hint">{t("ui.file")} {abcFileName}</p>
      )}

      <label>
        {t("ui.tempo")}: {abcTempoBpm} BPM
        <input
          type="range"
          min={40}
          max={220}
          step={1}
          value={abcTempoBpm}
          onChange={(event) =>
            setAbcTempoBpm(Number(event.target.value))
          }
        />
      </label>

      <label>
        {t("ui.position")}
        <input
          type="range"
          min={0}
          max={Math.max(0, abcTotalBeats)}
          step={0.25}
          value={Math.min(abcPositionBeat, abcTotalBeats)}
          onChange={(event) => {
            pauseAbcPlayback();
            setAbcPositionBeat(Number(event.target.value));
            setAbcActiveButtonIds([]);
          }}
          disabled={abcTotalBeats === 0}
        />
      </label>

      <div className="result-card">
        <div className="result-card-title">
          {abcText.trim()
            ? abcParseResult.title
            : t("ui.noAbcLoaded")}
        </div>
        {abcParseResult.errors.length > 0 ? (
          <p>{abcParseResult.errors.map((error) => translateKnownLabel(language, error)).join(" ")}</p>
        ) : (
          <p>
            {t("ui.events")} {abcMappedEvents.length} · {t("ui.key")}: {" "}
            {abcParseResult.key}
            {abcBothHands
              ? ` · ${t("ui.abcVoicesBoth")}`
              : abcParseResult.voiceIds.length > 1
                ? ` · ${t("ui.voice")}: ${side === "stradella" ? "2" : "1"}`
                : ""} · {t("ui.length")}: {" "}
            {abcTotalBeats.toFixed(1)} {t("ui.beats")}
            {abcMissingPitchText
              ? ` · ${side === "stradella" && !abcBothHands ? t("ui.unavailableNotes") : t("ui.missingShort")}: ${abcMissingPitchText}`
              : ""}
          </p>
        )}
      </div>

      <p className="hint playback-bar-hint">{t("ui.playbackBarHint")}</p>

      <details className="compact-help-details">
        <summary>{t("ui.notationHelp")}</summary>
        <p>
          {t("ui.abcNotationInstructions")}
        </p>
      </details>

      <div
        className={`result-card abc-editor ${abcEditorExpanded ? "expanded" : "collapsed"}`}
      >
        <button
          type="button"
          className="inline-section-toggle"
          onClick={() =>
            setAbcEditorExpanded((current) => !current)
          }
        >
          <span>{t("ui.abcEditor")}</span>
          <span>{abcEditorExpanded ? "−" : "+"}</span>
        </button>
        {abcEditorExpanded && (
          <label>
            {t("ui.abcText")}
            <textarea
              className="abc-textarea"
              value={abcText}
              onChange={(event) => {
                setAbcText(event.target.value);
                setAbcExampleValue("");
                setAbcPositionBeat(0);
                setAbcActiveButtonIds([]);
                setAbcPlaybackState("stopped");
              }}
              placeholder={
                "X:1\nT:Simple tune\nM:4/4\nL:1/4\nQ:120\nK:C\nC D E F | G A B c |"
              }
            />
          </label>
        )}
      </div>
    </>
  );
}
