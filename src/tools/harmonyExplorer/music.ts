export type ChordFamilyId =
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "sus2"
  | "sus4"
  | "sixth"
  | "minor6"
  | "dominant7"
  | "major7"
  | "minor7"
  | "minorMajor7"
  | "halfDiminished7"
  | "diminished7"
  | "augmented7"
  | "augmentedMajor7";

export type RelatedFamilyId = ChordFamilyId | "all";

export type ScaleId =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "harmonicMinor"
  | "melodicMinor"
  | "harmonicMajor"
  | "majorPentatonic"
  | "minorPentatonic"
  | "wholeTone";

export type ChordFamily = {
  id: ChordFamilyId;
  name: string;
  shortName: string;
  suffix: string;
  intervals: readonly number[];
};

export type ScaleDefinition = {
  id: ScaleId;
  name: string;
  intervals: readonly number[];
};

export type ChordCandidate = {
  rootPc: number;
  familyId: ChordFamilyId;
  pitchClasses: number[];
  sharedCount: number;
  diatonic: boolean;
};

export type SectorRelationships = {
  sectorIndex: number;
  referenceRootPc: number;
  referencePitches: number[];
  bySharedCount: Map<number, ChordCandidate[]>;
};

export const CHORD_FAMILIES: readonly ChordFamily[] = [
  { id: "major", name: "Major triad", shortName: "Major", suffix: "", intervals: [0, 4, 7] },
  { id: "minor", name: "Minor triad", shortName: "Minor", suffix: "m", intervals: [0, 3, 7] },
  { id: "diminished", name: "Diminished triad", shortName: "Diminished", suffix: "°", intervals: [0, 3, 6] },
  { id: "augmented", name: "Augmented triad", shortName: "Augmented", suffix: "+", intervals: [0, 4, 8] },
  { id: "sus2", name: "Suspended second", shortName: "Sus2", suffix: "sus2", intervals: [0, 2, 7] },
  { id: "sus4", name: "Suspended fourth", shortName: "Sus4", suffix: "sus4", intervals: [0, 5, 7] },
  { id: "sixth", name: "Major sixth", shortName: "Major 6", suffix: "6", intervals: [0, 4, 7, 9] },
  { id: "minor6", name: "Minor sixth", shortName: "Minor 6", suffix: "m6", intervals: [0, 3, 7, 9] },
  { id: "dominant7", name: "Dominant seventh", shortName: "Dominant 7", suffix: "7", intervals: [0, 4, 7, 10] },
  { id: "major7", name: "Major seventh", shortName: "Major 7", suffix: "maj7", intervals: [0, 4, 7, 11] },
  { id: "minor7", name: "Minor seventh", shortName: "Minor 7", suffix: "m7", intervals: [0, 3, 7, 10] },
  { id: "minorMajor7", name: "Minor-major seventh", shortName: "Minor-major 7", suffix: "m(maj7)", intervals: [0, 3, 7, 11] },
  { id: "halfDiminished7", name: "Half-diminished seventh", shortName: "Half-dim 7", suffix: "ø7", intervals: [0, 3, 6, 10] },
  { id: "diminished7", name: "Diminished seventh", shortName: "Diminished 7", suffix: "°7", intervals: [0, 3, 6, 9] },
  { id: "augmented7", name: "Augmented dominant seventh", shortName: "Augmented 7", suffix: "+7", intervals: [0, 4, 8, 10] },
  { id: "augmentedMajor7", name: "Augmented major seventh", shortName: "Augmented maj7", suffix: "+maj7", intervals: [0, 4, 8, 11] },
] as const;

export const SCALES: readonly ScaleDefinition[] = [
  { id: "ionian", name: "Ionian (Major)", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "dorian", name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: "aeolian", name: "Aeolian (Natural Minor)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "locrian", name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: "harmonicMinor", name: "Harmonic minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: "melodicMinor", name: "Melodic minor (ascending)", intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: "harmonicMajor", name: "Harmonic major", intervals: [0, 2, 4, 5, 7, 8, 11] },
  { id: "majorPentatonic", name: "Major pentatonic", intervals: [0, 2, 4, 7, 9] },
  { id: "minorPentatonic", name: "Minor pentatonic", intervals: [0, 3, 5, 7, 10] },
  { id: "wholeTone", name: "Whole-tone", intervals: [0, 2, 4, 6, 8, 10] },
] as const;

export const CIRCLE_OF_FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5] as const;
export const CIRCLE_ROOT_NAMES = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"] as const;

const COMMON_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"] as const;
const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"] as const;

export function mod12(value: number) {
  return ((value % 12) + 12) % 12;
}

export function chordFamily(id: ChordFamilyId) {
  const family = CHORD_FAMILIES.find((item) => item.id === id);
  if (!family) throw new Error(`Unknown chord family: ${id}`);
  return family;
}

export function relatedFamilyName(id: RelatedFamilyId) {
  return id === "all" ? "All chord families" : chordFamily(id).name;
}

export function relatedFamilyShortName(id: RelatedFamilyId) {
  return id === "all" ? "All families" : chordFamily(id).shortName;
}

export function scaleDefinition(id: ScaleId) {
  const scale = SCALES.find((item) => item.id === id);
  if (!scale) throw new Error(`Unknown scale: ${id}`);
  return scale;
}

export function pitchClassesForChord(rootPc: number, familyId: ChordFamilyId) {
  return chordFamily(familyId).intervals.map((interval) => mod12(rootPc + interval));
}

export function pitchClassesForScale(rootPc: number, scaleId: ScaleId) {
  return scaleDefinition(scaleId).intervals.map((interval) => mod12(rootPc + interval));
}

export function sharedPitchClassCount(a: readonly number[], b: readonly number[]) {
  const bSet = new Set(b);
  return new Set(a).size === 0 ? 0 : [...new Set(a)].filter((pc) => bSet.has(pc)).length;
}

export function isSubset(candidate: readonly number[], parent: readonly number[]) {
  const parentSet = new Set(parent);
  return [...new Set(candidate)].every((pc) => parentSet.has(pc));
}

function sectorPrefersSharps(sectorIndex: number) {
  return sectorIndex >= 1 && sectorIndex <= 6;
}

function sectorPrefersFlats(sectorIndex: number) {
  return sectorIndex >= 7 && sectorIndex <= 11;
}

export function pitchName(pc: number, sectorIndex: number, showEnharmonics = false) {
  const normalized = mod12(pc);
  const sharp = SHARP_NAMES[normalized];
  const flat = FLAT_NAMES[normalized];

  if (showEnharmonics && sharp !== flat) return `${sharp}/${flat}`;
  if (sectorPrefersSharps(sectorIndex)) return sharp;
  if (sectorPrefersFlats(sectorIndex)) return flat;
  return COMMON_NAMES[normalized];
}

export function chordLabel(rootPc: number, familyId: ChordFamilyId, sectorIndex: number, showEnharmonics = false) {
  const family = chordFamily(familyId);
  const root = pitchName(rootPc, sectorIndex, showEnharmonics);
  if (!showEnharmonics || !root.includes("/")) return `${root}${family.suffix}`;
  return root
    .split("/")
    .map((name) => `${name}${family.suffix}`)
    .join("/");
}

export function chordPitchNames(rootPc: number, familyId: ChordFamilyId, sectorIndex: number) {
  return pitchClassesForChord(rootPc, familyId).map((pc) => pitchName(pc, sectorIndex, false));
}

function fifthPosition(pc: number) {
  return CIRCLE_OF_FIFTHS.indexOf(mod12(pc) as (typeof CIRCLE_OF_FIFTHS)[number]);
}

function circularDistance(a: number, b: number, length: number) {
  const direct = Math.abs(a - b);
  return Math.min(direct, length - direct);
}

export function buildSectorRelationships(
  referenceFamilyId: ChordFamilyId,
  relatedFamilyId: RelatedFamilyId,
  scaleId: ScaleId,
  diatonicOnly: boolean,
  showZeroOverlap = false,
): SectorRelationships[] {
  return CIRCLE_OF_FIFTHS.map((referenceRootPc, sectorIndex) => {
    const referencePitches = pitchClassesForChord(referenceRootPc, referenceFamilyId);
    const parentScalePitches = pitchClassesForScale(referenceRootPc, scaleId);
    const bySharedCount = new Map<number, ChordCandidate[]>();

    const relatedFamilies = relatedFamilyId === "all"
      ? CHORD_FAMILIES
      : [chordFamily(relatedFamilyId)];
    const effectiveDiatonicOnly = diatonicOnly || relatedFamilyId === "all";

    for (const relatedFamily of relatedFamilies) {
      for (let rootPc = 0; rootPc < 12; rootPc += 1) {
        // In the aggregate diagram the exact reference chord is already shown
        // in the inner ring, so do not repeat the same root/family immediately
        // outside it. Other chords from the reference family remain eligible.
        if (
          relatedFamilyId === "all" &&
          relatedFamily.id === referenceFamilyId &&
          rootPc === referenceRootPc
        ) continue;

        const pitchClasses = pitchClassesForChord(rootPc, relatedFamily.id);
        const sharedCount = sharedPitchClassCount(referencePitches, pitchClasses);
        // Zero-overlap relationships are optional in every diagram mode.
        // Keeping this as a display/search option avoids an automatic extra
        // outer ring while still allowing users to inspect fully disjoint
        // harmonic relationships when they are useful.
        if (sharedCount === 0 && !showZeroOverlap) continue;

        const diatonic = isSubset(pitchClasses, parentScalePitches);
        if (effectiveDiatonicOnly && !diatonic) continue;

        const candidate: ChordCandidate = {
          rootPc,
          familyId: relatedFamily.id,
          pitchClasses,
          sharedCount,
          diatonic,
        };
        const bucket = bySharedCount.get(sharedCount) ?? [];
        bucket.push(candidate);
        bySharedCount.set(sharedCount, bucket);
      }
    }

    for (const bucket of bySharedCount.values()) {
      bucket.sort((a, b) => {
        if (a.diatonic !== b.diatonic) return a.diatonic ? -1 : 1;
        const referencePos = fifthPosition(referenceRootPc);
        const aPos = fifthPosition(a.rootPc);
        const bPos = fifthPosition(b.rootPc);
        const aDistance = circularDistance(referencePos, aPos, 12);
        const bDistance = circularDistance(referencePos, bPos, 12);
        const aFamilyIndex = CHORD_FAMILIES.findIndex((family) => family.id === a.familyId);
        const bFamilyIndex = CHORD_FAMILIES.findIndex((family) => family.id === b.familyId);
        return aDistance - bDistance || aPos - bPos || aFamilyIndex - bFamilyIndex;
      });
    }

    return {
      sectorIndex,
      referenceRootPc,
      referencePitches,
      bySharedCount,
    };
  });
}

export function relationshipCounts(sectors: readonly SectorRelationships[]) {
  const counts = new Set<number>();
  sectors.forEach((sector) => sector.bySharedCount.forEach((_value, key) => counts.add(key)));
  return [...counts].sort((a, b) => b - a);
}

export const DEFAULT_RING_VISIBILITY: Readonly<Record<number, boolean>> = {
  0: false,
  1: true,
  2: true,
  3: true,
  4: true,
};

export function isRelationshipRingVisible(
  sharedCount: number,
  visibility: Readonly<Record<number, boolean>>,
) {
  return visibility[sharedCount] ?? sharedCount !== 0;
}

export function filterRelationshipCounts(
  counts: readonly number[],
  visibility: Readonly<Record<number, boolean>>,
) {
  return counts.filter((count) => isRelationshipRingVisible(count, visibility));
}



export type VoiceLeadingMove = {
  fromPc: number;
  toPc: number;
  distance: number;
};

export type VoiceLeadingAnalysis = {
  sharedPitchClasses: number[];
  moves: VoiceLeadingMove[];
  totalMotion: number;
  addedPitchClasses: number[];
  removedPitchClasses: number[];
};

function pitchClassDistance(a: number, b: number) {
  const difference = Math.abs(mod12(a) - mod12(b));
  return Math.min(difference, 12 - difference);
}

function minimumPairing(fromPcs: readonly number[], toPcs: readonly number[]) {
  type Pairing = { pairs: Array<[number, number]>; usedFrom: Set<number>; usedTo: Set<number>; score: number };
  let best: Pairing | null = null;

  if (fromPcs.length <= toPcs.length) {
    const walk = (fromIndex: number, usedTo: Set<number>, pairs: Array<[number, number]>, score: number) => {
      if (fromIndex >= fromPcs.length) {
        if (!best || score < best.score) {
          best = {
            pairs: [...pairs],
            usedFrom: new Set(fromPcs.map((_value, index) => index)),
            usedTo: new Set(usedTo),
            score,
          };
        }
        return;
      }
      if (best && score >= best.score) return;
      for (let toIndex = 0; toIndex < toPcs.length; toIndex += 1) {
        if (usedTo.has(toIndex)) continue;
        usedTo.add(toIndex);
        pairs.push([fromIndex, toIndex]);
        walk(fromIndex + 1, usedTo, pairs, score + pitchClassDistance(fromPcs[fromIndex], toPcs[toIndex]));
        pairs.pop();
        usedTo.delete(toIndex);
      }
    };
    walk(0, new Set(), [], 0);
  } else {
    const walk = (toIndex: number, usedFrom: Set<number>, pairs: Array<[number, number]>, score: number) => {
      if (toIndex >= toPcs.length) {
        if (!best || score < best.score) {
          best = {
            pairs: [...pairs],
            usedFrom: new Set(usedFrom),
            usedTo: new Set(toPcs.map((_value, index) => index)),
            score,
          };
        }
        return;
      }
      if (best && score >= best.score) return;
      for (let fromIndex = 0; fromIndex < fromPcs.length; fromIndex += 1) {
        if (usedFrom.has(fromIndex)) continue;
        usedFrom.add(fromIndex);
        pairs.push([fromIndex, toIndex]);
        walk(toIndex + 1, usedFrom, pairs, score + pitchClassDistance(fromPcs[fromIndex], toPcs[toIndex]));
        pairs.pop();
        usedFrom.delete(fromIndex);
      }
    };
    walk(0, new Set(), [], 0);
  }

  return (best as Pairing | null) ?? { pairs: [], usedFrom: new Set<number>(), usedTo: new Set<number>(), score: 0 };
}

/**
 * Pitch-class voice-leading summary. Exact common tones are held first; the
 * remaining voices are paired to minimize total chromatic motion. If the two
 * chords have different cardinalities, unmatched target/reference tones are
 * reported separately rather than being assigned an arbitrary movement cost.
 */
export function analyzeVoiceLeading(referencePitches: readonly number[], targetPitches: readonly number[]): VoiceLeadingAnalysis {
  const reference = [...new Set(referencePitches.map(mod12))];
  const target = [...new Set(targetPitches.map(mod12))];
  const targetSet = new Set(target);
  const sharedPitchClasses = reference.filter((pc) => targetSet.has(pc));
  const sharedSet = new Set(sharedPitchClasses);
  const remainingReference = reference.filter((pc) => !sharedSet.has(pc));
  const remainingTarget = target.filter((pc) => !sharedSet.has(pc));
  const pairing = minimumPairing(remainingReference, remainingTarget);
  const moves = pairing.pairs.map(([fromIndex, toIndex]) => ({
    fromPc: remainingReference[fromIndex],
    toPc: remainingTarget[toIndex],
    distance: pitchClassDistance(remainingReference[fromIndex], remainingTarget[toIndex]),
  }));
  const addedPitchClasses = remainingTarget.filter((_pc, index) => !pairing.usedTo.has(index));
  const removedPitchClasses = remainingReference.filter((_pc, index) => !pairing.usedFrom.has(index));

  return {
    sharedPitchClasses,
    moves,
    totalMotion: moves.reduce((sum, move) => sum + move.distance, 0),
    addedPitchClasses,
    removedPitchClasses,
  };
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

function familyUsesLowercaseNumeral(familyId: ChordFamilyId) {
  return ["minor", "minor6", "minor7", "minorMajor7", "diminished", "halfDiminished7", "diminished7"].includes(familyId);
}

function romanFamilySuffix(familyId: ChordFamilyId) {
  const suffixes: Record<ChordFamilyId, string> = {
    major: "",
    minor: "",
    diminished: "°",
    augmented: "+",
    sus2: "sus2",
    sus4: "sus4",
    sixth: "6",
    minor6: "6",
    dominant7: "7",
    major7: "maj7",
    minor7: "7",
    minorMajor7: "(maj7)",
    halfDiminished7: "ø7",
    diminished7: "°7",
    augmented7: "+7",
    augmentedMajor7: "+maj7",
  };
  return suffixes[familyId];
}

/** Roman-numeral label when the chord root is a degree of the selected parent scale/mode. */
export function romanNumeralForChord(
  chordRootPc: number,
  familyId: ChordFamilyId,
  tonicPc: number,
  scaleId: ScaleId,
) {
  const interval = mod12(chordRootPc - tonicPc);
  const scaleIntervals = scaleDefinition(scaleId).intervals;
  const degreeIndex = scaleIntervals.indexOf(interval);
  if (degreeIndex < 0 || degreeIndex >= ROMAN_NUMERALS.length) return null;
  const numeral = familyUsesLowercaseNumeral(familyId)
    ? ROMAN_NUMERALS[degreeIndex].toLowerCase()
    : ROMAN_NUMERALS[degreeIndex];
  return `${numeral}${romanFamilySuffix(familyId)}`;
}

const FAMILY_COLORS: Readonly<Record<ChordFamilyId, string>> = {
  major: "#1f5fbf",
  minor: "#7a3db8",
  diminished: "#b85b18",
  augmented: "#c13d5a",
  sus2: "#00838f",
  sus4: "#00796b",
  sixth: "#2e7d32",
  minor6: "#558b2f",
  dominant7: "#a86100",
  major7: "#3949ab",
  minor7: "#8e44ad",
  minorMajor7: "#6a1b9a",
  halfDiminished7: "#9a5b16",
  diminished7: "#7d4a20",
  augmented7: "#c0392b",
  augmentedMajor7: "#ad1457",
};

export function chordFamilyColor(familyId: ChordFamilyId) {
  return FAMILY_COLORS[familyId];
}

export function chordMidiNotes(rootPc: number, familyId: ChordFamilyId, baseOctave = 4) {
  const rootMidi = 12 * (baseOctave + 1) + mod12(rootPc);
  return chordFamily(familyId).intervals.map((interval) => rootMidi + interval);
}
