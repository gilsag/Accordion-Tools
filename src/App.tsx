import type { MinimumNominalGap } from "./tools/stradellaChordFinder/voicingDensity";
import { familyName, scaleName, stradellaDiagramRowLabel } from "./i18n/musicTerms";
import { accordionStatusText, diagramAutoTitle, harmonyRelatedDisplayName, harmonyStatusText, pianoRangeStatusLabel } from "./i18n/diagramLabels";
import { DEFAULT_STRADELLA_NOTE_LEVELS, normalizeStradellaNoteLevels, type StradellaNoteLevels } from "./tools/stradellaChordFinder/diagramAnnotations";
import { trebleContextualTitle } from "./tools/contextualTitles";
import { DEFAULT_CHORD_DISPLAY_STYLE, displayRealizedChord, displayStradellaButtonChord, type ChordDisplayStyle } from "./tools/chordDisplay";
import { chordToneName, displayRoot, realizedChordName } from "./tools/stradellaChordFinder/chordSpelling";
/*
  Application orchestration: React owns diagram/tool settings; src/tools/*
  supplies music algorithms, while src/sound.ts owns playback. Do not derive
  harmonic content from SVG highlights: an optional root reference may be
  highlighted without sounding. Finder results expose playbackButtons for that.
*/

/*
  Main application component.

  This file owns the user interface state, connects the layout generators to the
  SVG renderer, and coordinates tools such as fingering, sequences, and text
  notes. Music and layout calculations live in separate modules.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { renderAbc } from "abcjs";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import "./App.css";
import {
  browserLanguagePreferences,
  detectBrowserLanguage,
  isInterfaceLanguagePreference,
  SUPPORTED_LANGUAGES,
  resolveInterfaceLanguage,
  translate, translateKnownLabel,
  type InterfaceLanguagePreference,
  type InterfaceLanguage,
} from "./i18n/catalog";
import { LanguageProvider } from "./i18n/context";
import { abcExampleName, bassPatternName, progressionName } from "./i18n/optionLabels";

import type {
  AbcStradellaMode,
  AbcTrebleChordSymbolsMode,
  AccidentalMode,
  BassPatternChordVoicing,
  AccidentalStyle,
  BassCount,
  ButtonKind,
  ChordLabelMode,
  ColorTheme,
  DiagramAnnotationAnchor,
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
  SoundSource,
  SoundVoicePreset,
  SoundWaveform,
  SampleRegister,
  StradellaBassVoicing,
  StradellaChordFinderMode,
  TrebleLayout,
  TrebleSizePreset,
  TextNote,
  TitleMode,
} from "./types";

import {
  chordTones,
  fontClass,
  formatPitch,
  INDEX_TO_PITCH,
  INTERVALS_FROM_C,
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
import { downloadPng, downloadSvg, downloadZip, serializeSvg, svgStringToPngBytes } from "./download";
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
  abcEventsForStradellaSide,
  abcEventsForTrebleSide,
  abcMissingNotes,
  mapAbcEventsToStradellaButtons,
  mapAbcEventsToTrebleButtons,
  parseAbc,
  totalAbcBeats,
  type MappedAbcEvent,
} from "./tools/abcPlayerTools";
import {
  bassPatternEventsToAbc,
  chordProgressionSteps,
  bassPatternEventsToMidiBytes,
  bassPatternEventsToLilyPond,
  bassPatternEventsToStradellaNotationAbc,
  bassPatternMissingItems,
  makeBassPatternEvents,
  patternBarCount,
  validateBassPatternLibrary,
  totalBassPatternBeats,
  type BassPatternDefinition,
  type BassPatternLibrary,
  type BassPatternPlaybackEvent,
  type ChordProgressionDefinition,
  type StradellaNotationAbcOptions,
} from "./tools/bassPatternPlayerTools";
import { getChordFinderTrebleButtons, type TrebleChordVoicingMode } from "./tools/chordFinderTools";
import { intervalsForChordFinder } from "./music/chordDefinitions";
import { getStradellaChordFinderResult, getStradellaChordFinderResults } from "./tools/stradellaChordFinderTools";
import { realizationAnnotation, finderChordSymbol } from "./tools/stradellaChordFinder/diagramAnnotations";
import { analyzeConfiguredStradellaVoicing, DEFAULT_STRADELLA_REGISTER_MODEL, type StradellaOctaveGrouping, type StradellaRegisterModel, formatRegisterRange } from "./tools/stradellaChordFinder/registerModel";
import { voicingIntervalLayout } from "./tools/stradellaChordFinder/voicingIntervalLayout";
import { describeTrebleChord } from "./tools/trebleChordExplanation";
import {
  playButtonArpeggioThenChord,
  playButtonCombination,
  playButtonRhythmProgression,
  playButtonSequence,
  playButtonSound,
  stopAllSound,
  preloadLaMelodiosa,
  playHarmonyPitchClassChord,
  playHarmonyRelationship,
  notesForButton,
  type ProgressionRhythmPattern,
} from "./sound";
import { AboutPanel } from "./components/settings/AboutPanel";
import { TrebleChordFinderPanel } from "./components/tools/TrebleChordFinderPanel";
import { StradellaChordFinderPanel } from "./components/tools/StradellaChordFinderPanel";
import { StradellaVoicingIntervals } from "./components/tools/StradellaVoicingIntervals";
import { HelpTip } from "./components/ui/HelpTip";
import { BinaryChoiceButton } from "./components/ui/BinaryChoiceButton";
import { SegmentedChoice } from "./components/ui/SegmentedChoice";
import { HarmonyExplorerPanel } from "./components/tools/HarmonyExplorerPanel";
import { ProgressionAssistantPanel } from "./components/tools/ProgressionAssistantPanel";
import { HarmonicCircle } from "./tools/harmonyExplorer/components/HarmonicCircle";
import { buildDiagramExplanation } from "./tools/harmonyExplorer/explanation";
import type { ChordFamilyId, RelatedFamilyId, ScaleId } from "./tools/harmonyExplorer/music";
import {
  CIRCLE_OF_FIFTHS,
  DEFAULT_RING_VISIBILITY,
  buildSectorRelationships,
  chordFamily as harmonyChordFamily,
  chordLabel as harmonyChordLabel,
  chordMidiNotes as harmonyChordMidiNotes,
  filterRelationshipCounts,
  pitchClassesForChord as harmonyPitchClassesForChord,
  relatedFamilyName as harmonyRelatedFamilyName,
  relationshipCounts as harmonyRelationshipCounts,
  scaleDefinition as harmonyScaleDefinition,
} from "./tools/harmonyExplorer/music";
import type { HarmonyPlaybackStyle, HarmonySelection, HarmonyVoicingStyle } from "./tools/harmonyExplorer/types";
import type { HarmonyProgressionChord, HarmonyRecordedEvent } from "./tools/harmonyExplorer/progression";
import { isHarmonyProgressionChord } from "./tools/harmonyExplorer/progression";
import { optimizeStradellaProgression, progressionBassPulseButtons } from "./tools/harmonyExplorer/progression";
import {
  finderPatternForHarmonyFamily,
  harmonyFamilyForFinderPattern,
  pitchClassNameFromNumber,
  pitchClassNumberFromName,
} from "./tools/harmonyExplorer/integration";

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

type AbcExampleOption = {
  value: string;
  label: string;
  file: string;
};

const ABC_EXAMPLE_PLACEHOLDER: AbcExampleOption = {
  value: "",
  label: "Choose example…",
  file: "",
};

const ABC_EXAMPLE_FALLBACK_OPTIONS: AbcExampleOption[] = [
  ABC_EXAMPLE_PLACEHOLDER,
  {
    value: "c-major-scale",
    label: "C major scale",
    file: "abc/c-major-scale.abc",
  },
  {
    value: "happy-birthday",
    label: "Happy Birthday",
    file: "abc/happy-birthday.abc",
  },
  {
    value: "twinkle-little-star",
    label: "Twinkle Little Star",
    file: "abc/twinkle-little-star.abc",
  },
  {
    value: "dyads-and-chords",
    label: "Dyads and chords",
    file: "abc/dyads-and-chords.abc",
  },
  {
    value: "stradella-chord-symbols",
    label: "Stradella chord symbols",
    file: "abc/stradella-chord-symbols.abc",
  },
];

/** Dropdown options for treble instrument range presets. */
const TREBLE_SIZE_OPTIONS: Array<{ value: TrebleSizePreset; label: string }> = [
  { value: "one-octave", label: "1 octave (auto-expand if needed)" },
  { value: "two-octave", label: "2 octaves (auto-expand if needed)" },
  { value: "small", label: "Small CBA, about 3 octaves" },
  { value: "full", label: "Full-size CBA, about 3¾–4 octaves" },
  { value: "large", label: "Large CBA, about 5+ octaves" },
];

/** Dropdown options for piano treble keyboard ranges. */
const PIANO_TREBLE_RANGE_OPTIONS: Array<{
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
const TREBLE_SIZE_VIEW_WIDTH: Record<TrebleSizePreset, number> = {
  "one-octave": 500,
  "two-octave": 650,
  small: 1080,
  full: 1220,
  large: 1460,
};

/** Default button sizes applied when a treble size preset is selected. */
const TREBLE_PRESET_BUTTON_SIZE: Record<TrebleSizePreset, number> = {
  "one-octave": 28,
  "two-octave": 28,
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
  stradellaNoteLevels: StradellaNoteLevels;
  stradellaShowNominalNoteSpacing: boolean;
  stradellaMinimumNominalGap: MinimumNominalGap;
  side: Side;
  notation: NotationMode;
  accidental: AccidentalMode;
  chordLabelMode: ChordLabelMode;
  chordDisplayStyle: ChordDisplayStyle;
  language: InterfaceLanguagePreference;
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
  stradellaBassRegisterOctave: number;
  stradellaBassRegisterGrouping: StradellaOctaveGrouping;
  stradellaChordRegisterOctave: number;
  stradellaChordRegisterGrouping: StradellaOctaveGrouping;
  stradellaChordFinderMode: StradellaChordFinderMode;
  stradellaChordFinderMarkRootBass: boolean;
  abcStradellaMode: AbcStradellaMode;
  abcTrebleChordSymbolsMode: AbcTrebleChordSymbolsMode;
  bassPatternChordVoicing: BassPatternChordVoicing;
  bassPatternBarsPerChord: number;
  bassPatternRepeatsPerChord: number;
  bassPatternTempoBpm: number;
  bassPatternLoopMode: "once" | "fixed" | "infinite";
  bassPatternLoopCount: number;
  abcTempoBpm: number;
  soundSequenceTempoBpm: number;
  musicNotationIncludeTitle: boolean;
  musicNotationIncludeDescription: boolean;
  musicNotationIncludeSummary: boolean;
  musicNotationUseBarsPerLine: boolean;
  musicNotationBarsPerLine: number;
  musicNotationChordFontSize: number;
  musicNotationScale: number;
  musicNotationStaffWidth: number;
  musicNotationStaffSeparator: number;
  buttonSize: number;
  buttonSpacing: number;
  trebleAngle: number;
  buttonStrokeWidth: number;
  referenceStrokeWidth: number;
  chordFillStrength: number;
  accidentalStyle: AccidentalStyle;
  labelFontSize: number;
  titleFont: FontFamily;
  titleSize: number;
  labelFont: FontFamily;
  sequenceDisplayMode: SequenceDisplayMode;
  sequenceColorPreset: SequenceColorPreset;
  sequenceThickness: number;
  sequenceArrowheadSize: number;
  sequenceNumberFontSize: number;
  sequenceNumberColorPreset: SequenceColorPreset;
  sequenceNumberPosition: NumberPosition;
  fingeringPosition: NumberPosition;
  scaleFinderRoot: string;
  scaleFinderPattern: FinderScalePattern;
  scaleFinderRowLimit: 3 | 4 | 5;
  chordFinderRoot: string;
  chordFinderPattern: FinderChordPattern;
  chordFinderInversion: FinderChordInversion;
  chordFinderOctave: FinderChordOctave;
  bassPatternRoot: string;
  annotationTextSize: number;
  annotationTextColor: string;
  annotationFont: FontFamily;
  annotationBold: boolean;
  annotationItalic: boolean;
  annotationOffsetPercent: number;
  annotationButtonAnchor: DiagramAnnotationAnchor;
  soundVolume: number;
  soundSource: SoundSource;
  laMelodiosaTrebleRegister: SampleRegister;
  laMelodiosaBassRegister: SampleRegister;
  laMelodiosaFollowStradellaRegisters: boolean;
  soundVoicePreset: SoundVoicePreset;
  soundWaveform: SoundWaveform;
  soundMusetteDetuneCents: number;
  soundAttackMs: number;
  soundReleaseMs: number;
  soundNoteDurationMs: number;
  harmonyShowEnharmonics: boolean;
  harmonyShowSeparators: boolean;
  harmonyShowLegend: boolean;
  harmonyShowExplanation: boolean;
  harmonyRingVisibility: Record<string, boolean>;
  harmonyShowToneTooltips: boolean;
  harmonyShowNoteRing: boolean;
  harmonyColorByFamily: boolean;
  harmonyDiameter: number;
  harmonyFontSize: number;
  harmonyPlaybackStyle: HarmonyPlaybackStyle;
  harmonyVoicingStyle: HarmonyVoicingStyle;
  progressionAllowApproximations: boolean;
  progressionHandMovementWeight: number;
  progressionRhythmPattern: ProgressionRhythmPattern;
}>;

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

const SEQUENCE_DISPLAY_MODE_OPTIONS: Array<{
  value: SequenceDisplayMode;
  label: string;
}> = [
  { value: "numbers", label: "Numbers only" },
  { value: "straight-arrows", label: "Straight arrows" },
  { value: "curved-arrows", label: "Curved arrows" },
  { value: "numbers-and-straight-arrows", label: "Numbers + straight arrows" },
  { value: "numbers-and-curved-arrows", label: "Numbers + curved arrows" },
];

const SEQUENCE_DISPLAY_MODE_VALUES = SEQUENCE_DISPLAY_MODE_OPTIONS.map(
  (option) => option.value,
);

function finderLabelsForButton(buttons: DiagramButton[], buttonId: string) {
  return buttons
    .map((button, index) => (button.id === buttonId ? String(index + 1) : ""))
    .filter(Boolean)
    .join(",");
}

function normalizeProgressionText(value: string) {
  return value
    .replace(/[♭𝄫]/g, "b")
    .replace(/[♯𝄪]/g, "#")
    .replace(/[–—-]/g, " ")
    .replace(/[^A-Za-z0-9#b°+]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatProgressionOptionLabel(progression: ChordProgressionDefinition, language: InterfaceLanguage) {
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
  const resetMenuRef = useRef<HTMLDetailsElement | null>(null);
  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (resetMenuRef.current?.open && !resetMenuRef.current.contains(event.target as Node))
        resetMenuRef.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && resetMenuRef.current?.open) {
        resetMenuRef.current.open = false;
        resetMenuRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  const harmonySvgRef = useRef<SVGSVGElement | null>(null);
  const previousLayoutSignatureRef = useRef<string | null>(null);
  const abcPlaybackTimeoutsRef = useRef<number[]>([]);
  const abcPlaybackStartedAtRef = useRef<number | null>(null);
  const abcPlaybackStartBeatRef = useRef(0);

  /* Core layout and notation state. */
  const [languagePreference, setLanguagePreference] = useState<InterfaceLanguagePreference>(() => {
    try {
      const saved = window.localStorage.getItem('accordionTools.interfaceLanguage.v1');
      return isInterfaceLanguagePreference(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [browserLanguage, setBrowserLanguage] = useState(() =>
    detectBrowserLanguage(browserLanguagePreferences()),
  );
  const language = resolveInterfaceLanguage(languagePreference, [browserLanguage]);
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(language, key, params);
  function changeLanguage(next: InterfaceLanguagePreference) {
    setLanguagePreference(next);
    try {
      window.localStorage.setItem('accordionTools.interfaceLanguage.v1', next);
    } catch {
      /* The setting remains active for this session when storage is unavailable. */
    }
  }
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const refresh = () => setBrowserLanguage(detectBrowserLanguage(browserLanguagePreferences()));
    window.addEventListener('languagechange', refresh);
    return () => window.removeEventListener('languagechange', refresh);
  }, []);

  const [side, setSide] = useState<Side>("stradella");
  const [notation, setNotation] = useState<NotationMode>("english");
  const [accidental, setAccidental] = useState<AccidentalMode>("natural");
  const [chordDisplayStyle, setChordDisplayStyle] = useState<ChordDisplayStyle>(DEFAULT_CHORD_DISPLAY_STYLE);
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
  const [interfaceDensity, setInterfaceDensity] =
    useState<InterfaceDensity>("compact");
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
  const [titleMode, setTitleMode] = useState<TitleMode>("contextual");
  const [customTitle, setCustomTitle] = useState("My accordion diagram");
  const [titleFont, setTitleFont] = useState<FontFamily>("system");
  const [titleSize, setTitleSize] = useState(24);
  const [labelFont, setLabelFont] = useState<FontFamily>("system");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default");

  /* Left panel visibility and accordion-section state. */
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("tools");
  const [workspaceMode, setWorkspaceMode] = useState<"accordion" | "harmony">("accordion");

  type SettingsSection =
    | "layout"
    | "title"
    | "appearance"
    | "notation"
    | "musicNotation"
    | "sound"
    | "stradellaRegisters"
    | "harmony"
    | "about"
    | null;
  type ToolSection =
    | "scaleFinder"
    | "chordFinder"
    | "abcPlayer"
    | "bassPatternPlayer"
    | "stradellaChordFinder"
    | "harmonyExplorer"
    | "progressionAssistant"
    | "fingering"
    | "selection"
    | "sequences"
    | "annotateDiagram"
    | null;

  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSection>(null);

  const [activeToolSection, setActiveToolSection] = useState<ToolSection>(null);

  useEffect(() => {
    setActiveSettingsSection(null);
  }, [workspaceMode, side]);

  /* Tool state for selections, fingerings, note sequences, and diagram annotations. */
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
  const [showTrebleVoicingNote, setShowTrebleVoicingNote] = useState(true);
  const [trebleChordVoicingMode, setTrebleChordVoicingMode] = useState<TrebleChordVoicingMode>("auto");
  const [chordFinderRoot, setChordFinderRoot] = useState("C");
  const [chordFinderPattern, setChordFinderPattern] =
    useState<FinderChordPattern>("major-triad");
  const [chordFinderInversion, setChordFinderInversion] =
    useState<FinderChordInversion>("root");
  const [chordFinderOctave, setChordFinderOctave] =
    useState<FinderChordOctave>(4);

  /* ABC Player state for file/paste playback and diagram highlighting. */
  const [abcText, setAbcText] = useState("");
  const [abcEditorExpanded, setAbcEditorExpanded] = useState(false);
  const [abcFileName, setAbcFileName] = useState("");
  const [abcExampleValue, setAbcExampleValue] = useState("");
  const [abcExampleOptions, setAbcExampleOptions] = useState<AbcExampleOption[]>(
    ABC_EXAMPLE_FALLBACK_OPTIONS,
  );
  const [abcTempoBpm, setAbcTempoBpm] = useState(80);
  const [abcPositionBeat, setAbcPositionBeat] = useState(0);
  const [abcPlaybackState, setAbcPlaybackState] = useState<
    "stopped" | "playing" | "paused"
  >("stopped");
  const [abcActiveButtonIds, setAbcActiveButtonIds] = useState<string[]>([]);
  const [abcStradellaMode, setAbcStradellaMode] =
    useState<AbcStradellaMode>("bass-notes-and-chord-symbols");
  const [abcTrebleChordSymbolsMode, setAbcTrebleChordSymbolsMode] =
    useState<AbcTrebleChordSymbolsMode>("ignore");
  const [abcRenderedNotationVisible, setAbcRenderedNotationVisible] =
    useState(false);
  const abcNotationRef = useRef<HTMLDivElement | null>(null);

  /* Stradella Bass Pattern Player state. */
  const [builtInBassPatternDefinitions, setBuiltInBassPatternDefinitions] =
    useState<BassPatternDefinition[]>([]);
  const [customBassPatternDefinitions, setCustomBassPatternDefinitions] =
    useState<BassPatternDefinition[]>([]);
  const bassPatternDefinitions = useMemo(
    () => [...builtInBassPatternDefinitions, ...customBassPatternDefinitions],
    [builtInBassPatternDefinitions, customBassPatternDefinitions],
  );
  const [chordProgressionDefinitions, setChordProgressionDefinitions] =
    useState<ChordProgressionDefinition[]>([]);
  const [bassPatternId, setBassPatternId] = useState("polka");
  const [chordProgressionId, setChordProgressionId] = useState("i-iv-v-i");
  const [bassPatternRoot, setBassPatternRoot] = useState("C");
  const [bassPatternTempoBpm, setBassPatternTempoBpm] = useState(80);
  const [bassPatternChordVoicing, setBassPatternChordVoicing] =
    useState<BassPatternChordVoicing>("simple");
  const [bassPatternBarsPerChord, setBassPatternBarsPerChord] = useState(2);
  const [bassPatternLoopMode, setBassPatternLoopMode] = useState<
    "once" | "fixed" | "infinite"
  >("fixed");
  const [bassPatternLoopCount, setBassPatternLoopCount] = useState(2);
  const [bassPatternExportFormat, setBassPatternExportFormat] = useState<
    "abc" | "midi" | "lilypond"
  >("abc");
  const [bassPatternEditorExpanded, setBassPatternEditorExpanded] =
    useState(false);
  const [musicNotationIncludeTitle, setMusicNotationIncludeTitle] =
    useState(true);
  const [musicNotationIncludeDescription, setMusicNotationIncludeDescription] =
    useState(false);
  const [musicNotationIncludeSummary, setMusicNotationIncludeSummary] =
    useState(false);
  const [musicNotationUseBarsPerLine, setMusicNotationUseBarsPerLine] =
    useState(true);
  const [musicNotationBarsPerLine, setMusicNotationBarsPerLine] = useState(4);
  const [musicNotationChordFontSize, setMusicNotationChordFontSize] =
    useState(11);
  const [musicNotationScale, setMusicNotationScale] = useState(54);
  const [musicNotationStaffWidth, setMusicNotationStaffWidth] = useState(520);
  const [musicNotationStaffSeparator, setMusicNotationStaffSeparator] =
    useState(14);
  const [
    bassPatternRenderedNotationVisible,
    setBassPatternRenderedNotationVisible,
  ] = useState(false);
  const [bassPatternValidationErrors, setBassPatternValidationErrors] =
    useState<string[]>([]);
  const [bassPatternEditorText, setBassPatternEditorText] = useState(() =>
    JSON.stringify(
      {
        id: "custom-oom-pah",
        name: "Custom Oom-pah",
        meter: "4/4",
        tags: ["custom"],
        pattern: ">B C A C",
      },
      null,
      2,
    ),
  );
  const [bassPatternEditorMessage, setBassPatternEditorMessage] = useState("");
  const [bassPatternPlaybackState, setBassPatternPlaybackState] = useState<
    "stopped" | "playing"
  >("stopped");
  const [bassPatternActiveButtonIds, setBassPatternActiveButtonIds] = useState<
    string[]
  >([]);
  const bassPatternTimeoutsRef = useRef<number[]>([]);
  const bassPatternPlaybackRunRef = useRef(0);
  const bassPatternNotationRef = useRef<HTMLDivElement | null>(null);

  function toggleBassPatternNotation() {
    setBassPatternRenderedNotationVisible((current) => !current);
    setAbcRenderedNotationVisible(false);
    setSequenceRenderedNotationVisible(false);
  }

  function toggleAbcNotation() {
    setAbcRenderedNotationVisible((current) => !current);
    setBassPatternRenderedNotationVisible(false);
    setSequenceRenderedNotationVisible(false);
  }

  function toggleSequenceNotation() {
    setSequenceRenderedNotationVisible((current) => !current);
    setBassPatternRenderedNotationVisible(false);
    setAbcRenderedNotationVisible(false);
  }

  useEffect(() => {
    if (activeToolSection !== "bassPatternPlayer") {
      setBassPatternRenderedNotationVisible(false);
    }
    if (activeToolSection !== "abcPlayer") {
      setAbcRenderedNotationVisible(false);
    }
    if (activeToolSection !== "sequences") {
      setSequenceRenderedNotationVisible(false);
    }
  }, [activeToolSection]);

  /* Stradella Chord Finder state for Stradella-only chord exploration. */
  const [stradellaChordFinderActive, setStradellaChordFinderActive] =
    useState(false);
  const [stradellaChordFinderRoot, setStradellaChordFinderRoot] = useState("C");
  const [stradellaChordFinderPattern, setStradellaChordFinderPattern] =
    useState<FinderChordPattern>("major-triad");
  const [stradellaChordFinderMode, setStradellaChordFinderMode] =
    useState<StradellaChordFinderMode>("bass-and-chords");
  const [stradellaChordFinderRealizationIndex, setStradellaChordFinderRealizationIndex] = useState(0);
  // Per-chord harmonic intention, not a global instrument preference.
  const [stradellaChordFinderRequestedBass, setStradellaChordFinderRequestedBass] = useState<string | null>(null);
  // Register assumptions describe nominal pitch placement, not sound source or reed registration.
  const [stradellaBassRegisterOctave, setStradellaBassRegisterOctave] = useState(DEFAULT_STRADELLA_REGISTER_MODEL.bass.startOctave);
  const [stradellaBassRegisterGrouping, setStradellaBassRegisterGrouping] = useState<StradellaOctaveGrouping>(DEFAULT_STRADELLA_REGISTER_MODEL.bass.grouping);
  const [stradellaChordRegisterOctave, setStradellaChordRegisterOctave] = useState(DEFAULT_STRADELLA_REGISTER_MODEL.chord.startOctave);
  const [stradellaChordRegisterGrouping, setStradellaChordRegisterGrouping] = useState<StradellaOctaveGrouping>(DEFAULT_STRADELLA_REGISTER_MODEL.chord.grouping);
  const stradellaRegisterModel: StradellaRegisterModel = useMemo(() => ({
    bass: { startOctave: stradellaBassRegisterOctave, grouping: stradellaBassRegisterGrouping },
    chord: { startOctave: stradellaChordRegisterOctave, grouping: stradellaChordRegisterGrouping },
  }), [stradellaBassRegisterOctave, stradellaBassRegisterGrouping, stradellaChordRegisterOctave, stradellaChordRegisterGrouping]);
  const [finderMaxButtons, setFinderMaxButtons] = useState(3);
  const [finderSpanColumns, setFinderSpanColumns] = useState(4.3);
  const [stradellaMinimumNominalGap, setStradellaMinimumNominalGap] = useState<MinimumNominalGap>(0);
  const [batchExporting, setBatchExporting] = useState(false);
  // View-only mode. SVG viewBox, musical geometry and exports remain untouched.
  const [mobileDiagramView, setMobileDiagramView] = useState<"readable" | "fit">("readable");
  const [showFinderRealizationNote, setShowFinderRealizationNote] = useState(true);
  const [stradellaNoteLevels, setStradellaNoteLevels] = useState<StradellaNoteLevels>({ ...DEFAULT_STRADELLA_NOTE_LEVELS });
  const [finderExplanationFontSize, setFinderExplanationFontSize] = useState(26);
  const [pendingProgressionRealizationKey, setPendingProgressionRealizationKey] = useState<string | null>(null);
  const [
    stradellaChordFinderMarkRootBass,
    setStradellaChordFinderMarkRootBass,
  ] = useState(true);

  /* Harmony Explorer state. Kept independent from accordion layout state so the
     harmonic relationship engine can remain reusable and later evolve separately. */
  const [harmonyReferenceFamilyId, setHarmonyReferenceFamilyId] = useState<ChordFamilyId>("major");
  const [harmonyRelatedFamilyId, setHarmonyRelatedFamilyId] = useState<RelatedFamilyId>("minor7");
  const [harmonyScaleId, setHarmonyScaleId] = useState<ScaleId>("ionian");
  const [harmonyDiatonicOnly, setHarmonyDiatonicOnly] = useState(false);
  const [harmonyHighlightDiatonic, setHarmonyHighlightDiatonic] = useState(true);
  const [harmonyShowEnharmonics, setHarmonyShowEnharmonics] = useState(false);
  const [harmonyShowSeparators, setHarmonyShowSeparators] = useState(true);
  const [harmonyShowLegend, setHarmonyShowLegend] = useState(true);
  const [harmonyShowExplanation, setHarmonyShowExplanation] = useState(false);
  const [harmonyRingVisibility, setHarmonyRingVisibility] = useState<Record<number, boolean>>(() => ({ ...DEFAULT_RING_VISIBILITY }));
  const [harmonyShowToneTooltips, setHarmonyShowToneTooltips] = useState(true);
  const [harmonyShowNoteRing, setHarmonyShowNoteRing] = useState(true);
  const [harmonyColorByFamily, setHarmonyColorByFamily] = useState(false);
  const [harmonyDiameter, setHarmonyDiameter] = useState(900);
  const [harmonyFontSize, setHarmonyFontSize] = useState(18);
  const [harmonyPlaybackStyle, setHarmonyPlaybackStyle] = useState<HarmonyPlaybackStyle>("block");
  const [harmonyVoicingStyle, setHarmonyVoicingStyle] = useState<HarmonyVoicingStyle>("root");
  const [harmonySelection, setHarmonySelection] = useState<HarmonySelection | null>(null);
  const [harmonyFocusedReferenceRootPc, setHarmonyFocusedReferenceRootPc] = useState<number | null>(null);
  const [harmonyProgression, setHarmonyProgression] = useState<HarmonyProgressionChord[]>([]);
  const [harmonyRecordedProgression, setHarmonyRecordedProgression] = useState<HarmonyRecordedEvent[]>([]);
  const [harmonyProgressionRecording, setHarmonyProgressionRecording] = useState(false);
  const [harmonyRecordedNotationVisible, setHarmonyRecordedNotationVisible] = useState(false);
  const [harmonyRecordedProgressionPlaying, setHarmonyRecordedProgressionPlaying] = useState(false);
  const harmonyRecordedPlaybackTimeoutsRef = useRef<number[]>([]);
  const harmonyRecordedNotationRef = useRef<HTMLDivElement | null>(null);
  const [harmonyProgressionManualRoot, setHarmonyProgressionManualRoot] = useState("C");
  const [harmonyProgressionManualFamilyId, setHarmonyProgressionManualFamilyId] = useState<ChordFamilyId>("major");
  const [harmonyProgressionAllowApproximations, setHarmonyProgressionAllowApproximations] = useState(true);
  const [harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight] = useState(0.65);
  const [harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern] = useState<ProgressionRhythmPattern>("block");
  const [harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex] = useState<number | null>(null);
  const [harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds] = useState<string[]>([]);
  const [harmonyProgressionNotationVisible, setHarmonyProgressionNotationVisible] = useState(false);
  const harmonyProgressionIdRef = useRef(1);
  const harmonyProgressionNotationRef = useRef<HTMLDivElement | null>(null);

  function toggleHarmonyProgressionNotation() {
    setHarmonyProgressionNotationVisible((current) => !current);
    setBassPatternRenderedNotationVisible(false);
    setAbcRenderedNotationVisible(false);
    setSequenceRenderedNotationVisible(false);
  }

  function toggleHarmonyRecordedNotation() {
    setHarmonyRecordedNotationVisible((current) => !current);
    setBassPatternRenderedNotationVisible(false);
    setAbcRenderedNotationVisible(false);
    setSequenceRenderedNotationVisible(false);
    setHarmonyProgressionNotationVisible(false);
  }

  useEffect(() => {
    if (activeToolSection !== "progressionAssistant") {
      setHarmonyProgressionNotationVisible(false);
      setHarmonyProgressionActiveButtonIds([]);
    }
  }, [activeToolSection]);

  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [textNoteFontSize, setTextNoteFontSize] = useState(15);
  const [textNoteColor, setTextNoteColor] = useState("#172033");
  const [textNoteFont, setTextNoteFont] = useState<FontFamily>("system");
  const [annotationBold, setAnnotationBold] = useState(false);
  const [annotationItalic, setAnnotationItalic] = useState(false);
  const [annotationOffsetPercent, setAnnotationOffsetPercent] = useState(50);
  const [annotationButtonAnchor, setAnnotationButtonAnchor] =
    useState<DiagramAnnotationAnchor>("center");
  const annotationEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const [inlineAnnotationEditor, setInlineAnnotationEditor] = useState<{
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
    font: FontFamily;
    bold: boolean;
    italic: boolean;
    annotationOffsetPercent: number;
    attachedToButtonId?: string;
    annotationAnchor?: DiagramAnnotationAnchor;
  } | null>(null);
  useEffect(() => {
    if (inlineAnnotationEditor) {
      window.setTimeout(() => annotationEditorRef.current?.focus(), 0);
    }
  }, [inlineAnnotationEditor]);


  /* Sound tool state for synthesized button and sequence playback. */
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.2);
  const [soundSource, setSoundSource] = useState<SoundSource>("la-melodiosa");
  const [laMelodiosaTrebleRegister, setLaMelodiosaTrebleRegister] =
    useState<SampleRegister>("I");
  const [laMelodiosaBassRegister, setLaMelodiosaBassRegister] =
    useState<SampleRegister>("III");
  const [laMelodiosaFollowStradellaRegisters, setLaMelodiosaFollowStradellaRegisters] = useState(true);
  const [soundVoicePreset, setSoundVoicePreset] =
    useState<SoundVoicePreset>("soft-reed");
  const [soundWaveform, setSoundWaveform] = useState<SoundWaveform>("triangle");
  const [soundMusetteDetuneCents, setSoundMusetteDetuneCents] = useState(9);
  const [soundAttackMs, setSoundAttackMs] = useState(14);
  const [soundReleaseMs, setSoundReleaseMs] = useState(120);
  const [soundNoteDurationMs, setSoundNoteDurationMs] = useState(420);
  const [soundSequenceTempoBpm, setSoundSequenceTempoBpm] = useState(80);
  const [sequenceRenderedNotationVisible, setSequenceRenderedNotationVisible] =
    useState(false);
  const sequenceNotationRef = useRef<HTMLDivElement | null>(null);
  const [stradellaBassVoicing, setStradellaBassVoicing] =
    useState<StradellaBassVoicing>("single-low");
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("svg");
  const [showStradellaVoicingIntervals, setShowStradellaVoicingIntervals] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAbcExampleManifest() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}abc/examples.json`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const manifest = (await response.json()) as unknown;
        if (cancelled || !Array.isArray(manifest)) return;

        const examples = manifest
          .map((entry): AbcExampleOption | null => {
            if (!entry || typeof entry !== "object") return null;
            const value = (entry as { value?: unknown }).value;
            const label = (entry as { label?: unknown }).label;
            const file = (entry as { file?: unknown }).file;
            if (
              typeof value !== "string" ||
              typeof label !== "string" ||
              typeof file !== "string" ||
              !value ||
              !label ||
              !file
            ) {
              return null;
            }
            return { value, label, file };
          })
          .filter((entry): entry is AbcExampleOption => entry !== null);

        if (examples.length > 0) {
          setAbcExampleOptions([ABC_EXAMPLE_PLACEHOLDER, ...examples]);
        }
      } catch {
        /* The fallback ABC example list is used when the manifest is unavailable. */
      }
    }

    loadAbcExampleManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultSettings() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}default-settings.json`,
          {
            cache: "no-store",
          },
        );
        if (!response.ok) return;

        const defaults = (await response.json()) as DefaultSettingsFile;
        if (cancelled || !defaults || typeof defaults !== "object") return;
        // The user's stored choice takes precedence over editable defaults.
        try {
          if (window.localStorage.getItem('accordionTools.interfaceLanguage.v1') === null && isInterfaceLanguagePreference(defaults.language)) {
            setLanguagePreference(defaults.language);
          }
        } catch {
          if (isInterfaceLanguagePreference(defaults.language)) setLanguagePreference(defaults.language);
        }


        if (isOneOf(defaults.side, ["stradella", "treble"] as const)) {
          setSide(defaults.side);
        }
        if (
          isOneOf(defaults.notation, [
            "english",
            "german",
            "solfege",
            "intervals",
            "blank",
          ] as const)
        ) {
          setNotation(defaults.notation);
        }
        if (
          isOneOf(defaults.accidental, ["natural", "flats", "sharps", "enharmonic"] as const)
        ) {
          setAccidental(defaults.accidental);
        }
        if (isOneOf(defaults.chordDisplayStyle, ["compact", "letter", "words"] as const)) {
          setChordDisplayStyle(defaults.chordDisplayStyle);
        }
        const defaultChordLabelMode = (defaults as { chordLabelMode?: unknown }).chordLabelMode;
        if (defaultChordLabelMode === "roman" || defaultChordLabelMode === "tonal-function") {
          setChordLabelMode("functional-reference");
        } else if (
          isOneOf(defaultChordLabelMode, [
            "none",
            "chord-name",
            "root-only",
            "chord-tones",
            "row-function",
            "functional-reference",
          ] as const)
        ) {
          setChordLabelMode(defaultChordLabelMode);
        }
        if (
          isOneOf(defaults.basses, [
            "8",
            "12",
            "24",
            "32",
            "40",
            "48-8x6",
            "48-12x4",
            "60",
            "72",
            "80",
            "96",
            "100",
            "120",
          ] as const)
        ) {
          setBasses(defaults.basses);
        }
        if (
          isOneOf(defaults.trebleLayout, [
            "c-system",
            "b-system",
            "piano",
          ] as const)
        ) {
          setTrebleLayout(defaults.trebleLayout);
        }
        if ([3, 4, 5].includes(Number(defaults.trebleRows))) {
          setTrebleRows(Number(defaults.trebleRows) as 3 | 4 | 5);
        }
        if (isOneOf(defaults.trebleSize, ["one-octave", "two-octave", "small", "full", "large"] as const)) {
          setTrebleSize(defaults.trebleSize);
        }
        if (
          isOneOf(defaults.pianoTrebleRange, [
            "two-octave",
            "three-octave",
            "four-octave",
          ] as const)
        ) {
          setPianoTrebleRange(defaults.pianoTrebleRange);
        }
        if (typeof defaults.showTrebleOctaves === "boolean") {
          setShowTrebleOctaves(defaults.showTrebleOctaves);
        }
        if (typeof defaults.diagramVerticalSpacing === "number") {
          setDiagramVerticalSpacing(
            Math.max(0, Math.min(80, defaults.diagramVerticalSpacing)),
          );
        }
        if (typeof defaults.pianoKeyWidthScale === "number") {
          setPianoKeyWidthScale(
            Math.max(0.75, Math.min(1.45, defaults.pianoKeyWidthScale)),
          );
        }
        if (typeof defaults.pianoKeyHeightScale === "number") {
          setPianoKeyHeightScale(
            Math.max(0.75, Math.min(1.8, defaults.pianoKeyHeightScale)),
          );
        }
        if (typeof defaults.pianoBlackKeyWidthScale === "number") {
          setPianoBlackKeyWidthScale(
            Math.max(0.75, Math.min(1.35, defaults.pianoBlackKeyWidthScale)),
          );
        }
        if (typeof defaults.pianoBlackKeyHeightScale === "number") {
          setPianoBlackKeyHeightScale(
            Math.max(0.75, Math.min(1.5, defaults.pianoBlackKeyHeightScale)),
          );
        }
        if (typeof defaults.diagramScale === "number") {
          setDiagramScale(Math.max(70, Math.min(140, defaults.diagramScale)));
        }
        if (
          isOneOf(defaults.interfaceDensity, [
            "compact",
            "comfortable",
          ] as const)
        ) {
          setInterfaceDensity(defaults.interfaceDensity);
        }
        if (typeof defaults.showStatusBar === "boolean") {
          setShowStatusBar(defaults.showStatusBar);
        }
        if (
          isOneOf(defaults.scaleFinderDisplayMode, SEQUENCE_DISPLAY_MODE_VALUES)
        ) {
          setScaleFinderDisplayMode(defaults.scaleFinderDisplayMode);
        }
        if (
          isOneOf(defaults.colorTheme, [
            "default",
            "classic",
            "pastel",
            "print",
            "warm",
            "contrast",
          ] as const)
        ) {
          setColorTheme(defaults.colorTheme);
        }
        if (isOneOf(defaults.titleMode, ["auto", "contextual", "custom", "none"] as const)) {
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
        if (isOneOf(defaults.soundSource, ["synth", "la-melodiosa"] as const)) {
          setSoundSource(defaults.soundSource);
        }
        if (isOneOf(defaults.laMelodiosaTrebleRegister, ["I", "II", "III"] as const)) {
          setLaMelodiosaTrebleRegister(defaults.laMelodiosaTrebleRegister);
        }
        if (isOneOf(defaults.laMelodiosaBassRegister, ["I", "II", "III"] as const)) {
          setLaMelodiosaBassRegister(defaults.laMelodiosaBassRegister);
        }
        if (typeof defaults.laMelodiosaFollowStradellaRegisters === "boolean") {
          setLaMelodiosaFollowStradellaRegisters(defaults.laMelodiosaFollowStradellaRegisters);
        }
        if (
          isOneOf(defaults.stradellaBassVoicing, [
            "single-low",
            "low-and-middle",
            "single-middle",
          ] as const)
        ) {
          setStradellaBassVoicing(defaults.stradellaBassVoicing);
        }
        if (defaults.stradellaNoteLevels) setStradellaNoteLevels(normalizeStradellaNoteLevels(defaults.stradellaNoteLevels));
        if ([1, 2, 3, 4].includes(Number(defaults.stradellaBassRegisterOctave)))
          setStradellaBassRegisterOctave(Number(defaults.stradellaBassRegisterOctave));
        if (isOneOf(defaults.stradellaBassRegisterGrouping, ["C-B", "F-E"] as const))
          setStradellaBassRegisterGrouping(defaults.stradellaBassRegisterGrouping);
        if ([2, 3, 4, 5].includes(Number(defaults.stradellaChordRegisterOctave)))
          setStradellaChordRegisterOctave(Number(defaults.stradellaChordRegisterOctave));
        if (isOneOf(defaults.stradellaChordRegisterGrouping, ["C-B", "F-E"] as const))
          setStradellaChordRegisterGrouping(defaults.stradellaChordRegisterGrouping);
        if (
          isOneOf(defaults.stradellaChordFinderMode, [
            "bass-only",
            "chord-buttons-only",
            "bass-and-chords",
          ] as const)
        ) {
          setStradellaChordFinderMode(defaults.stradellaChordFinderMode);
        }
        if (typeof defaults.stradellaChordFinderMarkRootBass === "boolean") {
          setStradellaChordFinderMarkRootBass(
            defaults.stradellaChordFinderMarkRootBass,
          );
        }
        if (
          isOneOf(defaults.abcStradellaMode, [
            "bass-notes-only",
            "chord-symbols-only",
            "bass-notes-and-chord-symbols",
          ] as const)
        ) {
          setAbcStradellaMode(defaults.abcStradellaMode);
        }
        if (
          isOneOf(defaults.abcTrebleChordSymbolsMode, [
            "ignore",
            "play",
          ] as const)
        ) {
          setAbcTrebleChordSymbolsMode(defaults.abcTrebleChordSymbolsMode);
        }
        if (
          isOneOf(defaults.bassPatternChordVoicing, ["simple", "full"] as const)
        ) {
          setBassPatternChordVoicing(defaults.bassPatternChordVoicing);
        }
        const defaultRepeatsPerChord =
          typeof defaults.bassPatternRepeatsPerChord === "number"
            ? defaults.bassPatternRepeatsPerChord
            : defaults.bassPatternBarsPerChord;
        if (typeof defaultRepeatsPerChord === "number") {
          setBassPatternBarsPerChord(
            Math.max(1, Math.min(8, Math.round(defaultRepeatsPerChord))),
          );
        }
        if (typeof defaults.bassPatternTempoBpm === "number") {
          setBassPatternTempoBpm(
            Math.max(
              50,
              Math.min(220, Math.round(defaults.bassPatternTempoBpm)),
            ),
          );
        }
        if (
          isOneOf(defaults.bassPatternLoopMode, [
            "once",
            "fixed",
            "infinite",
          ] as const)
        ) {
          setBassPatternLoopMode(defaults.bassPatternLoopMode);
        }
        if (typeof defaults.bassPatternLoopCount === "number") {
          setBassPatternLoopCount(
            Math.max(
              1,
              Math.min(64, Math.round(defaults.bassPatternLoopCount)),
            ),
          );
        }
        if (typeof defaults.abcTempoBpm === "number") {
          setAbcTempoBpm(
            Math.max(30, Math.min(220, Math.round(defaults.abcTempoBpm))),
          );
        }
        if (typeof defaults.soundSequenceTempoBpm === "number") {
          setSoundSequenceTempoBpm(
            Math.max(
              30,
              Math.min(220, Math.round(defaults.soundSequenceTempoBpm)),
            ),
          );
        }
        if (typeof defaults.musicNotationIncludeTitle === "boolean")
          setMusicNotationIncludeTitle(defaults.musicNotationIncludeTitle);
        if (typeof defaults.musicNotationIncludeDescription === "boolean")
          setMusicNotationIncludeDescription(
            defaults.musicNotationIncludeDescription,
          );
        if (typeof defaults.musicNotationIncludeSummary === "boolean")
          setMusicNotationIncludeSummary(defaults.musicNotationIncludeSummary);
        if (typeof defaults.musicNotationUseBarsPerLine === "boolean")
          setMusicNotationUseBarsPerLine(defaults.musicNotationUseBarsPerLine);
        if (typeof defaults.musicNotationBarsPerLine === "number")
          setMusicNotationBarsPerLine(
            Math.max(
              1,
              Math.min(8, Math.round(defaults.musicNotationBarsPerLine)),
            ),
          );
        if (typeof defaults.musicNotationChordFontSize === "number")
          setMusicNotationChordFontSize(
            Math.max(
              8,
              Math.min(24, Math.round(defaults.musicNotationChordFontSize)),
            ),
          );
        if (typeof defaults.musicNotationScale === "number")
          setMusicNotationScale(
            Math.max(
              40,
              Math.min(100, Math.round(defaults.musicNotationScale)),
            ),
          );
        if (typeof defaults.musicNotationStaffWidth === "number")
          setMusicNotationStaffWidth(
            Math.max(
              320,
              Math.min(900, Math.round(defaults.musicNotationStaffWidth)),
            ),
          );
        if (typeof defaults.musicNotationStaffSeparator === "number")
          setMusicNotationStaffSeparator(
            Math.max(
              8,
              Math.min(32, Math.round(defaults.musicNotationStaffSeparator)),
            ),
          );
        applyExtendedDefaultSettings(defaults);
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
          fetch(
            `${import.meta.env.BASE_URL}chord-progressions/chord-progressions.json`,
          ),
        ]);

        if (!patternsResponse.ok || !progressionsResponse.ok) return;

        const patternLibrary =
          (await patternsResponse.json()) as BassPatternLibrary;
        const progressions =
          (await progressionsResponse.json()) as ChordProgressionDefinition[];
        if (cancelled) return;

        const validationErrors = validateBassPatternLibrary(patternLibrary);
        setBassPatternValidationErrors(validationErrors);

        if (
          validationErrors.length === 0 &&
          patternLibrary.version === 2 &&
          Array.isArray(patternLibrary.patterns) &&
          patternLibrary.patterns.length > 0
        ) {
          const patternsWithLegend = patternLibrary.patterns.map((pattern) => ({
            ...pattern,
            legend: pattern.legend ?? patternLibrary.legend,
          }));
          setBuiltInBassPatternDefinitions(patternsWithLegend);
          setBassPatternId((current) =>
            patternsWithLegend.some((pattern) => pattern.id === current)
              ? current
              : patternsWithLegend[0].id,
          );
        }

        if (Array.isArray(progressions) && progressions.length > 0) {
          setChordProgressionDefinitions(progressions);
          setChordProgressionId((current) =>
            progressions.some((progression) => progression.id === current)
              ? current
              : progressions[0].id,
          );
        }
      } catch (error) {
        setBassPatternValidationErrors([
          error instanceof Error
            ? error.message
            : "Could not load bass pattern files.",
        ]);
        /* Bass pattern files are optional; the rest of the app still works without them. */
      }
    }

    loadBassPatternData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        "accordionTools.customBassPatterns.v2",
      );
      if (!stored) return;
      const parsed = JSON.parse(stored) as BassPatternDefinition[];
      if (Array.isArray(parsed)) setCustomBassPatternDefinitions(parsed);
    } catch {
      /* Ignore malformed local custom pattern data. */
    }
  }, []);

  /** Applies extended visual/tool defaults that are also user-editable in default-settings.json. */
  function applyExtendedDefaultSettings(settings: DefaultSettingsFile) {
    if (typeof settings.stradellaShowNominalNoteSpacing === "boolean")
      setShowStradellaVoicingIntervals(settings.stradellaShowNominalNoteSpacing);
    if ([0, 2, 3].includes(Number(settings.stradellaMinimumNominalGap)))
      setStradellaMinimumNominalGap(Number(settings.stradellaMinimumNominalGap) as MinimumNominalGap);
    if (typeof settings.buttonSize === "number")
      setButtonSize(Math.max(14, Math.min(44, Math.round(settings.buttonSize))));
    if (typeof settings.buttonSpacing === "number")
      setSpacing(Math.max(1.4, Math.min(3.6, settings.buttonSpacing)));
    if (typeof settings.trebleAngle === "number")
      setTrebleAngle(Math.max(-45, Math.min(45, Math.round(settings.trebleAngle))));
    if (typeof settings.buttonStrokeWidth === "number")
      setButtonStrokeWidth(Math.max(0, Math.min(8, settings.buttonStrokeWidth)));
    if (typeof settings.referenceStrokeWidth === "number")
      setReferenceStrokeWidth(Math.max(0, Math.min(12, settings.referenceStrokeWidth)));
    if (typeof settings.chordFillStrength === "number")
      setChordFillStrength(Math.max(0, Math.min(100, Math.round(settings.chordFillStrength))));
    if (isOneOf(settings.accidentalStyle, ["dark", "grey", "outline", "theme"] as const))
      setAccidentalStyle(settings.accidentalStyle);
    if (typeof settings.labelFontSize === "number")
      setLabelFontSize(Math.max(8, Math.min(24, Math.round(settings.labelFontSize))));
    if (isOneOf(settings.titleFont, ["system", "serif", "mono", "rounded"] as const))
      setTitleFont(settings.titleFont);
    if (typeof settings.titleSize === "number")
      setTitleSize(Math.max(12, Math.min(48, Math.round(settings.titleSize))));
    if (isOneOf(settings.labelFont, ["system", "serif", "mono", "rounded"] as const))
      setLabelFont(settings.labelFont);
    if (isOneOf(settings.sequenceDisplayMode, SEQUENCE_DISPLAY_MODE_VALUES))
      setSequenceDisplayMode(settings.sequenceDisplayMode);
    if (isOneOf(settings.sequenceColorPreset, ["red", "blue", "black", "grey", "theme"] as const))
      setSequenceColorPreset(settings.sequenceColorPreset);
    if (typeof settings.sequenceThickness === "number")
      setSequenceThickness(Math.max(1, Math.min(10, settings.sequenceThickness)));
    if (typeof settings.sequenceArrowheadSize === "number")
      setSequenceArrowheadSize(Math.max(1, Math.min(12, settings.sequenceArrowheadSize)));
    if (typeof settings.sequenceNumberFontSize === "number")
      setSequenceNumberFontSize(Math.max(6, Math.min(24, Math.round(settings.sequenceNumberFontSize))));
    if (isOneOf(settings.sequenceNumberColorPreset, ["red", "blue", "black", "grey", "theme"] as const))
      setSequenceNumberColorPreset(settings.sequenceNumberColorPreset);
    if (isOneOf(settings.sequenceNumberPosition, ["above", "inside-top", "inside-bottom", "none"] as const))
      setSequenceNumberPosition(settings.sequenceNumberPosition);
    if (isOneOf(settings.fingeringPosition, ["above", "inside-top", "inside-bottom", "none"] as const))
      setFingeringPosition(settings.fingeringPosition);
    if (typeof settings.scaleFinderRoot === "string") setScaleFinderRoot(settings.scaleFinderRoot);
    if (isOneOf(settings.scaleFinderPattern, ["major-scale", "natural-minor-scale", "harmonic-minor-scale", "major-pentatonic-scale", "minor-pentatonic-scale", "major-blues-scale", "minor-blues-scale", "chromatic-scale"] as const))
      setScaleFinderPattern(settings.scaleFinderPattern);
    if ([3, 4, 5].includes(Number(settings.scaleFinderRowLimit)))
      setScaleFinderRowLimit(Number(settings.scaleFinderRowLimit) as 3 | 4 | 5);
    if (typeof settings.chordFinderRoot === "string") setChordFinderRoot(settings.chordFinderRoot);
    if (isOneOf(settings.chordFinderPattern, ["major-triad", "minor-triad", "augmented-triad", "diminished-triad", "sus2", "sus4", "dominant7sus4", "majorAdd9", "minorAdd9", "major6add9", "minor6add9", "dominant7sharp5", "dominant7sharp9", "major7sharp11", "dominant7", "major6", "minor6", "dominant7b5", "dominant7b9", "dominant9", "dominant9sus4", "dominant11", "major11", "minor11", "dominant13", "major13", "minor13", "major7", "major9", "major7add9", "minor7", "minorMajor7", "minor7b5", "minor9", "minorMajor9", "diminished7"] as const))
      setChordFinderPattern(settings.chordFinderPattern);
    if (isOneOf(settings.chordFinderInversion, ["root", "first", "second", "third"] as const))
      setChordFinderInversion(settings.chordFinderInversion);
    if ([3, 4, 5].includes(Number(settings.chordFinderOctave)))
      setChordFinderOctave(Number(settings.chordFinderOctave) as FinderChordOctave);
    if (typeof settings.bassPatternRoot === "string") setBassPatternRoot(settings.bassPatternRoot);
    if (typeof settings.annotationTextSize === "number")
      setTextNoteFontSize(Math.max(8, Math.min(36, Math.round(settings.annotationTextSize))));
    if (typeof settings.annotationTextColor === "string") setTextNoteColor(settings.annotationTextColor);
    if (isOneOf(settings.annotationFont, ["system", "serif", "mono", "rounded"] as const))
      setTextNoteFont(settings.annotationFont);
    if (typeof settings.annotationBold === "boolean") setAnnotationBold(settings.annotationBold);
    if (typeof settings.annotationItalic === "boolean") setAnnotationItalic(settings.annotationItalic);
    if (typeof settings.annotationOffsetPercent === "number")
      setAnnotationOffsetPercent(Math.max(0, Math.min(100, Math.round(settings.annotationOffsetPercent))));
    if (isOneOf(settings.annotationButtonAnchor, ["center", "top", "bottom", "left", "right", "topLeft", "topRight", "bottomLeft", "bottomRight"] as const))
      setAnnotationButtonAnchor(settings.annotationButtonAnchor);
    if (typeof settings.soundVolume === "number")
      setSoundVolume(Math.max(0, Math.min(1, settings.soundVolume)));
    if (isOneOf(settings.soundSource, ["synth", "la-melodiosa"] as const))
      setSoundSource(settings.soundSource);
    if (isOneOf(settings.laMelodiosaTrebleRegister, ["I", "II", "III"] as const))
      setLaMelodiosaTrebleRegister(settings.laMelodiosaTrebleRegister);
    if (isOneOf(settings.laMelodiosaBassRegister, ["I", "II", "III"] as const))
      setLaMelodiosaBassRegister(settings.laMelodiosaBassRegister);
    if (typeof settings.laMelodiosaFollowStradellaRegisters === "boolean")
      setLaMelodiosaFollowStradellaRegisters(settings.laMelodiosaFollowStradellaRegisters);
    if (isOneOf(settings.soundVoicePreset, ["single", "soft-reed", "bright-reed", "musette", "organ", "bass-reed"] as const))
      setSoundVoicePreset(settings.soundVoicePreset);
    if (isOneOf(settings.soundWaveform, ["sine", "triangle", "square", "sawtooth"] as const))
      setSoundWaveform(settings.soundWaveform);
    if (typeof settings.soundMusetteDetuneCents === "number")
      setSoundMusetteDetuneCents(Math.max(0, Math.min(30, Math.round(settings.soundMusetteDetuneCents))));
    if (typeof settings.soundAttackMs === "number")
      setSoundAttackMs(Math.max(0, Math.min(300, Math.round(settings.soundAttackMs))));
    if (typeof settings.soundReleaseMs === "number")
      setSoundReleaseMs(Math.max(10, Math.min(1000, Math.round(settings.soundReleaseMs))));
    if (typeof settings.soundNoteDurationMs === "number")
      setSoundNoteDurationMs(Math.max(60, Math.min(2000, Math.round(settings.soundNoteDurationMs))));
    if (typeof settings.harmonyShowEnharmonics === "boolean")
      setHarmonyShowEnharmonics(settings.harmonyShowEnharmonics);
    if (typeof settings.harmonyShowSeparators === "boolean")
      setHarmonyShowSeparators(settings.harmonyShowSeparators);
    if (typeof settings.harmonyShowLegend === "boolean")
      setHarmonyShowLegend(settings.harmonyShowLegend);
    if (typeof settings.harmonyShowExplanation === "boolean")
      setHarmonyShowExplanation(settings.harmonyShowExplanation);
    if (settings.harmonyRingVisibility && typeof settings.harmonyRingVisibility === "object") {
      const next: Record<number, boolean> = { ...DEFAULT_RING_VISIBILITY };
      for (const [key, value] of Object.entries(settings.harmonyRingVisibility)) {
        const count = Number(key);
        if (Number.isInteger(count) && typeof value === "boolean") next[count] = value;
      }
      setHarmonyRingVisibility(next);
    }
    if (typeof settings.harmonyShowToneTooltips === "boolean")
      setHarmonyShowToneTooltips(settings.harmonyShowToneTooltips);
    if (typeof settings.harmonyShowNoteRing === "boolean")
      setHarmonyShowNoteRing(settings.harmonyShowNoteRing);
    if (typeof settings.harmonyColorByFamily === "boolean")
      setHarmonyColorByFamily(settings.harmonyColorByFamily);
    if (typeof settings.harmonyDiameter === "number")
      setHarmonyDiameter(Math.max(600, Math.min(1400, Math.round(settings.harmonyDiameter))));
    if (typeof settings.harmonyFontSize === "number")
      setHarmonyFontSize(Math.max(10, Math.min(30, Math.round(settings.harmonyFontSize))));
    if (isOneOf(settings.harmonyPlaybackStyle, ["block", "arpeggio"] as const))
      setHarmonyPlaybackStyle(settings.harmonyPlaybackStyle);
    if (isOneOf(settings.harmonyVoicingStyle, ["root", "smooth"] as const))
      setHarmonyVoicingStyle(settings.harmonyVoicingStyle);
    if (typeof settings.progressionAllowApproximations === "boolean")
      setHarmonyProgressionAllowApproximations(settings.progressionAllowApproximations);
    if (typeof settings.progressionHandMovementWeight === "number")
      setHarmonyProgressionHandMovementWeight(Math.max(0, Math.min(1, settings.progressionHandMovementWeight)));
    if (isOneOf(settings.progressionRhythmPattern, ["block", "oom-pah", "waltz", "march"] as const))
      setHarmonyProgressionRhythmPattern(settings.progressionRhythmPattern);
  }

  /** Applies a settings JSON object without changing the editable default-settings.json file. */
  function applyImportedSettings(settings: DefaultSettingsFile) {
    if (!settings || typeof settings !== "object") return;

    if (isInterfaceLanguagePreference(settings.language)) changeLanguage(settings.language);
    if (isOneOf(settings.side, ["stradella", "treble"] as const))
      setSide(settings.side);
    if (
      isOneOf(settings.notation, [
        "english",
        "german",
        "solfege",
        "intervals",
        "blank",
      ] as const)
    )
      setNotation(settings.notation);
    if (isOneOf(settings.accidental, ["natural", "flats", "sharps", "enharmonic"] as const))
      setAccidental(settings.accidental);
    if (isOneOf(settings.chordDisplayStyle, ["compact", "letter", "words"] as const)) {
      setChordDisplayStyle(settings.chordDisplayStyle);
    }
    const importedChordLabelMode = (settings as { chordLabelMode?: unknown }).chordLabelMode;
    if (importedChordLabelMode === "roman" || importedChordLabelMode === "tonal-function") {
      setChordLabelMode("functional-reference");
    } else if (
      isOneOf(importedChordLabelMode, [
        "none",
        "chord-name",
        "root-only",
        "chord-tones",
        "row-function",
        "functional-reference",
      ] as const)
    )
      setChordLabelMode(importedChordLabelMode);
    if (
      isOneOf(settings.basses, [
        "8",
        "12",
        "24",
        "32",
        "40",
        "48-8x6",
        "48-12x4",
        "60",
        "72",
        "80",
        "96",
        "100",
        "120",
      ] as const)
    )
      setBasses(settings.basses);
    if (
      isOneOf(settings.trebleLayout, ["c-system", "b-system", "piano"] as const)
    )
      setTrebleLayout(settings.trebleLayout);
    if ([3, 4, 5].includes(Number(settings.trebleRows)))
      setTrebleRows(Number(settings.trebleRows) as 3 | 4 | 5);
    if (isOneOf(settings.trebleSize, ["one-octave", "two-octave", "small", "full", "large"] as const))
      setTrebleSize(settings.trebleSize);
    if (
      isOneOf(settings.pianoTrebleRange, [
        "two-octave",
        "three-octave",
        "four-octave",
      ] as const)
    )
      setPianoTrebleRange(settings.pianoTrebleRange);
    if (typeof settings.showTrebleOctaves === "boolean")
      setShowTrebleOctaves(settings.showTrebleOctaves);
    if (typeof settings.diagramVerticalSpacing === "number")
      setDiagramVerticalSpacing(
        Math.max(0, Math.min(80, settings.diagramVerticalSpacing)),
      );
    if (typeof settings.pianoKeyWidthScale === "number")
      setPianoKeyWidthScale(
        Math.max(0.75, Math.min(1.45, settings.pianoKeyWidthScale)),
      );
    if (typeof settings.pianoKeyHeightScale === "number")
      setPianoKeyHeightScale(
        Math.max(0.75, Math.min(1.8, settings.pianoKeyHeightScale)),
      );
    if (typeof settings.pianoBlackKeyWidthScale === "number")
      setPianoBlackKeyWidthScale(
        Math.max(0.75, Math.min(1.35, settings.pianoBlackKeyWidthScale)),
      );
    if (typeof settings.pianoBlackKeyHeightScale === "number")
      setPianoBlackKeyHeightScale(
        Math.max(0.75, Math.min(1.5, settings.pianoBlackKeyHeightScale)),
      );
    if (typeof settings.diagramScale === "number")
      setDiagramScale(Math.max(70, Math.min(140, settings.diagramScale)));
    if (isOneOf(settings.interfaceDensity, ["compact", "comfortable"] as const))
      setInterfaceDensity(settings.interfaceDensity);
    if (typeof settings.showStatusBar === "boolean")
      setShowStatusBar(settings.showStatusBar);
    if (isOneOf(settings.scaleFinderDisplayMode, SEQUENCE_DISPLAY_MODE_VALUES))
      setScaleFinderDisplayMode(settings.scaleFinderDisplayMode);
    if (
      isOneOf(settings.colorTheme, [
        "default",
        "classic",
        "pastel",
        "print",
        "warm",
        "contrast",
      ] as const)
    )
      setColorTheme(settings.colorTheme);
    if (isOneOf(settings.titleMode, ["auto", "contextual", "custom", "none"] as const))
      setTitleMode(settings.titleMode);
    if (typeof settings.customTitle === "string")
      setCustomTitle(settings.customTitle);
    if (typeof settings.showButtonLabels === "boolean")
      setShowButtonLabels(settings.showButtonLabels);
    if (typeof settings.showBellowsGuide === "boolean")
      setShowBellowsGuide(settings.showBellowsGuide);
    if (typeof settings.showStradellaRowLabels === "boolean")
      setShowStradellaRowLabels(settings.showStradellaRowLabels);
    if (typeof settings.selectionOnClick === "boolean")
      setSelectionOnClick(settings.selectionOnClick);
    if (isOneOf(settings.downloadFormat, ["svg", "png"] as const))
      setDownloadFormat(settings.downloadFormat);
    if (typeof settings.soundEnabled === "boolean")
      setSoundEnabled(settings.soundEnabled);
    if (
      isOneOf(settings.stradellaBassVoicing, [
        "single-low",
        "low-and-middle",
        "single-middle",
      ] as const)
    )
      setStradellaBassVoicing(settings.stradellaBassVoicing);
    if (settings.stradellaNoteLevels) setStradellaNoteLevels(normalizeStradellaNoteLevels(settings.stradellaNoteLevels));
    if ([1, 2, 3, 4].includes(Number(settings.stradellaBassRegisterOctave)))
      setStradellaBassRegisterOctave(Number(settings.stradellaBassRegisterOctave));
    if (isOneOf(settings.stradellaBassRegisterGrouping, ["C-B", "F-E"] as const))
      setStradellaBassRegisterGrouping(settings.stradellaBassRegisterGrouping);
    if ([2, 3, 4, 5].includes(Number(settings.stradellaChordRegisterOctave)))
      setStradellaChordRegisterOctave(Number(settings.stradellaChordRegisterOctave));
    if (isOneOf(settings.stradellaChordRegisterGrouping, ["C-B", "F-E"] as const))
      setStradellaChordRegisterGrouping(settings.stradellaChordRegisterGrouping);
    if (
      isOneOf(settings.stradellaChordFinderMode, [
        "bass-only",
        "chord-buttons-only",
        "bass-and-chords",
      ] as const)
    )
      setStradellaChordFinderMode(settings.stradellaChordFinderMode);
    if ([0, 2, 3].includes(Number(settings.stradellaMinimumNominalGap)))
      setStradellaMinimumNominalGap(Number(settings.stradellaMinimumNominalGap) as MinimumNominalGap);
    if (typeof settings.stradellaChordFinderMarkRootBass === "boolean")
      setStradellaChordFinderMarkRootBass(
        settings.stradellaChordFinderMarkRootBass,
      );
    if (
      isOneOf(settings.abcStradellaMode, [
        "bass-notes-only",
        "chord-symbols-only",
        "bass-notes-and-chord-symbols",
      ] as const)
    )
      setAbcStradellaMode(settings.abcStradellaMode);
    if (
      isOneOf(settings.abcTrebleChordSymbolsMode, ["ignore", "play"] as const)
    )
      setAbcTrebleChordSymbolsMode(settings.abcTrebleChordSymbolsMode);
    if (isOneOf(settings.bassPatternChordVoicing, ["simple", "full"] as const))
      setBassPatternChordVoicing(settings.bassPatternChordVoicing);
    const savedRepeatsPerChord =
      typeof settings.bassPatternRepeatsPerChord === "number"
        ? settings.bassPatternRepeatsPerChord
        : settings.bassPatternBarsPerChord;
    if (typeof savedRepeatsPerChord === "number")
      setBassPatternBarsPerChord(
        Math.max(1, Math.min(8, Math.round(savedRepeatsPerChord))),
      );
    if (typeof settings.bassPatternTempoBpm === "number")
      setBassPatternTempoBpm(
        Math.max(50, Math.min(220, Math.round(settings.bassPatternTempoBpm))),
      );
    if (
      isOneOf(settings.bassPatternLoopMode, [
        "once",
        "fixed",
        "infinite",
      ] as const)
    )
      setBassPatternLoopMode(settings.bassPatternLoopMode);
    if (typeof settings.bassPatternLoopCount === "number")
      setBassPatternLoopCount(
        Math.max(1, Math.min(64, Math.round(settings.bassPatternLoopCount))),
      );
    if (typeof settings.abcTempoBpm === "number")
      setAbcTempoBpm(
        Math.max(30, Math.min(220, Math.round(settings.abcTempoBpm))),
      );
    if (typeof settings.soundSequenceTempoBpm === "number")
      setSoundSequenceTempoBpm(
        Math.max(30, Math.min(220, Math.round(settings.soundSequenceTempoBpm))),
      );
    if (typeof settings.musicNotationIncludeTitle === "boolean")
      setMusicNotationIncludeTitle(settings.musicNotationIncludeTitle);
    if (typeof settings.musicNotationIncludeDescription === "boolean")
      setMusicNotationIncludeDescription(
        settings.musicNotationIncludeDescription,
      );
    if (typeof settings.musicNotationIncludeSummary === "boolean")
      setMusicNotationIncludeSummary(settings.musicNotationIncludeSummary);
    if (typeof settings.musicNotationUseBarsPerLine === "boolean")
      setMusicNotationUseBarsPerLine(settings.musicNotationUseBarsPerLine);
    if (typeof settings.musicNotationBarsPerLine === "number")
      setMusicNotationBarsPerLine(
        Math.max(1, Math.min(8, Math.round(settings.musicNotationBarsPerLine))),
      );
    if (typeof settings.musicNotationChordFontSize === "number")
      setMusicNotationChordFontSize(
        Math.max(
          8,
          Math.min(24, Math.round(settings.musicNotationChordFontSize)),
        ),
      );
    if (typeof settings.musicNotationScale === "number")
      setMusicNotationScale(
        Math.max(40, Math.min(100, Math.round(settings.musicNotationScale))),
      );
    if (typeof settings.musicNotationStaffWidth === "number")
      setMusicNotationStaffWidth(
        Math.max(
          320,
          Math.min(900, Math.round(settings.musicNotationStaffWidth)),
        ),
      );
    if (typeof settings.musicNotationStaffSeparator === "number")
      setMusicNotationStaffSeparator(
        Math.max(
          8,
          Math.min(32, Math.round(settings.musicNotationStaffSeparator)),
        ),
      );
    applyExtendedDefaultSettings(settings);
  }

  /** Collects the current persistent settings in the same shape as public/default-settings.json. */
  function collectCurrentSettings(): DefaultSettingsFile {
    return {
      language: languagePreference,
      side,
      notation,
      accidental,
      chordLabelMode,
      chordDisplayStyle,
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
      stradellaBassRegisterOctave,
      stradellaBassRegisterGrouping,
      stradellaChordRegisterOctave,
      stradellaChordRegisterGrouping,
      stradellaChordFinderMarkRootBass,
      stradellaChordFinderMode,
      stradellaNoteLevels,
      stradellaShowNominalNoteSpacing: showStradellaVoicingIntervals,
      stradellaMinimumNominalGap,
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
      bassPatternRepeatsPerChord: bassPatternBarsPerChord,
      bassPatternTempoBpm,
      bassPatternLoopMode,
      bassPatternLoopCount,
      abcTempoBpm,
      soundSequenceTempoBpm,
      musicNotationIncludeTitle,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationUseBarsPerLine,
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationScale,
      musicNotationStaffWidth,
      musicNotationStaffSeparator,
      buttonSize,
      buttonSpacing: spacing,
      trebleAngle,
      buttonStrokeWidth,
      referenceStrokeWidth,
      chordFillStrength,
      accidentalStyle,
      labelFontSize,
      titleFont,
      titleSize,
      labelFont,
      sequenceDisplayMode,
      sequenceColorPreset,
      sequenceThickness,
      sequenceArrowheadSize,
      sequenceNumberFontSize,
      sequenceNumberColorPreset,
      sequenceNumberPosition,
      fingeringPosition,
      scaleFinderRoot,
      scaleFinderPattern,
      scaleFinderRowLimit,
      chordFinderRoot,
      chordFinderPattern,
      chordFinderInversion,
      chordFinderOctave,
      bassPatternRoot,
      annotationTextSize: textNoteFontSize,
      annotationTextColor: textNoteColor,
      annotationFont: textNoteFont,
      annotationBold,
      annotationItalic,
      annotationOffsetPercent,
      annotationButtonAnchor,
      soundVolume,
      soundSource,
      laMelodiosaTrebleRegister,
      laMelodiosaBassRegister,
      laMelodiosaFollowStradellaRegisters,
      soundVoicePreset,
      soundWaveform,
      soundMusetteDetuneCents,
      soundAttackMs,
      soundReleaseMs,
      soundNoteDurationMs,
      harmonyShowEnharmonics,
      harmonyShowSeparators,
      harmonyShowLegend,
      harmonyShowExplanation,
      harmonyRingVisibility: Object.fromEntries(
        Object.entries(harmonyRingVisibility).map(([key, value]) => [String(key), value]),
      ) as Record<string, boolean>,
      harmonyShowToneTooltips,
      harmonyShowNoteRing,
      harmonyColorByFamily,
      harmonyDiameter,
      harmonyFontSize,
      harmonyPlaybackStyle,
      harmonyVoicingStyle,
      progressionAllowApproximations: harmonyProgressionAllowApproximations,
      progressionHandMovementWeight: harmonyProgressionHandMovementWeight,
      progressionRhythmPattern: harmonyProgressionRhythmPattern,
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
      window.alert(
        t("ui.invalidSettingsFile"),
      );
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
  const stradellaAccidental = accidental === "enharmonic" ? "natural" : accidental;

  /* Generated button list for the current side and layout settings. */
  const buttons = useMemo(() => {
    if (side === "stradella") {
      return generateStradella(
        basses,
        buttonSize,
        spacing,
        stradellaAccidental,
        diagramVerticalSpacing,
      );
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

    const system = trebleLayout === "piano" ? "c-system" : trebleLayout;
    const compact = trebleSize === "one-octave" || trebleSize === "two-octave";
    if (!compact) {
      return generateTreble(system, trebleRows, trebleSize, buttonSize,
        spacing, trebleAngle, showTrebleOctaves, diagramVerticalSpacing);
    }
    // Use full geometry to locate the complete selection. Then choose the
    // smallest available preset containing all selected buttons.
    const reference = generateTreble(system, trebleRows, "large", buttonSize,
      spacing, trebleAngle, showTrebleOctaves, diagramVerticalSpacing);
    const requested = chordFinderActive
      ? getChordFinderTrebleButtons(reference, chordFinderRoot, chordFinderPattern, chordFinderInversion, chordFinderOctave, trebleChordVoicingMode)
      : scaleFinderActive
        ? getScaleFinderTrebleButtons(reference, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit)
        : [];
    const markedIds = new Set([
      ...Object.entries(overlays).filter(([, overlay]) => overlay.selected || overlay.finger).map(([id]) => id),
      ...sequenceSteps.map((step) => step.id),
    ]);
    const marked = reference.filter((button) => markedIds.has(button.id));
    const wanted = [...requested, ...marked].map((button) => button.column);
    const low = Math.min(...wanted);
    const high = Math.max(...wanted);
    const presetWidths: Array<[TrebleSizePreset, number]> = [
      ["one-octave", 5], ["two-octave", 9], ["small", 14], ["full", 18], ["large", 24],
    ];
    const minimum = trebleSize === "one-octave" ? 0 : 1;
    const selected = presetWidths.slice(minimum).find(([, width]) => !wanted.length || high - low < width)
      ?? presetWidths[presetWidths.length - 1];
    const [effectivePreset, width] = selected;
    const start = wanted.length
      ? Math.max(0, Math.min(24 - width, Math.round((low + high - width + 1) / 2)))
      : 0;
    return generateTreble(system, trebleRows, effectivePreset, buttonSize,
      spacing, trebleAngle, showTrebleOctaves, diagramVerticalSpacing, start);
  }, [
    side,
    basses,
    trebleLayout,
    trebleRows,
    trebleSize,
    chordFinderActive, chordFinderRoot, chordFinderPattern, chordFinderInversion, chordFinderOctave, trebleChordVoicingMode,
    scaleFinderActive, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit,
    overlays, sequenceSteps,
    pianoTrebleRange,
    buttonSize,
    spacing,
    diagramVerticalSpacing,
    pianoKeyWidthScale,
    pianoKeyHeightScale,
    pianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale,
    trebleAngle,
    stradellaAccidental,
    showTrebleOctaves,
  ]);

  /* Harmony progression optimization always targets the Stradella manual, even
     while the Harmony workspace is visible or the treble side was last active. */
  const harmonyProgressionStradellaButtons = useMemo(
    () => generateStradella(
      basses,
      buttonSize,
      spacing,
      stradellaAccidental,
      diagramVerticalSpacing,
    ),
    [basses, buttonSize, spacing, stradellaAccidental, diagramVerticalSpacing],
  );

  const harmonyProgressionPlan = useMemo(
    () => optimizeStradellaProgression(
      harmonyProgressionStradellaButtons,
      harmonyProgression,
      {
        allowApproximations: harmonyProgressionAllowApproximations,
        handMovementWeight: harmonyProgressionHandMovementWeight,
        maxRealizationsPerChord: 5,
      },
    ),
    [
      harmonyProgressionStradellaButtons,
      harmonyProgression,
      harmonyProgressionAllowApproximations,
      harmonyProgressionHandMovementWeight,
    ],
  );

  useEffect(() => {
    if (!harmonyProgressionPlan.playable) {
      setHarmonyProgressionPreviewIndex(null);
      return;
    }
    setHarmonyProgressionPreviewIndex((current) =>
      current !== null && current >= harmonyProgressionPlan.steps.length ? null : current,
    );
  }, [harmonyProgressionPlan.playable, harmonyProgressionPlan.steps.length]);

  /* Signature of layout-changing options used to clear stale tool markings. */
  const layoutSignature = [
    side,
    basses,
    trebleLayout,
    trebleRows,
    trebleSize,
    // Chord/scale selections and diagram markings do not change the physical
    // keyboard configuration. Including them here would clear the finder as
    // soon as the user selects a chord or scale (notably in compact layouts).
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
      setScaleFinderActive(false);
      setChordFinderActive(false);
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
        targetNames: [],
        missingPitches: [],
        missingNames: [],
        found: false,
      };
    }

    return getStradellaScaleFinderResult(
      buttons,
      scaleFinderRoot,
      scaleFinderPattern,
    );
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
      trebleChordVoicingMode,
    );
  }, [
    buttons,
    chordFinderActive,
    chordFinderRoot,
    chordFinderPattern,
    chordFinderOctave,
    chordFinderInversion,
    trebleChordVoicingMode,
    side,
  ]);

  const abcParseResult = useMemo(() => parseAbc(abcText), [abcText]);

  useEffect(() => {
    if (abcPlaybackState !== "playing") {
      setAbcTempoBpm(abcParseResult.tempoBpm);
    }
  }, [abcParseResult.tempoBpm, abcPlaybackState]);

  const abcPlayableEvents = useMemo(() => {
    if (!abcText.trim()) return [];
    if (side === "stradella") {
      return abcEventsForStradellaSide(abcParseResult.events);
    }
    if (isTrebleLikeSide) {
      return abcEventsForTrebleSide(abcParseResult.events);
    }
    return [];
  }, [abcParseResult.events, abcText, isTrebleLikeSide, side]);

  const abcMappedEvents = useMemo<MappedAbcEvent[]>(() => {
    if (abcPlayableEvents.length === 0) return [];
    if (side === "stradella") {
      return mapAbcEventsToStradellaButtons(
        buttons,
        abcPlayableEvents,
        abcParseResult.keyTonicPitchClass,
        abcStradellaMode,
      );
    }
    if (isTrebleLikeSide) {
      return mapAbcEventsToTrebleButtons(
        buttons,
        abcPlayableEvents,
        abcTrebleChordSymbolsMode === "play",
      );
    }
    return [];
  }, [
    abcPlayableEvents,
    abcParseResult.keyTonicPitchClass,
    abcStradellaMode,
    abcTrebleChordSymbolsMode,
    buttons,
    isTrebleLikeSide,
    side,
  ]);

  const abcTotalBeats = useMemo(
    () => totalAbcBeats(abcPlayableEvents),
    [abcPlayableEvents],
  );
  const abcMissingPitchText = useMemo(
    () => abcMissingNotes(abcMappedEvents).join(", "),
    [abcMappedEvents],
  );

  const selectedBassPattern = useMemo(
    () =>
      bassPatternDefinitions.find((pattern) => pattern.id === bassPatternId) ??
      bassPatternDefinitions[0],
    [bassPatternDefinitions, bassPatternId],
  );
  const selectedChordProgression = useMemo(
    () =>
      chordProgressionDefinitions.find(
        (progression) => progression.id === chordProgressionId,
      ) ?? chordProgressionDefinitions[0],
    [chordProgressionDefinitions, chordProgressionId],
  );
  const bassPatternEvents = useMemo<BassPatternPlaybackEvent[]>(() => {
    if (
      side !== "stradella" ||
      !selectedBassPattern ||
      !selectedChordProgression
    )
      return [];
    return makeBassPatternEvents(
      buttons,
      selectedBassPattern,
      selectedChordProgression,
      bassPatternRoot,
      bassPatternChordVoicing,
      bassPatternBarsPerChord,
    );
  }, [
    bassPatternBarsPerChord,
    bassPatternChordVoicing,
    bassPatternRoot,
    buttons,
    selectedBassPattern,
    selectedChordProgression,
    side,
  ]);
  const bassPatternTotalBeats = useMemo(
    () => totalBassPatternBeats(bassPatternEvents),
    [bassPatternEvents],
  );
  const bassPatternMissingText = useMemo(
    () => bassPatternMissingItems(bassPatternEvents).join(", "),
    [bassPatternEvents],
  );
  const musicNotationAbcOptions: StradellaNotationAbcOptions = useMemo(
    () => ({
      includeTitle: musicNotationIncludeTitle,
      includeDescription: musicNotationIncludeDescription,
      includeSummary: musicNotationIncludeSummary,
      barsPerLine: musicNotationUseBarsPerLine ? musicNotationBarsPerLine : 999,
      chordFontSize: musicNotationChordFontSize,
      titleFontSize: 14,
      staffSeparator: musicNotationStaffSeparator,
    }),
    [
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationIncludeTitle,
      musicNotationStaffSeparator,
      musicNotationUseBarsPerLine,
    ],
  );

  const bassPatternRenderedNotationAbc = useMemo(() => {
    if (
      !selectedBassPattern ||
      !selectedChordProgression ||
      bassPatternEvents.length === 0
    )
      return "";
    return bassPatternEventsToStradellaNotationAbc(
      selectedBassPattern,
      selectedChordProgression,
      bassPatternEvents,
      bassPatternRoot,
      bassPatternBarsPerChord,
      bassPatternTempoBpm,
      bassPatternLoopMode,
      bassPatternLoopCount,
      musicNotationAbcOptions,
    );
  }, [
    bassPatternBarsPerChord,
    bassPatternEvents,
    bassPatternLoopCount,
    bassPatternLoopMode,
    bassPatternRoot,
    bassPatternTempoBpm,
    musicNotationAbcOptions,
    selectedBassPattern,
    selectedChordProgression,
  ]);

  function renderNotationInto(
    target: HTMLDivElement | null,
    abcSource: string,
  ) {
    if (!target) return;
    target.innerHTML = "";
    if (!abcSource.trim()) return;

    try {
      target.classList.remove("rendered-abc-error");
      renderAbc(target, abcSource, {
        add_classes: true,
        responsive: "resize",
        scale: musicNotationScale / 100,
        paddingleft: 0,
        paddingright: 0,
        paddingtop: 0,
        paddingbottom: 0,
        staffwidth: musicNotationStaffWidth,
      });
    } catch (error) {
      target.classList.add("rendered-abc-error");
      target.textContent =
        error instanceof Error
          ? `Could not render notation: ${error.message}`
          : "Could not render notation.";
    }
  }

  function abcNoteNameForButton(button: DiagramButton) {
    const pitchClass = button.pitchClass ?? button.chordRoot ?? "C";
    const accidentalMap: Record<string, string> = {
      C: "C",
      "C#": "^C",
      Db: "_D",
      D: "D",
      "D#": "^D",
      Eb: "_E",
      E: "E",
      F: "F",
      "F#": "^F",
      Gb: "_G",
      G: "G",
      "G#": "^G",
      Ab: "_A",
      A: "A",
      "A#": "^A",
      Bb: "_B",
      B: "B",
    };
    const baseName = accidentalMap[pitchClass] ?? "C";
    const octave = button.soundOctave ?? button.octave ?? 4;
    if (octave >= 5)
      return baseName.toLowerCase() + "'".repeat(Math.max(0, octave - 5));
    if (octave <= 3) return baseName + ",".repeat(Math.max(0, 4 - octave));
    return baseName;
  }

  function stradellaNotationPitchForButton(
    button: DiagramButton,
    kind: "bass" | "chord",
  ) {
    const pitchClass = button.pitchClass ?? button.chordRoot ?? "C";
    const pitchIndexValue = INDEX_TO_PITCH.indexOf(pitchClass);
    const normalizedPitchClass = pitchIndexValue >= 0 ? pitchClass : "C";
    const normalizedIndex = INDEX_TO_PITCH.indexOf(normalizedPitchClass);
    const accidentalMap: Record<string, string> = {
      C: "C",
      "C#": "^C",
      Db: "_D",
      D: "D",
      "D#": "^D",
      Eb: "_E",
      E: "E",
      F: "F",
      "F#": "^F",
      Gb: "_G",
      G: "G",
      "G#": "^G",
      Ab: "_A",
      A: "A",
      "A#": "^A",
      Bb: "_B",
      B: "B",
    };
    const middleLineD3 = 50;
    const start = kind === "bass" ? middleLineD3 : middleLineD3 + 1;
    const end = kind === "bass" ? 24 : 72;
    const step = kind === "bass" ? -1 : 1;
    for (
      let midi = start;
      kind === "bass" ? midi >= end : midi <= end;
      midi += step
    ) {
      if (((midi % 12) + 12) % 12 === normalizedIndex) {
        const abcBase = accidentalMap[normalizedPitchClass] ?? "C";
        const octave = Math.floor(midi / 12) - 1;
        if (octave <= 3)
          return `${abcBase}${",".repeat(Math.max(0, 4 - octave))}`;
        if (octave === 4) return abcBase;
        return `${abcBase.toLowerCase()}${"'".repeat(Math.max(0, octave - 5))}`;
      }
    }
    return kind === "bass" ? "D," : "F";
  }

  function chordButtonAnnotationForButton(button: DiagramButton) {
    if (button.kind === "chord-minor") return '"^m"';
    if (button.kind === "chord-dominant7") return '"^7"';
    if (button.kind === "chord-diminished7") return '"^d"';
    if (button.kind === "chord-major") return '"^M"';
    return "";
  }

  function stradellaSequenceBassTokenForButton(button: DiagramButton) {
    if (button.kind === "bass-root" || button.kind === "bass-counterbass") {
      return stradellaNotationPitchForButton(button, "bass");
    }
    return "x";
  }

  function stradellaSequenceChordTokenForButton(button: DiagramButton) {
    if (button.kind.startsWith("chord-")) {
      return `${chordButtonAnnotationForButton(button)}${stradellaNotationPitchForButton(button, "chord")}`;
    }
    return "x";
  }

  const sequenceRenderedNotationAbc = useMemo(() => {
    if (sequenceStepsWithButtons.length === 0) return "";

    if (side === "stradella") {
      const bassTokens = sequenceStepsWithButtons.map((step) =>
        stradellaSequenceBassTokenForButton(step.button),
      );
      const chordTokens = sequenceStepsWithButtons.map((step) =>
        stradellaSequenceChordTokenForButton(step.button),
      );
      const bassBars: string[] = [];
      const chordBars: string[] = [];
      for (let index = 0; index < sequenceStepsWithButtons.length; index += 4) {
        const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
        bassBars.push(
          `${lineBreak}| ${bassTokens.slice(index, index + 4).join(" ")} `,
        );
        chordBars.push(
          `${lineBreak}| ${chordTokens.slice(index, index + 4).join(" ")} `,
        );
      }
      return [
        "X:1",
        "%%score (1 2)",
        "%%staffsep 16",
        "M:4/4",
        "L:1/4",
        "K:C clef=bass",
        "V:1 clef=bass stem=down",
        "V:2 clef=bass stem=up",
        `[V:1] ${bassBars.join("")} |`,
        `[V:2] ${chordBars.join("")} |`,
        "",
      ].join("\n");
    }

    const tokens = sequenceStepsWithButtons.map((step) =>
      abcNoteNameForButton(step.button),
    );
    const bars: string[] = [];
    for (let index = 0; index < tokens.length; index += 4) {
      const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
      bars.push(`${lineBreak}| ${tokens.slice(index, index + 4).join(" ")} `);
    }
    return ["X:1", "M:4/4", "L:1/4", "K:C", `${bars.join("")} |`, ""].join(
      "\n",
    );
  }, [sequenceStepsWithButtons, side]);

  useEffect(() => {
    if (!bassPatternRenderedNotationVisible) return;
    renderNotationInto(
      bassPatternNotationRef.current,
      bassPatternRenderedNotationAbc,
    );
  }, [
    bassPatternRenderedNotationAbc,
    bassPatternRenderedNotationVisible,
    musicNotationScale,
    musicNotationStaffWidth,
  ]);

  useEffect(() => {
    if (!abcRenderedNotationVisible) return;
    renderNotationInto(abcNotationRef.current, abcText);
  }, [
    abcRenderedNotationVisible,
    abcText,
    musicNotationScale,
    musicNotationStaffWidth,
  ]);

  useEffect(() => {
    if (!sequenceRenderedNotationVisible) return;
    renderNotationInto(
      sequenceNotationRef.current,
      sequenceRenderedNotationAbc,
    );
  }, [
    sequenceRenderedNotationAbc,
    sequenceRenderedNotationVisible,
    musicNotationScale,
    musicNotationStaffWidth,
  ]);

  const bassPatternRepeatSelection =
    bassPatternLoopMode === "infinite"
      ? "loop"
      : bassPatternLoopMode === "fixed"
        ? String(bassPatternLoopCount)
        : "1";

  function setBassPatternRepeatSelection(value: string) {
    stopBassPatternPlayback();
    if (value === "loop") {
      setBassPatternLoopMode("infinite");
      return;
    }
    const count = Math.max(1, Math.min(64, Math.round(Number(value) || 1)));
    if (count <= 1) {
      setBassPatternLoopMode("once");
      setBassPatternLoopCount(1);
    } else {
      setBassPatternLoopMode("fixed");
      setBassPatternLoopCount(count);
    }
  }

  /* Memoize the full candidate list against the selected physical layout.
     Diagram, recommendation selection, and export must use the same recipe. */
  const stradellaChordFinderRealizations = useMemo(() => {
    if (!stradellaChordFinderActive || side !== "stradella") return [];
    return getStradellaChordFinderResults(
      buttons,
      stradellaChordFinderRoot,
      stradellaChordFinderPattern,
      stradellaChordFinderMode,
      stradellaChordFinderMarkRootBass,
      finderMaxButtons,
      finderSpanColumns,
      stradellaChordFinderRequestedBass,
      stradellaRegisterModel,
      stradellaMinimumNominalGap,
    );
  }, [
    buttons,
    side,
    stradellaChordFinderActive,
    stradellaChordFinderRoot,
    stradellaChordFinderPattern,
    stradellaChordFinderMode,
    stradellaChordFinderMarkRootBass,
    finderMaxButtons,
    finderSpanColumns,
    stradellaChordFinderRequestedBass,
    stradellaRegisterModel,
    stradellaMinimumNominalGap,
  ]);

  const stradellaChordFinderResult = useMemo(() => {
    if (stradellaChordFinderRealizations.length === 0) {
      return getStradellaChordFinderResult([], stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderMode, stradellaChordFinderMarkRootBass, stradellaChordFinderRequestedBass, stradellaRegisterModel);
    }
    return stradellaChordFinderRealizations[Math.min(stradellaChordFinderRealizationIndex, stradellaChordFinderRealizations.length - 1)];
  }, [stradellaChordFinderRealizations, stradellaChordFinderRealizationIndex, stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderMode, stradellaChordFinderMarkRootBass, stradellaChordFinderRequestedBass, stradellaRegisterModel]);

  useEffect(() => {
    setStradellaChordFinderRealizationIndex(0);
  }, [stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderMode, stradellaChordFinderRequestedBass, stradellaRegisterModel, finderMaxButtons, finderSpanColumns, stradellaMinimumNominalGap, side]);

  /* A progression choice must retain its original physical button identities;
     pitch-class-equivalent bass and counterbass positions are not substitutes. */
  useEffect(() => {
    if (!pendingProgressionRealizationKey || stradellaChordFinderRealizations.length === 0) return;
    const index = stradellaChordFinderRealizations.findIndex((result) =>
      result.playbackButtons.map((button) => button.id).sort().join("|") === pendingProgressionRealizationKey,
    );
    if (index >= 0) setStradellaChordFinderRealizationIndex(index);
    setPendingProgressionRealizationKey(null);
  }, [pendingProgressionRealizationKey, stradellaChordFinderRealizations]);

  /* `buttons` includes optional visual guides; `playbackButtons` contains
     only pressed buttons and is authoritative for sound/registral analysis. */
  const stradellaChordFinderButtons = stradellaChordFinderResult.buttons;
  const stradellaChordFinderPlaybackButtons =
    stradellaChordFinderResult.playbackButtons;
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

  const progressionPreviewButtonIds = useMemo(() => {
    if (
      activeToolSection !== "progressionAssistant" ||
      harmonyProgressionPreviewIndex === null ||
      harmonyProgressionActiveButtonIds.length > 0 ||
      !harmonyProgressionPlan.playable
    ) {
      return new Set<string>();
    }
    const step = harmonyProgressionPlan.steps[harmonyProgressionPreviewIndex];
    return new Set((step?.result.playbackButtons ?? []).map((button) => button.id));
  }, [
    activeToolSection,
    harmonyProgressionPreviewIndex,
    harmonyProgressionActiveButtonIds.length,
    harmonyProgressionPlan,
  ]);

  const bassPatternActiveButtonIdSet = useMemo(
    () => new Set(bassPatternActiveButtonIds),
    [bassPatternActiveButtonIds],
  );

  const harmonyProgressionActiveButtonIdSet = useMemo(
    () => new Set(harmonyProgressionActiveButtonIds),
    [harmonyProgressionActiveButtonIds],
  );

  const abcActiveButtonIdSet = useMemo(
    () => new Set(abcActiveButtonIds),
    [abcActiveButtonIds],
  );

  /* Consolidated sound options passed to the Web Audio helper functions. */
  const soundOptions = {
    enabled: soundEnabled,
    volume: soundVolume,
    source: soundSource,
    laMelodiosaTrebleRegister,
    laMelodiosaBassRegister,
    laMelodiosaFollowStradellaRegisters,
    stradellaRegisterModel,
    voicePreset: soundVoicePreset,
    waveform: soundWaveform,
    musetteDetuneCents: soundMusetteDetuneCents,
    attackMs: soundAttackMs,
    releaseMs: soundReleaseMs,
    noteDurationMs: soundNoteDurationMs,
    sequenceTempoBpm: soundSequenceTempoBpm,
    stradellaBassVoicing,
  };

  function abcNameForConcreteNote(pitchClass: string, octave: number) {
    const accidentalMap: Record<string, string> = {
      C: "C", "C#": "^C", Db: "_D", D: "D", "D#": "^D", Eb: "_E",
      E: "E", F: "F", "F#": "^F", Gb: "_G", G: "G", "G#": "^G",
      Ab: "_A", A: "A", "A#": "^A", Bb: "_B", B: "B",
    };
    const base = accidentalMap[pitchClass] ?? "C";
    if (octave >= 5) return base.toLowerCase() + "'".repeat(Math.max(0, octave - 5));
    if (octave <= 3) return base + ",".repeat(Math.max(0, 4 - octave));
    return base;
  }

  function progressionRhythmPulses(step: (typeof harmonyProgressionPlan.steps)[number]) {
    const realizationButtons = step.result.playbackButtons;
    const realizationBassButtons = realizationButtons.filter(
      (button) => button.kind === "bass-root" || button.kind === "bass-counterbass",
    );
    const chordButtons = realizationButtons.filter((button) => button.kind.startsWith("chord-"));
    const preferredBassPulse = progressionBassPulseButtons(buttons, step);
    const bassPulse = preferredBassPulse.length > 0
      ? preferredBassPulse
      : realizationBassButtons.length > 0
        ? realizationBassButtons
        : realizationButtons;
    const chordPulse = chordButtons.length > 0 ? chordButtons : realizationButtons;
    if (harmonyProgressionRhythmPattern === "march") return [bassPulse, chordPulse, chordPulse, chordPulse];
    if (harmonyProgressionRhythmPattern === "waltz") return [bassPulse, chordPulse, chordPulse];
    if (harmonyProgressionRhythmPattern === "oom-pah") return [bassPulse, chordPulse];
    return [realizationButtons];
  }

  const harmonyProgressionRenderedNotationAbc = useMemo(() => {
    if (!harmonyProgressionPlan.playable || harmonyProgressionPlan.steps.length === 0) return "";
    const meter = harmonyProgressionRhythmPattern === "waltz"
      ? "3/4"
      : harmonyProgressionRhythmPattern === "oom-pah"
        ? "2/4"
        : "4/4";
    const bars = harmonyProgressionPlan.steps.map((step) => {
      const pulses = progressionRhythmPulses(step);
      if (harmonyProgressionRhythmPattern === "block") {
        const notes = pulses[0]
          .flatMap((button) => notesForButton(button, soundOptions))
          .map((note) => abcNameForConcreteNote(note.pitchClass, note.octave));
        const unique = [...new Set(notes)];
        return `"${step.label}"[${unique.join("")}]4`;
      }
      const tokens = pulses.map((pulse, index) => {
        const notes = pulse
          .flatMap((button) => notesForButton(button, soundOptions))
          .map((note) => abcNameForConcreteNote(note.pitchClass, note.octave));
        const unique = [...new Set(notes)];
        return `${index === 0 ? `"${step.label}"` : ""}[${unique.join("")}]`;
      });
      return tokens.join(" ");
    });
    return [
      "X:1",
      "T:Optimized Stradella progression",
      `M:${meter}`,
      "L:1/4",
      `Q:1/4=${soundSequenceTempoBpm}`,
      "K:C clef=bass",
      `${bars.map((bar) => `| ${bar} `).join("")} |`,
      "",
    ].join("\n");
  }, [
    harmonyProgressionPlan,
    harmonyProgressionRhythmPattern,
    buttons,
    soundSequenceTempoBpm,
    soundSource,
    laMelodiosaBassRegister,
    laMelodiosaFollowStradellaRegisters,
    stradellaRegisterModel,
    stradellaBassVoicing,
  ]);


  useEffect(() => {
    if (!harmonyProgressionNotationVisible) return;
    renderNotationInto(
      harmonyProgressionNotationRef.current,
      harmonyProgressionRenderedNotationAbc,
    );
  }, [
    harmonyProgressionNotationVisible,
    harmonyProgressionRenderedNotationAbc,
    musicNotationScale,
    musicNotationStaffWidth,
  ]);

  const harmonyRecordedProgressionNotationAbc = useMemo(() => {
    if (harmonyRecordedProgression.length === 0) return "";
    const bars = harmonyRecordedProgression.map((event) => {
      if (event.kind === "note") {
        const pitchClass = pitchClassNameFromNumber(event.pitchClass);
        const note = abcNameForConcreteNote(pitchClass, 4);
        return `"${pitchClass}"${note}4`;
      }
      const notes = harmonyChordMidiNotes(event.rootPc, event.familyId, 4).map((midi) => {
        const pitchClass = pitchClassNameFromNumber(((midi % 12) + 12) % 12);
        const octave = Math.floor(midi / 12) - 1;
        return abcNameForConcreteNote(pitchClass, octave);
      });
      const label = harmonyChordLabel(event.rootPc, event.familyId, event.sectorIndex, harmonyShowEnharmonics);
      return `"${label}"[${notes.join("")}]4`;
    });
    return [
      "X:1",
      "T:Recorded Harmony progression",
      "M:4/4",
      "L:1/4",
      `Q:1/4=${soundSequenceTempoBpm}`,
      "K:C",
      `${bars.map((bar) => `| ${bar} `).join("")} |`,
      "",
    ].join("\n");
  }, [harmonyRecordedProgression, harmonyShowEnharmonics, soundSequenceTempoBpm]);

  useEffect(() => {
    if (!harmonyRecordedNotationVisible || !harmonyRecordedProgressionNotationAbc) return;
    renderNotationInto(
      harmonyRecordedNotationRef.current,
      harmonyRecordedProgressionNotationAbc,
    );
  }, [
    harmonyRecordedNotationVisible,
    harmonyRecordedProgressionNotationAbc,
    musicNotationScale,
    musicNotationStaffWidth,
  ]);

  /* Harmony Explorer derives all diagram data from pitch-class relationships. */
  const harmonyAllFamiliesMode = harmonyRelatedFamilyId === "all";
  const harmonyEffectiveDiatonicOnly = harmonyDiatonicOnly || harmonyAllFamiliesMode;
  const harmonyEffectiveHighlightDiatonic = !harmonyEffectiveDiatonicOnly && harmonyHighlightDiatonic;
  const harmonySectors = useMemo(
    () => buildSectorRelationships(
      harmonyReferenceFamilyId,
      harmonyRelatedFamilyId,
      harmonyScaleId,
      harmonyEffectiveDiatonicOnly,
      true,
    ),
    [harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId, harmonyEffectiveDiatonicOnly],
  );
  const harmonyAvailableCounts = useMemo(
    () => harmonyRelationshipCounts(harmonySectors),
    [harmonySectors],
  );
  const harmonyCounts = useMemo(
    () => filterRelationshipCounts(harmonyAvailableCounts, harmonyRingVisibility),
    [harmonyAvailableCounts, harmonyRingVisibility],
  );
  const harmonyAllSectors = useMemo(
    () => buildSectorRelationships(
      harmonyReferenceFamilyId,
      harmonyRelatedFamilyId,
      harmonyScaleId,
      harmonyAllFamiliesMode,
      true,
    ),
    [harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId, harmonyAllFamiliesMode],
  );
  const harmonyAllCounts = useMemo(
    () => harmonyRelationshipCounts(harmonyAllSectors),
    [harmonyAllSectors],
  );
  const harmonyReferenceFamily = harmonyChordFamily(harmonyReferenceFamilyId);
  const harmonyRelatedName = harmonyRelatedFamilyName(harmonyRelatedFamilyId);
  const harmonyScale = harmonyScaleDefinition(harmonyScaleId);
  const harmonyExplanation = useMemo(
    () => buildDiagramExplanation({
      referenceFamilyName: familyName(harmonyReferenceFamily.id, harmonyReferenceFamily.name, language),
      relatedFamilyName: harmonyRelatedFamilyId === "all" ? t("ui.allDiatonicFamilies") : familyName(harmonyRelatedFamilyId, harmonyRelatedName, language),
      scaleName: scaleName(harmonyScale.id, harmonyScale.name, language),
      diatonicOnly: harmonyEffectiveDiatonicOnly,
      highlightDiatonic: harmonyEffectiveHighlightDiatonic,
      allFamiliesMode: harmonyAllFamiliesMode,
      showNoteRing: harmonyShowNoteRing,
      counts: harmonyCounts,
      availableCounts: harmonyAvailableCounts,
      allCounts: harmonyAllCounts,
      language,
    }),
    [
      harmonyReferenceFamily.name,
      harmonyRelatedName,
      harmonyScale.name,
      harmonyEffectiveDiatonicOnly,
      harmonyEffectiveHighlightDiatonic,
      harmonyAllFamiliesMode,
      harmonyShowNoteRing,
      harmonyCounts,
      harmonyAvailableCounts,
      harmonyAllCounts,
      language,
    ],
  );

  useEffect(() => {
    setHarmonySelection(null);
  }, [harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId, harmonyDiatonicOnly]);

  function harmonyPitchNames(rootPc: number, familyId: ChordFamilyId) {
    return harmonyPitchClassesForChord(rootPc, familyId).map(pitchClassNameFromNumber);
  }

  function playHarmonyChord(rootPc: number, familyId: ChordFamilyId, style: HarmonyPlaybackStyle) {
    playHarmonyPitchClassChord(harmonyPitchNames(rootPc, familyId), soundOptions, style);
  }

  function playHarmonyChordRelationship(
    referenceRootPc: number,
    referenceFamilyId: ChordFamilyId,
    targetRootPc: number,
    targetFamilyId: ChordFamilyId,
    style: HarmonyPlaybackStyle,
  ) {
    playHarmonyRelationship(
      harmonyPitchNames(referenceRootPc, referenceFamilyId),
      harmonyPitchNames(targetRootPc, targetFamilyId),
      soundOptions,
      style,
    );
  }

  function harmonyProgressionSectorIndex(rootPc: number) {
    const index = CIRCLE_OF_FIFTHS.indexOf(rootPc as (typeof CIRCLE_OF_FIFTHS)[number]);
    return index >= 0 ? index : 0;
  }

  function makeHarmonyProgressionChord(
    rootPc: number,
    familyId: ChordFamilyId,
    sectorIndex = harmonyProgressionSectorIndex(rootPc),
  ): HarmonyProgressionChord {
    const id = `harmony-progression-${harmonyProgressionIdRef.current++}`;
    return { id, rootPc, familyId, sectorIndex };
  }

  function playHarmonyNote(pitchClass: number) {
    playHarmonyPitchClassChord([pitchClassNameFromNumber(pitchClass)], soundOptions, "block");
    if (!harmonyProgressionRecording) return;
    setHarmonyRecordedProgression((current) => [
      ...current,
      {
        id: `harmony-note-${harmonyProgressionIdRef.current++}`,
        kind: "note",
        pitchClass,
        sectorIndex: harmonyProgressionSectorIndex(pitchClass),
      },
    ]);
  }

  function handleHarmonyChordActivated(rootPc: number, familyId: ChordFamilyId, sectorIndex: number) {
    if (!harmonyProgressionRecording) return;
    setHarmonyRecordedProgression((current) => [
      ...current,
      makeHarmonyProgressionChord(rootPc, familyId, sectorIndex),
    ]);
  }

  function toggleHarmonyProgressionRecording() {
    setHarmonyProgressionRecording((current) => !current);
  }

  function stopHarmonyRecordedProgressionPlayback() {
    harmonyRecordedPlaybackTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    harmonyRecordedPlaybackTimeoutsRef.current = [];
    setHarmonyRecordedProgressionPlaying(false);
    stopAllSound();
  }

  function playHarmonyRecordedProgression() {
    if (harmonyRecordedProgression.length === 0) return;
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyRecordedProgressionPlaying(true);
    const beatMs = 60000 / Math.max(40, soundSequenceTempoBpm);

    harmonyRecordedProgression.forEach((event, index) => {
      const timeoutId = window.setTimeout(() => {
        if (event.kind === "note") {
          playHarmonyPitchClassChord(
            [pitchClassNameFromNumber(event.pitchClass)],
            soundOptions,
            "block",
          );
        } else {
          playHarmonyPitchClassChord(
            harmonyPitchNames(event.rootPc, event.familyId),
            soundOptions,
            harmonyPlaybackStyle,
          );
        }
      }, index * beatMs);
      harmonyRecordedPlaybackTimeoutsRef.current.push(timeoutId);
    });

    const stopTimeout = window.setTimeout(
      () => stopHarmonyRecordedProgressionPlayback(),
      harmonyRecordedProgression.length * beatMs + Math.min(600, beatMs),
    );
    harmonyRecordedPlaybackTimeoutsRef.current.push(stopTimeout);
  }

  function clearHarmonyRecordedProgression() {
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyRecordedProgression([]);
    setHarmonyRecordedNotationVisible(false);
  }

  function sendHarmonyRecordedProgressionToAssistant() {
    const recordedChords = harmonyRecordedProgression.filter(isHarmonyProgressionChord);
    if (recordedChords.length === 0) return;
    if (recordedChords.length < harmonyRecordedProgression.length) {
      window.alert(t("ui.onlyChordsTransferred"));
    }
    stopHarmonyRecordedProgressionPlayback();
    setHarmonyProgression(recordedChords.map((chord) => ({ ...chord, id: `harmony-progression-${harmonyProgressionIdRef.current++}` })));
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedNotationVisible(false);
    setWorkspaceMode("accordion");
    setSide("stradella");
    setLeftPanelMode("tools");
    setActiveToolSection("progressionAssistant");
    setHarmonyProgressionPreviewIndex(null);
    setStradellaChordFinderActive(false);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    stopAbcPlayback();
    stopBassPatternPlayback();
  }

  function sameHarmonyProgressionChord(a: HarmonyProgressionChord | undefined, b: HarmonyProgressionChord) {
    return !!a && a.rootPc === b.rootPc && a.familyId === b.familyId;
  }

  function addManualHarmonyProgressionChord() {
    const rootPc = pitchClassNumberFromName(harmonyProgressionManualRoot);
    if (rootPc === null) return;
    setHarmonyProgression((current) => [
      ...current,
      makeHarmonyProgressionChord(rootPc, harmonyProgressionManualFamilyId),
    ]);
  }

  function addSelectedHarmonyRelationshipToProgression() {
    if (!harmonySelection) return;
    const reference = makeHarmonyProgressionChord(
      harmonySelection.referenceRootPc,
      harmonySelection.referenceFamilyId,
      harmonySelection.sectorIndex,
    );
    const target = makeHarmonyProgressionChord(
      harmonySelection.candidate.rootPc,
      harmonySelection.candidate.familyId,
      harmonySelection.sectorIndex,
    );
    setHarmonyProgression((current) => {
      const next = [...current];
      if (!sameHarmonyProgressionChord(next[next.length - 1], reference)) next.push(reference);
      if (!sameHarmonyProgressionChord(next[next.length - 1], target)) next.push(target);
      return next;
    });
    setWorkspaceMode("accordion");
    setSide("stradella");
    setLeftPanelMode("tools");
    setActiveToolSection("progressionAssistant");
    setHarmonyProgressionPreviewIndex(null);
    setStradellaChordFinderActive(false);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    stopAbcPlayback();
    stopBassPatternPlayback();
  }

  function removeHarmonyProgressionChord(index: number) {
    setHarmonyProgression((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  }

  function moveHarmonyProgressionChord(index: number, direction: -1 | 1) {
    setHarmonyProgression((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function previewHarmonyProgressionStepOnStradella(index: number) {
    const step = harmonyProgressionPlan.steps[index];
    if (!step) return;
    setHarmonyProgressionPreviewIndex(index);
    setWorkspaceMode("accordion");
    setSide("stradella");
    setLeftPanelMode("tools");
    setActiveToolSection("progressionAssistant");
    setStradellaChordFinderActive(false);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    stopAbcPlayback();
  }

  function openHarmonyProgressionStepInChordFinder(index: number) {
    const step = harmonyProgressionPlan.steps[index];
    if (!step) return;
    const pattern = finderPatternForHarmonyFamily(step.chord.familyId);
    if (!pattern) return;
    const resultKey = step.result.playbackButtons.map((button) => button.id).sort().join("|");
    setPendingProgressionRealizationKey(resultKey);
    setWorkspaceMode("accordion");
    setSide("stradella");
    setLeftPanelMode("tools");
    setActiveToolSection("stradellaChordFinder");
    setStradellaChordFinderRoot(pitchClassNameFromNumber(step.chord.rootPc));
    setStradellaChordFinderRequestedBass(null);
    setStradellaChordFinderPattern(pattern);
    setStradellaChordFinderMode("bass-and-chords");
    setStradellaChordFinderActive(true);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    stopAbcPlayback();
  }

  function playOptimizedHarmonyProgression() {
    if (!harmonyProgressionPlan.playable) return;
    setHarmonyProgressionActiveButtonIds([]);
    playButtonRhythmProgression(
      harmonyProgressionPlan.steps.map((step) => step.result.playbackButtons),
      soundOptions,
      harmonyProgressionRhythmPattern,
      {
        onActiveButtons: (buttonIds, progressionIndex) => {
          setHarmonyProgressionActiveButtonIds(buttonIds);
          setHarmonyProgressionPreviewIndex(progressionIndex);
        },
        onDone: () => setHarmonyProgressionActiveButtonIds([]),
      },
      harmonyProgressionPlan.steps.map((step) =>
        progressionBassPulseButtons(buttons, step),
      ),
    );
  }

  function resetHarmonyExplorer() {
    setHarmonyReferenceFamilyId("major");
    setHarmonyRelatedFamilyId("minor7");
    setHarmonyScaleId("ionian");
    setHarmonyDiatonicOnly(false);
    setHarmonyHighlightDiatonic(true);
    setHarmonyShowEnharmonics(false);
    setHarmonyShowSeparators(true);
    setHarmonyShowLegend(true);
    setHarmonyShowExplanation(false);
    setHarmonyRingVisibility({ ...DEFAULT_RING_VISIBILITY });
    setHarmonyShowToneTooltips(true);
    setHarmonyShowNoteRing(true);
    setHarmonyColorByFamily(false);
    setHarmonyDiameter(900);
    setHarmonyFontSize(18);
    setHarmonyPlaybackStyle("block");
    setHarmonyVoicingStyle("root");
    setHarmonySelection(null);
    setHarmonyFocusedReferenceRootPc(null);
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedProgression([]);
    setHarmonyRecordedNotationVisible(false);
  }

  function showHarmonySelectionOnStradella() {
    if (!harmonySelection) return;
    const pattern = finderPatternForHarmonyFamily(harmonySelection.candidate.familyId);
    if (!pattern) return;
    setWorkspaceMode("accordion");
    setSide("stradella");
    setLeftPanelMode("tools");
    setActiveToolSection("stradellaChordFinder");
    setStradellaChordFinderRoot(pitchClassNameFromNumber(harmonySelection.candidate.rootPc));
    setStradellaChordFinderRequestedBass(null);
    setStradellaChordFinderPattern(pattern);
    setStradellaChordFinderMode("bass-and-chords");
    setStradellaChordFinderRealizationIndex(0);
    setStradellaChordFinderActive(true);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    stopAbcPlayback();
  }

  function exploreCurrentStradellaChordInHarmony() {
    const familyId = harmonyFamilyForFinderPattern(stradellaChordFinderPattern);
    const rootPc = pitchClassNumberFromName(stradellaChordFinderRoot);
    if (!familyId || rootPc === null) return;

    const previousSelectionMatches =
      harmonySelection?.candidate.familyId === familyId &&
      harmonySelection.candidate.rootPc === rootPc;

    if (!previousSelectionMatches) {
      // A chord coming from the Stradella finder belongs in the outer-ring
      // family. Preserve the user's current reference family instead of
      // replacing it with the target chord family.
      setHarmonyRelatedFamilyId(familyId);
      setHarmonySelection(null);
      setHarmonyFocusedReferenceRootPc(null);
    }

    setWorkspaceMode("harmony");
    setLeftPanelMode("tools");
    setActiveToolSection("harmonyExplorer");
    stopAllSound();
    stopAbcPlayback();
    stopBassPatternPlayback();
  }

  useEffect(() => {
    if (soundEnabled && soundSource === "la-melodiosa") {
      void preloadLaMelodiosa(laMelodiosaTrebleRegister, laMelodiosaBassRegister);
    }
  }, [soundEnabled, soundSource, laMelodiosaTrebleRegister, laMelodiosaBassRegister]);

  /** Opens one settings group, or closes it if it is already open. */
  function toggleSettingsSection(section: Exclude<SettingsSection, null>) {
    setActiveSettingsSection((current) =>
      current === section ? null : section,
    );
  }

  /** Opens one tool group, or closes it if it is already open. */
  function toggleToolSection(section: Exclude<ToolSection, null>) {
    if (section === "harmonyExplorer") {
      setWorkspaceMode("harmony");
    } else {
      setWorkspaceMode("accordion");
    }
    if (section === "progressionAssistant") {
      setSide("stradella");
      setStradellaChordFinderActive(false);
      setScaleFinderActive(false);
      setChordFinderActive(false);
      stopAbcPlayback();
      stopBassPatternPlayback();
    }
    setActiveToolSection((current) => (current === section ? null : section));
  }

  /**
   * Handles button clicks.
   *
   * A click can optionally toggle selection, write a fingering label, append a
   * sequence step, and/or trigger sound depending on the active tool settings.
   */
  function toggleButton(button: DiagramButton) {
    if (activeToolSection === "annotateDiagram") {
      beginButtonAnnotation(button);
      return;
    }


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

    if (isApplyingFingering && trimmedFinger) {
      setFingeringDraft("");
    }

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

    setFingeringDraft("");
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

  /** Clears the Chord Finder highlight without changing its selected root or pattern. */

  /** Clears the Stradella Chord Finder highlight without changing its selected options. */

  /** Plays the currently highlighted Stradella Chord Finder result. */
  function playStradellaChordFinder() {
    if (stradellaChordFinderMode === "bass-only") {
      playButtonArpeggioThenChord(
        stradellaChordFinderPlaybackButtons,
        soundOptions,
      );
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
    const example = abcExampleOptions.find(
      (option) => option.value === exampleValue,
    );
    setAbcExampleValue(exampleValue);
    if (!example || !example.file) return;

    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}${example.file}`,
      );
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
    abcPlaybackTimeoutsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
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
    const elapsedBeats =
      startedAt === null
        ? 0
        : ((performance.now() - startedAt) / 1000) * (abcTempoBpm / 60);
    setAbcPositionBeat(Math.min(abcTotalBeats, startBeat + elapsedBeats));
    setAbcPlaybackState("paused");
    setAbcActiveButtonIds([]);
    clearAbcTimers();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
  }

  function scheduleAbcPlayback(startBeat = abcPositionBeat) {
    if (abcMappedEvents.length === 0) return;

    clearAbcTimers();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
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
        event.buttons.forEach((button) =>
          playButtonSound(button, soundOptions),
        );

        const clearTimeoutId = window.setTimeout(
          () => {
            setAbcActiveButtonIds((current) => {
              const eventIds = new Set(
                event.buttons.map((button) => button.id),
              );
              return current.filter((id) => !eventIds.has(id));
            });
          },
          Math.max(80, event.durationBeats * beatMs * 0.85),
        );
        abcPlaybackTimeoutsRef.current.push(clearTimeoutId);
      }, delayMs);
      abcPlaybackTimeoutsRef.current.push(onTimeout);
    });

    const stopTimeout = window.setTimeout(
      () => {
        setAbcPlaybackState("stopped");
        setAbcPositionBeat(0);
        setAbcActiveButtonIds([]);
        abcPlaybackStartedAtRef.current = null;
      },
      Math.max(0, (abcTotalBeats - startBeat) * beatMs) + 120,
    );
    abcPlaybackTimeoutsRef.current.push(stopTimeout);
  }

  function clearBassPatternTimers() {
    bassPatternTimeoutsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    bassPatternTimeoutsRef.current = [];
  }

  function stopBassPatternPlayback() {
    bassPatternPlaybackRunRef.current += 1;
    clearBassPatternTimers();
    setBassPatternPlaybackState("stopped");
    setBassPatternActiveButtonIds([]);
    stopAllSound();
  }

  const bassPatternEditorErrors = useMemo(() => {
    try {
      const candidate = JSON.parse(
        bassPatternEditorText,
      ) as BassPatternDefinition;
      return validateBassPatternLibrary({ version: 2, patterns: [candidate] });
    } catch (error) {
      return [error instanceof Error ? error.message : t("ui.invalidJSON")];
    }
  }, [bassPatternEditorText]);

  function saveCustomBassPattern() {
    try {
      const candidate = JSON.parse(
        bassPatternEditorText,
      ) as BassPatternDefinition;
      const errors = validateBassPatternLibrary({
        version: 2,
        patterns: [candidate],
      });
      if (errors.length > 0) {
        setBassPatternEditorMessage(t("ui.cannotSave", { reason: errors[0] }));
        return;
      }
      const nextPatterns = [
        candidate,
        ...customBassPatternDefinitions.filter(
          (pattern) => pattern.id !== candidate.id,
        ),
      ];
      setCustomBassPatternDefinitions(nextPatterns);
      window.localStorage.setItem(
        "accordionTools.customBassPatterns.v2",
        JSON.stringify(nextPatterns),
      );
      setBassPatternId(candidate.id);
      setBassPatternEditorMessage(t("ui.savedCustomPattern", { name: candidate.name }));
    } catch (error) {
      setBassPatternEditorMessage(
        error instanceof Error ? error.message : t("ui.invalidJSON"),
      );
    }
  }

  function removeSelectedCustomBassPattern() {
    if (
      !customBassPatternDefinitions.some(
        (pattern) => pattern.id === bassPatternId,
      )
    )
      return;
    const nextPatterns = customBassPatternDefinitions.filter(
      (pattern) => pattern.id !== bassPatternId,
    );
    setCustomBassPatternDefinitions(nextPatterns);
    window.localStorage.setItem(
      "accordionTools.customBassPatterns.v2",
      JSON.stringify(nextPatterns),
    );
    setBassPatternId(
      (builtInBassPatternDefinitions[0] ?? nextPatterns[0])?.id ?? "",
    );
    setBassPatternEditorMessage(t("ui.removedCustomPattern"));
  }

  function loadSelectedPatternIntoEditor() {
    if (!selectedBassPattern) return;
    setBassPatternEditorText(JSON.stringify(selectedBassPattern, null, 2));
    setBassPatternEditorMessage(t("ui.loadedPatternIntoEditor"));
  }

  function downloadTextFile(
    filename: string,
    text: string,
    mimeType = "text/plain",
  ) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSelectedBassPatternAbc() {
    if (!selectedBassPattern || !selectedChordProgression) return;
    downloadTextFile(
      `${selectedBassPattern.id || "bass-pattern"}.abc`,
      bassPatternEventsToAbc(
        selectedBassPattern,
        selectedChordProgression,
        bassPatternEvents,
        bassPatternRoot,
        bassPatternBarsPerChord,
        bassPatternTempoBpm,
      ),
      "text/vnd.abc",
    );
  }

  function exportSelectedBassPatternMidi() {
    if (!selectedBassPattern) return;
    const bytes = bassPatternEventsToMidiBytes(
      bassPatternEvents,
      bassPatternTempoBpm,
    );
    const blob = new Blob([bytes], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedBassPattern.id || "bass-pattern"}.mid`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSelectedBassPatternLilyPond() {
    if (!selectedBassPattern || !selectedChordProgression) return;
    downloadTextFile(
      `${selectedBassPattern.id || "bass-pattern"}.ly`,
      bassPatternEventsToLilyPond(
        selectedBassPattern,
        selectedChordProgression,
        bassPatternEvents,
        bassPatternRoot,
        bassPatternBarsPerChord,
        bassPatternTempoBpm,
      ),
      "text/x-lilypond",
    );
  }

  function exportSelectedBassPattern() {
    if (bassPatternExportFormat === "abc") {
      exportSelectedBassPatternAbc();
    } else if (bassPatternExportFormat === "midi") {
      exportSelectedBassPatternMidi();
    } else {
      exportSelectedBassPatternLilyPond();
    }
  }

  function safeFilenamePart(value: string) {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "notation"
    );
  }

  function downloadRenderedNotationSvg(
    target: HTMLDivElement | null,
    filenameBase: string,
  ) {
    const svg = target?.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) return;
    downloadSvg(svg, `${safeFilenamePart(filenameBase)}.svg`);
  }

  function scheduleBassPatternPlayback() {
    if (bassPatternEvents.length === 0) return;

    bassPatternPlaybackRunRef.current += 1;
    const runId = bassPatternPlaybackRunRef.current;
    clearBassPatternTimers();
    stopAbcPlayback();
    setBassPatternActiveButtonIds([]);
    stopAllSound();
    setScaleFinderActive(false);
    setChordFinderActive(false);
    setStradellaChordFinderActive(false);
    setBassPatternPlaybackState("playing");

    const beatMs = 60000 / Math.max(30, bassPatternTempoBpm);
    const cycleBeats = Math.max(0, bassPatternTotalBeats);
    const repeats =
      bassPatternLoopMode === "fixed"
        ? Math.max(1, Math.min(64, Math.round(bassPatternLoopCount)))
        : 1;

    const scheduleCycle = (cycleIndex: number) => {
      if (bassPatternPlaybackRunRef.current !== runId) return;
      const cycleOffsetMs = cycleIndex * cycleBeats * beatMs;

      bassPatternEvents.forEach((event) => {
        const onTimeout = window.setTimeout(
          () => {
            if (bassPatternPlaybackRunRef.current !== runId) return;
            setBassPatternActiveButtonIds(
              event.buttons.map((button) => button.id),
            );
            const eventSoundOptions = {
              ...soundOptions,
              volume: Math.min(1, soundOptions.volume * event.gain),
            };
            event.buttons.forEach((button) =>
              playButtonSound(button, eventSoundOptions),
            );

            const clearTimeoutId = window.setTimeout(
              () => {
                if (bassPatternPlaybackRunRef.current !== runId) return;
                setBassPatternActiveButtonIds((current) => {
                  const eventIds = new Set(
                    event.buttons.map((button) => button.id),
                  );
                  return current.filter((id) => !eventIds.has(id));
                });
              },
              Math.max(80, event.durationBeats * beatMs * 0.85),
            );
            bassPatternTimeoutsRef.current.push(clearTimeoutId);
          },
          Math.max(0, cycleOffsetMs + event.startBeat * beatMs),
        );
        bassPatternTimeoutsRef.current.push(onTimeout);
      });
    };

    if (bassPatternLoopMode === "infinite") {
      const scheduleInfiniteCycle = (cycleIndex: number) => {
        if (bassPatternPlaybackRunRef.current !== runId) return;
        scheduleCycle(cycleIndex);
        const nextCycleTimeout = window.setTimeout(
          () => {
            scheduleInfiniteCycle(cycleIndex + 1);
          },
          Math.max(120, cycleBeats * beatMs),
        );
        bassPatternTimeoutsRef.current.push(nextCycleTimeout);
      };
      scheduleInfiniteCycle(0);
      return;
    }

    for (let cycleIndex = 0; cycleIndex < repeats; cycleIndex += 1) {
      scheduleCycle(cycleIndex);
    }

    const stopTimeout = window.setTimeout(
      () => {
        if (bassPatternPlaybackRunRef.current !== runId) return;
        setBassPatternPlaybackState("stopped");
        setBassPatternActiveButtonIds([]);
      },
      Math.max(0, cycleBeats * repeats * beatMs) + 140,
    );
    bassPatternTimeoutsRef.current.push(stopTimeout);
  }

  /** Stops currently playing notes and any scheduled sequence playback. */
  function stopSoundPlayback() {
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
  }

  /** Removes all diagram annotations and closes any inline editor. */
  function clearTextNotes() {
    setTextNotes([]);
    setInlineAnnotationEditor(null);
  }

  /** Removes one diagram annotation. */
  function deleteTextNote(noteId: string) {
    setTextNotes((current) => current.filter((note) => note.id !== noteId));
  }

  function annotationLocationLabel(note: TextNote) {
    if (!note.attachedToButtonId) return "Free label";
    const anchorLabel = (note.annotationAnchor ?? "center")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase();
    return `Button · ${anchorLabel}`;
  }

  function annotationPreview(note: TextNote) {
    const compact = note.text.replace(/\s+/g, " ").trim();
    if (!compact) return "Untitled annotation";
    return compact.length > 34 ? `${compact.slice(0, 31)}...` : compact;
  }

  /** Clear Harmony selection/recording without discarding user preferences. */
  function clearHarmonyWork() {
    setHarmonySelection(null);
    setHarmonyFocusedReferenceRootPc(null);
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedProgression([]);
    setHarmonyRecordedNotationVisible(false);
    setHarmonyProgressionPreviewIndex(null);
    setHarmonyProgressionActiveButtonIds([]);
    stopAllSound();
  }

  /** Reset only Stradella Chord Finder options. Register/sound/global settings remain untouched. */
  function resetStradellaFinderDefaults() {
    setStradellaChordFinderRoot("C");
    setStradellaChordFinderPattern("major-triad");
    setStradellaChordFinderMode("bass-and-chords");
    setStradellaChordFinderRequestedBass(null);
    setStradellaChordFinderRealizationIndex(0);
    setFinderMaxButtons(3);
    setFinderSpanColumns(4.3);
    setStradellaMinimumNominalGap(0);
    setStradellaChordFinderMarkRootBass(true);
    setShowFinderRealizationNote(true);
    setShowStradellaVoicingIntervals(true);
    setStradellaNoteLevels({ ...DEFAULT_STRADELLA_NOTE_LEVELS });
    setFinderExplanationFontSize(26);
  }

  function resetCurrentToolDefaults() {
    if (workspaceMode === "harmony") resetHarmonyExplorer();
    else if (side === "stradella" && activeToolSection === "stradellaChordFinder") {
      resetStradellaFinderDefaults();
      resetDiagramWork();
    }
  }

  /** Clears selections, fingerings, sequences, annotations, and active tool modes. */
  function resetDiagramWork() {
    setOverlays({});
    setSequenceSteps([]);
    setIsRecordingSequence(false);
    setIsApplyingFingering(false);
    setTextNotes([]);
    setScaleFinderActive(false);
    setChordFinderActive(false);
    setStradellaChordFinderActive(false);
    setHarmonyProgressionPreviewIndex(null);
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
  }

  /** Semitones of a pitch class above C (0–11), used for key-independent functional-reference labels. */
  function semiAboveCRef(pitch: string): number {
    return (INDEX_TO_PITCH.indexOf(pitch) - INDEX_TO_PITCH.indexOf("C") + 12) % 12;
  }

  const MAJOR_FUNCTION_REF = ["I","♭II","II","♭III","III","IV","♭V","V","♭VI","VI","♭VII","VII"];
  const MINOR_FUNCTION_REF = ["i","♭ii","ii","♭iii","iii","iv","♭v","v","♭vi","vi","♭vii","vii"];

  function functionalReferenceLabelForChord(kind: ButtonKind, rootPitch: string): string {
    const d = semiAboveCRef(rootPitch);
    if (kind === "chord-major") return MAJOR_FUNCTION_REF[d] ?? "I";
    if (kind === "chord-minor") return MINOR_FUNCTION_REF[d] ?? "i";
    if (kind === "chord-dominant7") return (MAJOR_FUNCTION_REF[d] ?? "I") + "7";
    if (kind === "chord-diminished7") return (MINOR_FUNCTION_REF[d] ?? "i") + "°7";
    return "";
  }

  /** Computes the visible label for one button using notation and chord-label settings. */
  function getMainLabel(button: DiagramButton) {
    const labelAccidental = side === "stradella" ? stradellaAccidental : accidental;

    if (side === "stradella" && isChordKind(button.kind)) {
      if (chordLabelMode === "none") return "";

      const root = formatPitch(
        button.chordRoot,
        notation,
        labelAccidental,
        button.chordDisplayName ?? button.chordNaturalName,
      );

      if (chordLabelMode === "root-only") return root;
      if (chordLabelMode === "row-function") return rowFunction(button.kind);
      if (chordLabelMode === "chord-tones") {
        return chordTones(
          button.chordRoot ?? "C",
          button.kind,
          notation,
          labelAccidental,
        );
      }
      if (chordLabelMode === "functional-reference") {
        return functionalReferenceLabelForChord(button.kind, button.chordRoot ?? "C");
      }

      return displayStradellaButtonChord(root, button.kind, chordDisplayStyle);
    }

    // Bass rows: interval mode shows key-independent interval name
    if (
      side === "stradella" &&
      (button.kind === "bass-root" || button.kind === "bass-counterbass") &&
      chordLabelMode === "functional-reference"
    ) {
      return (INTERVALS_FROM_C[button.pitchClass ?? "C"] ?? "").replace(/b/g, "♭");
    }

    return formatPitch(
      button.pitchClass,
      notation,
      labelAccidental,
      button.displayName ?? button.naturalName,
      button.octave,
    );
  }

  /** Formats one pitch with the same spelling used by visible Stradella bass-button labels. */
  function formatStradellaFinderPitch(pitch: string) {
    const matchingBassButton = buttons
      .filter(
        (button) =>
          (button.kind === "bass-root" || button.kind === "bass-counterbass") &&
          button.pitchClass === pitch,
      )
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "bass-root" ? -1 : 1;
        if (a.column !== b.column) return a.column - b.column;
        return a.row - b.row;
      })[0];

    if (matchingBassButton) return getMainLabel(matchingBassButton);

    return formatPitch(pitch, notation, stradellaAccidental);
  }

  /** Formats finder pitch lists with the same spelling used by visible Stradella bass-button labels. */
  function formatStradellaFinderPitches(pitches: string[]) {
    if (pitches.length === 0) return "none";
    return pitches.map(formatStradellaFinderPitch).join(", ");
  }


  /** Formats Stradella Scale Finder note names, preserving scale spelling such as E#, B#, and F##. */
  function formatStradellaScaleFinderNames(names: string[], fallbackPitches: string[]) {
    const source = names.length > 0 ? names : fallbackPitches.map(formatStradellaFinderPitch);
    if (source.length === 0) return "none";
    return source.map((name) => name.replaceAll("##", "𝄪")).join(", ");
  }

  /** Rewrites technical Stradella explanations so pitch names match the visible button labels. */
  function formatStradellaFinderText(text: string) {
    return [...INDEX_TO_PITCH]
      .sort((a, b) => b.length - a.length)
      .reduce((current, pitch) => {
        const escapedPitch = pitch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `(^|[^A-Za-z#])(${escapedPitch})(?![A-Za-z#])`,
          "g",
        );
        return current.replace(
          pattern,
          (_match, prefix) => `${prefix}${formatStradellaFinderPitch(pitch)}`,
        );
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

  function localizedAutoTitle() {
    return diagramAutoTitle(side, basses, trebleLayout, language);
  }

  /** Toggles the requested left panel; clicking the active panel hides it. */
  function setPanel(mode: Exclude<LeftPanelMode, "hidden">) {
    setLeftPanelMode((current) => (current === mode ? "hidden" : mode));
  }

  /** Download every eligible realization with the current filter, labels,
   * layout, register model, footer and SVG/PNG settings. Capture each live SVG
   * synchronously, then restore selection before asynchronous PNG encoding. */
  async function downloadAllStradellaRealizations() {
    if (batchExporting || side !== "stradella" || !stradellaChordFinderActive) return;
    const candidates = stradellaChordFinderRealizations
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => candidate.playable);
    if (!candidates.length || !svgRef.current) return;
    setBatchExporting(true);
    const initialIndex = stradellaChordFinderRealizationIndex;
    const snapshots: Array<{ name: string; svg: string; width: number; height: number }> = [];
    try {
      try {
        for (let index = 0; index < candidates.length; index++) {
          const { candidate, index: originalIndex } = candidates[index];
          flushSync(() => setStradellaChordFinderRealizationIndex(originalIndex));
          const svg = svgRef.current;
          if (!svg) throw new Error("Diagram SVG is unavailable.");
          const annotation = realizationAnnotation(
            stradellaChordFinderRoot, stradellaChordFinderPattern, candidate,
            stradellaRegisterModel, stradellaChordFinderRequestedBass,
            stradellaNoteLevels, chordDisplayStyle, language,
          );
          const safeName = (annotation?.filenameKey ?? `realization-${index + 1}`)
            .replace(/#/g, "sharp").replace(/♯/g, "sharp").replace(/♭/g, "flat")
            .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
            .slice(0, 140);
          const rect = svg.viewBox.baseVal;
          snapshots.push({
            name: `${String(index + 1).padStart(3, "0")}-${safeName || "stradella"}`,
            svg: serializeSvg(svg, downloadFormat === "png"),
            width: Math.ceil(rect.width || svg.clientWidth || 1200),
            height: Math.ceil(rect.height || svg.clientHeight || 800),
          });
        }
      } finally {
        flushSync(() => setStradellaChordFinderRealizationIndex(initialIndex));
      }
      const encoder = new TextEncoder();
      const entries: Array<{ name: string; data: Uint8Array }> = [];
      for (const snapshot of snapshots) {
        const isPng = downloadFormat === "png";
        entries.push({
          name: `${snapshot.name}.${isPng ? "png" : "svg"}`,
          data: isPng
            ? await svgStringToPngBytes(snapshot.svg, snapshot.width, snapshot.height)
            : encoder.encode(snapshot.svg),
        });
      }
      downloadZip(entries, `stradella-${stradellaChordFinderRoot}-${stradellaChordFinderPattern}-${downloadFormat}-${entries.length}-realizations.zip`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not export all diagrams.");
    } finally {
      setBatchExporting(false);
    }
  }

  /** Downloads the currently rendered accordion or Harmony Explorer diagram. */
  function downloadCurrentDiagram() {
    if (workspaceMode === "harmony") {
      if (!harmonySvgRef.current) return;
      const safePart = (value: string) => value
        .toLowerCase()
        .replace(/[()]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const name = `harmonic-circle-${safePart(harmonyReferenceFamily.shortName)}-${safePart(harmonyRelatedName)}-${safePart(harmonyScale.name)}`;
      if (downloadFormat === "png") {
        downloadPng(harmonySvgRef.current, `${name}.png`);
      } else {
        downloadSvg(harmonySvgRef.current, `${name}.svg`);
      }
      return;
    }

    if (!svgRef.current) return;
    const layoutName =
      side === "stradella"
        ? "stradella"
        : trebleLayout === "piano"
          ? "piano-treble"
          : `${trebleLayout}-treble`;

    // Match the title currently displayed on the diagram, including the
    // Chord Finder's automatically generated chord/realization title.
    const displayedTitle = titleMode !== "none" ? finalTitle : "";
    // ASCII-only, Windows-safe filenames; identify individual Chord Finder recipes.
    const rawName = titleMode === "contextual" && finderAnnotationActive && finderAnnotation
      ? finderAnnotation.filenameKey
      : titleMode === "contextual" && side === "treble" && chordFinderActive
        ? trebleContextualTitle({
            root: chordFinderRoot, pattern: chordFinderPattern,
            inversion: chordFinderInversion, hasButtons: chordFinderButtons.length > 0,
            exact: trebleChordExplanation.exact, displayStyle: "words",
          })
        : (titleMode === "auto" ||
           (titleMode === "contextual" && !stradellaChordFinderActive && !(side === "treble" && chordFinderActive) && !scaleFinderActive))
          ? autoTitle()
          : displayedTitle;
    const asciiName = rawName
      .replace(/#/g, "sharp").replace(/♯/g, "sharp").replace(/♭/g, "flat")
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 160).replace(/-+$/g, "");
    const reservedName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    const filenameBase = asciiName && !reservedName.test(asciiName)
      ? asciiName
      : `${layoutName}-accordion-diagram`;

    if (downloadFormat === "png") {
      downloadPng(svgRef.current, `${filenameBase}.png`);
      return;
    }

    downloadSvg(svgRef.current, `${filenameBase}.svg`);
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

  function annotationPointForButton(
    button: DiagramButton,
    anchor: DiagramAnnotationAnchor,
    offsetPercent = annotationOffsetPercent,
  ) {
    const halfWidth = (button.width ?? buttonSize * 2) / 2;
    const halfHeight = (button.height ?? buttonSize * 2) / 2;
    const offsetRatio = Math.max(0, Math.min(offsetPercent, 100)) / 100;
    const xOffset = Math.min(halfWidth * offsetRatio, buttonSize * 0.9);
    const yOffset = Math.min(halfHeight * offsetRatio, buttonSize * 0.9);

    const x =
      anchor === "left" || anchor === "topLeft" || anchor === "bottomLeft"
        ? button.x - xOffset
        : anchor === "right" || anchor === "topRight" || anchor === "bottomRight"
          ? button.x + xOffset
          : button.x;

    const y =
      anchor === "top" || anchor === "topLeft" || anchor === "topRight"
        ? button.y - yOffset
        : anchor === "bottom" || anchor === "bottomLeft" || anchor === "bottomRight"
          ? button.y + yOffset
          : button.y;

    return { x, y };
  }

  function beginButtonAnnotation(button: DiagramButton) {
    const point = annotationPointForButton(
      button,
      annotationButtonAnchor,
      annotationOffsetPercent,
    );
    setInlineAnnotationEditor({
      ...point,
      text: "",
      fontSize: textNoteFontSize,
      color: textNoteColor,
      font: textNoteFont,
      bold: annotationBold,
      italic: annotationItalic,
      annotationOffsetPercent,
      attachedToButtonId: button.id,
      annotationAnchor: annotationButtonAnchor,
    });
  }

  function beginFreeAnnotation(x: number, y: number) {
    setInlineAnnotationEditor({
      x,
      y,
      text: "",
      fontSize: textNoteFontSize,
      color: textNoteColor,
      font: textNoteFont,
      bold: annotationBold,
      italic: annotationItalic,
      annotationOffsetPercent,
    });
  }

  function commitInlineAnnotation() {
    if (!inlineAnnotationEditor) return;
    const text = inlineAnnotationEditor.text.trim();
    if (text) {
      setTextNotes((current) => [
        ...current,
        makeTextNote({
          x: inlineAnnotationEditor.x,
          y: inlineAnnotationEditor.y,
          text,
          fontSize: inlineAnnotationEditor.fontSize,
          color: inlineAnnotationEditor.color,
          font: inlineAnnotationEditor.font,
          anchor: "middle",
          bold: inlineAnnotationEditor.bold,
          italic: inlineAnnotationEditor.italic,
          annotationOffsetPercent: inlineAnnotationEditor.annotationOffsetPercent,
          attachedToButtonId: inlineAnnotationEditor.attachedToButtonId,
          annotationAnchor: inlineAnnotationEditor.annotationAnchor,
        }),
      ]);
    }
    setInlineAnnotationEditor(null);
  }

  function cancelInlineAnnotation() {
    setInlineAnnotationEditor(null);
  }

  /** Starts a free-position inline annotation when Annotate Diagram is active. */
  function handleSvgClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (activeToolSection !== "annotateDiagram") return;

    const point = svgPointFromMouse(event);
    if (!point) return;
    beginFreeAnnotation(point.x, point.y);
  }

  useEffect(() => {
    return () => {
      clearAbcTimers();
    };
  }, []);

  /* Derived values used by rendering. */
  const finderAnnotation = stradellaChordFinderResult.playable
    ? realizationAnnotation(stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderResult, stradellaRegisterModel, stradellaChordFinderRequestedBass, stradellaNoteLevels, chordDisplayStyle, language)
    : null;
  const finderAnnotationActive = side === "stradella" && stradellaChordFinderActive && finderAnnotation !== null;
  const finderFooterEnabled = finderAnnotationActive && showFinderRealizationNote && Boolean(finderAnnotation?.lines.length);
  const finderLineLabels = {
    identity: `${t("analysis.harmonicIdentity")}:`,
    pitchClasses: `${t("analysis.pitchClassRealization")}:`,
    voicing: `${t("analysis.registralVoicing")}:`,
    physical: `${t("analysis.physicalRealization")}:`,
  } satisfies Record<keyof StradellaNoteLevels, string>;
  const annotationLevelForLine = (line: string): keyof StradellaNoteLevels | null =>
    (Object.entries(finderLineLabels).find(([, prefix]) => line.startsWith(prefix))?.[0] as keyof StradellaNoteLevels | undefined) ?? null;
  const finderVoicingAnalysis = finderAnnotationActive && showFinderRealizationNote && showStradellaVoicingIntervals && stradellaNoteLevels.voicing
    ? analyzeConfiguredStradellaVoicing(
      stradellaChordFinderResult.playbackButtons,
      stradellaChordFinderRoot,
      stradellaRegisterModel,
    )
    : null;
  const finderVoicingLayout = finderVoicingAnalysis ? voicingIntervalLayout(finderVoicingAnalysis.notes, {
    fontSize: finderExplanationFontSize,
    displayLabel: (note, count) => `${chordToneName(stradellaChordFinderRoot, stradellaChordFinderPattern, note.pitchClass)}${note.octave}${count > 1 ? ` ×${count}` : ""}`,
  }) : null;
  const finderVoicingChartVisible = Boolean(finderVoicingLayout && finderVoicingLayout.positions.length >= 2);
  // The note generator owns the stable ordering, independently of the chart toggle.
  const finderAnnotationDisplayLines = finderAnnotation?.lines ?? [];
  // Report the actual highlighted buttons for every chord family.
  const trebleChordExplanation = describeTrebleChord(
    chordFinderButtons, chordFinderRoot, chordFinderPattern, trebleChordVoicingMode, language,
  );
  const trebleVoicingNote = side === "treble" && chordFinderActive ? trebleChordExplanation.note : "";
  const trebleFooterEnabled = Boolean(showTrebleVoicingNote && trebleVoicingNote);
  const contextualTitle = (() => {
    if (side === "stradella" && stradellaChordFinderActive) {
      return finderAnnotationActive ? finderAnnotation?.title ?? localizedAutoTitle()
        : `${displayRealizedChord(stradellaChordFinderRoot, stradellaChordFinderPattern, realizedChordName(stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderRequestedBass, stradellaChordFinderRequestedBass, `${displayRoot(stradellaChordFinderRoot)}${finderChordSymbol(stradellaChordFinderRoot, stradellaChordFinderPattern).slice(stradellaChordFinderRoot.length)}`), chordDisplayStyle)} - ${t("ui.titleNoRealization")}`;
    }
    if (side === "treble" && chordFinderActive) return trebleContextualTitle({
      root: chordFinderRoot,
      pattern: chordFinderPattern,
      inversion: chordFinderInversion,
      hasButtons: chordFinderButtons.length > 0,
      exact: trebleChordExplanation.exact,
      displayStyle: chordDisplayStyle,
    });
    if (scaleFinderActive) return `${scaleFinderRoot} ${translateKnownLabel(language, SCALE_FINDER_OPTIONS.find((x) => x.value === scaleFinderPattern)?.label ?? "scale")}`;
    return localizedAutoTitle();
  })();
  const finalTitle =
    titleMode === "auto" ? localizedAutoTitle()
      : titleMode === "contextual" ? contextualTitle
      : titleMode === "custom" ? customTitle : "";

  const visibleRoots =
    side === "stradella" ? stradellaVisibleRoots(basses) : [];
  const visibleRows = side === "stradella" ? stradellaVisibleRows(basses) : [];

  const viewWidth =
    side === "stradella"
      ? Math.max(1040, 275 + visibleRoots.length * buttonSize * spacing * 1.15)
      : isPianoTreble
        ? Math.max(
            880,
            185 +
              pianoTrebleWhiteKeyCount(pianoTrebleRange) *
                buttonSize *
                spacing *
                0.92 *
                pianoKeyWidthScale,
          )
        : ["one-octave", "two-octave"].includes(trebleSize)
          ? Math.max(420, ...buttons.map((button) => button.x + buttonSize + 96))
          : TREBLE_SIZE_VIEW_WIDTH[trebleSize];

  // Longer contextual titles (especially selected treble inversions) must
  // remain within compact one-/two-octave SVG widths and exported PNGs.
  // Only contextual titles auto-fit; keep the user's custom font size intact.
  const effectiveTitleSize = titleMode === "contextual"
    ? Math.min(titleSize, Math.max(10, Math.floor((viewWidth - 64) / (Math.max(1, finalTitle.length) * 0.62))))
    : titleSize;

  const baseViewHeight =
    side === "stradella"
      ? Math.max(
          320,
          220 +
            visibleRows.length * buttonSize * spacing * 0.88 +
            diagramVerticalSpacing,
        )
      : isPianoTreble
        ? Math.max(
            360,
            285 +
              buttonSize * 5.9 * pianoKeyHeightScale +
              diagramVerticalSpacing,
          )
        : 450 + diagramVerticalSpacing;

  // Keep the Treble Chord Finder note close to the actual keyboard. A fixed
  // 450px base height leaves a large gap when the layout has only three rows.
  // Piano and Stradella retain their existing footer positioning.
  const buttonTrebleFooter = side === "treble" && !isPianoTreble && buttons.length > 0;
  const trebleFooterY = buttonTrebleFooter
    ? Math.max(...buttons.map((button) => button.y + buttonSize)) + Math.max(22, buttonSize * 0.8)
    : baseViewHeight - 21;
  // Reserve enough room for explanatory notes that wrap on narrow diagrams,
  // including the one- and two-octave presets.
  const trebleFooterFontSize = viewWidth < 600 ? 21 : 26;
  const trebleFooterLineEstimate = Math.max(1, Math.ceil(
    trebleVoicingNote.length * trebleFooterFontSize * 0.65 * 1.18 / Math.max(1, viewWidth - 64),
  ));
  const trebleFooterHeight = Math.max(
    80,
    Math.ceil(trebleFooterLineEstimate * trebleFooterFontSize * 1.15 + 20),
  );
  // Match the shared CSS label column using the longest enabled translated label.
  const finderAnnotationLabelWidth = Math.max(150, ...finderAnnotationDisplayLines.map((line) =>
    Math.ceil(Math.max(0, line.indexOf(":") + 1) * finderExplanationFontSize * 0.65)));
  const finderAnnotationContentWidth = Math.max(220, viewWidth - 64 - finderAnnotationLabelWidth - 18);
  const finderVoicingChartHeight = finderVoicingChartVisible ? finderVoicingLayout!.metrics.height : 0;
  const finderFooterHeight = (() => {
    let total = 16;
    for (const line of finderAnnotationDisplayLines) {
      const level = annotationLevelForLine(line);
      if (level === "voicing" && finderVoicingChartVisible) {
        total += finderVoicingChartHeight + 0.42 * finderExplanationFontSize;
        continue;
      }
      const colon = line.indexOf(":");
      const value = colon > 0 ? line.slice(colon + 1).trim() : line;
      const wrappedLines = Math.max(1, Math.ceil(
        value.length * finderExplanationFontSize * 0.59 / Math.max(1, finderAnnotationContentWidth),
      ));
      total += Math.max(finderExplanationFontSize * 1.3, wrappedLines * finderExplanationFontSize * 1.3) +
        0.42 * finderExplanationFontSize;
    }
    return Math.max(82, Math.ceil(total));
  })();
  // Place the annotation closer to the lowest physical button, retaining a
  // clearance for selection outlines and alternate Stradella row configurations.
  const stradellaFinderFooterY = Math.max(
    baseViewHeight - 90,
    Math.max(0, ...buttons.map((button) => button.y + buttonSize * 0.58)) + 24,
  );
  const viewHeight = trebleFooterEnabled && buttonTrebleFooter
    ? trebleFooterY + trebleFooterHeight + 8
    : finderFooterEnabled ? stradellaFinderFooterY + finderFooterHeight + 12
      : baseViewHeight + (trebleFooterEnabled ? 112 : 0);

  const sidebarWidth =
    interfaceDensity === "compact"
      ? "clamp(230px, 15vw, 270px)"
      : "clamp(300px, 20vw, 380px)";
  const appGridColumns = `${leftPanelMode === "hidden" ? "" : `${sidebarWidth} `}minmax(0, 1fr)`;

  const showSequenceNumbers =
    sequenceNumberPosition !== "none" &&
    sequenceModeShowsNumbers(sequenceDisplayMode);
  const showSequenceArrows = sequenceModeShowsArrows(sequenceDisplayMode);
  const sequenceArrowStyle = sequenceArrowStyleFromMode(sequenceDisplayMode);
  const showScaleFinderNumbers =
    sequenceNumberPosition !== "none" &&
    scaleFinderActive &&
    sequenceModeShowsNumbers(scaleFinderDisplayMode);
  const showScaleFinderArrows =
    scaleFinderActive && sequenceModeShowsArrows(scaleFinderDisplayMode);
  const scaleFinderArrowStyle = sequenceArrowStyleFromMode(
    scaleFinderDisplayMode,
  );
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

  /*
    The treble and Stradella sides are viewed from opposite sides of the
    instrument. Keep the bellows guide aligned with the physical instrument
    ends rather than using one hard-coded left/right label pair for every side.
  */
  const bellowsStartLabel = side === "stradella" ? t("ui.bottom") : t("ui.top");
  const bellowsEndLabel = side === "stradella" ? t("ui.top") : t("ui.bottom");

  const activeToolLabel =
    side === "stradella"
      ? bassPatternPlaybackState === "playing"
        ? t("ui.bassPatternPlayer")
        : abcPlaybackState === "playing" || abcPlaybackState === "paused"
          ? t("ui.abcDefault")
          : activeToolSection === "progressionAssistant"
            ? t("ui.progressionAssistant")
            : scaleFinderActive
              ? t("ui.scaleFinder")
              : stradellaChordFinderActive
                ? t("tools.chordFinder")
                : isRecordingSequence
                ? t("ui.sequenceRecording")
                : isApplyingFingering
                  ? t("ui.fingering")
                  : activeToolSection === "annotateDiagram"
                    ? t("ui.annotateDiagram")
                    : selectionOnClick
                      ? t("ui.selection")
                      : t("ui.noActiveTool")
      : abcPlaybackState === "playing" || abcPlaybackState === "paused"
        ? t("ui.abcDefault")
        : scaleFinderActive
          ? t("ui.scaleFinder")
          : chordFinderActive
            ? t("tools.chordFinder")
            : isRecordingSequence
              ? t("ui.sequenceRecording")
              : isApplyingFingering
                ? t("ui.fingering")
                : activeToolSection === "annotateDiagram"
                  ? t("ui.annotateDiagram")
                  : selectionOnClick
                    ? t("ui.selection")
                    : t("ui.noActiveTool");

  const statusBarText = accordionStatusText({
    side, basses, trebleLayout, pianoRange: pianoTrebleRange, trebleRows,
    notation, soundEnabled, activeTool: activeToolLabel, language,
  });

  return (
    <LanguageProvider language={language}>
    <main
      lang={language}
      className={`app density-${interfaceDensity}`}
      style={{ gridTemplateColumns: appGridColumns }}
    >
      {leftPanelMode !== "hidden" && (
        <aside className="left-panel">
          <h1>{leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")}</h1>

          {leftPanelMode === "settings" && (
            <>

              <section className="control-section">
                <div className="section-content">
                  <label>
                    {t("settings.language")}
                    <select value={languagePreference} onChange={(event) => changeLanguage(event.target.value as InterfaceLanguagePreference)}>
                      <option value="auto">{t("settings.languageAuto")}</option>
                      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("layout")}
                              >
                                {t("settings.layout")}{" "}
                                <span>{activeSettingsSection === "layout" ? "−" : "+"}</span>
                              </button>
              
                              {activeSettingsSection === "layout" && (
                                <div className="section-content">
                                  {side === "stradella" && (
                                    <>
                                      <label>
                                        {t("ui.basses")}
                                        <select
                                          value={basses}
                                          onChange={(event) =>
                                            setBasses(event.target.value as BassCount)
                                          }
                                        >
                                          {BASS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {translateKnownLabel(language, option.label)}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
              
                                      <label>
                                        {t("ui.chordLabels")}
                                        <select
                                          value={chordLabelMode}
                                          onChange={(event) =>
                                            setChordLabelMode(
                                              event.target.value as ChordLabelMode,
                                            )
                                          }
                                        >
                                          <option value="none">{t("common.none")}</option>
                                          <option value="chord-name">
                                            {t("ui.chordNamesSelectedStyle")}
                                          </option>
                                          <option value="root-only">{t("ui.rootOnly")}</option>
                                          <option value="chord-tones">{t("ui.chordTones")}</option>
                                          <option value="row-function">
                                            {t("ui.rowFunctionMM7")}
                                          </option>
                                          <option value="functional-reference">
                                            {t("ui.functionalReferenceIIvV7")}
                                          </option>
                                        </select>
                                      </label>
                                    </>
                                  )}
              
                                  {side === "treble" && (
                                    <>
                                      <label>
                                        {t("ui.trebleLayout")}
                                        <select
                                          value={trebleLayout}
                                          onChange={(event) =>
                                            changeTrebleLayout(
                                              event.target.value as TrebleLayout,
                                            )
                                          }
                                        >
                                          <option value="c-system">
                                            {t("ui.cSystemChromaticButtons")}
                                          </option>
                                          <option value="b-system">
                                            {t("ui.bSystemBayanChromaticButtons")}
                                          </option>
                                          <option value="piano">{t("ui.pianoKeyboard")}</option>
                                        </select>
                                      </label>
              
                                      {trebleLayout !== "piano" && (
                                        <>
                                          <label>
                                            {t("ui.rows")}
                                            <select
                                              value={trebleRows}
                                              onChange={(event) =>
                                                setTrebleRows(
                                                  Number(event.target.value) as 3 | 4 | 5,
                                                )
                                              }
                                            >
                                              <option value={3}>{t("ui.rowsChoice", { count: 3 })}</option>
                                              <option value={4}>{t("ui.rowsChoice", { count: 4 })}</option>
                                              <option value={5}>{t("ui.rowsChoice", { count: 5 })}</option>
                                            </select>
                                          </label>
              
                                          <label>
                                            {t("ui.trebleSize")}
                                            <select
                                              value={trebleSize}
                                              onChange={(event) =>
                                                changeTrebleSize(
                                                  event.target.value as TrebleSizePreset,
                                                )
                                              }
                                            >
                                              {TREBLE_SIZE_OPTIONS.map((option) => (
                                                <option
                                                  key={option.value}
                                                  value={option.value}
                                                >
                                                  {translateKnownLabel(language, option.label)}
                                                </option>
                                              ))}
                                            </select>
                                          </label>
                                        </>
                                      )}
              
                                      {trebleLayout === "piano" && (
                                        <label>
                                          {t("ui.pianoRange")}
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
                                                {pianoRangeStatusLabel(option.value, language)}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                      )}
              
                                      <BinaryChoiceButton label={t("ui.octaveNumbers")} enabled={showTrebleOctaves} onToggle={() => setShowTrebleOctaves((value) => !value)} whenEnabled={t("ui.hideOctaveNumbers")} whenDisabled={t("ui.showOctaveNumbers")} />
                                    </>
                                  )}
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("notation")}
                              >
                                {t("settings.notation")}{" "}
                                <span>
                                  {activeSettingsSection === "notation" ? "−" : "+"}
                                </span>
                              </button>
              
                              {activeSettingsSection === "notation" && (
                                <div className="section-content">
                                  <div className="chord-display-style-setting">
                                    <label>
                                      {t("settings.chordStyle")}
                                      <select value={chordDisplayStyle} onChange={(event) => setChordDisplayStyle(event.target.value as ChordDisplayStyle)}>
                                        <option value="compact">C, Cm, Cmaj7</option>
                                        <option value="letter">CM, Cm, CM7</option>
                                        <option value="words">Cmaj, Cmin, Cmaj7</option>
                                      </select>
                                    </label>
                                  </div>

                                  <label>
                                    {t("settings.pitchNotation")}
                                    <select
                                      value={notation}
                                      onChange={(event) =>
                                        setNotation(event.target.value as NotationMode)
                                      }
                                    >
                                      <option value="english">C D E F</option>
                                      <option value="german">C D E F G A H</option>
                                      <option value="solfege">Do Re Mi Fa</option>
                                      <option value="intervals">{t("settings.intervals")}</option>
                                      <option value="blank">{t("settings.blank")}</option>
                                    </select>
                                  </label>
              
                                  <label>
                                    {t("settings.accidentals")}
                                    <select
                                      value={accidental}
                                      onChange={(event) =>
                                        setAccidental(event.target.value as AccidentalMode)
                                      }
                                    >
                                      <option value="natural">{t("settings.defaultSpelling")}</option>
                                      <option value="flats">{t("settings.preferFlats")}</option>
                                      <option value="sharps">{t("settings.preferSharps")}</option>
                                      <option value="enharmonic">{t("settings.enharmonicPairs")}</option>
                                    </select>
                                  </label>
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("musicNotation")}
                              >
                                {t("settings.musicNotation")}{" "}
                                <span>
                                  {activeSettingsSection === "musicNotation" ? "−" : "+"}
                                </span>
                              </button>
              
                              {activeSettingsSection === "musicNotation" && (
                                <div className="section-content">
                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={musicNotationIncludeTitle}
                                      onChange={(event) =>
                                        setMusicNotationIncludeTitle(event.target.checked)
                                      }
                                    />
                                    <span>{t("ui.includeTitle")}</span>
                                  </label>
              
                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={musicNotationIncludeDescription}
                                      onChange={(event) =>
                                        setMusicNotationIncludeDescription(
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    <span>{t("ui.includeDescription")}</span>
                                  </label>
              
                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={musicNotationIncludeSummary}
                                      onChange={(event) =>
                                        setMusicNotationIncludeSummary(event.target.checked)
                                      }
                                    />
                                    <span>{t("ui.includeSummaryNote")}</span>
                                  </label>
              
                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={musicNotationUseBarsPerLine}
                                      onChange={(event) =>
                                        setMusicNotationUseBarsPerLine(event.target.checked)
                                      }
                                    />
                                    <span>{t("ui.limitBarsPerLine")}</span>
                                  </label>
              
                                  <label>
                                    {t("ui.barsPerLine")}: {musicNotationBarsPerLine}
                                    <input
                                      type="range"
                                      min={1}
                                      max={8}
                                      step={1}
                                      value={musicNotationBarsPerLine}
                                      disabled={!musicNotationUseBarsPerLine}
                                      onChange={(event) =>
                                        setMusicNotationBarsPerLine(
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>
              
                                  <label>
                                    {t("ui.chordTextSize")}: {musicNotationChordFontSize}px
                                    <input
                                      type="range"
                                      min={8}
                                      max={24}
                                      step={1}
                                      value={musicNotationChordFontSize}
                                      onChange={(event) =>
                                        setMusicNotationChordFontSize(
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>
              
                                  <label>
                                    {t("ui.notationScale")}: {musicNotationScale}%
                                    <input
                                      type="range"
                                      min={40}
                                      max={100}
                                      step={2}
                                      value={musicNotationScale}
                                      onChange={(event) =>
                                        setMusicNotationScale(Number(event.target.value))
                                      }
                                    />
                                  </label>
              
                                  <label>
                                    {t("ui.staffWidth")}: {musicNotationStaffWidth}px
                                    <input
                                      type="range"
                                      min={320}
                                      max={900}
                                      step={20}
                                      value={musicNotationStaffWidth}
                                      onChange={(event) =>
                                        setMusicNotationStaffWidth(Number(event.target.value))
                                      }
                                    />
                                  </label>
              
                                  <label>
                                    {t("ui.staffSpacing")}: {musicNotationStaffSeparator}
                                    <input
                                      type="range"
                                      min={8}
                                      max={32}
                                      step={1}
                                      value={musicNotationStaffSeparator}
                                      onChange={(event) =>
                                        setMusicNotationStaffSeparator(
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>
              
                                  <p className="hint">
                                    {t("ui.notesScope")}
                                  </p>
                                </div>
                              )}
                            </section>
            )}

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("appearance")}
                              >
                                {t("settings.appearance")}{" "}
                                <span>
                                  {activeSettingsSection === "appearance" ? "−" : "+"}
                                </span>
                              </button>
              
                              {activeSettingsSection === "appearance" && (
                                <div className="section-content">
                                  <SegmentedChoice label={<>{t("ui.interfaceDensity")} <HelpTip text={t("ui.interfaceDensityHelp")} /></>} value={interfaceDensity} onChange={setInterfaceDensity} options={[{ value: "compact", label: t("ui.compact") }, { value: "comfortable", label: t("ui.comfortable") }]} />
              
                                  <label className="checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={showStatusBar}
                                      onChange={(event) =>
                                        setShowStatusBar(event.target.checked)
                                      }
                                    />
                                    <span className="label-line">
                                      {t("ui.statusBar")}{" "}
                                      <HelpTip text={t("ui.statusBarHelp")} />
                                    </span>
                                  </label>
              
                                  <label>
                                    <span className="label-line">
                                      {t("ui.diagramScale")}: {diagramScale}%{" "}
                                      <HelpTip text={t("ui.diagramScaleHelp")} />
                                    </span>
                                    <input
                                      type="range"
                                      min={70}
                                      max={140}
                                      step={5}
                                      value={diagramScale}
                                      onChange={(event) =>
                                        setDiagramScale(Number(event.target.value))
                                      }
                                    />
                                  </label>
              
                                  <label>
                                    {t("ui.colorTheme")}
                                    <select
                                      value={colorTheme}
                                      onChange={(event) =>
                                        setColorTheme(event.target.value as ColorTheme)
                                      }
                                    >
                                      <option value="default">{t("ui.defaultBlue")}</option>
                                      <option value="classic">{t("ui.classicInk")}</option>
                                      <option value="pastel">{t("ui.pastel")}</option>
                                      <option value="warm">{t("ui.warmCream")}</option>
                                      <option value="contrast">{t("ui.highContrast")}</option>
                                      <option value="print">{t("ui.printGrayscale")}</option>
                                    </select>
                                  </label>
              
                                  <label>
                                    {t("ui.accidentalButtons")}
                                    <select
                                      value={accidentalStyle}
                                      onChange={(event) =>
                                        setAccidentalStyle(
                                          event.target.value as AccidentalStyle,
                                        )
                                      }
                                    >
                                      <option value="grey">{t("ui.grey")}</option>
                                      <option value="dark">{t("ui.dark")}</option>
                                      <option value="outline">{t("ui.outlineOnly")}</option>
                                      <option value="theme">{t("ui.themeColor")}</option>
                                    </select>
                                  </label>
              
                                  <label>
                                    {t("ui.labelFont")}
                                    <select
                                      value={labelFont}
                                      onChange={(event) =>
                                        setLabelFont(event.target.value as FontFamily)
                                      }
                                    >
                                      <option value="system">{t("ui.system")}</option>
                                      <option value="serif">{t("ui.serif")}</option>
                                      <option value="mono">{t("ui.mono")}</option>
                                      <option value="rounded">{t("ui.rounded")}</option>
                                    </select>
                                  </label>
              
                                  <label>
                                    {t("ui.labelFontSize")}: {labelFontSize}px
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
                                    className={`small-button appearance-label-toggle ${showButtonLabels ? "active-tool" : ""}`}
                                    onClick={() => setShowButtonLabels((current) => !current)}
                                  >
                                    {showButtonLabels
                                      ? t("ui.hideButtonLabels")
                                      : t("ui.showButtonLabels")}
                                  </button>
              
                                  <button
                                    type="button"
                                    className={`small-button appearance-label-toggle ${showBellowsGuide ? "active-tool" : ""}`}
                                    onClick={() => setShowBellowsGuide((current) => !current)}
                                  >
                                    {showBellowsGuide
                                      ? t("ui.hideBellowsGuide")
                                      : t("ui.showBellowsGuide")}
                                  </button>
              
                                  {side === "stradella" && (
                                    <button
                                      type="button"
                                      className={`small-button appearance-label-toggle ${showStradellaRowLabels ? "active-tool" : ""}`}
                                      aria-pressed={showStradellaRowLabels}
                                      onClick={() => setShowStradellaRowLabels((value) => !value)}
                                    >
                                      {showStradellaRowLabels ? t("ui.hideStradellaRowLabels") : t("ui.showStradellaRowLabels")}
                                    </button>
                                  )}
              
                                  <label>
                                    {t("ui.buttonSize")}: {buttonSize}
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
                                    {t("ui.spacing")}: {spacing.toFixed(2)}
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
                                    <span className="label-line">
                                      {t("ui.verticalSpacing")}: {diagramVerticalSpacing}px{" "}
                                      <HelpTip text={t("ui.diagramVerticalHelp")} />
                                    </span>
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
                                    {t("ui.buttonLine")}: {buttonStrokeWidth.toFixed(1)}
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
                                    {t("ui.referenceLine")}: {referenceStrokeWidth.toFixed(1)}
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
                                        <span className="label-line">
                                          {t("ui.pianoKeyWidth")}: {pianoKeyWidthScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.whiteKeyWidthHelp")} />
                                        </span>
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
                                        <span className="label-line">
                                          {t("ui.pianoKeyHeight")}: {pianoKeyHeightScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.pianoKeyHeightHelp")} />
                                        </span>
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
                                        <span className="label-line">
                                          {t("ui.blackKeyWidth")}:{" "}
                                          {pianoBlackKeyWidthScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.blackKeyWidthHelp")} />
                                        </span>
                                        <input
                                          type="range"
                                          min={0.75}
                                          max={1.35}
                                          step={0.05}
                                          value={pianoBlackKeyWidthScale}
                                          onChange={(event) =>
                                            setPianoBlackKeyWidthScale(
                                              Number(event.target.value),
                                            )
                                          }
                                        />
                                      </label>
              
                                      <label>
                                        <span className="label-line">
                                          {t("ui.blackKeyHeight")}:{" "}
                                          {pianoBlackKeyHeightScale.toFixed(2)}×{" "}
                                          <HelpTip text={t("ui.blackKeyHeightHelp")} />
                                        </span>
                                        <input
                                          type="range"
                                          min={0.75}
                                          max={1.5}
                                          step={0.05}
                                          value={pianoBlackKeyHeightScale}
                                          onChange={(event) =>
                                            setPianoBlackKeyHeightScale(
                                              Number(event.target.value),
                                            )
                                          }
                                        />
                                      </label>
                                    </>
                                  )}
              
                                  {side === "stradella" && (
                                    <label>
                                      {t("ui.chordFill")}: {chordFillStrength}%
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
                                      {t("ui.trebleAngle")}: {trebleAngle}°
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
            )}

              {workspaceMode === "harmony" && (
              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("appearance")}
                >
                  {t("settings.appearance")} <span>{activeSettingsSection === "appearance" ? "−" : "+"}</span>
                </button>
                {activeSettingsSection === "appearance" && (
                  <div className="section-content">
                    <SegmentedChoice label={<>{t("ui.interfaceDensity")} <HelpTip text={t("ui.interfaceDensityHelp")} /></>} value={interfaceDensity} onChange={setInterfaceDensity} options={[{ value: "compact", label: t("ui.compact") }, { value: "comfortable", label: t("ui.comfortable") }]} />
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showStatusBar} onChange={(event) => setShowStatusBar(event.target.checked)} />
                      <span>{t("ui.showStatusBar")}</span>
                    </label>
                    <label>
                      {t("ui.colorTheme")}
                      <select value={colorTheme} onChange={(event) => setColorTheme(event.target.value as ColorTheme)}>
                        <option value="default">{t("ui.defaultBlue")}</option>
                        <option value="classic">{t("ui.classicInk")}</option>
                        <option value="pastel">{t("ui.pastel")}</option>
                        <option value="warm">{t("ui.warmCream")}</option>
                        <option value="contrast">{t("ui.highContrast")}</option>
                        <option value="print">{t("ui.printGrayscale")}</option>
                      </select>
                    </label>
                  </div>
                )}
              </section>
            )}

              {workspaceMode === "accordion" && side === "stradella" && (
                <section className="control-section">
                  <button type="button" className="section-title" onClick={() => toggleSettingsSection("stradellaRegisters")}>
                    {t("settings.registers")} <span>{activeSettingsSection === "stradellaRegisters" ? "−" : "+"}</span>
                  </button>
                  {activeSettingsSection === "stradellaRegisters" && (
                    <div className="section-content">
                      <div className="stradella-register-settings">
                        <div className="stradella-register-intro-help">
                          <span>{t("ui.registerNominalModel")}</span>
                          <HelpTip text={t("ui.stradellaRegisterIntro")} />
                        </div>
                        <section className="stradella-register-group" aria-labelledby="stradella-bass-register-heading">
                          <h3 id="stradella-bass-register-heading">{t("ui.registerBassGroup")}</h3>
                          <label>
                            {t("ui.registerStartingOctave")}
                            <select aria-label={t("ui.bassCounterbassStartingOctave")} value={stradellaBassRegisterOctave} onChange={(event) => setStradellaBassRegisterOctave(Number(event.target.value))}>
                              {[1, 2, 3, 4].map((octave) => <option key={octave} value={octave}>{t("ui.octave")} {octave}</option>)}
                            </select>
                          </label>
                          <SegmentedChoice label={<>{t("ui.registerGrouping")} <HelpTip text={t("ui.registerGroupingHelp")} /></>} ariaLabel={t("ui.bassCounterbassGrouping")} value={stradellaBassRegisterGrouping} onChange={setStradellaBassRegisterGrouping} options={[{ value: "C-B", label: "C–B" }, { value: "F-E", label: "F–E" }]} />
                          <p className="stradella-register-range">{t("ui.registerConfiguredRange")}: {formatRegisterRange(stradellaRegisterModel.bass)}</p>
                        </section>
                        <section className="stradella-register-group" aria-labelledby="stradella-chord-register-heading">
                          <h3 id="stradella-chord-register-heading">{t("ui.registerChordGroup")}</h3>
                          <label>
                            {t("ui.registerStartingOctave")}
                            <select aria-label={t("ui.presetChordStartingOctave")} value={stradellaChordRegisterOctave} onChange={(event) => setStradellaChordRegisterOctave(Number(event.target.value))}>
                              {[2, 3, 4, 5].map((octave) => <option key={octave} value={octave}>{t("ui.octave")} {octave}</option>)}
                            </select>
                          </label>
                          <SegmentedChoice label={<>{t("ui.registerGrouping")} <HelpTip text={t("ui.registerGroupingHelp")} /></>} ariaLabel={t("ui.presetChordGrouping")} value={stradellaChordRegisterGrouping} onChange={setStradellaChordRegisterGrouping} options={[{ value: "C-B", label: "C–B" }, { value: "F-E", label: "F–E" }]} />
                          <p className="stradella-register-range">{t("ui.registerConfiguredRange")}: {formatRegisterRange(stradellaRegisterModel.chord)}</p>
                        </section>
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("sound")}
                >
                  {t("settings.sound")}{" "}
                  <span>{activeSettingsSection === "sound" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "sound" && (
                  <div className="section-content">
                    <SegmentedChoice label={<>{t("ui.soundSource")} <HelpTip text={`${t("ui.soundSourceHint")} ${t("ui.melodiosaCredit")}`} /></>} ariaLabel={t("ui.soundSource")} value={soundSource} onChange={setSoundSource} options={[{ value: "la-melodiosa", label: "La Melodiosa" }, { value: "synth", label: t("ui.synthesizer") }]} />

                    {soundSource === "la-melodiosa" && (
                      <>
                        {workspaceMode === "accordion" && side === "treble" && (
                          <label>
                            {t("ui.trebleRegister")}
                            <select
                              value={laMelodiosaTrebleRegister}
                              onChange={(event) =>
                                setLaMelodiosaTrebleRegister(
                                  event.target.value as SampleRegister,
                                )
                              }
                            >
                              <option value="I">{t("ui.iUpperRegister")}</option>
                              <option value="II">{t("ui.iiLowerRegister")}</option>
                              <option value="III">{t("ui.iiiBothRegisters")}</option>
                            </select>
                          </label>
                        )}
                        {(workspaceMode === "harmony" || side === "stradella") && (
                          <label>
                            {t("ui.bassRegister")}
                            <select
                              value={laMelodiosaBassRegister}
                              onChange={(event) =>
                                setLaMelodiosaBassRegister(
                                  event.target.value as SampleRegister,
                                )
                              }
                            >
                              <option value="I">{t("ui.iUpperRegister")}</option>
                              <option value="II">{t("ui.iiLowerRegister")}</option>
                              <option value="III">{t("ui.iiiBothRegisters")}</option>
                            </select>
                          </label>
                        )}
                        {(workspaceMode === "accordion" && side === "stradella") && (
                          <>
                            <SegmentedChoice label={<>{t("ui.samplePitchMapping")} <HelpTip text={laMelodiosaFollowStradellaRegisters ? t("ui.melodiosaConfigured") : t("ui.melodiosaOriginal")} /></>} ariaLabel={t("ui.samplePitchMapping")} value={laMelodiosaFollowStradellaRegisters ? "configured" : "original"} onChange={(next) => setLaMelodiosaFollowStradellaRegisters(next === "configured")} options={[{ value: "configured", label: t("ui.configuredRegisters") }, { value: "original", label: t("ui.originalMapping") }]} />
                            <p className="hint sound-configuration-summary">
                              {laMelodiosaFollowStradellaRegisters
                                ? t("ui.melodiosaConfiguredShort")
                                : t("ui.melodiosaOriginalShort")}
                            </p>
                          </>
                        )}
                      </>
                    )}

                    {soundSource === "synth" && (
                      <>
                        <label>
                      {t("ui.voice")}
                      <select
                        value={soundVoicePreset}
                        onChange={(event) =>
                          setSoundVoicePreset(
                            event.target.value as SoundVoicePreset,
                          )
                        }
                      >
                        <option value="soft-reed">{t("ui.softReed")}</option>
                        <option value="bright-reed">{t("ui.brightReed")}</option>
                        <option value="musette">{t("ui.musetteDetunedReeds")}</option>
                        <option value="organ">{t("ui.organLike")}</option>
                        <option value="bass-reed">{t("ui.bassReed")}</option>
                        <option value="single">{t("ui.singleOscillator")}</option>
                      </select>
                    </label>

                    {(workspaceMode === "harmony" || side === "stradella") && (
                      <>
                        <label>
                          <span className="label-line">{t("ui.stradellaBassVoicing")} <HelpTip text={t("ui.soundBassVoicingHelp")} /></span>
                          <select
                            value={stradellaBassVoicing}
                            onChange={(event) =>
                              setStradellaBassVoicing(
                                event.target.value as StradellaBassVoicing,
                              )
                            }
                          >
                            <option value="single-low">{t("ui.singleLowReed")}</option>
                            <option value="low-and-middle">
                              {t("ui.lowMiddleReeds")}
                            </option>
                            <option value="single-middle">
                              {t("ui.singleMiddleReed")}
                            </option>
                          </select>
                        </label>

                      </>
                    )}

                    {soundVoicePreset === "single" && (
                      <label>
                        {t("ui.waveform")}
                        <select
                          value={soundWaveform}
                          onChange={(event) =>
                            setSoundWaveform(
                              event.target.value as SoundWaveform,
                            )
                          }
                        >
                          <option value="sine">{t("ui.sine")}</option>
                          <option value="triangle">{t("ui.triangle")}</option>
                          <option value="sawtooth">{t("ui.sawtooth")}</option>
                          <option value="square">{t("ui.square")}</option>
                        </select>
                      </label>
                    )}

                    {soundVoicePreset === "musette" && (
                      <label>
                        {t("ui.reedDetune")}: {soundMusetteDetuneCents} cents
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
                      </>
                    )}

                    <label>
                      {t("ui.volume")}: {Math.round(soundVolume * 100)}%
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
                      {t("ui.attack")}: {soundAttackMs} ms
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
                      {t("ui.release")}: {soundReleaseMs} ms
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
                      {t("ui.noteDuration")}: {soundNoteDurationMs} ms
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
                      {t("ui.sequenceTempo")}: {soundSequenceTempoBpm} BPM
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

              {workspaceMode === "accordion" && (
              <section className="control-section">
                              <button
                                className="section-title"
                                onClick={() => toggleSettingsSection("title")}
                              >
                                {t("settings.title")}{" "}
                                <span>{activeSettingsSection === "title" ? "−" : "+"}</span>
                              </button>
              
                              {activeSettingsSection === "title" && (
                                <div className="section-content">
                                  <label>
                                    {t("ui.title")}
                                    <select
                                      value={titleMode}
                                      onChange={(event) =>
                                        setTitleMode(event.target.value as TitleMode)
                                      }
                                    >
                                      <option value="auto">{t("ui.autoInstrumentLayout")}</option>
                                      <option value="contextual">{t("ui.contextualToolAndSelection")}</option>
                                      <option value="custom">{t("ui.custom")}</option>
                                      <option value="none">{t("common.none")}</option>
                                    </select>
                                  </label>
              
                                  {titleMode === "custom" && (
                                    <label>
                                      {t("ui.customTitle")}
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
                                        {t("ui.titleFont")}
                                        <select
                                          value={titleFont}
                                          onChange={(event) =>
                                            setTitleFont(event.target.value as FontFamily)
                                          }
                                        >
                                          <option value="system">{t("ui.system")}</option>
                                          <option value="serif">{t("ui.serif")}</option>
                                          <option value="mono">{t("ui.mono")}</option>
                                          <option value="rounded">{t("ui.rounded")}</option>
                                        </select>
                                      </label>
              
                                      <label>
                                        {t("ui.titleSize")}: {titleSize}px
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
            )}

              {workspaceMode === "harmony" && (
                <>
                  <p className="hint" style={{ marginBottom: 10 }}>
                    {t("settings.harmonyIntro")}
                  </p>
                  <section className="control-section">
                    <button
                      className="section-title"
                      onClick={() => toggleSettingsSection("harmony")}
                    >
                      {t("nav.harmony")} <span>{activeSettingsSection === "harmony" ? "−" : "+"}</span>
                    </button>
                    {activeSettingsSection === "harmony" && (
                      <div className="section-content">
                        <fieldset className="tool-fieldset">
                          <legend>{t("settings.diagram")}</legend>
                          <label>
                            {t("settings.chordStyle")}
                            <select value={chordDisplayStyle} onChange={(event) => setChordDisplayStyle(event.target.value as ChordDisplayStyle)}>
                              <option value="compact">C, Cm, Cmaj7</option>
                              <option value="letter">CM, Cm, CM7</option>
                              <option value="words">Cmaj, Cmin, Cmaj7</option>
                            </select>
                          </label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowSeparators} onChange={(event) => setHarmonyShowSeparators(event.target.checked)} /> {t("settings.segmentLines")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowLegend} onChange={(event) => setHarmonyShowLegend(event.target.checked)} /> {t("settings.showLegend")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowExplanation} onChange={(event) => setHarmonyShowExplanation(event.target.checked)} /> {t("settings.showExplanation")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowEnharmonics} onChange={(event) => setHarmonyShowEnharmonics(event.target.checked)} /> {t("settings.showEnharmonics")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowToneTooltips} onChange={(event) => setHarmonyShowToneTooltips(event.target.checked)} /> {t("settings.chordToneTooltips")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyShowNoteRing} onChange={(event) => setHarmonyShowNoteRing(event.target.checked)} /> {t("settings.noteRing")}</label>
                          <label className="check-row"><input type="checkbox" checked={harmonyColorByFamily} onChange={(event) => setHarmonyColorByFamily(event.target.checked)} /> {t("settings.colorByFamily")}</label>

                          <div className="ring-control-block">
                            <strong>{t("settings.outerRings")}</strong>
                            {harmonyAvailableCounts.length === 0 ? (
                              <p className="hint">{t("settings.noRings")}</p>
                            ) : (
                              harmonyAvailableCounts.map((count) => (
                                <label className="check-row" key={`harmony-settings-ring-${count}`}>
                                  <input
                                    type="checkbox"
                                    checked={harmonyRingVisibility[count] ?? count !== 0}
                                    onChange={(event) => setHarmonyRingVisibility((current) => ({ ...current, [count]: event.target.checked }))}
                                  />
                                  {count === 1 ? t("ui.ringSharedSingular") : t("ui.ringShared", { count })}
                                </label>
                              ))
                            )}
                          </div>

                          <label>
                            {t("ui.circleDiameter")}: {harmonyDiameter}px
                            <input type="range" min="600" max="1400" step="20" value={harmonyDiameter} onChange={(event) => setHarmonyDiameter(Number(event.target.value))} />
                          </label>
                          <label>
                            {t("ui.maxFontSize")}: {harmonyFontSize}px
                            <input type="range" min="10" max="30" step="1" value={harmonyFontSize} onChange={(event) => setHarmonyFontSize(Number(event.target.value))} />
                          </label>
                        </fieldset>

                        <fieldset className="tool-fieldset">
                          <legend>{t("ui.playback")}</legend>
                          <SegmentedChoice label={t("ui.chordPlayback")} value={harmonyPlaybackStyle} onChange={setHarmonyPlaybackStyle} options={[{ value: "block", label: t("ui.block") }, { value: "arpeggio", label: t("ui.arpeggio") }]} />
                          <SegmentedChoice label={t("ui.relationshipPlayback")} value={harmonyVoicingStyle} onChange={setHarmonyVoicingStyle} options={[{ value: "root", label: t("ui.selectedOnly") }, { value: "smooth", label: t("ui.referenceRelated") }]} />
                          <p className="hint">{t("ui.harmonySoundHint")}</p>
                        </fieldset>
                      </div>
                    )}
                  </section>
                </>
              )}
              <AboutPanel
                isOpen={activeSettingsSection === "about"}
                onToggle={() => toggleSettingsSection("about")}
              >
                <div className="button-row">
                  <button
                    className="small-button"
                    onClick={downloadCurrentSettings}
                  >
                    {t("settings.saveJson")}
                  </button>
                  <label className="small-button file-button">
                    {t("settings.loadJson")}
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
                  {t("settings.jsonHint")} <code>public/default-settings.json</code>.
                </p>
              </AboutPanel>
            </>
          )}

          {leftPanelMode === "tools" && (
            <>
              {workspaceMode === "harmony" ? (
                <HarmonyExplorerPanel
                  chordDisplayStyle={chordDisplayStyle}
                  isOpen={activeToolSection === "harmonyExplorer"}
                  onToggle={() => toggleToolSection("harmonyExplorer")}
                  referenceFamilyId={harmonyReferenceFamilyId}
                  onReferenceFamilyChange={setHarmonyReferenceFamilyId}
                  relatedFamilyId={harmonyRelatedFamilyId}
                  onRelatedFamilyChange={setHarmonyRelatedFamilyId}
                  scaleId={harmonyScaleId}
                  onScaleChange={setHarmonyScaleId}
                  diatonicOnly={harmonyDiatonicOnly}
                  onDiatonicOnlyChange={setHarmonyDiatonicOnly}
                  highlightDiatonic={harmonyHighlightDiatonic}
                  onHighlightDiatonicChange={setHarmonyHighlightDiatonic}
                  showEnharmonics={harmonyShowEnharmonics}
                  showNoteRing={harmonyShowNoteRing}
                  onShowNoteRingChange={setHarmonyShowNoteRing}
                  selected={harmonySelection}
                  onShowOnStradella={showHarmonySelectionOnStradella}
                  onAddSelectedRelationshipToProgression={addSelectedHarmonyRelationshipToProgression}
                  isRecordingProgression={harmonyProgressionRecording}
                  recordedProgression={harmonyRecordedProgression}
                  onToggleProgressionRecording={toggleHarmonyProgressionRecording}
                  onClearRecordedProgression={clearHarmonyRecordedProgression}
                  onSendRecordedProgressionToAssistant={sendHarmonyRecordedProgressionToAssistant}
                  isRecordedProgressionPlaying={harmonyRecordedProgressionPlaying}
                  onPlayRecordedProgression={playHarmonyRecordedProgression}
                  onStopRecordedProgression={stopHarmonyRecordedProgressionPlayback}
                  onReset={resetHarmonyExplorer}
                />
              ) : (
                <>
              {(isTrebleLikeSide || side === "stradella") && (
                <section className="control-section">
                  <button
                    className="section-title"
                    onClick={() => toggleToolSection("scaleFinder")}
                  >
                    {t("ui.scaleFinder")}{" "}
                    <span>
                      {activeToolSection === "scaleFinder" ? "−" : "+"}
                    </span>
                  </button>

                  {activeToolSection === "scaleFinder" && (
                    <div className="section-content">
                      <p className="hint">
                        {side === "stradella"
                          ? t("ui.scaleIntroBass")
                          : t("ui.scaleIntroTreble")}
                      </p>

                      <fieldset className="tool-fieldset">
                        <label>
                          {t("ui.scaleRoot")}
                          <select
                            value={scaleFinderRoot}
                            onChange={(event) =>
                              setScaleFinderRoot(event.target.value)
                            }
                          >
                            {FINDER_ROOT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {translateKnownLabel(language, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          {t("ui.scaleType")}
                          <select
                            value={scaleFinderPattern}
                            onChange={(event) =>
                              setScaleFinderPattern(
                                event.target.value as FinderScalePattern,
                              )
                            }
                          >
                            {SCALE_FINDER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {translateKnownLabel(language, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span className="label-line">
                            {t("ui.display")}{" "}
                            <HelpTip text={t("ui.scaleDisplayHelp")} />
                          </span>
                          <select
                            value={scaleFinderDisplayMode}
                            onChange={(event) =>
                              setScaleFinderDisplayMode(
                                event.target.value as SequenceDisplayMode,
                              )
                            }
                          >
                            {SEQUENCE_DISPLAY_MODE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {translateKnownLabel(language, option.label)}
                              </option>
                            ))}
                          </select>
                        </label>

                        {isTrebleLikeSide && (
                          <label>
                            {t("ui.rowsUsed")}
                            <select
                              value={scaleFinderRowLimit}
                              onChange={(event) =>
                                setScaleFinderRowLimit(
                                  Number(event.target.value) as 3 | 4 | 5,
                                )
                              }
                            >
                              {SCALE_FINDER_ROW_LIMIT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {translateKnownLabel(language, option.label)}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        <div className="result-card">
                          <div className="result-card-title">
                            {side === "stradella" &&
                            scaleFinderActive &&
                            !stradellaScaleFinderResult.found
                              ? t("common.notFound")
                              : t("ui.scaleButtons", {count: scaleFinderButtons.length})}
                          </div>
                          {side === "stradella" && (
                            <p>
                              {t("ui.targetNotes")}: {" "}
                              {formatStradellaScaleFinderNames(
                                stradellaScaleFinderResult.targetNames,
                                stradellaScaleFinderResult.targetPitches,
                              )}
                              {stradellaScaleFinderResult.missingPitches
                                .length > 0
                                ? ` · ${t("ui.missingShort")}: ${formatStradellaScaleFinderNames(
                                    stradellaScaleFinderResult.missingNames,
                                    stradellaScaleFinderResult.missingPitches,
                                  )}`
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
                            {scaleFinderActive ? t("ui.hideScale") : t("ui.showScale")}
                          </button>

                          <button
                            className="small-button"
                            onClick={playScaleFinder}
                            disabled={scaleFinderButtons.length === 0}
                          >
                            {t("ui.playScale")}
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
                  voicingMode={trebleChordVoicingMode}
                  onVoicingModeChange={setTrebleChordVoicingMode}
                  realizationStatus={chordFinderActive ? trebleChordExplanation.status : t("ui.notShown")}
                  realizationExplanation={trebleChordExplanation.explanation}
                  isActive={chordFinderActive}
                  onToggleActive={() => {
                    setChordFinderActive((current) => !current);
                    setScaleFinderActive(false);
                    setStradellaChordFinderActive(false);
                  }}
                  onPlay={playChordFinder}
                  showVoicingNote={showTrebleVoicingNote}
                  onShowVoicingNoteChange={setShowTrebleVoicingNote}
                />
              )}

              {side === "stradella" && (
                <StradellaChordFinderPanel
                  isOpen={activeToolSection === "stradellaChordFinder"}
                  onToggle={() => toggleToolSection("stradellaChordFinder")}
                  root={stradellaChordFinderRoot}
                  onRootChange={(next) => { setStradellaChordFinderRoot(next); setStradellaChordFinderRequestedBass(null); }}
                  pattern={stradellaChordFinderPattern}
                  onPatternChange={(next) => { setStradellaChordFinderPattern(next); setStradellaChordFinderRequestedBass(null); }}
                  requestedBass={stradellaChordFinderRequestedBass}
                  onRequestedBassChange={setStradellaChordFinderRequestedBass}
                  mode={stradellaChordFinderMode}
                  onModeChange={setStradellaChordFinderMode}
                  markRootBass={stradellaChordFinderMarkRootBass}
                  onMarkRootBassChange={setStradellaChordFinderMarkRootBass}
                  result={stradellaChordFinderResult}
                  chordDisplayStyle={chordDisplayStyle}
                  registerModel={stradellaRegisterModel}
                  maxButtons={finderMaxButtons}
                  onMaxButtonsChange={setFinderMaxButtons}
                  spanColumns={finderSpanColumns}
                  minimumNominalGap={stradellaMinimumNominalGap}
                  onMinimumNominalGapChange={setStradellaMinimumNominalGap}
                  onDownloadAll={downloadAllStradellaRealizations}
                  batchExporting={batchExporting}
                  onSpanColumnsChange={setFinderSpanColumns}
                  showRealizationNote={showFinderRealizationNote}
                  onShowRealizationNoteChange={setShowFinderRealizationNote}
                  noteLevels={stradellaNoteLevels}
                  showVoicingIntervals={showStradellaVoicingIntervals}
                  onShowVoicingIntervalsChange={setShowStradellaVoicingIntervals}
                  onNoteLevelChange={(level, enabled) => setStradellaNoteLevels((current) => ({ ...current, [level]: enabled }))}
                  explanationFontSize={finderExplanationFontSize}
                  onExplanationFontSizeChange={setFinderExplanationFontSize}
                  realizations={stradellaChordFinderRealizations}
                  realizationIndex={Math.min(stradellaChordFinderRealizationIndex, Math.max(0, stradellaChordFinderRealizations.length - 1))}
                  onRealizationChange={setStradellaChordFinderRealizationIndex}
                  buttonCount={stradellaChordFinderButtons.length}
                  playbackButtonCount={
                    stradellaChordFinderPlaybackButtons.length
                  }
                  isActive={stradellaChordFinderActive}
                  onToggleActive={() => {
                    setStradellaChordFinderActive((current) => !current);
                    setScaleFinderActive(false);
                    setChordFinderActive(false);
                  }}
                  onPlay={playStradellaChordFinder}
                  canExploreHarmony={harmonyFamilyForFinderPattern(stradellaChordFinderPattern) !== null}
                  onExploreHarmony={exploreCurrentStradellaChordInHarmony}
                  formatPitches={formatStradellaFinderPitches}
                  formatText={formatStradellaFinderText}
                />
              )}

              {side === "stradella" && (
                <ProgressionAssistantPanel
                  chordDisplayStyle={chordDisplayStyle}
                  isOpen={activeToolSection === "progressionAssistant"}
                  onToggle={() => toggleToolSection("progressionAssistant")}
                  progression={harmonyProgression}
                  plan={harmonyProgressionPlan}
                  manualRoot={harmonyProgressionManualRoot}
                  onManualRootChange={setHarmonyProgressionManualRoot}
                  manualFamilyId={harmonyProgressionManualFamilyId}
                  onManualFamilyChange={setHarmonyProgressionManualFamilyId}
                  allowApproximations={harmonyProgressionAllowApproximations}
                  onAllowApproximationsChange={setHarmonyProgressionAllowApproximations}
                  handMovementWeight={harmonyProgressionHandMovementWeight}
                  onHandMovementWeightChange={setHarmonyProgressionHandMovementWeight}
                  rhythmPattern={harmonyProgressionRhythmPattern}
                  onRhythmPatternChange={setHarmonyProgressionRhythmPattern}
                  tempoBpm={soundSequenceTempoBpm}
                  onTempoBpmChange={setSoundSequenceTempoBpm}
                  previewIndex={harmonyProgressionPreviewIndex}
                  onAddManualChord={addManualHarmonyProgressionChord}
                  onRemoveChord={removeHarmonyProgressionChord}
                  onMoveChord={moveHarmonyProgressionChord}
                  onClear={() => {
                    setHarmonyProgression([]);
                    setHarmonyProgressionPreviewIndex(null);
                  }}
                  onPreviewStep={previewHarmonyProgressionStepOnStradella}
                  onOpenStepInChordFinder={openHarmonyProgressionStepInChordFinder}
                  onPlay={playOptimizedHarmonyProgression}
                  onStop={stopSoundPlayback}
                />
              )}

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("selection")}
                >
                  {t("ui.selection")}{" "}
                  <span>{activeToolSection === "selection" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "selection" && (
                  <div className="section-content">
                    <p className="hint">
                      {t("ui.selectedButtons")}: {" "}
                      <strong>{selectedButtons.length}</strong>
                    </p>

                    <button
                      type="button"
                      className={`small-button ${selectionOnClick ? "active-tool" : ""}`}
                      onClick={() => setSelectionOnClick((current) => !current)}
                    >
                      {selectionOnClick
                        ? t("ui.selectionOnClick")
                        : t("ui.selectionOffClick")}
                    </button>

                    <button
                      type="button"
                      className="small-button"
                      onClick={playSelectedButtons}
                      disabled={selectedButtons.length === 0}
                    >
                      {t("ui.playSelection")}
                    </button>

                    {selectedButtons.length > 0 ? (
                      <div className="selected-list">
                        {selectedButtons.map((button) => (
                          <div key={button.id} className="selected-item">
                            <span>{getMainLabel(button) || t("settings.blank")}</span>
                            <span className="selected-meta">
                              {side === "stradella"
                                ? `${translateKnownLabel(language, stradellaRowLabel(button.kind))}, ${t("ui.columnShort")} ${button.column + 1}`
                                : `${t("ui.rowShort")} ${button.row + 1}, ${t("ui.columnShort")} ${button.column + 1}`}
                            </span>
                            <button
                              type="button"
                              className="selected-remove-button"
                              onClick={() => deselectButton(button.id)}
                              aria-label={t("ui.deselectButton", { button: getMainLabel(button) || t("ui.buttonGeneric") })}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="hint">{t("ui.noButtonsSelected")}</p>
                    )}

                    <button className="small-button" onClick={clearSelection}>
                      {t("ui.clearSelection")}
                    </button>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("fingering")}
                >
                  {t("ui.fingering")}{" "}
                  <span>{activeToolSection === "fingering" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "fingering" && (
                  <div className="section-content">
                    <p className="hint">
                      {t("ui.fingeringIntro")}
                    </p>

                    <label>
                      {t("ui.fingeringValue")}
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
                        ? t("ui.stopClickLabel")
                        : t("ui.startClickLabel")}
                    </button>

                    <label>
                      {t("ui.fingeringPosition")}
                      <select
                        value={fingeringPosition}
                        onChange={(event) =>
                          setFingeringPosition(
                            event.target.value as NumberPosition,
                          )
                        }
                      >
                        <option value="inside-bottom">{t("ui.insideBottom")}</option>
                        <option value="inside-top">{t("ui.insideTop")}</option>
                        <option value="above">{t("ui.aboveButton")}</option>
                      </select>
                    </label>

                    <div className="button-row">
                      <button
                        className="small-button"
                        onClick={applyFingerToSelected}
                      >
                        {t("ui.applyToSelected")}
                      </button>
                      <button
                        className="small-button"
                        onClick={clearFingerForSelected}
                      >
                        {t("ui.clearSelected")}
                      </button>
                      <button
                        className="small-button"
                        onClick={clearAllFingerings}
                      >
                        {t("ui.clearAll")}
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
                  {t("ui.sequence")}{" "}
                  <span>{activeToolSection === "sequences" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "sequences" && (
                  <div className="section-content">
                    <p className="hint">
                      {t("ui.sequenceIntro")}
                    </p>

                    <label>
                      {t("ui.display")}
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
                            {translateKnownLabel(language, option.label)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      {t("ui.arrowColor")}
                      <select
                        value={sequenceColorPreset}
                        onChange={(event) =>
                          setSequenceColorPreset(
                            event.target.value as SequenceColorPreset,
                          )
                        }
                      >
                        <option value="red">{t("ui.red")}</option>
                        <option value="blue">{t("ui.blue")}</option>
                        <option value="black">{t("ui.black")}</option>
                        <option value="grey">{t("ui.grey")}</option>
                        <option value="theme">{t("ui.themeAccent")}</option>
                      </select>
                    </label>

                    <label>
                      {t("ui.arrowThickness")}: {sequenceThickness.toFixed(1)}
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
                      {t("ui.arrowheadSize")}: {sequenceArrowheadSize.toFixed(1)}
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
                      {t("ui.numberColor")}
                      <select
                        value={sequenceNumberColorPreset}
                        onChange={(event) =>
                          setSequenceNumberColorPreset(
                            event.target.value as SequenceColorPreset,
                          )
                        }
                      >
                        <option value="red">{t("ui.red")}</option>
                        <option value="blue">{t("ui.blue")}</option>
                        <option value="black">{t("ui.black")}</option>
                        <option value="grey">{t("ui.grey")}</option>
                        <option value="theme">{t("ui.themeAccent")}</option>
                      </select>
                    </label>

                    <label>
                      {t("ui.numberPosition")}
                      <select
                        value={sequenceNumberPosition}
                        onChange={(event) =>
                          setSequenceNumberPosition(
                            event.target.value as NumberPosition,
                          )
                        }
                      >
                        <option value="above">{t("ui.aboveButton")}</option>
                        <option value="inside-top">{t("ui.insideTop")}</option>
                        <option value="inside-bottom">{t("ui.insideBottom")}</option>
                        <option value="none">{t("ui.noNumbers")}</option>
                      </select>
                    </label>

                    <label>
                      {t("ui.numberFontSize")}: {sequenceNumberFontSize}px
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
                        ? t("tools.stopRecording")
                        : t("ui.recordSequence")}
                    </button>

                    <p className="hint">
                      {t("ui.sequenceLength")} <strong>{sequenceSteps.length}</strong>
                    </p>

                    <div className="button-row">
                      <button
                        className="small-button"
                        onClick={playRecordedSequence}
                        disabled={sequenceSteps.length === 0}
                      >
                        {t("ui.playSequence")}
                      </button>
                      <button
                        className="small-button"
                        onClick={stopSoundPlayback}
                      >
                        {t("ui.stop")}
                      </button>
                      <button className="small-button" onClick={clearSequence}>
                        {t("ui.clearSequence")}
                      </button>
                    </div>

                    <details className="compact-help-details">
                      <summary>{t("ui.notationHelp")}</summary>
                      <p>
                        {t("ui.sequenceNotationHint")}
                      </p>
                    </details>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("annotateDiagram")}
                >
                  {t("ui.annotateDiagram")}{" "}
                  <span>{activeToolSection === "annotateDiagram" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "annotateDiagram" && (
                  <div className="section-content">
                    <p className="hint">
                      {t("ui.annotateHintDetailed")}
                    </p>

                    <label>
                      {t("ui.buttonPosition")}
                      <select
                        value={annotationButtonAnchor}
                        onChange={(event) =>
                          setAnnotationButtonAnchor(
                            event.target.value as DiagramAnnotationAnchor,
                          )
                        }
                      >
                        <option value="center">{t("ui.center")}</option>
                        <option value="top">{t("ui.top")}</option>
                        <option value="bottom">{t("ui.bottom")}</option>
                        <option value="left">{t("ui.left")}</option>
                        <option value="right">{t("ui.right")}</option>
                        <option value="topLeft">{t("ui.topLeft")}</option>
                        <option value="topRight">{t("ui.topRight")}</option>
                        <option value="bottomLeft">{t("ui.bottomLeft")}</option>
                        <option value="bottomRight">{t("ui.bottomRight")}</option>
                      </select>
                    </label>

                    <label>
                      {t("ui.annotateTextSize")}: {textNoteFontSize}px
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
                      {t("ui.distanceFromCenter")}: {annotationOffsetPercent}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={annotationOffsetPercent}
                        onChange={(event) =>
                          setAnnotationOffsetPercent(Number(event.target.value))
                        }
                      />
                    </label>

                    <div className="annotation-style-toggles" aria-label={t("ui.annotationStyle")}>
                      <button
                        type="button"
                        className={annotationBold ? "style-toggle active" : "style-toggle"}
                        onClick={() => setAnnotationBold((current) => !current)}
                        aria-pressed={annotationBold}
                        title={t("ui.bold")}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        className={annotationItalic ? "style-toggle active" : "style-toggle"}
                        onClick={() => setAnnotationItalic((current) => !current)}
                        aria-pressed={annotationItalic}
                        title={t("ui.italic")}
                      >
                        <em>I</em>
                      </button>
                    </div>

                    <label>
                      {t("ui.textColor")}
                      <input
                        type="color"
                        value={textNoteColor}
                        onChange={(event) => setTextNoteColor(event.target.value)}
                      />
                    </label>

                    <label>
                      {t("ui.font")}
                      <select
                        value={textNoteFont}
                        onChange={(event) =>
                          setTextNoteFont(event.target.value as FontFamily)
                        }
                      >
                        <option value="system">{t("ui.system")}</option>
                        <option value="serif">{t("ui.serif")}</option>
                        <option value="mono">{t("ui.mono")}</option>
                        <option value="rounded">{t("ui.rounded")}</option>
                      </select>
                    </label>

                    <div className="annotation-list-block">
                      <div className="annotation-list-header">
                        <span>{t("ui.annotations")}</span>
                        <strong>{textNotes.length}</strong>
                      </div>

                      {textNotes.length === 0 ? (
                        <p className="hint">
                          {t("ui.noAnnotationsYetClickTheDiagramToAddOne")}
                        </p>
                      ) : (
                        <ul className="annotation-list">
                          {textNotes.map((note, index) => (
                            <li key={note.id} className="annotation-list-item">
                              <div className="annotation-list-text">
                                <strong>{index + 1}. {annotationPreview(note)}</strong>
                                <span>{annotationLocationLabel(note)}</span>
                              </div>
                              <button
                                type="button"
                                className="annotation-delete-button"
                                onClick={() => deleteTextNote(note.id)}
                                aria-label={t("ui.deleteAnnotation", { count: index + 1 })}
                                title={t("ui.deleteAnnotationTooltip")}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button
                      className="small-button"
                      onClick={clearTextNotes}
                      disabled={textNotes.length === 0}
                    >
                      {t("ui.clearAnnotations")}
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
                    {t("ui.bassPatternPlayer")}{" "}
                    <span>
                      {activeToolSection === "bassPatternPlayer" ? "−" : "+"}
                    </span>
                  </button>

                  {activeToolSection === "bassPatternPlayer" && (
                    <div className="section-content">
                      <p className="hint">
                        {t("ui.playsStradellaBassPatternsOverAChordProgression")}
                      </p>

                      <label>
                        {t("ui.progression")}
                        <select
                          value={chordProgressionId}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setChordProgressionId(event.target.value);
                          }}
                        >
                          {chordProgressionDefinitions.map((progression) => (
                            <option key={progression.id} value={progression.id}>
                              {formatProgressionOptionLabel(progression, language)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {t("ui.root")}
                        <select
                          value={bassPatternRoot}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternRoot(event.target.value);
                          }}
                        >
                          {FINDER_ROOT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {translateKnownLabel(language, option.label)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        {t("ui.rhythm")}
                        <select
                          value={bassPatternId}
                          onChange={(event) => {
                            stopBassPatternPlayback();
                            setBassPatternId(event.target.value);
                          }}
                        >
                          {bassPatternDefinitions.map((pattern) => (
                            <option key={pattern.id} value={pattern.id}>
                              {bassPatternName(pattern.id, pattern.name, language)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <SegmentedChoice label={<>{t("ui.chordVoicing")} <HelpTip text={t("ui.simpleFullVoicingHelp")} /></>} value={bassPatternChordVoicing} onChange={(next) => { stopBassPatternPlayback(); setBassPatternChordVoicing(next); }} options={[{ value: "simple", label: t("ui.simple") }, { value: "full", label: t("ui.full") }]} />

                      <div className="compact-control-grid">
                        <label>
                          {t("ui.repeatsPerChord")}: {bassPatternBarsPerChord}
                          <input
                            type="range"
                            min={1}
                            max={8}
                            step={1}
                            value={bassPatternBarsPerChord}
                            onChange={(event) => {
                              stopBassPatternPlayback();
                              setBassPatternBarsPerChord(
                                Number(event.target.value),
                              );
                            }}
                          />
                        </label>

                        <label>
                          {t("ui.tempo")}: {bassPatternTempoBpm} {t("ui.tempoUnits")}
                          <input
                            type="range"
                            min={50}
                            max={220}
                            step={1}
                            value={bassPatternTempoBpm}
                            onChange={(event) =>
                              setBassPatternTempoBpm(Number(event.target.value))
                            }
                          />
                        </label>
                      </div>

                      <div className="compact-control-grid">
                        <label>
                          {t("ui.playbackRepeat")}
                          <select
                            value={bassPatternRepeatSelection}
                            onChange={(event) =>
                              setBassPatternRepeatSelection(event.target.value)
                            }
                          >
                            <option value="1">{t("ui.firstTime")}</option>
                            <option value="2">{t("ui.twoTimes")}</option>
                            <option value="4">{t("ui.fourTimes")}</option>
                            <option value="loop">{t("ui.loopUntilStopped")}</option>
                          </select>
                        </label>
                      </div>

                      <div className="result-card">
                        <div className="result-card-title">
                          {selectedBassPattern ? bassPatternName(selectedBassPattern.id, selectedBassPattern.name, language) : t("ui.noPattern")}
                        </div>
                        <p>
                          {selectedChordProgression ? progressionName(selectedChordProgression.id, selectedChordProgression.name, language) :
                            t("ui.noProgression")}{" "}
                          · {t("ui.patternBars")}:{" "}
                          {selectedBassPattern
                            ? patternBarCount(selectedBassPattern)
                            : 1}{" "}
                          · {bassPatternBarsPerChord} {t("ui.repeatPerChord")} ·
                          {t("ui.length")}: {bassPatternTotalBeats.toFixed(1)} {t("ui.meterUnits")}
                          {bassPatternMissingText
                            ? ` · ${t("ui.missingShort")}: ${bassPatternMissingText}`
                            : ""}
                        </p>
                        {bassPatternValidationErrors.length > 0 && (
                          <div className="bass-pattern-errors" role="alert">
                            <strong>{t("ui.patternErrors")}</strong>
                            <ul>
                              {bassPatternValidationErrors
                                .slice(0, 6)
                                .map((message) => (
                                  <li key={message}>{message}</li>
                                ))}
                            </ul>
                            {bassPatternValidationErrors.length > 6 && (
                              <p>
                                {t("ui.andMore", { count: bassPatternValidationErrors.length - 6 })}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedBassPattern?.tags &&
                          selectedBassPattern.tags.length > 0 && (
                            <p className="hint">
                              {t("ui.tags")}: {selectedBassPattern.tags.join(", ")}
                            </p>
                          )}
                      </div>

                      <details className="compact-help-details">
                        <summary>{t("ui.notationHelp")}</summary>
                        <p>
                          {t("ui.bassPatternNotationHelp")}
                        </p>
                      </details>

                      <div className="button-row">
                        <button
                          type="button"
                          className={`small-button ${bassPatternPlaybackState === "playing" ? "active-tool" : ""}`}
                          onClick={scheduleBassPatternPlayback}
                          disabled={bassPatternEvents.length === 0}
                        >
                          {t("ui.playPattern")}
                        </button>
                        <button
                          type="button"
                          className="small-button"
                          onClick={stopBassPatternPlayback}
                        >
                          {t("ui.stop")}
                        </button>
                        <div className="compact-export-row">
                          <span>{t("ui.export")}</span>
                          <select
                            value={bassPatternExportFormat}
                            onChange={(event) =>
                              setBassPatternExportFormat(
                                event.target.value as
                                  | "abc"
                                  | "midi"
                                  | "lilypond",
                              )
                            }
                            aria-label={t("ui.stradellaExportFormat")}
                          >
                            <option value="abc">ABC</option>
                            <option value="midi">MIDI</option>
                            <option value="lilypond">LilyPond</option>
                          </select>
                          <button
                            type="button"
                            className="small-button compact-export-download"
                            onClick={exportSelectedBassPattern}
                            disabled={bassPatternEvents.length === 0}
                          >
                            {t("ui.download")}
                          </button>
                        </div>
                      </div>

                      <div
                        className={`result-card bass-pattern-editor ${bassPatternEditorExpanded ? "expanded" : "collapsed"}`}
                      >
                        <button
                          type="button"
                          className="inline-section-toggle"
                          onClick={() =>
                            setBassPatternEditorExpanded((current) => !current)
                          }
                        >
                          <span>{t("ui.customPatternEditor")}</span>
                          <span>{bassPatternEditorExpanded ? "−" : "+"}</span>
                        </button>
                        {bassPatternEditorExpanded && (
                          <>
                            <p className="hint">
                              {t("ui.patternEditorIntro")}
                            </p>
                            <textarea
                              value={bassPatternEditorText}
                              onChange={(event) =>
                                setBassPatternEditorText(event.target.value)
                              }
                              rows={12}
                              spellCheck={false}
                            />
                            {bassPatternEditorErrors.length > 0 ? (
                              <div className="bass-pattern-errors" role="alert">
                                <strong>{t("ui.editorValidation")}</strong>
                                <ul>
                                  {bassPatternEditorErrors
                                    .slice(0, 4)
                                    .map((message) => (
                                      <li key={message}>{message}</li>
                                    ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="hint">{t("ui.editorValidationOK")}</p>
                            )}
                            {bassPatternEditorMessage && (
                              <p className="hint">{bassPatternEditorMessage}</p>
                            )}
                            <div className="button-row">
                              <button
                                type="button"
                                className="small-button"
                                onClick={loadSelectedPatternIntoEditor}
                              >
                                {t("ui.loadSelected")}
                              </button>
                              <button
                                type="button"
                                className="small-button"
                                onClick={saveCustomBassPattern}
                                disabled={bassPatternEditorErrors.length > 0}
                              >
                                {t("ui.saveCustom")}
                              </button>
                              <button
                                type="button"
                                className="small-button"
                                onClick={removeSelectedCustomBassPattern}
                                disabled={
                                  !customBassPatternDefinitions.some(
                                    (pattern) => pattern.id === bassPatternId,
                                  )
                                }
                              >
                                {t("ui.removeCustom")}
                              </button>
                            </div>
                          </>
                        )}
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
                    {t("ui.abcDefault")}{" "}
                    <span>{activeToolSection === "abcPlayer" ? "−" : "+"}</span>
                  </button>

                  {activeToolSection === "abcPlayer" && (
                    <div className="section-content abc-player-panel">
                      <p className="hint">
                        {side === "stradella"
                          ? t("ui.abcIntroStradella")
                          : t("ui.abcIntroTreble")}
                      </p>

                      {side === "stradella" && (
                        <label>
                          <span className="label-line">
                            {t("ui.abcStradellaMapping")}{" "}
                            <HelpTip text={t("ui.abcStradellaMappingHelp")} />
                          </span>
                          <select
                            value={abcStradellaMode}
                            onChange={(event) => {
                              pauseAbcPlayback();
                              setAbcActiveButtonIds([]);
                              setAbcStradellaMode(
                                event.target.value as AbcStradellaMode,
                              );
                            }}
                          >
                            <option value="bass-notes-only">
                              {t("ui.bassNotesOnly")}
                            </option>
                            <option value="chord-symbols-only">
                              {t("ui.chordSymbolsOnly")}
                            </option>
                            <option value="bass-notes-and-chord-symbols">
                              {t("ui.bassNotesChordSymbols")}
                            </option>
                          </select>
                        </label>
                      )}

                      {isTrebleLikeSide && (
                        <SegmentedChoice label={<>{t("ui.chordSymbols")} <HelpTip text={t("ui.abcTrebleSymbolsHelp")} /></>} value={abcTrebleChordSymbolsMode} onChange={(next) => { pauseAbcPlayback(); setAbcActiveButtonIds([]); setAbcTrebleChordSymbolsMode(next); }} options={[{ value: "ignore", label: t("ui.ignore") }, { value: "play", label: t("tools.play") }]} />
                      )}

                      <label>
                        {t("ui.exampleTune")}
                        <select
                          value={abcExampleValue}
                          onChange={(event) =>
                            void loadAbcExample(event.target.value)
                          }
                        >
                          {abcExampleOptions.map((option) => (
                            <option
                              key={option.value || "empty"}
                              value={option.value}
                            >
                              {option.value === "" ? t("ui.chooseExample") : abcExampleName(option.value, option.label, language)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="button-row">
                        <label className="small-button file-button">
                          {t("ui.loadAbcFile")}
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
                          {t("ui.clearABC")}
                        </button>
                      </div>

                      {abcFileName && (
                        <p className="hint">{t("ui.file")}: {abcFileName}</p>
                      )}

                      <label>
                        {t("ui.tempo")}: {abcTempoBpm} BPM
                        <input
                          type="range"
                          min={40}
                          max={220}
                          step={1}
                          value={abcTempoBpm}
                          onChange={(event) =>
                            setAbcTempoBpm(Number(event.target.value))
                          }
                        />
                      </label>

                      <label>
                        {t("ui.position")}
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
                          {abcText.trim()
                            ? abcParseResult.title
                            : t("ui.noAbcLoaded")}
                        </div>
                        {abcParseResult.errors.length > 0 ? (
                          <p>{abcParseResult.errors.join(" ")}</p>
                        ) : (
                          <p>
                            {t("ui.events")}: {abcMappedEvents.length} · {t("ui.key")}: {" "}
                            {abcParseResult.key}
                            {abcParseResult.voiceIds.length > 1
                              ? ` · ${t("ui.voice")}: ${side === "stradella" ? "2" : "1"}`
                              : ""} · {t("ui.length")}: {" "}
                            {abcTotalBeats.toFixed(1)} {t("ui.beats")}
                            {abcMissingPitchText
                              ? ` · ${side === "stradella" ? t("ui.unavailableNotes") : t("ui.missingShort")}: ${abcMissingPitchText}`
                              : ""}
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
                          {abcPlaybackState === "paused" ? t("ui.continue") : t("tools.play")}
                        </button>
                        <button
                          className="small-button"
                          type="button"
                          onClick={pauseAbcPlayback}
                          disabled={abcPlaybackState !== "playing"}
                        >
                          {t("ui.pause")}
                        </button>
                        <button
                          className="small-button"
                          type="button"
                          onClick={stopAbcPlayback}
                          disabled={
                            abcPlaybackState === "stopped" &&
                            abcPositionBeat === 0
                          }
                        >
                          {t("ui.stop")}
                        </button>
                      </div>

                      <details className="compact-help-details">
                        <summary>{t("ui.notationHelp")}</summary>
                        <p>
                          {t("ui.abcNotationInstructions")}
                        </p>
                      </details>

                      <div
                        className={`result-card abc-editor ${abcEditorExpanded ? "expanded" : "collapsed"}`}
                      >
                        <button
                          type="button"
                          className="inline-section-toggle"
                          onClick={() =>
                            setAbcEditorExpanded((current) => !current)
                          }
                        >
                          <span>{t("ui.abcEditor")}</span>
                          <span>{abcEditorExpanded ? "−" : "+"}</span>
                        </button>
                        {abcEditorExpanded && (
                          <label>
                            {t("ui.abcText")}
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
                              placeholder={
                                "X:1\nT:Simple tune\nM:4/4\nL:1/4\nQ:120\nK:C\nC D E F | G A B c |"
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

                </>
              )}
            </>
          )}
        </aside>
      )}

      <section className="workspace">
        <div className="topbar">
          <button
            className={`topbar-button ${workspaceMode === "accordion" && side === "stradella" ? "active" : ""}`}
            onClick={() => {
              setWorkspaceMode("accordion");
              setSide("stradella");
              stopAbcPlayback();
            }}
          >
            {t("nav.stradella")}
          </button>

          <button
            className={`topbar-button ${workspaceMode === "accordion" && side === "treble" ? "active" : ""}`}
            onClick={() => {
              setWorkspaceMode("accordion");
              setSide("treble");
              stopAbcPlayback();
            }}
          >
            {t("nav.treble")}
          </button>

          <button
            className={`topbar-button ${workspaceMode === "harmony" ? "active" : ""}`}
            onClick={() => {
              setWorkspaceMode("harmony");
              setLeftPanelMode("tools");
              setActiveToolSection("harmonyExplorer");
              stopAbcPlayback();
              stopBassPatternPlayback();
              stopAllSound();
            }}
          >
            {t("nav.harmony")}
          </button>

          <span className="topbar-separator" />

          <button
            className={`topbar-button ${leftPanelMode === "settings" ? "active" : ""}`}
            onClick={() => setPanel("settings")}
          >
            {t("nav.settings")}
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "tools" ? "active" : ""}`}
            onClick={() => setPanel("tools")}
          >
            {t("nav.tools")}
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "hidden" ? "active" : ""}`}
            onClick={() =>
              setLeftPanelMode((current) =>
                current === "hidden" ? (workspaceMode === "harmony" ? "tools" : "settings") : "hidden",
              )
            }
            title={t("nav.focusHint")}
          >
            {leftPanelMode === "hidden" ? t("nav.showControls") : t("nav.focusDiagram")}
          </button>

          {workspaceMode === "accordion" &&
            side === "stradella" &&
            activeToolSection === "bassPatternPlayer" &&
            bassPatternEvents.length > 0 && (
              <>
                <button
                  className={`topbar-button ${bassPatternRenderedNotationVisible ? "active" : ""}`}
                  onClick={toggleBassPatternNotation}
                >
                  {bassPatternRenderedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
                </button>
              </>
            )}

          {workspaceMode === "harmony" && harmonyRecordedProgression.length > 0 && (
            <button
              className={`topbar-button ${harmonyRecordedNotationVisible ? "active" : ""}`}
              onClick={toggleHarmonyRecordedNotation}
            >
              {harmonyRecordedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
            </button>
          )}

          {workspaceMode === "accordion" &&
            side === "stradella" &&
            activeToolSection === "progressionAssistant" &&
            harmonyProgressionPlan.playable && (
              <button
                className={`topbar-button ${harmonyProgressionNotationVisible ? "active" : ""}`}
                onClick={toggleHarmonyProgressionNotation}
              >
                {harmonyProgressionNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
              </button>
            )}

          {workspaceMode === "accordion" && activeToolSection === "abcPlayer" && abcText.trim() && (
            <button
              className={`topbar-button ${abcRenderedNotationVisible ? "active" : ""}`}
              onClick={toggleAbcNotation}
            >
              {abcRenderedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
            </button>
          )}

          {workspaceMode === "accordion" && activeToolSection === "sequences" &&
            sequenceStepsWithButtons.length > 0 && (
              <button
                className={`topbar-button ${sequenceRenderedNotationVisible ? "active" : ""}`}
                onClick={toggleSequenceNotation}
              >
                {sequenceRenderedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
              </button>
            )}

          <span className="topbar-spacer" />

          <button
            className={`topbar-button ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled((current) => !current)}
          >
            {soundEnabled ? t("ui.soundOn") : t("ui.soundOff")}
          </button>

          <details ref={resetMenuRef} className="reset-menu">
            <summary className="topbar-button reset-button" title={t("ui.resetScope")}>
              {t("ui.reset")} <span aria-hidden="true">▾</span>
            </summary>
            <div className="reset-menu-options">
              <button type="button" onClick={(event) => {
                if (workspaceMode === "harmony") clearHarmonyWork(); else resetDiagramWork();
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}>{t("ui.clearCurrentWork")}</button>
              {(workspaceMode === "harmony" || (side === "stradella" && activeToolSection === "stradellaChordFinder")) && (
                <button type="button" onClick={(event) => {
                  resetCurrentToolDefaults();
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}>{t("ui.restoreToolDefaults")}</button>
              )}
            </div>
          </details>

          <span className="topbar-after-reset-space" aria-hidden="true" />

          <div className="topbar-format-choice">
            <SegmentedChoice label={t("ui.downloadFormat")} value={downloadFormat} onChange={setDownloadFormat}
              options={[{ value: "svg", label: "SVG" }, { value: "png", label: "PNG" }]} />
          </div>

          <button
            className="topbar-button download-button"
            onClick={downloadCurrentDiagram}
          >
            {t("ui.downloadKind", { kind: downloadFormat.toUpperCase() })}
          </button>
        </div>

        {showStatusBar && workspaceMode === "accordion" && (
          <div className="status-bar" title={statusBarText}>
            {statusBarText}
          </div>
        )}
        {showStatusBar && workspaceMode === "harmony" && (
          <div className="status-bar">
            {harmonyStatusText({
              referenceFamilyId: harmonyReferenceFamily.id,
              referenceFamilyEnglishName: harmonyReferenceFamily.name,
              relatedFamilyId: harmonyRelatedFamilyId,
              relatedFamilyEnglishName: harmonyRelatedName,
              scaleId: harmonyScale.id,
              scaleEnglishName: harmonyScale.name,
              soundEnabled, language,
            })}
          </div>
        )}

        {workspaceMode === "accordion" && (
          <div className="mobile-diagram-view-control">
            <SegmentedChoice
              label={t("ui.mobileDiagram")}
              value={mobileDiagramView}
              onChange={setMobileDiagramView}
              options={[
                { value: "readable", label: t("ui.readableScroll") },
                { value: "fit", label: t("ui.fitDiagram") },
              ]}
            />
          </div>
        )}

        {workspaceMode === "harmony" ? (
          <>
            {harmonyAvailableCounts.length === 0 && (
              <div className="harmony-empty-result">
                {t("ui.noChordRelationshipsSatisfyTheCurrentHarmonicFilter")}
              </div>
            )}
            {harmonyAvailableCounts.length > 0 && harmonyCounts.length === 0 && (
              <div className="harmony-empty-result">
                {t("ui.allAvailableOuterRingsAreHiddenReEnableAtLeastOneRingInHarmonyExplorer")}
              </div>
            )}
            <div className="canvas-wrap harmony-canvas-wrap">
              <div
                className="harmony-svg-host"
                style={{
                  width: `${harmonyDiameter + (harmonyShowLegend || harmonyShowExplanation ? Math.max(460, harmonyDiameter * 0.65) : 0)}px`,
                }}
              >
                <HarmonicCircle
                  chordDisplayStyle={chordDisplayStyle}
                  sectors={harmonySectors}
                  counts={harmonyCounts}
                  referenceFamilyId={harmonyReferenceFamilyId}
                  relatedFamilyName={harmonyRelatedDisplayName(harmonyRelatedFamilyId, harmonyRelatedName, language)}
                  allFamiliesMode={harmonyAllFamiliesMode}
                  scaleId={harmonyScaleId}
                  diatonicOnly={harmonyEffectiveDiatonicOnly}
                  highlightDiatonic={harmonyEffectiveHighlightDiatonic}
                  showEnharmonics={harmonyShowEnharmonics}
                  showSeparators={harmonyShowSeparators}
                  showLegend={harmonyShowLegend}
                  showExplanation={harmonyShowExplanation}
                  explanation={harmonyExplanation}
                  showToneTooltips={harmonyShowToneTooltips}
                  showNoteRing={harmonyShowNoteRing}
                  colorByFamily={harmonyColorByFamily}
                  diameter={harmonyDiameter}
                  fontSize={harmonyFontSize}
                  playbackStyle={harmonyPlaybackStyle}
                  voicingStyle={harmonyVoicingStyle}
                  svgRef={harmonySvgRef}
                  focusedReferenceRootPc={harmonyFocusedReferenceRootPc}
                  onPlayChord={playHarmonyChord}
                  onPlayNote={playHarmonyNote}
                  onChordActivated={handleHarmonyChordActivated}
                  onPlayRelationship={playHarmonyChordRelationship}
                  onSelectionChange={setHarmonySelection}
                />
              </div>
            </div>
          </>
        ) : (
        <div
          className={`canvas-wrap ${mobileDiagramView === "readable" ? "diagram-readable" : "diagram-fit"}`}
          style={{ "--mobile-diagram-readable-width": `${Math.max(960, viewWidth * 0.75)}px` } as CSSProperties}
        >
          <svg
            ref={svgRef}
            preserveAspectRatio="xMinYMin meet"
            className={`diagram diagram-theme-${colorTheme} accidental-style-${accidentalStyle} ${activeToolSection === "annotateDiagram" ? "annotating-diagram" : ""}`}
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
                style={{ fontSize: effectiveTitleSize }}
              >
                {finalTitle}
              </text>
            )}

            {(finderFooterEnabled || trebleFooterEnabled) && (
              <foreignObject
                x={32}
                y={trebleFooterEnabled ? trebleFooterY : stradellaFinderFooterY}
                width={viewWidth - 64}
                height={trebleFooterEnabled && buttonTrebleFooter ? trebleFooterHeight : trebleFooterEnabled ? 128 : finderFooterHeight}
              >
                <div style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: `${trebleFooterEnabled ? trebleFooterFontSize : finderExplanationFontSize}px`,
                  fontWeight: trebleFooterEnabled ? 600 : 400,
                  textAlign: finderFooterEnabled ? "left" : "center",
                  lineHeight: finderFooterEnabled ? 1.3 : 1.15,
                  overflowWrap: "anywhere", color: "#20252a",
                }}>
                  {finderFooterEnabled
                    ? (
                      <div className="finder-annotation-block">
                        {finderAnnotationDisplayLines.map((line, index) => {
                          const level = annotationLevelForLine(line);
                          const colon = line.indexOf(":");
                          const label = colon > 0 ? line.slice(0, colon + 1) : "";
                          const value = colon > 0 ? line.slice(colon + 1).trim() : line;
                          const showVoicingChart = level === "voicing" && finderVoicingChartVisible && finderVoicingAnalysis;
                          return (
                            <div
                              key={`${level ?? "line"}-${index}`}
                              className={`finder-annotation-line${showVoicingChart ? " finder-annotation-line-voicing" : ""}`}
                            >
                              {label && (
                                <div className="finder-annotation-label">
                                  <strong>{label}</strong>
                                </div>
                              )}
                              <div className="finder-annotation-value">
                                {showVoicingChart ? (
                                  <StradellaVoicingIntervals
                                    notes={finderVoicingAnalysis.notes}
                                    root={stradellaChordFinderRoot}
                                    pattern={stradellaChordFinderPattern}
                                    fontSize={finderExplanationFontSize}
                                  />
                                ) : value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                    : trebleVoicingNote}
                </div>
              </foreignObject>
            )}

            {showBellowsGuide && (
              <>
                <text
                  x="76"
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  {bellowsStartLabel}
                </text>

                <text
                  x={viewWidth / 2}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-label"
                >
                  {t("ui.bellows")}
                </text>

                <text
                  x={viewWidth - 76}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  {bellowsEndLabel}
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
                    {stradellaDiagramRowLabel(kind, stradellaRowLabel(kind), language)}
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
              const isPianoKey =
                button.visualShape?.startsWith("piano-") ?? false;
              const isPianoBlackKey = button.visualShape === "piano-black-key";
              const sequenceLabels = getSequenceLabelsForButton(
                sequenceSteps,
                button.id,
              );
              const scaleFinderLabels = showScaleFinderNumbers
                ? finderLabelsForButton(scaleFinderButtons, button.id)
                : "";
              const finderMatch = finderButtonIds.has(button.id) || progressionPreviewButtonIds.has(button.id);
              const abcMatch =
                abcActiveButtonIdSet.has(button.id) ||
                bassPatternActiveButtonIdSet.has(button.id) ||
                harmonyProgressionActiveButtonIdSet.has(button.id);
              const primaryFinderMatch =
                stradellaChordFinderActive &&
                stradellaPrimaryFinderButtonIds.has(button.id);
              const rootBassFinderMatch =
                stradellaChordFinderActive &&
                stradellaRootBassFinderButtonIds.has(button.id);

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
                          isPianoBlackKey
                            ? "piano-black-key"
                            : "piano-white-key",
                          overlay.selected ? "selected" : "",
                          finderMatch ? "finder-match" : "",
                          abcMatch ? "abc-match" : "",
                          primaryFinderMatch ? "finder-primary" : "",
                          rootBassFinderMatch ? "finder-root-bass" : "",
                          sequenceLabels || scaleFinderLabels
                            ? "in-sequence"
                            : "",
                        ].join(" ")}
                      />
                      {(finderMatch || abcMatch) && (
                        <rect
                          x={
                            button.x - (button.width ?? buttonSize * 2) / 2 + 3
                          }
                          y={
                            button.y - (button.height ?? buttonSize * 2) / 2 + 3
                          }
                          width={(button.width ?? buttonSize * 2) - 6}
                          height={(button.height ?? buttonSize * 2) - 6}
                          rx={isPianoBlackKey ? 4 : 6}
                          className={
                            abcMatch
                              ? "finder-ring abc-ring"
                              : rootBassFinderMatch
                                ? "finder-ring finder-root-bass-ring"
                                : primaryFinderMatch
                                  ? "finder-ring finder-primary-ring"
                                  : "finder-ring"
                          }
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
                          sequenceLabels || scaleFinderLabels
                            ? "in-sequence"
                            : "",
                        ].join(" ")}
                      />
                      {(finderMatch || abcMatch) && (
                        <circle
                          cx={button.x}
                          cy={button.y}
                          r={buttonSize + 4}
                          className={
                            abcMatch
                              ? "finder-ring abc-ring"
                              : rootBassFinderMatch
                                ? "finder-ring finder-root-bass-ring"
                                : primaryFinderMatch
                                  ? "finder-ring finder-primary-ring"
                                  : "finder-ring"
                          }
                        />
                      )}
                    </>
                  )}

                  {showButtonLabels && (
                    <text
                      x={button.x}
                      y={
                        isPianoKey
                          ? button.y +
                            (button.height ?? buttonSize * 2) / 2 -
                            18
                          : button.y -
                            (overlay.finger || sequenceLabels ? 2 : 0)
                      }
                      textAnchor="middle"
                      className={[
                        "main-label",
                        fontClass(labelFont),
                        isTreble ? "treble-label" : "",
                        isTrebleAccidental || isPianoBlackKey
                          ? "treble-accidental-label"
                          : "",
                        (isTrebleAccidental || isPianoBlackKey) && (finderMatch || abcMatch)
                          ? "highlighted-accidental-label"
                          : "",
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

                  {activeToolSection === "annotateDiagram" && !isPianoKey && (() => {
                    const point = annotationPointForButton(button, annotationButtonAnchor);
                    return (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={Math.max(5, buttonSize * 0.24)}
                        className="annotation-anchor-placeholder"
                      />
                    );
                  })()}

                  {activeToolSection === "annotateDiagram" && isPianoKey && (() => {
                    const point = annotationPointForButton(button, annotationButtonAnchor);
                    const markerSize = Math.max(10, buttonSize * 0.42);
                    return (
                      <rect
                        x={point.x - markerSize / 2}
                        y={point.y - markerSize / 2}
                        width={markerSize}
                        height={markerSize}
                        rx="4"
                        className="annotation-anchor-placeholder"
                      />
                    );
                  })()}

                  {overlay.finger && (
                    <text
                      x={button.x}
                      y={fingeringY(button.y, buttonSize, fingeringPosition)}
                      textAnchor="middle"
                      className={[
                        "finger-label",
                        fontClass(labelFont),
                        isTrebleAccidental ? "treble-accidental-label" : "",
                        isTrebleAccidental && (finderMatch || abcMatch)
                          ? "highlighted-accidental-label"
                          : "",
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
                style={{
                  fontSize: note.fontSize,
                  fill: note.color,
                  fontWeight: note.bold ? 800 : 500,
                  fontStyle: note.italic ? "italic" : undefined,
                }}
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

            {inlineAnnotationEditor && (() => {
              const editorWidth = 180;
              const editorHeight = 68;
              const editorX = Math.max(8, Math.min(inlineAnnotationEditor.x - editorWidth / 2, viewWidth - editorWidth - 8));
              const editorY = Math.max(8, Math.min(inlineAnnotationEditor.y - editorHeight / 2, viewHeight - editorHeight - 8));

              return (
                <foreignObject
                  x={editorX}
                  y={editorY}
                  width={editorWidth}
                  height={editorHeight}
                  className="annotation-editor-object"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="annotation-editor">
                    <textarea
                      ref={annotationEditorRef}
                      value={inlineAnnotationEditor.text}
                      placeholder={t("ui.annotationPlaceholder")}
                      style={{
                        fontSize: inlineAnnotationEditor.fontSize,
                        color: inlineAnnotationEditor.color,
                        fontWeight: inlineAnnotationEditor.bold ? 800 : 500,
                        fontStyle: inlineAnnotationEditor.italic ? "italic" : undefined,
                      }}
                      onChange={(event) =>
                        setInlineAnnotationEditor((current) =>
                          current ? { ...current, text: event.target.value } : current,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          commitInlineAnnotation();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelInlineAnnotation();
                        }
                      }}
                      onBlur={commitInlineAnnotation}
                    />
                  </div>
                </foreignObject>
              );
            })()}
          </svg>
        </div>
        )}

        {workspaceMode === "harmony" &&
          harmonyRecordedProgression.length > 0 &&
          harmonyRecordedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.recordedHarmonyAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">{t("ui.recordedHarmonyProgression")}</div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      harmonyRecordedNotationRef.current,
                      "recorded-harmony-progression-notation",
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={harmonyRecordedNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && side === "stradella" &&
          activeToolSection === "bassPatternPlayer" &&
          bassPatternEvents.length > 0 &&
          bassPatternRenderedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedStradellaAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">
                  {selectedBassPattern ? bassPatternName(selectedBassPattern.id, selectedBassPattern.name, language) : t("ui.bassPatternPlayer")} {t("ui.over")}{" "}
                  {selectedChordProgression ? progressionName(selectedChordProgression.id, selectedChordProgression.name, language) : t("ui.progression")}
                </div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      bassPatternNotationRef.current,
                      `${selectedBassPattern?.id ?? "bass-pattern"}-notation`,
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={bassPatternNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && side === "stradella" &&
          activeToolSection === "progressionAssistant" &&
          harmonyProgressionPlan.playable &&
          harmonyProgressionNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedProgressionAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">
                  {t("ui.optimizedStradellaProgression")}
                </div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      harmonyProgressionNotationRef.current,
                      "optimized-stradella-progression-notation",
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={harmonyProgressionNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && activeToolSection === "abcPlayer" &&
          abcText.trim() &&
          abcRenderedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedABCAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">
                  {abcParseResult.title || "ABC notation"}
                </div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      abcNotationRef.current,
                      `${abcParseResult.title || "abc"}-notation`,
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={abcNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && activeToolSection === "sequences" &&
          sequenceStepsWithButtons.length > 0 &&
          sequenceRenderedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedSequenceAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">{t("ui.sequenceNotation")}</div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      sequenceNotationRef.current,
                      "sequence-notation",
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={sequenceNotationRef} className="rendered-abc" />
            </div>
          )}
      </section>
    </main>
    </LanguageProvider>
  );
}

export default App;
