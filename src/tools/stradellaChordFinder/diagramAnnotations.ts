import type { FinderChordPattern } from "../../types";
import { transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
import type { StradellaChordFinderResult } from "./results";
import { isBassButton, chordKindLabel } from "./voicings";
import { analyzeConfiguredStradellaVoicing, formatModeledStradellaNotes, type StradellaRegisterModel } from "./registerModel";

export { finderChordSymbol } from "./chordSymbol";
import { finderChordSymbol } from "./chordSymbol";
import { stradellaContextualTitle } from "../contextualTitles";
import { analyzeVoicingDensity } from "./voicingDensity";
import { chordToneName, displayRoot, realizedChordName, realizedInversionDescription, safeChordFilenameKey, spellDensityNote } from "./chordSpelling";

export function intervalRole(interval: number) {
  const roles: Record<number, string> = {
    0: "root", 3: "third", 4: "third", 5: "fourth", 6: "fifth",
    7: "fifth", 8: "fifth", 9: "sixth/seventh", 10: "seventh",
    11: "seventh", 13: "ninth", 14: "ninth", 17: "eleventh", 21: "thirteenth",
  };
  return roles[interval] ?? "chord tone";
}

/** Independently selectable concise lines under the diagram and in exports.
 * These are PRESENTATION choices: they never affect candidate validity,
 * recommended ordering, the detailed explanation, or audio playback. */
export type StradellaNoteLevels = {
  identity: boolean;
  pitchClasses: boolean;
  voicing: boolean;
  physical: boolean;
};

export const DEFAULT_STRADELLA_NOTE_LEVELS: Readonly<StradellaNoteLevels> = {
  identity: true,
  pitchClasses: true,
  voicing: true,
  physical: true,
};

/** Imported settings can originate from an older or partially edited file. */
export function normalizeStradellaNoteLevels(value: unknown): StradellaNoteLevels {
  const input = value && typeof value === "object" ? value as Partial<StradellaNoteLevels> : {};
  return {
    identity: typeof input.identity === "boolean" ? input.identity : true,
    pitchClasses: typeof input.pitchClasses === "boolean" ? input.pitchClasses : true,
    voicing: typeof input.voicing === "boolean" ? input.voicing : true,
    physical: typeof input.physical === "boolean" ? input.physical : true,
  };
}

/** Render only the enabled concise four-level lines. The longer musical
 * discussion remains independent in More explanation. The result title and
 * filename must never depend on presentation preferences. */
export function realizationAnnotation(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
  registerModel?: StradellaRegisterModel,
  requestedBass: string | null = null,
  levels: StradellaNoteLevels = DEFAULT_STRADELLA_NOTE_LEVELS,
) {
  const bassCount = result.playbackButtons.filter(isBassButton).length;
  const chordCount = result.playbackButtons.length - bassCount;
  const typeSegment = bassCount && !chordCount ? "-Bass-only" : "";
  const count = result.playbackButtons.length;

  const spell = (pc: string) => chordToneName(root, pattern, pc);
  const buttons = result.playbackButtons.map((button) => {
    if (isBassButton(button)) return `${spell(button.pitchClass ?? "")} ${button.kind === "bass-counterbass" ? "counterbass" : "bass"}`;
    return `${spell(button.chordRoot ?? "")} ${chordKindLabel(button.kind)}`;
  }).join(" + ");
  const tones = result.coveredPitches.map(spell).join("–");
  const omissions = result.missingPitches.map((pitch) => {
    const interval = intervalsForChordFinder(pattern).find((i) => transpose(root, i) === pitch);
    return `${spell(pitch)} (${interval === undefined ? "chord tone" : intervalRole(interval)})`;
  });
  // The button names already identify root/non-root basses; avoid repeating
  // the same bass note as a separate qualification in the concise footer.
  const chordButtonsOnly = chordCount > 0 && bassCount === 0;
  const modeled = registerModel
    ? analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel)
    : null;
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  const realizedName = realizedChordName(root, pattern, requestedBass, modeled?.lowestPitchClass, requestedSymbol);
  const inversionDescription = realizedInversionDescription(root, pattern, requestedBass ?? modeled?.lowestPitchClass ?? null);
  const title = stradellaContextualTitle({
    root, pattern, requestedBass, exact: result.exact,
    buttonCount: count, bassOnly: bassCount === count,
    modeledLowest: modeled?.lowestPitch ?? null,
  });
  const lines: string[] = [];
  if (levels.identity) {
    lines.push(`Harmonic identity: ${realizedName}${inversionDescription ? ` · ${inversionDescription}` : ""}`);
  }
  if (levels.pitchClasses) {
    const suspendedStyle = (pattern === "dominant11" || pattern === "major11") && result.missingPitches.includes(transpose(root, 4));
    lines.push(`Pitch-class realization: ${tones} · ${result.exact ? "Exact (complete)" : `Approximate · Omitted: ${omissions.join(", ") || "none"}`}${suspendedStyle ? " · Suspended-style" : ""}`);
  }
  if (levels.voicing) {
    const modeledLine = modeled?.notes.length
      ? formatModeledStradellaNotes(modeled.notes, spell)
      : "Nominal pitches unavailable";
    const density = modeled ? analyzeVoicingDensity(modeled.notes) : null;
    lines.push(`Registral voicing: ${modeledLine}${density?.note ? ` · ${spellDensityNote(density.note, root, pattern)}` : ""}`);
  }
  if (levels.physical) {
    lines.push(`Physical realization: ${buttons} · ${count} played ${count === 1 ? "button" : "buttons"}${chordButtonsOnly ? " · Chord buttons only; no separate bass" : ""}${result.recommended ? " · Recommended" : ""}`);
  }
  return {
    title,
    filenameKey: safeChordFilenameKey(`${realizedName}-${result.exact ? "Exact" : "Approx"}-${count}buttons${typeSegment}-${buttons}`),
    lines,
    detail: lines.join("\n"),
  };
}
