import type { FinderChordPattern } from "../../types";
import { transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
import type { StradellaChordFinderResult } from "./results";
import { isBassButton, chordKindLabel } from "./voicings";

const suffix: Partial<Record<FinderChordPattern, string>> = {
  "major-triad": "maj", "minor-triad": "min", "augmented-triad": "aug",
  "diminished-triad": "dim", "sus4": "sus4", "major6": "maj6",
  "minor6": "min6", "dominant7": "7", "major7": "maj7", "minor7": "min7",
  "minorMajor7": "minMaj7", "diminished7": "dim7", "minor7b5": "min7b5",
  "dominant7b5": "7b5", "dominant7b9": "7b9", "dominant9": "9",
  "dominant9sus4": "9sus4", "dominant11": "11", "major9": "maj9",
  "major7add9": "maj7add9", "minor9": "min9", "minorMajor9": "minMaj9",
  "major11": "maj11", "minor11": "min11", "dominant13": "13",
  "major13": "maj13", "minor13": "min13",
};

export function finderChordSymbol(root: string, pattern: FinderChordPattern) {
  return `${root}${suffix[pattern] ?? ""}`;
}

export function intervalRole(interval: number) {
  const roles: Record<number, string> = {
    0: "root", 3: "third", 4: "third", 5: "fourth", 6: "fifth",
    7: "fifth", 8: "fifth", 9: "sixth/seventh", 10: "seventh",
    11: "seventh", 13: "ninth", 14: "ninth", 17: "eleventh", 21: "thirteenth",
  };
  return roles[interval] ?? "chord tone";
}

export function realizationAnnotation(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
) {
  const bassCount = result.playbackButtons.filter(isBassButton).length;
  const chordCount = result.playbackButtons.length - bassCount;
  const typeSegment = bassCount && !chordCount ? "-Bass-only" : "";
  const count = result.playbackButtons.length;
  const title = `${finderChordSymbol(root, pattern)} - ${result.exact ? "Exact" : "Approximate"} - ${count} ${bassCount === count ? "bass " : ""}${count === 1 ? "button" : "buttons"}`;
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
    filenameKey: `${finderChordSymbol(root, pattern)}-${result.exact ? "Exact" : "Approx"}-${count}buttons${typeSegment}-${buttons}`,
    detail: `${buttons} → ${tones}${omissions.length ? ` · Omitted: ${omissions.join(", ")}` : ""}${(pattern === "dominant11" || pattern === "major11") && result.missingPitches.includes(transpose(root, 4)) ? " · Suspended-style voicing" : ""}`,
  };
}
