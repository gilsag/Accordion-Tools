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
): TrebleChordExplanation {
  const full = intervalsForChordFinder(pattern);
  const played = new Set(buttons.map((button) => button.pitchClass));
  const sounding = full.filter((interval) => played.has(transpose(root, interval)))
    .map((interval) => transpose(root, interval));
  const missing = full.filter((interval) => !played.has(transpose(root, interval)));
  const omissions = missing.map((interval) => {
    const role = interval === 9 ? (pattern === "diminished7" ? "diminished seventh" : "sixth") : intervalRole(interval);
    return `${transpose(root, interval)} (${role})`;
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
      status: "No matching buttons",
      note: "No chord buttons are available in the selected keyboard range.",
      explanation: "No chord tones were found at this root octave. Try another octave or a larger keyboard layout.",
      exact: false,
    };
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
