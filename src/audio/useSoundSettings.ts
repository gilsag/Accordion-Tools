import { useMemo, useState } from "react";
import type { SoundSource, SoundVoicePreset, SoundWaveform, SampleRegister, StradellaBassVoicing } from "../types";
import type { StradellaRegisterModel } from "../tools/stradellaChordFinder/registerModel";
import type { SoundOptions } from "../sound";

/** Owns audio preferences independently of instrument geometry and registers.
 * The opt-in La Melodiosa register adapter is applied in SoundOptions, never
 * by altering the nominal Stradella instrument model or its stored keys.
 */
export function useSoundSettings(stradellaRegisterModel: StradellaRegisterModel) {
  /* Sound tool state for synthesized button and sequence playback. */
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.2);
  const [soundSource, setSoundSource] = useState<SoundSource>("la-melodiosa");
  const [laMelodiosaTrebleRegister, setLaMelodiosaTrebleRegister] =
    useState<SampleRegister>("I");
  const [laMelodiosaBassRegister, setLaMelodiosaBassRegister] =
    useState<SampleRegister>("III");
  const [laMelodiosaFollowStradellaRegisters, setLaMelodiosaFollowStradellaRegisters] = useState(true);
  const [soundVoicePreset, setSoundVoicePreset] =
    useState<SoundVoicePreset>("soft-reed");
  const [soundWaveform, setSoundWaveform] = useState<SoundWaveform>("triangle");
  const [soundMusetteDetuneCents, setSoundMusetteDetuneCents] = useState(9);
  const [soundAttackMs, setSoundAttackMs] = useState(14);
  const [soundReleaseMs, setSoundReleaseMs] = useState(120);
  const [soundNoteDurationMs, setSoundNoteDurationMs] = useState(420);
  const [soundSequenceTempoBpm, setSoundSequenceTempoBpm] = useState(80);
  const [stradellaBassVoicing, setStradellaBassVoicing] =
    useState<StradellaBassVoicing>("single-low");
  /* Consolidated sound options passed to the Web Audio helper functions. */
  const soundOptions: SoundOptions = useMemo(() => ({
    enabled: soundEnabled,
    volume: soundVolume,
    source: soundSource,
    laMelodiosaTrebleRegister,
    laMelodiosaBassRegister,
    laMelodiosaFollowStradellaRegisters,
    stradellaRegisterModel,
    voicePreset: soundVoicePreset,
    waveform: soundWaveform,
    musetteDetuneCents: soundMusetteDetuneCents,
    attackMs: soundAttackMs,
    releaseMs: soundReleaseMs,
    noteDurationMs: soundNoteDurationMs,
    sequenceTempoBpm: soundSequenceTempoBpm,
    stradellaBassVoicing,
  }), [
    soundEnabled, soundVolume, soundSource, laMelodiosaTrebleRegister, laMelodiosaBassRegister,
    laMelodiosaFollowStradellaRegisters, stradellaRegisterModel, soundVoicePreset, soundWaveform, soundMusetteDetuneCents,
    soundAttackMs, soundReleaseMs, soundNoteDurationMs, soundSequenceTempoBpm, stradellaBassVoicing,
  ]);

  return { soundEnabled, setSoundEnabled, soundVolume, setSoundVolume, soundSource, setSoundSource, laMelodiosaTrebleRegister, setLaMelodiosaTrebleRegister, laMelodiosaBassRegister, setLaMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, setLaMelodiosaFollowStradellaRegisters, soundVoicePreset, setSoundVoicePreset, soundWaveform, setSoundWaveform, soundMusetteDetuneCents, setSoundMusetteDetuneCents, soundAttackMs, setSoundAttackMs, soundReleaseMs, setSoundReleaseMs, soundNoteDurationMs, setSoundNoteDurationMs, soundSequenceTempoBpm, setSoundSequenceTempoBpm, stradellaBassVoicing, setStradellaBassVoicing, soundOptions };
}
