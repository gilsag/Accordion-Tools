/** Shared progression-catalog bridge. Both tools use the same bundled catalog
 * and Roman-numeral root resolver; no duplicate catalog or chord-finder engine.
 * Reject unsupported extensions / slash dominants instead of silently dropping
 * information while converting a Bass Pattern progression to Harmony chords.
 */
import type { ChordProgressionDefinition } from "../bassPatternPlayerTools";
import { chordProgressionSteps, resolveRomanChord } from "../bassPatternPlayerTools";
import { pitchClassNumberFromName } from "./integration";
import { CIRCLE_OF_FIFTHS } from "./music";
import type { FinderChordPattern } from "../../types";

export type PresetConversion = {
  chords: Array<{ rootPc: number; pattern: FinderChordPattern; sectorIndex: number }>;
  unsupported: string[];
};

/** Exact chord-type conversion for the shared Finder catalog. Unsupported
 * 7th alterations and secondary dominants remain visible as unsupported.
 */
export function convertProgressionPreset(
  definition: ChordProgressionDefinition, keyRoot: string,
): PresetConversion {
  const chords: PresetConversion["chords"] = [];
  const unsupported: string[] = [];
  const steps = chordProgressionSteps(definition);
  // The shared Bass Pattern root resolver is major-scale based. Minor-tonic
  // catalog entries require an explicit minor-mode mapping, not a guessed root.
  if (definition.id === "andalusian-cadence" || steps.some(({ symbol }) => symbol === "i")) {
    return { chords: [], unsupported: steps.map(({ symbol }) => symbol) };
  }
  for (const { symbol } of steps) {
    const normalized = symbol.replaceAll("♭", "b").replaceAll("♯", "#");
    const match = normalized.match(/^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(maj7|M7|7|ø7?|°7?|dim7?)?$/);
    if (!match) { unsupported.push(symbol); continue; }
    const [, , roman, suffix = ""] = match;
    const minor = roman === roman.toLowerCase();
    let pattern: FinderChordPattern;
    if (suffix === "7") pattern = minor ? "minor7" : "dominant7";
    else if (suffix === "maj7" || suffix === "M7") pattern = "major7";
    else if (suffix.startsWith("ø")) pattern = "minor7b5";
    else if (suffix.startsWith("°") || suffix.startsWith("dim")) pattern = suffix.endsWith("7") ? "diminished7" : "diminished-triad";
    else pattern = minor ? "minor-triad" : "major-triad";
    const resolved = resolveRomanChord(normalized, keyRoot);
    const rootPc = pitchClassNumberFromName(resolved.root);
    if (rootPc === null) { unsupported.push(symbol); continue; }
    const sectorIndex = CIRCLE_OF_FIFTHS.indexOf(rootPc as typeof CIRCLE_OF_FIFTHS[number]);
    chords.push({ rootPc, pattern, sectorIndex: sectorIndex < 0 ? 0 : sectorIndex });
  }
  return { chords: unsupported.length ? [] : chords, unsupported };
}
