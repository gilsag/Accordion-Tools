import { accordionStatusText } from "../i18n/diagramLabels";
import { type StradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import { trebleContextualTitle } from "../tools/contextualTitles";
import { DEFAULT_CHORD_DISPLAY_STYLE, displayRealizedChord, type ChordDisplayStyle } from "../tools/chordDisplay";
import { chordToneName, displayRoot, realizedChordName } from "../tools/stradellaChordFinder/chordSpelling";
import { useEffect, useMemo, useRef, useState } from "react";
import { BASS_OPTIONS, TREBLE_SIZE_OPTIONS, PIANO_TREBLE_RANGE_OPTIONS, COLOR_PRESETS, SEQUENCE_DISPLAY_MODE_OPTIONS, formatProgressionOptionLabel } from "./controllerOptions";
import { useLanguageSettings } from "../settings/useLanguageSettings";
import { useWorkspaceNavigation } from "../app/useWorkspaceNavigation";
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
import { useNotationSettings } from "../notation/useNotationSettings";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { translateKnownLabel } from "../i18n/catalog";
import type { AbcHands, AccidentalMode, ChordLabelMode, DiagramButton, DownloadFormat, InterfaceDensity, NotationMode, PianoTrebleRange, TrebleLayout, TrebleSizePreset } from "../types";
import { stradellaVisibleRoots, stradellaVisibleRows } from "../stradella";
import { stradellaButtonsFor, trebleButtonsFor, type SideButtonSettings } from "./sideButtons";

import { accordionDiagramFilename, harmonyDiagramFilename, downloadDiagram, downloadDiagramBatch, svgPointFromClient } from "../diagram/diagramExport";
import { captureStradellaBatch } from "../diagram/stradellaBatchCapture";
import { calculateDiagramGeometry } from "../diagram/diagramGeometry";
import { resetStradellaFinder, resetDiagramWorkState } from "./resetCommands";
import { activeToolStatusLabel } from "./workspacePresentation";
import { sequenceArrowStyleFromMode, sequenceModeShowsArrows, sequenceModeShowsNumbers } from "../tools/sequenceTools";
import { SCALE_FINDER_OPTIONS, getScaleFinderTrebleButtons } from "../tools/scaleFinderTools";
import { getChordFinderTrebleButtons } from "../tools/chordFinderTools";
import { realizationAnnotation, finderChordSymbol } from "../tools/stradellaChordFinder/diagramAnnotations";
import { analyzeConfiguredStradellaVoicing } from "../tools/stradellaChordFinder/registerModel";
import { voicingIntervalLayout } from "../tools/stradellaChordFinder/voicingIntervalLayout";
import { describeTrebleChord } from "../tools/trebleChordExplanation";
import { playButtonSound, stopAllSound } from "../sound";
import type { ProgressionSearchSettings } from "../tools/harmonyExplorer/progression";
import { progressionFinderPattern } from "../tools/harmonyExplorer/progression";
import { pitchClassNameFromNumber } from "../tools/harmonyExplorer/integration";

// The controller composes the feature hooks below. Each one owns a part of the
// app and receives only the values it needs, typed from the hooks that own them.
import { useSettingsTransfer } from "./useSettingsTransfer";
import { useAccordionPlayback } from "./useAccordionPlayback";
import { useAccordionNotation } from "./useAccordionNotation";
import { useDiagramLabels } from "./useDiagramLabels";
import { useHarmonyActions } from "./useHarmonyActions";
import { useProgressionActions } from "./useProgressionActions";
import { useProgressionNotation } from "./useProgressionNotation";

/** Two-voice tune the ABC Player loads the first time it opens empty. */
const DEFAULT_ABC_EXAMPLE = "happy-birthday";

/**
 * Builds the model the views render: owns the order in which the feature hooks
 * run, derives the diagram (buttons, highlights, titles, footer geometry),
 * routes diagram clicks and tool toggles, and groups everything into the
 * settings, tools and workspace prop groups.
 *
 * Feature work lives in its own hooks:
 * - Accordion workspace: useAccordionPlayback (sound, transports, sample
 *   preloading), useAccordionNotation (player staff notation), useDiagramLabels.
 * - Harmony workspace: useHarmonyActions (chord playback, recording).
 * - Shared: useProgressionActions and useProgressionNotation (Progression
 *   Assistant and the commands between Harmony, the assistant and the
 *   Chord Finder), useSettingsTransfer (settings files).
 */
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
    fingeringDraft, setFingeringDraft, annotateMode, setAnnotateMode,
    selectedButtonIds, toggleButtonSelected, toggleButtonFinger, applyFingerToSelected,
    clearFingerForSelected, clearAllFingerings, clearSelection, deselectButton,
  } = useDiagramOverlays();

  /* Sequence steps and path-display state is independent of the physical manual and sound. */
  const {
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
    abcHands, setAbcHands,
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
    if (activeToolSection !== "annotateDiagram" || annotateMode !== "sequence") {
      setSequenceRenderedNotationVisible(false);
    }
  }, [activeToolSection, annotateMode, setAbcRenderedNotationVisible, setBassPatternRenderedNotationVisible, setSequenceRenderedNotationVisible]);

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

  const {
    downloadCurrentSettings, importSettingsFile,
  } = useSettingsTransfer({
    abcStradellaMode, abcTempoBpm, abcTrebleChordSymbolsMode, abcHands, setAbcHands, accidental, accidentalStyle,
    annotationBold, annotationButtonAnchor, annotationItalic, annotationOffsetPercent,
    bassPatternBarsPerChord, bassPatternChordVoicing, bassPatternLoopCount, bassPatternLoopMode,
    bassPatternRoot, bassPatternTempoBpm, basses, buttonSize, buttonStrokeWidth, changeLanguage,
    chordDisplayStyle, chordFillStrength, chordFinderInversion, chordFinderOctave,
    chordFinderPattern, chordFinderRoot, chordLabelMode, colorTheme, customTitle, diagramScale,
    diagramVerticalSpacing, downloadFormat, fingeringPosition, harmonyColorByFamily, harmonyDiameter,
    harmonyFontSize, harmonyPlaybackStyle, harmonyProgressionHandMovementWeight,
    harmonyProgressionRhythmPattern, harmonyProgressionRootPosition, harmonyRingVisibility,
    harmonyShowEnharmonics, harmonyShowExplanation, harmonyShowLegend, harmonyShowNoteRing,
    harmonyShowSeparators, harmonyShowToneTooltips, harmonyVoicingStyle, interfaceDensity,
    laMelodiosaBassRegister, laMelodiosaFollowStradellaRegisters, laMelodiosaTrebleRegister,
    labelFont, labelFontSize, languagePreference, musicNotationBarsPerLine,
    musicNotationChordFontSize, musicNotationIncludeDescription, musicNotationIncludeSummary,
    musicNotationIncludeTitle, musicNotationScale, musicNotationStaffSeparator,
    musicNotationStaffWidth, musicNotationUseBarsPerLine, notation, pianoBlackKeyHeightScale,
    pianoBlackKeyWidthScale, pianoKeyHeightScale, pianoKeyWidthScale, pianoTrebleRange,
    referenceStrokeWidth, scaleFinderDisplayMode, scaleFinderPattern, scaleFinderRoot,
    scaleFinderRowLimit, sequenceArrowheadSize, sequenceColorPreset,
    sequenceDisplayMode, sequenceNumberColorPreset, sequenceNumberFontSize, sequenceNumberPosition,
    sequenceThickness, setAbcStradellaMode, setAbcTempoBpm, setAbcTrebleChordSymbolsMode,
    setAccidental, setAccidentalStyle, setAnnotationBold, setAnnotationButtonAnchor,
    setAnnotationItalic, setAnnotationOffsetPercent, setBassPatternBarsPerChord,
    setBassPatternChordVoicing, setBassPatternLoopCount, setBassPatternLoopMode, setBassPatternRoot,
    setBassPatternTempoBpm, setBasses, setButtonSize, setButtonStrokeWidth, setChordDisplayStyle,
    setChordFillStrength, setChordFinderInversion, setChordFinderOctave, setChordFinderPattern,
    setChordFinderRoot, setChordLabelMode, setColorTheme, setCustomTitle, setDiagramScale,
    setDiagramVerticalSpacing, setDownloadFormat, setFingeringPosition, setHarmonyColorByFamily,
    setHarmonyDiameter, setHarmonyFontSize, setHarmonyPlaybackStyle,
    setHarmonyProgressionHandMovementWeight, setHarmonyProgressionRhythmPattern,
    setHarmonyProgressionRootPosition, setHarmonyRingVisibility, setHarmonyShowEnharmonics,
    setHarmonyShowExplanation, setHarmonyShowLegend, setHarmonyShowNoteRing,
    setHarmonyShowSeparators, setHarmonyShowToneTooltips, setHarmonyVoicingStyle,
    setInterfaceDensity, setLaMelodiosaBassRegister, setLaMelodiosaFollowStradellaRegisters,
    setLaMelodiosaTrebleRegister, setLabelFont, setLabelFontSize, setLanguagePreference,
    setMusicNotationBarsPerLine, setMusicNotationChordFontSize, setMusicNotationIncludeDescription,
    setMusicNotationIncludeSummary, setMusicNotationIncludeTitle, setMusicNotationScale,
    setMusicNotationStaffSeparator, setMusicNotationStaffWidth, setMusicNotationUseBarsPerLine,
    setNotation, setPianoBlackKeyHeightScale, setPianoBlackKeyWidthScale, setPianoKeyHeightScale,
    setPianoKeyWidthScale, setPianoTrebleRange, setReferenceStrokeWidth, setScaleFinderDisplayMode,
    setScaleFinderPattern, setScaleFinderRoot, setScaleFinderRowLimit,
    setSequenceArrowheadSize, setSequenceColorPreset, setSequenceDisplayMode,
    setSequenceNumberColorPreset, setSequenceNumberFontSize, setSequenceNumberPosition,
    setSequenceThickness, setShowBellowsGuide, setShowButtonLabels, setShowStatusBar,
    setShowStradellaRowLabels, setShowStradellaVoicingIntervals, setShowTrebleOctaves, setSide,
    setSoundArticulation, setSoundAttackMs, setSoundEnabled, setSoundMusetteDetuneCents,
    setSoundNoteDurationMs, setSoundReleaseMs, setSoundSequenceTempoBpm, setSoundSource,
    setSoundVoicePreset, setSoundVolume, setSoundWaveform, setSpacing,
    setStradellaBassRegisterGrouping, setStradellaBassRegisterOctave, setStradellaBassVoicing,
    setStradellaChordFinderMarkRootBass, setStradellaChordFinderMode,
    setStradellaChordRegisterGrouping, setStradellaChordRegisterOctave,
    setStradellaMinimumNominalGap, setStradellaNoteLevels, setStradellaRequestedBassOnBassButton,
    setTextNoteColor, setTextNoteFont, setTextNoteFontSize, setTitleFont, setTitleMode, setTitleSize,
    setTrebleAngle, setTrebleLayout, setTrebleRows, setTrebleSize, showBellowsGuide,
    showButtonLabels, showStatusBar, showStradellaRowLabels, showStradellaVoicingIntervals,
    showTrebleOctaves, side, soundArticulation, soundAttackMs, soundEnabled, soundMusetteDetuneCents,
    soundNoteDurationMs, soundReleaseMs, soundSequenceTempoBpm, soundSource, soundVoicePreset,
    soundVolume, soundWaveform, spacing, stradellaBassRegisterGrouping, stradellaBassRegisterOctave,
    stradellaBassVoicing, stradellaChordFinderMarkRootBass, stradellaChordFinderMode,
    stradellaChordRegisterGrouping, stradellaChordRegisterOctave, stradellaMinimumNominalGap,
    stradellaNoteLevels, stradellaRequestedBassOnBassButton, t, textNoteColor, textNoteFont,
    textNoteFontSize, titleFont, titleMode, titleSize, trebleAngle, trebleLayout, trebleRows,
    trebleSize,
  });

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

  /* Layout settings shared by the current side and the ABC Player's second diagram. */
  const sideButtonSettings = useMemo<SideButtonSettings>(() => ({
    basses, stradellaAccidental, trebleLayout, trebleRows, trebleSize, pianoTrebleRange,
    buttonSize, spacing, diagramVerticalSpacing, pianoKeyWidthScale, pianoKeyHeightScale,
    pianoBlackKeyWidthScale, pianoBlackKeyHeightScale, trebleAngle, showTrebleOctaves,
  }), [basses, stradellaAccidental, trebleLayout, trebleRows, trebleSize, pianoTrebleRange,
    buttonSize, spacing, diagramVerticalSpacing, pianoKeyWidthScale, pianoKeyHeightScale,
    pianoBlackKeyWidthScale, pianoBlackKeyHeightScale, trebleAngle, showTrebleOctaves]);

  /* Generated button list for the current side and layout settings. */
  const buttons = useMemo(() => {
    if (side === "stradella") return stradellaButtonsFor(sideButtonSettings);
    // Compact treble sizes keep the Finder result and the marked buttons visible.
    return trebleButtonsFor(sideButtonSettings, (reference) => {
      const requested = chordFinderActive
        ? getChordFinderTrebleButtons(reference, chordFinderRoot, chordFinderPattern, chordFinderInversion, chordFinderOctave, trebleChordVoicingMode)
        : scaleFinderActive
          ? getScaleFinderTrebleButtons(reference, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit)
          : [];
      const markedIds = new Set([
        ...Object.entries(overlays).filter(([, overlay]) => overlay.selected || overlay.finger).map(([id]) => id),
        ...sequenceSteps.map((step) => step.id),
      ]);
      return [...requested, ...reference.filter((button) => markedIds.has(button.id))];
    });
  }, [
    side, sideButtonSettings,
    chordFinderActive, chordFinderRoot, chordFinderPattern, chordFinderInversion, chordFinderOctave, trebleChordVoicingMode,
    scaleFinderActive, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit,
    overlays, sequenceSteps,
  ]);

  /* The ABC Player's Both hands view plays voice 1 on the treble and voice 2
   * on the Stradella, so it also needs the buttons of the side not on screen. */
  const abcCompanionButtons = useMemo(() => {
    if (workspaceMode !== "accordion" || abcHands !== "both" || !abcText.trim()) return null;
    return side === "stradella" ? trebleButtonsFor(sideButtonSettings) : stradellaButtonsFor(sideButtonSettings);
  }, [workspaceMode, abcHands, abcText, side, sideButtonSettings]);

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
      setTextNotes([]);
      setScaleFinderActive(false);
      setChordFinderActive(false);
      setStradellaChordFinderActive(false);
      previousLayoutSignatureRef.current = layoutSignature;
    }
  }, [layoutSignature, setScaleFinderActive, setChordFinderActive, setStradellaChordFinderActive, setSequenceSteps, setOverlays, setTextNotes]);

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
    abcMissingPitchText, abcActiveButtonIdSet, abcVoiceCount, abcBothHands,
  } = useAbcPlayerResults({
    abcText, abcPlaybackState, setAbcTempoBpm, abcActiveButtonIds,
    abcStradellaMode, abcTrebleChordSymbolsMode, side, isTrebleLikeSide, buttons,
    companionButtons: abcCompanionButtons,
  });

  const {
    selectedBassPattern, selectedChordProgression, bassPatternEvents,
    bassPatternTotalBeats, bassPatternMissingText, bassPatternActiveButtonIdSet,
  } = useBassPatternResults({
    bassPatternDefinitions, bassPatternId, chordProgressionDefinitions, chordProgressionId,
    buttons, side, bassPatternRoot, bassPatternChordVoicing, bassPatternBarsPerChord,
    bassPatternActiveButtonIds,
  });

  const {
    renderNotationInto,
  } = useAccordionNotation({
    abcNotationRef, abcRenderedNotationVisible, abcText, bassPatternBarsPerChord, bassPatternEvents,
    bassPatternLoopCount, bassPatternLoopMode, bassPatternNotationRef,
    bassPatternRenderedNotationVisible, bassPatternRoot, bassPatternTempoBpm,
    musicNotationBarsPerLine, musicNotationChordFontSize, musicNotationIncludeDescription,
    musicNotationIncludeSummary, musicNotationIncludeTitle, musicNotationScale,
    musicNotationStaffSeparator, musicNotationStaffWidth, musicNotationUseBarsPerLine,
    selectedBassPattern, selectedChordProgression, sequenceNotationRef,
    sequenceRenderedNotationVisible, sequenceStepsWithButtons, side,
  });

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

  const {
    progressionRhythmPulses,
  } = useProgressionNotation({
    buttons, harmonyProgressionNotationRef, harmonyProgressionNotationVisible,
    harmonyProgressionPlan, harmonyProgressionRhythmPattern, harmonyRecordedNotationRef,
    harmonyRecordedNotationVisible, harmonyRecordedProgression, harmonyShowEnharmonics,
    renderNotationInto, soundOptions, soundSequenceTempoBpm,
  });

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

  const {
    playHarmonyChord, playHarmonyChordRelationship, harmonyProgressionSectorIndex,
    makeHarmonyProgressionChord, playHarmonyNote, handleHarmonyChordActivated,
    toggleHarmonyProgressionRecording, stopHarmonyRecordedProgressionPlayback,
    playHarmonyRecordedProgression, clearHarmonyRecordedProgression,
  } = useHarmonyActions({
    harmonyPlaybackStyle, harmonyProgressionIdRef, harmonyProgressionRecording,
    harmonyRecordedPlaybackTimeoutsRef, harmonyRecordedProgression, setHarmonyProgressionRecording,
    setHarmonyRecordedNotationVisible, setHarmonyRecordedProgression,
    setHarmonyRecordedProgressionPlaying, soundOptions, soundSequenceTempoBpm,
  });

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

  /* The first time the ABC Player opens with nothing loaded, it loads Happy
   * Birthday, a two-voice tune, so both hands are shown and heard right away.
   * Only once per visit: after Clear ABC the editor stays empty. */
  const abcDefaultTuneLoadedRef = useRef(false);
  useEffect(() => {
    if (abcDefaultTuneLoadedRef.current || activeToolSection !== "abcPlayer") return;
    if (abcText.trim()) { abcDefaultTuneLoadedRef.current = true; return; }
    if (!abcExampleOptions.some((option) => option.value === DEFAULT_ABC_EXAMPLE)) return;
    abcDefaultTuneLoadedRef.current = true;
    void loadAbcExample(DEFAULT_ABC_EXAMPLE);
  }, [activeToolSection, abcText, abcExampleOptions, loadAbcExample]);

  /** ABC Player Hands choice. Stradella or Treble also switches the workspace
   * to that side; any change stops playback, since the mapping changes. */
  function chooseAbcHands(next: AbcHands) {
    stopAbcPlayback();
    setAbcHands(next);
    if (next !== "both" && next !== side) selectAccordionSide(next);
  }

  /**
   * Handles button clicks.
   *
   * Outside Annotate Diagram a click only plays the button. Inside it, only
   * the chosen mode reacts: Select toggles the selection, Finger writes the
   * finger value, Sequence adds a step (each of these also plays the button),
   * and Notes opens a note editor on the button without sound.
   */
  function toggleButton(button: DiagramButton) {
    if (activeToolSection === "annotateDiagram") {
      if (annotateMode === "notes") {
        beginButtonAnnotation(button);
        return;
      }
      if (annotateMode === "select") toggleButtonSelected(button.id);
      else if (annotateMode === "finger") toggleButtonFinger(button.id);
      else appendRecordedButton(button.id);
    }

    playButtonSound(button, soundOptions);
  }

  const {
    samplesLoading, soundEnginePlayer, setSoundEnginePlayer, playStradellaChordFinder,
    playScaleFinder, playChordFinder, playSelectedButtons, playRecordedSequence,
    stopAbcPlayback, pauseAbcPlayback, startWhenSamplesReady, scheduleAbcPlayback,
    stopBassPatternPlayback, exportSelectedBassPattern, scheduleBassPatternPlayback,
    stopSoundPlayback,
  } = useAccordionPlayback({
    abcMappedEvents, abcPlaybackStartBeatRef, abcPlaybackStartedAtRef, abcPlaybackState,
    abcPlaybackTimeoutsRef, abcPositionBeat, abcTempoBpm, abcTotalBeats, bassPatternBarsPerChord,
    bassPatternEvents, bassPatternExportFormat, bassPatternLoopCount, bassPatternLoopMode,
    bassPatternPlaybackRunRef, bassPatternRoot, bassPatternTempoBpm, bassPatternTimeoutsRef,
    bassPatternTotalBeats, chordFinderButtons, laMelodiosaBassRegister, laMelodiosaTrebleRegister,
    scaleFinderButtons, selectedBassPattern, selectedButtons, selectedChordProgression,
    sequenceStepsWithButtons, setAbcActiveButtonIds, setAbcPlaybackState, setAbcPositionBeat,
    setBassPatternActiveButtonIds, setBassPatternPlaybackState, setChordFinderActive,
    setHarmonyProgressionActiveButtonIds, setHarmonyProgressionPulseSilent, setScaleFinderActive,
    setStradellaChordFinderActive, side, soundEnabled, soundOptions, soundSource,
    stradellaChordFinderMode, stradellaChordFinderPlaybackButtons, workspaceMode,
  });

  const {
    sendHarmonyRecordedProgressionToAssistant, useHarmonyProgressionPreset,
    addManualHarmonyProgressionChord, addSelectedHarmonyRelationshipToProgression,
    removeHarmonyProgressionChord, moveHarmonyProgressionChord, cycleHarmonyProgressionRealization,
    previewHarmonyProgressionStepOnStradella, toggleHarmonyProgressionStepNotes,
    playOptimizedHarmonyProgression, resetHarmonyExplorer, showHarmonySelectionOnStradella,
    exploreCurrentStradellaChordInHarmony, progressionPathVisible, setProgressionPathVisible,
  } = useProgressionActions({
    buttons, chordProgressionDefinitions, harmonyProgression, harmonyProgressionIdRef,
    harmonyProgressionManualPattern, harmonyProgressionManualRoot, harmonyProgressionNoteStepId,
    harmonyProgressionPlan, harmonyProgressionRealizationKeys, harmonyProgressionRealizationOptions,
    harmonyProgressionRhythmPattern, harmonyProgressionSectorIndex, harmonyRecordedProgression,
    harmonySelection, makeHarmonyProgressionChord, navigateToTool, progressionRhythmPulses,
    setChordFinderActive, setHarmonyColorByFamily, setHarmonyDiameter, setHarmonyDiatonicOnly,
    setHarmonyFocusedReferenceRootPc, setHarmonyFontSize, setHarmonyHighlightDiatonic,
    setHarmonyPlaybackStyle, setHarmonyProgression, setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionNoteStepId, setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionPulseSilent, setHarmonyProgressionRealizationKeys,
    setHarmonyProgressionRecording, setHarmonyRecordedNotationVisible, setHarmonyRecordedProgression,
    setHarmonyReferenceFamilyId, setHarmonyRelatedFamilyId, setHarmonyRingVisibility,
    setHarmonyScaleId, setHarmonySelection, setHarmonyShowEnharmonics, setHarmonyShowExplanation,
    setHarmonyShowLegend, setHarmonyShowNoteRing, setHarmonyShowSeparators,
    setHarmonyShowToneTooltips, setHarmonyVoicingStyle, setScaleFinderActive, setSoundEnginePlayer,
    setStradellaChordFinderActive, setStradellaChordFinderMode, setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex, setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot, soundOptions, startWhenSamplesReady, stopAbcPlayback,
    stopBassPatternPlayback, stopHarmonyRecordedProgressionPlayback, stopSoundPlayback,
    stradellaChordFinderPattern, stradellaChordFinderRoot, t,
  });

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
      setOverlays, setSequenceSteps,
      setTextNotes, setScaleFinderActive, setChordFinderActive,
      setStradellaChordFinderActive,
      setProgressionPreview: setHarmonyProgressionPreviewIndex,
      stopAbc: stopAbcPlayback, stopBassPattern: stopBassPatternPlayback,
      stopSound: stopAllSound,
      setProgressionActiveButtons: setHarmonyProgressionActiveButtonIds,
    });
  }

  const {
    getMainLabel, formatStradellaFinderPitches, formatStradellaScaleFinderNames,
    formatStradellaFinderText, formatTrebleChordFinderPitches, autoTitle, localizedAutoTitle,
  } = useDiagramLabels({
    accidental, basses, chordDisplayStyle, chordFinderOctave, chordFinderPattern, chordFinderRoot,
    chordLabelMode, isPianoTreble, language, notation, side, stradellaAccidental,
    stradellaChordFinderPattern, stradellaChordFinderRoot, trebleLayout,
  });

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
    const rawName = abcHandsView ? `${abcParseResult.title} both hands`
      : titleMode === "contextual" && finderAnnotationActive && finderAnnotation
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

  /** Starts a free-position inline annotation in Annotate Diagram's Notes mode. */
  function handleSvgClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (activeToolSection !== "annotateDiagram" || annotateMode !== "notes") return;

    const point = svgPointFromMouse(event);
    if (!point) return;
    beginFreeAnnotation(point.x, point.y);
  }

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

  /* ABC Player, Both hands: while the ABC Player is open with a two-voice
   * tune, both manuals are drawn together in place of the main diagram. */
  const abcHandsView = abcBothHands && abcCompanionButtons && workspaceMode === "accordion" &&
    activeToolSection === "abcPlayer"
    ? {
        trebleButtons: side === "stradella" ? abcCompanionButtons : buttons,
        stradellaButtons: side === "stradella" ? buttons : abcCompanionButtons,
      }
    : null;

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
    t,
  });

  const statusBarText = accordionStatusText({
    side, basses, trebleLayout, pianoRange: pianoTrebleRange, trebleRows,
    notation, soundEnabled, activeTool: activeToolLabel, language,
  });

    return {
    language, interfaceDensity, leftPanelMode, t,
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
      abcHands, chooseAbcHands, abcVoiceCount, abcBothHands, abcRenderedNotationVisible, renderNotationInto,
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
      harmonyScaleId, harmonySelection, harmonyShowEnharmonics, harmonyShowNoteRing, annotateMode,
      isTrebleLikeSide, language, loadAbcExample, loadSelectedPatternIntoEditor,
      moveHarmonyProgressionChord, pauseAbcPlayback, playChordFinder, playHarmonyRecordedProgression,
      playOptimizedHarmonyProgression, playRecordedSequence, playScaleFinder, playSelectedButtons, playStradellaChordFinder,
      previewHarmonyProgressionStepOnStradella, removeHarmonyProgressionChord, removeSelectedCustomBassPattern, resetHarmonyExplorer, saveCustomBassPattern,
      scaleFinderActive, scaleFinderButtons, scaleFinderDisplayMode, scaleFinderPattern, scaleFinderRoot,
      scaleFinderRowLimit, scheduleAbcPlayback, scheduleBassPatternPlayback, selectedBassPattern, selectedButtons,
      selectedChordProgression, sendHarmonyRecordedProgressionToAssistant, sequenceArrowheadSize, sequenceColorPreset,
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
      setHarmonyRelatedFamilyId, setHarmonyScaleId, setHarmonyShowNoteRing, setAnnotateMode,
      setScaleFinderActive, setScaleFinderDisplayMode, setScaleFinderPattern, setScaleFinderRoot, setScaleFinderRowLimit,
      setSequenceArrowheadSize, setSequenceColorPreset, setSequenceDisplayMode, setSequenceNumberColorPreset,
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
      abcHandsView, setAbcHands, renderNotationInto,
      accidentalStyle, activeToolSection, annotateMode, annotationButtonAnchor, annotationEditorRef, annotationLevelForLine,
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
