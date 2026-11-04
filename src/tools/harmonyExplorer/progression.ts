import type { DiagramButton, FinderChordPattern } from "../../types";
import { intervalsForChordFinder, chordFinderLabel } from "../../music/chordDefinitions";
import { displayFinderChord, type ChordDisplayStyle } from "../chordDisplay";
import { getStradellaChordFinderResults, type StradellaChordFinderResult } from "../stradellaChordFinderTools";
import { analyzeVoiceLeading, chordFamily, chordLabel, pitchClassesForChord, type ChordFamilyId } from "./music";
import { finderPatternForHarmonyFamily, pitchClassNameFromNumber, pitchClassNumberFromName } from "./integration";

/** Harmony transfers retain their established family IDs. New Progression
 * Assistant entries instead retain the exact shared Finder chord identifier.
 * Neither identity is synthesized from the other's interval set.
 */
export type HarmonyRecordedChord = {
  id: string;
  kind?: "chord";
  rootPc: number;
  familyId: ChordFamilyId;
  sectorIndex: number;
};

export type HarmonyProgressionChord = HarmonyRecordedChord | {
  id: string;
  kind?: "chord";
  rootPc: number;
  pattern: FinderChordPattern;
  sectorIndex: number;
};

/** The only conversion into the search engine: existing Harmony adapters or
 * the Finder's own canonical pattern. Unsupported Harmony chords stay unknown.
 */
export function progressionFinderPattern(chord: HarmonyProgressionChord): FinderChordPattern | null {
  return "pattern" in chord ? chord.pattern : finderPatternForHarmonyFamily(chord.familyId);
}

export function progressionChordLabel(chord: HarmonyProgressionChord, style?: ChordDisplayStyle): string {
  if ("pattern" in chord) {
    return displayFinderChord(pitchClassNameFromNumber(chord.rootPc), chord.pattern, style ?? "compact");
  }
  return chordLabel(chord.rootPc, chord.familyId, chord.sectorIndex, false, style);
}

export type HarmonyProgressionNote = {
  id: string;
  kind: "note";
  pitchClass: number;
  sectorIndex: number;
};

/** One event captured by the Harmony recorder. */
export type HarmonyRecordedEvent = HarmonyRecordedChord | HarmonyProgressionNote;

export function isHarmonyProgressionChord(
  event: HarmonyRecordedEvent,
): event is HarmonyRecordedChord {
  return event.kind !== "note";
}

export type ProgressionOptimizationOptions = {
  allowApproximations: boolean;
  handMovementWeight: number;
  /** Independent 0..1 transition coefficient, session-owned (not in settings JSON). */
  voiceLeadingWeight?: number;
  maxRealizationsPerChord?: number;
  /** Explicit user choices by stable progression-step ID and sounding button IDs. */
  fixedRealizationKeys?: Readonly<Record<string, string>>;
};

export type ProgressionTransitionMetrics = {
  harmonicMotion: number;
  physicalMovement: number;
  sharedPitchClasses: number[];
};

export type OptimizedProgressionStep = {
  chord: HarmonyProgressionChord;
  label: string;
  result: StradellaChordFinderResult;
  realizationIndex: number;
  transitionFromPrevious: ProgressionTransitionMetrics | null;
  compactness: number;
};

export type OptimizedProgressionPlan = {
  playable: boolean;
  steps: OptimizedProgressionStep[];
  totalHarmonicMotion: number;
  totalPhysicalMovement: number;
  approximateCount: number;
  unsupportedLabels: string[];
  spacingUnit: number;
};

type Candidate = {
  result: StradellaChordFinderResult;
  realizationIndex: number;
  soundingPcs: number[];
  compactness: number;
  /** Original Finder rank (0-based); the existing Finder owns this preference. */
  rankCost: number;
};

type DynamicState = {
  cost: number;
  previousIndex: number | null;
  transition: ProgressionTransitionMetrics | null;
};

function buttonDistance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function median(values: number[]) {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/** Typical nearest-neighbour spacing in the current Stradella layout. */
export function estimateStradellaButtonSpacing(buttons: DiagramButton[]) {
  const relevant = buttons.filter((button) => button.kind !== "treble-note");
  const nearest = relevant.map((button, index) => {
    let best = Number.POSITIVE_INFINITY;
    for (let otherIndex = 0; otherIndex < relevant.length; otherIndex += 1) {
      if (otherIndex === index) continue;
      best = Math.min(best, buttonDistance(button, relevant[otherIndex]));
    }
    return Number.isFinite(best) ? best : 0;
  }).filter((value) => value > 0);
  return Math.max(1, median(nearest));
}

function centroid(buttons: DiagramButton[]) {
  if (buttons.length === 0) return { x: 0, y: 0 };
  return {
    x: buttons.reduce((sum, button) => sum + button.x, 0) / buttons.length,
    y: buttons.reduce((sum, button) => sum + button.y, 0) / buttons.length,
  };
}

function directedNearestDistance(from: DiagramButton[], to: DiagramButton[]) {
  if (from.length === 0 || to.length === 0) return 0;
  return from.reduce((sum, button) => {
    const nearest = Math.min(...to.map((other) => buttonDistance(button, other)));
    return sum + nearest;
  }, 0) / from.length;
}

/**
 * Physical transition score in approximate button spacings. It combines the
 * movement of the hand centre with nearest-button continuity so that retained
 * or nearby buttons reduce the score without assuming a particular fingering.
 */
export function physicalButtonMovement(
  from: DiagramButton[],
  to: DiagramButton[],
  spacingUnit: number,
) {
  if (from.length === 0 || to.length === 0) return 0;
  const fromCentroid = centroid(from);
  const toCentroid = centroid(to);
  const centreTravel = Math.hypot(
    fromCentroid.x - toCentroid.x,
    fromCentroid.y - toCentroid.y,
  );
  const continuity = (
    directedNearestDistance(from, to) + directedNearestDistance(to, from)
  ) / 2;
  return (0.45 * centreTravel + 0.55 * continuity) / Math.max(1, spacingUnit);
}

export function realizationCompactness(buttons: DiagramButton[], spacingUnit: number) {
  let maximum = 0;
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      maximum = Math.max(maximum, buttonDistance(buttons[i], buttons[j]));
    }
  }
  return maximum / Math.max(1, spacingUnit);
}

/**
 * Chooses the bass pulse for idiomatic accompaniment without changing the
 * optimized realization. If the selected realization already contains the
 * chord root on either the fundamental-bass or counterbass row, preserve that
 * exact physical button. Otherwise fall back to the ordinary fundamental root
 * bass (and only then to a counterbass equivalent).
 */
export function progressionBassPulseButtons(
  allButtons: DiagramButton[],
  step: Pick<OptimizedProgressionStep, "chord" | "result">,
) {
  const realizationBassButtons = step.result.playbackButtons.filter(
    (button) => button.kind === "bass-root" || button.kind === "bass-counterbass",
  );

  const matchingRealizationBass = realizationBassButtons.filter(
    (button) => {
      if (!button.pitchClass) return false;
      return pitchClassNumberFromName(button.pitchClass) === step.chord.rootPc;
    },
  );
  if (matchingRealizationBass.length > 0) return matchingRealizationBass;

  const fundamental = allButtons.find(
    (button) =>
      button.kind === "bass-root"
      && !!button.pitchClass
      && pitchClassNumberFromName(button.pitchClass) === step.chord.rootPc,
  );
  if (fundamental) return [fundamental];

  const counterbass = allButtons.find(
    (button) =>
      button.kind === "bass-counterbass"
      && !!button.pitchClass
      && pitchClassNumberFromName(button.pitchClass) === step.chord.rootPc,
  );
  return counterbass ? [counterbass] : realizationBassButtons;
}

function pitchClassesFromResult(result: StradellaChordFinderResult) {
  return result.coveredPitches
    .filter((pitch): pitch is string => typeof pitch === "string")
    .map((pitch) => pitchClassNumberFromName(pitch))
    .filter((value): value is number => value !== null);
}

function transitionMetrics(from: Candidate, to: Candidate, spacingUnit: number): ProgressionTransitionMetrics {
  const voice = analyzeVoiceLeading(from.soundingPcs, to.soundingPcs);
  return {
    harmonicMotion: voice.totalMotion,
    physicalMovement: physicalButtonMovement(
      from.result.playbackButtons,
      to.result.playbackButtons,
      spacingUnit,
    ),
    sharedPitchClasses: voice.sharedPitchClasses,
  };
}

function chordDisplayLabel(chord: HarmonyProgressionChord) {
  return progressionChordLabel(chord);
}

/** Stable physical recipe identity, excluding visually highlighted reference buttons. */
export function progressionRealizationKey(result: StradellaChordFinderResult) {
  return result.playbackButtons.map((button) => button.id).sort().join("|");
}

/** The same full, original-ranked candidates used by the Stradella Chord Finder.
 * This list is for explicit browsing; automatic optimization still uses its
 * historical first-five shortlist unless a user pins a specific realization.
 */
export function progressionRealizationsForChord(
  buttons: DiagramButton[],
  chord: HarmonyProgressionChord,
  allowApproximations: boolean,
) {
  const pattern = progressionFinderPattern(chord);
  if (!pattern) return [];
  return getStradellaChordFinderResults(
    buttons, pitchClassNameFromNumber(chord.rootPc), pattern, "bass-and-chords", true,
  ).map((result, realizationIndex) => ({ result, realizationIndex }))
    .filter(({ result }) => result.playable && (allowApproximations || result.exact));
}

/* Limit each progression layer to usable candidate recipes. The global
   optimizer compares transitions between these layers; physical button IDs
   are retained for later playback and diagram highlighting. */
function candidatesForChord(
  buttons: DiagramButton[],
  chord: HarmonyProgressionChord,
  spacingUnit: number,
  options: ProgressionOptimizationOptions,
): Candidate[] {
  const pattern = progressionFinderPattern(chord);
  if (!pattern) return [];
  const root = pitchClassNameFromNumber(chord.rootPc);
  const maxResults = options.maxRealizationsPerChord ?? 5;
  const allResults = getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true);
  const pinnedKey = options.fixedRealizationKeys?.[chord.id];
  // A pinned result may lie well below the automatic top-five candidates.
  // Never silently replace it with another sounding recipe.
  const playable = (pinnedKey
    ? allResults.map((result, realizationIndex) => ({ result, realizationIndex }))
      .filter(({ result }) => progressionRealizationKey(result) === pinnedKey)
    : allResults.slice(0, maxResults).map((result, realizationIndex) => ({ result, realizationIndex })))
    .filter(({ result }) => result.playable)
    .filter(({ result }) => options.allowApproximations || result.exact);

  return playable.map(({ result, realizationIndex }) => {
    const soundingPcs = pitchClassesFromResult(result);
    const compactness = realizationCompactness(result.playbackButtons, spacingUnit);
    // Harmonic fidelity and physical ergonomics are deliberately kept separate.
    // Two realizations that sound the same pitch classes (for example the same
    // pitch on fundamental-bass vs counterbass rows) therefore receive the same
    // harmonic score; compactness is available for diagnostics, not rescored.
    return {
      result,
      realizationIndex,
      soundingPcs,
      compactness,
      rankCost: realizationIndex,
    };
  });
}

/**
 * Optimizes an entire progression with dynamic programming. Finder rank is the
 * per-chord cost; two independently controlled transition terms trade against
 * it. The reference scales normalize typical movement distances, not measured
 * biomechanics. At zero on both controls, each unpinned step selects Finder #1
 * (or the best admissible rank when approximations are disabled).
 */
export function optimizeStradellaProgression(
  buttons: DiagramButton[],
  progression: HarmonyProgressionChord[],
  options: ProgressionOptimizationOptions,
): OptimizedProgressionPlan {
  const spacingUnit = estimateStradellaButtonSpacing(buttons);
  if (progression.length === 0) {
    return {
      playable: false,
      steps: [],
      totalHarmonicMotion: 0,
      totalPhysicalMovement: 0,
      approximateCount: 0,
      unsupportedLabels: [],
      spacingUnit,
    };
  }

  const candidateLayers = progression.map((chord) =>
    candidatesForChord(buttons, chord, spacingUnit, options),
  );
  const unsupportedLabels = progression
    .filter((_chord, index) => candidateLayers[index].length === 0)
    .map(chordDisplayLabel);

  if (unsupportedLabels.length > 0) {
    return {
      playable: false,
      steps: [],
      totalHarmonicMotion: 0,
      totalPhysicalMovement: 0,
      approximateCount: 0,
      unsupportedLabels,
      spacingUnit,
    };
  }

  // Each 0..1 slider can contribute at most 3 rank-cost units per reference
  // distance (2 button spacings or 4 semitones). Independent coefficients mean
  // turning both to zero disables all transition optimization, unlike the old
  // complementary cross-fade. These constants should be tuned with user tests.
  const handWeight = 3 * Math.max(0, Math.min(1, options.handMovementWeight)) / 2;
  const harmonicWeight = 3 * Math.max(0, Math.min(1, options.voiceLeadingWeight ?? 0)) / 4;
  const states: DynamicState[][] = candidateLayers.map((layer) => layer.map(() => ({
    cost: Number.POSITIVE_INFINITY,
    previousIndex: null,
    transition: null,
  })));

  candidateLayers[0].forEach((candidate, index) => {
    states[0][index] = {
      cost: candidate.rankCost,
      previousIndex: null,
      transition: null,
    };
  });

  for (let layerIndex = 1; layerIndex < candidateLayers.length; layerIndex += 1) {
    const previousLayer = candidateLayers[layerIndex - 1];
    const currentLayer = candidateLayers[layerIndex];
    currentLayer.forEach((candidate, currentIndex) => {
      previousLayer.forEach((previous, previousIndex) => {
        const previousState = states[layerIndex - 1][previousIndex];
        if (!Number.isFinite(previousState.cost)) return;
        const transition = transitionMetrics(previous, candidate, spacingUnit);
        const transitionCost =
          handWeight * transition.physicalMovement +
          harmonicWeight * transition.harmonicMotion;
        const cost = previousState.cost
          + transitionCost
          + candidate.rankCost;
        if (cost < states[layerIndex][currentIndex].cost) {
          states[layerIndex][currentIndex] = {
            cost,
            previousIndex,
            transition,
          };
        }
      });
    });
  }

  const finalLayerIndex = candidateLayers.length - 1;
  let finalCandidateIndex = 0;
  for (let index = 1; index < states[finalLayerIndex].length; index += 1) {
    if (states[finalLayerIndex][index].cost < states[finalLayerIndex][finalCandidateIndex].cost) {
      finalCandidateIndex = index;
    }
  }

  const chosenIndices = new Array<number>(candidateLayers.length);
  let currentIndex: number | null = finalCandidateIndex;
  for (let layerIndex = finalLayerIndex; layerIndex >= 0; layerIndex -= 1) {
    if (currentIndex === null) break;
    chosenIndices[layerIndex] = currentIndex;
    currentIndex = states[layerIndex][currentIndex].previousIndex;
  }

  const steps = progression.map((chord, layerIndex): OptimizedProgressionStep => {
    const candidateIndex = chosenIndices[layerIndex];
    const candidate = candidateLayers[layerIndex][candidateIndex];
    const state = states[layerIndex][candidateIndex];
    return {
      chord,
      label: chordDisplayLabel(chord),
      result: candidate.result,
      realizationIndex: candidate.realizationIndex,
      transitionFromPrevious: state.transition,
      compactness: candidate.compactness,
    };
  });

  return {
    playable: true,
    steps,
    totalHarmonicMotion: steps.reduce(
      (sum, step) => sum + (step.transitionFromPrevious?.harmonicMotion ?? 0),
      0,
    ),
    totalPhysicalMovement: steps.reduce(
      (sum, step) => sum + (step.transitionFromPrevious?.physicalMovement ?? 0),
      0,
    ),
    approximateCount: steps.filter((step) => !step.result.exact).length,
    unsupportedLabels: [],
    spacingUnit,
  };
}

export function progressionChordFamilyName(chord: HarmonyProgressionChord) {
  return "pattern" in chord ? chordFinderLabel(chord.pattern) : chordFamily(chord.familyId).name;
}

export function progressionTargetPitchClasses(chord: HarmonyProgressionChord) {
  return "pattern" in chord
    ? [...new Set(intervalsForChordFinder(chord.pattern).map((interval) => (chord.rootPc + interval) % 12))]
    : pitchClassesForChord(chord.rootPc, chord.familyId);
}
