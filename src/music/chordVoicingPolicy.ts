import type { FinderChordPattern } from "../types";
import { transpose } from "../music";
import { intervalsForChordFinder } from "./chordDefinitions";
import { chordToneFunctions } from "./chordToneRoles";

export function isExtendedChord(pattern: FinderChordPattern) {
  // Preserve completeness-first treatment of chords with three/four tones.
  return intervalsForChordFinder(pattern).length >= 5;
}

/** Only non-defining tones may be omitted; altered and added tones are protected. */
export function permittedOmissionIntervals(pattern: FinderChordPattern): number[] {
  return chordToneFunctions(pattern).filter((tone) => !tone.defining).map((tone) => tone.interval);
}

export function permittedMissingTones(root: string, pattern: FinderChordPattern, missing: string[]) {
  const allowed = permittedOmissionIntervals(pattern).map((i) => transpose(root, i));
  return missing.every((pitch) => allowed.includes(pitch));
}

export function suspendedStyleOmission(root: string, pattern: FinderChordPattern, missing: string[]) {
  return ["dominant11", "major11"].includes(pattern) && missing.includes(transpose(root, 4));
}

/** Relative musical penalty; lower is more conventional. */
export function omissionPenalty(root: string, pattern: FinderChordPattern, missing: string[]) {
  return missing.reduce((score, pitch) => {
    const interval = intervalsForChordFinder(pattern).find((i) => transpose(root, i) === pitch);
    if (interval === 7) return score + 1;
    if (interval === 14) return score + 1.5;
    if (interval === 17) return score + 2;
    if (interval === 4) return score + 5;
    return score + 10;
  }, 0);
}

/** A compact target voicing for the treble finder (full chord remains the definition). */
export function treblePreferredIntervals(pattern: FinderChordPattern) {
  const all = intervalsForChordFinder(pattern);
  if (["dominant13", "major13", "minor13"].includes(pattern)) {
    return all.filter((i) => ![7, 14, 17].includes(i)); // 1-3-7-13 shell
  }
  if (["dominant11", "major11", "minor11"].includes(pattern)) {
    return all.filter((i) => i !== 7); // 1-3-7-9-11
  }
  return all;
}
