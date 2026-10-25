import { translate, type InterfaceLanguage } from "../../i18n/catalog";
import { chordRole, stradellaButtonFunction } from "../../i18n/musicTerms";
/* Educational Stradella realization notes. The sounding pitch-class set is
   derived from the selected buttons; register statements deliberately avoid
   claiming a particular bass/chord octave or inversion. */

import type { FinderChordPattern, StradellaChordFinderMode } from "../../types";
import { displayRealizedChord, type ChordDisplayStyle } from "../chordDisplay";
import { transpose } from "../../music";
import { intervalsForChordFinder } from "../../music/chordDefinitions";
import { isExtendedChord, suspendedStyleOmission } from "../../music/chordVoicingPolicy";
import { finderChordSymbol, intervalRole } from "./diagramAnnotations";
import type { StradellaChordFinderResult } from "./results";
import { chordKindLabel, isBassButton } from "./voicings";
import { explainRegistralRole } from "./registralExplanation";
import { explainConfiguredStradellaVoicing, formatModeledStradellaNotes, analyzeConfiguredStradellaVoicing, type StradellaRegisterModel } from "./registerModel";
import { requestedBassRole } from "./harmonicIdentity";
import { analyzeVoicingDensity } from "./voicingDensity";
import { chordToneName, displayRoot, realizedChordName, realizedInversionDescription, spellDensityNote } from "./chordSpelling";

const LEGACY_CHORD_DISPLAY_STYLE: ChordDisplayStyle = "words";

const ELEVENTHS: FinderChordPattern[] = ["dominant11", "major11", "minor11"];
const THIRTEENTHS: FinderChordPattern[] = ["dominant13", "major13", "minor13"];

/** Localized presentation only. Candidate generation, ranking and filename symbols
 * remain independent of interface language. */
function explainLocalizedRealization(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
  registerModel?: StradellaRegisterModel,
  requestedBass: string | null = null,
  displayStyle: ChordDisplayStyle = LEGACY_CHORD_DISPLAY_STYLE,
  language: Exclude<InterfaceLanguage, "en"> = "es",
): string {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(language, key, params);
  if (!result.playable || !result.playbackButtons.length) return language === "es"
    ? "No se encontró una realización para este acorde y la configuración elegida." : t("ui.noSupportedRealization");
  const selected = result.playbackButtons;
  const spell = (pc: string) => chordToneName(root, pattern, pc);
  const buttons = selected.map((button) => isBassButton(button)
    ? `${spell(button.pitchClass ?? "?")} ${t(button.kind === "bass-counterbass" ? "ui.counterbass" : "ui.bass")}`
    : `${spell(button.chordRoot ?? "?")} ${stradellaButtonFunction(chordKindLabel(button.kind), language)}`);
  const modeled = registerModel ? analyzeConfiguredStradellaVoicing(selected, root, registerModel) : null;
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  const chordName = displayRealizedChord(root, pattern, realizedChordName(root, pattern, requestedBass, modeled?.lowestPitchClass, requestedSymbol), displayStyle);
  const missing = result.missingPitches.map((pitch) => {
    const interval = intervalsForChordFinder(pattern).find((value) => transpose(root, value) === pitch);
    return `${spell(pitch)} (${chordRole(interval === undefined ? "chord tone" : intervalRole(interval), language)})`;
  });
  const first = t(result.exact ? "analysis.stradellaFirstExact" : "analysis.stradellaFirstApprox", {
    chord: chordName, count: selected.length, unit: t(selected.length === 1 ? "analysis.buttonOne" : "analysis.buttonMany"),
    buttons: buttons.join(" + "), notes: result.coveredPitches.map(spell).join("–"), missing: missing.join(", "),
  });
  const paragraphs = [first];
  if (requestedBass) {
    paragraphs.push(t("analysis.stradellaRequestedBass", {
      chord: chordName, bass: spell(requestedBass), root: spell(root),
      role: chordRole(requestedBassRole({ root, pattern, requestedBass }) ?? "chord tone", language),
    }));
    paragraphs.push(modeled?.lowestPitchClass === requestedBass
      ? t("analysis.stradellaModelLowest", { pitch: `${spell(requestedBass)}${modeled.lowestNotes[0]?.octave ?? ""}` })
      : t("analysis.stradellaModelCaution"));
  } else paragraphs.push(t("analysis.stradellaUnspecifiedBass", { chord: chordName }));
  if (modeled && modeled.notes.length) {
    paragraphs.push(t("analysis.stradellaRegisterNote", { notes: formatModeledStradellaNotes(modeled.notes, spell) }));
    if (analyzeVoicingDensity(modeled.notes).note) {
      paragraphs.push(t("analysis.stradellaDensity", { note: modeled.notes.map((n) => `${spell(n.pitchClass)}${n.octave}`).join("–") }));
    }
  }
  if (isExtendedChord(pattern)) paragraphs.push(t("analysis.stradellaExtended"));
  if (THIRTEENTHS.includes(pattern)) {
    paragraphs.push(t("analysis.stradella13"));
    if ([7, 14, 17].every((interval) => result.missingPitches.includes(transpose(root, interval)))) paragraphs.push(t("analysis.stradella13Shell"));
  }
  if (ELEVENTHS.includes(pattern)) {
    if (suspendedStyleOmission(root, pattern, result.missingPitches)) paragraphs.push(t("analysis.stradella11Suspended"));
    else if (["dominant11", "major11"].includes(pattern) &&
      result.coveredPitches.includes(transpose(root, 4)) && result.coveredPitches.includes(transpose(root, 17)))
      paragraphs.push(t("analysis.stradella11Clash"));
  }
  if (["majorAdd9", "minorAdd9", "major6add9", "minor6add9"].includes(pattern)) paragraphs.push(t("analysis.stradellaAdd9"));
  if (["dominant7sharp5", "dominant7sharp9", "major7sharp11"].includes(pattern)) paragraphs.push(t("analysis.stradellaAltered"));
  if (["dominant9", "major9", "minor9", "minorMajor9", "dominant9sus4", "dominant7b9", "major7add9"].includes(pattern)) paragraphs.push(t("analysis.stradellaNine"));
  if (pattern === "diminished7" && selected.length === 1 && selected[0]?.kind === "chord-diminished7") paragraphs.push(t("analysis.stradellaDiminished"));
  if (result.recommended) paragraphs.push(t("analysis.stradellaWhy", { reason: t("analysis.stradellaWhyDefault") }));
  else if (isExtendedChord(pattern)) paragraphs.push(t("analysis.stradellaAlternative"));
  return paragraphs.join("\n\n");
}


function buttonName(button: StradellaChordFinderResult["playbackButtons"][number], spell: (pitch: string) => string) {
  if (isBassButton(button)) {
    return `${spell(button.pitchClass ?? "?")} ${button.kind === "bass-counterbass" ? "counterbass" : "bass"}`;
  }
  return `${spell(button.chordRoot ?? "?")} ${chordKindLabel(button.kind)}`.trim();
}

function omittedRole(root: string, pattern: FinderChordPattern, pitch: string) {
  const interval = intervalsForChordFinder(pattern).find((value) => transpose(root, value) === pitch);
  return `${chordToneName(root, pattern, pitch)} (${interval === undefined ? "chord tone" : intervalRole(interval)})`;
}

/** Describe the *selected* physical realization and its permitted omissions.
 * Registral assertions must be based on played buttons, not visual markers
 * or an assumed universal octave mapping. */
export function explainStradellaRealization(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
  mode: StradellaChordFinderMode = "bass-and-chords",
  registerModel?: StradellaRegisterModel,
  requestedBass: string | null = null,
  displayStyle: ChordDisplayStyle = LEGACY_CHORD_DISPLAY_STYLE,
  language: InterfaceLanguage = "en",
): string {
  if (language !== "en") return explainLocalizedRealization(root, pattern, result, registerModel, requestedBass, displayStyle, language);
  if (!result.playable || result.playbackButtons.length === 0) return result.explanation;

  const selected = result.playbackButtons;
  const spell = (pc: string) => chordToneName(root, pattern, pc);
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  const modeled = registerModel ? analyzeConfiguredStradellaVoicing(selected, root, registerModel) : null;
  const chordName = displayRealizedChord(root, pattern, realizedChordName(root, pattern, requestedBass, modeled?.lowestPitchClass, requestedSymbol), displayStyle);
  const visibleRequestedSymbol = displayRealizedChord(root, pattern, requestedSymbol, displayStyle);
  const inversionDescription = realizedInversionDescription(root, pattern, requestedBass ?? modeled?.lowestPitchClass ?? null);
  const sounding = result.coveredPitches.map(spell).join("–");
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
    `${selected.map((button) => buttonName(button, spell)).join(" + ")}. ` +
    `Together they produce the pitch classes ${sounding}. ` +
    (result.exact
      ? "Exact means every required chord pitch class is present; it does not imply that the extensions sound in their theoretical upper octaves."
      : `This is an approximate realization. It omits ${missing.map((pitch) => omittedRole(root, pattern, pitch)).join(", ")}, without adding notes outside the chord.`),
  );

  if (requestedBass) {
    const harmonicRole = requestedBassRole({ root, pattern, requestedBass }) ?? "chord tone";
    paragraphs.push(`Harmonic identity: ${chordName}${inversionDescription ? ` (${inversionDescription.toLowerCase()})` : ""}. ` +
      `The requested bass is ${spell(requestedBass)} (${harmonicRole}); the theoretical root remains ${spell(root)}. ` +
      (modeled?.lowestPitchClass === requestedBass
        ? `The configured register model places ${spell(requestedBass)}${modeled.lowestNotes[0]?.octave ?? ""} lowest.`
        : "The acoustic lowest pitch depends on the instrument and register configuration."));
  } else {
    paragraphs.push(`Harmonic identity: ${visibleRequestedSymbol}. ` +
      (modeled?.lowestPitchClass && modeled.lowestPitchClass !== root
        ? `This realization is ${chordName}${inversionDescription ? ` (${inversionDescription.toLowerCase()})` : ""} under the configured register model. `
        : "This realization has no distinct slash bass under the configured register model. ") +
      "The intended harmony is not changed by another possible interpretation of the same pitch classes.");
  }
  paragraphs.push(explainRegistralRole(root, pattern, result));
  if (registerModel) {
    paragraphs.push(explainConfiguredStradellaVoicing(result.playbackButtons, root, registerModel, spell));
    const modeledNotes = analyzeConfiguredStradellaVoicing(selected, root, registerModel).notes;
    const observation = analyzeVoicingDensity(modeledNotes);
    if (observation.note) {
      paragraphs.push(`Voicing density: ${spellDensityNote(observation.note, root, pattern)}. This close spacing can sound tense or congested, especially in lower registers, but can also be musically intentional. It is a nominal-pitch observation, not a measurement of acoustic reed doublings.`);
    }
  }

  if (isExtendedChord(pattern)) {
    paragraphs.push(
      "Extended-chord labels describe harmonic functions and pitch classes, not guaranteed upper-octave placements of the ninth, eleventh, or thirteenth. " +
      "Preset chord buttons occupy their own instrument-dependent register; bass/counterbass buttons may activate different reed banks and octave doublings.",
    );
  }

  if (is13) {
    const seventh = pattern === "major13" ? "major seventh" : "minor seventh";
    const suffix = hasTone(21)
      ? `The ${spell(transpose(root, 21))} (thirteenth) has the same pitch class as a sixth. ${hasTone(pattern === "major13" ? 11 : 10) ? `The retained ${seventh} distinguishes this functional thirteenth chord from an ordinary added-sixth chord.` : `Without the theoretical ${seventh}, its extended-chord character is less clearly established.`}`
      : "Without the thirteenth, this does not express the defining color of a thirteenth chord.";
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
  } else if (["majorAdd9", "minorAdd9", "major6add9", "minor6add9"].includes(pattern)) {
    paragraphs.push("The added ninth is the same pitch class as the second. These chords do not require a seventh; the added ninth is defining, not an optional fifth.");
  } else if (["dominant7sharp5", "dominant7sharp9", "major7sharp11"].includes(pattern)) {
    paragraphs.push("The specified altered tone establishes the chord color and is retained in any permitted reduced realization.");
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
