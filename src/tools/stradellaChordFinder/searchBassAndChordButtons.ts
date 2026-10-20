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
} from "./utils";
import { chordButtonRecipeResult } from "./searchChordButtonsOnly";

type RankedRealization = {
  result: StradellaChordFinderResult;
  exact: boolean;
  mixed: boolean;
  buttonCount: number;
  compactness: number;
  approximationPenalty: number;
  recommended?: boolean;
};

function compactness(buttons: DiagramButton[]) {
  const pairDistances: number[] = [];
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      pairDistances.push(distance(buttons[i], buttons[j]));
    }
  }
  if (pairDistances.length === 0) return 0;
  const maximum = Math.max(...pairDistances);
  const mean = pairDistances.reduce((sum, value) => sum + value, 0) / pairDistances.length;
  // The furthest reach dominates ergonomics, while mean pair spacing breaks
  // ties in favor of a tighter hand cluster. This is a purely physical score;
  // equivalent bass/counterbass pitches remain harmonically identical.
  return maximum + mean * 0.25;
}

// Use the spacing between adjacent chord columns to obtain a layout-independent
// maximum comfortable span. Very distant chord combinations are not playable
// merely because they contain the correct pitch classes.
export function ergonomicSpanLimit(pool: DiagramButton[], spanColumns = 5.5) {
  const distances = pool.flatMap((a) => pool
    .filter((b) => b.kind === a.kind && Math.abs(b.column - a.column) === 1)
    .map((b) => distance(a, b)));
  const spacing = Math.min(...distances.filter((value) => value > 0));
  // The previous 3.2-column cutoff excluded most musically distinct
  // combinations, particularly across bass and chord rows. Allow a moderate
  // five-and-a-half-column diagonal reach, while retaining a hard cap.
  return Number.isFinite(spacing) ? spacing * spanColumns : Infinity;
}

function practicalCombination(buttons: DiagramButton[], limit: number) {
  if (new Set(buttons.map((button) => button.id)).size !== buttons.length) return false;
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      if (distance(buttons[i], buttons[j]) > limit) return false;
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
        ? cluster.reduce((sum, other) => sum + distance(candidate, other), 0) / cluster.length
        : rootReference
          ? distance(candidate, rootReference)
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

export function bassAndChordResults(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
  maxButtons = 3,
  spanColumns = 5.5,
): StradellaChordFinderResult[] {
  const rootReference = chooseRootReference(buttons, root);
  const targetSet = new Set(targetPitches);
  const pool = chordButtonPool(buttons);
  const ranked: RankedRealization[] = [];
  const reachLimit = ergonomicSpanLimit(pool, spanColumns);

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
      compactness: compactness(selected),
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
      const visit = (index: number, selected: DiagramButton[]) => {
        if (index === bassGroups.length) {
          const score = compactness(selected);
          if (score < bestScore) {
            bestScore = score;
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
          compactness: compactness(selected),
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
      compactness: compactness(chordOnly.playbackButtons),
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
          compactness: compactness(selected),
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

  /* Final musical invariant. Candidate generators and fixed recipes may evolve
     independently, so enforce the public mixed-mode contract once more here:
     no returned playable realization may contain a pitch outside the requested
     chord. Non-exact results must also satisfy the conservative omission rule. */
  const validRanked = ranked.filter((item) => {
    const summary = summarizeResult(item.result.playbackButtons, targetPitches);
    if (item.buttonCount > maxButtons || summary.extraPitches.length > 0 || !practicalCombination(item.result.playbackButtons, reachLimit) || hasRedundantButton(item.result.playbackButtons)) return false;
    if (item.exact) return summary.exact;
    return isAcceptableApproximation(root, pattern, targetPitches, item.result.playbackButtons);
  });

  // Recommendation is a curated shortlist, not an exhaustive ranking label.
  // Distinct exact physical recipes remain eligible even when they produce the
  // same pitch-class set. Favor compactness, few buttons, and clear function.
  const is13 = ["dominant13", "major13", "minor13"].includes(pattern);
  const hasThirdAndEleventh = ["dominant11", "major11", "dominant13", "major13"].includes(pattern);
  const isConventionalShell = (item: RankedRealization) => is13 &&
    [7, 14, 17].every((interval) => item.result.missingPitches.includes(transpose(root, interval))) &&
    [0, pattern === "minor13" ? 3 : 4, pattern === "major13" ? 11 : 10, 21]
      .every((interval) => item.result.coveredPitches.includes(transpose(root, interval)));
  const hasDenseEleventh = (item: RankedRealization) => hasThirdAndEleventh &&
    item.result.coveredPitches.includes(transpose(root, 4)) &&
    item.result.coveredPitches.includes(transpose(root, 17));

  const preferenceScore = (item: RankedRealization) => {
    // A button carries more ergonomic cost than a modest change in spacing.
    // An omitted ordinary fifth is inexpensive, while losing the 3rd in an
    // eleventh remains a clearly labeled suspended-style choice.
    const cost = item.buttonCount * 3 + item.compactness * 0.05 +
      item.approximationPenalty * 0.9 + (item.exact ? -1 : 0);
    const densityCost = hasDenseEleventh(item) ? 1.5 : 0;
    // Prefer a one-tone omission to a two-tone omission when ergonomic costs
    // are comparable. Standard 1-3-7-13 shells are a separate strategy.
    const reductionCost = item.exact || isConventionalShell(item) ? 0 : item.result.missingPitches.length * 1.25;
    // A useful thirteenth shell gets a small preference, never an automatic
    // eight-point victory over a more compact near-complete realization.
    return cost + densityCost + reductionCost - (isConventionalShell(item) ? 1.25 : 0);
  };
  const key = (item: RankedRealization) => realizationKey(item.result);
  const candidatesByRecipe = new Map<string, RankedRealization>();
  for (const item of validRanked) {
    const previous = candidatesByRecipe.get(key(item));
    if (!previous || preferenceScore(item) < preferenceScore(previous)) {
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
    const sorted = [...distinct].sort((a, b) => preferenceScore(a) - preferenceScore(b));
    const preferred: RankedRealization[] = [];
    const bestScore = sorted[0] ? preferenceScore(sorted[0]) : Infinity;
    // Include contrasting harmonic approaches before filling the remaining
    // places with another well-ranked physical realization (which can be exact).
    for (const kind of ["complete", "minimally-reduced", "functional-shell"] as Strategy[]) {
      const candidate = sorted.find((item) => strategy(item) === kind);
      if (candidate && preferenceScore(candidate) <= bestScore + 3.5) preferred.push(candidate);
    }
    for (const candidate of sorted) {
      if (preferred.length >= 3) break;
      if (preferred.includes(candidate)) continue;
      // Do not recommend a much less convenient alternative just to reach 3.
      if (preferenceScore(candidate) <= bestScore + 2.75) preferred.push(candidate);
    }
    for (const item of preferred.slice(0, 3)) {
      item.recommended = true;
      const count = item.buttonCount;
      const span = "compact physical grouping";
      const kind = strategy(item);
      item.result.recommendationReason = kind === "complete"
        ? `It contains all required pitch classes with ${count} buttons and a ${span}. It is a compact example of a complete voicing, although all extended tones occupy the Stradella's limited registers.`
        : kind === "minimally-reduced"
          ? `It omits only ${item.result.missingPitches.length} permitted ${item.result.missingPitches.length === 1 ? "tone" : "tones"} and uses ${count} buttons. This balances relatively complete harmony with a compact physical arrangement.`
          : kind === "functional-shell"
            ? `It preserves root, third, seventh, and thirteenth in ${count} buttons, avoiding the extra density of fifth, ninth, and eleventh.`
            : `It offers another useful physical combination with ${count} buttons and a ${span}; its button recipe is distinct from the other recommended examples.`;
    }
  }
  distinct.sort((a, b) => {
    if (Boolean(a.recommended) !== Boolean(b.recommended)) return a.recommended ? -1 : 1;
    if (a.recommended && b.recommended) return preferenceScore(a) - preferenceScore(b);
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    if (a.approximationPenalty !== b.approximationPenalty) return a.approximationPenalty - b.approximationPenalty;
    if (a.buttonCount !== b.buttonCount) return a.buttonCount - b.buttonCount;
    if (a.mixed !== b.mixed) return a.mixed ? -1 : 1;
    return a.compactness - b.compactness;
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
        "No practical bass-and-chord-button realization.",
        "No exact or close Stradella realization was found with the visible bass and chord rows.",
      )];
}

export function bassAndChordResult(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
): StradellaChordFinderResult {
  return bassAndChordResults(buttons, root, targetPitches, pattern)[0];
}
