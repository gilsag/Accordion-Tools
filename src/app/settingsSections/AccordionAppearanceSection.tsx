import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { AccidentalStyle, ColorTheme, FontFamily } from "../../types";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type AccordionAppearanceSectionModel = Pick<AppControllerModel["settings"],
  "accidentalStyle" | "buttonSize" | "buttonStrokeWidth" | "chordFillStrength" |
  "colorTheme" | "diagramScale" | "diagramVerticalSpacing" | "interfaceDensity" |
  "isPianoTreble" | "labelFont" | "labelFontSize" | "pianoBlackKeyHeightScale" |
  "pianoBlackKeyWidthScale" | "pianoKeyHeightScale" | "pianoKeyWidthScale" |
  "referenceStrokeWidth" | "setAccidentalStyle" | "setButtonSize" | "setButtonStrokeWidth" |
  "setChordFillStrength" | "setColorTheme" | "setDiagramScale" | "setDiagramVerticalSpacing" |
  "setInterfaceDensity" | "setLabelFont" | "setLabelFontSize" | "setPianoBlackKeyHeightScale" |
  "setPianoBlackKeyWidthScale" | "setPianoKeyHeightScale" | "setPianoKeyWidthScale" |
  "setReferenceStrokeWidth" | "setShowBellowsGuide" | "setShowButtonLabels" |
  "setShowStatusBar" | "setShowStradellaRowLabels" | "setShowTrebleOctaves" | "setSpacing" |
  "setTrebleAngle" | "showBellowsGuide" | "showButtonLabels" | "showStatusBar" |
  "showStradellaRowLabels" | "showTrebleOctaves" | "side" | "spacing" | "t" | "trebleAngle" |
  "trebleLayout">;

/** Appearance of the accordion diagrams: labels, sizes, colors and layout. */
export default function AccordionAppearanceSection({ model }: { model: AccordionAppearanceSectionModel }) {
  const {
    accidentalStyle, buttonSize, buttonStrokeWidth, chordFillStrength, colorTheme, diagramScale,
    diagramVerticalSpacing, interfaceDensity, isPianoTreble, labelFont, labelFontSize,
    pianoBlackKeyHeightScale, pianoBlackKeyWidthScale, pianoKeyHeightScale, pianoKeyWidthScale,
    referenceStrokeWidth, setAccidentalStyle, setButtonSize, setButtonStrokeWidth,
    setChordFillStrength, setColorTheme, setDiagramScale, setDiagramVerticalSpacing,
    setInterfaceDensity, setLabelFont, setLabelFontSize, setPianoBlackKeyHeightScale,
    setPianoBlackKeyWidthScale, setPianoKeyHeightScale, setPianoKeyWidthScale,
    setReferenceStrokeWidth, setShowBellowsGuide, setShowButtonLabels, setShowStatusBar,
    setShowStradellaRowLabels, setShowTrebleOctaves, setSpacing, setTrebleAngle, showBellowsGuide,
    showButtonLabels, showStatusBar, showStradellaRowLabels, showTrebleOctaves, side, spacing, t,
    trebleAngle, trebleLayout,
  } = model;
  return (
    <>
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

      <label className="checkbox-label">
        <input type="checkbox" checked={showButtonLabels} onChange={(event) => setShowButtonLabels(event.target.checked)} />
        <span className="label-line">{t("ui.showButtonLabels")}</span>
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={showBellowsGuide} onChange={(event) => setShowBellowsGuide(event.target.checked)} />
        <span className="label-line">{t("ui.showBellowsGuide")}</span>
      </label>
      {side === "stradella" && (
        <label className="checkbox-label">
          <input type="checkbox" checked={showStradellaRowLabels} onChange={(event) => setShowStradellaRowLabels(event.target.checked)} />
          <span className="label-line">{t("ui.showStradellaRowLabels")}</span>
        </label>
      )}
      {side === "treble" && (
        <label className="checkbox-label">
          <input type="checkbox" checked={showTrebleOctaves} onChange={(event) => setShowTrebleOctaves(event.target.checked)} />
          <span className="label-line">{t("ui.showOctaveNumbers")}</span>
        </label>
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
          {t("ui.trebleAngle")} {trebleAngle}°
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
    </>
  );
}
