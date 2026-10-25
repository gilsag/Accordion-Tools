import { translate, type InterfaceLanguage } from "../i18n/catalog";
import { chordRole } from "../i18n/musicTerms";
import type { DiagramButton, FinderChordPattern } from "../types";
import { transpose } from "../music";
import { intervalsForChordFinder } from "../music/chordDefinitions";
import { treblePreferredIntervals } from "../music/chordVoicingPolicy";
import { intervalRole } from "./stradellaChordFinder/diagramAnnotations";
import type { TrebleChordVoicingMode } from "./chordFinderTools";

export type TrebleChordExplanation = {
  status: string;
  note: string;
  explanation: string;
  exact: boolean;
};

/** Describe the buttons actually highlighted, including unintentional range omissions. */
export function describeTrebleChord(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderChordPattern,
  mode: TrebleChordVoicingMode,
  language: InterfaceLanguage = "en",
): TrebleChordExplanation {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(language, key, params);
  const full = intervalsForChordFinder(pattern);
  const played = new Set(buttons.map((button) => button.pitchClass));
  const sounding = full.filter((interval) => played.has(transpose(root, interval)))
    .map((interval) => transpose(root, interval));
  const missing = full.filter((interval) => !played.has(transpose(root, interval)));
  const omissions = missing.map((interval) => {
    const role = interval === 9 ? (pattern === "diminished7" ? "diminished seventh" : "sixth") : intervalRole(interval);
    return `${transpose(root, interval)} (${chordRole(role, language)})`;
  });
  const exact = buttons.length > 0 && missing.length === 0;
  const fullRequested = mode === "full";
  const planned = new Set((fullRequested || (mode === "auto" && full.length <= 5)
    ? full : treblePreferredIntervals(pattern)).map((interval) => interval % 12));
  const unavailable = missing.filter((interval) => planned.has(interval % 12));
  const suspended = ["dominant11", "major11"].includes(pattern) && missing.includes(4);
  const manyButtons = buttons.length > 5;

  if (buttons.length === 0) {
    return {
      status: t("analysis.trebleUnavailable"),
      note: t("analysis.trebleNoButtons"),
      explanation: t("analysis.trebleNoRoot"),
      exact: false,
    };
  }

  // English output is kept byte-for-byte compatible with earlier regression fixtures.
  if (language === "es") {
    const notes = sounding.join("–");
    const status = t("analysis.trebleStatus", {
      status: exact ? t("analysis.exact") : t("analysis.approximate"),
      played: sounding.length, total: full.length,
    });
    const note = `${exact ? t("analysis.exact") : t("analysis.approx")} · ${notes}` +
      (omissions.length ? ` · ${t("analysis.trebleOmitted", { list: omissions.join(", ") })}` : ` · ${t("analysis.trebleAll")}`) +
      (manyButtons ? ` · ${t("analysis.trebleHands")}` : "") +
      (suspended ? ` · ${t("analysis.trebleSuspended")}` : "");
    const explanation = exact
      ? t(manyButtons ? "analysis.trebleCompleteTheoretical" : "analysis.trebleComplete", { notes, count: buttons.length })
      : t(unavailable.length ? "analysis.trebleReducedUnavailable" : "analysis.trebleReduced", { notes, omissions: omissions.join(", ") });
    return { status, note, explanation: explanation + (suspended ? ` ${t("analysis.trebleSuspendedAppend")}` : ""), exact };
  }

  const status = `${exact ? "Exact" : "Approximate"} (${sounding.length}/${full.length} tones)`;
  const note = `${exact ? "Exact" : "Approx."} · ${sounding.join("–")}`
    + (omissions.length ? ` · Omitted: ${omissions.join(", ")}` : " · All chord tones present")
    + (manyButtons ? " · Requires more than five fingers" : "")
    + (suspended ? " · Suspended-style" : "");

  const explanation = exact
    ? `${sounding.join("–")} contains all chord tones. ${manyButtons
      ? `This complete ${buttons.length}-button shape is a theoretical illustration, not a simultaneous one-hand fingering.`
      : "The selected buttons form a pitch-complete treble chord."}`
    : `The selected buttons produce ${sounding.join("–")}. Omitted: ${omissions.join(", ")}. ${unavailable.length
      ? "Some requested tones are unavailable at this root octave in the selected keyboard range."
      : "This is a reduced voicing. Choose Full chord to display all available target tones."}`
      + (suspended ? " Omitting the major third gives the voicing a suspended character." : "");
  return { status, note, explanation, exact };
}
