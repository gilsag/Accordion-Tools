import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { ChordDisplayStyle } from "../../tools/chordDisplay";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type HarmonySectionModel = Pick<AppControllerModel["settings"],
  "chordDisplayStyle" | "harmonyAvailableCounts" | "harmonyColorByFamily" | "harmonyDiameter" |
  "harmonyFontSize" | "harmonyPlaybackStyle" | "harmonyRingVisibility" |
  "harmonyShowEnharmonics" | "harmonyShowExplanation" | "harmonyShowLegend" |
  "harmonyShowNoteRing" | "harmonyShowSeparators" | "harmonyShowToneTooltips" |
  "harmonyVoicingStyle" | "setChordDisplayStyle" | "setHarmonyColorByFamily" |
  "setHarmonyDiameter" | "setHarmonyFontSize" | "setHarmonyPlaybackStyle" |
  "setHarmonyRingVisibility" | "setHarmonyShowEnharmonics" | "setHarmonyShowExplanation" |
  "setHarmonyShowLegend" | "setHarmonyShowNoteRing" | "setHarmonyShowSeparators" |
  "setHarmonyShowToneTooltips" | "setHarmonyVoicingStyle" | "t">;

/** Harmony workspace: circle size, voicing and sound. */
export default function HarmonySection({ model }: { model: HarmonySectionModel }) {
  const {
    chordDisplayStyle, harmonyAvailableCounts, harmonyColorByFamily, harmonyDiameter,
    harmonyFontSize, harmonyPlaybackStyle, harmonyRingVisibility, harmonyShowEnharmonics,
    harmonyShowExplanation, harmonyShowLegend, harmonyShowNoteRing, harmonyShowSeparators,
    harmonyShowToneTooltips, harmonyVoicingStyle, setChordDisplayStyle, setHarmonyColorByFamily,
    setHarmonyDiameter, setHarmonyFontSize, setHarmonyPlaybackStyle, setHarmonyRingVisibility,
    setHarmonyShowEnharmonics, setHarmonyShowExplanation, setHarmonyShowLegend,
    setHarmonyShowNoteRing, setHarmonyShowSeparators, setHarmonyShowToneTooltips,
    setHarmonyVoicingStyle, t,
  } = model;
  return (
    <>
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
          {t("ui.circleDiameter")} {harmonyDiameter}px
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
    </>
  );
}
