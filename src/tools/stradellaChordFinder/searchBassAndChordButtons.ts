/* Mixed Stradella search: generate several exact/idiomatic realizations and rank
   genuinely mixed, compact solutions ahead of chord-button-only alternatives. */

import type { DiagramButton, FinderChordPattern } from "../../types";
import { transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
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
function ergonomicSpanLimit(pool: DiagramButton[]) {
  const distances = pool.flatMap((a) => pool
    .filter((b) => b.kind === a.kind && Math.abs(b.column - a.column) === 1)
    .map((b) => distance(a, b)));
  const spacing = Math.min(...distances.filter((value) => value > 0));
  // The previous 3.2-column cutoff excluded most musically distinct
  // combinations, particularly across bass and chord rows. Allow a moderate
  // five-and-a-half-column diagonal reach, while retaining a hard cap.
  return Number.isFinite(spacing) ? spacing * 5.5 : Infinity;
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

function omissibleApproximationPitches(root: string, pattern: FinderChordPattern) {
  // Triads must be complete. Only an unaltered fifth may be dropped in
  // four-or-more-note chords; dominant 11 may also omit its ninth.
  const intervals = intervalsForChordFinder(pattern);
  const allowed = new Set<string>();
  if (intervals.length < 4) return allowed;
  if (intervals.includes(7)) allowed.add(transpose(root, 7));
  if (pattern === "dominant11" && intervals.includes(14)) {
    allowed.add(transpose(root, 14));
  }
  return allowed;
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
  const omissible = omissibleApproximationPitches(root, pattern);
  return summary.missingPitches.every((pitch) => omissible.has(pitch));
}

function approximationPenalty(targetPitches: string[], selected: DiagramButton[]) {
  const summary = summarizeResult(selected, targetPitches);
  return summary.missingPitches.length;
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
): StradellaChordFinderResult[] {
  const rootReference = chooseRootReference(buttons, root);
  const targetSet = new Set(targetPitches);
  const pool = chordButtonPool(buttons);
  const ranked: RankedRealization[] = [];
  const reachLimit = ergonomicSpanLimit(pool);

  /* Exact candidates. A chord-button cluster is completed with only the missing
     bass notes. Bass choice is based on proximity to the chord cluster, which
     produces practical pairs such as E counterbass + G major for Em7. */
  const exactChordPool = pool.filter((button) => buttonTones(button).every((tone) => targetSet.has(tone)));
  for (const chordButtons of chordCombinations(exactChordPool, 3)) {
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
    if (!practicalCombination(selected, reachLimit) || hasRedundantButton(selected)) continue;
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
    if (bassGroups.every((group) => group.length > 0)) {
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
  if (chordOnly.playable && practicalCombination(chordOnly.playbackButtons, reachLimit) && !hasRedundantButton(chordOnly.playbackButtons)) {
    ranked.push({
      result: { ...chordOnly, shortDescription: "Exact chord-buttons-only alternative." },
      exact: true,
      mixed: false,
      buttonCount: chordOnly.playbackButtons.length,
      compactness: compactness(chordOnly.playbackButtons),
      approximationPenalty: 0,
    });
  }

  /* Conservative approximations: no added tones; preserve all triad tones,
     essential chord tones and altered intervals. For dominant 11 the ninth
     may also be omitted. */
  for (const chordButtons of chordCombinations(pool, 2)) {
    if (hasRedundantButton(chordButtons)) continue;
    const baseTones = combinationTones(chordButtons);
    const missing = targetPitches.filter((pitch) => !baseTones.includes(pitch));
    const variants: DiagramButton[][] = [[...chordButtons]];
    for (const pitch of missing.slice(0, 2)) {
      const bass = bestBassForCluster(buttons, pitch, chordButtons, rootReference, new Set(), reachLimit);
      if (bass) variants.push([bass, ...chordButtons]);
    }
    for (const selected of variants) {
      if (!practicalCombination(selected, reachLimit) || hasRedundantButton(selected)) continue;
      if (!isAcceptableApproximation(root, pattern, targetPitches, selected)) continue;
      const bassButtons = selected.filter(isBassButton);
      const chords = selected.filter((button) => !isBassButton(button));
      ranked.push({
        result: resultForCombination(selected, chords, bassButtons, targetPitches, false),
        exact: false,
        mixed: bassButtons.length > 0 && chords.length > 0,
        buttonCount: selected.length,
        compactness: compactness(selected),
        approximationPenalty: approximationPenalty(targetPitches, selected),
      });
    }
  }

  /* Final musical invariant. Candidate generators and fixed recipes may evolve
     independently, so enforce the public mixed-mode contract once more here:
     no returned playable realization may contain a pitch outside the requested
     chord. Non-exact results must also satisfy the conservative omission rule. */
  const validRanked = ranked.filter((item) => {
    const summary = summarizeResult(item.result.playbackButtons, targetPitches);
    if (summary.extraPitches.length > 0 || !practicalCombination(item.result.playbackButtons, reachLimit) || hasRedundantButton(item.result.playbackButtons)) return false;
    if (item.exact) return summary.exact;
    return isAcceptableApproximation(root, pattern, targetPitches, item.result.playbackButtons);
  });

  validRanked.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    if (a.approximationPenalty !== b.approximationPenalty) return a.approximationPenalty - b.approximationPenalty;
    if (a.buttonCount !== b.buttonCount) return a.buttonCount - b.buttonCount;
    if (a.mixed !== b.mixed) return a.mixed ? -1 : 1;
    return a.compactness - b.compactness;
  });

  /* One most-ergonomic physical button set per musical recipe. Keep all
     unique exact and valid approximate recipes; no arbitrary count limit. */
  const seen = new Set<string>();
  const results: StradellaChordFinderResult[] = [];
  for (const item of validRanked) {
    const key = realizationKey(item.result);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item.result);
  }

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
