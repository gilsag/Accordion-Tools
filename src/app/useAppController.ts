
import { accordionStatusText, diagramAutoTitle } from "../i18n/diagramLabels";
import { DEFAULT_STRADELLA_NOTE_LEVELS, type StradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import { trebleContextualTitle } from "../tools/contextualTitles";
import { DEFAULT_CHORD_DISPLAY_STYLE, displayRealizedChord, displayStradellaButtonChord, type ChordDisplayStyle } from "../tools/chordDisplay";
import { chordToneName, displayRoot, realizedChordName, formatChordFinderTone } from "../tools/stradellaChordFinder/chordSpelling";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DefaultSettingsFile } from "../settings/settingsSchema";
import { applyStartupSettings, applyImportedSettings, collectCurrentSettings, type SettingsSetters } from "../settings/settingsController";
import { fetchDefaultSettingsDocument, parseSettingsDocumentFile, downloadSettingsDocument } from "../settings/settingsPersistence";
import { useLanguageSettings } from "../settings/useLanguageSettings";
import { useWorkspaceNavigation } from "../app/useWorkspaceNavigation";
import { enterProgressionAssistant, enterStradellaFinder, enterHarmonyExplorer } from "./crossToolCommands";
import type { ToolSection } from "../app/toolRegistry";
import { useInstrumentState } from "../instrument/useInstrumentState";
import { TREBLE_PRESET_BUTTON_SIZE, PIANO_TREBLE_PRESET_BUTTON_SIZE } from "../instrument/sizePresets";
import { useDiagramAppearanceState } from "../diagram/useDiagramAppearanceState";
import { useDiagramOverlays } from "../diagram/useDiagramOverlays";
import { useDiagramAnnotations } from "../features/annotateDiagram/useDiagramAnnotations";
import { useBassPatternState, useBassPatternResults } from "../features/bassPatternPlayer/useBassPatternPlayer";
import { useSequenceState, useSequenceResults } from "../features/sequences/useSequenceState";
import { useAbcPlayerState, useAbcPlayerResults } from "../features/abcPlayer/useAbcPlayer";
import { useHarmonyExplorerState, useHarmonyExplorerResults } from "../features/harmonyExplorer/useHarmonyExplorer";
import { useHarmonyProgressionState, useHarmonyProgressionResults } from "../features/progressionAssistant/useProgressionAssistant";
import { useStradellaChordFinderState, useStradellaChordFinderResults } from "../features/stradellaChordFinder/useStradellaChordFinder";
import { useScaleFinderState, useScaleFinderResults } from "../features/scaleFinder/useScaleFinder";
import { useTrebleChordFinderState, useTrebleChordFinderButtons } from "../features/trebleChordFinder/useTrebleChordFinder";
import { flushSync } from "react-dom";
import { useSoundSettings } from "../audio/useSoundSettings";
import { playbackClockMs, clearPlaybackTimers } from "../audio/playbackTransport";
import { scheduleAbcMappedPlayback, scheduleBassPatternEvents } from "../audio/playbackScheduling";
import { renderNotationInto as renderSharedNotation } from "../notation/notationService";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { translate, translateKnownLabel, type InterfaceLanguage } from "../i18n/catalog";
import { progressionName } from "../i18n/optionLabels";
import type { AccidentalMode, BassCount, ButtonKind, ChordLabelMode, DiagramButton, DownloadFormat, InterfaceDensity, NotationMode, PianoTrebleRange, SequenceColorPreset, SequenceDisplayMode, TrebleLayout, TrebleSizePreset } from "../types";
import { chordTones, formatPitch, INDEX_TO_PITCH, INTERVALS_FROM_C, isChordKind, rowFunction } from "../music";
import { generateStradella, stradellaVisibleRoots, stradellaVisibleRows } from "../stradella";
import { generateTreble } from "../treble";
import { generatePianoTreble, PIANO_TREBLE_RANGE_PRESETS, pianoTrebleWhiteKeyCount } from "../pianoTreble";
import { serializeSvg } from "../download";
import { accordionDiagramFilename, harmonyDiagramFilename, downloadDiagram, downloadDiagramBatch, svgPointFromClient } from "../diagram/diagramExport";
import { sequenceArrowStyleFromMode, sequenceModeShowsArrows, sequenceModeShowsNumbers } from "../tools/sequenceTools";
import { SCALE_FINDER_OPTIONS, getScaleFinderTrebleButtons } from "../tools/scaleFinderTools";
import { bassPatternEventsToAbc, chordProgressionSteps, bassPatternEventsToMidiBytes, bassPatternEventsToLilyPond, bassPatternEventsToStradellaNotationAbc, type ChordProgressionDefinition, type StradellaNotationAbcOptions } from "../tools/bassPatternPlayerTools";
import { getChordFinderTrebleButtons } from "../tools/chordFinderTools";
import { intervalsForChordFinder } from "../music/chordDefinitions";
import { realizationAnnotation, finderChordSymbol } from "../tools/stradellaChordFinder/diagramAnnotations";
import { analyzeConfiguredStradellaVoicing } from "../tools/stradellaChordFinder/registerModel";
import { voicingIntervalLayout } from "../tools/stradellaChordFinder/voicingIntervalLayout";
import { describeTrebleChord } from "../tools/trebleChordExplanation";
import { playButtonArpeggioThenChord, playButtonCombination, playButtonRhythmProgression, playButtonSequence, playButtonSound, stopAllSound, preloadLaMelodiosa, playHarmonyPitchClassChord, playHarmonyRelationship, notesForButton } from "../sound";
import type { ChordFamilyId } from "../tools/harmonyExplorer/music";
import { CIRCLE_OF_FIFTHS, DEFAULT_RING_VISIBILITY, chordLabel as harmonyChordLabel, chordMidiNotes as harmonyChordMidiNotes, pitchClassesForChord as harmonyPitchClassesForChord } from "../tools/harmonyExplorer/music";
import type { HarmonyPlaybackStyle } from "../tools/harmonyExplorer/types";
import type { HarmonyProgressionChord } from "../tools/harmonyExplorer/progression";
import { isHarmonyProgressionChord } from "../tools/harmonyExplorer/progression";
import { progressionBassPulseButtons } from "../tools/harmonyExplorer/progression";
import { finderPatternForHarmonyFamily, harmonyFamilyForFinderPattern, pitchClassNameFromNumber, pitchClassNumberFromName } from "../tools/harmonyExplorer/integration";

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

/** Named colors used by sequence arrows and sequence numbers. */
const COLOR_PRESETS: Record<SequenceColorPreset, string> = {
  red: "#d4553f",
  blue: "#1746d0",
  black: "#111111",
  grey: "#666666",
  theme: "#1746d0",
};

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

/** Renders the full accordion diagram generator application. */
export function useAppController() {
  /* Reference to the SVG element, used for downloads and click-coordinate conversion. */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const harmonySvgRef = useRef<SVGSVGElement | null>(null);
  const previousLayoutSignatureRef = useRef<string | null>(null);
  const abcPlaybackTimeoutsRef = useRef<number[]>([]);
  const abcPlaybackStartedAtRef = useRef<number | null>(null);
  const abcPlaybackStartBeatRef = useRef(0);

  /* Core layout and notation state. */
  const { languagePreference, setLanguagePreference, language, t, changeLanguage } = useLanguageSettings();

  const {
    side, setSide, basses, setBasses, trebleLayout, setTrebleLayout,
    trebleRows, setTrebleRows, trebleSize, setTrebleSize,
    pianoTrebleRange, setPianoTrebleRange, showTrebleOctaves, setShowTrebleOctaves,
    stradellaBassRegisterOctave, setStradellaBassRegisterOctave,
    stradellaBassRegisterGrouping, setStradellaBassRegisterGrouping,
    stradellaChordRegisterOctave, setStradellaChordRegisterOctave,
    stradellaChordRegisterGrouping, setStradellaChordRegisterGrouping,
    stradellaRegisterModel,
  } = useInstrumentState();
  const [notation, setNotation] = useState<NotationMode>("english");
  const [accidental, setAccidental] = useState<AccidentalMode>("natural");
  const [chordDisplayStyle, setChordDisplayStyle] = useState<ChordDisplayStyle>(DEFAULT_CHORD_DISPLAY_STYLE);
  const [chordLabelMode, setChordLabelMode] =
    useState<ChordLabelMode>("chord-name");

  /* Diagram appearance and typography are state-owned by the diagram feature.
   * Keep the original setters for the settings-controller compatibility adapter. */
  const {
    buttonSize, setButtonSize, spacing, setSpacing,
    diagramVerticalSpacing, setDiagramVerticalSpacing,
    pianoKeyWidthScale, setPianoKeyWidthScale,
    pianoKeyHeightScale, setPianoKeyHeightScale,
    pianoBlackKeyWidthScale, setPianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale, setPianoBlackKeyHeightScale,
    diagramScale, setDiagramScale,
    showStatusBar, setShowStatusBar, trebleAngle, setTrebleAngle,
    buttonStrokeWidth, setButtonStrokeWidth,
    referenceStrokeWidth, setReferenceStrokeWidth,
    chordFillStrength, setChordFillStrength,
    accidentalStyle, setAccidentalStyle,
    labelFontSize, setLabelFontSize,
    showButtonLabels, setShowButtonLabels,
    showBellowsGuide, setShowBellowsGuide,
    showStradellaRowLabels, setShowStradellaRowLabels,
    titleMode, setTitleMode, customTitle, setCustomTitle,
    titleFont, setTitleFont, titleSize, setTitleSize,
    labelFont, setLabelFont, colorTheme, setColorTheme,
  } = useDiagramAppearanceState();
  const [interfaceDensity, setInterfaceDensity] = useState<InterfaceDensity>("compact");

  /* The application shell owns workspace/tool visibility; physical side stays
   * in useInstrumentState, and audio cancellation remains with the commands. */
  const {
    leftPanelMode, workspaceMode,
    activeSettingsSection, activeToolSection,
    toggleSettingsSection, toggleToolSection: toggleWorkspaceToolSection,
    navigateToTool, selectAccordionSide, setPanel, toggleFocusPanel,
  } = useWorkspaceNavigation(side, setSide);

  /* Physical-button overlays/fingerings are independent of musical selection. */
  const {
    overlays, setOverlays, fingeringPosition, setFingeringPosition,
    fingeringDraft, setFingeringDraft, isApplyingFingering,
    setIsApplyingFingering, selectionOnClick, setSelectionOnClick,
    selectedButtonIds, markButtonOverlay, applyFingerToSelected,
    clearFingerForSelected, clearAllFingerings, clearSelection, deselectButton,
  } = useDiagramOverlays();

  /* Recording and path-display state is independent of the physical manual and sound. */
  const {
    isRecordingSequence, setIsRecordingSequence,
    sequenceSteps, setSequenceSteps,
    sequenceDisplayMode, setSequenceDisplayMode,
    sequenceColorPreset, setSequenceColorPreset,
    sequenceThickness, setSequenceThickness,
    sequenceArrowheadSize, setSequenceArrowheadSize,
    sequenceNumberFontSize, setSequenceNumberFontSize,
    sequenceNumberColorPreset, setSequenceNumberColorPreset,
    sequenceNumberPosition, setSequenceNumberPosition,
    appendRecordedButton, clearSequence, sequenceRenderedNotationVisible,
    setSequenceRenderedNotationVisible, sequenceNotationRef,
  } = useSequenceState();

  /* Finder requests are independent feature state. App coordinates only which
   * tool is shown; the tools own their preferences, selections, and results. */
  const {
    scaleFinderActive, setScaleFinderActive,
    scaleFinderRoot, setScaleFinderRoot,
    scaleFinderPattern, setScaleFinderPattern,
    scaleFinderRowLimit, setScaleFinderRowLimit,
    scaleFinderDisplayMode, setScaleFinderDisplayMode,
  } = useScaleFinderState();
  const {
    chordFinderActive, setChordFinderActive,
    showTrebleVoicingNote, setShowTrebleVoicingNote,
    trebleChordVoicingMode, setTrebleChordVoicingMode,
    chordFinderRoot, setChordFinderRoot,
    chordFinderPattern, setChordFinderPattern,
    chordFinderInversion, setChordFinderInversion,
    chordFinderOctave, setChordFinderOctave,
  } = useTrebleChordFinderState();

  /* ABC Player state for file/paste playback and diagram highlighting. */
  const {
    abcText, setAbcText, abcEditorExpanded, setAbcEditorExpanded,
    abcFileName, setAbcFileName, abcExampleValue, setAbcExampleValue,
    abcExampleOptions, abcTempoBpm, setAbcTempoBpm,
    abcPositionBeat, setAbcPositionBeat, abcPlaybackState, setAbcPlaybackState,
    abcActiveButtonIds, setAbcActiveButtonIds, abcStradellaMode, setAbcStradellaMode,
    abcTrebleChordSymbolsMode, setAbcTrebleChordSymbolsMode,
    abcRenderedNotationVisible, setAbcRenderedNotationVisible,
    abcNotationRef, loadAbcExample,
  } = useAbcPlayerState();

  /* Bass-pattern preferences, editor, library and pattern selection are feature-owned. */
  const {
    customBassPatternDefinitions,
    bassPatternDefinitions,
    chordProgressionDefinitions,
    bassPatternId, setBassPatternId,
    chordProgressionId, setChordProgressionId,
    bassPatternRoot, setBassPatternRoot,
    bassPatternTempoBpm, setBassPatternTempoBpm,
    bassPatternChordVoicing, setBassPatternChordVoicing,
    bassPatternBarsPerChord, setBassPatternBarsPerChord,
    bassPatternLoopMode, setBassPatternLoopMode,
    bassPatternLoopCount, setBassPatternLoopCount,
    bassPatternExportFormat, setBassPatternExportFormat,
    bassPatternEditorExpanded, setBassPatternEditorExpanded,
    bassPatternRenderedNotationVisible, setBassPatternRenderedNotationVisible,
    bassPatternValidationErrors,
    bassPatternEditorText, setBassPatternEditorText,
    bassPatternEditorMessage,
    bassPatternPlaybackState, setBassPatternPlaybackState,
    bassPatternActiveButtonIds, setBassPatternActiveButtonIds,
    bassPatternTimeoutsRef, bassPatternPlaybackRunRef, bassPatternNotationRef,
    bassPatternEditorErrors, saveCustomBassPattern, removeSelectedCustomBassPattern,
    loadSelectedPatternIntoEditor,
  } = useBassPatternState(t);
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
  }, [activeToolSection, setAbcRenderedNotationVisible, setBassPatternRenderedNotationVisible, setSequenceRenderedNotationVisible]);

  /* Finder request, presentation, and cross-tool handoff state live in the feature.
     Shared batch-export and mobile diagram state remain in the application shell. */
  const {
    stradellaChordFinderActive, setStradellaChordFinderActive,
    stradellaChordFinderRoot, setStradellaChordFinderRoot,
    stradellaChordFinderPattern, setStradellaChordFinderPattern,
    stradellaChordFinderMode, setStradellaChordFinderMode,
    stradellaChordFinderRealizationIndex, setStradellaChordFinderRealizationIndex,
    stradellaChordFinderRequestedBass, setStradellaChordFinderRequestedBass,
    finderMaxButtons, setFinderMaxButtons,
    finderSpanColumns, setFinderSpanColumns,
    stradellaMinimumNominalGap, setStradellaMinimumNominalGap,
    showFinderRealizationNote, setShowFinderRealizationNote,
    stradellaNoteLevels, setStradellaNoteLevels,
    finderExplanationFontSize, setFinderExplanationFontSize,
    pendingProgressionRealizationKey, setPendingProgressionRealizationKey,
    stradellaChordFinderMarkRootBass, setStradellaChordFinderMarkRootBass,
  } = useStradellaChordFinderState();
  const [batchExporting, setBatchExporting] = useState(false);
  // View-only mode. SVG viewBox, musical geometry and exports remain untouched.
  const [mobileDiagramView, setMobileDiagramView] = useState<"readable" | "fit">("readable");

  /* Harmony Explorer retains its independent selection/display state. */
  const {
    harmonyReferenceFamilyId, setHarmonyReferenceFamilyId,
    harmonyRelatedFamilyId, setHarmonyRelatedFamilyId,
    harmonyScaleId, setHarmonyScaleId,
    harmonyDiatonicOnly, setHarmonyDiatonicOnly,
    harmonyHighlightDiatonic, setHarmonyHighlightDiatonic,
    harmonyShowEnharmonics, setHarmonyShowEnharmonics,
    harmonyShowSeparators, setHarmonyShowSeparators,
    harmonyShowLegend, setHarmonyShowLegend,
    harmonyShowExplanation, setHarmonyShowExplanation,
    harmonyRingVisibility, setHarmonyRingVisibility,
    harmonyShowToneTooltips, setHarmonyShowToneTooltips,
    harmonyShowNoteRing, setHarmonyShowNoteRing,
    harmonyColorByFamily, setHarmonyColorByFamily,
    harmonyDiameter, setHarmonyDiameter,
    harmonyFontSize, setHarmonyFontSize,
    harmonyPlaybackStyle, setHarmonyPlaybackStyle,
    harmonyVoicingStyle, setHarmonyVoicingStyle,
    harmonySelection, setHarmonySelection,
    harmonyFocusedReferenceRootPc, setHarmonyFocusedReferenceRootPc,
  } = useHarmonyExplorerState();
  /* Progression state is separate from both the instrument and sound. */
  const {
    harmonyProgression, setHarmonyProgression,
    harmonyRecordedProgression, setHarmonyRecordedProgression,
    harmonyProgressionRecording, setHarmonyProgressionRecording,
    harmonyRecordedNotationVisible, setHarmonyRecordedNotationVisible,
    harmonyRecordedProgressionPlaying, setHarmonyRecordedProgressionPlaying,
    harmonyProgressionManualRoot, setHarmonyProgressionManualRoot,
    harmonyProgressionManualFamilyId, setHarmonyProgressionManualFamilyId,
    harmonyProgressionAllowApproximations, setHarmonyProgressionAllowApproximations,
    harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight,
    harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern,
    harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex,
    harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds,
    harmonyProgressionNotationVisible, setHarmonyProgressionNotationVisible,
    harmonyRecordedPlaybackTimeoutsRef, harmonyRecordedNotationRef,
    harmonyProgressionIdRef, harmonyProgressionNotationRef,
  } = useHarmonyProgressionState();

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
  }, [activeToolSection, setHarmonyProgressionNotationVisible, setHarmonyProgressionActiveButtonIds]);

  /* Annotation editor and saved note state live outside the renderer. */
  const {
    textNotes, setTextNotes, textNoteFontSize, setTextNoteFontSize,
    textNoteColor, setTextNoteColor, textNoteFont, setTextNoteFont,
    annotationBold, setAnnotationBold, annotationItalic, setAnnotationItalic,
    annotationOffsetPercent, setAnnotationOffsetPercent,
    annotationButtonAnchor, setAnnotationButtonAnchor,
    annotationEditorRef, inlineAnnotationEditor, setInlineAnnotationEditor,
    clearTextNotes, deleteTextNote, annotationLocationLabel, annotationPreview,
    annotationPointForButton, beginButtonAnnotation, beginFreeAnnotation,
    commitInlineAnnotation, cancelInlineAnnotation,
  } = useDiagramAnnotations(buttonSize);

  /* Audio settings are separate from the nominal physical register model. */
  const {
    soundEnabled, setSoundEnabled, soundVolume, setSoundVolume, soundSource, setSoundSource, laMelodiosaTrebleRegister, setLaMelodiosaTrebleRegister, laMelodiosaBassRegister, setLaMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, setLaMelodiosaFollowStradellaRegisters, soundVoicePreset, setSoundVoicePreset, soundWaveform, setSoundWaveform, soundMusetteDetuneCents, setSoundMusetteDetuneCents, soundAttackMs, setSoundAttackMs, soundReleaseMs, setSoundReleaseMs, soundNoteDurationMs, setSoundNoteDurationMs, soundSequenceTempoBpm, setSoundSequenceTempoBpm, stradellaBassVoicing, setStradellaBassVoicing,
    soundOptions,
  } = useSoundSettings(stradellaRegisterModel);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("svg");
  const [showStradellaVoicingIntervals, setShowStradellaVoicingIntervals] = useState(true);

  // React's state setters are stable. Keep this adapter stable so asynchronous
  // editable-default loading runs once; the controller owns validation only.
  const settingsSettersRef = useRef<SettingsSetters>({
    changeLanguage,
    setAbcStradellaMode,
    setAbcTempoBpm,
    setAbcTrebleChordSymbolsMode,
    setAccidental,
    setAccidentalStyle,
    setAnnotationBold,
    setAnnotationButtonAnchor,
    setAnnotationItalic,
    setAnnotationOffsetPercent,
    setBassPatternBarsPerChord,
    setBassPatternChordVoicing,
    setBassPatternLoopCount,
    setBassPatternLoopMode,
    setBassPatternRoot,
    setBassPatternTempoBpm,
    setBasses,
    setButtonSize,
    setButtonStrokeWidth,
    setChordDisplayStyle,
    setChordFillStrength,
    setChordFinderInversion,
    setChordFinderOctave,
    setChordFinderPattern,
    setChordFinderRoot,
    setChordLabelMode,
    setColorTheme,
    setCustomTitle,
    setDiagramScale,
    setDiagramVerticalSpacing,
    setDownloadFormat,
    setFingeringPosition,
    setHarmonyColorByFamily,
    setHarmonyDiameter,
    setHarmonyFontSize,
    setHarmonyPlaybackStyle,
    setHarmonyProgressionAllowApproximations,
    setHarmonyProgressionHandMovementWeight,
    setHarmonyProgressionRhythmPattern,
    setHarmonyRingVisibility,
    setHarmonyShowEnharmonics,
    setHarmonyShowExplanation,
    setHarmonyShowLegend,
    setHarmonyShowNoteRing,
    setHarmonyShowSeparators,
    setHarmonyShowToneTooltips,
    setHarmonyVoicingStyle,
    setInterfaceDensity,
    setLaMelodiosaBassRegister,
    setLaMelodiosaFollowStradellaRegisters,
    setLaMelodiosaTrebleRegister,
    setLabelFont,
    setLabelFontSize,
    setLanguagePreference,
    setMusicNotationBarsPerLine,
    setMusicNotationChordFontSize,
    setMusicNotationIncludeDescription,
    setMusicNotationIncludeSummary,
    setMusicNotationIncludeTitle,
    setMusicNotationScale,
    setMusicNotationStaffSeparator,
    setMusicNotationStaffWidth,
    setMusicNotationUseBarsPerLine,
    setNotation,
    setPianoBlackKeyHeightScale,
    setPianoBlackKeyWidthScale,
    setPianoKeyHeightScale,
    setPianoKeyWidthScale,
    setPianoTrebleRange,
    setReferenceStrokeWidth,
    setScaleFinderDisplayMode,
    setScaleFinderPattern,
    setScaleFinderRoot,
    setScaleFinderRowLimit,
    setSelectionOnClick,
    setSequenceArrowheadSize,
    setSequenceColorPreset,
    setSequenceDisplayMode,
    setSequenceNumberColorPreset,
    setSequenceNumberFontSize,
    setSequenceNumberPosition,
    setSequenceThickness,
    setShowBellowsGuide,
    setShowButtonLabels,
    setShowStatusBar,
    setShowStradellaRowLabels,
    setShowStradellaVoicingIntervals,
    setShowTrebleOctaves,
    setSide,
    setSoundAttackMs,
    setSoundEnabled,
    setSoundMusetteDetuneCents,
    setSoundNoteDurationMs,
    setSoundReleaseMs,
    setSoundSequenceTempoBpm,
    setSoundSource,
    setSoundVoicePreset,
    setSoundVolume,
    setSoundWaveform,
    setSpacing,
    setStradellaBassRegisterGrouping,
    setStradellaBassRegisterOctave,
    setStradellaBassVoicing,
    setStradellaChordFinderMarkRootBass,
    setStradellaChordFinderMode,
    setStradellaChordRegisterGrouping,
    setStradellaChordRegisterOctave,
    setStradellaMinimumNominalGap,
    setStradellaNoteLevels,
    setTextNoteColor,
    setTextNoteFont,
    setTextNoteFontSize,
    setTitleFont,
    setTitleMode,
    setTitleSize,
    setTrebleAngle,
    setTrebleLayout,
    setTrebleRows,
    setTrebleSize,
  });

  /** Applies extended visual/tool defaults that are also user-editable in default-settings.json. */

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultSettings() {
      try {
        const defaults = await fetchDefaultSettingsDocument(
          `${import.meta.env.BASE_URL}default-settings.json`,
        );
        if (cancelled || !defaults || typeof defaults !== "object") return;
        applyStartupSettings(defaults, settingsSettersRef.current);
      } catch {
        /* The app still runs with built-in defaults if the editable file is missing or invalid. */
      }
    }

    loadDefaultSettings();
    return () => {
      cancelled = true;
    };
  }, [
    setBasses, setLanguagePreference, setPianoTrebleRange, setShowTrebleOctaves,
    setSide, setStradellaBassRegisterGrouping, setStradellaBassRegisterOctave,
    setStradellaChordRegisterGrouping, setStradellaChordRegisterOctave,
    setTrebleLayout, setTrebleRows, setTrebleSize,
  ]);

  /** Applies a settings JSON object without changing the editable default-settings.json file. */
  /** Snapshot value capture stays in App until each tool owns its own controller. */
  function collectSettingsSnapshot(): DefaultSettingsFile {
    return collectCurrentSettings({
      abcStradellaMode,
      abcTempoBpm,
      abcTrebleChordSymbolsMode,
      accidental,
      accidentalStyle,
      annotationBold,
      annotationButtonAnchor,
      annotationItalic,
      annotationOffsetPercent,
      bassPatternBarsPerChord,
      bassPatternChordVoicing,
      bassPatternLoopCount,
      bassPatternLoopMode,
      bassPatternRoot,
      bassPatternTempoBpm,
      basses,
      buttonSize,
      buttonStrokeWidth,
      chordDisplayStyle,
      chordFillStrength,
      chordFinderInversion,
      chordFinderOctave,
      chordFinderPattern,
      chordFinderRoot,
      chordLabelMode,
      colorTheme,
      customTitle,
      diagramScale,
      diagramVerticalSpacing,
      downloadFormat,
      fingeringPosition,
      harmonyColorByFamily,
      harmonyDiameter,
      harmonyFontSize,
      harmonyPlaybackStyle,
      harmonyProgressionAllowApproximations,
      harmonyProgressionHandMovementWeight,
      harmonyProgressionRhythmPattern,
      harmonyRingVisibility,
      harmonyShowEnharmonics,
      harmonyShowExplanation,
      harmonyShowLegend,
      harmonyShowNoteRing,
      harmonyShowSeparators,
      harmonyShowToneTooltips,
      harmonyVoicingStyle,
      interfaceDensity,
      laMelodiosaBassRegister,
      laMelodiosaFollowStradellaRegisters,
      laMelodiosaTrebleRegister,
      labelFont,
      labelFontSize,
      languagePreference,
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationIncludeTitle,
      musicNotationScale,
      musicNotationStaffSeparator,
      musicNotationStaffWidth,
      musicNotationUseBarsPerLine,
      notation,
      pianoBlackKeyHeightScale,
      pianoBlackKeyWidthScale,
      pianoKeyHeightScale,
      pianoKeyWidthScale,
      pianoTrebleRange,
      referenceStrokeWidth,
      scaleFinderDisplayMode,
      scaleFinderPattern,
      scaleFinderRoot,
      scaleFinderRowLimit,
      selectionOnClick,
      sequenceArrowheadSize,
      sequenceColorPreset,
      sequenceDisplayMode,
      sequenceNumberColorPreset,
      sequenceNumberFontSize,
      sequenceNumberPosition,
      sequenceThickness,
      showBellowsGuide,
      showButtonLabels,
      showStatusBar,
      showStradellaRowLabels,
      showStradellaVoicingIntervals,
      showTrebleOctaves,
      side,
      soundAttackMs,
      soundEnabled,
      soundMusetteDetuneCents,
      soundNoteDurationMs,
      soundReleaseMs,
      soundSequenceTempoBpm,
      soundSource,
      soundVoicePreset,
      soundVolume,
      soundWaveform,
      spacing,
      stradellaBassRegisterGrouping,
      stradellaBassRegisterOctave,
      stradellaBassVoicing,
      stradellaChordFinderMarkRootBass,
      stradellaChordFinderMode,
      stradellaChordRegisterGrouping,
      stradellaChordRegisterOctave,
      stradellaMinimumNominalGap,
      stradellaNoteLevels,
      textNoteColor,
      textNoteFont,
      textNoteFontSize,
      titleFont,
      titleMode,
      titleSize,
      trebleAngle,
      trebleLayout,
      trebleRows,
      trebleSize,
    });
  }

  /** Download format and filename remain compatible with v0.15.28. */
  function downloadCurrentSettings() {
    downloadSettingsDocument(collectSettingsSnapshot());
  }

  /** Imports a settings JSON file and applies it to the current session. */
  async function importSettingsFile(file: File | undefined) {
    if (!file) return;
    try {
      const settings = await parseSettingsDocumentFile(file);
      applyImportedSettings(settings, settingsSettersRef.current);
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
    isPianoTreble,
  ]);

  const { harmonyProgressionPlan,
    progressionPreviewButtonIds, harmonyProgressionActiveButtonIdSet,
  } = useHarmonyProgressionResults({
    basses, buttonSize, spacing, stradellaAccidental, diagramVerticalSpacing,
    harmonyProgression, harmonyProgressionAllowApproximations,
    harmonyProgressionHandMovementWeight, harmonyProgressionPreviewIndex,
    setHarmonyProgressionPreviewIndex, harmonyProgressionActiveButtonIds,
    activeToolSection,
  });

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
  }, [layoutSignature, setScaleFinderActive, setChordFinderActive, setStradellaChordFinderActive, setIsRecordingSequence, setSequenceSteps, setIsApplyingFingering, setOverlays, setTextNotes]);

  const selectedButtons = selectedButtonIds
    .map((id) => buttons.find((button) => button.id === id))
    .filter(Boolean) as DiagramButton[];

  const sequenceStepsWithButtons = useSequenceResults(sequenceSteps, buttons);

  /* Finder result selectors use the *existing diagram buttons*, retaining exact
   * button identity, ordering, octave/row choices, and playback/export semantics. */
  const { stradellaScaleFinderResult, scaleFinderButtons } = useScaleFinderResults({
    buttons, side, isTrebleLikeSide,
    scaleFinderActive, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit,
  });
  const chordFinderButtons = useTrebleChordFinderButtons({
    buttons, isTrebleLikeSide,
    chordFinderActive, chordFinderRoot, chordFinderPattern,
    chordFinderInversion, chordFinderOctave, trebleChordVoicingMode,
  });

  const {
    abcParseResult, abcMappedEvents, abcTotalBeats,
    abcMissingPitchText, abcActiveButtonIdSet,
  } = useAbcPlayerResults({
    abcText, abcPlaybackState, setAbcTempoBpm, abcActiveButtonIds,
    abcStradellaMode, abcTrebleChordSymbolsMode, side, isTrebleLikeSide, buttons,
  });

  const {
    selectedBassPattern, selectedChordProgression, bassPatternEvents,
    bassPatternTotalBeats, bassPatternMissingText, bassPatternActiveButtonIdSet,
  } = useBassPatternResults({
    bassPatternDefinitions, bassPatternId, chordProgressionDefinitions, chordProgressionId,
    buttons, side, bassPatternRoot, bassPatternChordVoicing, bassPatternBarsPerChord,
    bassPatternActiveButtonIds,
  });
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

  const renderNotationInto = useCallback((target: HTMLDivElement | null, abcSource: string) => {
    renderSharedNotation(target, abcSource, musicNotationScale, musicNotationStaffWidth);
  }, [musicNotationScale, musicNotationStaffWidth]);

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

  const sequenceRenderedNotationAbc = useMemo(() => {
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
    bassPatternNotationRef,
    renderNotationInto,
  ]);

  useEffect(() => {
    if (!abcRenderedNotationVisible) return;
    renderNotationInto(abcNotationRef.current, abcText);
  }, [
    abcRenderedNotationVisible,
    abcText,
    abcNotationRef,
    renderNotationInto,
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
    sequenceNotationRef,
    renderNotationInto,
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

  const {
    stradellaChordFinderRealizations,
    stradellaChordFinderResult,
    stradellaChordFinderButtons,
    stradellaChordFinderPlaybackButtons,
    stradellaRootBassFinderButtonIds,
    stradellaPrimaryFinderButtonIds,
  } = useStradellaChordFinderResults({
    buttons, side, stradellaRegisterModel,
    stradellaChordFinderActive,
    stradellaChordFinderRoot, stradellaChordFinderPattern,
    stradellaChordFinderMode, stradellaChordFinderRealizationIndex,
    stradellaChordFinderRequestedBass, finderMaxButtons, finderSpanColumns,
    stradellaMinimumNominalGap, stradellaChordFinderMarkRootBass,
    pendingProgressionRealizationKey, setPendingProgressionRealizationKey,
    setStradellaChordFinderRealizationIndex,
  });

  const finderButtons = stradellaChordFinderActive
    ? stradellaChordFinderButtons
    : scaleFinderActive
      ? scaleFinderButtons
      : chordFinderButtons;

  const finderButtonIds = useMemo(
    () => new Set(finderButtons.map((button) => button.id)),
    [finderButtons],
  );

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

  const progressionRhythmPulses = useCallback((step: (typeof harmonyProgressionPlan.steps)[number]) => {
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
  }, [buttons, harmonyProgressionRhythmPattern, harmonyProgressionPlan]);

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
    soundSequenceTempoBpm,
    progressionRhythmPulses,
    soundOptions,
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
    harmonyProgressionNotationRef,
    renderNotationInto,
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
    harmonyRecordedNotationRef,
    renderNotationInto,
  ]);

  const {
    harmonyAllFamiliesMode, harmonyEffectiveDiatonicOnly, harmonyEffectiveHighlightDiatonic,
    harmonySectors, harmonyAvailableCounts, harmonyCounts,
    harmonyReferenceFamily, harmonyRelatedName, harmonyScale,
    harmonyExplanation,
  } = useHarmonyExplorerResults({
    harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId,
    harmonyDiatonicOnly, harmonyHighlightDiatonic, harmonyRingVisibility,
    harmonyShowNoteRing, language, t,
  });

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
    clearPlaybackTimers(harmonyRecordedPlaybackTimeoutsRef);
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

  /** Ports make cross-tool side-effect order testable without coupling a tool to
   * another tool's React state. Musical payload construction stays at the call site. */
  function progressionDestinationPorts() {
    return {
      navigate: () => navigateToTool("progressionAssistant", { side: "stradella" }),
      clearPreview: () => setHarmonyProgressionPreviewIndex(null),
      disableStradellaFinder: () => setStradellaChordFinderActive(false),
      disableScaleFinder: () => setScaleFinderActive(false),
      disableTrebleChordFinder: () => setChordFinderActive(false),
      stopAbc: stopAbcPlayback,
      stopBassPattern: stopBassPatternPlayback,
    };
  }

  function stradellaFinderDestinationPorts(assignChord: () => void) {
    return {
      navigate: () => navigateToTool("stradellaChordFinder", { side: "stradella" }),
      assignChord,
      resetRealization: () => setStradellaChordFinderRealizationIndex(0),
      enableFinder: () => setStradellaChordFinderActive(true),
      disableScaleFinder: () => setScaleFinderActive(false),
      disableTrebleChordFinder: () => setChordFinderActive(false),
      stopAbc: stopAbcPlayback,
    };
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
    enterProgressionAssistant(progressionDestinationPorts(), "transfer");
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
    enterProgressionAssistant(progressionDestinationPorts(), "transfer");
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
    enterProgressionAssistant(progressionDestinationPorts(), "preview");
  }

  function openHarmonyProgressionStepInChordFinder(index: number) {
    const step = harmonyProgressionPlan.steps[index];
    if (!step) return;
    const pattern = finderPatternForHarmonyFamily(step.chord.familyId);
    if (!pattern) return;
    const resultKey = step.result.playbackButtons.map((button) => button.id).sort().join("|");
    setPendingProgressionRealizationKey(resultKey);
    enterStradellaFinder(stradellaFinderDestinationPorts(() => {
      setStradellaChordFinderRoot(pitchClassNameFromNumber(step.chord.rootPc));
      setStradellaChordFinderRequestedBass(null);
      setStradellaChordFinderPattern(pattern);
      setStradellaChordFinderMode("bass-and-chords");
    }), "progression-step");
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
    enterStradellaFinder(stradellaFinderDestinationPorts(() => {
      setStradellaChordFinderRoot(pitchClassNameFromNumber(harmonySelection.candidate.rootPc));
      setStradellaChordFinderRequestedBass(null);
      setStradellaChordFinderPattern(pattern);
      setStradellaChordFinderMode("bass-and-chords");
    }), "harmony-selection");
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

    enterHarmonyExplorer({
      navigate: () => navigateToTool("harmonyExplorer"),
      stopAllSound, stopAbc: stopAbcPlayback,
      stopBassPattern: stopBassPatternPlayback,
    });
  }

  useEffect(() => {
    if (soundEnabled && soundSource === "la-melodiosa") {
      void preloadLaMelodiosa(laMelodiosaTrebleRegister, laMelodiosaBassRegister);
    }
  }, [soundEnabled, soundSource, laMelodiosaTrebleRegister, laMelodiosaBassRegister]);

  /** Tool-specific side effects remain explicit until the command service is extracted.
   * Navigation itself is owned by the workspace controller, not by tool state. */
  function toggleToolSection(section: Exclude<ToolSection, null>) {
    toggleWorkspaceToolSection(section);
    if (section === "progressionAssistant") {
      setStradellaChordFinderActive(false);
      setScaleFinderActive(false);
      setChordFinderActive(false);
      stopAbcPlayback();
      stopBassPatternPlayback();
    }
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

    markButtonOverlay(button.id);

    if (isRecordingSequence) appendRecordedButton(button.id);

    playButtonSound(button, soundOptions);
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

  function clearAbcTimers() {
    clearPlaybackTimers(abcPlaybackTimeoutsRef);
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
        : ((playbackClockMs() - startedAt) / 1000) * (abcTempoBpm / 60);
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
    abcPlaybackStartedAtRef.current = playbackClockMs();
    abcPlaybackStartBeatRef.current = startBeat;

    scheduleAbcMappedPlayback({abcMappedEvents, startBeat, abcTempoBpm,
      abcTotalBeats, abcPlaybackTimeoutsRef, abcPlaybackStartedAtRef,
      soundOptions, setAbcPositionBeat, setAbcActiveButtonIds, setAbcPlaybackState});
  }

  function clearBassPatternTimers() {
    clearPlaybackTimers(bassPatternTimeoutsRef);
  }

  function stopBassPatternPlayback() {
    bassPatternPlaybackRunRef.current += 1;
    clearBassPatternTimers();
    setBassPatternPlaybackState("stopped");
    setBassPatternActiveButtonIds([]);
    stopAllSound();
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

    scheduleBassPatternEvents({bassPatternEvents, bassPatternTempoBpm,
      bassPatternTotalBeats, bassPatternLoopMode, bassPatternLoopCount,
      bassPatternTimeoutsRef, bassPatternPlaybackRunRef, runId, soundOptions,
      setBassPatternActiveButtonIds, setBassPatternPlaybackState});
  }

  /** Stops currently playing notes and any scheduled sequence playback. */
  function stopSoundPlayback() {
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
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

  /** Finder tone spelling follows chord harmony, never the leftmost bass-button label. */
  function formatStradellaFinderPitch(pitch: string) {
    return formatChordFinderTone(stradellaChordFinderRoot, stradellaChordFinderPattern, pitch, notation, stradellaAccidental);
  }

  /** Formats the Chord Finder pitch list using its requested harmonic context. */
  function formatStradellaFinderPitches(pitches: string[]) {
    if (pitches.length === 0) return "none";
    return pitches.map(formatStradellaFinderPitch).join(", ");
  }

  /** Formats Stradella Scale Finder note names, preserving scale spelling such as E#, B#, and F##. */
  function formatStradellaScaleFinderNames(names: string[], fallbackPitches: string[]) {
    const source = names.length > 0 ? names : fallbackPitches.map((pitch) => formatPitch(pitch, notation, stradellaAccidental));
    if (source.length === 0) return "none";
    return source.map((name) => name.replaceAll("##", "𝄪")).join(", ");
  }

  /** Rewrites pitch-class names in technical finder text using harmonic spelling. */
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
      await downloadDiagramBatch(snapshots, downloadFormat, `stradella-${stradellaChordFinderRoot}-${stradellaChordFinderPattern}-${downloadFormat}-${snapshots.length}-realizations.zip`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not export all diagrams.");
    } finally {
      setBatchExporting(false);
    }
  }

  /** The application determines musical titles; the diagram export service
   * owns filename normalization, format dispatch and viewBox coordinate mapping. */
  function downloadCurrentDiagram() {
    if (workspaceMode === "harmony") {
      if (!harmonySvgRef.current) return;
      const name = harmonyDiagramFilename(harmonyReferenceFamily.shortName, harmonyRelatedName, harmonyScale.name);
      downloadDiagram(harmonySvgRef.current, name, downloadFormat);
      return;
    }
    if (!svgRef.current) return;
    const layoutName = side === "stradella" ? "stradella"
      : trebleLayout === "piano" ? "piano-treble" : `${trebleLayout}-treble`;
    const displayedTitle = titleMode !== "none" ? finalTitle : "";
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
          ? autoTitle() : displayedTitle;
    downloadDiagram(svgRef.current, accordionDiagramFilename(rawName, layoutName), downloadFormat);
  }

  function svgPointFromMouse(event: ReactMouseEvent<SVGSVGElement>) {
    return svgPointFromClient(svgRef.current, event.clientX, event.clientY);
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
                      : activeToolSection === "stradellaChordFinder"
                        ? t("tools.chordFinder")
                        : activeToolSection === "scaleFinder"
                          ? t("ui.scaleFinder")
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
                    : activeToolSection === "chordFinder"
                      ? t("tools.chordFinder")
                      : activeToolSection === "scaleFinder"
                        ? t("ui.scaleFinder")
                        : t("ui.noActiveTool");

  const statusBarText = accordionStatusText({
    side, basses, trebleLayout, pianoRange: pianoTrebleRange, trebleRows,
    notation, soundEnabled, activeTool: activeToolLabel, language,
  });

    return {
    language, interfaceDensity, appGridColumns, leftPanelMode, t,
    settings: {
      BASS_OPTIONS, PIANO_TREBLE_RANGE_OPTIONS, TREBLE_SIZE_OPTIONS, accidental, accidentalStyle,
      activeSettingsSection, basses, buttonSize, buttonStrokeWidth, changeLanguage,
      changePianoTrebleRange, changeTrebleLayout, changeTrebleSize, chordDisplayStyle, chordFillStrength,
      chordLabelMode, colorTheme, customTitle, diagramScale, diagramVerticalSpacing,
      downloadCurrentSettings, harmonyAvailableCounts, harmonyColorByFamily, harmonyDiameter, harmonyFontSize,
      harmonyPlaybackStyle, harmonyRingVisibility, harmonyShowEnharmonics, harmonyShowExplanation, harmonyShowLegend,
      harmonyShowNoteRing, harmonyShowSeparators, harmonyShowToneTooltips, harmonyVoicingStyle, importSettingsFile,
      interfaceDensity, isPianoTreble, laMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, laMelodiosaTrebleRegister,
      labelFont, labelFontSize, language, languagePreference, musicNotationBarsPerLine,
      musicNotationChordFontSize, musicNotationIncludeDescription, musicNotationIncludeSummary, musicNotationIncludeTitle, musicNotationScale,
      musicNotationStaffSeparator, musicNotationStaffWidth, musicNotationUseBarsPerLine, notation, pianoBlackKeyHeightScale,
      pianoBlackKeyWidthScale, pianoKeyHeightScale, pianoKeyWidthScale, pianoTrebleRange, referenceStrokeWidth,
      setAccidental, setAccidentalStyle, setBasses, setButtonSize, setButtonStrokeWidth,
      setChordDisplayStyle, setChordFillStrength, setChordLabelMode, setColorTheme, setCustomTitle,
      setDiagramScale, setDiagramVerticalSpacing, setHarmonyColorByFamily, setHarmonyDiameter, setHarmonyFontSize,
      setHarmonyPlaybackStyle, setHarmonyRingVisibility, setHarmonyShowEnharmonics, setHarmonyShowExplanation, setHarmonyShowLegend,
      setHarmonyShowNoteRing, setHarmonyShowSeparators, setHarmonyShowToneTooltips, setHarmonyVoicingStyle, setInterfaceDensity,
      setLaMelodiosaBassRegister, setLaMelodiosaFollowStradellaRegisters, setLaMelodiosaTrebleRegister, setLabelFont, setLabelFontSize,
      setMusicNotationBarsPerLine, setMusicNotationChordFontSize, setMusicNotationIncludeDescription, setMusicNotationIncludeSummary, setMusicNotationIncludeTitle,
      setMusicNotationScale, setMusicNotationStaffSeparator, setMusicNotationStaffWidth, setMusicNotationUseBarsPerLine, setNotation,
      setPianoBlackKeyHeightScale, setPianoBlackKeyWidthScale, setPianoKeyHeightScale, setPianoKeyWidthScale, setReferenceStrokeWidth,
      setShowBellowsGuide, setShowButtonLabels, setShowStatusBar, setShowStradellaRowLabels, setShowTrebleOctaves,
      setSoundAttackMs, setSoundMusetteDetuneCents, setSoundNoteDurationMs, setSoundReleaseMs, setSoundSequenceTempoBpm,
      setSoundSource, setSoundVoicePreset, setSoundVolume, setSoundWaveform, setSpacing,
      setStradellaBassRegisterGrouping, setStradellaBassRegisterOctave, setStradellaBassVoicing, setStradellaChordRegisterGrouping, setStradellaChordRegisterOctave,
      setTitleFont, setTitleMode, setTitleSize, setTrebleAngle, setTrebleRows,
      showBellowsGuide, showButtonLabels, showStatusBar, showStradellaRowLabels, showTrebleOctaves,
      side, soundAttackMs, soundMusetteDetuneCents, soundNoteDurationMs, soundReleaseMs,
      soundSequenceTempoBpm, soundSource, soundVoicePreset, soundVolume, soundWaveform,
      spacing, stradellaBassRegisterGrouping, stradellaBassRegisterOctave, stradellaBassVoicing, stradellaChordRegisterGrouping,
      stradellaChordRegisterOctave, stradellaRegisterModel, t, titleFont, titleMode,
      titleSize, toggleSettingsSection, trebleAngle, trebleLayout, trebleRows,
      trebleSize, workspaceMode,
    },
    tools: {
      SEQUENCE_DISPLAY_MODE_OPTIONS, abcEditorExpanded, abcExampleOptions, abcExampleValue, abcFileName,
      abcMappedEvents, abcMissingPitchText, abcParseResult, abcPlaybackState, abcPositionBeat,
      abcStradellaMode, abcTempoBpm, abcText, abcTotalBeats, abcTrebleChordSymbolsMode,
      activeToolSection, addManualHarmonyProgressionChord, addSelectedHarmonyRelationshipToProgression, annotationBold, annotationButtonAnchor,
      annotationItalic, annotationLocationLabel, annotationOffsetPercent, annotationPreview, applyFingerToSelected,
      bassPatternBarsPerChord, bassPatternChordVoicing, bassPatternDefinitions, bassPatternEditorErrors, bassPatternEditorExpanded,
      bassPatternEditorMessage, bassPatternEditorText, bassPatternEvents, bassPatternExportFormat, bassPatternId,
      bassPatternMissingText, bassPatternPlaybackState, bassPatternRepeatSelection, bassPatternRoot, bassPatternTempoBpm,
      bassPatternTotalBeats, bassPatternValidationErrors, batchExporting, chordDisplayStyle, chordFinderActive,
      chordFinderButtons, chordFinderInversion, chordFinderOctave, chordFinderPattern, chordFinderRoot,
      chordProgressionDefinitions, chordProgressionId, clearAllFingerings, clearFingerForSelected, clearHarmonyRecordedProgression,
      clearSelection, clearSequence, clearTextNotes, customBassPatternDefinitions, deleteTextNote,
      deselectButton, downloadAllStradellaRealizations, exploreCurrentStradellaChordInHarmony, exportSelectedBassPattern, finderExplanationFontSize,
      finderMaxButtons, finderSpanColumns, fingeringDraft, fingeringPosition, formatProgressionOptionLabel,
      formatStradellaFinderPitches, formatStradellaFinderText, formatStradellaScaleFinderNames, formatTrebleChordFinderPitches, getMainLabel,
      harmonyDiatonicOnly, harmonyHighlightDiatonic, harmonyProgression, harmonyProgressionAllowApproximations, harmonyProgressionHandMovementWeight,
      harmonyProgressionManualFamilyId, harmonyProgressionManualRoot, harmonyProgressionPlan, harmonyProgressionPreviewIndex, harmonyProgressionRecording,
      harmonyProgressionRhythmPattern, harmonyRecordedProgression, harmonyRecordedProgressionPlaying, harmonyReferenceFamilyId, harmonyRelatedFamilyId,
      harmonyScaleId, harmonySelection, harmonyShowEnharmonics, harmonyShowNoteRing, isApplyingFingering,
      isRecordingSequence, isTrebleLikeSide, language, loadAbcExample, loadSelectedPatternIntoEditor,
      moveHarmonyProgressionChord, openHarmonyProgressionStepInChordFinder, pauseAbcPlayback, playChordFinder, playHarmonyRecordedProgression,
      playOptimizedHarmonyProgression, playRecordedSequence, playScaleFinder, playSelectedButtons, playStradellaChordFinder,
      previewHarmonyProgressionStepOnStradella, removeHarmonyProgressionChord, removeSelectedCustomBassPattern, resetHarmonyExplorer, saveCustomBassPattern,
      scaleFinderActive, scaleFinderButtons, scaleFinderDisplayMode, scaleFinderPattern, scaleFinderRoot,
      scaleFinderRowLimit, scheduleAbcPlayback, scheduleBassPatternPlayback, selectedBassPattern, selectedButtons,
      selectedChordProgression, selectionOnClick, sendHarmonyRecordedProgressionToAssistant, sequenceArrowheadSize, sequenceColorPreset,
      sequenceDisplayMode, sequenceNumberColorPreset, sequenceNumberFontSize, sequenceNumberPosition, sequenceSteps,
      sequenceThickness, setAbcActiveButtonIds, setAbcEditorExpanded, setAbcExampleValue, setAbcFileName,
      setAbcPlaybackState, setAbcPositionBeat, setAbcStradellaMode, setAbcTempoBpm, setAbcText,
      setAbcTrebleChordSymbolsMode, setAnnotationBold, setAnnotationButtonAnchor, setAnnotationItalic, setAnnotationOffsetPercent,
      setBassPatternBarsPerChord, setBassPatternChordVoicing, setBassPatternEditorExpanded, setBassPatternEditorText, setBassPatternExportFormat,
      setBassPatternId, setBassPatternRepeatSelection, setBassPatternRoot, setBassPatternTempoBpm, setChordFinderActive,
      setChordFinderInversion, setChordFinderOctave, setChordFinderPattern, setChordFinderRoot, setChordProgressionId,
      setFinderExplanationFontSize, setFinderMaxButtons, setFinderSpanColumns, setFingeringDraft, setFingeringPosition,
      setHarmonyDiatonicOnly, setHarmonyHighlightDiatonic, setHarmonyProgression, setHarmonyProgressionAllowApproximations, setHarmonyProgressionHandMovementWeight,
      setHarmonyProgressionManualFamilyId, setHarmonyProgressionManualRoot, setHarmonyProgressionPreviewIndex, setHarmonyProgressionRhythmPattern, setHarmonyReferenceFamilyId,
      setHarmonyRelatedFamilyId, setHarmonyScaleId, setHarmonyShowNoteRing, setIsApplyingFingering, setIsRecordingSequence,
      setScaleFinderActive, setScaleFinderDisplayMode, setScaleFinderPattern, setScaleFinderRoot, setScaleFinderRowLimit,
      setSelectionOnClick, setSequenceArrowheadSize, setSequenceColorPreset, setSequenceDisplayMode, setSequenceNumberColorPreset,
      setSequenceNumberFontSize, setSequenceNumberPosition, setSequenceThickness, setShowFinderRealizationNote, setShowStradellaVoicingIntervals,
      setShowTrebleVoicingNote, setSoundSequenceTempoBpm, setStradellaChordFinderActive, setStradellaChordFinderMarkRootBass, setStradellaChordFinderMode,
      setStradellaChordFinderPattern, setStradellaChordFinderRealizationIndex, setStradellaChordFinderRequestedBass, setStradellaChordFinderRoot, setStradellaMinimumNominalGap,
      setStradellaNoteLevels, setTextNoteColor, setTextNoteFont, setTextNoteFontSize, setTrebleChordVoicingMode,
      showFinderRealizationNote, showHarmonySelectionOnStradella, showStradellaVoicingIntervals, showTrebleVoicingNote, side,
      soundSequenceTempoBpm, stopAbcPlayback, stopBassPatternPlayback, stopHarmonyRecordedProgressionPlayback, stopSoundPlayback,
      stradellaChordFinderActive, stradellaChordFinderButtons, stradellaChordFinderMarkRootBass, stradellaChordFinderMode, stradellaChordFinderPattern,
      stradellaChordFinderPlaybackButtons, stradellaChordFinderRealizationIndex, stradellaChordFinderRealizations, stradellaChordFinderRequestedBass, stradellaChordFinderResult,
      stradellaChordFinderRoot, stradellaMinimumNominalGap, stradellaNoteLevels, stradellaRegisterModel, stradellaScaleFinderResult,
      t, textNoteColor, textNoteFont, textNoteFontSize, textNotes,
      toggleHarmonyProgressionRecording, toggleToolSection, trebleChordExplanation, trebleChordVoicingMode, workspaceMode,
    },
    workspace: {
      abcActiveButtonIdSet, abcNotationRef, abcParseResult, abcRenderedNotationVisible, abcText,
      accidentalStyle, activeToolSection, annotationButtonAnchor, annotationEditorRef, annotationLevelForLine,
      annotationPointForButton, bassPatternActiveButtonIdSet, bassPatternEvents, bassPatternNotationRef, bassPatternRenderedNotationVisible,
      bellowsEndLabel, bellowsLabelY, bellowsStartLabel, bellowsStripY, buttonSize,
      buttonTrebleFooter, buttons, cancelInlineAnnotation, chordDisplayStyle, chordFinderActive,
      chordFinderButtons, chordLabelMode, clearHarmonyWork, colorTheme, commitInlineAnnotation,
      downloadCurrentDiagram, downloadFormat, effectiveTitleSize, finalTitle, finderAnnotationDisplayLines,
      finderArrowheadMarkerId, finderButtonIds, finderExplanationFontSize, finderFooterEnabled, finderFooterHeight,
      finderVoicingAnalysis, finderVoicingChartVisible, fingeringPosition, getMainLabel, handleHarmonyChordActivated,
      handleSvgClick, harmonyAllFamiliesMode, harmonyAvailableCounts, harmonyColorByFamily, harmonyCounts,
      harmonyDiameter, harmonyEffectiveDiatonicOnly, harmonyEffectiveHighlightDiatonic, harmonyExplanation, harmonyFocusedReferenceRootPc,
      harmonyFontSize, harmonyPlaybackStyle, harmonyProgressionActiveButtonIdSet, harmonyProgressionNotationRef, harmonyProgressionNotationVisible,
      harmonyProgressionPlan, harmonyRecordedNotationRef, harmonyRecordedNotationVisible, harmonyRecordedProgression, harmonyReferenceFamily,
      harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyRelatedName, harmonyScale, harmonyScaleId,
      harmonySectors, harmonyShowEnharmonics, harmonyShowExplanation, harmonyShowLegend, harmonyShowNoteRing,
      harmonyShowSeparators, harmonyShowToneTooltips, harmonySvgRef, harmonyVoicingStyle, inlineAnnotationEditor,
      labelFont, labelFontSize, language, leftPanelMode, mobileDiagramView,
      navigateToTool, overlays, playHarmonyChord, playHarmonyChordRelationship, playHarmonyNote,
      progressionPreviewButtonIds, resetCurrentToolDefaults, resetDiagramWork, scaleFinderArrowStyle, scaleFinderButtons,
      selectAccordionSide, selectedBassPattern, selectedChordProgression, sequenceArrowStyle, sequenceArrowheadMarkerId,
      sequenceArrowheadSize, sequenceNotationRef, sequenceNumberPosition, sequenceRenderedNotationVisible, sequenceSteps,
      sequenceStepsWithButtons, setDownloadFormat, setHarmonySelection, setInlineAnnotationEditor, setMobileDiagramView,
      setPanel, setSoundEnabled, showBellowsGuide, showButtonLabels, showScaleFinderArrows,
      showScaleFinderNumbers, showSequenceArrows, showSequenceNumbers, showStatusBar, showStradellaRowLabels,
      side, soundEnabled, statusBarText, stopAbcPlayback, stopBassPatternPlayback,
      stradellaChordFinderActive, stradellaChordFinderPattern, stradellaChordFinderRoot, stradellaFinderFooterY, stradellaPrimaryFinderButtonIds,
      stradellaRootBassFinderButtonIds, svgRef, svgStyle, t, textNotes,
      titleFont, titleMode, toggleAbcNotation, toggleBassPatternNotation, toggleButton,
      toggleFocusPanel, toggleHarmonyProgressionNotation, toggleHarmonyRecordedNotation, toggleSequenceNotation, trebleFooterEnabled,
      trebleFooterFontSize, trebleFooterHeight, trebleFooterY, trebleVoicingNote, viewHeight,
      viewWidth, visibleRows, workspaceMode,
    },
  };}

/** Inferred controller contract shared by the three view modules. */
export type AppControllerModel = ReturnType<typeof useAppController>;
