/*
  Structural registral interpretation for a Stradella chord realization.

  This is deliberately independent of the harmonic candidate search, physical
  layout coordinates, and the playback engine. A bass/counterbass button
  contributes a *separate bass register* on a typical Stradella accordion; its
  exact octave and its relation to preset-chord reeds depend on registration.

  Only playback buttons belong here: buttons highlighted purely as visual
  references (such as the optional chord-only root marker) do not sound.
*/

import type { DiagramButton } from "../../types";
import { buttonTones, isBassButton, isChordButton } from "./voicings";

export type StradellaBassRole =
  | "none"
  | "root"
  | "non-root"
  | "multiple-with-root"
  | "multiple-without-root";

/** A proposed voicing character, never a claim about exact reed octaves. */
export type StradellaInversionCharacter = "root-supported" | "potential-slash" | "indeterminate";

export type StradellaRegistralAnalysis = {
  /** A structural analysis, not a verified octave-by-octave transcription. */
  confidence: "button-structure-only";
  /** Requested harmonic root, expressed as a pitch class. */
  rootPitchClass: string | null;
  /** True when any sounding button contributes the requested root pitch class. */
  rootPitchClassPresent: boolean;
  /** True only when a PLAYED bass or counterbass button sounds the requested root. */
  rootBassSupported: boolean;
  /** True when preset chord buttons contribute the root (with or without bass). */
  rootInPresetChords: boolean;
  bassRole: StradellaBassRole;
  bassButtonCount: number;
  chordButtonCount: number;
  /** Unique pitch classes of sounded bass/counterbass buttons, in button order. */
  bassPitchClasses: string[];
  /** Unique pitch classes contributed by preset chord buttons. */
  presetChordPitchClasses: string[];
  /** Pitch classes reinforced across both button families. */
  bassChordOverlaps: string[];
  /** Only assigned when one UNIQUE bass pitch class is played. */
  emphasizedBassPitchClass: string | null;
  /** A conditional slash-chord interpretation when one non-root bass accompanies chords. */
  potentialSlashBass: string | null;
  inversionCharacter: StradellaInversionCharacter;
  /** Preset chords occupy their own reed register; no octave map is assumed. */
  hasPresetChordRegister: boolean;
};

/** Analyze played button roles without claiming a lowest acoustic reed note.
 * A single non-root bass may suggest slash character; multiple distinct bass
 * pitches cannot be assigned a unique inversion by this structural model. */
export function analyzeStradellaRegistralVoicing(
  playbackButtons: readonly DiagramButton[],
  rootPitchClass: string | null,
): StradellaRegistralAnalysis {
  const bassButtons = playbackButtons.filter(isBassButton);
  const chordButtons = playbackButtons.filter(isChordButton);
  const bassPitchClasses = [...new Set(bassButtons.flatMap(buttonTones))];
  const presetChordPitchClasses = [...new Set(chordButtons.flatMap(buttonTones))];
  const bassChordOverlaps = bassPitchClasses.filter((pitch) => presetChordPitchClasses.includes(pitch));
  const rootBassSupported = rootPitchClass !== null && bassPitchClasses.includes(rootPitchClass);
  const rootInPresetChords = rootPitchClass !== null && presetChordPitchClasses.includes(rootPitchClass);
  const rootPitchClassPresent = rootBassSupported || rootInPresetChords;
  const emphasizedBassPitchClass = bassPitchClasses.length === 1 ? bassPitchClasses[0] : null;

  let bassRole: StradellaBassRole = "none";
  if (bassButtons.length > 0 && bassPitchClasses.length === 1) {
    bassRole = rootBassSupported ? "root" : "non-root";
  } else if (bassButtons.length > 0) {
    bassRole = rootBassSupported ? "multiple-with-root" : "multiple-without-root";
  }

  const potentialSlashBass = chordButtons.length > 0 && emphasizedBassPitchClass !== null &&
    !rootBassSupported && rootPitchClass !== null && rootPitchClassPresent
    ? emphasizedBassPitchClass
    : null;

  const inversionCharacter: StradellaInversionCharacter =
    rootBassSupported && bassPitchClasses.length === 1 && chordButtons.length > 0
      ? "root-supported"
      : potentialSlashBass !== null
        ? "potential-slash"
        : "indeterminate";

  return {
    confidence: "button-structure-only",
    rootPitchClass,
    rootPitchClassPresent,
    rootBassSupported,
    rootInPresetChords,
    bassRole,
    bassButtonCount: bassButtons.length,
    chordButtonCount: chordButtons.length,
    bassPitchClasses,
    presetChordPitchClasses,
    bassChordOverlaps,
    emphasizedBassPitchClass,
    potentialSlashBass,
    inversionCharacter,
    hasPresetChordRegister: chordButtons.length > 0,
  };
}
