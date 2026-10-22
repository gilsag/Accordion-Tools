/*
  Optional, user-defined *nominal* register model for the Stradella manual.

  A C–B span assigns C,D,E,F,G,A,B to one numbered octave. An F–E span
  assigns F through B to the starting octave and C through E to the next.
  Each button tone has one modeled pitch: real reeds can sound octave doublings
  or register-dependent partials, so this must never be presented as a measured
  acoustic transcription or silently substituted for actual sample mappings.
*/
import type { DiagramButton } from "../../types";
import { PITCH_INDEX } from "../../music";
import { buttonTones, isBassButton, isChordButton } from "./voicings";

export type StradellaOctaveGrouping = "C-B" | "F-E";
export type StradellaRegisterRange = {
  startOctave: number;
  grouping: StradellaOctaveGrouping;
};
export type StradellaRegisterModel = {
  bass: StradellaRegisterRange;
  chord: StradellaRegisterRange;
};

/** Analytical defaults; intentionally unrelated to La Melodiosa's voice I/II/III. */
export const DEFAULT_STRADELLA_REGISTER_MODEL: StradellaRegisterModel = {
  bass: { startOctave: 2, grouping: "C-B" },
  chord: { startOctave: 3, grouping: "C-B" },
};

export type ModeledStradellaNote = {
  pitchClass: string;
  octave: number;
  midi: number;
  source: "bass" | "chord";
  buttonId: string;
};

export type ModeledStradellaVoicing = {
  notes: ModeledStradellaNote[];
  /** Includes ties when several buttons generate the same lowest pitch. */
  lowestNotes: ModeledStradellaNote[];
  lowestPitchClass: string | null;
  lowestPitch: string | null;
  rootIsLowest: boolean;
  /** True only for this simplified, configured one-pitch-per-tone model. */
  confidence: "configured-nominal-model";
};

/** Map a pitch class into one contiguous twelve-semitone register. */
export function nominalRegisterNote(
  pitchClass: string,
  range: StradellaRegisterRange,
): { pitchClass: string; octave: number; midi: number } | null {
  const index = PITCH_INDEX[pitchClass];
  if (index === undefined || !Number.isInteger(range.startOctave) || range.startOctave < 0 || range.startOctave > 8) return null;
  const octave = range.startOctave + (range.grouping === "F-E" && index < 5 ? 1 : 0);
  return { pitchClass, octave, midi: (octave + 1) * 12 + index };
}

/** Uses only playbackButtons; a highlighted reference root cannot sound. */
export function analyzeConfiguredStradellaVoicing(
  playbackButtons: readonly DiagramButton[],
  rootPitchClass: string | null,
  model: StradellaRegisterModel,
): ModeledStradellaVoicing {
  const notes: ModeledStradellaNote[] = [];
  for (const button of playbackButtons) {
    const source = isBassButton(button) ? "bass" : isChordButton(button) ? "chord" : null;
    if (!source) continue;
    const range = source === "bass" ? model.bass : model.chord;
    for (const pitchClass of buttonTones(button)) {
      const note = nominalRegisterNote(pitchClass, range);
      if (note) notes.push({ ...note, source, buttonId: button.id });
    }
  }
  notes.sort((a, b) => a.midi - b.midi || a.buttonId.localeCompare(b.buttonId));
  const lowestMidi = notes[0]?.midi;
  const lowestNotes = lowestMidi === undefined ? [] : notes.filter((note) => note.midi === lowestMidi);
  const first = lowestNotes[0];
  return {
    notes,
    lowestNotes,
    lowestPitchClass: first?.pitchClass ?? null,
    lowestPitch: first ? `${first.pitchClass}${first.octave}` : null,
    rootIsLowest: first !== undefined && first.pitchClass === rootPitchClass,
    confidence: "configured-nominal-model",
  };
}

/** Ascending nominal pitches, with ×N identifying unison contributions from
 * separate played buttons. These are modeled notes, not spectral measurements. */
export function formatModeledStradellaNotes(
  notes: readonly ModeledStradellaNote[],
  displayPitchClass: (pitchClass: string) => string = (pitchClass) => pitchClass,
): string {
  if (notes.length === 0) return "None";
  const sorted = [...notes].sort((a, b) => a.midi - b.midi || a.buttonId.localeCompare(b.buttonId));
  const groups: { pitch: string; midi: number; count: number }[] = [];
  for (const note of sorted) {
    const previous = groups[groups.length - 1];
    if (previous && previous.midi === note.midi) previous.count += 1;
    else groups.push({ pitch: `${displayPitchClass(note.pitchClass)}${note.octave}`, midi: note.midi, count: 1 });
  }
  return groups.map(({ pitch, count }) => `${pitch}${count > 1 ? ` ×${count}` : ""}`).join(" – ");
}

export function formatRegisterRange(range: StradellaRegisterRange): string {
  return range.grouping === "C-B"
    ? `C${range.startOctave}–B${range.startOctave}`
    : `F${range.startOctave}–E${range.startOctave + 1}`;
}

/** This is a MODEL-specific interpretation; it is not verified acoustic inversion. */
export function explainConfiguredStradellaVoicing(
  playbackButtons: readonly DiagramButton[],
  rootPitchClass: string,
  model: StradellaRegisterModel,
  displayPitchClass: (pitchClass: string) => string = (pitchClass) => pitchClass,
): string {
  const analysis = analyzeConfiguredStradellaVoicing(playbackButtons, rootPitchClass, model);
  if (!analysis.lowestPitch) return "Configured register model: no sounded notes to analyze.";
  const bassSources = analysis.lowestNotes.some((note) => note.source === "bass");
  const relationship = analysis.rootIsLowest
    ? `the requested root ${displayPitchClass(rootPitchClass)} is lowest in this model`
    : `${displayPitchClass(analysis.lowestPitchClass ?? "")} is below the requested root ${displayPitchClass(rootPitchClass)} in this model`;
  return `Configured register model: bass ${formatRegisterRange(model.bass)}; preset chords ${formatRegisterRange(model.chord)}. ` +
    `Nominal pitches (low to high): ${formatModeledStradellaNotes(analysis.notes, displayPitchClass)}. ` +
    `Lowest modeled pitch: ${displayPitchClass(analysis.lowestPitchClass ?? "")}${analysis.lowestNotes[0]?.octave ?? ""}${bassSources ? " (bass/counterbass button)" : " (preset chord button)"}; ${relationship}. ` +
    "This is a nominal one-pitch-per-tone calculation, not a verified acoustic inversion: recordings can contain octave doublings, and playback may follow these pitches or use its original mapping depending on sound settings.";
}
