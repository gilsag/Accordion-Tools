import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { SampleRegister, SoundVoicePreset, SoundWaveform, StradellaBassVoicing } from "../../types";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type SoundSectionModel = Pick<AppControllerModel["settings"],
  "laMelodiosaBassRegister" | "laMelodiosaFollowStradellaRegisters" |
  "laMelodiosaTrebleRegister" | "setLaMelodiosaBassRegister" |
  "setLaMelodiosaFollowStradellaRegisters" | "setLaMelodiosaTrebleRegister" |
  "setSoundArticulation" | "setSoundAttackMs" | "setSoundMusetteDetuneCents" |
  "setSoundNoteDurationMs" | "setSoundReleaseMs" | "setSoundSequenceTempoBpm" |
  "setSoundSource" | "setSoundVoicePreset" | "setSoundVolume" | "setSoundWaveform" |
  "setStradellaBassVoicing" | "side" | "soundArticulation" | "soundAttackMs" |
  "soundMusetteDetuneCents" | "soundNoteDurationMs" | "soundReleaseMs" |
  "soundSequenceTempoBpm" | "soundSource" | "soundVoicePreset" | "soundVolume" |
  "soundWaveform" | "stradellaBassVoicing" | "t" | "workspaceMode">;

/** Sound: source, registers, Stradella voicing and note length. */
export default function SoundSection({ model }: { model: SoundSectionModel }) {
  const {
    laMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, laMelodiosaTrebleRegister,
    setLaMelodiosaBassRegister, setLaMelodiosaFollowStradellaRegisters,
    setLaMelodiosaTrebleRegister, setSoundArticulation, setSoundAttackMs,
    setSoundMusetteDetuneCents, setSoundNoteDurationMs, setSoundReleaseMs,
    setSoundSequenceTempoBpm, setSoundSource, setSoundVoicePreset, setSoundVolume,
    setSoundWaveform, setStradellaBassVoicing, side, soundArticulation, soundAttackMs,
    soundMusetteDetuneCents, soundNoteDurationMs, soundReleaseMs, soundSequenceTempoBpm,
    soundSource, soundVoicePreset, soundVolume, soundWaveform, stradellaBassVoicing, t,
    workspaceMode,
  } = model;
  return (
    <>
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
          {t("ui.reedDetune")} {soundMusetteDetuneCents} cents
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
        {t("ui.volume")} {Math.round(soundVolume * 100)}%
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
        {t("ui.attack")} {soundAttackMs} ms
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
        {t("ui.release")} {soundReleaseMs} ms
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
        {t("ui.noteDuration")} {soundNoteDurationMs} ms
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

      <label title={t("ui.noteArticulationHint")}>
        {t("ui.noteArticulation")}: {Math.round(soundArticulation * 100)}%
        <input
          type="range"
          min={30}
          max={100}
          step={5}
          value={Math.round(soundArticulation * 100)}
          onChange={(event) =>
            setSoundArticulation(Number(event.target.value) / 100)
          }
        />
      </label>

      <label>
        {t("ui.sequenceTempo")} {soundSequenceTempoBpm} BPM
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
    </>
  );
}
