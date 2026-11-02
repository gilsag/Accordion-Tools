/** Stable display options and label normalization extracted from the application
 * coordinator. These remain presentation-only: no React state or musical search. */
import type { BassCount, PianoTrebleRange, SequenceColorPreset, SequenceDisplayMode, TrebleSizePreset } from "../types";
import { PIANO_TREBLE_RANGE_PRESETS } from "../pianoTreble";
import type { InterfaceLanguage } from "../i18n/catalog";
import { translate } from "../i18n/catalog";
import { progressionName } from "../i18n/optionLabels";
import { chordProgressionSteps, type ChordProgressionDefinition } from "../tools/bassPatternPlayerTools";

/** Dropdown options for the supported Stradella bass presets. */
export const BASS_OPTIONS: Array<{ value: BassCount; label: string }> = [
  { value: "8", label: "8" },
  { value: "12", label: "12" },
  { value: "24", label: "24" },
  { value: "32", label: "32" },
  { value: "40", label: "40" },
  { value: "48-8x6", label: "48, 8×6" },
  { value: "48-12x4", label: "48, 12×4" },
  { value: "60", label: "60" },
  { value: "72", label: "72" },
  { value: "80", label: "80" },
  { value: "96", label: "96" },
  { value: "100", label: "100" },
  { value: "120", label: "120" },
];

/** Dropdown options for treble instrument range presets. */
export const TREBLE_SIZE_OPTIONS: Array<{ value: TrebleSizePreset; label: string }> = [
  { value: "one-octave", label: "1 octave (auto-expand if needed)" },
  { value: "two-octave", label: "2 octaves (auto-expand if needed)" },
  { value: "small", label: "Small CBA, about 3 octaves" },
  { value: "full", label: "Full-size CBA, about 3¾–4 octaves" },
  { value: "large", label: "Large CBA, about 5+ octaves" },
];

/** Dropdown options for piano treble keyboard ranges. */
export const PIANO_TREBLE_RANGE_OPTIONS: Array<{
  value: PianoTrebleRange;
  label: string;
}> = [
  {
    value: "two-octave",
    label: PIANO_TREBLE_RANGE_PRESETS["two-octave"].label,
  },
  {
    value: "three-octave",
    label: PIANO_TREBLE_RANGE_PRESETS["three-octave"].label,
  },
  {
    value: "four-octave",
    label: PIANO_TREBLE_RANGE_PRESETS["four-octave"].label,
  },
];

/** SVG viewBox widths chosen so each treble size has enough horizontal space. */
export const TREBLE_SIZE_VIEW_WIDTH: Record<TrebleSizePreset, number> = {
  "one-octave": 500,
  "two-octave": 650,
  small: 1080,
  full: 1220,
  large: 1460,
};

/** Named colors used by sequence arrows and sequence numbers. */
export const COLOR_PRESETS: Record<SequenceColorPreset, string> = {
  red: "#d4553f",
  blue: "#1746d0",
  black: "#111111",
  grey: "#666666",
  theme: "#1746d0",
};

export const SEQUENCE_DISPLAY_MODE_OPTIONS: Array<{
  value: SequenceDisplayMode;
  label: string;
}> = [
  { value: "numbers", label: "Numbers only" },
  { value: "straight-arrows", label: "Straight arrows" },
  { value: "curved-arrows", label: "Curved arrows" },
  { value: "numbers-and-straight-arrows", label: "Numbers + straight arrows" },
  { value: "numbers-and-curved-arrows", label: "Numbers + curved arrows" },
];

function normalizeProgressionText(value: string) {
  return value
    .replace(/[♭𝄫]/gu, "b")
    .replace(/[♯𝄪]/gu, "#")
    .replace(/[–—-]/g, " ")
    .replace(/[^A-Za-z0-9#b°+]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function formatProgressionOptionLabel(progression: ChordProgressionDefinition, language: InterfaceLanguage) {
  const localizedName = progressionName(progression.id, progression.name, language);
  const chordList = chordProgressionSteps(progression)
    .map((step) => step.symbol)
    .join(" ");
  if (!chordList) return localizedName;

  const normalizedName = normalizeProgressionText(progression.name);
  const normalizedChords = normalizeProgressionText(chordList);
  if (normalizedName.includes(normalizedChords)) return `${translate(language, "ui.progression")} — ${chordList}`;

  return `${localizedName} — ${chordList}`;
}
