import type { FinderChordPattern } from "../../types";
import { transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
import type { StradellaChordFinderResult } from "./results";
import { isBassButton, chordKindLabel } from "./voicings";

const suffix: Partial<Record<FinderChordPattern, string>> = {
  "major-triad": "", "minor-triad": "m", "augmented-triad": "+",
  "diminished-triad": "dim", "sus4": "sus4", "major6": "6",
  "minor6": "m6", "dominant7": "7", "major7": "maj7", "minor7": "m7",
  "minorMajor7": "m(maj7)", "diminished7": "dim7", "minor7b5": "m7♭5",
  "dominant7b5": "7♭5", "dominant7b9": "7♭9", "dominant9": "9",
  "dominant9sus4": "9sus4", "dominant11": "11", "major9": "maj9",
  "major7add9": "maj7(add9)", "minor9": "m9", "minorMajor9": "m(maj9)",
};

export function finderChordSymbol(root: string, pattern: FinderChordPattern) {
  return `${root}${suffix[pattern] ?? ""}`;
}

function intervalRole(interval: number) {
  const roles: Record<number, string> = {
    0: "root", 3: "third", 4: "third", 5: "fourth", 6: "fifth",
    7: "fifth", 8: "fifth", 9: "sixth/seventh", 10: "seventh",
    11: "seventh", 13: "ninth", 14: "ninth", 17: "eleventh",
  };
  return roles[interval] ?? "chord tone";
}

export function realizationAnnotation(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
) {
  const title = `${finderChordSymbol(root, pattern)} — ${result.exact ? "Exact" : "Approximate"} realization`;
  const buttons = result.playbackButtons.map((button) => {
    if (isBassButton(button)) return `${button.pitchClass} ${button.kind === "bass-counterbass" ? "counterbass" : "bass"}`;
    return `${button.chordRoot} ${chordKindLabel(button.kind)}`;
  }).join(" + ");
  const tones = result.coveredPitches.join("–");
  const omissions = result.missingPitches.map((pitch) => {
    const interval = intervalsForChordFinder(pattern).find((i) => transpose(root, i) === pitch);
    return `${pitch} (${interval === undefined ? "chord tone" : intervalRole(interval)})`;
  });
  return {
    title,
    detail: `${buttons} → ${tones}${omissions.length ? ` · Omitted: ${omissions.join(", ")}` : ""}`,
  };
}
