import type { FinderChordPattern } from "../types";
import { transpose } from "../music";
import { intervalsForChordFinder } from "./chordDefinitions";

export function isExtendedChord(pattern: FinderChordPattern) {
  return ["dominant9", "major9", "minor9", "minorMajor9", "dominant9sus4", "dominant11", "major11", "minor11", "dominant13", "major13", "minor13", "dominant7b9"].includes(pattern);
}

/** Notes allowed to disappear in a reduced chord, NOT permission for added tones. */
export function permittedOmissionIntervals(pattern: FinderChordPattern): number[] {
  const intervals = intervalsForChordFinder(pattern);
  if (intervals.length < 4) return [];
  const allowed: number[] = [];
  if (intervals.includes(7)) allowed.push(7); // unaltered perfect fifth
  if (["dominant11", "major11", "minor11", "dominant13", "major13", "minor13"].includes(pattern)) allowed.push(14);
  if (["dominant13", "major13", "minor13"].includes(pattern)) allowed.push(17);
  // The major third may be omitted in dominant/major 11 to avoid the 3rd/11th clash,
  // but such realizations should be identified as suspended-style.
  if (pattern === "dominant11" || pattern === "major11") allowed.push(4);
  return allowed;
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
