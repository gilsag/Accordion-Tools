/*
  Translation boundary between numerical Harmony pitch classes/family IDs and
  the named Chord Finder API. Some families have no finder equivalent; callers
  must handle a null mapping rather than invent an approximate chord type.
*/

import type { FinderChordPattern } from "../../types";
import type { ChordFamilyId } from "./music";

const PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const FAMILY_TO_FINDER: Partial<Record<ChordFamilyId, FinderChordPattern>> = {
  major: "major-triad",
  minor: "minor-triad",
  diminished: "diminished-triad",
  augmented: "augmented-triad",
  sus2: "sus2",
  sus4: "sus4",
  sixth: "major6",
  minor6: "minor6",
  dominant7: "dominant7",
  major7: "major7",
  minor7: "minor7",
  minorMajor7: "minorMajor7",
  halfDiminished7: "minor7b5",
  diminished7: "diminished7",
  augmented7: "dominant7sharp5",
};

const FINDER_TO_FAMILY = Object.fromEntries(
  Object.entries(FAMILY_TO_FINDER).map(([family, finder]) => [finder, family]),
) as Partial<Record<FinderChordPattern, ChordFamilyId>>;

export function finderPatternForHarmonyFamily(familyId: ChordFamilyId) {
  return FAMILY_TO_FINDER[familyId] ?? null;
}

export function harmonyFamilyForFinderPattern(pattern: FinderChordPattern) {
  return FINDER_TO_FAMILY[pattern] ?? null;
}

export function pitchClassNameFromNumber(pc: number) {
  return PITCH_CLASS_NAMES[((pc % 12) + 12) % 12];
}

export function pitchClassNumberFromName(name: string) {
  const normalized = name.replace("♯", "#").replace("♭", "b");
  const flatMap: Record<string, string> = {
    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#",
    Cb: "B",
    Fb: "E",
    "B#": "C",
    "E#": "F",
  };
  const canonical = flatMap[normalized] ?? normalized;
  const index = PITCH_CLASS_NAMES.indexOf(canonical as (typeof PITCH_CLASS_NAMES)[number]);
  return index >= 0 ? index : null;
}
