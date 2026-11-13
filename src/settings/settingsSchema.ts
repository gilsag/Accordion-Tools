/** Public JSON settings contract. Keys and legacy aliases remain stable across versions.
 * Importing a partial or older settings file must not reset unspecified preferences.
 * This type describes the shape; runtime validators live in settingsController.ts.
 * Keep existing keys and aliases stable for previously exported settings files.
 */
import type {
  AbcStradellaMode,
  AbcTrebleChordSymbolsMode,
  AbcHands,
  AccidentalMode,
  BassPatternChordVoicing,
  AccidentalStyle,
  BassCount,
  ChordLabelMode,
  ColorTheme,
  DiagramAnnotationAnchor,
  DownloadFormat,
  FinderChordInversion,
  FinderChordOctave,
  FinderChordPattern,
  FinderScalePattern,
  FontFamily,
  InterfaceDensity,
  NotationMode,
  NumberPosition,
  PianoTrebleRange,
  SequenceColorPreset,
  SequenceDisplayMode,
  Side,
  SoundSource,
  SoundVoicePreset,
  SoundWaveform,
  SampleRegister,
  StradellaBassVoicing,
  StradellaChordFinderMode,
  TrebleLayout,
  TrebleSizePreset,
  TitleMode
} from "../types";
import type { StradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import type { MinimumNominalGap } from "../tools/stradellaChordFinder/voicingDensity";
import type { ChordDisplayStyle } from "../tools/chordDisplay";
import type { InterfaceLanguagePreference } from "../i18n/catalog";
import type { StradellaOctaveGrouping } from "../tools/stradellaChordFinder/registerModel";
import type { HarmonyPlaybackStyle, HarmonyVoicingStyle } from "../tools/harmonyExplorer/types";
import type { ProgressionRhythmPattern } from "../sound";

export type DefaultSettingsFile = Partial<{
  /** Format version (see settingsMigrations.ts); absent in files from v0.17.0 and earlier. */
  settingsVersion: number;
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
  downloadFormat: DownloadFormat;
  soundEnabled: boolean;
  stradellaBassVoicing: StradellaBassVoicing;
  stradellaBassRegisterOctave: number;
  stradellaBassRegisterGrouping: StradellaOctaveGrouping;
  stradellaChordRegisterOctave: number;
  stradellaChordRegisterGrouping: StradellaOctaveGrouping;
  stradellaChordFinderMode: StradellaChordFinderMode;
  stradellaChordFinderMarkRootBass: boolean;
  /** Mixed search: the requested bass must sound on a bass or counterbass button. */
  stradellaRequestedBassOnBassButton: boolean;
  abcStradellaMode: AbcStradellaMode;
  abcTrebleChordSymbolsMode: AbcTrebleChordSymbolsMode;
  abcHands: AbcHands;
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
  stradellaNotationMode: "symbolic" | "sounding";
  stradellaChordQualityLabels: "always" | "changes";
  stradellaMarkCounterbass: boolean;
  musicNotationNoteNamesInNoteheads: boolean;
  musicNotationPlacement: "right" | "below";
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
  /** Share of each written note that sounds in timed playback (0.3–1). New in version 2. */
  soundArticulation: number;
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
  progressionHandMovementWeight: number;
  progressionRhythmPattern: ProgressionRhythmPattern;
  /** Progression Assistant: root position for every chord (with fallback) or any bass. */
  progressionRootPosition: boolean;
}>;
