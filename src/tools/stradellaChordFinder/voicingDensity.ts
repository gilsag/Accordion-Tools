/** A cautious, register-aware density observation for the *nominal* Stradella model.
 * Close notes are often intentional (major sevenths, clusters, extensions), so
 * they remain valid unless an explicit user filter excludes them.
 * Recommendation scoring is independent of harmonic correctness. Unison doublings
 * are not dissonant intervals and must be deduplicated before analysis.
 */
import type { ModeledStradellaNote } from "./registerModel";

export type CloseVoicingObservation = {
  /** Single illustrative semitone pair, chosen from the lowest register. */
  closestSemitone: [string, string] | null;
  /** Number of distinct notes in the largest group of whole-tone-or-closer neighbors. */
  clusterSize: number;
  /** Positive, register-aware cost for use in ranking; never a hard validity filter. */
  penalty: number;
  /** Concise educational description, or null when no notable clustering exists. */
  note: string | null;
};

/** Order matters only for choosing the most informative pair, not harmonic identity. */
export function analyzeVoicingDensity(notes: readonly ModeledStradellaNote[]): CloseVoicingObservation {
  const unique = [...new Map(notes.map((note) => [note.midi, note])).values()]
    .sort((a, b) => a.midi - b.midi);
  const empty: CloseVoicingObservation = { closestSemitone: null, clusterSize: 0, penalty: 0, note: null };
  if (unique.length < 2) return empty;
  const semitones: Array<[typeof unique[number], typeof unique[number]]> = [];
  let clusterSize = 1;
  let running = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const previous = unique[i - 1];
    const current = unique[i];
    const semitonesApart = current.midi - previous.midi;
    if (semitonesApart === 1) semitones.push([previous, current]);
    running = semitonesApart <= 2 ? running + 1 : 1;
    clusterSize = Math.max(clusterSize, running);
  }
  const closest = semitones[0];
  const lowPairs = semitones.filter(([lower]) => lower.midi < 48).length; // Below C3
  const middlePairs = semitones.filter(([lower]) => lower.midi >= 48 && lower.midi < 60).length;
  // A semitone clash has a meaningful ranking cost but does not make a
  // realization harmonically invalid. Keep physical ergonomics independent.
  const highPairs = semitones.length - lowPairs - middlePairs;
  const penalty = Math.min(8, lowPairs * 4 + middlePairs * 3 + highPairs * 1.75 +
    (clusterSize >= 4 ? 0.35 : clusterSize >= 3 ? 0.2 : 0));
  const closestSemitone: [string,string] | null = closest
    ? [`${closest[0].pitchClass}${closest[0].octave}`, `${closest[1].pitchClass}${closest[1].octave}`] : null;
  const parts: string[] = [];
  if (closestSemitone) parts.push(`close ${closestSemitone[0]}–${closestSemitone[1]} semitone`);
  if (clusterSize >= 4) parts.push(`${clusterSize}-note close cluster`);
  return { closestSemitone, clusterSize, penalty, note: parts.length ? parts.join('; ') : null };
}

/** More consequential, register-dependent congestion cost for five-plus-tone
 * chords only. Ranking changes; musical validity and diagram geometry do not.
 * Notes doubled at the same MIDI pitch do not count as adjacent intervals.
 */
export function extendedVoicingDensityPenalty(notes: readonly ModeledStradellaNote[]): number {
  const pitches = [...new Set(notes.map((note) => note.midi))].sort((a, b) => a - b);
  let cost = 0;
  let chain = 1;
  for (let i = 1; i < pitches.length; i += 1) {
    const lower = pitches[i - 1];
    const interval = pitches[i] - lower;
    if (interval === 1) cost += lower < 48 ? 9 : lower < 60 ? 6.5 : 4.5;
    if (interval === 2) cost += lower < 48 ? 1.5 : lower < 60 ? 0.9 : 0.3;
    chain = interval <= 2 ? chain + 1 : 1;
    if (chain >= 3) cost += chain === 3 ? 0.8 : 1.25;
  }
  for (let i = 0; i + 3 < pitches.length; i += 1) {
    if (pitches[i + 3] - pitches[i] <= 6) cost += pitches[i] < 60 ? 1.4 : 0.5;
  }
  return cost;
}

/** Minimum permitted distance between *distinct adjacent nominal MIDI notes*.
 * 0 = no exclusion, 2 = exclude one-semitone gaps, 3 = exclude both 1 and 2.
 * Unison contributions are collapsed and do not count as close intervals. */
export type MinimumNominalGap = 0 | 2 | 3;

export function passesNominalGapFilter(
  notes: readonly ModeledStradellaNote[], minimumGap: MinimumNominalGap,
): boolean {
  if (minimumGap === 0) return true;
  const pitches = [...new Set(notes.map((note) => note.midi))].sort((a, b) => a - b);
  return pitches.every((midi, index) => index === 0 || midi - pitches[index - 1] >= minimumGap);
}
