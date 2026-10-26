/* Mixed Stradella search: generate several exact/idiomatic realizations and rank
   genuinely mixed, compact solutions ahead of chord-button-only alternatives. */

import type { DiagramButton, FinderChordPattern } from "../../types";
import { transpose } from "../../music";
import { isExtendedChord, permittedMissingTones, omissionPenalty, suspendedStyleOmission } from "../../music/chordVoicingPolicy";
import { notPlayableResult, resultFromButtons, summarizeResult, type StradellaChordFinderResult } from "./results";
import { buttonTones, chordKindLabel, combinationTones, isBassButton } from "./voicings";
import {
  chooseRootReference,
  chordButtonPool,
  chordCombinations,
  distance,
  ergonomicDistance,
} from "./utils";
import { chordButtonRecipeResult } from "./searchChordButtonsOnly";
import { registralPreferenceAdjustment } from "./registralPreference";
import { analyzeVoicingDensity, extendedVoicingDensityPenalty, passesNominalGapFilter, type MinimumNominalGap } from "./voicingDensity";
import { analyzeConfiguredStradellaVoicing, DEFAULT_STRADELLA_REGISTER_MODEL, type StradellaRegisterModel } from "./registerModel";

type RankedRealization = {
  result: StradellaChordFinderResult;
  exact: boolean;
  mixed: boolean;
  buttonCount: number;
  compactness: number;
  approximationPenalty: number;
  recommended?: boolean;
};

// Dimensionless ergonomic cost per adjacent Stradella column. The factor
// balances physical reach against button count and harmonic completeness;
// scaling the diagram must not change a musical recommendation.
const COMPACTNESS_WEIGHT_PER_COLUMN = 2.58;
// Float rounding in scaled x/y coordinates must not break genuine geometric ties.
const GEOMETRY_EPSILON = 1e-9;

function compareMetric(a: number, b: number) {
  const difference = a - b;
  return Math.abs(difference) <= GEOMETRY_EPSILON ? 0 : difference;
}

function physicalKey(buttons: DiagramButton[]) {
  return buttons.map((button) => button.id).sort().join("|");
}

function compactness(buttons: DiagramButton[], columnSpacing: number) {
  const pairDistances: number[] = [];
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      pairDistances.push(ergonomicDistance(buttons[i], buttons[j]));
    }
  }
  if (pairDistances.length === 0) return 0;
  const maximum = Math.max(...pairDistances);
  const mean = pairDistances.reduce((sum, value) => sum + value, 0) / pairDistances.length;
  // The furthest reach dominates ergonomics, while mean pair spacing breaks
  // ties in favor of a tighter hand cluster. This is a purely physical score;
  // equivalent bass/counterbass pitches remain harmonically identical.
  // Dimensionless: the same physical button recipe scores identically at any
  // diagram button size or uniform spacing scale.
  return (maximum + mean * 0.25) / columnSpacing;
}

// Use the spacing between adjacent chord columns to obtain a layout-independent
// maximum comfortable span. Very distant chord combinations are not playable
// merely because they contain the correct pitch classes.
function adjacentColumnSpacing(pool: DiagramButton[]) {
  const distances = pool.flatMap((a) => pool
    .filter((b) => b.kind === a.kind && Math.abs(b.column - a.column) === 1)
    .map((b) => distance(a, b)));
  const spacing = Math.min(...distances.filter((value) => value > 0));
  return Number.isFinite(spacing) ? spacing : 0;
}

export function ergonomicSpanLimit(pool: DiagramButton[], spanColumns = 5.5) {
  // The previous 3.2-column cutoff excluded most musically distinct
  // combinations, particularly across bass and chord rows. Allow a moderate
  // five-and-a-half-column diagonal reach, while retaining a hard cap.
  const spacing = adjacentColumnSpacing(pool);
  return spacing > 0 ? spacing * spanColumns : Infinity;
}

function practicalCombination(buttons: DiagramButton[], limit: number) {
  if (new Set(buttons.map((button) => button.id)).size !== buttons.length) return false;
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      if (ergonomicDistance(buttons[i], buttons[j]) > limit) return false;
    }
  }
  return true;
}

// Removing any selected button must lose at least one pitch class. Otherwise
// duplicated chord buttons inflate counts without adding any musical value.
function hasRedundantButton(buttons: DiagramButton[]) {
  const all = new Set(combinationTones(buttons));
  return buttons.some((_, i) => {
    const without = new Set(combinationTones(buttons.filter((__, j) => i !== j)));
    return all.size === without.size && [...all].every((tone) => without.has(tone));
  });
}

// A single root bass (or explicitly requested bass) can reinforce a pitch
// class already present in preset chord buttons without being acoustically redundant: bass and preset chords
// occupy different reed roles. This narrowly scoped exception does not allow
// extra chord buttons or duplicate/non-root bass buttons to become redundant.
/** Distinguish a useful root-bass register from genuinely redundant notes:
 * exactly one harmonically requested reinforcing bass may accompany chord
 * buttons; extra chord or other bass buttons do not get that exception. */
function hasUnnecessaryButton(buttons: DiagramButton[], reinforcingPitch: string) {
  const bassButtons = buttons.filter(isBassButton);
  const chordButtons = buttons.filter((button) => !isBassButton(button));
  const permittedRootBass = bassButtons.length === 1 && chordButtons.length > 0 &&
    bassButtons[0].pitchClass === reinforcingPitch && combinationTones(chordButtons).includes(reinforcingPitch)
    ? bassButtons[0]
    : undefined;
  const all = new Set(combinationTones(buttons));
  return buttons.some((button, index) => {
    const without = new Set(combinationTones(buttons.filter((_, j) => index !== j)));
    const isRedundant = all.size === without.size && [...all].every((tone) => without.has(tone));
    return isRedundant && button.id !== permittedRootBass?.id;
  });
}

function bassCandidatesForPitch(buttons: DiagramButton[], pitch: string) {
  return buttons.filter((button) => isBassButton(button) && button.pitchClass === pitch);
}

function bestBassForCluster(
  buttons: DiagramButton[],
  pitch: string,
  cluster: DiagramButton[],
  rootReference: DiagramButton | undefined,
  usedIds: Set<string>,
  reachLimit: number,
) {
  const candidates = bassCandidatesForPitch(buttons, pitch).filter((button) =>
    !usedIds.has(button.id) && practicalCombination([...cluster, button], reachLimit),
  );
  return [...candidates].sort((a, b) => {
    const clusterDistance = (candidate: DiagramButton) =>
      cluster.length > 0
        ? cluster.reduce((sum, other) => sum + ergonomicDistance(candidate, other), 0) / cluster.length
        : rootReference
          ? ergonomicDistance(candidate, rootReference)
          : 0;
    const d = clusterDistance(a) - clusterDistance(b);
    if (Math.abs(d) > 0.001) return d;
    /* When equally ergonomic, counterbass is useful in mixed voicings because it
       often keeps the hand beside the chord-row button instead of at the root. */
    if (a.kind !== b.kind) return a.kind === "bass-counterbass" ? -1 : 1;
    return a.column - b.column || a.row - b.row;
  })[0];
}

function buttonLabel(button: DiagramButton) {
  if (isBassButton(button)) {
    const row = button.kind === "bass-counterbass" ? "counterbass" : "bass";
    return `${button.pitchClass ?? "?"} ${row}`;
  }
  return `${button.chordRoot ?? "?"} ${chordKindLabel(button.kind)}`.trim();
}

function resultForCombination(
  selected: DiagramButton[],
  chordButtons: DiagramButton[],
  bassButtons: DiagramButton[],
  targetPitches: string[],
  exact: boolean,
): StradellaChordFinderResult {
  const summary = summarizeResult(selected, targetPitches);
  const description = exact
    ? "Exact mixed Stradella realization."
    : "Idiomatic Stradella approximation.";
  const details = selected.map(buttonLabel).join(" + ");
  const omissions = summary.missingPitches.length ? ` Omits: ${summary.missingPitches.join(", ")}.` : "";
  const additions = summary.extraPitches.length ? ` Adds: ${summary.extraPitches.join(", ")}.` : "";
  const result = resultFromButtons(
    selected,
    selected,
    chordButtons[0] ? [chordButtons[0].id] : bassButtons[0] ? [bassButtons[0].id] : [],
    [],
    targetPitches,
    description,
    `Selected ${details}.${omissions}${additions}`,
  );
  if (!exact) {
    return { ...result, playable: true, exact: false };
  }
  return result;
}

function isAcceptableApproximation(
  root: string,
  pattern: FinderChordPattern,
  targetPitches: string[],
  selected: DiagramButton[],
) {
  const summary = summarizeResult(selected, targetPitches);
  if (summary.exact) return false;
  if (summary.extraPitches.length > 0) return false;
  if (summary.missingPitches.length === 0) return false;

  // The conventional Stradella diminished-7 button omits the diminished
  // fifth. Although altered fifths are normally defining, this familiar
  // three-tone button is useful enough to list explicitly as approximate.
  if (pattern === "diminished7" && selected.length === 1 &&
      selected[0].kind === "chord-diminished7" && selected[0].chordRoot === root) {
    return summary.missingPitches.length === 1 &&
      summary.missingPitches[0] === transpose(root, 6);
  }
  if (!permittedMissingTones(root, pattern, summary.missingPitches)) return false;
  // A third omission in an 11th is only a suspended-style voicing while the 11th remains.
  return !suspendedStyleOmission(root, pattern, summary.missingPitches) ||
    summary.coveredPitches.includes(transpose(root, 17));
}

function approximationPenalty(root: string, pattern: FinderChordPattern, targetPitches: string[], selected: DiagramButton[]) {
  return omissionPenalty(root, pattern, summarizeResult(selected, targetPitches).missingPitches);
}

function realizationKey(result: StradellaChordFinderResult) {
  // Distinct pitches or chord-button recipes remain distinct, but alternate
  // physical bass/counterbass locations for the same pitch share a key.
  return result.playbackButtons.map((button) =>
    isBassButton(button)
      ? `bass:${button.pitchClass}`
      : `${button.kind}:${button.chordRoot}`,
  ).sort().join("|");
}

/** Generate physical recipes, validate pitch classes/omissions, enforce
 * ergonomics, and rank without discarding other valid realizations. Only
 * the optional Recommended shortlist is capped at three. */
export function bassAndChordResults(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
  maxButtons = 3,
  spanColumns = 5.5,
  requestedBass: string | null = null,
  registerModel: StradellaRegisterModel = DEFAULT_STRADELLA_REGISTER_MODEL,
  minimumNominalGap: MinimumNominalGap = 0,
): StradellaChordFinderResult[] {
  const rootReference = chooseRootReference(buttons, root);
  const targetSet = new Set(targetPitches);
  const pool = chordButtonPool(buttons);
  const ranked: RankedRealization[] = [];
  const columnSpacing = adjacentColumnSpacing(pool);
  // Standard layouts always contain adjacent columns; retain a finite metric
  // for degenerate caller-provided diagrams with no measurable column spacing.
  const compactnessUnit = columnSpacing > 0 ? columnSpacing : 1;
  const reachLimit = columnSpacing > 0 ? columnSpacing * spanColumns : Infinity;

  /* Exact candidates. A chord-button cluster is completed with only the missing
     bass notes. Bass choice is based on proximity to the chord cluster, which
     produces practical pairs such as E counterbass + G major for Em7. */
  const exactChordPool = pool.filter((button) => buttonTones(button).every((tone) => targetSet.has(tone)));
  for (const chordButtons of chordCombinations(exactChordPool, Math.min(4, maxButtons))) {
    if (hasRedundantButton(chordButtons)) continue;
    const chordTones = combinationTones(chordButtons);
    const missing = targetPitches.filter((pitch) => !chordTones.includes(pitch));
    const used = new Set<string>();
    const bassButtons: DiagramButton[] = [];
    let possible = true;
    for (const pitch of missing) {
      const bass = bestBassForCluster(buttons, pitch, [...chordButtons, ...bassButtons], rootReference, used, reachLimit);
      if (!bass) { possible = false; break; }
      bassButtons.push(bass);
      used.add(bass.id);
    }
    if (!possible) continue;
    const selected = [...bassButtons, ...chordButtons];
    if (selected.length > maxButtons || !practicalCombination(selected, reachLimit) || hasRedundantButton(selected)) continue;
    const summary = summarizeResult(selected, targetPitches);
    if (!summary.exact) continue;
    ranked.push({
      result: resultForCombination(selected, chordButtons, bassButtons, targetPitches, true),
      exact: true,
      mixed: chordButtons.length > 0 && bassButtons.length > 0,
      buttonCount: selected.length,
      compactness: compactness(selected, compactnessUnit),
      approximationPenalty: 0,
    });
  }

  /* Bass/counterbass-only realization. This is also allowed in mixed mode:
     choose one sounding bass note per target pitch, and find a compact cluster
     rather than greedily committing to a remote fundamental/counterbass choice.
     A full bass-only recipe is exact by construction; unlike chord-button
     recipes it will typically require three or more buttons. */
  {
    const bassGroups = targetPitches.map((pitch) => bassCandidatesForPitch(buttons, pitch));
    if (bassGroups.length <= maxButtons && bassGroups.every((group) => group.length > 0)) {
      const best: { buttons?: DiagramButton[] } = {};
      let bestScore = Infinity;
      let bestReferenceDistance = Infinity;
      let bestPhysicalKey = "";
      const visit = (index: number, selected: DiagramButton[]) => {
        if (index === bassGroups.length) {
          const score = compactness(selected, compactnessUnit);
          // Equivalent clusters may have identical physical spread but differ
          // in their position on the diagram. Prefer the one near the requested
          // chord's root reference, then break true ties by stable button IDs.
          const referenceDistance = rootReference
            ? selected.reduce((sum, button) => sum + ergonomicDistance(button, rootReference), 0) / compactnessUnit
            : 0;
          const selectionKey = physicalKey(selected);
          const costDifference = compareMetric(score, bestScore);
          if (costDifference < 0 || (costDifference === 0 &&
              (compareMetric(referenceDistance, bestReferenceDistance) < 0 ||
                (compareMetric(referenceDistance, bestReferenceDistance) === 0 && selectionKey < bestPhysicalKey)))) {
            bestScore = score;
            bestReferenceDistance = referenceDistance;
            bestPhysicalKey = selectionKey;
            best.buttons = [...selected];
          }
          return;
        }
        for (const candidate of bassGroups[index]) {
          if (!practicalCombination([...selected, candidate], reachLimit)) continue;
          selected.push(candidate);
          visit(index + 1, selected);
          selected.pop();
        }
      };
      visit(0, []);
      if (best.buttons) {
        const selected = best.buttons;
        ranked.push({
          result: resultForCombination(selected, [], selected, targetPitches, true),
          exact: true,
          mixed: false,
          buttonCount: selected.length,
          compactness: compactness(selected, compactnessUnit),
          approximationPenalty: 0,
        });
      }
    }
  }

  /* Keep the established chord-only recipe as an alternative, but do not let it
     outrank a compact exact mixed realization in this mode. */
  const chordOnly = chordButtonRecipeResult(buttons, root, targetPitches, pattern, false);
  if (chordOnly.playable && chordOnly.playbackButtons.length <= maxButtons && practicalCombination(chordOnly.playbackButtons, reachLimit) && !hasRedundantButton(chordOnly.playbackButtons)) {
    ranked.push({
      result: { ...chordOnly, shortDescription: "Exact chord-buttons-only alternative." },
      exact: true,
      mixed: false,
      buttonCount: chordOnly.playbackButtons.length,
      compactness: compactness(chordOnly.playbackButtons, compactnessUnit),
      approximationPenalty: 0,
    });
  }

  /* Generate useful reduced voicings without adding foreign pitches. A cluster
     can be augmented by multiple bass notes, or none, as long as each button
     contributes a tone and the full selection fits the user's hand span. */
  for (const chordButtons of chordCombinations(pool, Math.min(3, maxButtons))) {
    if (hasRedundantButton(chordButtons) || !practicalCombination(chordButtons, reachLimit)) continue;
    const baseTones = combinationTones(chordButtons);
    if (baseTones.some((pitch) => !targetSet.has(pitch))) continue;
    const missing = targetPitches.filter((pitch) => !baseTones.includes(pitch));
    const collect = (index: number, selected: DiagramButton[], bassButtons: DiagramButton[]) => {
      if (selected.length > maxButtons || !practicalCombination(selected, reachLimit)) return;
      if (index === missing.length) {
        if (hasRedundantButton(selected) || !isAcceptableApproximation(root, pattern, targetPitches, selected)) return;
        ranked.push({
          result: resultForCombination(selected, chordButtons, bassButtons, targetPitches, false),
          exact: false,
          mixed: bassButtons.length > 0 && chordButtons.length > 0,
          buttonCount: selected.length,
          compactness: compactness(selected, compactnessUnit),
          approximationPenalty: approximationPenalty(root, pattern, targetPitches, selected),
        });
        return;
      }
      const pitch = missing[index];
      if (pitch === undefined) return;
      // Omitting this pitch is allowed only when the final omission policy permits it.
      collect(index + 1, selected, bassButtons);
      if (selected.length >= maxButtons) return;
      const bass = bestBassForCluster(buttons, pitch, selected, rootReference,
        new Set(selected.map((item) => item.id)), reachLimit);
      if (bass) collect(index + 1, [...selected, bass], [...bassButtons, bass]);
    };
    collect(0, [...chordButtons], []);
  }

  /* First validate conventional candidates under the existing strict
     redundancy rule. Root reinforcement is an *addition* to this set, not a
     relaxation of the harmonic rules governing ordinary combinations. */
  const validRanked = ranked.filter((item) => {
    const summary = summarizeResult(item.result.playbackButtons, targetPitches);
    if (item.buttonCount > maxButtons || summary.extraPitches.length > 0 || !practicalCombination(item.result.playbackButtons, reachLimit) || hasRedundantButton(item.result.playbackButtons)) return false;
    if (item.exact) return summary.exact;
    return isAcceptableApproximation(root, pattern, targetPitches, item.result.playbackButtons);
  });

  /* Preserve one useful *registral* addition even when it does not
     contribute another pitch class. Start only from valid chord-button-only
     recipes: this makes the new role unambiguous and avoids accumulating two
     independent bass notes. Select the nearest playable root bass/counterbass
     position; equivalent physical root buttons are consolidated by recipe
     below. No new harmonic approximations or altered-chord omissions arise. */
  const reinforced: RankedRealization[] = [];
  for (const item of validRanked) {
    const chords = item.result.playbackButtons;
    const reinforcingPitch = requestedBass ?? root;
    if (item.buttonCount >= maxButtons || chords.length === 0 ||
        chords.some(isBassButton) || !combinationTones(chords).includes(reinforcingPitch)) continue;
    const bass = bestBassForCluster(buttons, reinforcingPitch, chords, rootReference,
      new Set(chords.map((button) => button.id)), reachLimit);
    if (!bass) continue;
    const selected = [bass, ...chords];
    if (hasUnnecessaryButton(selected, reinforcingPitch)) continue;
    reinforced.push({
      result: resultForCombination(selected, chords, [bass], targetPitches, item.exact),
      exact: item.exact,
      mixed: true,
      buttonCount: selected.length,
      compactness: compactness(selected, compactnessUnit),
      approximationPenalty: item.approximationPenalty,
    });
  }
  validRanked.push(...reinforced);

  /* Explicit slash bass is a modeled inversion constraint, not a cosmetic
     score bonus. Keep only candidates whose lowest nominal sounding pitch
     matches the requested bass. Do this BEFORE choosing Recommended items. */
  const eligible = validRanked.filter((item) => {
    const voicing = analyzeConfiguredStradellaVoicing(item.result.playbackButtons, root, registerModel);
    return (requestedBass === null || voicing.lowestPitchClass === requestedBass) &&
      passesNominalGapFilter(voicing.notes, minimumNominalGap);
  });

  // Recommendation is a curated shortlist, not an exhaustive ranking label.
  // Distinct exact physical recipes remain eligible even when they produce the
  // same pitch-class set. Favor compactness, few buttons, and clear function.
  const is13 = ["dominant13", "major13", "minor13"].includes(pattern);
  const isConventionalShell = (item: RankedRealization) => is13 &&
    [7, 14, 17].every((interval) => item.result.missingPitches.includes(transpose(root, interval))) &&
    [0, pattern === "minor13" ? 3 : 4, pattern === "major13" ? 11 : 10, 21]
      .every((interval) => item.result.coveredPitches.includes(transpose(root, interval)));

  const registralAdjustment = (item: RankedRealization) => {
    if (requestedBass === null) return registralPreferenceAdjustment(item.result.registral);
    // A matching bass button is helpful but not worth another button by itself.
    return item.result.registral.bassPitchClasses.length === 1 &&
      item.result.registral.bassPitchClasses[0] === requestedBass &&
      item.result.registral.chordButtonCount > 0 ? -1 : 0;
  };
  const extended = isExtendedChord(pattern);
  const preferenceScore = (item: RankedRealization) => {
    // Three/four tones retain completeness-first evaluation; extended chords
    // can prefer a clearer permitted reduction to a crowded exact voicing.
    const cost = item.buttonCount * 3 + item.compactness * COMPACTNESS_WEIGHT_PER_COLUMN +
      item.approximationPenalty * 0.9 + (!extended && item.exact ? -1 : 0);
    const modeledNotes = analyzeConfiguredStradellaVoicing(
      item.result.playbackButtons, root, registerModel,
    ).notes;
    const densityCost = extended ? extendedVoicingDensityPenalty(modeledNotes)
      : analyzeVoicingDensity(modeledNotes).penalty;
    const reductionCost = item.exact || isConventionalShell(item) ? 0 :
      item.result.missingPitches.length * (extended ? 0.45 : 1.25);
    return cost + densityCost + reductionCost - (isConventionalShell(item) ? 0.75 : 0) +
      registralAdjustment(item);
  };
  const key = (item: RankedRealization) => realizationKey(item.result);
  const comparePreference = (a: RankedRealization, b: RankedRealization) =>
    compareMetric(preferenceScore(a), preferenceScore(b)) || key(a).localeCompare(key(b));
  const candidatesByRecipe = new Map<string, RankedRealization>();
  for (const item of eligible) {
    const previous = candidatesByRecipe.get(key(item));
    if (!previous || compareMetric(preferenceScore(item), preferenceScore(previous)) < 0 ||
        (compareMetric(preferenceScore(item), preferenceScore(previous)) === 0 &&
          physicalKey(item.result.playbackButtons) < physicalKey(previous.result.playbackButtons))) {
      candidatesByRecipe.set(key(item), item);
    }
  }
  const distinct = [...candidatesByRecipe.values()];

  if (isExtendedChord(pattern)) {
    type Strategy = "complete" | "minimally-reduced" | "functional-shell" | "alternative";
    const strategy = (item: RankedRealization): Strategy => {
      if (item.exact) return "complete";
      if (isConventionalShell(item)) return "functional-shell";
      if (item.result.missingPitches.length <= 2) return "minimally-reduced";
      return "alternative";
    };
    const sorted = [...distinct].sort(comparePreference);
    const preferred: RankedRealization[] = [];
    const bestScore = sorted[0] ? preferenceScore(sorted[0]) : Infinity;
    // Include contrasting harmonic approaches before filling the remaining
    // places with another well-ranked physical realization (which can be exact).
    for (const kind of ["complete", "minimally-reduced", "functional-shell"] as Strategy[]) {
      const candidate = sorted.find((item) => strategy(item) === kind);
      if (candidate && preferenceScore(candidate) <= bestScore + 3.5 + GEOMETRY_EPSILON) preferred.push(candidate);
    }
    for (const candidate of sorted) {
      if (preferred.length >= 3) break;
      if (preferred.includes(candidate)) continue;
      // Do not recommend a much less convenient alternative just to reach 3.
      if (preferenceScore(candidate) <= bestScore + 2.75 + GEOMETRY_EPSILON) preferred.push(candidate);
    }
    for (const item of preferred.slice(0, 3)) {
      item.recommended = true;
      const count = item.buttonCount;
      const span = "compact physical grouping";
      const kind = strategy(item);
      item.result.recommendationReason = kind === "complete"
        ? `It retains every chord tone using ${count} buttons; nominal pitch spacing and physical reach also inform its ranking.`
        : kind === "minimally-reduced"
          ? `It omits ${item.result.missingPitches.length} permitted ${item.result.missingPitches.length === 1 ? "tone" : "tones"} and uses ${count} buttons. Nominal register spacing and reach inform its ranking.`
          : kind === "functional-shell"
            ? `It preserves root, third, seventh, and thirteenth in ${count} buttons, avoiding the extra density of fifth, ninth, and eleventh.`
            : `It offers another useful physical combination with ${count} buttons and a ${span}; its button recipe is distinct from the other recommended examples.`;
      if (registralAdjustment(item) < 0) {
        item.result.recommendationReason +=
          requestedBass === null
            ? ` A separate bass/counterbass button also reinforces ${root}; sounding octaves depend on registration.`
            : ` A separate bass/counterbass button supports the requested ${requestedBass} bass; sounding octaves depend on registration.`;
      }
    }
  }
  distinct.sort((a, b) => {
    if (Boolean(a.recommended) !== Boolean(b.recommended)) return a.recommended ? -1 : 1;
    if (a.recommended && b.recommended) return comparePreference(a, b);
    if (extended) return comparePreference(a, b);
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    if (a.approximationPenalty !== b.approximationPenalty) return a.approximationPenalty - b.approximationPenalty;
    if (a.buttonCount !== b.buttonCount) return a.buttonCount - b.buttonCount;
    if (a.mixed !== b.mixed) return a.mixed ? -1 : 1;
    // In nonextended chords, preserve exactness, fewer buttons, and mixed-mode
    // preferences before the limited root-support tie-break. Using the same
    // normalized score keeps this independent of the diagram's pixel size.
    return compareMetric(
      a.compactness * COMPACTNESS_WEIGHT_PER_COLUMN + registralAdjustment(a) +
        analyzeVoicingDensity(analyzeConfiguredStradellaVoicing(a.result.playbackButtons, root, registerModel).notes).penalty,
      b.compactness * COMPACTNESS_WEIGHT_PER_COLUMN + registralAdjustment(b) +
        analyzeVoicingDensity(analyzeConfiguredStradellaVoicing(b.result.playbackButtons, root, registerModel).notes).penalty,
    ) || key(a).localeCompare(key(b));
  });

  /* One most-ergonomic physical button set per musical recipe. Keep all
     unique exact and valid approximate recipes; no arbitrary count limit. */
  const results: StradellaChordFinderResult[] = distinct.map((item) => ({
    ...item.result,
    recommended: Boolean(item.recommended),
  }));

  return results.length > 0
    ? results
    : [notPlayableResult(
        targetPitches,
        minimumNominalGap > 0 ? "No realization matches the nominal spacing filter." : requestedBass ? `No realization for requested bass ${requestedBass}.` : "No practical bass-and-chord-button realization.",
        minimumNominalGap > 0
          ? `All candidates contain neighboring nominal notes closer than ${minimumNominalGap} semitones, or fail the other selected constraints. Relax the spacing filter or adjust the register settings.`
          : requestedBass
            ? `No valid realization places ${requestedBass} lowest under the configured nominal register ranges and current reach/button limits. Try a different register setting or increase the reach/button limit.`
            : "No exact or close Stradella realization was found with the visible bass and chord rows.",
      )];
}

export function bassAndChordResult(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
  requestedBass: string | null = null,
  registerModel: StradellaRegisterModel = DEFAULT_STRADELLA_REGISTER_MODEL,
): StradellaChordFinderResult {
  return bassAndChordResults(buttons, root, targetPitches, pattern, 3, 5.5, requestedBass, registerModel)[0];
}
