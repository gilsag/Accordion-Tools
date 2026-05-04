/*
  Main application component.

  This file owns the user interface state, connects the layout generators to the
  SVG renderer, and coordinates tools such as fingering, sequences, and text
  notes. Music and layout calculations live in separate modules.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import "./App.css";

import type {
  AbcStradellaMode,
  AbcTrebleChordSymbolsMode,
  AccidentalMode,
  BassPatternChordVoicing,
  AccidentalStyle,
  BassCount,
  ChordLabelMode,
  ColorTheme,
  DiagramButton,
  DownloadFormat,
  FinderChordInversion,
  FinderChordOctave,
  FinderChordPattern,
  FinderScalePattern,
  FontFamily,
  InterfaceDensity,
  LeftPanelMode,
  NotationMode,
  Overlay,
  PianoTrebleRange,
  NumberPosition,
  SequenceColorPreset,
  SequenceDisplayMode,
  SequenceStep,
  Side,
  SoundVoicePreset,
  SoundWaveform,
  StradellaBassVoicing,
  StradellaChordFinderMode,
  TrebleLayout,
  TrebleSizePreset,
  TextNote,
  TextNoteAnchor,
  TitleMode,
} from "./types";

import {
  chordSuffix,
  chordTones,
  fontClass,
  formatPitch,
  INDEX_TO_PITCH,
  isAccidentalPitch,
  isChordKind,
  renderMusicLabel,
  rowFunction,
} from "./music";

import {
  generateStradella,
  stradellaRowLabel,
  stradellaVisibleRoots,
  stradellaVisibleRows,
} from "./stradella";

import { generateTreble } from "./treble";
import {
  generatePianoTreble,
  PIANO_TREBLE_RANGE_PRESETS,
  pianoTrebleWhiteKeyCount,
} from "./pianoTreble";
import { downloadPng, downloadSvg } from "./download";
import {
  getSequenceLabelsForButton,
  getSequenceStepsWithButtons,
  makeSequenceArrowPath,
  sequenceArrowStyleFromMode,
  sequenceModeShowsArrows,
  sequenceModeShowsNumbers,
} from "./tools/sequenceTools";
import { makeTextNote, splitMultilineText } from "./tools/textNoteTools";
import {
  FINDER_ROOT_OPTIONS,
  SCALE_FINDER_OPTIONS,
  SCALE_FINDER_ROW_LIMIT_OPTIONS,
  getScaleFinderTrebleButtons,
} from "./tools/scaleFinderTools";
import { getStradellaScaleFinderResult } from "./tools/stradellaScaleFinderTools";
import {
  abcMissingNotes,
  mapAbcEventsToStradellaButtons,
  mapAbcEventsToTrebleButtons,
  parseAbc,
  totalAbcBeats,
  type MappedAbcEvent,
} from "./tools/abcPlayerTools";
import {
  bassPatternMissingItems,
  makeBassPatternEvents,
  totalBassPatternBeats,
  type BassPatternDefinition,
  type BassPatternPlaybackEvent,
  type ChordProgressionDefinition,
} from "./tools/bassPatternPlayerTools";
import { getChordFinderTrebleButtons } from "./tools/chordFinderTools";
import { intervalsForChordFinder } from "./music/chordDefinitions";
import { getStradellaChordFinderResult } from "./tools/stradellaChordFinderTools";
import {
  playButtonArpeggioThenChord,
  playButtonCombination,
  playButtonSequence,
  playButtonSound,
  stopAllSound,
} from "./sound";
import { AboutPanel } from "./components/settings/AboutPanel";
import { TrebleChordFinderPanel } from "./components/tools/TrebleChordFinderPanel";
import { StradellaChordFinderPanel } from "./components/tools/StradellaChordFinderPanel";
import { HelpTip } from "./components/ui/HelpTip";


/** Dropdown options for the supported Stradella bass presets. */
const BASS_OPTIONS: Array<{ value: BassCount; label: string }> = [
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

const ABC_EXAMPLE_OPTIONS = [
  { value: "", label: "Choose example…", file: "" },
  { value: "c-major-scale", label: "C major scale", file: "abc/c-major-scale.abc" },
  { value: "happy-birthday", label: "Happy Birthday", file: "abc/happy-birthday.abc" },
  { value: "twinkle-little-star", label: "Twinkle Little Star", file: "abc/twinkle-little-star.abc" },
  { value: "dyads-and-chords", label: "Dyads and chords", file: "abc/dyads-and-chords.abc" },
  { value: "stradella-chord-symbols", label: "Stradella chord symbols", file: "abc/stradella-chord-symbols.abc" },
];


/** Dropdown options for treble instrument range presets. */
const TREBLE_SIZE_OPTIONS: Array<{ value: TrebleSizePreset; label: string }> = [
  { value: "small", label: "Small CBA, about 3 octaves" },
  { value: "full", label: "Full-size CBA, about 3¾–4 octaves" },
  { value: "large", label: "Large CBA, about 5+ octaves" },
];

/** Dropdown options for piano treble keyboard ranges. */
const PIANO_TREBLE_RANGE_OPTIONS: Array<{ value: PianoTrebleRange; label: string }> = [
  { value: "two-octave", label: PIANO_TREBLE_RANGE_PRESETS["two-octave"].label },
  { value: "three-octave", label: PIANO_TREBLE_RANGE_PRESETS["three-octave"].label },
  { value: "four-octave", label: PIANO_TREBLE_RANGE_PRESETS["four-octave"].label },
];

/** SVG viewBox widths chosen so each treble size has enough horizontal space. */
const TREBLE_SIZE_VIEW_WIDTH: Record<TrebleSizePreset, number> = {
  small: 1080,
  full: 1220,
  large: 1460,
};

/** Default button sizes applied when a treble size preset is selected. */
const TREBLE_PRESET_BUTTON_SIZE: Record<TrebleSizePreset, number> = {
  small: 28,
  full: 24,
  large: 20,
};

/** Default key-size slider values applied when a piano range is selected. */
const PIANO_TREBLE_PRESET_BUTTON_SIZE: Record<PianoTrebleRange, number> = {
  "two-octave": 28,
  "three-octave": 24,
  "four-octave": 20,
};

/** Named colors used by sequence arrows and sequence numbers. */
const COLOR_PRESETS: Record<SequenceColorPreset, string> = {
  red: "#d4553f",
  blue: "#1746d0",
  black: "#111111",
  grey: "#666666",
  theme: "#1746d0",
};

type DefaultSettingsFile = Partial<{
  side: Side;
  notation: NotationMode;
  accidental: AccidentalMode;
  chordLabelMode: ChordLabelMode;
  basses: BassCount;
  trebleLayout: TrebleLayout;
  trebleRows: 3 | 4 | 5;
  trebleSize: TrebleSizePreset;
  pianoTrebleRange: PianoTrebleRange;
  showTrebleOctaves: boolean;
  diagramVerticalSpacing: number;
  pianoKeyWidthScale: number;
  pianoKeyHeightScale: number;
  pianoBlackKeyWidthScale: number;
  pianoBlackKeyHeightScale: number;
  diagramScale: number;
  interfaceDensity: InterfaceDensity;
  showStatusBar: boolean;
  scaleFinderDisplayMode: SequenceDisplayMode;
  colorTheme: ColorTheme;
  titleMode: TitleMode;
  customTitle: string;
  showButtonLabels: boolean;
  showBellowsGuide: boolean;
  showStradellaRowLabels: boolean;
  selectionOnClick: boolean;
  downloadFormat: DownloadFormat;
  soundEnabled: boolean;
  stradellaBassVoicing: StradellaBassVoicing;
  stradellaChordFinderMode: StradellaChordFinderMode;
  stradellaChordFinderMarkRootBass: boolean;
  abcStradellaMode: AbcStradellaMode;
  abcTrebleChordSymbolsMode: AbcTrebleChordSymbolsMode;
  bassPatternChordVoicing: BassPatternChordVoicing;
}>;

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

const SEQUENCE_DISPLAY_MODE_OPTIONS: Array<{ value: SequenceDisplayMode; label: string }> = [
  { value: "numbers", label: "Numbers only" },
  { value: "straight-arrows", label: "Straight arrows" },
  { value: "curved-arrows", label: "Curved arrows" },
  { value: "numbers-and-straight-arrows", label: "Numbers + straight arrows" },
  { value: "numbers-and-curved-arrows", label: "Numbers + curved arrows" },
];

const SEQUENCE_DISPLAY_MODE_VALUES = SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => option.value);

function finderLabelsForButton(buttons: DiagramButton[], buttonId: string) {
  return buttons
    .map((button, index) => (button.id === buttonId ? String(index + 1) : ""))
    .filter(Boolean)
    .join(",");
}

function notationLabel(notation: NotationMode) {
  if (notation === "english") return "English notation";
  if (notation === "german") return "German notation";
  if (notation === "solfege") return "Solfege";
  if (notation === "intervals") return "Intervals";
  return "Blank labels";
}

function trebleLayoutLabel(layout: TrebleLayout) {
  if (layout === "c-system") return "C-system";
  if (layout === "b-system") return "B-system / Bayan";
  return "Piano";
}

/** Calculates the y-coordinate for a sequence number relative to a button. */
function numberY(
  buttonY: number,
  buttonSize: number,
  position: NumberPosition,
) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

/** Calculates the y-coordinate for a fingering label relative to a button. */
function fingeringY(
  buttonY: number,
  buttonSize: number,
  position: NumberPosition,
) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

/** Renders the full accordion diagram generator application. */
function App() {
  /* Reference to the SVG element, used for downloads and click-coordinate conversion. */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const previousLayoutSignatureRef = useRef<string | null>(null);
  const abcPlaybackTimeoutsRef = useRef<number[]>([]);
  const abcPlaybackStartedAtRef = useRef<number | null>(null);
  const abcPlaybackStartBeatRef = useRef(0);

  /* Core layout and notation state. */
  const [side, setSide] = useState<Side>("stradella");
  const [notation, setNotation] = useState<NotationMode>("english");
  const [accidental, setAccidental] = useState<AccidentalMode>("natural");
  const [chordLabelMode, setChordLabelMode] =
    useState<ChordLabelMode>("chord-name");
  const [basses, setBasses] = useState<BassCount>("96");
  const [trebleLayout, setTrebleLayout] = useState<TrebleLayout>("c-system");
  const [trebleRows, setTrebleRows] = useState<3 | 4 | 5>(5);
  const [trebleSize, setTrebleSize] = useState<TrebleSizePreset>("small");
  const [pianoTrebleRange, setPianoTrebleRange] =
    useState<PianoTrebleRange>("three-octave");
  const [showTrebleOctaves, setShowTrebleOctaves] = useState(false);

  /* Appearance state shared by Stradella and treble diagrams. */
  const [buttonSize, setButtonSize] = useState(TREBLE_PRESET_BUTTON_SIZE.small);
  const [spacing, setSpacing] = useState(2.3);
  const [diagramVerticalSpacing, setDiagramVerticalSpacing] = useState(18);
  const [pianoKeyWidthScale, setPianoKeyWidthScale] = useState(1);
  const [pianoKeyHeightScale, setPianoKeyHeightScale] = useState(1);
  const [pianoBlackKeyWidthScale, setPianoBlackKeyWidthScale] = useState(1);
  const [pianoBlackKeyHeightScale, setPianoBlackKeyHeightScale] = useState(1);
  const [diagramScale, setDiagramScale] = useState(100);
  const [interfaceDensity, setInterfaceDensity] = useState<InterfaceDensity>("compact");
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [trebleAngle, setTrebleAngle] = useState(30);
  const [buttonStrokeWidth, setButtonStrokeWidth] = useState(3);
  const [referenceStrokeWidth, setReferenceStrokeWidth] = useState(6);
  const [chordFillStrength, setChordFillStrength] = useState(100);
  const [accidentalStyle, setAccidentalStyle] =
    useState<AccidentalStyle>("grey");
  const [labelFontSize, setLabelFontSize] = useState(13);
  const [showButtonLabels, setShowButtonLabels] = useState(true);
  const [showBellowsGuide, setShowBellowsGuide] = useState(true);
  const [showStradellaRowLabels, setShowStradellaRowLabels] = useState(true);

  /* Title and label font state. */
  const [titleMode, setTitleMode] = useState<TitleMode>("auto");
  const [customTitle, setCustomTitle] = useState("My accordion diagram");
  const [titleFont, setTitleFont] = useState<FontFamily>("system");
  const [titleSize, setTitleSize] = useState(24);
  const [labelFont, setLabelFont] = useState<FontFamily>("system");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default");

  /* Left panel visibility and accordion-section state. */
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("settings");

  type SettingsSection =
    | "layout"
    | "title"
    | "appearance"
    | "notation"
    | "sound"
    | "about"
    | null;
  type ToolSection =
    | "scaleFinder"
    | "chordFinder"
    | "abcPlayer"
    | "bassPatternPlayer"
    | "stradellaChordFinder"
    | "fingering"
    | "selection"
    | "sequences"
    | "textNotes"
    | null;

  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSection>(null);

  const [activeToolSection, setActiveToolSection] =
    useState<ToolSection>(null);

  /* Tool state for selections, fingerings, note sequences, and free text notes. */
  const [overlays, setOverlays] = useState<Record<string, Overlay>>({});
  const [isRecordingSequence, setIsRecordingSequence] = useState(false);
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [sequenceDisplayMode, setSequenceDisplayMode] =
    useState<SequenceDisplayMode>("numbers-and-curved-arrows");
  const [sequenceColorPreset, setSequenceColorPreset] =
    useState<SequenceColorPreset>("red");
  const [sequenceThickness, setSequenceThickness] = useState(3.2);
  const [sequenceArrowheadSize, setSequenceArrowheadSize] = useState(4);
  const [sequenceNumberFontSize, setSequenceNumberFontSize] = useState(10);
  const [sequenceNumberColorPreset, setSequenceNumberColorPreset] =
    useState<SequenceColorPreset>("red");
  const [sequenceNumberPosition, setSequenceNumberPosition] =
    useState<NumberPosition>("above");
  const [fingeringPosition, setFingeringPosition] =
    useState<NumberPosition>("inside-bottom");
  const [fingeringDraft, setFingeringDraft] = useState("1");
  const [isApplyingFingering, setIsApplyingFingering] = useState(false);
  const [selectionOnClick, setSelectionOnClick] = useState(false);

  /* Scale Finder state for temporary treble-only scale highlights. */
  const [scaleFinderActive, setScaleFinderActive] = useState(false);
  const [scaleFinderRoot, setScaleFinderRoot] = useState("C");
  const [scaleFinderPattern, setScaleFinderPattern] =
    useState<FinderScalePattern>("major-scale");
  const [scaleFinderRowLimit, setScaleFinderRowLimit] = useState<3 | 4 | 5>(5);
  const [scaleFinderDisplayMode, setScaleFinderDisplayMode] =
    useState<SequenceDisplayMode>("numbers-and-straight-arrows");

  /* Chord Finder state for temporary treble-only chord highlights. */
  const [chordFinderActive, setChordFinderActive] = useState(false);
  const [chordFinderRoot, setChordFinderRoot] = useState("C");
  const [chordFinderPattern, setChordFinderPattern] =
    useState<FinderChordPattern>("major-triad");
  const [chordFinderInversion, setChordFinderInversion] =
    useState<FinderChordInversion>("root");
  const [chordFinderOctave, setChordFinderOctave] =
    useState<FinderChordOctave>(4);

  /* ABC Player state for file/paste playback and diagram highlighting. */
  const [abcText, setAbcText] = useState("");
  const [abcFileName, setAbcFileName] = useState("");
  const [abcExampleValue, setAbcExampleValue] = useState("");
  const [abcTempoBpm, setAbcTempoBpm] = useState(120);
  const [abcPositionBeat, setAbcPositionBeat] = useState(0);
  const [abcPlaybackState, setAbcPlaybackState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [abcActiveButtonIds, setAbcActiveButtonIds] = useState<string[]>([]);
  const [abcStradellaMode, setAbcStradellaMode] = useState<AbcStradellaMode>("bass-notes-only");
  const [abcTrebleChordSymbolsMode, setAbcTrebleChordSymbolsMode] =
    useState<AbcTrebleChordSymbolsMode>("ignore");

  /* Stradella Bass Pattern Player state. */
  const [bassPatternDefinitions, setBassPatternDefinitions] = useState<BassPatternDefinition[]>([]);
  const [chordProgressionDefinitions, setChordProgressionDefinitions] = useState<ChordProgressionDefinition[]>([]);
  const [bassPatternId, setBassPatternId] = useState("polka");
  const [chordProgressionId, setChordProgressionId] = useState("i-iv-v-i");
  const [bassPatternRoot, setBassPatternRoot] = useState("C");
  const [bassPatternTempoBpm, setBassPatternTempoBpm] = useState(120);
  const [bassPatternChordVoicing, setBassPatternChordVoicing] =
    useState<BassPatternChordVoicing>("simple");
  const [bassPatternPlaybackState, setBassPatternPlaybackState] = useState<"stopped" | "playing">("stopped");
  const [bassPatternActiveButtonIds, setBassPatternActiveButtonIds] = useState<string[]>([]);
  const bassPatternTimeoutsRef = useRef<number[]>([]);

  /* Stradella Chord Finder state for Stradella-only chord exploration. */
  const [stradellaChordFinderActive, setStradellaChordFinderActive] = useState(false);
  const [stradellaChordFinderRoot, setStradellaChordFinderRoot] = useState("C");
  const [stradellaChordFinderPattern, setStradellaChordFinderPattern] =
    useState<FinderChordPattern>("major-triad");
  const [stradellaChordFinderMode, setStradellaChordFinderMode] =
    useState<StradellaChordFinderMode>("chord-buttons-only");
  const [stradellaChordFinderMarkRootBass, setStradellaChordFinderMarkRootBass] =
    useState(true);

  const [noteDraft, setNoteDraft] = useState("Remember\nbellows direction");
  const [isPlacingTextNote, setIsPlacingTextNote] = useState(false);
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [textNoteFontSize, setTextNoteFontSize] = useState(15);
  const [textNoteColor, setTextNoteColor] = useState("#172033");
  const [textNoteFont, setTextNoteFont] = useState<FontFamily>("system");
  const [textNoteAnchor, setTextNoteAnchor] = useState<TextNoteAnchor>("start");

  /* Sound tool state for synthesized button and sequence playback. */
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.2);
  const [soundVoicePreset, setSoundVoicePreset] =
    useState<SoundVoicePreset>("soft-reed");
  const [soundWaveform, setSoundWaveform] = useState<SoundWaveform>("triangle");
  const [soundMusetteDetuneCents, setSoundMusetteDetuneCents] = useState(9);
  const [soundAttackMs, setSoundAttackMs] = useState(14);
  const [soundReleaseMs, setSoundReleaseMs] = useState(120);
  const [soundNoteDurationMs, setSoundNoteDurationMs] = useState(420);
  const [soundSequenceTempoBpm, setSoundSequenceTempoBpm] = useState(90);
  const [stradellaBassVoicing, setStradellaBassVoicing] =
    useState<StradellaBassVoicing>("single-low");
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("svg");

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultSettings() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}default-settings.json`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const defaults = (await response.json()) as DefaultSettingsFile;
        if (cancelled || !defaults || typeof defaults !== "object") return;

        if (isOneOf(defaults.side, ["stradella", "treble"] as const)) {
          setSide(defaults.side);
        }
        if (isOneOf(defaults.notation, ["english", "german", "solfege", "intervals", "blank"] as const)) {
          setNotation(defaults.notation);
        }
        if (isOneOf(defaults.accidental, ["natural", "flats", "sharps"] as const)) {
          setAccidental(defaults.accidental);
        }
        if (isOneOf(defaults.chordLabelMode, ["none", "chord-name", "root-only", "chord-tones", "row-function"] as const)) {
          setChordLabelMode(defaults.chordLabelMode);
        }
        if (isOneOf(defaults.basses, ["8", "12", "24", "32", "40", "48-8x6", "48-12x4", "60", "72", "80", "96", "100", "120"] as const)) {
          setBasses(defaults.basses);
        }
        if (isOneOf(defaults.trebleLayout, ["c-system", "b-system", "piano"] as const)) {
          setTrebleLayout(defaults.trebleLayout);
        }
        if ([3, 4, 5].includes(Number(defaults.trebleRows))) {
          setTrebleRows(Number(defaults.trebleRows) as 3 | 4 | 5);
        }
        if (isOneOf(defaults.trebleSize, ["small", "full", "large"] as const)) {
          setTrebleSize(defaults.trebleSize);
        }
        if (isOneOf(defaults.pianoTrebleRange, ["two-octave", "three-octave", "four-octave"] as const)) {
          setPianoTrebleRange(defaults.pianoTrebleRange);
        }
        if (typeof defaults.showTrebleOctaves === "boolean") {
          setShowTrebleOctaves(defaults.showTrebleOctaves);
        }
        if (typeof defaults.diagramVerticalSpacing === "number") {
          setDiagramVerticalSpacing(Math.max(0, Math.min(80, defaults.diagramVerticalSpacing)));
        }
        if (typeof defaults.pianoKeyWidthScale === "number") {
          setPianoKeyWidthScale(Math.max(0.75, Math.min(1.45, defaults.pianoKeyWidthScale)));
        }
        if (typeof defaults.pianoKeyHeightScale === "number") {
          setPianoKeyHeightScale(Math.max(0.75, Math.min(1.8, defaults.pianoKeyHeightScale)));
        }
        if (typeof defaults.pianoBlackKeyWidthScale === "number") {
          setPianoBlackKeyWidthScale(Math.max(0.75, Math.min(1.35, defaults.pianoBlackKeyWidthScale)));
        }
        if (typeof defaults.pianoBlackKeyHeightScale === "number") {
          setPianoBlackKeyHeightScale(Math.max(0.75, Math.min(1.5, defaults.pianoBlackKeyHeightScale)));
        }
        if (typeof defaults.diagramScale === "number") {
          setDiagramScale(Math.max(70, Math.min(140, defaults.diagramScale)));
        }
        if (isOneOf(defaults.interfaceDensity, ["compact", "comfortable"] as const)) {
          setInterfaceDensity(defaults.interfaceDensity);
        }
        if (typeof defaults.showStatusBar === "boolean") {
          setShowStatusBar(defaults.showStatusBar);
        }
        if (isOneOf(defaults.scaleFinderDisplayMode, SEQUENCE_DISPLAY_MODE_VALUES)) {
          setScaleFinderDisplayMode(defaults.scaleFinderDisplayMode);
        }
        if (isOneOf(defaults.colorTheme, ["default", "classic", "pastel", "print", "warm", "contrast"] as const)) {
          setColorTheme(defaults.colorTheme);
        }
        if (isOneOf(defaults.titleMode, ["auto", "custom", "none"] as const)) {
          setTitleMode(defaults.titleMode);
        }
        if (typeof defaults.customTitle === "string") {
          setCustomTitle(defaults.customTitle);
        }
        if (typeof defaults.showButtonLabels === "boolean") {
          setShowButtonLabels(defaults.showButtonLabels);
        }
        if (typeof defaults.showBellowsGuide === "boolean") {
          setShowBellowsGuide(defaults.showBellowsGuide);
        }
        if (typeof defaults.showStradellaRowLabels === "boolean") {
          setShowStradellaRowLabels(defaults.showStradellaRowLabels);
        }
        if (typeof defaults.selectionOnClick === "boolean") {
          setSelectionOnClick(defaults.selectionOnClick);
        }
        if (isOneOf(defaults.downloadFormat, ["svg", "png"] as const)) {
          setDownloadFormat(defaults.downloadFormat);
        }
        if (typeof defaults.soundEnabled === "boolean") {
          setSoundEnabled(defaults.soundEnabled);
        }
        if (isOneOf(defaults.stradellaBassVoicing, ["single-low", "low-and-middle", "single-middle"] as const)) {
          setStradellaBassVoicing(defaults.stradellaBassVoicing);
        }
        if (isOneOf(defaults.stradellaChordFinderMode, ["bass-only", "chord-buttons-only", "bass-and-chords"] as const)) {
          setStradellaChordFinderMode(defaults.stradellaChordFinderMode);
        }
        if (typeof defaults.stradellaChordFinderMarkRootBass === "boolean") {
          setStradellaChordFinderMarkRootBass(defaults.stradellaChordFinderMarkRootBass);
        }
        if (isOneOf(defaults.abcStradellaMode, ["bass-notes-only", "chord-symbols-only", "bass-notes-and-chord-symbols"] as const)) {
          setAbcStradellaMode(defaults.abcStradellaMode);
        }
        if (isOneOf(defaults.abcTrebleChordSymbolsMode, ["ignore", "play"] as const)) {
          setAbcTrebleChordSymbolsMode(defaults.abcTrebleChordSymbolsMode);
        }
        if (isOneOf(defaults.bassPatternChordVoicing, ["simple", "full"] as const)) {
          setBassPatternChordVoicing(defaults.bassPatternChordVoicing);
        }
      } catch {
        /* The app still runs with built-in defaults if the editable file is missing or invalid. */
      }
    }

    loadDefaultSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBassPatternData() {
      try {
        const [patternsResponse, progressionsResponse] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}bass-patterns/bass-patterns.json`),
          fetch(`${import.meta.env.BASE_URL}chord-progressions/chord-progressions.json`),
        ]);

        if (!patternsResponse.ok || !progressionsResponse.ok) return;

        const patterns = (await patternsResponse.json()) as BassPatternDefinition[];
        const progressions = (await progressionsResponse.json()) as ChordProgressionDefinition[];
        if (cancelled) return;

        if (Array.isArray(patterns) && patterns.length > 0) {
          setBassPatternDefinitions(patterns);
          setBassPatternId((current) => patterns.some((pattern) => pattern.id === current) ? current : patterns[0].id);
        }

        if (Array.isArray(progressions) && progressions.length > 0) {
          setChordProgressionDefinitions(progressions);
          setChordProgressionId((current) => progressions.some((progression) => progression.id === current) ? current : progressions[0].id);
        }
      } catch {
        /* Bass pattern files are optional; the rest of the app still works without them. */
      }
    }

    loadBassPatternData();
    return () => {
      cancelled = true;
    };
  }, []);


  /** Applies a settings JSON object without changing the editable default-settings.json file. */
  function applyImportedSettings(settings: DefaultSettingsFile) {
    if (!settings || typeof settings !== "object") return;

    if (isOneOf(settings.side, ["stradella", "treble"] as const)) setSide(settings.side);
    if (isOneOf(settings.notation, ["english", "german", "solfege", "intervals", "blank"] as const)) setNotation(settings.notation);
    if (isOneOf(settings.accidental, ["natural", "flats", "sharps"] as const)) setAccidental(settings.accidental);
    if (isOneOf(settings.chordLabelMode, ["none", "chord-name", "root-only", "chord-tones", "row-function"] as const)) setChordLabelMode(settings.chordLabelMode);
    if (isOneOf(settings.basses, ["8", "12", "24", "32", "40", "48-8x6", "48-12x4", "60", "72", "80", "96", "100", "120"] as const)) setBasses(settings.basses);
    if (isOneOf(settings.trebleLayout, ["c-system", "b-system", "piano"] as const)) setTrebleLayout(settings.trebleLayout);
    if ([3, 4, 5].includes(Number(settings.trebleRows))) setTrebleRows(Number(settings.trebleRows) as 3 | 4 | 5);
    if (isOneOf(settings.trebleSize, ["small", "full", "large"] as const)) setTrebleSize(settings.trebleSize);
    if (isOneOf(settings.pianoTrebleRange, ["two-octave", "three-octave", "four-octave"] as const)) setPianoTrebleRange(settings.pianoTrebleRange);
    if (typeof settings.showTrebleOctaves === "boolean") setShowTrebleOctaves(settings.showTrebleOctaves);
    if (typeof settings.diagramVerticalSpacing === "number") setDiagramVerticalSpacing(Math.max(0, Math.min(80, settings.diagramVerticalSpacing)));
    if (typeof settings.pianoKeyWidthScale === "number") setPianoKeyWidthScale(Math.max(0.75, Math.min(1.45, settings.pianoKeyWidthScale)));
    if (typeof settings.pianoKeyHeightScale === "number") setPianoKeyHeightScale(Math.max(0.75, Math.min(1.8, settings.pianoKeyHeightScale)));
    if (typeof settings.pianoBlackKeyWidthScale === "number") setPianoBlackKeyWidthScale(Math.max(0.75, Math.min(1.35, settings.pianoBlackKeyWidthScale)));
    if (typeof settings.pianoBlackKeyHeightScale === "number") setPianoBlackKeyHeightScale(Math.max(0.75, Math.min(1.5, settings.pianoBlackKeyHeightScale)));
    if (typeof settings.diagramScale === "number") setDiagramScale(Math.max(70, Math.min(140, settings.diagramScale)));
    if (isOneOf(settings.interfaceDensity, ["compact", "comfortable"] as const)) setInterfaceDensity(settings.interfaceDensity);
    if (typeof settings.showStatusBar === "boolean") setShowStatusBar(settings.showStatusBar);
    if (isOneOf(settings.scaleFinderDisplayMode, SEQUENCE_DISPLAY_MODE_VALUES)) setScaleFinderDisplayMode(settings.scaleFinderDisplayMode);
    if (isOneOf(settings.colorTheme, ["default", "classic", "pastel", "print", "warm", "contrast"] as const)) setColorTheme(settings.colorTheme);
    if (isOneOf(settings.titleMode, ["auto", "custom", "none"] as const)) setTitleMode(settings.titleMode);
    if (typeof settings.customTitle === "string") setCustomTitle(settings.customTitle);
    if (typeof settings.showButtonLabels === "boolean") setShowButtonLabels(settings.showButtonLabels);
    if (typeof settings.showBellowsGuide === "boolean") setShowBellowsGuide(settings.showBellowsGuide);
    if (typeof settings.showStradellaRowLabels === "boolean") setShowStradellaRowLabels(settings.showStradellaRowLabels);
    if (typeof settings.selectionOnClick === "boolean") setSelectionOnClick(settings.selectionOnClick);
    if (isOneOf(settings.downloadFormat, ["svg", "png"] as const)) setDownloadFormat(settings.downloadFormat);
    if (typeof settings.soundEnabled === "boolean") setSoundEnabled(settings.soundEnabled);
    if (isOneOf(settings.stradellaBassVoicing, ["single-low", "low-and-middle", "single-middle"] as const)) setStradellaBassVoicing(settings.stradellaBassVoicing);
    if (isOneOf(settings.stradellaChordFinderMode, ["bass-only", "chord-buttons-only", "bass-and-chords"] as const)) setStradellaChordFinderMode(settings.stradellaChordFinderMode);
    if (typeof settings.stradellaChordFinderMarkRootBass === "boolean") setStradellaChordFinderMarkRootBass(settings.stradellaChordFinderMarkRootBass);
    if (isOneOf(settings.abcStradellaMode, ["bass-notes-only", "chord-symbols-only", "bass-notes-and-chord-symbols"] as const)) setAbcStradellaMode(settings.abcStradellaMode);
    if (isOneOf(settings.abcTrebleChordSymbolsMode, ["ignore", "play"] as const)) setAbcTrebleChordSymbolsMode(settings.abcTrebleChordSymbolsMode);
    if (isOneOf(settings.bassPatternChordVoicing, ["simple", "full"] as const)) setBassPatternChordVoicing(settings.bassPatternChordVoicing);
  }

  /** Collects the current persistent settings in the same shape as public/default-settings.json. */
  function collectCurrentSettings(): DefaultSettingsFile {
    return {
      side,
      notation,
      accidental,
      chordLabelMode,
      basses,
      trebleLayout,
      trebleRows,
      trebleSize,
      pianoTrebleRange,
      showTrebleOctaves,
      colorTheme,
      titleMode,
      customTitle,
      showButtonLabels,
      showBellowsGuide,
      showStradellaRowLabels,
      selectionOnClick,
      downloadFormat,
      soundEnabled,
      stradellaBassVoicing,
      stradellaChordFinderMarkRootBass,
      stradellaChordFinderMode,
      diagramVerticalSpacing,
      pianoKeyWidthScale,
      pianoKeyHeightScale,
      pianoBlackKeyWidthScale,
      pianoBlackKeyHeightScale,
      diagramScale,
      interfaceDensity,
      showStatusBar,
      scaleFinderDisplayMode,
      abcStradellaMode,
      abcTrebleChordSymbolsMode,
      bassPatternChordVoicing,
    };
  }

  /** Downloads current app settings as a separate JSON file. */
  function downloadCurrentSettings() {
    const blob = new Blob([JSON.stringify(collectCurrentSettings(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "accordion-tools-settings.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  /** Imports a settings JSON file and applies it to the current session. */
  async function importSettingsFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const settings = JSON.parse(text) as DefaultSettingsFile;
      applyImportedSettings(settings);
    } catch {
      window.alert("Could not read this settings file. Please choose a valid Accordion-Tools settings JSON file.");
    }
  }

  /** Applies a treble size preset and its matching default button size. */
  function changeTrebleSize(nextSize: TrebleSizePreset) {
    setTrebleSize(nextSize);
    setButtonSize(TREBLE_PRESET_BUTTON_SIZE[nextSize]);
  }

  /** Changes between C-system, B-system, and piano treble layouts. */
  function changeTrebleLayout(nextLayout: TrebleLayout) {
    setTrebleLayout(nextLayout);
    if (nextLayout === "piano") {
      setButtonSize(PIANO_TREBLE_PRESET_BUTTON_SIZE[pianoTrebleRange]);
      return;
    }
    setButtonSize(TREBLE_PRESET_BUTTON_SIZE[trebleSize]);
  }

  /** Applies a piano treble range preset and its matching default key size. */
  function changePianoTrebleRange(nextRange: PianoTrebleRange) {
    setPianoTrebleRange(nextRange);
    setButtonSize(PIANO_TREBLE_PRESET_BUTTON_SIZE[nextRange]);
  }

  const isTrebleLikeSide = side === "treble";
  const isPianoTreble = side === "treble" && trebleLayout === "piano";

  /* Generated button list for the current side and layout settings. */
  const buttons = useMemo(() => {
    if (side === "stradella") {
      return generateStradella(basses, buttonSize, spacing, accidental, diagramVerticalSpacing);
    }

    if (isPianoTreble) {
      return generatePianoTreble(
        pianoTrebleRange,
        buttonSize,
        spacing,
        showTrebleOctaves,
        {
          keyWidthScale: pianoKeyWidthScale,
          keyHeightScale: pianoKeyHeightScale,
          blackKeyWidthScale: pianoBlackKeyWidthScale,
          blackKeyHeightScale: pianoBlackKeyHeightScale,
          verticalOffset: diagramVerticalSpacing,
        },
      );
    }

    return generateTreble(
      trebleLayout === "piano" ? "c-system" : trebleLayout,
      trebleRows,
      trebleSize,
      buttonSize,
      spacing,
      trebleAngle,
      showTrebleOctaves,
      diagramVerticalSpacing,
    );
  }, [
    side,
    basses,
    trebleLayout,
    trebleRows,
    trebleSize,
    pianoTrebleRange,
    buttonSize,
    spacing,
    diagramVerticalSpacing,
    pianoKeyWidthScale,
    pianoKeyHeightScale,
    pianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale,
    trebleAngle,
    accidental,
    showTrebleOctaves,
  ]);

  /* Signature of layout-changing options used to clear stale tool markings. */
  const layoutSignature = [
    side,
    basses,
    trebleLayout,
    trebleRows,
    trebleSize,
    pianoTrebleRange,
    buttonSize,
    spacing,
    diagramVerticalSpacing,
    pianoKeyWidthScale,
    pianoKeyHeightScale,
    pianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale,
    trebleAngle,
    showTrebleOctaves,
  ].join("|");

  /* Clears tool-created marks whenever the physical layout changes. */
  useEffect(() => {
    if (previousLayoutSignatureRef.current === null) {
      previousLayoutSignatureRef.current = layoutSignature;
      return;
    }

    if (previousLayoutSignatureRef.current !== layoutSignature) {
      setOverlays({});
      setSequenceSteps([]);
      setIsRecordingSequence(false);
      setIsApplyingFingering(false);
      setTextNotes([]);
      setIsPlacingTextNote(false);
      setScaleFinderActive(false);
    setChordFinderActive(false);
    setStradellaChordFinderActive(false);
      setStradellaChordFinderActive(false);
      previousLayoutSignatureRef.current = layoutSignature;
    }
  }, [layoutSignature]);

  /* Button IDs currently selected through the selection/fingering tool. */
  const selectedButtonIds = Object.entries(overlays)
    .filter(([, overlay]) => overlay.selected)
    .map(([id]) => id);

  const selectedButtons = selectedButtonIds
    .map((id) => buttons.find((button) => button.id === id))
    .filter(Boolean) as DiagramButton[];

  /* Sequence steps enriched with current button geometry for arrow rendering. */
  const sequenceStepsWithButtons = getSequenceStepsWithButtons(
    sequenceSteps,
    buttons,
  );

  /* Exact buttons currently highlighted by the Scale Finder tool. */
  const stradellaScaleFinderResult = useMemo(() => {
    if (side !== "stradella") {
      return {
        buttons: [],
        targetPitches: [],
        missingPitches: [],
        found: false,
      };
    }

    return getStradellaScaleFinderResult(buttons, scaleFinderRoot, scaleFinderPattern);
  }, [buttons, scaleFinderRoot, scaleFinderPattern, side]);

  const scaleFinderButtons = useMemo(() => {
    if (!scaleFinderActive) return [];

    if (side === "stradella") {
      return stradellaScaleFinderResult.buttons;
    }

    if (!isTrebleLikeSide) return [];

    return getScaleFinderTrebleButtons(
      buttons,
      scaleFinderRoot,
      scaleFinderPattern,
      scaleFinderRowLimit,
    );
  }, [
    buttons,
    isTrebleLikeSide,
    scaleFinderActive,
    scaleFinderRoot,
    scaleFinderPattern,
    scaleFinderRowLimit,
    side,
    stradellaScaleFinderResult.buttons,
  ]);

  /* Exact treble buttons currently highlighted by the Chord Finder tool. */
  const chordFinderButtons = useMemo(() => {
    if (!chordFinderActive || !isTrebleLikeSide) return [];

    return getChordFinderTrebleButtons(
      buttons,
      chordFinderRoot,
      chordFinderPattern,
      chordFinderInversion,
      chordFinderOctave,
    );
  }, [
    buttons,
    chordFinderActive,
    chordFinderRoot,
    chordFinderPattern,
    chordFinderOctave,
    chordFinderInversion,
    side,
  ]);

  const abcParseResult = useMemo(() => parseAbc(abcText), [abcText]);

  useEffect(() => {
    if (abcPlaybackState !== "playing") {
      setAbcTempoBpm(abcParseResult.tempoBpm);
    }
  }, [abcParseResult.tempoBpm, abcPlaybackState]);

  const abcMappedEvents = useMemo<MappedAbcEvent[]>(() => {
    if (!abcText.trim()) return [];
    if (side === "stradella") {
      return mapAbcEventsToStradellaButtons(
        buttons,
        abcParseResult.events,
        abcParseResult.keyTonicPitchClass,
        abcStradellaMode,
      );
    }
    if (isTrebleLikeSide) {
      return mapAbcEventsToTrebleButtons(buttons, abcParseResult.events, abcTrebleChordSymbolsMode === "play");
    }
    return [];
  }, [abcParseResult.events, abcStradellaMode, abcText, abcTrebleChordSymbolsMode, buttons, isTrebleLikeSide, side]);

  const abcTotalBeats = useMemo(() => totalAbcBeats(abcParseResult.events), [abcParseResult.events]);
  const abcMissingPitchText = useMemo(() => abcMissingNotes(abcMappedEvents).join(", "), [abcMappedEvents]);

  const selectedBassPattern = useMemo(
    () => bassPatternDefinitions.find((pattern) => pattern.id === bassPatternId) ?? bassPatternDefinitions[0],
    [bassPatternDefinitions, bassPatternId],
  );
  const selectedChordProgression = useMemo(
    () => chordProgressionDefinitions.find((progression) => progression.id === chordProgressionId) ?? chordProgressionDefinitions[0],
    [chordProgressionDefinitions, chordProgressionId],
  );
  const bassPatternEvents = useMemo<BassPatternPlaybackEvent[]>(() => {
    if (side !== "stradella" || !selectedBassPattern || !selectedChordProgression) return [];
    return makeBassPatternEvents(buttons, selectedBassPattern, selectedChordProgression, bassPatternRoot, bassPatternChordVoicing);
  }, [bassPatternChordVoicing, bassPatternRoot, buttons, selectedBassPattern, selectedChordProgression, side]);
  const bassPatternTotalBeats = useMemo(() => totalBassPatternBeats(bassPatternEvents), [bassPatternEvents]);
  const bassPatternMissingText = useMemo(() => bassPatternMissingItems(bassPatternEvents).join(", "), [bassPatternEvents]);

  const stradellaChordFinderResult = useMemo(() => {
    if (!stradellaChordFinderActive || side !== "stradella") {
      return {
        buttons: [],
        playbackButtons: [],
        primaryButtonIds: [],
        rootBassButtonIds: [],
        targetPitches: [],
        coveredPitches: [],
        missingPitches: [],
        extraPitches: [],
        exact: false,
        playable: false,
        shortDescription: "",
        explanation: "",
      };
    }

    return getStradellaChordFinderResult(
      buttons,
      stradellaChordFinderRoot,
      stradellaChordFinderPattern,
      stradellaChordFinderMode,
      stradellaChordFinderMarkRootBass,
    );
  }, [
    buttons,
    side,
    stradellaChordFinderActive,
    stradellaChordFinderRoot,
    stradellaChordFinderPattern,
    stradellaChordFinderMode,
    stradellaChordFinderMarkRootBass,
  ]);

  const stradellaChordFinderButtons = stradellaChordFinderResult.buttons;
  const stradellaChordFinderPlaybackButtons = stradellaChordFinderResult.playbackButtons;
  const stradellaRootBassFinderButtonIds = useMemo(
    () => new Set(stradellaChordFinderResult.rootBassButtonIds),
    [stradellaChordFinderResult.rootBassButtonIds],
  );
  const stradellaPrimaryFinderButtonIds = useMemo(
    () => new Set(stradellaChordFinderResult.primaryButtonIds),
    [stradellaChordFinderResult.primaryButtonIds],
  );

  const finderButtons = stradellaChordFinderActive
    ? stradellaChordFinderButtons
    : scaleFinderActive
      ? scaleFinderButtons
      : chordFinderButtons;

  const finderButtonIds = useMemo(
    () => new Set(finderButtons.map((button) => button.id)),
    [finderButtons],
  );

  const bassPatternActiveButtonIdSet = useMemo(
    () => new Set(bassPatternActiveButtonIds),
    [bassPatternActiveButtonIds],
  );

  const abcActiveButtonIdSet = useMemo(
    () => new Set(abcActiveButtonIds),
    [abcActiveButtonIds],
  );

  /* Consolidated sound options passed to the Web Audio helper functions. */
  const soundOptions = {
    enabled: soundEnabled,
    volume: soundVolume,
    voicePreset: soundVoicePreset,
    waveform: soundWaveform,
    musetteDetuneCents: soundMusetteDetuneCents,
    attackMs: soundAttackMs,
    releaseMs: soundReleaseMs,
    noteDurationMs: soundNoteDurationMs,
    sequenceTempoBpm: soundSequenceTempoBpm,
    stradellaBassVoicing,
  };

  /** Opens one settings group, or closes it if it is already open. */
  function toggleSettingsSection(section: Exclude<SettingsSection, null>) {
    setActiveSettingsSection((current) =>
      current === section ? null : section,
    );
  }

  /** Opens one tool group, or closes it if it is already open. */
  function toggleToolSection(section: Exclude<ToolSection, null>) {
    setActiveToolSection((current) => (current === section ? null : section));
  }

  /**
   * Handles button clicks.
   *
   * A click can optionally toggle selection, write a fingering label, append a
   * sequence step, and/or trigger sound depending on the active tool settings.
   */
  function toggleButton(button: DiagramButton) {
    const id = button.id;
    const trimmedFinger = fingeringDraft.trim();

    setOverlays((current) => {
      const existing = current[id] ?? {};

      return {
        ...current,
        [id]: {
          ...existing,
          selected: selectionOnClick ? !existing.selected : existing.selected,
          finger:
            isApplyingFingering && trimmedFinger
              ? trimmedFinger
              : existing.finger,
        },
      };
    });

    if (isRecordingSequence) {
      setSequenceSteps((current) => [
        ...current,
        { id, step: current.length + 1 },
      ]);
    }

    playButtonSound(button, soundOptions);
  }

  /** Applies the current fingering value to every selected button. */
  function applyFingerToSelected() {
    const trimmedFinger = fingeringDraft.trim();
    if (!trimmedFinger || selectedButtonIds.length === 0) return;

    setOverlays((current) => {
      const next = { ...current };

      selectedButtonIds.forEach((id) => {
        next[id] = { ...next[id], finger: trimmedFinger };
      });

      return next;
    });
  }

  /** Removes fingering numbers from all currently selected buttons. */
  function clearFingerForSelected() {
    if (selectedButtonIds.length === 0) return;

    setOverlays((current) => {
      const next = { ...current };

      selectedButtonIds.forEach((id) => {
        next[id] = { ...next[id], finger: "" };
      });

      return next;
    });
  }
  /** Removes all fingering numbers while preserving other overlay state. */
  function clearAllFingerings() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], finger: "" };
      });
      return next;
    });
  }

  /** Clears selected-button highlights while preserving fingerings. */
  function clearSelection() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], selected: false };
      });
      return next;
    });
  }

  /** Removes selected-button highlighting from one button in the selection list. */
  function deselectButton(id: string) {
    setOverlays((current) => ({
      ...current,
      [id]: {
        ...current[id],
        selected: false,
      },
    }));
  }

  /** Removes all recorded sequence steps. */
  function clearSequence() {
    setSequenceSteps([]);
  }

  /** Clears the Scale Finder highlight without changing its selected root or pattern. */
  function clearScaleFinder() {
    setScaleFinderActive(false);
  }

  /** Clears the Chord Finder highlight without changing its selected root or pattern. */
  function clearChordFinder() {
    setChordFinderActive(false);
  }

  /** Clears the Stradella Chord Finder highlight without changing its selected options. */
  function clearStradellaChordFinder() {
    setStradellaChordFinderActive(false);
  }

  /** Plays the currently highlighted Stradella Chord Finder result. */
  function playStradellaChordFinder() {
    if (stradellaChordFinderMode === "bass-only") {
      playButtonArpeggioThenChord(stradellaChordFinderPlaybackButtons, soundOptions);
      return;
    }

    playButtonCombination(stradellaChordFinderPlaybackButtons, soundOptions);
  }

  /** Plays the currently highlighted Scale Finder path. */
  function playScaleFinder() {
    playButtonSequence(scaleFinderButtons, soundOptions);
  }

  /** Plays the currently highlighted Chord Finder path as an arpeggio, then as a chord. */
  function playChordFinder() {
    playButtonArpeggioThenChord(chordFinderButtons, soundOptions);
  }

  /**
   * Plays selected buttons first as an arpeggio and then together as a chord.
   * The selected-buttons order follows the current rendered diagram/list order.
   */
  function playSelectedButtons() {
    playButtonArpeggioThenChord(selectedButtons, soundOptions);
  }

  /** Plays the current recorded sequence using the sound settings. */
  function playRecordedSequence() {
    playButtonSequence(
      sequenceStepsWithButtons.map((step) => step.button),
      soundOptions,
    );
  }


  async function loadAbcExample(exampleValue: string) {
    const example = ABC_EXAMPLE_OPTIONS.find((option) => option.value === exampleValue);
    setAbcExampleValue(exampleValue);
    if (!example || !example.file) return;

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}${example.file}`);
      if (!response.ok) throw new Error(`Could not load ${example.file}`);
      const text = await response.text();
      setAbcText(text);
      setAbcFileName(example.label);
      setAbcPositionBeat(0);
      setAbcActiveButtonIds([]);
      setAbcPlaybackState("stopped");
    } catch (error) {
      setAbcText(`% Could not load example: ${example.label}
% ${String(error)}`);
      setAbcFileName("");
      setAbcPositionBeat(0);
      setAbcActiveButtonIds([]);
      setAbcPlaybackState("stopped");
    }
  }

  function clearAbcTimers() {
    abcPlaybackTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    abcPlaybackTimeoutsRef.current = [];
  }

  function stopAbcPlayback() {
    clearAbcTimers();
    setAbcPlaybackState("stopped");
    setAbcPositionBeat(0);
    setAbcActiveButtonIds([]);
    abcPlaybackStartedAtRef.current = null;
    stopAllSound();
  }

  function pauseAbcPlayback() {
    if (abcPlaybackState !== "playing") return;
    const startedAt = abcPlaybackStartedAtRef.current;
    const startBeat = abcPlaybackStartBeatRef.current;
    const elapsedBeats = startedAt === null ? 0 : ((performance.now() - startedAt) / 1000) * (abcTempoBpm / 60);
    setAbcPositionBeat(Math.min(abcTotalBeats, startBeat + elapsedBeats));
    setAbcPlaybackState("paused");
    setAbcActiveButtonIds([]);
    clearAbcTimers();
    stopBassPatternPlayback();
    stopAllSound();
  }

  function scheduleAbcPlayback(startBeat = abcPositionBeat) {
    if (abcMappedEvents.length === 0) return;

    clearAbcTimers();
    stopBassPatternPlayback();
    stopAllSound();
    setScaleFinderActive(false);
    setChordFinderActive(false);
    setStradellaChordFinderActive(false);
    setAbcPlaybackState("playing");
    setAbcPositionBeat(startBeat);
    abcPlaybackStartedAtRef.current = performance.now();
    abcPlaybackStartBeatRef.current = startBeat;

    const beatMs = 60000 / Math.max(20, abcTempoBpm);
    const eventsToSchedule = abcMappedEvents.filter(
      (event) => event.startBeat + event.durationBeats >= startBeat,
    );

    eventsToSchedule.forEach((event) => {
      const delayMs = Math.max(0, (event.startBeat - startBeat) * beatMs);
      const onTimeout = window.setTimeout(() => {
        setAbcPositionBeat(event.startBeat);
        setAbcActiveButtonIds(event.buttons.map((button) => button.id));
        event.buttons.forEach((button) => playButtonSound(button, soundOptions));

        const clearTimeoutId = window.setTimeout(() => {
          setAbcActiveButtonIds((current) => {
            const eventIds = new Set(event.buttons.map((button) => button.id));
            return current.filter((id) => !eventIds.has(id));
          });
        }, Math.max(80, event.durationBeats * beatMs * 0.85));
        abcPlaybackTimeoutsRef.current.push(clearTimeoutId);
      }, delayMs);
      abcPlaybackTimeoutsRef.current.push(onTimeout);
    });

    const stopTimeout = window.setTimeout(() => {
      setAbcPlaybackState("stopped");
      setAbcPositionBeat(0);
      setAbcActiveButtonIds([]);
      abcPlaybackStartedAtRef.current = null;
    }, Math.max(0, (abcTotalBeats - startBeat) * beatMs) + 120);
    abcPlaybackTimeoutsRef.current.push(stopTimeout);
  }


  function clearBassPatternTimers() {
    bassPatternTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    bassPatternTimeoutsRef.current = [];
  }

  function stopBassPatternPlayback() {
    clearBassPatternTimers();
    setBassPatternPlaybackState("stopped");
    setBassPatternActiveButtonIds([]);
    stopAllSound();
  }

  function scheduleBassPatternPlayback() {
    if (bassPatternEvents.length === 0) return;

    clearBassPatternTimers();
    stopAbcPlayback();
    setBassPatternActiveButtonIds([]);
    stopAllSound();
    setScaleFinderActive(false);
    setChordFinderActive(false);
    setStradellaChordFinderActive(false);
    setBassPatternPlaybackState("playing");

    const beatMs = 60000 / Math.max(30, bassPatternTempoBpm);
    bassPatternEvents.forEach((event) => {
      const onTimeout = window.setTimeout(() => {
        setBassPatternActiveButtonIds(event.buttons.map((button) => button.id));
        event.buttons.forEach((button) => playButtonSound(button, soundOptions));

        const clearTimeoutId = window.setTimeout(() => {
          setBassPatternActiveButtonIds((current) => {
            const eventIds = new Set(event.buttons.map((button) => button.id));
            return current.filter((id) => !eventIds.has(id));
          });
        }, Math.max(80, event.durationBeats * beatMs * 0.85));
        bassPatternTimeoutsRef.current.push(clearTimeoutId);
      }, Math.max(0, event.startBeat * beatMs));
      bassPatternTimeoutsRef.current.push(onTimeout);
    });

    const stopTimeout = window.setTimeout(() => {
      setBassPatternPlaybackState("stopped");
      setBassPatternActiveButtonIds([]);
    }, Math.max(0, bassPatternTotalBeats * beatMs) + 140);
    bassPatternTimeoutsRef.current.push(stopTimeout);
  }

  /** Stops currently playing notes and any scheduled sequence playback. */
  function stopSoundPlayback() {
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
  }

  /** Removes all free text notes and exits note-placement mode. */
  function clearTextNotes() {
    setTextNotes([]);
    setIsPlacingTextNote(false);
  }

  /** Clears selections, fingerings, sequences, text notes, and active tool modes. */
  function resetDiagramWork() {
    setOverlays({});
    setSequenceSteps([]);
    setIsRecordingSequence(false);
    setIsApplyingFingering(false);
    setTextNotes([]);
    setIsPlacingTextNote(false);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    setStradellaChordFinderActive(false);
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
  }

  /** Computes the visible label for one button using notation and chord-label settings. */
  function getMainLabel(button: DiagramButton) {
    if (side === "stradella" && isChordKind(button.kind)) {
      if (chordLabelMode === "none") return "";

      const root = formatPitch(
        button.chordRoot,
        notation,
        accidental,
        button.chordDisplayName ?? button.chordNaturalName,
      );

      if (chordLabelMode === "root-only") return root;
      if (chordLabelMode === "row-function") return rowFunction(button.kind);
      if (chordLabelMode === "chord-tones") {
        return chordTones(
          button.chordRoot ?? "C",
          button.kind,
          notation,
          accidental,
        );
      }

      return `${root}${chordSuffix(button.kind)}`;
    }

    return formatPitch(
      button.pitchClass,
      notation,
      accidental,
      button.displayName ?? button.naturalName,
      button.octave,
    );
  }


  /** Formats one pitch with the same spelling used by visible Stradella bass-button labels. */
  function formatStradellaFinderPitch(pitch: string) {
    const matchingBassButton = buttons
      .filter((button) =>
        (button.kind === "bass-root" || button.kind === "bass-counterbass") &&
        button.pitchClass === pitch,
      )
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "bass-root" ? -1 : 1;
        if (a.column !== b.column) return a.column - b.column;
        return a.row - b.row;
      })[0];

    if (matchingBassButton) return getMainLabel(matchingBassButton);

    return formatPitch(pitch, notation, accidental);
  }

  /** Formats finder pitch lists with the same spelling used by visible Stradella bass-button labels. */
  function formatStradellaFinderPitches(pitches: string[]) {
    if (pitches.length === 0) return "none";
    return pitches.map(formatStradellaFinderPitch).join(", ");
  }

  /** Rewrites technical Stradella explanations so pitch names match the visible button labels. */
  function formatStradellaFinderText(text: string) {
    return [...INDEX_TO_PITCH]
      .sort((a, b) => b.length - a.length)
      .reduce((current, pitch) => {
        const escapedPitch = pitch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`(^|[^A-Za-z#])(${escapedPitch})(?![A-Za-z#])`, "g");
        return current.replace(pattern, (_match, prefix) => `${prefix}${formatStradellaFinderPitch(pitch)}`);
      }, text);
  }

  /** Formats the current treble Chord Finder tones with the selected notation. */
  function formatTrebleChordFinderPitches() {
    if (!INDEX_TO_PITCH.includes(chordFinderRoot)) return "none";
    const rootIndex = INDEX_TO_PITCH.indexOf(chordFinderRoot);
    return intervalsForChordFinder(chordFinderPattern)
      .map((interval) => {
        const absolute = chordFinderOctave * 12 + rootIndex + interval;
        const pitch = INDEX_TO_PITCH[((absolute % 12) + 12) % 12];
        const octave = Math.floor(absolute / 12);
        return formatPitch(pitch, notation, accidental, undefined, octave);
      })
      .join(", ");
  }

  /** Builds the automatic title for the current diagram side and preset. */
  function autoTitle() {
    if (side === "stradella") return `${basses}-Bass Stradella`;
    if (isPianoTreble) return "Piano Treble";
    return `${trebleLayout === "c-system" ? "C-system" : "B-system / Bayan"} Treble`;
  }

  /** Toggles the requested left panel; clicking the active panel hides it. */
  function setPanel(mode: Exclude<LeftPanelMode, "hidden">) {
    setLeftPanelMode((current) => (current === mode ? "hidden" : mode));
  }

  /** Downloads the currently rendered diagram in the selected file format. */
  function downloadCurrentDiagram() {
    if (!svgRef.current) return;

    const layoutName =
      side === "stradella"
        ? "stradella"
        : trebleLayout === "piano"
          ? "piano-treble"
          : `${trebleLayout}-treble`;

    if (downloadFormat === "png") {
      downloadPng(svgRef.current, `${layoutName}-accordion-diagram.png`);
      return;
    }

    downloadSvg(svgRef.current, `${layoutName}-accordion-diagram.svg`);
  }
  /** Converts a browser mouse click into SVG viewBox coordinates. */
  function svgPointFromMouse(event: ReactMouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const screenMatrix = svg?.getScreenCTM();
    if (!svg || !screenMatrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(screenMatrix.inverse());
  }

  /** Places a free text note at the clicked SVG coordinate when note placement is active. */
  function handleSvgClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (!isPlacingTextNote || !noteDraft.trim()) return;

    const point = svgPointFromMouse(event);
    if (!point) return;

    setTextNotes((current) => [
      ...current,
      makeTextNote({
        x: point.x,
        y: point.y,
        text: noteDraft,
        fontSize: textNoteFontSize,
        color: textNoteColor,
        font: textNoteFont,
        anchor: textNoteAnchor,
      }),
    ]);
    setIsPlacingTextNote(false);
  }

  useEffect(() => {
    return () => {
      clearAbcTimers();
    };
  }, []);

  /* Derived values used by rendering. */
  const finalTitle =
    titleMode === "auto"
      ? autoTitle()
      : titleMode === "custom"
        ? customTitle
        : "";

  const visibleRoots =
    side === "stradella" ? stradellaVisibleRoots(basses) : [];
  const visibleRows = side === "stradella" ? stradellaVisibleRows(basses) : [];

  const viewWidth =
    side === "stradella"
      ? Math.max(1040, 275 + visibleRoots.length * buttonSize * spacing * 1.15)
      : isPianoTreble
        ? Math.max(880, 185 + pianoTrebleWhiteKeyCount(pianoTrebleRange) * buttonSize * spacing * 0.92 * pianoKeyWidthScale)
        : TREBLE_SIZE_VIEW_WIDTH[trebleSize];

  const viewHeight =
    side === "stradella"
      ? Math.max(320, 220 + visibleRows.length * buttonSize * spacing * 0.88 + diagramVerticalSpacing)
      : isPianoTreble
        ? Math.max(360, 285 + buttonSize * 5.9 * pianoKeyHeightScale + diagramVerticalSpacing)
        : 450 + diagramVerticalSpacing;

  const sidebarWidth = interfaceDensity === "compact"
    ? "clamp(230px, 15vw, 270px)"
    : "clamp(300px, 20vw, 380px)";
  const appGridColumns = `${leftPanelMode === "hidden" ? "" : `${sidebarWidth} `}minmax(0, 1fr)`;

  const showSequenceNumbers = sequenceModeShowsNumbers(sequenceDisplayMode);
  const showSequenceArrows = sequenceModeShowsArrows(sequenceDisplayMode);
  const sequenceArrowStyle = sequenceArrowStyleFromMode(sequenceDisplayMode);
  const showScaleFinderNumbers = scaleFinderActive && sequenceModeShowsNumbers(scaleFinderDisplayMode);
  const showScaleFinderArrows = scaleFinderActive && sequenceModeShowsArrows(scaleFinderDisplayMode);
  const scaleFinderArrowStyle = sequenceArrowStyleFromMode(scaleFinderDisplayMode);
  const sequenceArrowheadMarkerId = "sequence-arrowhead";
  const finderArrowheadMarkerId = "finder-arrowhead";
  const sequenceColor = COLOR_PRESETS[sequenceColorPreset];
  const sequenceNumberColor = COLOR_PRESETS[sequenceNumberColorPreset];

  /* CSS variables passed into the SVG so sliders can affect styling. */
  const svgStyle = {
    "--button-stroke-width": buttonStrokeWidth,
    "--reference-stroke-width": referenceStrokeWidth,
    "--chord-fill-strength": chordFillStrength / 100,
    "--sequence-color": sequenceColor,
    "--sequence-thickness": sequenceThickness,
    "--sequence-number-color": sequenceNumberColor,
    "--sequence-number-size": `${sequenceNumberFontSize}px`,
    width: `${diagramScale}%`,
  } as CSSProperties;

  const bellowsLabelY = 70 + diagramVerticalSpacing * 0.35;
  const bellowsStripY = 82 + diagramVerticalSpacing * 0.35;

  const activeToolLabel = side === "stradella"
    ? bassPatternPlaybackState === "playing"
      ? "Bass Pattern Player"
      : abcPlaybackState === "playing" || abcPlaybackState === "paused"
      ? "ABC Player"
      : scaleFinderActive
      ? "Scale Finder"
      : stradellaChordFinderActive
        ? "Chord Finder"
        : isRecordingSequence
        ? "Sequence recording"
        : isApplyingFingering
          ? "Fingering"
          : isPlacingTextNote
            ? "Text note"
            : selectionOnClick
              ? "Selection"
              : "No active tool"
    : abcPlaybackState === "playing" || abcPlaybackState === "paused"
      ? "ABC Player"
      : scaleFinderActive
      ? "Scale Finder"
      : chordFinderActive
        ? "Chord Finder"
        : isRecordingSequence
          ? "Sequence recording"
          : isApplyingFingering
            ? "Fingering"
            : isPlacingTextNote
              ? "Text note"
              : selectionOnClick
                ? "Selection"
                : "No active tool";

  const statusBarText = side === "stradella"
    ? `Stradella · ${basses} bass · ${notationLabel(notation)} · Sound ${soundEnabled ? "on" : "off"} · ${activeToolLabel}`
    : `Treble · ${trebleLayoutLabel(trebleLayout)} · ${trebleLayout === "piano" ? PIANO_TREBLE_RANGE_PRESETS[pianoTrebleRange].label : `${trebleRows} rows`} · ${notationLabel(notation)} · Sound ${soundEnabled ? "on" : "off"} · ${activeToolLabel}`;

  return (
    <main className={`app density-${interfaceDensity}`} style={{ gridTemplateColumns: appGridColumns }}>
      {leftPanelMode !== "hidden" && (
        <aside className="left-panel">
          <h1>{leftPanelMode === "settings" ? "Settings" : "Tools"}</h1>

          {leftPanelMode === "settings" && (
            <>
              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("layout")}
                >
                  Layout{" "}
                  <span>{activeSettingsSection === "layout" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "layout" && (
                  <div className="section-content">
                    {side === "stradella" && (
                      <>
                        <label>
                          Basses
                          <select
                            value={basses}
                            onChange={(event) =>
                              setBasses(event.target.value as BassCount)
                            }
                          >
                            {BASS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Chord labels
                          <select
                            value={chordLabelMode}
                            onChange={(event) =>
                              setChordLabelMode(
                                event.target.value as ChordLabelMode,
                              )
                            }
                          >
                            <option value="none">None</option>
                            <option value="chord-name">
                              Chord name: C, Cm, C7
                            </option>
                            <option value="root-only">Root only</option>
                            <option value="chord-tones">Chord tones</option>
                            <option value="row-function">
                              Row function: M, m, 7
                            </option>
                          </select>
                        </label>
                      </>
                    )}

                    {side === "treble" && (
                      <>
                        <label>
                          Treble layout
                          <select
                            value={trebleLayout}
                            onChange={(event) =>
                              changeTrebleLayout(event.target.value as TrebleLayout)
                            }
                          >
                            <option value="c-system">C-system chromatic buttons</option>
                            <option value="b-system">B-system / Bayan chromatic buttons</option>
                            <option value="piano">Piano keyboard</option>
                          </select>
                        </label>

                        {trebleLayout !== "piano" && (
                          <>
                            <label>
                              Rows
                              <select
                                value={trebleRows}
                                onChange={(event) =>
                                  setTrebleRows(
                                    Number(event.target.value) as 3 | 4 | 5,
                                  )
                                }
                              >
                                <option value={3}>3 rows</option>
                                <option value={4}>4 rows</option>
                                <option value={5}>5 rows</option>
                              </select>
                            </label>

                            <label>
                              Treble size
                              <select
                                value={trebleSize}
                                onChange={(event) =>
                                  changeTrebleSize(
                                    event.target.value as TrebleSizePreset,
                                  )
                                }
                              >
                                {TREBLE_SIZE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </>
                        )}

                        {trebleLayout === "piano" && (
                          <label>
                            Piano range
                            <select
                              value={pianoTrebleRange}
                              onChange={(event) =>
                                changePianoTrebleRange(
                                  event.target.value as PianoTrebleRange,
                                )
                              }
                            >
                              {PIANO_TREBLE_RANGE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        <label>
                          Octave numbers
                          <select
                            value={showTrebleOctaves ? "on" : "off"}
                            onChange={(event) =>
                              setShowTrebleOctaves(event.target.value === "on")
                            }
                          >
                            <option value="off">Off</option>
                            <option value="on">On</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("notation")}
                >
                  Notation{" "}
                  <span>
                    {activeSettingsSection === "notation" ? "−" : "+"}
                  </span>
                </button>

                {activeSettingsSection === "notation" && (
                  <div className="section-content">
                    <label>
                      Notation
                      <select
                        value={notation}
                        onChange={(event) =>
                          setNotation(event.target.value as NotationMode)
                        }
                      >
                        <option value="english">C D E F</option>
                        <option value="german">C D E F G A H</option>
                        <option value="solfege">Do Re Mi Fa</option>
                        <option value="intervals">Intervals</option>
                        <option value="blank">Blank</option>
                      </select>
                    </label>

                    <label>
                      Accidentals
                      <select
                        value={accidental}
                        onChange={(event) =>
                          setAccidental(event.target.value as AccidentalMode)
                        }
                      >
                        <option value="natural">Default spelling</option>
                        <option value="flats">Prefer flats</option>
                        <option value="sharps">Prefer sharps</option>
                      </select>
                    </label>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("appearance")}
                >
                  Appearance{" "}
                  <span>
                    {activeSettingsSection === "appearance" ? "−" : "+"}
                  </span>
                </button>

                {activeSettingsSection === "appearance" && (
                  <div className="section-content">
                    <label>
                      <span className="label-line">Interface density <HelpTip text="Compact saves sidebar space; Comfortable gives controls more breathing room." /></span>
                      <select
                        value={interfaceDensity}
                        onChange={(event) => setInterfaceDensity(event.target.value as InterfaceDensity)}
                      >
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                      </select>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showStatusBar}
                        onChange={(event) => setShowStatusBar(event.target.checked)}
                      />
                      <span className="label-line">Show status bar <HelpTip text="Shows a one-line summary above the diagram. Turn it off if you want maximum space." /></span>
                    </label>

                    <label>
                      <span className="label-line">Diagram scale: {diagramScale}% <HelpTip text="Scales the visible diagram. Values above 100% may add scroll bars." /></span>
                      <input
                        type="range"
                        min={70}
                        max={140}
                        step={5}
                        value={diagramScale}
                        onChange={(event) => setDiagramScale(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Color theme
                      <select
                        value={colorTheme}
                        onChange={(event) =>
                          setColorTheme(event.target.value as ColorTheme)
                        }
                      >
                        <option value="default">Default blue</option>
                        <option value="classic">Classic ink</option>
                        <option value="pastel">Pastel</option>
                        <option value="warm">Warm cream</option>
                        <option value="contrast">High contrast</option>
                        <option value="print">Print / grayscale</option>
                      </select>
                    </label>

                    <label>
                      Accidental buttons
                      <select
                        value={accidentalStyle}
                        onChange={(event) =>
                          setAccidentalStyle(
                            event.target.value as AccidentalStyle,
                          )
                        }
                      >
                        <option value="grey">Grey</option>
                        <option value="dark">Dark</option>
                        <option value="outline">Outline only</option>
                        <option value="theme">Theme color</option>
                      </select>
                    </label>

                    <label>
                      Label font
                      <select
                        value={labelFont}
                        onChange={(event) =>
                          setLabelFont(event.target.value as FontFamily)
                        }
                      >
                        <option value="system">System</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </label>

                    <label>
                      Label font size: {labelFontSize}px
                      <input
                        type="range"
                        min={8}
                        max={24}
                        value={labelFontSize}
                        onChange={(event) =>
                          setLabelFontSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className={`small-button ${showButtonLabels ? "active-tool" : ""}`}
                      onClick={() => setShowButtonLabels((current) => !current)}
                    >
                      {showButtonLabels
                        ? "Hide button labels"
                        : "Show button labels"}
                    </button>

                    <button
                      type="button"
                      className={`small-button ${showBellowsGuide ? "active-tool" : ""}`}
                      onClick={() => setShowBellowsGuide((current) => !current)}
                    >
                      {showBellowsGuide
                        ? "Hide bellows guide"
                        : "Show bellows guide"}
                    </button>

                    {side === "stradella" && (
                      <label>
                        Show Stradella row labels
                        <select
                          value={showStradellaRowLabels ? "on" : "off"}
                          onChange={(event) =>
                            setShowStradellaRowLabels(
                              event.target.value === "on",
                            )
                          }
                        >
                          <option value="on">On</option>
                          <option value="off">Off</option>
                        </select>
                      </label>
                    )}

                    <label>
                      Button size: {buttonSize}
                      <input
                        type="range"
                        min={12}
                        max={28}
                        value={buttonSize}
                        onChange={(event) =>
                          setButtonSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Spacing: {spacing.toFixed(2)}
                      <input
                        type="range"
                        min={1.7}
                        max={3.2}
                        step={0.05}
                        value={spacing}
                        onChange={(event) =>
                          setSpacing(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      <span className="label-line">Vertical spacing: {diagramVerticalSpacing}px <HelpTip text="Adds or removes vertical space between the title, bellows guide, and buttons." /></span>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        step={2}
                        value={diagramVerticalSpacing}
                        onChange={(event) =>
                          setDiagramVerticalSpacing(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Button line: {buttonStrokeWidth.toFixed(1)}
                      <input
                        type="range"
                        min={1}
                        max={6}
                        step={0.25}
                        value={buttonStrokeWidth}
                        onChange={(event) =>
                          setButtonStrokeWidth(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Reference line: {referenceStrokeWidth.toFixed(1)}
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={0.25}
                        value={referenceStrokeWidth}
                        onChange={(event) =>
                          setReferenceStrokeWidth(Number(event.target.value))
                        }
                      />
                    </label>

                    {isPianoTreble && (
                      <>
                        <label>
                          <span className="label-line">Piano key width: {pianoKeyWidthScale.toFixed(2)}× <HelpTip text="Makes white piano keys wider or narrower." /></span>
                          <input
                            type="range"
                            min={0.75}
                            max={1.45}
                            step={0.05}
                            value={pianoKeyWidthScale}
                            onChange={(event) =>
                              setPianoKeyWidthScale(Number(event.target.value))
                            }
                          />
                        </label>

                        <label>
                          <span className="label-line">Piano key height: {pianoKeyHeightScale.toFixed(2)}× <HelpTip text="Makes piano keys taller or shorter." /></span>
                          <input
                            type="range"
                            min={0.75}
                            max={1.8}
                            step={0.05}
                            value={pianoKeyHeightScale}
                            onChange={(event) =>
                              setPianoKeyHeightScale(Number(event.target.value))
                            }
                          />
                        </label>

                        <label>
                          <span className="label-line">Black key width: {pianoBlackKeyWidthScale.toFixed(2)}× <HelpTip text="Adjusts the width of accidentals on the piano keyboard." /></span>
                          <input
                            type="range"
                            min={0.75}
                            max={1.35}
                            step={0.05}
                            value={pianoBlackKeyWidthScale}
                            onChange={(event) =>
                              setPianoBlackKeyWidthScale(Number(event.target.value))
                            }
                          />
                        </label>

                        <label>
                          <span className="label-line">Black key height: {pianoBlackKeyHeightScale.toFixed(2)}× <HelpTip text="Adjusts how far black keys extend down the keyboard." /></span>
                          <input
                            type="range"
                            min={0.75}
                            max={1.5}
                            step={0.05}
                            value={pianoBlackKeyHeightScale}
                            onChange={(event) =>
                              setPianoBlackKeyHeightScale(Number(event.target.value))
                            }
                          />
                        </label>
                      </>
                    )}

                    {side === "stradella" && (
                      <label>
                        Chord fill: {chordFillStrength}%
                        <input
                          type="range"
                          min={20}
                          max={100}
                          step={5}
                          value={chordFillStrength}
                          onChange={(event) =>
                            setChordFillStrength(Number(event.target.value))
                          }
                        />
                      </label>
                    )}

                    {side === "treble" && trebleLayout !== "piano" && (
                      <label>
                        Treble angle: {trebleAngle}°
                        <input
                          type="range"
                          min={-35}
                          max={35}
                          value={trebleAngle}
                          onChange={(event) =>
                            setTrebleAngle(Number(event.target.value))
                          }
                        />
                      </label>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("sound")}
                >
                  Sound{" "}
                  <span>{activeSettingsSection === "sound" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "sound" && (
                  <div className="section-content">
                    <p className="hint">
                      Choose the synthesized voice used by button clicks and
                      sequence playback. Use the top Sound button to turn
                      playback on or off.
                    </p>

                    <label>
                      Voice
                      <select
                        value={soundVoicePreset}
                        onChange={(event) =>
                          setSoundVoicePreset(
                            event.target.value as SoundVoicePreset,
                          )
                        }
                      >
                        <option value="soft-reed">Soft reed</option>
                        <option value="bright-reed">Bright reed</option>
                        <option value="musette">Musette detuned reeds</option>
                        <option value="organ">Organ-like</option>
                        <option value="bass-reed">Bass reed</option>
                        <option value="single">Single oscillator</option>
                      </select>
                    </label>



                    {side === "stradella" && (
                      <>
                        <label>
                          Stradella bass voicing
                          <select
                            value={stradellaBassVoicing}
                            onChange={(event) =>
                              setStradellaBassVoicing(
                                event.target.value as StradellaBassVoicing,
                              )
                            }
                          >
                            <option value="single-low">Single low reed</option>
                            <option value="low-and-middle">Low + middle reeds</option>
                            <option value="single-middle">Single middle reed</option>
                          </select>
                        </label>

                        <p className="hint">
                          This affects single Stradella bass buttons only. Different
                          real accordions and registers use different bass voicings,
                          so this is configurable instead of being hard-coded.
                        </p>
                      </>
                    )}

                    {soundVoicePreset === "single" && (
                      <label>
                        Waveform
                        <select
                          value={soundWaveform}
                          onChange={(event) =>
                            setSoundWaveform(
                              event.target.value as SoundWaveform,
                            )
                          }
                        >
                          <option value="sine">Sine</option>
                          <option value="triangle">Triangle</option>
                          <option value="sawtooth">Sawtooth</option>
                          <option value="square">Square</option>
                        </select>
                      </label>
                    )}

                    {soundVoicePreset === "musette" && (
                      <label>
                        Reed detune: {soundMusetteDetuneCents} cents
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={1}
                          value={soundMusetteDetuneCents}
                          onChange={(event) =>
                            setSoundMusetteDetuneCents(
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    )}

                    <label>
                      Volume: {Math.round(soundVolume * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={soundVolume}
                        onChange={(event) =>
                          setSoundVolume(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Attack: {soundAttackMs} ms
                      <input
                        type="range"
                        min={1}
                        max={120}
                        step={1}
                        value={soundAttackMs}
                        onChange={(event) =>
                          setSoundAttackMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Release: {soundReleaseMs} ms
                      <input
                        type="range"
                        min={20}
                        max={500}
                        step={10}
                        value={soundReleaseMs}
                        onChange={(event) =>
                          setSoundReleaseMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Note duration: {soundNoteDurationMs} ms
                      <input
                        type="range"
                        min={80}
                        max={1500}
                        step={20}
                        value={soundNoteDurationMs}
                        onChange={(event) =>
                          setSoundNoteDurationMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Sequence tempo: {soundSequenceTempoBpm} BPM
                      <input
                        type="range"
                        min={40}
                        max={200}
                        step={5}
                        value={soundSequenceTempoBpm}
                        onChange={(event) =>
                          setSoundSequenceTempoBpm(Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("title")}
                >
                  Title{" "}
                  <span>{activeSettingsSection === "title" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "title" && (
                  <div className="section-content">
                    <label>
                      Title
                      <select
                        value={titleMode}
                        onChange={(event) =>
                          setTitleMode(event.target.value as TitleMode)
                        }
                      >
                        <option value="auto">Auto</option>
                        <option value="custom">Custom</option>
                        <option value="none">None</option>
                      </select>
                    </label>

                    {titleMode === "custom" && (
                      <label>
                        Custom title
                        <input
                          value={customTitle}
                          onChange={(event) =>
                            setCustomTitle(event.target.value)
                          }
                        />
                      </label>
                    )}

                    {titleMode !== "none" && (
                      <>
                        <label>
                          Title font
                          <select
                            value={titleFont}
                            onChange={(event) =>
                              setTitleFont(event.target.value as FontFamily)
                            }
                          >
                            <option value="system">System</option>
                            <option value="serif">Serif</option>
                            <option value="mono">Mono</option>
                            <option value="rounded">Rounded</option>
                          </select>
                        </label>

                        <label>
                          Title size: {titleSize}px
                          <input
                            type="range"
                            min={14}
                            max={42}
                            value={titleSize}
                            onChange={(event) =>
                              setTitleSize(Number(event.target.value))
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>
              <AboutPanel
                isOpen={activeSettingsSection === "about"}
                onToggle={() => toggleSettingsSection("about")}
              >
                <div className="button-row">
                  <button className="small-button" onClick={downloadCurrentSettings}>
                    Save settings JSON
                  </button>
                  <label className="small-button file-button">
                    Load settings JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(event) => {
                        void importSettingsFile(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
                <p className="hint">
                  These buttons save or load a separate settings file. They do not overwrite <code>public/default-settings.json</code>.
                </p>
              </AboutPanel>
            </>
          )}

          {leftPanelMode === "tools" && (
            <>
              {(isTrebleLikeSide || side === "stradella") && (
              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("scaleFinder")}
                >
                  Scale Finder{" "}
                  <span>{activeToolSection === "scaleFinder" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "scaleFinder" && (
                  <div className="section-content">
                    <p className="hint">
                      {side === "stradella"
                        ? "Uses only Stradella bass and counterbass note buttons, choosing buttons close to the root when possible."
                        : "Finds a single-octave scale path. On CBA layouts it can restrict the path to the first 3, 4, or 5 rows."}
                    </p>

                    <fieldset className="tool-fieldset">
                      <label>
                        Scale root
                        <select
                          value={scaleFinderRoot}
                          onChange={(event) => setScaleFinderRoot(event.target.value)}
                        >
                          {FINDER_ROOT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Scale type
                        <select
                          value={scaleFinderPattern}
                          onChange={(event) =>
                            setScaleFinderPattern(event.target.value as FinderScalePattern)
                          }
                        >
                          {SCALE_FINDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="label-line">Display <HelpTip text="Controls how Scale Finder marks the scale path. Numbers show step order; arrows show movement." /></span>
                        <select
                          value={scaleFinderDisplayMode}
                          onChange={(event) =>
                            setScaleFinderDisplayMode(event.target.value as SequenceDisplayMode)
                          }
                        >
                          {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {isTrebleLikeSide && (
                        <label>
                          Rows used
                          <select
                            value={scaleFinderRowLimit}
                            onChange={(event) =>
                              setScaleFinderRowLimit(Number(event.target.value) as 3 | 4 | 5)
                            }
                          >
                            {SCALE_FINDER_ROW_LIMIT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <div className="result-card">
                        <div className="result-card-title">
                          {side === "stradella" && scaleFinderActive && !stradellaScaleFinderResult.found
                            ? "Not found"
                            : `Scale buttons: ${scaleFinderButtons.length}`}
                        </div>
                        {side === "stradella" && (
                          <p>
                            Target notes: {formatStradellaFinderPitches(stradellaScaleFinderResult.targetPitches)}
                            {stradellaScaleFinderResult.missingPitches.length > 0
                              ? ` · Missing: ${formatStradellaFinderPitches(stradellaScaleFinderResult.missingPitches)}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <div className="button-row">
                        <button
                          type="button"
                          className={`small-button ${scaleFinderActive ? "active-tool" : ""}`}
                          onClick={() => {
                            setScaleFinderActive((current) => !current);
                            setChordFinderActive(false);
                            setStradellaChordFinderActive(false);
                          }}
                          >
                          {scaleFinderActive ? "Hide scale" : "Show scale"}
                        </button>

                        <button
                          className="small-button"
                          onClick={playScaleFinder}
                          disabled={scaleFinderButtons.length === 0}
                        >
                          Play scale
                        </button>

                        <button className="small-button" onClick={clearScaleFinder}>
                          Clear scale
                        </button>
                      </div>
                    </fieldset>
                  </div>
                )}
              </section>
              )}




              {isTrebleLikeSide && (
                <TrebleChordFinderPanel
                  isOpen={activeToolSection === "chordFinder"}
                  onToggle={() => toggleToolSection("chordFinder")}
                  targetToneText={formatTrebleChordFinderPitches()}
                  root={chordFinderRoot}
                  onRootChange={setChordFinderRoot}
                  octave={chordFinderOctave}
                  onOctaveChange={setChordFinderOctave}
                  pattern={chordFinderPattern}
                  onPatternChange={setChordFinderPattern}
                  inversion={chordFinderInversion}
                  onInversionChange={setChordFinderInversion}
                  buttonCount={chordFinderButtons.length}
                  isActive={chordFinderActive}
                  onToggleActive={() => {
                    setChordFinderActive((current) => !current);
                    setScaleFinderActive(false);
                    setStradellaChordFinderActive(false);
                  }}
                  onPlay={playChordFinder}
                  onClear={clearChordFinder}
                />
              )}

              {side === "stradella" && (
                <StradellaChordFinderPanel
                  isOpen={activeToolSection === "stradellaChordFinder"}
                  onToggle={() => toggleToolSection("stradellaChordFinder")}
                  root={stradellaChordFinderRoot}
                  onRootChange={setStradellaChordFinderRoot}
                  pattern={stradellaChordFinderPattern}
                  onPatternChange={setStradellaChordFinderPattern}
                  mode={stradellaChordFinderMode}
                  onModeChange={setStradellaChordFinderMode}
                  markRootBass={stradellaChordFinderMarkRootBass}
                  onMarkRootBassChange={setStradellaChordFinderMarkRootBass}
                  result={stradellaChordFinderResult}
                  buttonCount={stradellaChordFinderButtons.length}
                  playbackButtonCount={stradellaChordFinderPlaybackButtons.length}
                  isActive={stradellaChordFinderActive}
                  onToggleActive={() => {
                    setStradellaChordFinderActive((current) => !current);
                    setScaleFinderActive(false);
                    setChordFinderActive(false);
                  }}
                  onPlay={playStradellaChordFinder}
                  onClear={clearStradellaChordFinder}
                  formatPitches={formatStradellaFinderPitches}
                  formatText={formatStradellaFinderText}
                />
              )}

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("selection")}
                >
                  Selection{" "}
                  <span>{activeToolSection === "selection" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "selection" && (
                  <div className="section-content">
                    <p className="hint">
                      Selected buttons:{" "}
                      <strong>{selectedButtons.length}</strong>
                    </p>

                    <button
                      type="button"
                      className={`small-button ${selectionOnClick ? "active-tool" : ""}`}
                      onClick={() => setSelectionOnClick((current) => !current)}
                    >
                      {selectionOnClick
                        ? "Selection on click"
                        : "Selection off on click"}
                    </button>

                    <button
                      type="button"
                      className="small-button"
                      onClick={playSelectedButtons}
                      disabled={selectedButtons.length === 0}
                    >
                      Play selection
                    </button>

                    {selectedButtons.length > 0 ? (
                      <div className="selected-list">
                        {selectedButtons.map((button) => (
                          <div key={button.id} className="selected-item">
                            <span>{getMainLabel(button) || "Blank"}</span>
                            <span className="selected-meta">
                              {side === "stradella"
                                ? `${stradellaRowLabel(button.kind)}, col ${button.column + 1}`
                                : `row ${button.row + 1}, col ${button.column + 1}`}
                            </span>
                            <button
                              type="button"
                              className="selected-remove-button"
                              onClick={() => deselectButton(button.id)}
                              aria-label={`Deselect ${getMainLabel(button) || "button"}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="hint">No buttons selected.</p>
                    )}

                    <button className="small-button" onClick={clearSelection}>
                      Clear selection
                    </button>
                  </div>
                )}
              </section>


              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("fingering")}
                >
                  Fingering{" "}
                  <span>{activeToolSection === "fingering" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "fingering" && (
                  <div className="section-content">
                    <p className="hint">
                      Enter a finger number, then either apply it to selected
                      buttons or turn on click-to-label mode and click buttons
                      directly.
                    </p>

                    <label>
                      Fingering value
                      <input
                        placeholder="1-5"
                        maxLength={3}
                        value={fingeringDraft}
                        onChange={(event) =>
                          setFingeringDraft(event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className={`small-button ${isApplyingFingering ? "active-tool" : ""}`}
                      onClick={() =>
                        setIsApplyingFingering((current) => !current)
                      }
                    >
                      {isApplyingFingering
                        ? "Stop click-to-label"
                        : "Click buttons to label"}
                    </button>

                    <label>
                      Fingering position
                      <select
                        value={fingeringPosition}
                        onChange={(event) =>
                          setFingeringPosition(
                            event.target.value as NumberPosition,
                          )
                        }
                      >
                        <option value="inside-bottom">Inside bottom</option>
                        <option value="inside-top">Inside top</option>
                        <option value="above">Above button</option>
                      </select>
                    </label>

                    <div className="button-row">
                      <button
                        className="small-button"
                        onClick={applyFingerToSelected}
                      >
                        Apply to selected
                      </button>
                      <button
                        className="small-button"
                        onClick={clearFingerForSelected}
                      >
                        Clear selected
                      </button>
                      <button
                        className="small-button"
                        onClick={clearAllFingerings}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("sequences")}
                >
                  Sequence{" "}
                  <span>{activeToolSection === "sequences" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "sequences" && (
                  <div className="section-content">
                    <p className="hint">
                      Turn recording on, then click buttons in order. Repeated
                      buttons are allowed.
                    </p>

                    <label>
                      Display
                      <select
                        value={sequenceDisplayMode}
                        onChange={(event) =>
                          setSequenceDisplayMode(
                            event.target.value as SequenceDisplayMode,
                          )
                        }
                      >
                        {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Arrow color
                      <select
                        value={sequenceColorPreset}
                        onChange={(event) =>
                          setSequenceColorPreset(
                            event.target.value as SequenceColorPreset,
                          )
                        }
                      >
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                        <option value="grey">Grey</option>
                        <option value="theme">Theme accent</option>
                      </select>
                    </label>

                    <label>
                      Arrow thickness: {sequenceThickness.toFixed(1)}
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.25}
                        value={sequenceThickness}
                        onChange={(event) =>
                          setSequenceThickness(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Arrowhead size: {sequenceArrowheadSize.toFixed(1)}
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={0.5}
                        value={sequenceArrowheadSize}
                        onChange={(event) =>
                          setSequenceArrowheadSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Number color
                      <select
                        value={sequenceNumberColorPreset}
                        onChange={(event) =>
                          setSequenceNumberColorPreset(
                            event.target.value as SequenceColorPreset,
                          )
                        }
                      >
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                        <option value="grey">Grey</option>
                        <option value="theme">Theme accent</option>
                      </select>
                    </label>

                    <label>
                      Number position
                      <select
                        value={sequenceNumberPosition}
                        onChange={(event) =>
                          setSequenceNumberPosition(
                            event.target.value as NumberPosition,
                          )
                        }
                      >
                        <option value="above">Above button</option>
                        <option value="inside-top">Inside top</option>
                        <option value="inside-bottom">Inside bottom</option>
                      </select>
                    </label>

                    <label>
                      Number font size: {sequenceNumberFontSize}px
                      <input
                        type="range"
                        min={7}
                        max={18}
                        value={sequenceNumberFontSize}
                        onChange={(event) =>
                          setSequenceNumberFontSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <button
                      className={`small-button ${isRecordingSequence ? "active-tool" : ""}`}
                      onClick={() =>
                        setIsRecordingSequence((current) => !current)
                      }
                    >
                      {isRecordingSequence
                        ? "Stop recording"
                        : "Record sequence"}
                    </button>

                    <p className="hint">
                      Sequence length: <strong>{sequenceSteps.length}</strong>
                    </p>

                    <div className="button-row">
                      <button
                        className="small-button"
                        onClick={playRecordedSequence}
                        disabled={sequenceSteps.length === 0}
                      >
                        Play sequence
                      </button>
                      <button
                        className="small-button"
                        onClick={stopSoundPlayback}
                      >
                        Stop
                      </button>
                      <button className="small-button" onClick={clearSequence}>
                        Clear sequence
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("textNotes")}
                >
                  Text notes{" "}
                  <span>{activeToolSection === "textNotes" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "textNotes" && (
                  <div className="section-content">
                    <p className="hint">
                      Type text, click “Place note”, then click on the diagram.
                      Multiple lines are supported.
                    </p>

                    <label>
                      Note text
                      <textarea
                        rows={4}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Type a note"
                      />
                    </label>

                    <label>
                      Text size: {textNoteFontSize}px
                      <input
                        type="range"
                        min={8}
                        max={32}
                        value={textNoteFontSize}
                        onChange={(event) =>
                          setTextNoteFontSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Text color
                      <input
                        type="color"
                        value={textNoteColor}
                        onChange={(event) =>
                          setTextNoteColor(event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Text font
                      <select
                        value={textNoteFont}
                        onChange={(event) =>
                          setTextNoteFont(event.target.value as FontFamily)
                        }
                      >
                        <option value="system">System</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </label>

                    <label>
                      Text anchor
                      <select
                        value={textNoteAnchor}
                        onChange={(event) =>
                          setTextNoteAnchor(
                            event.target.value as TextNoteAnchor,
                          )
                        }
                      >
                        <option value="start">Left</option>
                        <option value="middle">Center</option>
                      </select>
                    </label>

                    <button
                      className={`small-button ${isPlacingTextNote ? "active-tool" : ""}`}
                      onClick={() =>
                        setIsPlacingTextNote((current) => !current)
                      }
                    >
                      {isPlacingTextNote ? "Click diagram..." : "Place note"}
                    </button>

                    <p className="hint">
                      Notes: <strong>{textNotes.length}</strong>
                    </p>

                    <button className="small-button" onClick={clearTextNotes}>
                      Clear notes
                    </button>
                  </div>
                )}
              </section>

              {side === "stradella" && (
                <section className="control-section">
                  <button
                    className="section-title"
                    onClick={() => toggleToolSection("bassPatternPlayer")}
                  >
                    Bass Pattern Player{" "}
                    <span>{activeToolSection === "bassPatternPlayer" ? "−" : "+"}</span>
                  </button>

                  {activeToolSection === "bassPatternPlayer" && (
                    <div className="section-content">
                      <p className="hint">
                        Plays reusable Stradella bass patterns over a Roman-numeral chord progression.
                      </p>

                      <label>
                        Pattern
                        <select
                          value={bassPatternId}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternId(event.target.value);
                          }}
                        >
                          {bassPatternDefinitions.map((pattern) => (
                            <option key={pattern.id} value={pattern.id}>
                              {pattern.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Progression
                        <select
                          value={chordProgressionId}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setChordProgressionId(event.target.value);
                          }}
                        >
                          {chordProgressionDefinitions.map((progression) => (
                            <option key={progression.id} value={progression.id}>
                              {progression.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Root
                        <select
                          value={bassPatternRoot}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternRoot(event.target.value);
                          }}
                        >
                          {FINDER_ROOT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="label-line">Chord voicing <HelpTip text="Simple uses one practical Stradella chord button. Full uses the fuller Chord Finder recipe when available." /></span>
                        <select
                          value={bassPatternChordVoicing}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternChordVoicing(event.target.value as BassPatternChordVoicing);
                          }}
                        >
                          <option value="simple">Simple chord button</option>
                          <option value="full">Full recipe when available</option>
                        </select>
                      </label>

                      <label>
                        Tempo: {bassPatternTempoBpm} BPM
                        <input
                          type="range"
                          min={50}
                          max={220}
                          step={1}
                          value={bassPatternTempoBpm}
                          onChange={(event) => setBassPatternTempoBpm(Number(event.target.value))}
                        />
                      </label>

                      <div className="result-card">
                        <div className="result-card-title">
                          {selectedBassPattern?.name ?? "No pattern loaded"}
                        </div>
                        <p>
                          {selectedChordProgression?.name ?? "No progression loaded"} · Length: {bassPatternTotalBeats.toFixed(1)} beats
                          {bassPatternMissingText ? ` · Missing: ${bassPatternMissingText}` : ""}
                        </p>
                      </div>

                      <div className="button-row">
                        <button
                          type="button"
                          className={`small-button ${bassPatternPlaybackState === "playing" ? "active-tool" : ""}`}
                          onClick={scheduleBassPatternPlayback}
                          disabled={bassPatternEvents.length === 0}
                        >
                          Play pattern
                        </button>
                        <button
                          type="button"
                          className="small-button"
                          onClick={stopBassPatternPlayback}
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {(isTrebleLikeSide || side === "stradella") && (
                <section className="control-section">
                  <button
                    className="section-title"
                    onClick={() => toggleToolSection("abcPlayer")}
                  >
                    ABC Player{" "}
                    <span>{activeToolSection === "abcPlayer" ? "−" : "+"}</span>
                  </button>

                  {activeToolSection === "abcPlayer" && (
                    <div className="section-content abc-player-panel">
                      <p className="hint">
                        {side === "stradella"
                          ? "Loads a simple ABC tune. It can highlight bass notes, quoted ABC chord symbols, or both. Bracketed note chords can also play together."
                          : "Loads a simple single-voice ABC tune and highlights matching treble notes while it plays. Bracketed dyads/chords can play together."}
                      </p>

                      {side === "stradella" && (
                        <label>
                          <span className="label-line">Stradella mapping <HelpTip text="Bass notes use written ABC pitches. Chord symbols use quoted ABC harmony labels such as &quot;C&quot;, &quot;G7&quot;, or &quot;Am&quot;." /></span>
                          <select
                            value={abcStradellaMode}
                            onChange={(event) => {
                              pauseAbcPlayback();
                              setAbcActiveButtonIds([]);
                              setAbcStradellaMode(event.target.value as AbcStradellaMode);
                            }}
                          >
                            <option value="bass-notes-only">Bass notes only</option>
                            <option value="chord-symbols-only">Chord symbols only</option>
                            <option value="bass-notes-and-chord-symbols">Bass notes + chord symbols</option>
                          </select>
                        </label>
                      )}

                      {isTrebleLikeSide && (
                        <label>
                          <span className="label-line">Chord symbols <HelpTip text="Quoted ABC chord symbols such as &quot;C&quot; or &quot;G7&quot; can be ignored or played as treble block chords." /></span>
                          <select
                            value={abcTrebleChordSymbolsMode}
                            onChange={(event) => {
                              pauseAbcPlayback();
                              setAbcActiveButtonIds([]);
                              setAbcTrebleChordSymbolsMode(event.target.value as AbcTrebleChordSymbolsMode);
                            }}
                          >
                            <option value="ignore">Ignore</option>
                            <option value="play">Play as treble chords</option>
                          </select>
                        </label>
                      )}

                      <label>
                        Example tune
                        <select
                          value={abcExampleValue}
                          onChange={(event) => void loadAbcExample(event.target.value)}
                        >
                          {ABC_EXAMPLE_OPTIONS.map((option) => (
                            <option key={option.value || "empty"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="button-row">
                        <label className="small-button file-button">
                          Load .abc file
                          <input
                            type="file"
                            accept=".abc,text/plain"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              setAbcFileName(file.name);
                              setAbcExampleValue("");
                              file.text().then((text) => {
                                setAbcText(text);
                                setAbcPositionBeat(0);
                                setAbcActiveButtonIds([]);
                                setAbcPlaybackState("stopped");
                              });
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => {
                            setAbcText("");
                            setAbcFileName("");
                            setAbcExampleValue("");
                            stopAbcPlayback();
                          }}
                        >
                          Clear ABC
                        </button>
                      </div>

                      {abcFileName && <p className="hint">File: {abcFileName}</p>}

                      <label>
                        ABC text
                        <textarea
                          className="abc-textarea"
                          value={abcText}
                          onChange={(event) => {
                            setAbcText(event.target.value);
                            setAbcExampleValue("");
                            setAbcPositionBeat(0);
                            setAbcActiveButtonIds([]);
                            setAbcPlaybackState("stopped");
                          }}
                          placeholder={'X:1\nT:Simple tune\nM:4/4\nL:1/4\nQ:120\nK:C\nC D E F | G A B c |'}
                        />
                      </label>

                      <label>
                        Tempo: {abcTempoBpm} BPM
                        <input
                          type="range"
                          min={40}
                          max={220}
                          step={1}
                          value={abcTempoBpm}
                          onChange={(event) => setAbcTempoBpm(Number(event.target.value))}
                        />
                      </label>

                      <label>
                        Position
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, abcTotalBeats)}
                          step={0.25}
                          value={Math.min(abcPositionBeat, abcTotalBeats)}
                          onChange={(event) => {
                            pauseAbcPlayback();
                            setAbcPositionBeat(Number(event.target.value));
                            setAbcActiveButtonIds([]);
                          }}
                          disabled={abcTotalBeats === 0}
                        />
                      </label>

                      <div className="result-card">
                        <div className="result-card-title">
                          {abcText.trim() ? abcParseResult.title : "No ABC loaded"}
                        </div>
                        {abcParseResult.errors.length > 0 ? (
                          <p>{abcParseResult.errors.join(" ")}</p>
                        ) : (
                          <p>
                            Events: {abcParseResult.events.length} · Key: {abcParseResult.key} · Length: {abcTotalBeats.toFixed(1)} beats
                            {abcMissingPitchText ? ` · ${side === "stradella" ? "Unavailable notes" : "Missing"}: ${abcMissingPitchText}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="button-row">
                        <button
                          className={`small-button ${abcPlaybackState === "playing" ? "active-tool" : ""}`}
                          type="button"
                          onClick={() => scheduleAbcPlayback(abcPositionBeat)}
                          disabled={abcMappedEvents.length === 0}
                        >
                          {abcPlaybackState === "paused" ? "Continue" : "Play"}
                        </button>
                        <button
                          className="small-button"
                          type="button"
                          onClick={pauseAbcPlayback}
                          disabled={abcPlaybackState !== "playing"}
                        >
                          Pause
                        </button>
                        <button
                          className="small-button"
                          type="button"
                          onClick={stopAbcPlayback}
                          disabled={abcPlaybackState === "stopped" && abcPositionBeat === 0}
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </aside>
      )}

      <section className="workspace">
        <div className="topbar">
          <button
            className={`topbar-button ${side === "stradella" ? "active" : ""}`}
            onClick={() => {
              setSide("stradella");
              stopAbcPlayback();
            }}
          >
            Stradella
          </button>

          <button
            className={`topbar-button ${side === "treble" ? "active" : ""}`}
            onClick={() => {
              setSide("treble");
              stopAbcPlayback();
            }}
          >
            Treble
          </button>


          <span className="topbar-separator" />

          <button
            className={`topbar-button ${leftPanelMode === "settings" ? "active" : ""}`}
            onClick={() => setPanel("settings")}
          >
            Settings
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "tools" ? "active" : ""}`}
            onClick={() => setPanel("tools")}
          >
            Tools
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "hidden" ? "active" : ""}`}
            onClick={() => setLeftPanelMode((current) => (current === "hidden" ? "settings" : "hidden"))}
            title="Hide the sidebar to give the diagram more horizontal room."
          >
            {leftPanelMode === "hidden" ? "Show controls" : "Focus diagram"}
          </button>

          <span className="topbar-spacer" />

          <button
            className={`topbar-button ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled((current) => !current)}
          >
            {soundEnabled ? "Sound on" : "Sound off"}
          </button>

          <button
            className="topbar-button reset-button"
            onClick={resetDiagramWork}
          >
            Reset
          </button>

          <select
            className="topbar-select"
            value={downloadFormat}
            onChange={(event) =>
              setDownloadFormat(event.target.value as DownloadFormat)
            }
            aria-label="Download file type"
          >
            <option value="svg">SVG</option>
            <option value="png">PNG</option>
          </select>

          <button
            className="topbar-button download-button"
            onClick={downloadCurrentDiagram}
          >
            Download {downloadFormat.toUpperCase()}
          </button>
        </div>

        {showStatusBar && (
          <div className="status-bar" title={statusBarText}>
            {statusBarText}
          </div>
        )}

        <div className="canvas-wrap">
          <svg
            ref={svgRef}
            preserveAspectRatio="xMinYMin meet"
            className={`diagram diagram-theme-${colorTheme} accidental-style-${accidentalStyle} ${isPlacingTextNote ? "placing-note" : ""}`}
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            role="img"
            onClick={handleSvgClick}
            style={svgStyle}
          >
            <defs>
              <marker
                id={sequenceArrowheadMarkerId}
                markerWidth={sequenceArrowheadSize + 1}
                markerHeight={sequenceArrowheadSize + 1}
                refX={sequenceArrowheadSize}
                refY={sequenceArrowheadSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d={`M 0 0 L ${sequenceArrowheadSize} ${sequenceArrowheadSize / 2} L 0 ${sequenceArrowheadSize} z`}
                  className="sequence-arrowhead"
                />
              </marker>

              <marker
                id={finderArrowheadMarkerId}
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 0 L 5 2.5 L 0 5 z" className="finder-arrowhead" />
              </marker>
            </defs>

            {titleMode !== "none" && (
              <text
                x={viewWidth / 2}
                y="34"
                textAnchor="middle"
                className={`title ${fontClass(titleFont)}`}
                style={{ fontSize: titleSize }}
              >
                {finalTitle}
              </text>
            )}

            {showBellowsGuide && (
              <>
                <text
                  x="76"
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  Bottom
                </text>

                <text
                  x={viewWidth / 2}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-label"
                >
                  Bellows
                </text>

                <text
                  x={viewWidth - 76}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  Top
                </text>
              </>
            )}

            {showBellowsGuide && (
              <rect
                x="72"
                y={bellowsStripY}
                width={viewWidth - 150}
                height="12"
                rx="6"
                className="bellows-strip"
              />
            )}

            {side === "stradella" &&
              showStradellaRowLabels &&
              visibleRows.map((kind) => {
                const sample = buttons.find(
                  (button) => button.kind === kind && button.column === 0,
                );
                if (!sample) return null;

                return (
                  <text
                    key={kind}
                    x={sample.x - buttonSize - 10}
                    y={sample.y + 4}
                    textAnchor="end"
                    className="stradella-row-label"
                  >
                    {stradellaRowLabel(kind)}
                  </text>
                );
              })}

            {buttons.map((button) => {
              const overlay = overlays[button.id] ?? {};
              const mainLabel = getMainLabel(button);
              const isChord = isChordKind(button.kind);
              const isTreble = button.kind === "treble-note";
              const isTrebleAccidental =
                isTreble && isAccidentalPitch(button.pitchClass);
              const isPianoKey = button.visualShape?.startsWith("piano-") ?? false;
              const isPianoBlackKey = button.visualShape === "piano-black-key";
              const sequenceLabels = getSequenceLabelsForButton(
                sequenceSteps,
                button.id,
              );
              const scaleFinderLabels = showScaleFinderNumbers
                ? finderLabelsForButton(scaleFinderButtons, button.id)
                : "";
              const finderMatch = finderButtonIds.has(button.id);
              const abcMatch = abcActiveButtonIdSet.has(button.id) || bassPatternActiveButtonIdSet.has(button.id);
              const primaryFinderMatch = stradellaChordFinderActive && stradellaPrimaryFinderButtonIds.has(button.id);
              const rootBassFinderMatch = stradellaChordFinderActive && stradellaRootBassFinderButtonIds.has(button.id);

              const fontSize =
                chordLabelMode === "chord-tones" && isChord
                  ? Math.max(7, labelFontSize * 0.75)
                  : labelFontSize;

              return (
                <g
                  key={button.id}
                  className="button-group"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleButton(button);
                  }}
                >
                  {isPianoKey ? (
                    <>
                      <rect
                        x={button.x - (button.width ?? buttonSize * 2) / 2}
                        y={button.y - (button.height ?? buttonSize * 2) / 2}
                        width={button.width ?? buttonSize * 2}
                        height={button.height ?? buttonSize * 2}
                        rx={isPianoBlackKey ? 5 : 7}
                        className={[
                          "button",
                          "piano-key",
                          isPianoBlackKey ? "piano-black-key" : "piano-white-key",
                          overlay.selected ? "selected" : "",
                          finderMatch ? "finder-match" : "",
                          abcMatch ? "abc-match" : "",
                          primaryFinderMatch ? "finder-primary" : "",
                          rootBassFinderMatch ? "finder-root-bass" : "",
                          sequenceLabels || scaleFinderLabels ? "in-sequence" : "",
                        ].join(" ")}
                      />
                      {(finderMatch || abcMatch) && (
                        <rect
                          x={button.x - (button.width ?? buttonSize * 2) / 2 + 3}
                          y={button.y - (button.height ?? buttonSize * 2) / 2 + 3}
                          width={(button.width ?? buttonSize * 2) - 6}
                          height={(button.height ?? buttonSize * 2) - 6}
                          rx={isPianoBlackKey ? 4 : 6}
                          className={abcMatch ? "finder-ring abc-ring" : rootBassFinderMatch ? "finder-ring finder-root-bass-ring" : primaryFinderMatch ? "finder-ring finder-primary-ring" : "finder-ring"}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <circle
                        cx={button.x}
                        cy={button.y}
                        r={buttonSize}
                        className={[
                          "button",
                          isChord ? "chord" : "note",
                          isTreble ? "treble-button" : "",
                          isTrebleAccidental ? "treble-accidental" : "",
                          overlay.selected ? "selected" : "",
                          button.isReference ? "reference" : "",
                          finderMatch ? "finder-match" : "",
                          abcMatch ? "abc-match" : "",
                          primaryFinderMatch ? "finder-primary" : "",
                          rootBassFinderMatch ? "finder-root-bass" : "",
                          sequenceLabels || scaleFinderLabels ? "in-sequence" : "",
                        ].join(" ")}
                      />
                      {(finderMatch || abcMatch) && (
                        <circle
                          cx={button.x}
                          cy={button.y}
                          r={buttonSize + 4}
                          className={abcMatch ? "finder-ring abc-ring" : rootBassFinderMatch ? "finder-ring finder-root-bass-ring" : primaryFinderMatch ? "finder-ring finder-primary-ring" : "finder-ring"}
                        />
                      )}
                    </>
                  )}

                  {showButtonLabels && (
                    <text
                      x={button.x}
                      y={
                        isPianoKey
                          ? button.y + (button.height ?? buttonSize * 2) / 2 - 18
                          : button.y - (overlay.finger || sequenceLabels ? 2 : 0)
                      }
                      textAnchor="middle"
                      className={[
                        "main-label",
                        fontClass(labelFont),
                        isTreble ? "treble-label" : "",
                        isTrebleAccidental || isPianoBlackKey ? "treble-accidental-label" : "",
                      ].join(" ")}
                      style={{ fontSize }}
                    >
                      {renderMusicLabel(mainLabel)}
                    </text>
                  )}
                  {showSequenceNumbers && sequenceLabels && (
                    <text
                      x={button.x}
                      y={numberY(button.y, buttonSize, sequenceNumberPosition)}
                      textAnchor="middle"
                      className="sequence-number"
                    >
                      {sequenceLabels}
                    </text>
                  )}
                  {scaleFinderLabels && (
                    <text
                      x={button.x}
                      y={numberY(button.y, buttonSize, sequenceNumberPosition)}
                      textAnchor="middle"
                      className="finder-number"
                    >
                      {scaleFinderLabels}
                    </text>
                  )}

                  {overlay.finger && (
                    <text
                      x={button.x}
                      y={fingeringY(button.y, buttonSize, fingeringPosition)}
                      textAnchor="middle"
                      className={[
                        "finger-label",
                        fontClass(labelFont),
                        isTrebleAccidental ? "treble-accidental-label" : "",
                      ].join(" ")}
                      style={{ fontSize: buttonSize * 0.44 }}
                    >
                      {overlay.finger}
                    </text>
                  )}
                </g>
              );
            })}

            {showScaleFinderArrows &&
              scaleFinderButtons.length > 1 &&
              scaleFinderButtons.slice(0, -1).map((fromButton, index) => {
                const toButton = scaleFinderButtons[index + 1];

                return (
                  <path
                    key={`scale-finder-${fromButton.id}-${toButton.id}-${index}`}
                    d={makeSequenceArrowPath(
                      fromButton,
                      toButton,
                      index,
                      buttonSize,
                      scaleFinderArrowStyle,
                    )}
                    className="finder-arrow"
                    markerEnd={`url(#${finderArrowheadMarkerId})`}
                  />
                );
              })}

            {chordFinderActive &&
              chordFinderButtons.length > 1 &&
              chordFinderButtons.slice(0, -1).map((fromButton, index) => {
                const toButton = chordFinderButtons[index + 1];

                return (
                  <path
                    key={`chord-finder-${fromButton.id}-${toButton.id}-${index}`}
                    d={makeSequenceArrowPath(
                      fromButton,
                      toButton,
                      index,
                      buttonSize,
                      "straight",
                    )}
                    className="finder-arrow"
                    markerEnd={`url(#${finderArrowheadMarkerId})`}
                  />
                );
              })}

            {showSequenceArrows &&
              sequenceStepsWithButtons.slice(0, -1).map((fromStep, index) => {
                const toStep = sequenceStepsWithButtons[index + 1];

                return (
                  <path
                    key={`${fromStep.id}-${toStep.id}-${fromStep.step}-${toStep.step}`}
                    d={makeSequenceArrowPath(
                      fromStep.button,
                      toStep.button,
                      index,
                      buttonSize,
                      sequenceArrowStyle,
                    )}
                    className="sequence-arrow"
                    markerEnd={`url(#${sequenceArrowheadMarkerId})`}
                  />
                );
              })}

            {textNotes.map((note) => (
              <text
                key={note.id}
                x={note.x}
                y={note.y}
                textAnchor={note.anchor}
                className={`free-text-note ${fontClass(note.font)}`}
                style={{ fontSize: note.fontSize, fill: note.color }}
              >
                {splitMultilineText(note.text).map((line, index) => (
                  <tspan
                    key={index}
                    x={note.x}
                    dy={index === 0 ? 0 : note.fontSize * 1.25}
                  >
                    {line || " "}
                  </tspan>
                ))}
              </text>
            ))}
          </svg>
        </div>
      </section>
    </main>
  );
}

export default App;
