import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { translateKnownLabel } from "../../i18n/catalog";
import { pianoRangeStatusLabel } from "../../i18n/diagramLabels";
import { formatRegisterRange } from "../../tools/stradellaChordFinder/registerModel";
import type { BassCount, PianoTrebleRange, TrebleLayout, TrebleSizePreset } from "../../types";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type InstrumentSectionModel = Pick<AppControllerModel["settings"],
  "BASS_OPTIONS" | "basses" | "changePianoTrebleRange" | "changeTrebleLayout" |
  "changeTrebleSize" | "language" | "PIANO_TREBLE_RANGE_OPTIONS" | "pianoTrebleRange" |
  "setBasses" | "setStradellaBassRegisterGrouping" | "setStradellaBassRegisterOctave" |
  "setStradellaChordRegisterGrouping" | "setStradellaChordRegisterOctave" | "setTrebleRows" |
  "side" | "stradellaBassRegisterGrouping" | "stradellaBassRegisterOctave" |
  "stradellaChordRegisterGrouping" | "stradellaChordRegisterOctave" | "stradellaRegisterModel" |
  "t" | "TREBLE_SIZE_OPTIONS" | "trebleLayout" | "trebleRows" | "trebleSize">;

/** Instrument: side, layout, size and range of the diagram. */
export default function InstrumentSection({ model }: { model: InstrumentSectionModel }) {
  const {
    BASS_OPTIONS, basses, changePianoTrebleRange, changeTrebleLayout, changeTrebleSize, language,
    PIANO_TREBLE_RANGE_OPTIONS, pianoTrebleRange, setBasses, setStradellaBassRegisterGrouping,
    setStradellaBassRegisterOctave, setStradellaChordRegisterGrouping,
    setStradellaChordRegisterOctave, setTrebleRows, side, stradellaBassRegisterGrouping,
    stradellaBassRegisterOctave, stradellaChordRegisterGrouping, stradellaChordRegisterOctave,
    stradellaRegisterModel, t, TREBLE_SIZE_OPTIONS, trebleLayout, trebleRows, trebleSize,
  } = model;
  return (
    <>
      {side === "stradella" && (
                    <>
                      <label>
                        {t("ui.basses")}
                        <select
                          value={basses}
                          onChange={(event) =>
                            setBasses(event.target.value as BassCount)
                          }
                        >
                          {BASS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {translateKnownLabel(language, option.label)}
                            </option>
                          ))}
                        </select>
                      </label>

                    </>
                  )}

                  {side === "treble" && (
                    <>
                      <label>
                        {t("ui.trebleLayout")}
                        <select
                          value={trebleLayout}
                          onChange={(event) =>
                            changeTrebleLayout(
                              event.target.value as TrebleLayout,
                            )
                          }
                        >
                          <option value="c-system">
                            {t("ui.cSystemChromaticButtons")}
                          </option>
                          <option value="b-system">
                            {t("ui.bSystemBayanChromaticButtons")}
                          </option>
                          <option value="piano">{t("ui.pianoKeyboard")}</option>
                        </select>
                      </label>

                      {trebleLayout !== "piano" && (
                        <>
                          <label>
                            {t("ui.rows")}
                            <select
                              value={trebleRows}
                              onChange={(event) =>
                                setTrebleRows(
                                  Number(event.target.value) as 3 | 4 | 5,
                                )
                              }
                            >
                              <option value={3}>{t("ui.rowsChoice", { count: 3 })}</option>
                              <option value={4}>{t("ui.rowsChoice", { count: 4 })}</option>
                              <option value={5}>{t("ui.rowsChoice", { count: 5 })}</option>
                            </select>
                          </label>

                          <label>
                            {t("ui.trebleSize")}
                            <select
                              value={trebleSize}
                              onChange={(event) =>
                                changeTrebleSize(
                                  event.target.value as TrebleSizePreset,
                                )
                              }
                            >
                              {TREBLE_SIZE_OPTIONS.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {translateKnownLabel(language, option.label)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </>
                      )}

                      {trebleLayout === "piano" && (
                        <label>
                          {t("ui.pianoRange")}
                          <select
                            value={pianoTrebleRange}
                            onChange={(event) =>
                              changePianoTrebleRange(
                                event.target.value as PianoTrebleRange,
                              )
                            }
                          >
                            {PIANO_TREBLE_RANGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {pianoRangeStatusLabel(option.value, language)}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                    </>
                  )}
                  {side === "stradella" && (
                    <div className="instrument-stradella-details">
                      <div className="instrument-chord-construction">
                        <span>{t("ui.presetChordConstruction")}</span>
                        <HelpTip text={t("ui.presetChordConstructionHelp")} />
                      </div>
      <div className="stradella-register-settings">
        <div className="stradella-register-intro-help">
          <span>{t("settings.registers")}</span>
          <HelpTip text={t("ui.stradellaRegisterIntro")} />
        </div>
        <section className="stradella-register-group" aria-labelledby="stradella-bass-register-heading">
          <h3 id="stradella-bass-register-heading">{t("ui.registerBassGroup")}</h3>
          <label>
            {t("ui.registerStartingOctave")}
            <select aria-label={t("ui.bassCounterbassStartingOctave")} value={stradellaBassRegisterOctave} onChange={(event) => setStradellaBassRegisterOctave(Number(event.target.value))}>
              {[1, 2, 3, 4].map((octave) => <option key={octave} value={octave}>{t("ui.octave")} {octave}</option>)}
            </select>
          </label>
          <SegmentedChoice label={<>{t("ui.registerGrouping")} <HelpTip text={t("ui.registerGroupingHelp")} /></>} ariaLabel={t("ui.bassCounterbassGrouping")} value={stradellaBassRegisterGrouping} onChange={setStradellaBassRegisterGrouping} options={[{ value: "C-B", label: "C–B" }, { value: "F-E", label: "F–E" }]} />
          <p className="stradella-register-range">{t("ui.registerConfiguredRange")}: {formatRegisterRange(stradellaRegisterModel.bass)}</p>
        </section>
        <section className="stradella-register-group" aria-labelledby="stradella-chord-register-heading">
          <h3 id="stradella-chord-register-heading">{t("ui.registerChordGroup")}</h3>
          <label>
            {t("ui.registerStartingOctave")}
            <select aria-label={t("ui.presetChordStartingOctave")} value={stradellaChordRegisterOctave} onChange={(event) => setStradellaChordRegisterOctave(Number(event.target.value))}>
              {[2, 3, 4, 5].map((octave) => <option key={octave} value={octave}>{t("ui.octave")} {octave}</option>)}
            </select>
          </label>
          <SegmentedChoice label={<>{t("ui.registerGrouping")} <HelpTip text={t("ui.registerGroupingHelp")} /></>} ariaLabel={t("ui.presetChordGrouping")} value={stradellaChordRegisterGrouping} onChange={setStradellaChordRegisterGrouping} options={[{ value: "C-B", label: "C–B" }, { value: "F-E", label: "F–E" }]} />
          <p className="stradella-register-range">{t("ui.registerConfiguredRange")}: {formatRegisterRange(stradellaRegisterModel.chord)}</p>
        </section>
      </div>
                    </div>
                  )}
    </>
  );
}
