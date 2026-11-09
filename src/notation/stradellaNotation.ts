/** Conventional *written* Stradella notation (AAA 1938): never use the
 * instrument's sounding bass/chord octaves to determine staff positions.
 * One upper-staff notehead stands for an entire preset chord button.
 */
import type { DiagramButton } from "../types";

export type StradellaNotationMode = "symbolic" | "sounding";
export type ChordQualityLabelMode = "always" | "changes";
export type StradellaNotationPreferences = {
  mode: StradellaNotationMode;
  chordQualityLabels: ChordQualityLabelMode;
  markCounterbass: boolean;
};
export const DEFAULT_STRADELLA_NOTATION: StradellaNotationPreferences = {
  mode: "symbolic", chordQualityLabels: "always", markCounterbass: false,
};

const PC: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};
const ABC_BASE: Record<string, string> = {
  C: "C", "C#": "^C", Db: "_D", D: "D", "D#": "^D", Eb: "_E",
  E: "E", F: "F", "F#": "^F", Gb: "_G", G: "G", "G#": "^G",
  Ab: "_A", A: "A", "A#": "^A", Bb: "_B", B: "B",
};

/** Normalized written ABC pitch. D3 (MIDI 50) is the dividing line:
 * bass notes at/below, chord markers strictly above. Enharmonics preserve
 * the supplied spelling. Absolute reed registers do not enter this API.
 */
export function stradellaWrittenPitch(root: string, kind: "bass" | "chord"): string {
  const pitch = root in PC ? root : "C";
  const pc = PC[pitch];
  const middleD3 = 50;
  // The dividing D3 line is expressly permitted for either category.
  // D chord buttons can therefore use D3 (quality label disambiguates them).
  let midi = kind === "bass" || (kind === "chord" && pitch === "D")
    ? middleD3 : middleD3 + 1;
  while (midi >= 24 && midi <= 72 && ((midi % 12 + 12) % 12) !== pc)
    midi += kind === "bass" ? -1 : 1;
  const octave = Math.floor(midi / 12) - 1;
  const abc = ABC_BASE[pitch];
  if (octave <= 3) return `${abc}${",".repeat(4 - octave)}`;
  if (octave === 4) return abc;
  return `${abc.toLowerCase()}${"'".repeat(octave - 5)}`;
}

export function stradellaChordQuality(button: DiagramButton): "M" | "m" | "7" | "d" | null {
  if (button.kind === "chord-major") return "M";
  if (button.kind === "chord-minor") return "m";
  if (button.kind === "chord-dominant7") return "7";
  if (button.kind === "chord-diminished7") return "d";
  return null;
}
export function isStradellaBass(button: DiagramButton) {
  return button.kind === "bass-root" || button.kind === "bass-counterbass";
}
export function isStradellaChord(button: DiagramButton) {
  return button.kind.startsWith("chord-");
}
export function stradellaNoteForButton(button: DiagramButton, preferences: Pick<StradellaNotationPreferences, "markCounterbass"> = DEFAULT_STRADELLA_NOTATION): string {
  const kind = isStradellaChord(button) ? "chord" : "bass";
  const pitch = stradellaWrittenPitch((kind === "chord" ? button.chordRoot : button.pitchClass) ?? button.pitchClass ?? "C", kind);
  return preferences.markCounterbass && button.kind === "bass-counterbass" ? `"_–"${pitch}` : pitch;
}
/** Construct a single bass-clef event from physical button identities.
 * The chord marker is drawn above the upper note; no acoustic reed pitches.
 * The caller owns chronological durations, including actual rests.
 */
export function stradellaButtonToken(
  buttons: readonly DiagramButton[],
  preferences: StradellaNotationPreferences = DEFAULT_STRADELLA_NOTATION,
  previousQuality: string | null = null,
): { token: string; quality: string | null } {
  const relevant = buttons.filter(b => isStradellaBass(b) || isStradellaChord(b));
  if (!relevant.length) return { token: "z", quality: previousQuality };
  const chord = relevant.find(isStradellaChord);
  const quality = chord ? stradellaChordQuality(chord) : null;
  const annotation = quality && (preferences.chordQualityLabels === "always" || quality !== previousQuality)
    ? `"^${quality}"` : "";
  const noteheads = relevant.map(b => stradellaNoteForButton(b, preferences));
  return { token: `${annotation}${noteheads.length > 1 ? `[${noteheads.join("")}]` : noteheads[0]}`,
    quality: quality ?? previousQuality };
}
