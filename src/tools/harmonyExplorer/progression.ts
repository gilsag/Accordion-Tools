import type { DiagramButton } from "../../types";
import { getStradellaChordFinderResults, type StradellaChordFinderResult } from "../stradellaChordFinderTools";
import { analyzeVoiceLeading, chordFamily, chordLabel, pitchClassesForChord, type ChordFamilyId } from "./music";
import { finderPatternForHarmonyFamily, pitchClassNameFromNumber, pitchClassNumberFromName } from "./integration";

export type HarmonyProgressionChord = {
  id: string;
  kind?: "chord";
  rootPc: number;
  familyId: ChordFamilyId;
  sectorIndex: number;
};

export type HarmonyProgressionNote = {
  id: string;
  kind: "note";
  pitchClass: number;
  sectorIndex: number;
};

/** One event captured by the Harmony recorder. */
export type HarmonyRecordedEvent = HarmonyProgressionChord | HarmonyProgressionNote;

export function isHarmonyProgressionChord(
  event: HarmonyRecordedEvent,
): event is HarmonyProgressionChord {
  return event.kind !== "note";
}

export type ProgressionOptimizationOptions = {
  allowApproximations: boolean;
  handMovementWeight: number;
  maxRealizationsPerChord?: number;
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
  exactnessPenalty: number;
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
  return chordLabel(chord.rootPc, chord.familyId, chord.sectorIndex, false);
}

function candidatesForChord(
  buttons: DiagramButton[],
  chord: HarmonyProgressionChord,
  spacingUnit: number,
  options: ProgressionOptimizationOptions,
): Candidate[] {
  const pattern = finderPatternForHarmonyFamily(chord.familyId);
  if (!pattern) return [];
  const root = pitchClassNameFromNumber(chord.rootPc);
  const maxResults = options.maxRealizationsPerChord ?? 5;
  const results = getStradellaChordFinderResults(
    buttons,
    root,
    pattern,
    "bass-and-chords",
    true,
  ).slice(0, maxResults);

  const playable = results
    .map((result, realizationIndex) => ({ result, realizationIndex }))
    .filter(({ result }) => result.playable)
    .filter(({ result }) => options.allowApproximations || result.exact);

  return playable.map(({ result, realizationIndex }) => {
    const soundingPcs = pitchClassesFromResult(result);
    const compactness = realizationCompactness(result.playbackButtons, spacingUnit);
    // Harmonic fidelity and physical ergonomics are deliberately kept separate.
    // Two realizations that sound the same pitch classes (for example the same
    // pitch on fundamental-bass vs counterbass rows) therefore receive the same
    // harmonic score; compactness is applied only through the physical term.
    const exactnessPenalty = result.exact ? 0 : 8;
    return {
      result,
      realizationIndex,
      soundingPcs,
      compactness,
      exactnessPenalty,
    };
  });
}

/**
 * Optimizes an entire progression with dynamic programming. The harmonic and
 * physical terms are evaluated transition-by-transition; the physical weight
 * is user controlled and the complementary weight is assigned to harmonic
 * pitch-class motion.
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

  const handWeight = Math.max(0, Math.min(1, options.handMovementWeight));
  const harmonicWeight = 1 - handWeight;
  const states: DynamicState[][] = candidateLayers.map((layer) => layer.map(() => ({
    cost: Number.POSITIVE_INFINITY,
    previousIndex: null,
    transition: null,
  })));

  candidateLayers[0].forEach((candidate, index) => {
    states[0][index] = {
      cost: candidate.exactnessPenalty + handWeight * candidate.compactness * 0.12,
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
          + candidate.exactnessPenalty
          + handWeight * candidate.compactness * 0.12;
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
  return chordFamily(chord.familyId).name;
}

export function progressionTargetPitchClasses(chord: HarmonyProgressionChord) {
  return pitchClassesForChord(chord.rootPc, chord.familyId);
}
