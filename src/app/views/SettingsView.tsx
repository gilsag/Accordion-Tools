
import { pianoRangeStatusLabel } from "../../i18n/diagramLabels";
import { type ChordDisplayStyle } from "../../tools/chordDisplay";
import { SUPPORTED_LANGUAGES, translateKnownLabel, type InterfaceLanguagePreference } from "../../i18n/catalog";
import type { AccidentalMode, AccidentalStyle, BassCount, ChordLabelMode, ColorTheme, FontFamily, NotationMode, PianoTrebleRange, SoundVoicePreset, SoundWaveform, SampleRegister, StradellaBassVoicing, TrebleLayout, TrebleSizePreset, TitleMode } from "../../types";
import { formatRegisterRange } from "../../tools/stradellaChordFinder/registerModel";
import { AboutPanel } from "../../components/settings/AboutPanel";
import { HelpTip } from "../../components/ui/HelpTip";
import { BinaryChoiceButton } from "../../components/ui/BinaryChoiceButton";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { AppControllerModel } from "../useAppController";

/** View-only component: all state and commands originate in the controller. */
export function SettingsView({model}:{model:AppControllerModel["settings"]}) {
  const {
    BASS_OPTIONS, PIANO_TREBLE_RANGE_OPTIONS, TREBLE_SIZE_OPTIONS, accidental, accidentalStyle, activeSettingsSection,
    basses, buttonSize, buttonStrokeWidth, changeLanguage, changePianoTrebleRange, changeTrebleLayout,
    changeTrebleSize, chordDisplayStyle, chordFillStrength, chordLabelMode, colorTheme, customTitle,
    diagramScale, diagramVerticalSpacing, downloadCurrentSettings, harmonyAvailableCounts, harmonyColorByFamily, harmonyDiameter,
    harmonyFontSize, harmonyPlaybackStyle, harmonyRingVisibility, harmonyShowEnharmonics, harmonyShowExplanation, harmonyShowLegend,
    harmonyShowNoteRing, harmonyShowSeparators, harmonyShowToneTooltips, harmonyVoicingStyle, importSettingsFile, interfaceDensity,
    isPianoTreble, laMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, laMelodiosaTrebleRegister, labelFont, labelFontSize,
    language, languagePreference, musicNotationBarsPerLine, musicNotationChordFontSize, musicNotationIncludeDescription, musicNotationIncludeSummary,
    musicNotationIncludeTitle, musicNotationScale, musicNotationStaffSeparator, musicNotationStaffWidth, musicNotationUseBarsPerLine, notation,
    pianoBlackKeyHeightScale, pianoBlackKeyWidthScale, pianoKeyHeightScale, pianoKeyWidthScale, pianoTrebleRange, referenceStrokeWidth,
    setAccidental, setAccidentalStyle, setBasses, setButtonSize, setButtonStrokeWidth, setChordDisplayStyle,
    setChordFillStrength, setChordLabelMode, setColorTheme, setCustomTitle, setDiagramScale, setDiagramVerticalSpacing,
    setHarmonyColorByFamily, setHarmonyDiameter, setHarmonyFontSize, setHarmonyPlaybackStyle, setHarmonyRingVisibility, setHarmonyShowEnharmonics,
    setHarmonyShowExplanation, setHarmonyShowLegend, setHarmonyShowNoteRing, setHarmonyShowSeparators, setHarmonyShowToneTooltips, setHarmonyVoicingStyle,
    setInterfaceDensity, setLaMelodiosaBassRegister, setLaMelodiosaFollowStradellaRegisters, setLaMelodiosaTrebleRegister, setLabelFont, setLabelFontSize,
    setMusicNotationBarsPerLine, setMusicNotationChordFontSize, setMusicNotationIncludeDescription, setMusicNotationIncludeSummary, setMusicNotationIncludeTitle, setMusicNotationScale,
    setMusicNotationStaffSeparator, setMusicNotationStaffWidth, setMusicNotationUseBarsPerLine, setNotation, setPianoBlackKeyHeightScale, setPianoBlackKeyWidthScale,
    setPianoKeyHeightScale, setPianoKeyWidthScale, setReferenceStrokeWidth, setShowBellowsGuide, setShowButtonLabels, setShowStatusBar,
    setShowStradellaRowLabels, setShowTrebleOctaves, setSoundAttackMs, setSoundMusetteDetuneCents, setSoundNoteDurationMs, setSoundReleaseMs,
    setSoundSequenceTempoBpm, setSoundSource, setSoundVoicePreset, setSoundVolume, setSoundWaveform, setSpacing,
    setStradellaBassRegisterGrouping, setStradellaBassRegisterOctave, setStradellaBassVoicing, setStradellaChordRegisterGrouping, setStradellaChordRegisterOctave, setTitleFont,
    setTitleMode, setTitleSize, setTrebleAngle, setTrebleRows, showBellowsGuide, showButtonLabels,
    showStatusBar, showStradellaRowLabels, showTrebleOctaves, side, soundAttackMs, soundMusetteDetuneCents,
    soundNoteDurationMs, soundReleaseMs, soundSequenceTempoBpm, soundSource, soundVoicePreset, soundVolume,
    soundWaveform, spacing, stradellaBassRegisterGrouping, stradellaBassRegisterOctave, stradellaBassVoicing, stradellaChordRegisterGrouping,
    stradellaChordRegisterOctave, stradellaRegisterModel, t, titleFont, titleMode, titleSize,
    toggleSettingsSection, trebleAngle, trebleLayout, trebleRows, trebleSize, workspaceMode,
  } = model;
  return (
    <>

              <section className="control-section">
                <div className="section-content">
                  <label>
                    {t("settings.language")}
                    <select value={languagePreference} onChange={(event) => changeLanguage(event.target.value as InterfaceLanguagePreference)}>
                      <option value="auto">{t("settings.languageAuto")}</option>
                      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("instrument")}
                              >
                                {t("settings.instrument")}{" "}
                                <span>{activeSettingsSection === "instrument" ? "−" : "+"}</span>
                              </button>

                              {activeSettingsSection === "instrument" && (
                                <div className="section-content">
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
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("notation")}
                              >
                                {t("settings.notation")}{" "}
                                <span>
                                  {activeSettingsSection === "notation" ? "−" : "+"}
                                </span>
                              </button>

                              {activeSettingsSection === "notation" && (
                                <div className="section-content">
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
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("musicNotation")}
                              >
                                {t("settings.musicNotation")}{" "}
                                <span>
                                  {activeSettingsSection === "musicNotation" ? "−" : "+"}
                                </span>
                              </button>

                              {activeSettingsSection === "musicNotation" && (
                                <div className="section-content">
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
                                    {t("ui.barsPerLine")}: {musicNotationBarsPerLine}
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
                                    {t("ui.chordTextSize")}: {musicNotationChordFontSize}px
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
                                    {t("ui.notationScale")}: {musicNotationScale}%
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
                                    {t("ui.staffWidth")}: {musicNotationStaffWidth}px
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
                                    {t("ui.staffSpacing")}: {musicNotationStaffSeparator}
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
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("appearance")}
                              >
                                {t("settings.appearance")}{" "}
                                <span>
                                  {activeSettingsSection === "appearance" ? "−" : "+"}
                                </span>
                              </button>

                              {activeSettingsSection === "appearance" && (
                                <div className="section-content">
                                  <SegmentedChoice label={<>{t("ui.interfaceDensity")} <HelpTip text={t("ui.interfaceDensityHelp")} /></>} value={interfaceDensity} onChange={setInterfaceDensity} options={[{ value: "compact", label: t("ui.compact") }, { value: "comfortable", label: t("ui.comfortable") }]} />

                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={showStatusBar}
                                      onChange={(event) =>
                                        setShowStatusBar(event.target.checked)
                                      }
                                    />
                                    <span className="label-line">
                                      {t("ui.statusBar")}{" "}
                                      <HelpTip text={t("ui.statusBarHelp")} />
                                    </span>
                                  </label>

                                  <label>
                                    <span className="label-line">
                                      {t("ui.diagramScale")}: {diagramScale}%{" "}
                                      <HelpTip text={t("ui.diagramScaleHelp")} />
                                    </span>
                                    <input
                                      type="range"
                                      min={70}
                                      max={140}
                                      step={5}
                                      value={diagramScale}
                                      onChange={(event) =>
                                        setDiagramScale(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  <label>
                                    {t("ui.colorTheme")}
                                    <select
                                      value={colorTheme}
                                      onChange={(event) =>
                                        setColorTheme(event.target.value as ColorTheme)
                                      }
                                    >
                                      <option value="default">{t("ui.defaultBlue")}</option>
                                      <option value="classic">{t("ui.classicInk")}</option>
                                      <option value="pastel">{t("ui.pastel")}</option>
                                      <option value="warm">{t("ui.warmCream")}</option>
                                      <option value="contrast">{t("ui.highContrast")}</option>
                                      <option value="print">{t("ui.printGrayscale")}</option>
                                    </select>
                                  </label>

                                  <label>
                                    {t("ui.accidentalButtons")}
                                    <select
                                      value={accidentalStyle}
                                      onChange={(event) =>
                                        setAccidentalStyle(
                                          event.target.value as AccidentalStyle,
                                        )
                                      }
                                    >
                                      <option value="grey">{t("ui.grey")}</option>
                                      <option value="dark">{t("ui.dark")}</option>
                                      <option value="outline">{t("ui.outlineOnly")}</option>
                                      <option value="theme">{t("ui.themeColor")}</option>
                                    </select>
                                  </label>

                                  <label>
                                    {t("ui.labelFont")}
                                    <select
                                      value={labelFont}
                                      onChange={(event) =>
                                        setLabelFont(event.target.value as FontFamily)
                                      }
                                    >
                                      <option value="system">{t("ui.system")}</option>
                                      <option value="serif">{t("ui.serif")}</option>
                                      <option value="mono">{t("ui.mono")}</option>
                                      <option value="rounded">{t("ui.rounded")}</option>
                                    </select>
                                  </label>

                                  <label>
                                    {t("ui.labelFontSize")}: {labelFontSize}px
                                    <input
                                      type="range"
                                      min={8}
                                      max={24}
                                      value={labelFontSize}
                                      onChange={(event) =>
                                        setLabelFontSize(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    className={`small-button appearance-label-toggle ${showButtonLabels ? "active-tool" : ""}`}
                                    onClick={() => setShowButtonLabels((current) => !current)}
                                  >
                                    {showButtonLabels
                                      ? t("ui.hideButtonLabels")
                                      : t("ui.showButtonLabels")}
                                  </button>

                                  <button
                                    type="button"
                                    className={`small-button appearance-label-toggle ${showBellowsGuide ? "active-tool" : ""}`}
                                    onClick={() => setShowBellowsGuide((current) => !current)}
                                  >
                                    {showBellowsGuide
                                      ? t("ui.hideBellowsGuide")
                                      : t("ui.showBellowsGuide")}
                                  </button>

                                  {side === "stradella" && (
                                    <button
                                      type="button"
                                      className={`small-button appearance-label-toggle ${showStradellaRowLabels ? "active-tool" : ""}`}
                                      aria-pressed={showStradellaRowLabels}
                                      onClick={() => setShowStradellaRowLabels((value) => !value)}
                                    >
                                      {showStradellaRowLabels ? t("ui.hideStradellaRowLabels") : t("ui.showStradellaRowLabels")}
                                    </button>
                                  )}

                                  {side === "treble" && (
                                    <BinaryChoiceButton label={t("ui.octaveNumbers")} enabled={showTrebleOctaves} onToggle={() => setShowTrebleOctaves((value) => !value)} whenEnabled={t("ui.hideOctaveNumbers")} whenDisabled={t("ui.showOctaveNumbers")} />
                                  )}

                                  <label>
                                    {t("ui.buttonSize")}: {buttonSize}
                                    <input
                                      type="range"
                                      min={12}
                                      max={28}
                                      value={buttonSize}
                                      onChange={(event) =>
                                        setButtonSize(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  <label>
                                    {t("ui.spacing")}: {spacing.toFixed(2)}
                                    <input
                                      type="range"
                                      min={1.7}
                                      max={3.2}
                                      step={0.05}
                                      value={spacing}
                                      onChange={(event) =>
                                        setSpacing(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  <label>
                                    <span className="label-line">
                                      {t("ui.verticalSpacing")}: {diagramVerticalSpacing}px{" "}
                                      <HelpTip text={t("ui.diagramVerticalHelp")} />
                                    </span>
                                    <input
                                      type="range"
                                      min={0}
                                      max={80}
                                      step={2}
                                      value={diagramVerticalSpacing}
                                      onChange={(event) =>
                                        setDiagramVerticalSpacing(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  <label>
                                    {t("ui.buttonLine")}: {buttonStrokeWidth.toFixed(1)}
                                    <input
                                      type="range"
                                      min={1}
                                      max={6}
                                      step={0.25}
                                      value={buttonStrokeWidth}
                                      onChange={(event) =>
                                        setButtonStrokeWidth(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  <label>
                                    {t("ui.referenceLine")}: {referenceStrokeWidth.toFixed(1)}
                                    <input
                                      type="range"
                                      min={2}
                                      max={10}
                                      step={0.25}
                                      value={referenceStrokeWidth}
                                      onChange={(event) =>
                                        setReferenceStrokeWidth(Number(event.target.value))
                                      }
                                    />
                                  </label>

                                  {isPianoTreble && (
                                    <>
                                      <label>
                                        <span className="label-line">
                                          {t("ui.pianoKeyWidth")}: {pianoKeyWidthScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.whiteKeyWidthHelp")} />
                                        </span>
                                        <input
                                          type="range"
                                          min={0.75}
                                          max={1.45}
                                          step={0.05}
                                          value={pianoKeyWidthScale}
                                          onChange={(event) =>
                                            setPianoKeyWidthScale(Number(event.target.value))
                                          }
                                        />
                                      </label>

                                      <label>
                                        <span className="label-line">
                                          {t("ui.pianoKeyHeight")}: {pianoKeyHeightScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.pianoKeyHeightHelp")} />
                                        </span>
                                        <input
                                          type="range"
                                          min={0.75}
                                          max={1.8}
                                          step={0.05}
                                          value={pianoKeyHeightScale}
                                          onChange={(event) =>
                                            setPianoKeyHeightScale(Number(event.target.value))
                                          }
                                        />
                                      </label>

                                      <label>
                                        <span className="label-line">
                                          {t("ui.blackKeyWidth")}:{" "}
                                          {pianoBlackKeyWidthScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.blackKeyWidthHelp")} />
                                        </span>
                                        <input
                                          type="range"
                                          min={0.75}
                                          max={1.35}
                                          step={0.05}
                                          value={pianoBlackKeyWidthScale}
                                          onChange={(event) =>
                                            setPianoBlackKeyWidthScale(
                                              Number(event.target.value),
                                            )
                                          }
                                        />
                                      </label>

                                      <label>
                                        <span className="label-line">
                                          {t("ui.blackKeyHeight")}:{" "}
                                          {pianoBlackKeyHeightScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.blackKeyHeightHelp")} />
                                        </span>
                                        <input
                                          type="range"
                                          min={0.75}
                                          max={1.5}
                                          step={0.05}
                                          value={pianoBlackKeyHeightScale}
                                          onChange={(event) =>
                                            setPianoBlackKeyHeightScale(
                                              Number(event.target.value),
                                            )
                                          }
                                        />
                                      </label>
                                    </>
                                  )}

                                  {side === "stradella" && (
                                    <label>
                                      {t("ui.chordFill")}: {chordFillStrength}%
                                      <input
                                        type="range"
                                        min={20}
                                        max={100}
                                        step={5}
                                        value={chordFillStrength}
                                        onChange={(event) =>
                                          setChordFillStrength(Number(event.target.value))
                                        }
                                      />
                                    </label>
                                  )}

                                  {side === "treble" && trebleLayout !== "piano" && (
                                    <label>
                                      {t("ui.trebleAngle")}: {trebleAngle}°
                                      <input
                                        type="range"
                                        min={-35}
                                        max={35}
                                        value={trebleAngle}
                                        onChange={(event) =>
                                          setTrebleAngle(Number(event.target.value))
                                        }
                                      />
                                    </label>
                                  )}
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "harmony" && (
              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("appearance")}
                >
                  {t("settings.appearance")} <span>{activeSettingsSection === "appearance" ? "−" : "+"}</span>
                </button>
                {activeSettingsSection === "appearance" && (
                  <div className="section-content">
                    <SegmentedChoice label={<>{t("ui.interfaceDensity")} <HelpTip text={t("ui.interfaceDensityHelp")} /></>} value={interfaceDensity} onChange={setInterfaceDensity} options={[{ value: "compact", label: t("ui.compact") }, { value: "comfortable", label: t("ui.comfortable") }]} />
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showStatusBar} onChange={(event) => setShowStatusBar(event.target.checked)} />
                      <span>{t("ui.showStatusBar")}</span>
                    </label>
                    <label>
                      {t("ui.colorTheme")}
                      <select value={colorTheme} onChange={(event) => setColorTheme(event.target.value as ColorTheme)}>
                        <option value="default">{t("ui.defaultBlue")}</option>
                        <option value="classic">{t("ui.classicInk")}</option>
                        <option value="pastel">{t("ui.pastel")}</option>
                        <option value="warm">{t("ui.warmCream")}</option>
                        <option value="contrast">{t("ui.highContrast")}</option>
                        <option value="print">{t("ui.printGrayscale")}</option>
                      </select>
                    </label>
                  </div>
                )}
              </section>
            )}

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("sound")}
                >
                  {t("settings.sound")}{" "}
                  <span>{activeSettingsSection === "sound" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "sound" && (
                  <div className="section-content">
                    <SegmentedChoice label={<>{t("ui.soundSource")} <HelpTip text={`${t("ui.soundSourceHint")} ${t("ui.melodiosaCredit")}`} /></>} ariaLabel={t("ui.soundSource")} value={soundSource} onChange={setSoundSource} options={[{ value: "la-melodiosa", label: "La Melodiosa" }, { value: "synth", label: t("ui.synthesizer") }]} />

                    {soundSource === "la-melodiosa" && (
                      <>
                        {workspaceMode === "accordion" && side === "treble" && (
                          <label>
                            {t("ui.trebleRegister")}
                            <select
                              value={laMelodiosaTrebleRegister}
                              onChange={(event) =>
                                setLaMelodiosaTrebleRegister(
                                  event.target.value as SampleRegister,
                                )
                              }
                            >
                              <option value="I">{t("ui.iUpperRegister")}</option>
                              <option value="II">{t("ui.iiLowerRegister")}</option>
                              <option value="III">{t("ui.iiiBothRegisters")}</option>
                            </select>
                          </label>
                        )}
                        {(workspaceMode === "harmony" || side === "stradella") && (
                          <label>
                            {t("ui.bassRegister")}
                            <select
                              value={laMelodiosaBassRegister}
                              onChange={(event) =>
                                setLaMelodiosaBassRegister(
                                  event.target.value as SampleRegister,
                                )
                              }
                            >
                              <option value="I">{t("ui.iUpperRegister")}</option>
                              <option value="II">{t("ui.iiLowerRegister")}</option>
                              <option value="III">{t("ui.iiiBothRegisters")}</option>
                            </select>
                          </label>
                        )}
                        {(workspaceMode === "accordion" && side === "stradella") && (
                          <>
                            <SegmentedChoice label={<>{t("ui.samplePitchMapping")} <HelpTip text={laMelodiosaFollowStradellaRegisters ? t("ui.melodiosaConfigured") : t("ui.melodiosaOriginal")} /></>} ariaLabel={t("ui.samplePitchMapping")} value={laMelodiosaFollowStradellaRegisters ? "configured" : "original"} onChange={(next) => setLaMelodiosaFollowStradellaRegisters(next === "configured")} options={[{ value: "configured", label: t("ui.configuredRegisters") }, { value: "original", label: t("ui.originalMapping") }]} />
                            <p className="hint sound-configuration-summary">
                              {laMelodiosaFollowStradellaRegisters
                                ? t("ui.melodiosaConfiguredShort")
                                : t("ui.melodiosaOriginalShort")}
                            </p>
                          </>
                        )}
                      </>
                    )}

                    {soundSource === "synth" && (
                      <>
                        <label>
                      {t("ui.voice")}
                      <select
                        value={soundVoicePreset}
                        onChange={(event) =>
                          setSoundVoicePreset(
                            event.target.value as SoundVoicePreset,
                          )
                        }
                      >
                        <option value="soft-reed">{t("ui.softReed")}</option>
                        <option value="bright-reed">{t("ui.brightReed")}</option>
                        <option value="musette">{t("ui.musetteDetunedReeds")}</option>
                        <option value="organ">{t("ui.organLike")}</option>
                        <option value="bass-reed">{t("ui.bassReed")}</option>
                        <option value="single">{t("ui.singleOscillator")}</option>
                      </select>
                    </label>

                    {(workspaceMode === "harmony" || side === "stradella") && (
                      <>
                        <label>
                          <span className="label-line">{t("ui.stradellaBassVoicing")} <HelpTip text={t("ui.soundBassVoicingHelp")} /></span>
                          <select
                            value={stradellaBassVoicing}
                            onChange={(event) =>
                              setStradellaBassVoicing(
                                event.target.value as StradellaBassVoicing,
                              )
                            }
                          >
                            <option value="single-low">{t("ui.singleLowReed")}</option>
                            <option value="low-and-middle">
                              {t("ui.lowMiddleReeds")}
                            </option>
                            <option value="single-middle">
                              {t("ui.singleMiddleReed")}
                            </option>
                          </select>
                        </label>

                      </>
                    )}

                    {soundVoicePreset === "single" && (
                      <label>
                        {t("ui.waveform")}
                        <select
                          value={soundWaveform}
                          onChange={(event) =>
                            setSoundWaveform(
                              event.target.value as SoundWaveform,
                            )
                          }
                        >
                          <option value="sine">{t("ui.sine")}</option>
                          <option value="triangle">{t("ui.triangle")}</option>
                          <option value="sawtooth">{t("ui.sawtooth")}</option>
                          <option value="square">{t("ui.square")}</option>
                        </select>
                      </label>
                    )}

                    {soundVoicePreset === "musette" && (
                      <label>
                        {t("ui.reedDetune")}: {soundMusetteDetuneCents} cents
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={1}
                          value={soundMusetteDetuneCents}
                          onChange={(event) =>
                            setSoundMusetteDetuneCents(
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    )}
                      </>
                    )}

                    <label>
                      {t("ui.volume")}: {Math.round(soundVolume * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={soundVolume}
                        onChange={(event) =>
                          setSoundVolume(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      {t("ui.attack")}: {soundAttackMs} ms
                      <input
                        type="range"
                        min={1}
                        max={120}
                        step={1}
                        value={soundAttackMs}
                        onChange={(event) =>
                          setSoundAttackMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      {t("ui.release")}: {soundReleaseMs} ms
                      <input
                        type="range"
                        min={20}
                        max={500}
                        step={10}
                        value={soundReleaseMs}
                        onChange={(event) =>
                          setSoundReleaseMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      {t("ui.noteDuration")}: {soundNoteDurationMs} ms
                      <input
                        type="range"
                        min={80}
                        max={1500}
                        step={20}
                        value={soundNoteDurationMs}
                        onChange={(event) =>
                          setSoundNoteDurationMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      {t("ui.sequenceTempo")}: {soundSequenceTempoBpm} BPM
                      <input
                        type="range"
                        min={40}
                        max={200}
                        step={5}
                        value={soundSequenceTempoBpm}
                        onChange={(event) =>
                          setSoundSequenceTempoBpm(Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                )}
              </section>

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("title")}
                              >
                                {t("settings.title")}{" "}
                                <span>{activeSettingsSection === "title" ? "−" : "+"}</span>
                              </button>

                              {activeSettingsSection === "title" && (
                                <div className="section-content">
                                  <label>
                                    {t("ui.title")}
                                    <select
                                      value={titleMode}
                                      onChange={(event) =>
                                        setTitleMode(event.target.value as TitleMode)
                                      }
                                    >
                                      <option value="auto">{t("ui.autoInstrumentLayout")}</option>
                                      <option value="contextual">{t("ui.contextualToolAndSelection")}</option>
                                      <option value="custom">{t("ui.custom")}</option>
                                      <option value="none">{t("common.none")}</option>
                                    </select>
                                  </label>

                                  {titleMode === "custom" && (
                                    <label>
                                      {t("ui.customTitle")}
                                      <input
                                        value={customTitle}
                                        onChange={(event) =>
                                          setCustomTitle(event.target.value)
                                        }
                                      />
                                    </label>
                                  )}

                                  {titleMode !== "none" && (
                                    <>
                                      <label>
                                        {t("ui.titleFont")}
                                        <select
                                          value={titleFont}
                                          onChange={(event) =>
                                            setTitleFont(event.target.value as FontFamily)
                                          }
                                        >
                                          <option value="system">{t("ui.system")}</option>
                                          <option value="serif">{t("ui.serif")}</option>
                                          <option value="mono">{t("ui.mono")}</option>
                                          <option value="rounded">{t("ui.rounded")}</option>
                                        </select>
                                      </label>

                                      <label>
                                        {t("ui.titleSize")}: {titleSize}px
                                        <input
                                          type="range"
                                          min={14}
                                          max={42}
                                          value={titleSize}
                                          onChange={(event) =>
                                            setTitleSize(Number(event.target.value))
                                          }
                                        />
                                      </label>
                                    </>
                                  )}
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "harmony" && (
                <>
                  <p className="hint" style={{ marginBottom: 10 }}>
                    {t("settings.harmonyIntro")}
                  </p>
                  <section className="control-section">
                    <button
                      className="section-title"
                      onClick={() => toggleSettingsSection("harmony")}
                    >
                      {t("nav.harmony")} <span>{activeSettingsSection === "harmony" ? "−" : "+"}</span>
                    </button>
                    {activeSettingsSection === "harmony" && (
                      <div className="section-content">
                        <fieldset className="tool-fieldset">
                          <legend>{t("settings.diagram")}</legend>
                          <label>
                            {t("settings.chordStyle")}
                            <select value={chordDisplayStyle} onChange={(event) => setChordDisplayStyle(event.target.value as ChordDisplayStyle)}>
                              <option value="compact">C, Cm, Cmaj7</option>
                              <option value="letter">CM, Cm, CM7</option>
                              <option value="words">Cmaj, Cmin, Cmaj7</option>
                            </select>
                          </label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowSeparators} onChange={(event) => setHarmonyShowSeparators(event.target.checked)} /> {t("settings.segmentLines")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowLegend} onChange={(event) => setHarmonyShowLegend(event.target.checked)} /> {t("settings.showLegend")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowExplanation} onChange={(event) => setHarmonyShowExplanation(event.target.checked)} /> {t("settings.showExplanation")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowEnharmonics} onChange={(event) => setHarmonyShowEnharmonics(event.target.checked)} /> {t("settings.showEnharmonics")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowToneTooltips} onChange={(event) => setHarmonyShowToneTooltips(event.target.checked)} /> {t("settings.chordToneTooltips")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowNoteRing} onChange={(event) => setHarmonyShowNoteRing(event.target.checked)} /> {t("settings.noteRing")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyColorByFamily} onChange={(event) => setHarmonyColorByFamily(event.target.checked)} /> {t("settings.colorByFamily")}</label>

                          <div className="ring-control-block">
                            <strong>{t("settings.outerRings")}</strong>
                            {harmonyAvailableCounts.length === 0 ? (
                              <p className="hint">{t("settings.noRings")}</p>
                            ) : (
                              harmonyAvailableCounts.map((count) => (
                                <label className="check-row" key={`harmony-settings-ring-${count}`}>
                                  <input
                                    type="checkbox"
                                    checked={harmonyRingVisibility[count] ?? count !== 0}
                                    onChange={(event) => setHarmonyRingVisibility((current) => ({ ...current, [count]: event.target.checked }))}
                                  />
                                  {count === 1 ? t("ui.ringSharedSingular") : t("ui.ringShared", { count })}
                                </label>
                              ))
                            )}
                          </div>

                          <label>
                            {t("ui.circleDiameter")}: {harmonyDiameter}px
                            <input type="range" min="600" max="1400" step="20" value={harmonyDiameter} onChange={(event) => setHarmonyDiameter(Number(event.target.value))} />
                          </label>
                          <label>
                            {t("ui.maxFontSize")}: {harmonyFontSize}px
                            <input type="range" min="10" max="30" step="1" value={harmonyFontSize} onChange={(event) => setHarmonyFontSize(Number(event.target.value))} />
                          </label>
                        </fieldset>

                        <fieldset className="tool-fieldset">
                          <legend>{t("ui.playback")}</legend>
                          <SegmentedChoice label={t("ui.chordPlayback")} value={harmonyPlaybackStyle} onChange={setHarmonyPlaybackStyle} options={[{ value: "block", label: t("ui.block") }, { value: "arpeggio", label: t("ui.arpeggio") }]} />
                          <SegmentedChoice label={t("ui.relationshipPlayback")} value={harmonyVoicingStyle} onChange={setHarmonyVoicingStyle} options={[{ value: "root", label: t("ui.selectedOnly") }, { value: "smooth", label: t("ui.referenceRelated") }]} />
                          <p className="hint">{t("ui.harmonySoundHint")}</p>
                        </fieldset>
                      </div>
                    )}
                  </section>
                </>
              )}
              <AboutPanel
                isOpen={activeSettingsSection === "about"}
                onToggle={() => toggleSettingsSection("about")}
              >
                <div className="button-row">
                  <button
                    className="small-button"
                    onClick={downloadCurrentSettings}
                  >
                    {t("settings.saveJson")}
                  </button>
                  <label className="small-button file-button">
                    {t("settings.loadJson")}
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(event) => {
                        void importSettingsFile(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
                <p className="hint">
                  {t("settings.jsonHint")} <code>public/default-settings.json</code>.
                </p>
              </AboutPanel>
            </>
  );
}
