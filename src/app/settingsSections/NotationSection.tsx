import type { ChordDisplayStyle } from "../../tools/chordDisplay";
import type { AccidentalMode, ChordLabelMode, NotationMode } from "../../types";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type NotationSectionModel = Pick<AppControllerModel["settings"],
  "accidental" | "chordDisplayStyle" | "chordLabelMode" | "notation" | "setAccidental" |
  "setChordDisplayStyle" | "setChordLabelMode" | "setNotation" | "side" | "t">;

/** Note names: accidentals, note-name system and chord symbols. */
export default function NotationSection({ model }: { model: NotationSectionModel }) {
  const {
    accidental, chordDisplayStyle, chordLabelMode, notation, setAccidental, setChordDisplayStyle,
    setChordLabelMode, setNotation, side, t,
  } = model;
  return (
    <>
      <div className="chord-display-style-setting">
        <label>
          {t("settings.chordStyle")}
          <select value={chordDisplayStyle} onChange={(event) => setChordDisplayStyle(event.target.value as ChordDisplayStyle)}>
            <option value="compact">C, Cm, Cmaj7</option>
            <option value="letter">CM, Cm, CM7</option>
            <option value="words">Cmaj, Cmin, Cmaj7</option>
          </select>
        </label>
      </div>

      {side === "stradella" && (
        <div className="notation-stradella-chord-labels">
          <label>
            {t("ui.chordLabels")}
            <select
              value={chordLabelMode}
              onChange={(event) =>
                setChordLabelMode(
                  event.target.value as ChordLabelMode,
                )
              }
            >
              <option value="none">{t("common.none")}</option>
              <option value="chord-name">
                {t("ui.chordNamesSelectedStyle")}
              </option>
              <option value="root-only">{t("ui.rootOnly")}</option>
              <option value="chord-tones">{t("ui.chordTones")}</option>
              <option value="row-function">
                {t("ui.rowFunctionMM7")}
              </option>
              <option value="functional-reference">
                {t("ui.functionalReferenceIIvV7")}
              </option>
            </select>
          </label>
        </div>
      )}

      <label>
        {t("settings.pitchNotation")}
        <select
          value={notation}
          onChange={(event) =>
            setNotation(event.target.value as NotationMode)
          }
        >
          <option value="english">C D E F</option>
          <option value="german">C D E F G A H</option>
          <option value="solfege">Do Re Mi Fa</option>
          <option value="intervals">{t("settings.intervals")}</option>
          <option value="blank">{t("settings.blank")}</option>
        </select>
      </label>

      <label>
        {t("settings.accidentals")}
        <select
          value={accidental}
          onChange={(event) =>
            setAccidental(event.target.value as AccidentalMode)
          }
        >
          <option value="natural">{t("settings.defaultSpelling")}</option>
          <option value="flats">{t("settings.preferFlats")}</option>
          <option value="sharps">{t("settings.preferSharps")}</option>
          <option value="enharmonic">{t("settings.enharmonicPairs")}</option>
        </select>
      </label>
    </>
  );
}
