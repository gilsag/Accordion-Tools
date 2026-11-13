/** Pitch assignment for the Rhythm Trainer. This layer is independent of the
 * rhythmic template, the left-hand accompaniment, and Stradella audio registers.
 * Each bar starts a new cycle on the resolved harmonic root/chord quality.
 */
import type { DiagramButton, FinderChordPattern } from "../../types";
import { INDEX_TO_PITCH } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";

export const TREBLE_PITCH_MODES = [
  "root", "root-fifth", "root-third", "triad-up", "triad-down",
  "triad-wave", "broken-chord", "upper-neighbor", "root-octave",
  "root-seventh", "guide-tones", "seventh-up", "seventh-down",
  "seventh-wave", "seventh-ostinato",
] as const;
export type TreblePitchMode = typeof TREBLE_PITCH_MODES[number];

/** The Finder chord definition is authoritative for chord tones, including
 * diminished sevenths (9 semitones), major sevenths (11), and altered fifths.
 * A plain triad has no seventh: use the octave as the fourth arpeggio tone,
 * and the fifth instead of a seventh in two-note guide-tone figures.
 */
function chordSteps(pattern: FinderChordPattern): {third:number;fifth:number;seventh:number|null} {
  const intervals=intervalsForChordFinder(pattern);
  const hasSeventh=/^(?:dominant(?:7|9|11|13)|major(?:7|9|11|13)|minor(?:7|9|11|13)|minorMajor(?:7|9)|diminished7)/.test(pattern);
  return {third:intervals[1]??4,fifth:intervals[2]??7,
    seventh:hasSeventh ? intervals[3]??null : null};
}

export type TreblePitchTarget = {pitchClass: string; octave: number};
/** The octave is a *preferred treble staff/register position*, not a bass
 * register. Example: G4-B4-D5 for an ascending G-major triad. */
export function treblePitchTargets(root: string, pattern: FinderChordPattern,
  mode: TreblePitchMode, count: number): TreblePitchTarget[] {
  const rootIndex = INDEX_TO_PITCH.indexOf(root);
  if (rootIndex < 0) return [];
  const {third, fifth, seventh} = chordSteps(pattern);
  const upper = seventh ?? 12;
  const offsets: number[] = mode === "root-fifth" ? [0, fifth]
    : mode === "root-third" ? [0, third]
    : mode === "triad-up" ? [0, third, fifth]
    : mode === "triad-down" ? [fifth, third, 0]
    : mode === "triad-wave" ? [0, third, fifth, third]
    : mode === "broken-chord" ? [0, fifth, third, fifth]
    : mode === "upper-neighbor" ? [0, 2, 0]
    : mode === "root-octave" ? [0, 12]
    : mode === "root-seventh" ? [0, upper]
    : mode === "guide-tones" ? [third, seventh ?? fifth]
    : mode === "seventh-up" ? [0, third, fifth, upper]
    : mode === "seventh-down" ? [upper, fifth, third, 0]
    : mode === "seventh-wave" ? [0, third, fifth, upper, fifth, third]
    : mode === "seventh-ostinato" ? [0, fifth, upper, fifth]
    : [0];
  return Array.from({length:count},(_,i)=>{
    const offset = offsets[i%offsets.length];
    const noteIndex = rootIndex+offset;
    return {pitchClass:INDEX_TO_PITCH[noteIndex%12],octave:4+Math.floor(noteIndex/12)};
  });
}

/** Prefer the exact intended octave; fall back to the closest available
 * physical treble button rather than inventing a position on small manuals. */
export function trebleButtonForTarget(buttons: DiagramButton[], target: TreblePitchTarget): DiagramButton | undefined {
  return buttons.filter(b=>b.kind==="treble-note" && b.pitchClass===target.pitchClass)
    .sort((a,b)=>Math.abs((a.soundOctave??a.octave??4)-target.octave)
       -Math.abs((b.soundOctave??b.octave??4)-target.octave)
       || a.column-b.column || a.row-b.row)[0];
}
