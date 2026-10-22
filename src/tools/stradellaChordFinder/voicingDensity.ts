/** A cautious, register-aware density observation for the *nominal* Stradella model.
 * Close notes are often intentional (major sevenths, clusters, extensions), so
 * they are never invalidated; the recommendation adjustment is deliberately
 * smaller than the cost of one additional physical button. Unison doublings
 * are not dissonant intervals and must be deduplicated before analysis.
 */
import type { ModeledStradellaNote } from "./registerModel";

export type CloseVoicingObservation = {
  /** Single illustrative semitone pair, chosen from the lowest register. */
  closestSemitone: [string, string] | null;
  /** Number of distinct notes in the largest group of whole-tone-or-closer neighbors. */
  clusterSize: number;
  /** Positive, small cost for use in ranking; never a hard validity filter. */
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
  // Do not punish a conventional higher-register semitone by default.
  const penalty = Math.min(1.1, lowPairs * 0.65 + middlePairs * 0.28 +
    (clusterSize >= 4 ? 0.2 : clusterSize >= 3 ? 0.1 : 0));
  const closestSemitone: [string,string] | null = closest
    ? [`${closest[0].pitchClass}${closest[0].octave}`, `${closest[1].pitchClass}${closest[1].octave}`] : null;
  const parts: string[] = [];
  if (closestSemitone) parts.push(`close ${closestSemitone[0]}–${closestSemitone[1]} semitone`);
  if (clusterSize >= 4) parts.push(`${clusterSize}-note close cluster`);
  return { closestSemitone, clusterSize, penalty, note: parts.length ? parts.join('; ') : null };
}
