import { translate, type InterfaceLanguage } from "../../i18n/catalog";
import { chordRole, stradellaButtonFunction } from "../../i18n/musicTerms";
import type { FinderChordPattern } from "../../types";
import { displayRealizedChord, type ChordDisplayStyle } from "../chordDisplay";
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

const LEGACY_CHORD_DISPLAY_STYLE: ChordDisplayStyle = "words";

export function intervalRole(interval: number) {
  const roles: Record<number, string> = {
    0: "root", 2: "suspended second", 3: "third", 4: "third", 5: "fourth", 6: "altered fifth",
    7: "fifth", 8: "altered fifth", 9: "sixth/seventh", 10: "seventh",
    11: "seventh", 13: "flat ninth", 14: "ninth", 15: "sharp ninth", 17: "eleventh", 18: "sharp eleventh", 21: "thirteenth",
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
  displayStyle: ChordDisplayStyle = LEGACY_CHORD_DISPLAY_STYLE,
  language: InterfaceLanguage = "en",
) {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(language, key, params);
  const bassCount = result.playbackButtons.filter(isBassButton).length;
  const chordCount = result.playbackButtons.length - bassCount;
  const typeSegment = bassCount && !chordCount ? "-Bass-only" : "";
  const count = result.playbackButtons.length;

  const spell = (pc: string) => chordToneName(root, pattern, pc);
  const buttons = result.playbackButtons.map((button) => {
    if (isBassButton(button)) return `${spell(button.pitchClass ?? "")} ${t(button.kind === "bass-counterbass" ? "ui.counterbass" : "ui.bass")}`;
    const kind = chordKindLabel(button.kind);
    return `${spell(button.chordRoot ?? "")} ${language === "en" || language === "es" ? kind : stradellaButtonFunction(kind, language)}`;
  }).join(" + ");
  const tones = result.coveredPitches.map(spell).join("–");
  const omissions = result.missingPitches.map((pitch) => {
    const interval = intervalsForChordFinder(pattern).find((i) => transpose(root, i) === pitch);
    return `${spell(pitch)} (${chordRole(interval === undefined ? "chord tone" : intervalRole(interval), language)})`;
  });
  // The button names already identify root/non-root basses; avoid repeating
  // the same bass note as a separate qualification in the concise footer.
  const chordButtonsOnly = chordCount > 0 && bassCount === 0;
  const modeled = registerModel
    ? analyzeConfiguredStradellaVoicing(result.playbackButtons, root, registerModel)
    : null;
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  const realizedName = realizedChordName(root, pattern, requestedBass, modeled?.lowestPitchClass, requestedSymbol);
  const visibleName = displayRealizedChord(root, pattern, realizedName, displayStyle);
  const inversionDescription = realizedInversionDescription(root, pattern, requestedBass ?? modeled?.lowestPitchClass ?? null);
  const visibleInversion = language !== "en" && inversionDescription
    ? inversionDescription.replace("First inversion", t("ui.firstInversion"))
      .replace("Second inversion", t("ui.secondInversion"))
      .replace("Third inversion", t("ui.thirdInversion"))
      .replace(" in bass", ` ${t("ui.inBass")}`)
    : inversionDescription;
  const title = stradellaContextualTitle({
    root, pattern, requestedBass, exact: result.exact,
    buttonCount: count, bassOnly: bassCount === count,
    modeledLowest: modeled?.lowestPitch ?? null,
    displayStyle,
  });
  const lines: string[] = [];
  if (levels.identity) {
    lines.push(`${t("analysis.harmonicIdentity")}: ${visibleName}${visibleInversion ? ` · ${visibleInversion}` : ""}`);
  }
  if (levels.pitchClasses) {
    const suspendedStyle = (pattern === "dominant11" || pattern === "major11") && result.missingPitches.includes(transpose(root, 4));
    lines.push(`${t("analysis.pitchClassRealization")}: ${tones} · ${result.exact ? t("analysis.exactComplete") : `${t("analysis.approximate")} · ${t("analysis.omitted")}: ${omissions.join(", ") || t("analysis.none")}`}${suspendedStyle ? ` · ${t("analysis.suspended")}` : ""}`);
  }
  if (levels.physical) {
    const buttonCountLabel = language === "en"
      ? `${count} played ${count === 1 ? "button" : "buttons"}`
      : language === "es" ? `${count} ${count === 1 ? "botón pulsado" : "botones pulsados"}`
        : language === "fr" ? `${count} ${count === 1 ? "bouton joué" : "boutons joués"}`
          : t("analysis.playedButtons", { count, unit: t(count === 1 ? "analysis.buttonOne" : "analysis.buttonMany") });
    lines.push(`${t("analysis.physicalRealization")}: ${buttons} · ${buttonCountLabel}${chordButtonsOnly ? ` · ${t("analysis.chordOnly")}` : ""}${result.recommended ? ` · ${t("analysis.recommended")}` : ""}`);
  }
  if (levels.voicing) {
    const modeledLine = modeled?.notes.length
      ? formatModeledStradellaNotes(modeled.notes, spell)
      : t("analysis.noNominalPitches");
    const density = modeled ? analyzeVoicingDensity(modeled.notes) : null;
    lines.push(`${t("analysis.registralVoicing")}: ${modeledLine}${density?.note ? ` · ${spellDensityNote(density.note, root, pattern)}` : ""}`);
  }
  return {
    title,
    filenameKey: safeChordFilenameKey(`${realizedName}-${result.exact ? "Exact" : "Approx"}-${count}buttons${typeSegment}-${result.playbackButtons.map((button) => isBassButton(button) ? `${spell(button.pitchClass ?? "")} ${button.kind === "bass-counterbass" ? "counterbass" : "bass"}` : `${spell(button.chordRoot ?? "")} ${chordKindLabel(button.kind)}`).join(" + ")}`),
    lines,
    detail: lines.join("\n"),
  };
}
