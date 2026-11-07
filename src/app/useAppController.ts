import { audioTimelineOrigin, msUntilAudioTime, scheduleAtAudioOffset } from "../audio/audioClock";
import { ROOT_POSITION_BASS } from "../tools/stradellaChordFinder/harmonicIdentity";
import { progressionPulsePlan } from "../audio/progressionPulsePlan";

import { convertProgressionPreset } from "../tools/harmonyExplorer/progressionPresets";
import { accordionStatusText, diagramAutoTitle } from "../i18n/diagramLabels";
import { type StradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import { trebleContextualTitle } from "../tools/contextualTitles";
import { DEFAULT_CHORD_DISPLAY_STYLE, displayRealizedChord, displayStradellaButtonChord, type ChordDisplayStyle } from "../tools/chordDisplay";
import { chordToneName, displayRoot, realizedChordName, formatChordFinderTone } from "../tools/stradellaChordFinder/chordSpelling";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASS_OPTIONS, TREBLE_SIZE_OPTIONS, PIANO_TREBLE_RANGE_OPTIONS, COLOR_PRESETS, SEQUENCE_DISPLAY_MODE_OPTIONS, formatProgressionOptionLabel } from "./controllerOptions";
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
import { progressionNoteStep, toggleProgressionNoteId } from "../features/progressionAssistant/progressionNoteSelection";
import { useStradellaChordFinderState, useStradellaChordFinderResults } from "../features/stradellaChordFinder/useStradellaChordFinder";
import { useScaleFinderState, useScaleFinderResults } from "../features/scaleFinder/useScaleFinder";
import { useTrebleChordFinderState, useTrebleChordFinderButtons } from "../features/trebleChordFinder/useTrebleChordFinder";
import { flushSync } from "react-dom";
import { useSoundSettings } from "../audio/useSoundSettings";
import { playbackClockMs, clearPlaybackTimers } from "../audio/playbackTransport";
import { stopAbcTransport, pauseAbcTransport, stopBassPatternTransport } from "../audio/playbackLifecycle";
import { startAbcTransport, startBassPatternTransport } from "../audio/playbackStart";
import { scheduleAbcMappedPlayback, scheduleBassPatternEvents } from "../audio/playbackScheduling";
import { renderNotationInto as renderSharedNotation } from "../notation/notationService";
import { useNotationSettings } from "../notation/useNotationSettings";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { translateKnownLabel } from "../i18n/catalog";
import type { AccidentalMode, ButtonKind, ChordLabelMode, DiagramButton, DownloadFormat, InterfaceDensity, NotationMode, PianoTrebleRange, TrebleLayout, TrebleSizePreset } from "../types";
import { chordTones, formatPitch, INDEX_TO_PITCH, INTERVALS_FROM_C, isChordKind, rowFunction } from "../music";
import { generateStradella, stradellaVisibleRoots, stradellaVisibleRows } from "../stradella";
import { generateTreble } from "../treble";
import { generatePianoTreble } from "../pianoTreble";

import { accordionDiagramFilename, harmonyDiagramFilename, downloadDiagram, downloadDiagramBatch, svgPointFromClient } from "../diagram/diagramExport";
import { captureStradellaBatch } from "../diagram/stradellaBatchCapture";
import { calculateDiagramGeometry } from "../diagram/diagramGeometry";
import { resetStradellaFinder, resetDiagramWorkState } from "./resetCommands";
import { activeToolStatusLabel, workspaceGridColumns } from "./workspacePresentation";
import { sequenceArrowStyleFromMode, sequenceModeShowsArrows, sequenceModeShowsNumbers } from "../tools/sequenceTools";
import { SCALE_FINDER_OPTIONS, getScaleFinderTrebleButtons } from "../tools/scaleFinderTools";
import { bassPatternBeat, bassPatternEventsToAbc, bassPatternEventsToMidiBytes, bassPatternEventsToLilyPond, bassPatternEventsToStradellaNotationAbc, type StradellaNotationAbcOptions } from "../tools/bassPatternPlayerTools";
import { getChordFinderTrebleButtons } from "../tools/chordFinderTools";
import { intervalsForChordFinder } from "../music/chordDefinitions";
import { realizationAnnotation, finderChordSymbol } from "../tools/stradellaChordFinder/diagramAnnotations";
import { analyzeConfiguredStradellaVoicing } from "../tools/stradellaChordFinder/registerModel";
import { voicingIntervalLayout } from "../tools/stradellaChordFinder/voicingIntervalLayout";
import { describeTrebleChord } from "../tools/trebleChordExplanation";
import { playButtonArpeggioThenChord, playButtonCombination, playButtonRhythmProgression, playButtonSequence, playButtonSound, stopAllSound, preloadLaMelodiosa, unlockAudio, audioClockNow, samplesReadyFor, prepareSamplesFor, currentPlaybackGeneration, playHarmonyPitchClassChord, playHarmonyRelationship, notesForButton, onStopAllSound } from "../sound";
import type { ChordFamilyId } from "../tools/harmonyExplorer/music";
import { CIRCLE_OF_FIFTHS, DEFAULT_RING_VISIBILITY, chordLabel as harmonyChordLabel, chordMidiNotes as harmonyChordMidiNotes, pitchClassesForChord as harmonyPitchClassesForChord } from "../tools/harmonyExplorer/music";
import type { HarmonyPlaybackStyle } from "../tools/harmonyExplorer/types";
import type { HarmonyRecordedChord, HarmonyProgressionChord, ProgressionSearchSettings } from "../tools/harmonyExplorer/progression";
import { progressionFinderPattern } from "../tools/harmonyExplorer/progression";
import { isHarmonyProgressionChord } from "../tools/harmonyExplorer/progression";
import { progressionBassPulseButtons, progressionRealizationKey } from "../tools/harmonyExplorer/progression";
import { finderPatternForHarmonyFamily, harmonyFamilyForFinderPattern, pitchClassNameFromNumber, pitchClassNumberFromName } from "../tools/harmonyExplorer/integration";

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
  const {
    musicNotationIncludeTitle, setMusicNotationIncludeTitle,
    musicNotationIncludeDescription, setMusicNotationIncludeDescription,
    musicNotationIncludeSummary, setMusicNotationIncludeSummary,
    musicNotationUseBarsPerLine, setMusicNotationUseBarsPerLine,
    musicNotationBarsPerLine, setMusicNotationBarsPerLine,
    musicNotationChordFontSize, setMusicNotationChordFontSize,
    musicNotationScale, setMusicNotationScale,
    musicNotationStaffWidth, setMusicNotationStaffWidth,
    musicNotationStaffSeparator, setMusicNotationStaffSeparator,
  } = useNotationSettings();

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
    stradellaChordFinderRequestedBass, setStradellaChordFinderRequestedBass, stradellaChordFinderRootPreferred,
    finderMaxButtons, setFinderMaxButtons,
    finderSpanColumns, setFinderSpanColumns,
    stradellaMinimumNominalGap, setStradellaMinimumNominalGap,
    showFinderRealizationNote, setShowFinderRealizationNote,
    stradellaNoteLevels, setStradellaNoteLevels,
    finderExplanationFontSize, setFinderExplanationFontSize,
    pendingProgressionRealizationKey, setPendingProgressionRealizationKey,
    stradellaChordFinderMarkRootBass, setStradellaChordFinderMarkRootBass,
    stradellaRequestedBassOnBassButton, setStradellaRequestedBassOnBassButton,
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
    harmonyProgressionManualPattern, setHarmonyProgressionManualPattern,
    harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight,
    harmonyProgressionVoiceLeadingWeight, setHarmonyProgressionVoiceLeadingWeight,
    harmonyProgressionRootPosition, setHarmonyProgressionRootPosition,
    harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern,
    harmonyProgressionRealizationKeys, setHarmonyProgressionRealizationKeys,
    harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex,
    harmonyProgressionNoteStepId, setHarmonyProgressionNoteStepId,
    harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds,
    harmonyProgressionPulseSilent, setHarmonyProgressionPulseSilent,
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
      setHarmonyProgressionPulseSilent(false);
    }
  }, [activeToolSection, setHarmonyProgressionNotationVisible, setHarmonyProgressionActiveButtonIds, setHarmonyProgressionPulseSilent]);

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
    soundEnabled, setSoundEnabled, soundVolume, setSoundVolume, soundSource, setSoundSource, laMelodiosaTrebleRegister, setLaMelodiosaTrebleRegister, laMelodiosaBassRegister, setLaMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, setLaMelodiosaFollowStradellaRegisters, soundVoicePreset, setSoundVoicePreset, soundWaveform, setSoundWaveform, soundMusetteDetuneCents, setSoundMusetteDetuneCents, soundAttackMs, setSoundAttackMs, soundReleaseMs, setSoundReleaseMs, soundNoteDurationMs, setSoundNoteDurationMs, soundArticulation, setSoundArticulation, soundSequenceTempoBpm, setSoundSequenceTempoBpm, stradellaBassVoicing, setStradellaBassVoicing,
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
    setHarmonyProgressionHandMovementWeight,
    setHarmonyProgressionRhythmPattern,
    setHarmonyProgressionRootPosition,
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
    setSoundArticulation,
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
    setStradellaRequestedBassOnBassButton,
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
      harmonyProgressionHandMovementWeight,
      harmonyProgressionRhythmPattern,
      harmonyProgressionRootPosition,
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
      soundArticulation,
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
      stradellaRequestedBassOnBassButton,
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

  // The Progression Assistant searches each chord with the Chord Finder's own
  // limits, register model and bass rules, so that with both weights at 0 every
  // chord gets the Chord Finder's first realization.
  const progressionSearch = useMemo<ProgressionSearchSettings>(() => ({
    rootPosition: harmonyProgressionRootPosition,
    requestedBassOnBassButton: stradellaRequestedBassOnBassButton,
    maxButtons: finderMaxButtons,
    spanColumns: finderSpanColumns,
    registerModel: stradellaRegisterModel,
    minimumNominalGap: stradellaMinimumNominalGap,
  }), [harmonyProgressionRootPosition, stradellaRequestedBassOnBassButton, finderMaxButtons,
    finderSpanColumns, stradellaRegisterModel, stradellaMinimumNominalGap]);
  const { harmonyProgressionPlan, harmonyProgressionRealizationOptions,
    progressionPreviewButtonIds, harmonyProgressionActiveButtonIdSet, harmonyProgressionNoteStep,
  } = useHarmonyProgressionResults({
    basses, buttonSize, spacing, stradellaAccidental, diagramVerticalSpacing,
    harmonyProgression,
    harmonyProgressionHandMovementWeight, harmonyProgressionVoiceLeadingWeight, harmonyProgressionRealizationKeys, harmonyProgressionPreviewIndex, harmonyProgressionNoteStepId,
    setHarmonyProgressionRealizationKeys, setHarmonyProgressionPreviewIndex, setHarmonyProgressionNoteStepId, harmonyProgressionActiveButtonIds, harmonyProgressionPulseSilent,
    activeToolSection, progressionSearch,
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
    stradellaChordFinderRootFallback, stradellaChordFinderBassButtonFallback, stradellaChordFinderReachExtendedTo,
    stradellaChordFinderEffectiveRequestedBass,
  } = useStradellaChordFinderResults({
    buttons, side, stradellaRegisterModel,
    stradellaChordFinderActive,
    stradellaChordFinderRoot, stradellaChordFinderPattern,
    stradellaChordFinderMode, stradellaChordFinderRealizationIndex,
    stradellaChordFinderRequestedBass, stradellaChordFinderRootPreferred, finderMaxButtons, finderSpanColumns,
    stradellaMinimumNominalGap, stradellaChordFinderMarkRootBass, stradellaRequestedBassOnBassButton,
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

  const progressionRhythmPulses = useCallback((step: (typeof harmonyProgressionPlan.steps)[number]) =>
    progressionPulsePlan(
      step.result.playbackButtons,
      progressionBassPulseButtons(buttons, step),
      harmonyProgressionRhythmPattern,
      (button) => Math.min(...notesForButton(button, soundOptions).map((note) =>
        note.octave * 12 + (pitchClassNumberFromName(note.pitchClass) ?? 0))),
    ),
  [buttons, harmonyProgressionRhythmPattern, soundOptions, harmonyProgressionPlan]);

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
        return `${index === 0 ? `"${step.label}"` : ""}${unique.length ? `[${unique.join("")}]` : "z"}`;
      });
      return tokens.join(" ");
    });
    return [
      "X:1",
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
  ): HarmonyRecordedChord {
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
    // One recorded event per beat, placed on the audio clock like the other players.
    const ports = { now: audioClockNow, push: (id: number) => harmonyRecordedPlaybackTimeoutsRef.current.push(id) };
    const origin = audioTimelineOrigin(ports.now);
    const durationMs = beatMs * soundOptions.articulation;

    harmonyRecordedProgression.forEach((event, index) => {
      scheduleAtAudioOffset(ports, origin, index * beatMs, (when) => {
        if (event.kind === "note") {
          playHarmonyPitchClassChord(
            [pitchClassNameFromNumber(event.pitchClass)],
            soundOptions,
            "block",
            { at: when, durationMs },
          );
        } else {
          playHarmonyPitchClassChord(
            harmonyPitchNames(event.rootPc, event.familyId),
            soundOptions,
            harmonyPlaybackStyle,
            { at: when, durationMs },
          );
        }
      });
    });

    const stopTimeout = window.setTimeout(
      () => stopHarmonyRecordedProgressionPlayback(),
      msUntilAudioTime(ports, origin + (harmonyRecordedProgression.length * beatMs + Math.min(600, beatMs)) / 1000),
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
    setHarmonyProgressionNoteStepId(null);
    enterProgressionAssistant(progressionDestinationPorts(), "transfer");
  }

  function sameHarmonyProgressionChord(a: HarmonyProgressionChord | undefined, b: HarmonyProgressionChord) {
    return !!a && a.rootPc === b.rootPc && progressionFinderPattern(a) === progressionFinderPattern(b);
  }

  function useHarmonyProgressionPreset(id: string, keyRoot: string) {
    const definition = chordProgressionDefinitions.find((item) => item.id === id);
    if (!definition) return;
    const converted = convertProgressionPreset(definition, keyRoot);
    if (converted.unsupported.length > 0 || converted.chords.length === 0) return;
    stopSoundPlayback();
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionRealizationKeys({});
    setHarmonyProgressionPreviewIndex(null);
    setHarmonyProgressionNoteStepId(null);
    setHarmonyProgression(converted.chords.map(({ rootPc, pattern, sectorIndex }) => ({
      id: `harmony-progression-${harmonyProgressionIdRef.current++}`, rootPc, pattern, sectorIndex,
    })));
  }

  function addManualHarmonyProgressionChord() {
    const rootPc = pitchClassNumberFromName(harmonyProgressionManualRoot);
    if (rootPc === null) return;
    setHarmonyProgression((current) => [
      ...current,
      { id: `harmony-progression-${harmonyProgressionIdRef.current++}`,
        rootPc, pattern: harmonyProgressionManualPattern,
        sectorIndex: harmonyProgressionSectorIndex(rootPc) },
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

  function cycleHarmonyProgressionRealization(index: number, direction: -1 | 1) {
    const chord = harmonyProgression[index];
    if (!chord) return;
    const available = harmonyProgressionRealizationOptions[chord.id] ?? [];
    if (available.length === 0) return;
    // The first position is Auto (global optimized path), followed by every
    // original-ranked Chord Finder candidate, including ranks beyond five.
    const choices = [null, ...available.map(({ result }) => progressionRealizationKey(result))];
    const current = harmonyProgressionRealizationKeys[chord.id] ?? null;
    const position = Math.max(0, choices.indexOf(current));
    const selected = choices[(position + direction + choices.length) % choices.length];
    stopSoundPlayback(); // An old scheduled rhythm must never play against a new visible plan.
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionRealizationKeys((previous) => {
      const next = { ...previous };
      if (selected === null) delete next[chord.id];
      else next[chord.id] = selected;
      return next;
    });
    // If a different chord owns the eye, its notes must not override the
    // realization now being navigated with the arrows.
    if (harmonyProgressionNoteStepId && harmonyProgressionNoteStepId !== chord.id) setHarmonyProgressionNoteStepId(null);
    setHarmonyProgressionPreviewIndex(index);
  }

  function previewHarmonyProgressionStepOnStradella(index: number) {
    const step = harmonyProgressionPlan.steps[index];
    if (!step) return;
    setHarmonyProgressionPreviewIndex(index);
    setHarmonyProgressionNoteStepId(step.chord.id);
    enterProgressionAssistant(progressionDestinationPorts(), "preview");
  }

  function toggleHarmonyProgressionStepNotes(id: string) {
    if (!progressionNoteStep(harmonyProgressionPlan, id)) return;
    const index = harmonyProgressionPlan.steps.findIndex((step) => step.chord.id === id);
    if (index < 0) return;
    if (toggleProgressionNoteId(harmonyProgressionNoteStepId, id) === null) {
      setHarmonyProgressionNoteStepId(null);
      setHarmonyProgressionPreviewIndex(null);
    } else {
      stopSoundPlayback();
      setHarmonyProgressionNoteStepId(id);
      // Routing retains the tool and the Stradella side; it cannot pin or
      // change this step's sounding realization.
      previewHarmonyProgressionStepOnStradella(index);
    }
  }

  function playOptimizedHarmonyProgression() {
    if (!harmonyProgressionPlan.playable) return;
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionPulseSilent(false);
    const pulses = harmonyProgressionPlan.steps.map(progressionRhythmPulses);
    startWhenSamplesReady(pulses.flat(2), () => {
      playButtonRhythmProgression(
        harmonyProgressionPlan.steps.map((step) => step.result.playbackButtons),
        soundOptions,
        harmonyProgressionRhythmPattern,
        {
          onActiveButtons: (buttonIds, progressionIndex) => {
            setHarmonyProgressionPulseSilent(buttonIds.length === 0);
            setHarmonyProgressionActiveButtonIds(buttonIds);
            setHarmonyProgressionPreviewIndex(progressionIndex);
          },
          onDone: () => {
            setHarmonyProgressionActiveButtonIds([]);
            setHarmonyProgressionPulseSilent(false);
            setSoundEnginePlayer(null);
          },
        },
        harmonyProgressionPlan.steps.map((step) => progressionBassPulseButtons(buttons, step)),
        pulses,
      );
      // Set after the player's own stopAllSound(), which clears this state.
      if (soundOptions.enabled) setSoundEnginePlayer("progression");
    });
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
      setStradellaChordFinderRequestedBass(ROOT_POSITION_BASS);
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

  // Sample preloading waits for the first user gesture, so a visit that never
  // plays anything downloads no audio and no AudioContext starts before
  // interaction. It also fetches only the side the workspace plays: Stradella
  // and Harmony use bass samples, Treble uses treble samples.
  const [audioGestureSeen, setAudioGestureSeen] = useState(false);
  // True while a transport waits for its samples; the playback bar says so.
  const [samplesLoading, setSamplesLoading] = useState(false);
  // The Progression Assistant and Sequence players run entirely inside the
  // sound engine, so their playing state ends when they finish or when any
  // stopAllSound() runs (Stop, Reset, or another player starting).
  const [soundEnginePlayer, setSoundEnginePlayer] = useState<"progression" | "sequence" | null>(null);
  useEffect(() => onStopAllSound(() => setSoundEnginePlayer(null)), []);
  // Session-only: draw the Progression Assistant path (numbered steps) on the diagram. Off by default.
  const [progressionPathVisible, setProgressionPathVisible] = useState(false);
  useEffect(() => {
    if (audioGestureSeen) return;
    const onFirstGesture = () => {
      unlockAudio();
      setAudioGestureSeen(true);
    };
    const options = { capture: true } as const;
    window.addEventListener("pointerdown", onFirstGesture, options);
    window.addEventListener("keydown", onFirstGesture, options);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture, options);
      window.removeEventListener("keydown", onFirstGesture, options);
    };
  }, [audioGestureSeen]);
  const sampleSide = workspaceMode === "harmony" || side === "stradella" ? "bass" : "treble";
  useEffect(() => {
    if (!audioGestureSeen || !soundEnabled || soundSource !== "la-melodiosa") return;
    void preloadLaMelodiosa(
      sampleSide === "treble" ? laMelodiosaTrebleRegister : null,
      sampleSide === "bass" ? laMelodiosaBassRegister : null,
    );
  }, [audioGestureSeen, sampleSide, soundEnabled, soundSource, laMelodiosaTrebleRegister, laMelodiosaBassRegister]);

  /** Tool-specific side effects remain explicit until the command service is extracted.
   * Navigation itself is owned by the workspace controller, not by tool state. */
  function toggleToolSection(section: Exclude<ToolSection, null>) {
    const opening = activeToolSection !== section;
    toggleWorkspaceToolSection(section);
    // Opening a Chord Finder shows its current chord at once; "Hide chord"
    // remains the explicit way to clear it. Finder highlights stay exclusive.
    // Opening any other tool hides both Chord Finders' highlights and the
    // Results panel; their chord and selected realization are kept, so
    // reopening the Chord Finder shows the same result again.
    if (opening && section !== "stradellaChordFinder" && section !== "chordFinder") {
      setStradellaChordFinderActive(false);
      setChordFinderActive(false);
    }
    if (opening && section === "stradellaChordFinder") {
      setStradellaChordFinderActive(true);
      setScaleFinderActive(false);
      setChordFinderActive(false);
    }
    if (opening && section === "chordFinder") {
      setChordFinderActive(true);
      setScaleFinderActive(false);
      setStradellaChordFinderActive(false);
    }
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
    const sequenceButtons = sequenceStepsWithButtons.map((step) => step.button);
    startWhenSamplesReady(sequenceButtons, () => {
      playButtonSequence(sequenceButtons, soundOptions, () => setSoundEnginePlayer(null));
      // Set after the player's own stopAllSound(), which clears this state.
      if (soundOptions.enabled && sequenceButtons.length > 0) setSoundEnginePlayer("sequence");
    });
  }

  function clearAbcTimers() {
    clearPlaybackTimers(abcPlaybackTimeoutsRef);
  }

  function stopAbcPlayback() {
    stopAbcTransport({
      clearTimers: clearAbcTimers, setState: setAbcPlaybackState,
      setPosition: setAbcPositionBeat, setActiveButtons: setAbcActiveButtonIds,
      startedAtRef: abcPlaybackStartedAtRef, stopSound: stopAllSound,
    });
  }

  function pauseAbcPlayback() {
    pauseAbcTransport({
      playbackState: abcPlaybackState,
      startedAt: abcPlaybackStartedAtRef.current,
      startingBeat: abcPlaybackStartBeatRef.current,
      tempoBpm: abcTempoBpm, totalBeats: abcTotalBeats,
      nowMs: playbackClockMs, setPosition: setAbcPositionBeat,
      setState: setAbcPlaybackState, setActiveButtons: setAbcActiveButtonIds,
      clearTimers: clearAbcTimers, stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      clearProgressionButtons: () => setHarmonyProgressionActiveButtonIds([]),
    });
  }

  /**
   * Starts a transport once the samples it needs are decoded, so the first
   * notes are not late. Usually they already are (see the preload effect). A
   * Stop, or any other playback start, while they load cancels this start.
   */
  function startWhenSamplesReady(buttonsToPlay: DiagramButton[], start: () => void) {
    if (samplesReadyFor(buttonsToPlay, soundOptions)) {
      start();
      return;
    }
    const generation = currentPlaybackGeneration();
    setSamplesLoading(true);
    void prepareSamplesFor(buttonsToPlay, soundOptions).then(() => {
      setSamplesLoading(false);
      if (currentPlaybackGeneration() === generation) start();
    });
  }

  function scheduleAbcPlayback(startBeat = abcPositionBeat) {
    startWhenSamplesReady(abcMappedEvents.flatMap((event) => event.buttons), () => startAbcTransport({
      eventCount: abcMappedEvents.length, startBeat,
      clearTimers: clearAbcTimers, stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      clearProgressionButtons: () => setHarmonyProgressionActiveButtonIds([]),
      setScaleFinderActive, setChordFinderActive, setStradellaFinderActive: setStradellaChordFinderActive,
      setPlaybackState: setAbcPlaybackState, setPosition: setAbcPositionBeat,
      startedAtRef: abcPlaybackStartedAtRef, startBeatRef: abcPlaybackStartBeatRef,
      nowMs: playbackClockMs,
      schedule: () => scheduleAbcMappedPlayback({abcMappedEvents, startBeat, abcTempoBpm,
        abcTotalBeats, abcPlaybackTimeoutsRef, abcPlaybackStartedAtRef,
        soundOptions, setAbcPositionBeat, setAbcActiveButtonIds, setAbcPlaybackState}),
    }));
  }

  function clearBassPatternTimers() {
    clearPlaybackTimers(bassPatternTimeoutsRef);
  }

  function stopBassPatternPlayback() {
    stopBassPatternTransport({
      runRef: bassPatternPlaybackRunRef, clearTimers: clearBassPatternTimers,
      setState: setBassPatternPlaybackState,
      setActiveButtons: setBassPatternActiveButtonIds, stopSound: stopAllSound,
    });
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
      selectedBassPattern.meter,
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
    startWhenSamplesReady(bassPatternEvents.flatMap((event) => event.buttons), () => startBassPatternTransport({
      eventCount: bassPatternEvents.length, runRef: bassPatternPlaybackRunRef,
      clearTimers: clearBassPatternTimers, stopAbc: stopAbcPlayback,
      clearActiveButtons: () => setBassPatternActiveButtonIds([]),
      stopSound: stopAllSound,
      setScaleFinderActive, setChordFinderActive, setStradellaFinderActive: setStradellaChordFinderActive,
      setPlaybackState: setBassPatternPlaybackState,
      schedule: (runId) => scheduleBassPatternEvents({bassPatternEvents, bassPatternTempoBpm,
        bassPatternUnitsPerBeat: bassPatternBeat(selectedBassPattern?.meter ?? "4/4").unitsPerBeat,
        bassPatternTotalBeats, bassPatternLoopMode, bassPatternLoopCount,
        bassPatternTimeoutsRef, bassPatternPlaybackRunRef, runId, soundOptions,
        setBassPatternActiveButtonIds, setBassPatternPlaybackState}),
    }));
  }

  /** Stops currently playing notes and any scheduled sequence playback. */
  function stopSoundPlayback() {
    stopAbcPlayback();
    stopBassPatternPlayback();
    stopAllSound();
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionPulseSilent(false);
  }

  /** Clear Harmony selection/recording without discarding user preferences. */
  function clearHarmonyWork() {
    setHarmonySelection(null);
    setHarmonyFocusedReferenceRootPc(null);
    setHarmonyProgressionRecording(false);
    setHarmonyRecordedProgression([]);
    setHarmonyRecordedNotationVisible(false);
    setHarmonyProgressionPreviewIndex(null);
    setHarmonyProgressionNoteStepId(null);
    setHarmonyProgressionActiveButtonIds([]);
    setHarmonyProgressionPulseSilent(false);
    stopAllSound();
  }

  /** Reset Finder-local preferences, without altering instrument or sound state. */
  function resetStradellaFinderDefaults() {
    resetStradellaFinder({
      setRoot: setStradellaChordFinderRoot,
      setPattern: setStradellaChordFinderPattern,
      setMode: setStradellaChordFinderMode,
      setRequestedBass: setStradellaChordFinderRequestedBass,
      setRealizationIndex: setStradellaChordFinderRealizationIndex,
      setMaxButtons: setFinderMaxButtons, setSpanColumns: setFinderSpanColumns,
      setMinimumNominalGap: setStradellaMinimumNominalGap,
      setMarkRootBass: setStradellaChordFinderMarkRootBass,
      setShowRealizationNote: setShowFinderRealizationNote,
      setShowVoicingIntervals: setShowStradellaVoicingIntervals,
      setNoteLevels: setStradellaNoteLevels,
      setExplanationFontSize: setFinderExplanationFontSize,
    });
  }

  function resetCurrentToolDefaults() {
    if (workspaceMode === "harmony") resetHarmonyExplorer();
    else if (side === "stradella" && activeToolSection === "stradellaChordFinder") {
      resetStradellaFinderDefaults();
      resetDiagramWork();
    }
  }

  /** Work reset deliberately leaves preferences (including sample settings) alone. */
  function resetDiagramWork() {
    setHarmonyProgressionNoteStepId(null);
    resetDiagramWorkState({
      setOverlays, setSequenceSteps, setRecording: setIsRecordingSequence,
      setApplyingFingering: setIsApplyingFingering,
      setTextNotes, setScaleFinderActive, setChordFinderActive,
      setStradellaChordFinderActive,
      setProgressionPreview: setHarmonyProgressionPreviewIndex,
      stopAbc: stopAbcPlayback, stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      setProgressionActiveButtons: setHarmonyProgressionActiveButtonIds,
    });
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
    try {
      const snapshots = captureStradellaBatch({
        candidates, originalIndex: stradellaChordFinderRealizationIndex,
        selectIndex: (index) => flushSync(() => setStradellaChordFinderRealizationIndex(index)),
        currentSvg: () => svgRef.current,
        filenameKey: (candidate) => realizationAnnotation(
          stradellaChordFinderRoot, stradellaChordFinderPattern, candidate,
          stradellaRegisterModel, stradellaChordFinderEffectiveRequestedBass,
          stradellaNoteLevels, chordDisplayStyle, language,
        )?.filenameKey,
        format: downloadFormat,
      });
      await downloadDiagramBatch(snapshots, downloadFormat, `stradella-${stradellaChordFinderRoot}-${stradellaChordFinderPattern}-${downloadFormat}-${snapshots.length}-realizations.zip`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not export all diagrams.");
    } finally {
      setBatchExporting(false);
    }
  }

  /** The application determines musical titles; the diagram export service
   * owns filename normalization, format dispatch and viewBox coordinate mapping. */
  function downloadCurrentDiagram(format: DownloadFormat = downloadFormat) {
    if (workspaceMode === "harmony") {
      if (!harmonySvgRef.current) return;
      const name = harmonyDiagramFilename(harmonyReferenceFamily.shortName, harmonyRelatedName, harmonyScale.name);
      downloadDiagram(harmonySvgRef.current, name, format);
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
    downloadDiagram(svgRef.current, accordionDiagramFilename(rawName, layoutName), format);
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
    ? realizationAnnotation(stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderResult, stradellaRegisterModel, stradellaChordFinderEffectiveRequestedBass, stradellaNoteLevels, chordDisplayStyle, language)
    : null;
  const finderAnnotationActive = side === "stradella" && stradellaChordFinderActive && finderAnnotation !== null;
  const progressionNotePattern = harmonyProgressionNoteStep ? progressionFinderPattern(harmonyProgressionNoteStep.chord) : null;
  const progressionNoteRoot = harmonyProgressionNoteStep ? pitchClassNameFromNumber(harmonyProgressionNoteStep.chord.rootPc) : null;
  const progressionAnnotationActive = side === "stradella" && activeToolSection === "progressionAssistant" &&
    Boolean(harmonyProgressionNoteStep && progressionNotePattern && progressionNoteRoot) &&
    harmonyProgressionActiveButtonIds.length === 0 && !harmonyProgressionPulseSilent;
  const progressionAnnotation = progressionAnnotationActive && harmonyProgressionNoteStep && progressionNotePattern && progressionNoteRoot
    ? realizationAnnotation(progressionNoteRoot, progressionNotePattern, harmonyProgressionNoteStep.result,
      stradellaRegisterModel, null, stradellaNoteLevels, chordDisplayStyle, language)
    : null;
  // One common diagram-note pipeline: Finder annotations or eye-selected
  // progression realization. Never infer the played buttons from guide markers.
  const diagramNoteAnnotation = progressionAnnotation ?? (finderAnnotationActive && showFinderRealizationNote ? finderAnnotation : null);
  const diagramNoteRoot = progressionAnnotation ? progressionNoteRoot! : stradellaChordFinderRoot;
  const diagramNotePattern = progressionAnnotation ? progressionNotePattern! : stradellaChordFinderPattern;
  const diagramNotePlaybackButtons = progressionAnnotation ? harmonyProgressionNoteStep!.result.playbackButtons : stradellaChordFinderResult.playbackButtons;
  const finderFooterEnabled = Boolean(diagramNoteAnnotation?.lines.length);
  const finderLineLabels = {
    identity: `${t("analysis.harmonicIdentity")}:`,
    pitchClasses: `${t("analysis.pitchClassRealization")}:`,
    voicing: `${t("analysis.registralVoicing")}:`,
    physical: `${t("analysis.physicalRealization")}:`,
  } satisfies Record<keyof StradellaNoteLevels, string>;
  const annotationLevelForLine = (line: string): keyof StradellaNoteLevels | null =>
    (Object.entries(finderLineLabels).find(([, prefix]) => line.startsWith(prefix))?.[0] as keyof StradellaNoteLevels | undefined) ?? null;
  const finderVoicingAnalysis = finderFooterEnabled && showStradellaVoicingIntervals && stradellaNoteLevels.voicing
    ? analyzeConfiguredStradellaVoicing(
      diagramNotePlaybackButtons,
      diagramNoteRoot,
      stradellaRegisterModel,
    )
    : null;
  const finderVoicingLayout = finderVoicingAnalysis ? voicingIntervalLayout(finderVoicingAnalysis.notes, {
    fontSize: finderExplanationFontSize,
    displayLabel: (note, count) => `${chordToneName(diagramNoteRoot, diagramNotePattern, note.pitchClass)}${note.octave}${count > 1 ? ` ×${count}` : ""}`,
  }) : null;
  const finderVoicingChartVisible = Boolean(finderVoicingLayout && finderVoicingLayout.positions.length >= 2);
  // The note generator owns the stable ordering, independently of the chart toggle.
  const finderAnnotationDisplayLines = diagramNoteAnnotation?.lines ?? [];
  // Report the actual highlighted buttons for every chord family.
  const trebleChordExplanation = describeTrebleChord(
    chordFinderButtons, chordFinderRoot, chordFinderPattern, trebleChordVoicingMode, language,
  );
  const trebleVoicingNote = side === "treble" && chordFinderActive ? trebleChordExplanation.note : "";
  const trebleFooterEnabled = Boolean(showTrebleVoicingNote && trebleVoicingNote);
  const contextualTitle = (() => {
    if (progressionAnnotationActive && progressionAnnotation) return progressionAnnotation.title;
    if (side === "stradella" && stradellaChordFinderActive) {
      return finderAnnotationActive ? finderAnnotation?.title ?? localizedAutoTitle()
        : `${displayRealizedChord(stradellaChordFinderRoot, stradellaChordFinderPattern, realizedChordName(stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderEffectiveRequestedBass, stradellaChordFinderEffectiveRequestedBass, `${displayRoot(stradellaChordFinderRoot)}${finderChordSymbol(stradellaChordFinderRoot, stradellaChordFinderPattern).slice(stradellaChordFinderRoot.length)}`), chordDisplayStyle)} - ${t("ui.titleNoRealization")}`;
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

  const {
    viewWidth, effectiveTitleSize, buttonTrebleFooter, trebleFooterY, trebleFooterFontSize,
    trebleFooterHeight, finderFooterHeight, stradellaFinderFooterY, viewHeight,
  } = calculateDiagramGeometry({
    side, isPianoTreble, pianoTrebleRange, trebleSize, buttonSize, spacing,
    pianoKeyWidthScale, pianoKeyHeightScale, diagramVerticalSpacing,
    visibleRootCount: visibleRoots.length, visibleRowCount: visibleRows.length,
    buttons, titleMode, titleSize, finalTitle, trebleVoicingNote,
    finderAnnotationDisplayLines, finderExplanationFontSize,
    finderVoicingChartVisible,
    voicingChartHeight: finderVoicingLayout?.metrics.height ?? 0,
    annotationLevelForLine, trebleFooterEnabled, finderFooterEnabled,
  });

  const appGridColumns = workspaceGridColumns(interfaceDensity, leftPanelMode);

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

  const activeToolLabel = activeToolStatusLabel({
    side, bassPatternPlaybackState, abcPlaybackState, activeToolSection,
    scaleFinderActive, stradellaChordFinderActive, chordFinderActive,
    isRecordingSequence, isApplyingFingering, selectionOnClick, t,
  });

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
      setSoundAttackMs, setSoundMusetteDetuneCents, setSoundNoteDurationMs, setSoundArticulation, soundArticulation, setSoundReleaseMs, setSoundSequenceTempoBpm,
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
      progressionPathVisible, setProgressionPathVisible,
      abcMappedEvents, abcMissingPitchText, abcParseResult, abcPlaybackState, abcPositionBeat,
      abcStradellaMode, abcTempoBpm, abcText, abcTotalBeats, abcTrebleChordSymbolsMode,
      activeToolSection, useHarmonyProgressionPreset, addManualHarmonyProgressionChord, addSelectedHarmonyRelationshipToProgression, annotationBold, annotationButtonAnchor,
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
      harmonyDiatonicOnly, harmonyHighlightDiatonic, harmonyProgression, harmonyProgressionHandMovementWeight, harmonyProgressionRootPosition, setHarmonyProgressionRootPosition,
      harmonyProgressionManualPattern, harmonyProgressionManualRoot, harmonyProgressionVoiceLeadingWeight, harmonyProgressionPlan, harmonyProgressionRealizationOptions, harmonyProgressionRealizationKeys, cycleHarmonyProgressionRealization, harmonyProgressionPreviewIndex, harmonyProgressionNoteStepId, toggleHarmonyProgressionStepNotes, harmonyProgressionRecording,
      harmonyProgressionRhythmPattern, harmonyRecordedProgression, harmonyRecordedProgressionPlaying, harmonyReferenceFamilyId, harmonyRelatedFamilyId,
      harmonyScaleId, harmonySelection, harmonyShowEnharmonics, harmonyShowNoteRing, isApplyingFingering,
      isRecordingSequence, isTrebleLikeSide, language, loadAbcExample, loadSelectedPatternIntoEditor,
      moveHarmonyProgressionChord, pauseAbcPlayback, playChordFinder, playHarmonyRecordedProgression,
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
      setHarmonyDiatonicOnly, setHarmonyHighlightDiatonic, setHarmonyProgression, setHarmonyProgressionHandMovementWeight,
      setHarmonyProgressionManualPattern, setHarmonyProgressionManualRoot, setHarmonyProgressionVoiceLeadingWeight, setHarmonyProgressionPreviewIndex, setHarmonyProgressionNoteStepId, setHarmonyProgressionRhythmPattern, setHarmonyReferenceFamilyId,
      setHarmonyRelatedFamilyId, setHarmonyScaleId, setHarmonyShowNoteRing, setIsApplyingFingering, setIsRecordingSequence,
      setScaleFinderActive, setScaleFinderDisplayMode, setScaleFinderPattern, setScaleFinderRoot, setScaleFinderRowLimit,
      setSelectionOnClick, setSequenceArrowheadSize, setSequenceColorPreset, setSequenceDisplayMode, setSequenceNumberColorPreset,
      setSequenceNumberFontSize, setSequenceNumberPosition, setSequenceThickness, setShowFinderRealizationNote, setShowStradellaVoicingIntervals,
      setShowTrebleVoicingNote, setSoundSequenceTempoBpm, setStradellaChordFinderActive, setStradellaChordFinderMarkRootBass, stradellaRequestedBassOnBassButton, setStradellaRequestedBassOnBassButton, setStradellaChordFinderMode,
      setStradellaChordFinderPattern, setStradellaChordFinderRealizationIndex, setStradellaChordFinderRequestedBass, setStradellaChordFinderRoot, setStradellaMinimumNominalGap,
      setStradellaNoteLevels, setTextNoteColor, setTextNoteFont, setTextNoteFontSize, setTrebleChordVoicingMode,
      showFinderRealizationNote, showHarmonySelectionOnStradella, showStradellaVoicingIntervals, showTrebleVoicingNote, side,
      soundSequenceTempoBpm, stopAbcPlayback, stopBassPatternPlayback, stopHarmonyRecordedProgressionPlayback, stopSoundPlayback,
      stradellaChordFinderActive, stradellaChordFinderButtons, stradellaChordFinderMarkRootBass, stradellaChordFinderMode, stradellaChordFinderPattern,
      stradellaChordFinderPlaybackButtons, stradellaChordFinderRealizationIndex, stradellaChordFinderRealizations, stradellaChordFinderRequestedBass, stradellaChordFinderEffectiveRequestedBass, stradellaChordFinderRootFallback, stradellaChordFinderBassButtonFallback, stradellaChordFinderReachExtendedTo, stradellaChordFinderResult,
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
      downloadCurrentDiagram, downloadFormat, effectiveTitleSize, finalTitle, diagramNoteRoot, diagramNotePattern, finderAnnotationDisplayLines,
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
      // Shared playback bar under the diagram (one transport for every player).
      abcMappedEvents, abcPlaybackState, abcPositionBeat, bassPatternPlaybackState,
      harmonyRecordedProgressionPlaying, pauseAbcPlayback, playHarmonyRecordedProgression, playOptimizedHarmonyProgression,
      playRecordedSequence, samplesLoading, scheduleAbcPlayback, scheduleBassPatternPlayback, soundEnginePlayer,
      stopHarmonyRecordedProgressionPlayback, stopSoundPlayback, progressionPathVisible,
    },
  };}

/** Inferred controller contract shared by the three view modules. */
export type AppControllerModel = ReturnType<typeof useAppController>;
