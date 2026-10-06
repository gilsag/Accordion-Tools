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
  let max = 0;
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      max = Math.max(max, distance(buttons[i], buttons[j]));
    }
  }
  return max;
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
) {
  const candidates = bassCandidatesForPitch(buttons, pitch).filter((button) => !usedIds.has(button.id));
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
  /* Keep approximation rules deliberately conservative. On Stradella, the
     natural fifth is the conventional expendable chord tone; chord-defining
     tones (third, seventh, altered fifth, sixth, ninth, eleventh, etc.) must
     remain present. */
  const intervals = intervalsForChordFinder(pattern);
  return new Set(intervals.some((interval) => interval % 12 === 7) ? [transpose(root, 7)] : []);
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

  const omissible = omissibleApproximationPitches(root, pattern);
  return summary.missingPitches.every((pitch) => omissible.has(pitch));
}

function approximationPenalty(targetPitches: string[], selected: DiagramButton[]) {
  const summary = summarizeResult(selected, targetPitches);
  return summary.missingPitches.length;
}

function realizationKey(result: StradellaChordFinderResult) {
  return result.playbackButtons.map((button) => button.id).sort().join("|");
}

export function bassAndChordResults(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
  maxResults = 5,
): StradellaChordFinderResult[] {
  const rootReference = chooseRootReference(buttons, root);
  const targetSet = new Set(targetPitches);
  const pool = chordButtonPool(buttons);
  const ranked: RankedRealization[] = [];

  /* Exact candidates. A chord-button cluster is completed with only the missing
     bass notes. Bass choice is based on proximity to the chord cluster, which
     produces practical pairs such as E counterbass + G major for Em7. */
  const exactChordPool = pool.filter((button) => buttonTones(button).every((tone) => targetSet.has(tone)));
  for (const chordButtons of chordCombinations(exactChordPool, 3)) {
    const chordTones = combinationTones(chordButtons);
    const missing = targetPitches.filter((pitch) => !chordTones.includes(pitch));
    const used = new Set<string>();
    const bassButtons: DiagramButton[] = [];
    let possible = true;
    for (const pitch of missing) {
      const bass = bestBassForCluster(buttons, pitch, [...chordButtons, ...bassButtons], rootReference, used);
      if (!bass) { possible = false; break; }
      bassButtons.push(bass);
      used.add(bass.id);
    }
    if (!possible) continue;
    const selected = [...bassButtons, ...chordButtons];
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

  /* Keep the established chord-only recipe as an alternative, but do not let it
     outrank a compact exact mixed realization in this mode. */
  const chordOnly = chordButtonRecipeResult(buttons, root, targetPitches, pattern, false);
  if (chordOnly.playable) {
    ranked.push({
      result: { ...chordOnly, shortDescription: "Exact chord-buttons-only alternative." },
      exact: true,
      mixed: false,
      buttonCount: chordOnly.playbackButtons.length,
      compactness: compactness(chordOnly.playbackButtons),
      approximationPenalty: 0,
    });
  }

  /* Idiomatic approximations: use one or two chord buttons, optionally add one
     missing bass tone, but never add foreign pitches. The only permitted
     omission is a natural perfect fifth; chord-defining tones must remain. */
  for (const chordButtons of chordCombinations(pool, 2)) {
    const baseTones = combinationTones(chordButtons);
    const missing = targetPitches.filter((pitch) => !baseTones.includes(pitch));
    const variants: DiagramButton[][] = [[...chordButtons]];
    for (const pitch of missing.slice(0, 2)) {
      const bass = bestBassForCluster(buttons, pitch, chordButtons, rootReference, new Set());
      if (bass) variants.push([bass, ...chordButtons]);
    }
    for (const selected of variants) {
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
    if (summary.extraPitches.length > 0) return false;
    if (item.exact) return summary.exact;
    return isAcceptableApproximation(root, pattern, targetPitches, item.result.playbackButtons);
  });

  validRanked.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    if (a.mixed !== b.mixed) return a.mixed ? -1 : 1;
    if (a.approximationPenalty !== b.approximationPenalty) return a.approximationPenalty - b.approximationPenalty;
    if (a.buttonCount !== b.buttonCount) return a.buttonCount - b.buttonCount;
    return a.compactness - b.compactness;
  });

  const seen = new Set<string>();
  const results: StradellaChordFinderResult[] = [];
  for (const item of validRanked) {
    const key = realizationKey(item.result);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item.result);
    if (results.length >= maxResults) break;
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
  return bassAndChordResults(buttons, root, targetPitches, pattern, 1)[0];
}
