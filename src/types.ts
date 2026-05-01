/*
  Shared application types.

  These definitions describe the accordion sides, layout presets, notation modes,
  generated SVG buttons, and data used by the annotation tools.
*/

/** Selects which side of the accordion is shown. */
export type Side = "treble" | "stradella";

/** Controls the text system used for note labels. */
export type NotationMode = "english" | "solfege" | "intervals" | "blank";

/** Controls whether labels use layout spelling, forced flats, or forced sharps. */
export type AccidentalMode = "natural" | "flats" | "sharps";

/** Controls how Stradella chord buttons are labeled. */
export type ChordLabelMode = "none" | "chord-name" | "root-only" | "chord-tones" | "row-function";

/** Controls whether the diagram title is automatic, custom, or hidden. */
export type TitleMode = "auto" | "custom" | "none";

/** Named font-family choices used by diagram labels and text notes. */
export type FontFamily = "system" | "serif" | "mono" | "rounded";

/** Controls which left-side panel is visible. */
export type LeftPanelMode = "settings" | "tools" | "hidden";

/** Visual themes implemented in App.css. */
export type ColorTheme = "default" | "classic" | "pastel" | "print" | "warm" | "contrast";

/** Visual styles for treble accidental buttons. */
export type AccidentalStyle = "dark" | "grey" | "outline" | "theme";

/** Controls whether sequences show numbers, arrows, or both. */
export type SequenceDisplayMode =
  | "numbers"
  | "straight-arrows"
  | "curved-arrows"
  | "numbers-and-straight-arrows"
  | "numbers-and-curved-arrows";

/** Shape of the sequence connection line. */
export type SequenceArrowStyle = "straight" | "curved";

/** SVG text-anchor values used by free text notes. */
export type TextNoteAnchor = "start" | "middle";

/** Supported Stradella layout presets. */
export type BassCount =
  | "8"
  | "12"
  | "24"
  | "32"
  | "40"
  | "48-8x6"
  | "48-12x4"
  | "60"
  | "72"
  | "80"
  | "96"
  | "100"
  | "120";

/** Supported chromatic-button treble systems. */
export type TrebleSystem = "c-system" | "b-system";

/** Preset instrument ranges for the treble side. */
export type TrebleSizePreset = "small" | "full" | "large";

/** Placement options for fingering and sequence numbers. */
export type NumberPosition = "above" | "inside-top" | "inside-bottom";

/** Named colors for sequence arrows and sequence numbers. */
export type SequenceColorPreset = "red" | "blue" | "black" | "grey" | "theme";


/**
 * Finder is currently treble-only.
 * This type is kept for compatibility with older code and future Stradella support.
 */
export type FinderTarget = "treble";

/** Finder mode: separate scale-finding and chord-finding workflows. */
export type FinderMode = "scale" | "chord";

/** Scale patterns supported by the treble Finder tool. */
export type FinderScalePattern =
  | "major-scale"
  | "natural-minor-scale"
  | "harmonic-minor-scale"
  | "major-pentatonic-scale"
  | "minor-pentatonic-scale"
  | "major-blues-scale"
  | "minor-blues-scale"
  | "chromatic-scale";

/** Chord patterns supported by the treble Finder tool. */
export type FinderChordPattern =
  | "major-triad"
  | "minor-triad"
  | "augmented-triad"
  | "diminished-triad"
  | "sus4"
  | "dominant7"
  | "major7"
  | "minor7"
  | "minor7b5"
  | "diminished7";

/** Chord inversion choices used by the Finder chord workflow. */
export type FinderChordInversion = "root" | "first" | "second" | "third";

/** Backward-compatible union of all Finder patterns. */
export type FinderPattern = FinderScalePattern | FinderChordPattern;
/** Oscillator waveforms supported by the built-in Web Audio synth. */
export type SoundWaveform = "sine" | "triangle" | "sawtooth" | "square";

/** Higher-level synthesized reed/organ voices built from one or more oscillators. */
export type SoundVoicePreset =
  | "single"
  | "soft-reed"
  | "bright-reed"
  | "musette"
  | "organ"
  | "bass-reed";

/** Functional type of each generated diagram button. */
export type ButtonKind =
  | "treble-note"
  | "bass-counterbass"
  | "bass-root"
  | "chord-major"
  | "chord-minor"
  | "chord-dominant7"
  | "chord-diminished7";

/** Complete geometry and musical metadata for one button in the SVG diagram. */
export type DiagramButton = {
  id: string;
  x: number;
  y: number;
  row: number;
  column: number;
  kind: ButtonKind;

  /*
    Internal pitch identity used for calculations and forced spellings.
    Keep this normalized, usually with sharp pitch classes: C, C#, D, etc.
  */
  pitchClass?: string;

  /*
    Interface spelling used when Accidentals = Default spelling.
    This separates the internal note identity from the label shown to the user.
  */
  displayName?: string;

  /*
    Optional octave shown next to treble note labels when octave display is enabled.
  */
  octave?: number;

  /*
    Always-available octave used by sound playback. This remains present even
    when visual octave labels are hidden.
  */
  soundOctave?: number;

  /*
    Backward-compatible name field used by older generators.
    Prefer displayName for new layout code.
  */
  naturalName?: string;

  chordRoot?: string;
  chordDisplayName?: string;
  chordNaturalName?: string;
  isReference?: boolean;
};

/** User-added per-button state such as selection and fingering. */
export type Overlay = {
  selected?: boolean;
  finger?: string;
};

/** One recorded step in a sequence; repeated button IDs are allowed. */
export type SequenceStep = {
  id: string;
  step: number;
};

/** A free-positioned multiline note placed on the SVG diagram. */
export type TextNote = {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  font: FontFamily;
  anchor: TextNoteAnchor;
};

/** Defines which Stradella columns and rows are visible for a bass preset. */
export type StradellaPreset = {
  start: number;
  count: number;
  rows: ButtonKind[];
};
