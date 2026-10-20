/* Educational Stradella realization notes. The sounding pitch-class set is
   derived from the selected buttons; register statements deliberately avoid
   claiming a particular bass/chord octave or inversion. */

import type { FinderChordPattern, StradellaChordFinderMode } from "../../types";
import { transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
import { isExtendedChord, suspendedStyleOmission } from "../../music/chordVoicingPolicy";
import { finderChordSymbol, intervalRole } from "./diagramAnnotations";
import type { StradellaChordFinderResult } from "./results";
import { chordKindLabel, isBassButton } from "./voicings";

const ELEVENTHS: FinderChordPattern[] = ["dominant11", "major11", "minor11"];
const THIRTEENTHS: FinderChordPattern[] = ["dominant13", "major13", "minor13"];

function buttonName(button: StradellaChordFinderResult["playbackButtons"][number]) {
  if (isBassButton(button)) {
    return `${button.pitchClass ?? "?"} ${button.kind === "bass-counterbass" ? "counterbass" : "bass"}`;
  }
  return `${button.chordRoot ?? "?"} ${chordKindLabel(button.kind)}`.trim();
}

function omittedRole(root: string, pattern: FinderChordPattern, pitch: string) {
  const interval = intervalsForChordFinder(pattern).find((value) => transpose(root, value) === pitch);
  return `${pitch} (${interval === undefined ? "chord tone" : intervalRole(interval)})`;
}

export function explainStradellaRealization(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
  mode: StradellaChordFinderMode = "bass-and-chords",
): string {
  if (!result.playable || result.playbackButtons.length === 0) return result.explanation;

  const selected = result.playbackButtons;
  const chordName = finderChordSymbol(root, pattern);
  const sounding = result.coveredPitches.join("–");
  const missing = result.missingPitches;
  const hasTone = (interval: number) => result.coveredPitches.includes(transpose(root, interval));
  const is11 = ELEVENTHS.includes(pattern);
  const is13 = THIRTEENTHS.includes(pattern);
  const hasEleventh = (is11 || is13) && hasTone(17);
  const hasThird = (is11 || is13) && hasTone(pattern.startsWith("minor") ? 3 : 4);
  const isMajorThirdFamily = ["dominant11", "major11", "dominant13", "major13"].includes(pattern);
  const paragraphs: string[] = [];

  paragraphs.push(
    `${chordName} uses ${selected.length} ${selected.length === 1 ? "button" : "buttons"}: ` +
    `${selected.map(buttonName).join(" + ")}. ` +
    `Together they produce the pitch classes ${sounding}. ` +
    (result.exact
      ? "Exact means every required chord pitch class is present; it does not imply that the extensions sound in their theoretical upper octaves."
      : `This is an approximate realization. It omits ${missing.map((pitch) => omittedRole(root, pattern, pitch)).join(", ")}, without adding notes outside the chord.`),
  );

  if (isExtendedChord(pattern)) {
    paragraphs.push(
      "Stradella chord buttons sound in a fixed, compact register rather than spreading the 9th, 11th, and 13th above the seventh. " +
      "Bass and counterbass buttons have a separate sounding register. Here, Exact and Approximate describe pitch-class content, not octave stacking or a particular inversion.",
    );
  }

  if (is13) {
    const seventh = pattern === "major13" ? "major seventh" : "minor seventh";
    const suffix = hasTone(21)
      ? `The ${transpose(root, 21)} (thirteenth) has the same pitch class as a sixth; the ${seventh}, which is present here, gives the chord its extended-thirteenth character rather than an ordinary added-sixth identity.`
      : "Without the thirteenth, this would not have the defining color of a thirteenth chord.";
    paragraphs.push(suffix);
    if (isMajorThirdFamily && hasThird && hasEleventh) {
      paragraphs.push("The major third and natural eleventh are both present, a semitone apart by pitch class. Their close placement in the Stradella register may sound dense or tense; a voicing without the eleventh often sounds clearer.");
    } else if (isMajorThirdFamily && hasThird && !hasEleventh) {
      paragraphs.push("Leaving out the natural eleventh avoids its semitone friction with the major third. This is a conventional way to clarify major or dominant thirteenth harmony.");
    } else if (pattern === "minor13" && hasThird && hasEleventh) {
      paragraphs.push("The minor third and natural eleventh are a whole tone apart by pitch class, so they do not create the major-third/eleventh semitone clash. A complete voicing can nevertheless sound dense in the fixed Stradella chord register.");
    }
    if ([7, 14, 17].every((interval) => missing.includes(transpose(root, interval)))) {
      paragraphs.push("This is a functional 1–3–7–13 shell: it keeps the root, third, seventh, and thirteenth while omitting the fifth, ninth, and eleventh. It favors clarity over pitch-class completeness.");
    }
  } else if (is11) {
    if (suspendedStyleOmission(root, pattern, missing)) {
      paragraphs.push("The major third is omitted while the eleventh remains. This avoids the characteristic third/eleventh semitone but produces a suspended-style color, not an unambiguous major- or dominant-third voicing.");
    } else if (isMajorThirdFamily && hasThird && hasEleventh) {
      paragraphs.push("The major third and natural eleventh differ by a semitone in pitch class. On Stradella, their compact register can emphasize this tension; the effect is intentional in some styles but may sound congested.");
    } else if (pattern === "minor11" && hasThird && hasEleventh) {
      paragraphs.push("The minor third and eleventh are a whole tone apart in pitch class, avoiding the major-third/eleventh semitone. The chord can still be dense because several extensions occupy the compact Stradella register.");
    }
    if (missing.includes(transpose(root, 14))) {
      paragraphs.push("Omitting the ninth leaves the eleventh as the highest named extension, giving a leaner eleventh-chord color.");
    }
  } else if (["dominant9", "major9", "minor9", "minorMajor9", "dominant9sus4", "dominant7b9", "major7add9"].includes(pattern)) {
    paragraphs.push("The ninth is the same pitch class as the second. On Stradella it need not sound an octave above the root; the seventh or altered ninth, when part of the formula, establishes the intended extended harmony.");
  } else if (pattern === "diminished7" && selected.length === 1 && selected[0]?.kind === "chord-diminished7") {
    paragraphs.push("A standard Stradella diminished chord button sounds three pitch classes rather than all four pitches of a fully diminished seventh chord. The diminished fifth is missing; this is a conventional instrument-specific shortcut.");
  }

  if (result.recommended) {
    paragraphs.push(`Why Recommended: ${result.recommendationReason ?? "this button combination offers a practical balance of musical content, button count, and physical compactness."}`);
  } else if (isExtendedChord(pattern) && mode === "bass-and-chords") {
    paragraphs.push("This remains a valid alternative. The shortlist marks only a few contrasting strategies (complete, minimally reduced, and functional-shell voicings). Several other compact, pitch-class-complete button combinations can be equally legitimate without receiving the Recommended label.");
  }

  return paragraphs.join("\n\n");
}
