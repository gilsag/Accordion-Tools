export type Side = "treble" | "stradella";

export type NotationMode = "english" | "solfege" | "intervals" | "blank";

export type AccidentalMode = "natural" | "flats" | "sharps";

export type ChordLabelMode = "chord-name" | "root-only" | "chord-tones" | "row-function";

export type TitleMode = "auto" | "custom" | "none";

export type FontFamily = "system" | "serif" | "mono" | "rounded";

export type LeftPanelMode = "settings" | "tools" | "hidden";

export type ColorTheme = "default" | "classic" | "pastel" | "print" | "warm" | "contrast";

export type AccidentalStyle = "dark" | "grey" | "outline" | "theme";

export type SequenceDisplayMode =
  | "numbers"
  | "straight-arrows"
  | "curved-arrows"
  | "numbers-and-straight-arrows"
  | "numbers-and-curved-arrows";

export type SequenceArrowStyle = "straight" | "curved";

export type SequenceColorPreset = "red" | "blue" | "black" | "grey" | "theme";

export type NumberPosition = "above" | "inside-top" | "inside-bottom";

export type TextNoteAnchor = "start" | "middle";

export type TrebleSizePreset = "small" | "full" | "large";

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

export type ButtonKind =
  | "treble-note"
  | "bass-counterbass"
  | "bass-root"
  | "chord-major"
  | "chord-minor"
  | "chord-dominant7"
  | "chord-diminished7";

export type DiagramButton = {
  id: string;
  x: number;
  y: number;
  row: number;
  column: number;
  kind: ButtonKind;
  pitchClass?: string;
  naturalName?: string;
  chordRoot?: string;
  chordNaturalName?: string;
  isReference?: boolean;
};

export type Overlay = {
  selected?: boolean;
  finger?: string;
};

export type SequenceStep = {
  id: string;
  step: number;
};

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

export type StradellaPreset = {
  start: number;
  count: number;
  rows: ButtonKind[];
};
