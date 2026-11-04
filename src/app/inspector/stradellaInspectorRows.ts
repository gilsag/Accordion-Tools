import type { StradellaChordFinderResult } from "../../tools/stradellaChordFinder/results";

export type RealizationFilters = {
  rootInBass: boolean;
  exactOnly: boolean;
  atMostTwo: boolean;
};

/** A presentation-only projection: preserve original engine indices, selection,
 * order, and playable physical button identities. Reference markers in `buttons`
 * are deliberately excluded from all filter predicates. */
export function filterRealizationRows(
  realizations: readonly StradellaChordFinderResult[],
  root: string,
  filters: RealizationFilters,
) {
  return realizations.flatMap((candidate, originalIndex) => {
    if (!candidate.playable) return [];
    const played = candidate.playbackButtons;
    if (filters.rootInBass && !played.some((button) =>
      button.kind.startsWith("bass-") && button.pitchClass === root)) return [];
    if (filters.exactOnly && !candidate.exact) return [];
    if (filters.atMostTwo && played.length > 2) return [];
    return [{ candidate, originalIndex }];
  });
}
