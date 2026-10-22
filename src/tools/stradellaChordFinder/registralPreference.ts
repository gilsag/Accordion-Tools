/*
  Modest, instrument-structural preference in Stradella recommendations.

  A played root bass can establish a low-register harmonic anchor, but is not
  worth an additional button on its own. Exact pitches and register-dependent
  inversion claims are intentionally out of scope: the input only describes
  sounding *button roles*, not a universal Stradella octave map.
*/

import type { StradellaRegistralAnalysis } from "./registralAnalysis";

// In the mixed search, each additional button costs 3 points, while an
// additional normalized column of reach costs 2.58 points. A one-point bonus
// is deliberately smaller than either ergonomic consideration.
export const ROOT_BASS_SUPPORT_BONUS = 1;

/** A non-positive adjustment to recommendation cost; lower scores rank first. */
export function registralPreferenceAdjustment(registral: StradellaRegistralAnalysis): number {
  // Only a single supported root accompanied by preset chord buttons supplies
  // an unambiguous root-versus-chord-register distinction. Multiple sounding
  // bass pitches have no reliable lowest-note interpretation in this model.
  return registral.inversionCharacter === "root-supported" &&
    registral.rootBassSupported && registral.chordButtonCount > 0 &&
    registral.bassPitchClasses.length === 1
    ? -ROOT_BASS_SUPPORT_BONUS
    : 0;
}
