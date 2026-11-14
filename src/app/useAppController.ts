import { accordionStatusText } from "../i18n/diagramLabels";
import { type StradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import { trebleContextualTitle } from "../tools/contextualTitles";
import { displayRealizedChord } from "../tools/chordDisplay";
import {
  chordToneName,
  displayRoot,
  realizedChordName,
} from "../tools/stradellaChordFinder/chordSpelling";
import { useMemo, useState } from "react";
import {
  BASS_OPTIONS,
  TREBLE_SIZE_OPTIONS,
  PIANO_TREBLE_RANGE_OPTIONS,
  COLOR_PRESETS,
  SEQUENCE_DISPLAY_MODE_OPTIONS,
  formatProgressionOptionLabel,
} from "./controllerOptions";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformNotation,
  usePlatformSound,
  usePlatformSpelling,
  usePlatformTools,
  usePlatformPlayback,
  usePlatformShell,
} from "./platform/platformContexts";
import { useRhythmTrainer } from "../features/rhythmTrainer/rhythmTrainerContext";
import {
  TREBLE_PRESET_BUTTON_SIZE,
  PIANO_TREBLE_PRESET_BUTTON_SIZE,
} from "../instrument/sizePresets";
import { flushSync } from "react-dom";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { translateKnownLabel } from "../i18n/catalog";
import type {
  AbcHands,
  DiagramButton,
  DownloadFormat,
  PianoTrebleRange,
  TrebleLayout,
  TrebleSizePreset,
} from "../types";
import { stradellaVisibleRoots, stradellaVisibleRows } from "../stradella";

import {
  accordionDiagramFilename,
  harmonyDiagramFilename,
  downloadDiagram,
  downloadDiagramBatch,
  svgPointFromClient,
} from "../diagram/diagramExport";
import { captureStradellaBatch } from "../diagram/stradellaBatchCapture";
import { calculateDiagramGeometry } from "../diagram/diagramGeometry";
import { useDiagramButtons } from "./diagram/diagramButtonsContext";
import { useScaleFinderOutput } from "../features/scaleFinder/scaleFinderContext";
import { useTrebleChordFinderOutput } from "../features/trebleChordFinder/trebleChordFinderContext";
import { useStradellaChordFinderOutput } from "../features/stradellaChordFinder/stradellaChordFinderContext";
import { useAnnotateDiagramOutput } from "../features/annotateDiagram/annotateDiagramContext";
import { useAbcPlayerOutput } from "../features/abcPlayer/abcPlayerContext";
import { useBassPatternPlayerOutput } from "../features/bassPatternPlayer/bassPatternPlayerContext";
import { useHarmonyExplorerOutput } from "../features/harmonyExplorer/harmonyExplorerContext";
import { useProgressionAssistantOutput } from "../features/progressionAssistant/progressionAssistantContext";
import { useHarmonyExplorer } from "../features/harmonyExplorer/harmonyExplorerContext";
import { useProgressionAssistant } from "../features/progressionAssistant/progressionAssistantContext";
import { useScaleFinder } from "../features/scaleFinder/scaleFinderContext";
import { useTrebleChordFinder } from "../features/trebleChordFinder/trebleChordFinderContext";
import { useStradellaChordFinder } from "../features/stradellaChordFinder/stradellaChordFinderContext";
import { useAnnotateDiagram } from "../features/annotateDiagram/annotateDiagramContext";
import { useAbcPlayer } from "../features/abcPlayer/abcPlayerContext";
import { useBassPatternPlayer } from "../features/bassPatternPlayer/bassPatternPlayerContext";
import { activeToolStatusLabel } from "./workspacePresentation";
import {
  sequenceArrowStyleFromMode,
  sequenceModeShowsArrows,
  sequenceModeShowsNumbers,
} from "../tools/sequenceTools";
import { SCALE_FINDER_OPTIONS } from "../tools/scaleFinderTools";
import {
  realizationAnnotation,
  finderChordSymbol,
} from "../tools/stradellaChordFinder/diagramAnnotations";
import { analyzeConfiguredStradellaVoicing } from "../tools/stradellaChordFinder/registerModel";
import { voicingIntervalLayout } from "../tools/stradellaChordFinder/voicingIntervalLayout";
import { describeTrebleChord } from "../tools/trebleChordExplanation";
import { playButtonSound } from "../sound";
import { progressionFinderPattern } from "../tools/harmonyExplorer/progression";
import { pitchClassNameFromNumber } from "../tools/harmonyExplorer/integration";

// The controller composes the feature hooks below. Each one owns a part of the
// app and receives only the values it needs, typed from the hooks that own them.
import { useSettingsTransfer } from "./useSettingsTransfer";
import { useScoreRendering } from "./platform/useScoreRendering";
import { useDiagramLabels } from "./useDiagramLabels";
import { useProgressionActions } from "./useProgressionActions";

/**
 * Builds the model the views render: owns the order in which the feature hooks
 * run, derives the diagram (buttons, highlights, titles, footer geometry),
 * routes diagram clicks and tool toggles, and groups everything into the
 * settings, tools and workspace prop groups.
 *
 * Feature work lives in its own hooks:
 * - Accordion workspace: useDiagramLabels. Each tool's transport, Play
 *   commands and score text are in its output provider.
 * - Harmony workspace: useHarmonyActions (chord playback, recording).
 * - Shared: useProgressionActions and useProgressionNotation (Progression
 *   Assistant and the commands between Harmony, the assistant and the
 *   Chord Finder), useSettingsTransfer (settings files).
 */
export function useAppController() {
  /* Reference to the SVG element, used for downloads and click-coordinate conversion. */

  /* Shared state is owned by the platform providers (src/app/platform/);
   * the controller only reads it. */
  const { languagePreference, language, t, changeLanguage } = usePlatformLanguage();

  const {
    side,
    basses,
    setBasses,
    trebleLayout,
    setTrebleLayout,
    trebleRows,
    setTrebleRows,
    trebleSize,
    setTrebleSize,
    pianoTrebleRange,
    setPianoTrebleRange,
    showTrebleOctaves,
    setShowTrebleOctaves,
    stradellaBassRegisterOctave,
    setStradellaBassRegisterOctave,
    stradellaBassRegisterGrouping,
    setStradellaBassRegisterGrouping,
    stradellaChordRegisterOctave,
    setStradellaChordRegisterOctave,
    stradellaChordRegisterGrouping,
    setStradellaChordRegisterGrouping,
    stradellaRegisterModel,
  } = usePlatformInstrument();
  const {
    notation,
    setNotation,
    accidental,
    setAccidental,
    chordDisplayStyle,
    setChordDisplayStyle,
    chordLabelMode,
    setChordLabelMode,
  } = usePlatformSpelling();

  /* Diagram appearance and typography are state-owned by the diagram feature.
   * Keep the original setters for the settings-controller compatibility adapter. */
  const {
    buttonSize,
    setButtonSize,
    spacing,
    setSpacing,
    diagramVerticalSpacing,
    setDiagramVerticalSpacing,
    pianoKeyWidthScale,
    setPianoKeyWidthScale,
    pianoKeyHeightScale,
    setPianoKeyHeightScale,
    pianoBlackKeyWidthScale,
    setPianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale,
    setPianoBlackKeyHeightScale,
    diagramScale,
    setDiagramScale,
    showStatusBar,
    setShowStatusBar,
    trebleAngle,
    setTrebleAngle,
    buttonStrokeWidth,
    setButtonStrokeWidth,
    referenceStrokeWidth,
    setReferenceStrokeWidth,
    chordFillStrength,
    setChordFillStrength,
    accidentalStyle,
    setAccidentalStyle,
    labelFontSize,
    setLabelFontSize,
    showButtonLabels,
    setShowButtonLabels,
    showBellowsGuide,
    setShowBellowsGuide,
    showStradellaRowLabels,
    setShowStradellaRowLabels,
    titleMode,
    setTitleMode,
    customTitle,
    setCustomTitle,
    titleFont,
    setTitleFont,
    titleSize,
    setTitleSize,
    labelFont,
    setLabelFont,
    colorTheme,
    setColorTheme,
  } = usePlatformAppearance();
  const {
    interfaceDensity,
    setInterfaceDensity,
    downloadFormat,
    setDownloadFormat,
    mobileDiagramView,
    setMobileDiagramView,
    svgRef,
    harmonySvgRef,
  } = usePlatformShell();

  /* The application shell owns workspace/tool visibility; physical side stays
   * in useInstrumentState, and audio cancellation remains with the commands. */
  const {
    leftPanelMode,
    workspaceMode,
    activeSettingsSection,
    activeToolSection,
    toggleSettingsSection,
    navigateToTool,
    selectAccordionSide,
    setPanel,
    toggleFocusPanel,
  } = usePlatformNavigation();
  /* Opening and closing tools and the Reset menu go through the tool
   * coordinator, which applies the rules that span tools (see the handles
   * registered below). */
  const {
    toggleTool: toggleToolSection,
    resetWork,
    resetTool: resetCurrentToolDefaults,
    stopAllPlayback: stopSoundPlayback,
  } = usePlatformTools();

  /* Physical-button overlays/fingerings are independent of musical selection. */
  const annotateDiagram = useAnnotateDiagram();
  const overlayState = annotateDiagram.overlays;
  const {
    overlays,
    fingeringPosition,
    setFingeringPosition,
    fingeringDraft,
    setFingeringDraft,
    annotateMode,
    setAnnotateMode,
    toggleButtonSelected,
    toggleButtonFinger,
    applyFingerToSelected,
    clearFingerForSelected,
    clearAllFingerings,
    clearSelection,
    deselectButton,
  } = overlayState;

  /* Sequence steps and path-display state is independent of the physical manual and sound. */
  const sequenceState = annotateDiagram.sequence;
  const { toggleSequenceNotation } = annotateDiagram;
  const {
    sequenceSteps,
    sequenceDisplayMode,
    setSequenceDisplayMode,
    sequenceColorPreset,
    setSequenceColorPreset,
    sequenceThickness,
    setSequenceThickness,
    sequenceArrowheadSize,
    setSequenceArrowheadSize,
    sequenceNumberFontSize,
    setSequenceNumberFontSize,
    sequenceNumberColorPreset,
    setSequenceNumberColorPreset,
    sequenceNumberPosition,
    setSequenceNumberPosition,
    appendRecordedButton,
    clearSequence,
    sequenceRenderedNotationVisible,
    sequenceNotationRef,
  } = sequenceState;

  /* Finder requests are independent feature state. App coordinates only which
   * tool is shown; the tools own their preferences, selections, and results. */
  const scaleFinderState = useScaleFinder();
  const {
    scaleFinderActive,
    setScaleFinderActive,
    scaleFinderRoot,
    setScaleFinderRoot,
    scaleFinderPattern,
    setScaleFinderPattern,
    scaleFinderRowLimit,
    setScaleFinderRowLimit,
    scaleFinderDisplayMode,
    setScaleFinderDisplayMode,
  } = scaleFinderState;
  const trebleChordFinderState = useTrebleChordFinder();
  const {
    chordFinderActive,
    setChordFinderActive,
    showTrebleVoicingNote,
    setShowTrebleVoicingNote,
    trebleChordVoicingMode,
    setTrebleChordVoicingMode,
    chordFinderRoot,
    setChordFinderRoot,
    chordFinderPattern,
    setChordFinderPattern,
    chordFinderInversion,
    setChordFinderInversion,
    chordFinderOctave,
    setChordFinderOctave,
  } = trebleChordFinderState;

  /* ABC Player state for file/paste playback and diagram highlighting. */
  const abcPlayerState = useAbcPlayer();
  const {
    abcText,
    setAbcText,
    abcEditorExpanded,
    setAbcEditorExpanded,
    abcFileName,
    setAbcFileName,
    abcExampleValue,
    setAbcExampleValue,
    abcExampleOptions,
    abcTempoBpm,
    setAbcTempoBpm,
    abcPositionBeat,
    setAbcPositionBeat,
    abcPlaybackState,
    setAbcPlaybackState,
    setAbcActiveButtonIds,
    abcStradellaMode,
    setAbcStradellaMode,
    abcTrebleChordSymbolsMode,
    setAbcTrebleChordSymbolsMode,
    abcHands,
    setAbcHands,
    abcRenderedNotationVisible,
    abcNotationRef,
    loadAbcExample,
    toggleAbcNotation,
  } = abcPlayerState;

  /* Bass-pattern preferences, editor, library and pattern selection are feature-owned. */
  const bassPatternState = useBassPatternPlayer();
  const {
    customBassPatternDefinitions,
    bassPatternDefinitions,
    chordProgressionDefinitions,
    bassPatternId,
    setBassPatternId,
    chordProgressionId,
    setChordProgressionId,
    bassPatternRoot,
    setBassPatternRoot,
    bassPatternTempoBpm,
    setBassPatternTempoBpm,
    bassPatternChordVoicing,
    setBassPatternChordVoicing,
    bassPatternBarsPerChord,
    setBassPatternBarsPerChord,
    bassPatternExportFormat,
    setBassPatternExportFormat,
    bassPatternEditorExpanded,
    setBassPatternEditorExpanded,
    bassPatternRenderedNotationVisible,
    bassPatternValidationErrors,
    bassPatternEditorText,
    setBassPatternEditorText,
    bassPatternEditorMessage,
    bassPatternPlaybackState,
    bassPatternNotationRef,
    bassPatternEditorErrors,
    saveCustomBassPattern,
    removeSelectedCustomBassPattern,
    loadSelectedPatternIntoEditor,
    toggleBassPatternNotation,
  } = bassPatternState;
  const {
    musicNotationIncludeTitle,
    setMusicNotationIncludeTitle,
    musicNotationIncludeDescription,
    setMusicNotationIncludeDescription,
    musicNotationIncludeSummary,
    setMusicNotationIncludeSummary,
    musicNotationUseBarsPerLine,
    setMusicNotationUseBarsPerLine,
    musicNotationBarsPerLine,
    setMusicNotationBarsPerLine,
    musicNotationChordFontSize,
    setMusicNotationChordFontSize,
    musicNotationScale,
    setMusicNotationScale,
    musicNotationStaffWidth,
    setMusicNotationStaffWidth,
    musicNotationStaffSeparator,
    setMusicNotationStaffSeparator,
    stradellaNotationMode,
    setStradellaNotationMode,
    stradellaChordQualityLabels,
    setStradellaChordQualityLabels,
    stradellaMarkCounterbass,
    setStradellaMarkCounterbass,
    musicNotationNoteNamesInNoteheads,
    setMusicNotationNoteNamesInNoteheads,
    musicNotationPlacement,
    setMusicNotationPlacement,
  } = usePlatformNotation();

  /* Finder request, presentation, and cross-tool handoff state live in the feature.
     Shared batch-export and mobile diagram state remain in the application shell. */
  const stradellaChordFinderState = useStradellaChordFinder();
  const {
    stradellaChordFinderActive,
    setStradellaChordFinderActive,
    stradellaChordFinderRoot,
    setStradellaChordFinderRoot,
    stradellaChordFinderPattern,
    setStradellaChordFinderPattern,
    stradellaChordFinderMode,
    setStradellaChordFinderMode,
    stradellaChordFinderRealizationIndex,
    setStradellaChordFinderRealizationIndex,
    stradellaChordFinderRequestedBass,
    setStradellaChordFinderRequestedBass,
    finderMaxButtons,
    setFinderMaxButtons,
    finderSpanColumns,
    setFinderSpanColumns,
    stradellaMinimumNominalGap,
    setStradellaMinimumNominalGap,
    showFinderRealizationNote,
    setShowFinderRealizationNote,
    showStradellaVoicingIntervals,
    setShowStradellaVoicingIntervals,
    stradellaNoteLevels,
    setStradellaNoteLevels,
    finderExplanationFontSize,
    setFinderExplanationFontSize,
    stradellaChordFinderMarkRootBass,
    setStradellaChordFinderMarkRootBass,
    stradellaRequestedBassOnBassButton,
    setStradellaRequestedBassOnBassButton,
  } = stradellaChordFinderState;
  const [batchExporting, setBatchExporting] = useState(false);
  // View-only mode. SVG viewBox, musical geometry and exports remain untouched.

  /* Harmony Explorer retains its independent selection/display state. */
  const harmonyExplorerState = useHarmonyExplorer();
  const {
    harmonyReferenceFamilyId,
    setHarmonyReferenceFamilyId,
    harmonyRelatedFamilyId,
    setHarmonyRelatedFamilyId,
    harmonyScaleId,
    setHarmonyScaleId,
    harmonyDiatonicOnly,
    setHarmonyDiatonicOnly,
    harmonyHighlightDiatonic,
    setHarmonyHighlightDiatonic,
    harmonyShowEnharmonics,
    setHarmonyShowEnharmonics,
    harmonyShowSeparators,
    setHarmonyShowSeparators,
    harmonyShowLegend,
    setHarmonyShowLegend,
    harmonyShowExplanation,
    setHarmonyShowExplanation,
    harmonyRingVisibility,
    setHarmonyRingVisibility,
    harmonyShowToneTooltips,
    setHarmonyShowToneTooltips,
    harmonyShowNoteRing,
    setHarmonyShowNoteRing,
    harmonyColorByFamily,
    setHarmonyColorByFamily,
    harmonyDiameter,
    setHarmonyDiameter,
    harmonyFontSize,
    setHarmonyFontSize,
    harmonyPlaybackStyle,
    setHarmonyPlaybackStyle,
    harmonyVoicingStyle,
    setHarmonyVoicingStyle,
    harmonySelection,
    setHarmonySelection,
    harmonyFocusedReferenceRootPc,
    setHarmonyFocusedReferenceRootPc,
    harmonyRecordedProgression,
    harmonyProgressionRecording,
    setHarmonyProgressionRecording,
    harmonyRecordedNotationVisible,
    setHarmonyRecordedNotationVisible,
    harmonyRecordedProgressionPlaying,
    harmonyRecordedNotationRef,
    harmonyProgressionIdRef,
    resetHarmonyExplorer,
    toggleHarmonyRecordedNotation,
  } = harmonyExplorerState;
  /* Progression state is separate from both the instrument and sound. */
  const progressionState = useProgressionAssistant();
  const {
    harmonyProgression,
    setHarmonyProgression,
    harmonyProgressionManualRoot,
    setHarmonyProgressionManualRoot,
    harmonyProgressionManualPattern,
    setHarmonyProgressionManualPattern,
    harmonyProgressionHandMovementWeight,
    setHarmonyProgressionHandMovementWeight,
    harmonyProgressionVoiceLeadingWeight,
    setHarmonyProgressionVoiceLeadingWeight,
    harmonyProgressionRootPosition,
    setHarmonyProgressionRootPosition,
    harmonyProgressionRhythmPattern,
    setHarmonyProgressionRhythmPattern,
    harmonyProgressionRealizationKeys,
    setHarmonyProgressionRealizationKeys,
    harmonyProgressionPreviewIndex,
    setHarmonyProgressionPreviewIndex,
    harmonyProgressionNoteStepId,
    setHarmonyProgressionNoteStepId,
    harmonyProgressionActiveButtonIds,
    setHarmonyProgressionActiveButtonIds,
    harmonyProgressionPulseSilent,
    harmonyProgressionNotationVisible,
    harmonyProgressionNotationRef,
    toggleHarmonyProgressionNotation,
  } = progressionState;

  /* Annotation editor and saved note state live outside the renderer. */
  const annotationState = annotateDiagram.annotations;
  const {
    textNotes,
    textNoteFontSize,
    setTextNoteFontSize,
    textNoteColor,
    setTextNoteColor,
    textNoteFont,
    setTextNoteFont,
    annotationBold,
    setAnnotationBold,
    annotationItalic,
    setAnnotationItalic,
    annotationOffsetPercent,
    setAnnotationOffsetPercent,
    annotationButtonAnchor,
    setAnnotationButtonAnchor,
    annotationEditorRef,
    inlineAnnotationEditor,
    setInlineAnnotationEditor,
    clearTextNotes,
    deleteTextNote,
    annotationLocationLabel,
    annotationPreview,
    annotationPointForButton,
    beginButtonAnnotation,
    beginFreeAnnotation,
    commitInlineAnnotation,
    cancelInlineAnnotation,
  } = annotationState;

  /* Audio settings are separate from the nominal physical register model. */
  const {
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    soundSource,
    setSoundSource,
    laMelodiosaTrebleRegister,
    setLaMelodiosaTrebleRegister,
    laMelodiosaBassRegister,
    setLaMelodiosaBassRegister,
    laMelodiosaFollowStradellaRegisters,
    setLaMelodiosaFollowStradellaRegisters,
    soundVoicePreset,
    setSoundVoicePreset,
    soundWaveform,
    setSoundWaveform,
    soundMusetteDetuneCents,
    setSoundMusetteDetuneCents,
    soundAttackMs,
    setSoundAttackMs,
    soundReleaseMs,
    setSoundReleaseMs,
    soundNoteDurationMs,
    setSoundNoteDurationMs,
    soundArticulation,
    setSoundArticulation,
    soundSequenceTempoBpm,
    setSoundSequenceTempoBpm,
    stradellaBassVoicing,
    setStradellaBassVoicing,
    soundOptions,
  } = usePlatformSound();

  /* Each owner hands its settings to the settings registry (platform owners
   * do so in src/app/platform/). These registrations move into the tools'
   * own providers as the tools leave the controller. */
  const { downloadCurrentSettings, importSettingsFile, resetSettingsToDefaults } =
    useSettingsTransfer(t);

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
  const { buttons } = useDiagramButtons();

  const {
    harmonyProgressionPlan,
    harmonyProgressionRealizationOptions,
    progressionPreviewButtonIds,
    harmonyProgressionActiveButtonIdSet,
    harmonyProgressionNoteStep,
    harmonyProgressionRenderedNotationAbc,
    playOptimizedHarmonyProgression,
    previewHarmonyProgressionStepOnStradella,
  } = useProgressionAssistantOutput();

  const {
    selectedButtons,
    sequenceStepsWithButtons,
    sequenceRenderedNotationAbc,
    playSelectedButtons,
    playRecordedSequence,
  } = useAnnotateDiagramOutput();

  /* Finder result selectors use the *existing diagram buttons*, retaining exact
   * button identity, ordering, octave/row choices, and playback/export semantics. */
  const { stradellaScaleFinderResult, scaleFinderButtons, playScaleFinder } =
    useScaleFinderOutput();
  const { chordFinderButtons, playChordFinder } = useTrebleChordFinderOutput();

  const {
    abcParseResult,
    abcMappedEvents,
    abcTotalBeats,
    abcMissingPitchText,
    abcActiveButtonIdSet,
    abcVoiceCount,
    abcBothHands,
    abcCompanionButtons,
    stopAbcPlayback,
    pauseAbcPlayback,
    scheduleAbcPlayback,
  } = useAbcPlayerOutput();

  const {
    selectedBassPattern,
    selectedChordProgression,
    bassPatternEvents,
    bassPatternTotalBeats,
    bassPatternMissingText,
    bassPatternActiveButtonIdSet,
    stopBassPatternPlayback,
    exportSelectedBassPattern,
    scheduleBassPatternPlayback,
    bassPatternRepeatSelection,
    setBassPatternRepeatSelection,
    bassPatternRenderedNotationAbc,
  } = useBassPatternPlayerOutput();

  const { renderNotationInto } = useScoreRendering();

  const {
    stradellaChordFinderRealizations,
    stradellaChordFinderResult,
    stradellaChordFinderButtons,
    stradellaChordFinderPlaybackButtons,
    stradellaRootBassFinderButtonIds,
    stradellaPrimaryFinderButtonIds,
    stradellaChordFinderRootFallback,
    stradellaChordFinderBassButtonFallback,
    stradellaChordFinderReachExtendedTo,
    stradellaChordFinderEffectiveRequestedBass,
    playStradellaChordFinder,
  } = useStradellaChordFinderOutput();

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
    harmonyAllFamiliesMode,
    harmonyEffectiveDiatonicOnly,
    harmonyEffectiveHighlightDiatonic,
    harmonySectors,
    harmonyAvailableCounts,
    harmonyCounts,
    harmonyReferenceFamily,
    harmonyRelatedName,
    harmonyScale,
    harmonyExplanation,
    playHarmonyChord,
    playHarmonyChordRelationship,
    harmonyProgressionSectorIndex,
    makeHarmonyProgressionChord,
    playHarmonyNote,
    handleHarmonyChordActivated,
    toggleHarmonyProgressionRecording,
    stopHarmonyRecordedProgressionPlayback,
    playHarmonyRecordedProgression,
    clearHarmonyRecordedProgression,
    harmonyRecordedProgressionNotationAbc,
  } = useHarmonyExplorerOutput();

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

  const { samplesLoading, soundEnginePlayer } = usePlatformPlayback();

  const rhythmTrainer = useRhythmTrainer();

  const {
    sendHarmonyRecordedProgressionToAssistant,
    useHarmonyProgressionPreset,
    addManualHarmonyProgressionChord,
    addSelectedHarmonyRelationshipToProgression,
    removeHarmonyProgressionChord,
    moveHarmonyProgressionChord,
    cycleHarmonyProgressionRealization,
    toggleHarmonyProgressionStepNotes,
    showHarmonySelectionOnStradella,
    exploreCurrentStradellaChordInHarmony,
    progressionPathVisible,
    setProgressionPathVisible,
  } = useProgressionActions({
    chordProgressionDefinitions,
    previewHarmonyProgressionStepOnStradella,
    harmonyProgression,
    harmonyProgressionIdRef,
    harmonyProgressionManualPattern,
    harmonyProgressionManualRoot,
    harmonyProgressionNoteStepId,
    harmonyProgressionPlan,
    harmonyProgressionRealizationKeys,
    harmonyProgressionRealizationOptions,
    harmonyProgressionSectorIndex,
    harmonyRecordedProgression,
    harmonySelection,
    makeHarmonyProgressionChord,
    navigateToTool,
    setChordFinderActive,
    setHarmonyFocusedReferenceRootPc,
    setHarmonyProgression,
    setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionNoteStepId,
    setHarmonyProgressionPreviewIndex,
    setHarmonyProgressionRealizationKeys,
    setHarmonyProgressionRecording,
    setHarmonyRecordedNotationVisible,
    setHarmonyRelatedFamilyId,
    setHarmonySelection,
    setScaleFinderActive,
    setStradellaChordFinderActive,
    setStradellaChordFinderMode,
    setStradellaChordFinderPattern,
    setStradellaChordFinderRealizationIndex,
    setStradellaChordFinderRequestedBass,
    setStradellaChordFinderRoot,
    stopAbcPlayback,
    stopBassPatternPlayback,
    stopHarmonyRecordedProgressionPlayback,
    stopSoundPlayback,
    stradellaChordFinderPattern,
    stradellaChordFinderRoot,
    t,
  });

  const {
    getMainLabel,
    formatStradellaScaleFinderNames,
    formatTrebleChordFinderPitches,
    autoTitle,
    localizedAutoTitle,
  } = useDiagramLabels({
    accidental,
    basses,
    chordDisplayStyle,
    chordFinderOctave,
    chordFinderPattern,
    chordFinderRoot,
    chordLabelMode,
    isPianoTreble,
    language,
    notation,
    side,
    stradellaAccidental,
    trebleLayout,
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
        candidates,
        originalIndex: stradellaChordFinderRealizationIndex,
        selectIndex: (index) => flushSync(() => setStradellaChordFinderRealizationIndex(index)),
        currentSvg: () => svgRef.current,
        filenameKey: (candidate) =>
          realizationAnnotation(
            stradellaChordFinderRoot,
            stradellaChordFinderPattern,
            candidate,
            stradellaRegisterModel,
            stradellaChordFinderEffectiveRequestedBass,
            stradellaNoteLevels,
            chordDisplayStyle,
            language,
          )?.filenameKey,
        format: downloadFormat,
      });
      await downloadDiagramBatch(
        snapshots,
        downloadFormat,
        `stradella-${stradellaChordFinderRoot}-${stradellaChordFinderPattern}-${downloadFormat}-${snapshots.length}-realizations.zip`,
      );
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
      const name = harmonyDiagramFilename(
        harmonyReferenceFamily.shortName,
        harmonyRelatedName,
        harmonyScale.name,
      );
      downloadDiagram(harmonySvgRef.current, name, format);
      return;
    }
    if (!svgRef.current) return;
    const layoutName =
      side === "stradella"
        ? "stradella"
        : trebleLayout === "piano"
          ? "piano-treble"
          : `${trebleLayout}-treble`;
    const displayedTitle = titleMode !== "none" ? finalTitle : "";
    const rawName = abcHandsView
      ? `${abcParseResult.title} both hands`
      : titleMode === "contextual" && finderAnnotationActive && finderAnnotation
        ? finderAnnotation.filenameKey
        : titleMode === "contextual" && side === "treble" && chordFinderActive
          ? trebleContextualTitle({
              root: chordFinderRoot,
              pattern: chordFinderPattern,
              inversion: chordFinderInversion,
              hasButtons: chordFinderButtons.length > 0,
              exact: trebleChordExplanation.exact,
              displayStyle: "words",
            })
          : titleMode === "auto" ||
              (titleMode === "contextual" &&
                !stradellaChordFinderActive &&
                !(side === "treble" && chordFinderActive) &&
                !scaleFinderActive)
            ? autoTitle()
            : displayedTitle;
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
    ? realizationAnnotation(
        stradellaChordFinderRoot,
        stradellaChordFinderPattern,
        stradellaChordFinderResult,
        stradellaRegisterModel,
        stradellaChordFinderEffectiveRequestedBass,
        stradellaNoteLevels,
        chordDisplayStyle,
        language,
      )
    : null;
  const finderAnnotationActive =
    side === "stradella" && stradellaChordFinderActive && finderAnnotation !== null;
  const progressionNotePattern = harmonyProgressionNoteStep
    ? progressionFinderPattern(harmonyProgressionNoteStep.chord)
    : null;
  const progressionNoteRoot = harmonyProgressionNoteStep
    ? pitchClassNameFromNumber(harmonyProgressionNoteStep.chord.rootPc)
    : null;
  const progressionAnnotationActive =
    side === "stradella" &&
    activeToolSection === "progressionAssistant" &&
    Boolean(harmonyProgressionNoteStep && progressionNotePattern && progressionNoteRoot) &&
    harmonyProgressionActiveButtonIds.length === 0 &&
    !harmonyProgressionPulseSilent;
  const progressionAnnotation =
    progressionAnnotationActive &&
    harmonyProgressionNoteStep &&
    progressionNotePattern &&
    progressionNoteRoot
      ? realizationAnnotation(
          progressionNoteRoot,
          progressionNotePattern,
          harmonyProgressionNoteStep.result,
          stradellaRegisterModel,
          null,
          stradellaNoteLevels,
          chordDisplayStyle,
          language,
        )
      : null;
  // One common diagram-note pipeline: Finder annotations or eye-selected
  // progression realization. Never infer the played buttons from guide markers.
  const diagramNoteAnnotation =
    progressionAnnotation ??
    (finderAnnotationActive && showFinderRealizationNote ? finderAnnotation : null);
  const diagramNoteRoot = progressionAnnotation ? progressionNoteRoot! : stradellaChordFinderRoot;
  const diagramNotePattern = progressionAnnotation
    ? progressionNotePattern!
    : stradellaChordFinderPattern;
  const diagramNotePlaybackButtons = progressionAnnotation
    ? harmonyProgressionNoteStep!.result.playbackButtons
    : stradellaChordFinderResult.playbackButtons;
  const finderFooterEnabled = Boolean(diagramNoteAnnotation?.lines.length);
  const finderLineLabels = {
    identity: `${t("analysis.harmonicIdentity")}:`,
    pitchClasses: `${t("analysis.pitchClassRealization")}:`,
    voicing: `${t("analysis.registralVoicing")}:`,
    physical: `${t("analysis.physicalRealization")}:`,
  } satisfies Record<keyof StradellaNoteLevels, string>;
  const annotationLevelForLine = (line: string): keyof StradellaNoteLevels | null =>
    (Object.entries(finderLineLabels).find(([, prefix]) => line.startsWith(prefix))?.[0] as
      keyof StradellaNoteLevels | undefined) ?? null;
  const finderVoicingAnalysis =
    finderFooterEnabled && showStradellaVoicingIntervals && stradellaNoteLevels.voicing
      ? analyzeConfiguredStradellaVoicing(
          diagramNotePlaybackButtons,
          diagramNoteRoot,
          stradellaRegisterModel,
        )
      : null;
  const finderVoicingLayout = finderVoicingAnalysis
    ? voicingIntervalLayout(finderVoicingAnalysis.notes, {
        fontSize: finderExplanationFontSize,
        displayLabel: (note, count) =>
          `${chordToneName(diagramNoteRoot, diagramNotePattern, note.pitchClass)}${note.octave}${count > 1 ? ` ×${count}` : ""}`,
      })
    : null;
  const finderVoicingChartVisible = Boolean(
    finderVoicingLayout && finderVoicingLayout.positions.length >= 2,
  );
  // The note generator owns the stable ordering, independently of the chart toggle.
  const finderAnnotationDisplayLines = diagramNoteAnnotation?.lines ?? [];
  // Report the actual highlighted buttons for every chord family.
  const trebleChordExplanation = describeTrebleChord(
    chordFinderButtons,
    chordFinderRoot,
    chordFinderPattern,
    trebleChordVoicingMode,
    language,
  );
  const trebleVoicingNote =
    side === "treble" && chordFinderActive ? trebleChordExplanation.note : "";
  const trebleFooterEnabled = Boolean(showTrebleVoicingNote && trebleVoicingNote);
  const contextualTitle = (() => {
    if (progressionAnnotationActive && progressionAnnotation) return progressionAnnotation.title;
    if (side === "stradella" && stradellaChordFinderActive) {
      return finderAnnotationActive
        ? (finderAnnotation?.title ?? localizedAutoTitle())
        : `${displayRealizedChord(stradellaChordFinderRoot, stradellaChordFinderPattern, realizedChordName(stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderEffectiveRequestedBass, stradellaChordFinderEffectiveRequestedBass, `${displayRoot(stradellaChordFinderRoot)}${finderChordSymbol(stradellaChordFinderRoot, stradellaChordFinderPattern).slice(stradellaChordFinderRoot.length)}`), chordDisplayStyle)} - ${t("ui.titleNoRealization")}`;
    }
    if (side === "treble" && chordFinderActive)
      return trebleContextualTitle({
        root: chordFinderRoot,
        pattern: chordFinderPattern,
        inversion: chordFinderInversion,
        hasButtons: chordFinderButtons.length > 0,
        exact: trebleChordExplanation.exact,
        displayStyle: chordDisplayStyle,
      });
    if (scaleFinderActive)
      return `${scaleFinderRoot} ${translateKnownLabel(language, SCALE_FINDER_OPTIONS.find((x) => x.value === scaleFinderPattern)?.label ?? "scale")}`;
    return localizedAutoTitle();
  })();
  const finalTitle =
    titleMode === "auto"
      ? localizedAutoTitle()
      : titleMode === "contextual"
        ? contextualTitle
        : titleMode === "custom"
          ? customTitle
          : "";

  const visibleRoots = side === "stradella" ? stradellaVisibleRoots(basses) : [];
  const visibleRows = side === "stradella" ? stradellaVisibleRows(basses) : [];

  const {
    viewWidth,
    effectiveTitleSize,
    buttonTrebleFooter,
    trebleFooterY,
    trebleFooterFontSize,
    trebleFooterHeight,
    finderFooterHeight,
    stradellaFinderFooterY,
    viewHeight,
  } = calculateDiagramGeometry({
    side,
    isPianoTreble,
    pianoTrebleRange,
    trebleSize,
    buttonSize,
    spacing,
    pianoKeyWidthScale,
    pianoKeyHeightScale,
    diagramVerticalSpacing,
    visibleRootCount: visibleRoots.length,
    visibleRowCount: visibleRows.length,
    buttons,
    titleMode,
    titleSize,
    finalTitle,
    trebleVoicingNote,
    finderAnnotationDisplayLines,
    finderExplanationFontSize,
    finderVoicingChartVisible,
    voicingChartHeight: finderVoicingLayout?.metrics.height ?? 0,
    annotationLevelForLine,
    trebleFooterEnabled,
    finderFooterEnabled,
  });

  const showSequenceNumbers =
    sequenceNumberPosition !== "none" && sequenceModeShowsNumbers(sequenceDisplayMode);
  const showSequenceArrows = sequenceModeShowsArrows(sequenceDisplayMode);
  const sequenceArrowStyle = sequenceArrowStyleFromMode(sequenceDisplayMode);
  const showScaleFinderNumbers =
    sequenceNumberPosition !== "none" &&
    scaleFinderActive &&
    sequenceModeShowsNumbers(scaleFinderDisplayMode);
  const showScaleFinderArrows =
    scaleFinderActive && sequenceModeShowsArrows(scaleFinderDisplayMode);
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

  /* ABC Player, Both hands: while the ABC Player is open with a two-voice
   * tune, both manuals are drawn together in place of the main diagram. */
  const abcHandsView =
    abcBothHands &&
    abcCompanionButtons &&
    workspaceMode === "accordion" &&
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

  const activeToolLabel =
    activeToolSection === "rhythmTrainer"
      ? t("rhythm.title")
      : activeToolStatusLabel({
          side,
          bassPatternPlaybackState,
          abcPlaybackState,
          activeToolSection,
          scaleFinderActive,
          stradellaChordFinderActive,
          chordFinderActive,
          t,
        });

  const statusBarText = accordionStatusText({
    side,
    basses,
    trebleLayout,
    pianoRange: pianoTrebleRange,
    trebleRows,
    notation,
    soundEnabled,
    activeTool: activeToolLabel,
    language,
  });

  /* Each tool's part in the rules that span tools: Finder exclusivity, what
   * toggling a tool does to others, the Reset menu and layout changes (see
   * src/app/toolCoordinator.ts). These registrations move into the tools'
   * own providers as the tools leave the controller. */
  const clearHarmonyWork = () => resetWork("harmony");
  const resetDiagramWork = () => resetWork("accordion");

  return {
    language,
    interfaceDensity,
    leftPanelMode,
    t,
    settings: {
      BASS_OPTIONS,
      PIANO_TREBLE_RANGE_OPTIONS,
      TREBLE_SIZE_OPTIONS,
      accidental,
      accidentalStyle,
      activeSettingsSection,
      basses,
      buttonSize,
      buttonStrokeWidth,
      changeLanguage,
      changePianoTrebleRange,
      changeTrebleLayout,
      changeTrebleSize,
      chordDisplayStyle,
      chordFillStrength,
      chordLabelMode,
      colorTheme,
      customTitle,
      diagramScale,
      diagramVerticalSpacing,
      downloadCurrentSettings,
      harmonyAvailableCounts,
      harmonyColorByFamily,
      harmonyDiameter,
      harmonyFontSize,
      harmonyPlaybackStyle,
      harmonyRingVisibility,
      harmonyShowEnharmonics,
      harmonyShowExplanation,
      harmonyShowLegend,
      harmonyShowNoteRing,
      harmonyShowSeparators,
      harmonyShowToneTooltips,
      harmonyVoicingStyle,
      importSettingsFile,
      resetSettingsToDefaults,
      interfaceDensity,
      isPianoTreble,
      laMelodiosaBassRegister,
      laMelodiosaFollowStradellaRegisters,
      laMelodiosaTrebleRegister,
      labelFont,
      labelFontSize,
      language,
      languagePreference,
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationIncludeTitle,
      musicNotationPlacement,
      musicNotationScale,
      musicNotationStaffSeparator,
      musicNotationStaffWidth,
      musicNotationUseBarsPerLine,
      stradellaNotationMode,
      stradellaChordQualityLabels,
      stradellaMarkCounterbass,
      musicNotationNoteNamesInNoteheads,
      notation,
      pianoBlackKeyHeightScale,
      pianoBlackKeyWidthScale,
      pianoKeyHeightScale,
      pianoKeyWidthScale,
      pianoTrebleRange,
      referenceStrokeWidth,
      setAccidental,
      setAccidentalStyle,
      setBasses,
      setButtonSize,
      setButtonStrokeWidth,
      setChordDisplayStyle,
      setChordFillStrength,
      setChordLabelMode,
      setColorTheme,
      setCustomTitle,
      setDiagramScale,
      setDiagramVerticalSpacing,
      setHarmonyColorByFamily,
      setHarmonyDiameter,
      setHarmonyFontSize,
      setHarmonyPlaybackStyle,
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
      setMusicNotationBarsPerLine,
      setMusicNotationChordFontSize,
      setMusicNotationIncludeDescription,
      setMusicNotationIncludeSummary,
      setMusicNotationIncludeTitle,
      setMusicNotationScale,
      setMusicNotationStaffSeparator,
      setMusicNotationStaffWidth,
      setMusicNotationUseBarsPerLine,
      setStradellaNotationMode,
      setStradellaChordQualityLabels,
      setStradellaMarkCounterbass,
      setMusicNotationNoteNamesInNoteheads,
      setMusicNotationPlacement,
      setNotation,
      setPianoBlackKeyHeightScale,
      setPianoBlackKeyWidthScale,
      setPianoKeyHeightScale,
      setPianoKeyWidthScale,
      setReferenceStrokeWidth,
      setShowBellowsGuide,
      setShowButtonLabels,
      setShowStatusBar,
      setShowStradellaRowLabels,
      setShowTrebleOctaves,
      setSoundAttackMs,
      setSoundMusetteDetuneCents,
      setSoundNoteDurationMs,
      setSoundArticulation,
      soundArticulation,
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
      setStradellaChordRegisterGrouping,
      setStradellaChordRegisterOctave,
      setTitleFont,
      setTitleMode,
      setTitleSize,
      setTrebleAngle,
      setTrebleRows,
      showBellowsGuide,
      showButtonLabels,
      showStatusBar,
      showStradellaRowLabels,
      showTrebleOctaves,
      side,
      soundAttackMs,
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
      stradellaChordRegisterGrouping,
      stradellaChordRegisterOctave,
      stradellaRegisterModel,
      t,
      titleFont,
      titleMode,
      titleSize,
      toggleSettingsSection,
      trebleAngle,
      trebleLayout,
      trebleRows,
      trebleSize,
      workspaceMode,
    },
    tools: {
      rhythmTrainer,
      SEQUENCE_DISPLAY_MODE_OPTIONS,
      abcEditorExpanded,
      abcExampleOptions,
      abcExampleValue,
      abcFileName,
      progressionPathVisible,
      setProgressionPathVisible,
      abcMappedEvents,
      abcMissingPitchText,
      abcParseResult,
      abcPlaybackState,
      abcPositionBeat,
      abcStradellaMode,
      abcTempoBpm,
      abcText,
      abcTotalBeats,
      abcTrebleChordSymbolsMode,
      abcHands,
      chooseAbcHands,
      abcVoiceCount,
      abcBothHands,
      abcRenderedNotationVisible,
      renderNotationInto,
      musicNotationIncludeTitle,
      musicNotationPlacement,
      bassPatternRenderedNotationAbc,
      sequenceRenderedNotationAbc,
      bassPatternRenderedNotationVisible,
      sequenceRenderedNotationVisible,
      harmonyProgressionNotationVisible,
      harmonyRecordedNotationVisible,
      harmonyProgressionRenderedNotationAbc,
      harmonyRecordedProgressionNotationAbc,
      activeToolSection,
      useHarmonyProgressionPreset,
      addManualHarmonyProgressionChord,
      addSelectedHarmonyRelationshipToProgression,
      annotationBold,
      annotationButtonAnchor,
      annotationItalic,
      annotationLocationLabel,
      annotationOffsetPercent,
      annotationPreview,
      applyFingerToSelected,
      bassPatternBarsPerChord,
      bassPatternChordVoicing,
      bassPatternDefinitions,
      bassPatternEditorErrors,
      bassPatternEditorExpanded,
      bassPatternEditorMessage,
      bassPatternEditorText,
      bassPatternEvents,
      bassPatternExportFormat,
      bassPatternId,
      bassPatternMissingText,
      bassPatternPlaybackState,
      bassPatternRepeatSelection,
      bassPatternRoot,
      bassPatternTempoBpm,
      bassPatternTotalBeats,
      bassPatternValidationErrors,
      batchExporting,
      chordDisplayStyle,
      chordFinderActive,
      chordFinderButtons,
      chordFinderInversion,
      chordFinderOctave,
      chordFinderPattern,
      chordFinderRoot,
      chordProgressionDefinitions,
      chordProgressionId,
      clearAllFingerings,
      clearFingerForSelected,
      clearHarmonyRecordedProgression,
      clearSelection,
      clearSequence,
      clearTextNotes,
      customBassPatternDefinitions,
      deleteTextNote,
      deselectButton,
      downloadAllStradellaRealizations,
      exploreCurrentStradellaChordInHarmony,
      exportSelectedBassPattern,
      finderExplanationFontSize,
      finderMaxButtons,
      finderSpanColumns,
      fingeringDraft,
      fingeringPosition,
      formatProgressionOptionLabel,
      formatStradellaScaleFinderNames,
      formatTrebleChordFinderPitches,
      getMainLabel,
      harmonyDiatonicOnly,
      harmonyHighlightDiatonic,
      harmonyProgression,
      harmonyProgressionHandMovementWeight,
      harmonyProgressionRootPosition,
      setHarmonyProgressionRootPosition,
      harmonyProgressionManualPattern,
      harmonyProgressionManualRoot,
      harmonyProgressionVoiceLeadingWeight,
      harmonyProgressionPlan,
      harmonyProgressionRealizationOptions,
      harmonyProgressionRealizationKeys,
      cycleHarmonyProgressionRealization,
      harmonyProgressionPreviewIndex,
      harmonyProgressionNoteStepId,
      toggleHarmonyProgressionStepNotes,
      harmonyProgressionRecording,
      harmonyProgressionRhythmPattern,
      harmonyRecordedProgression,
      harmonyRecordedProgressionPlaying,
      harmonyReferenceFamilyId,
      harmonyRelatedFamilyId,
      harmonyScaleId,
      harmonySelection,
      harmonyShowEnharmonics,
      harmonyShowNoteRing,
      annotateMode,
      isTrebleLikeSide,
      language,
      loadAbcExample,
      loadSelectedPatternIntoEditor,
      moveHarmonyProgressionChord,
      pauseAbcPlayback,
      playChordFinder,
      playHarmonyRecordedProgression,
      playOptimizedHarmonyProgression,
      playRecordedSequence,
      playScaleFinder,
      playSelectedButtons,
      playStradellaChordFinder,
      previewHarmonyProgressionStepOnStradella,
      removeHarmonyProgressionChord,
      removeSelectedCustomBassPattern,
      resetHarmonyExplorer,
      saveCustomBassPattern,
      scaleFinderActive,
      scaleFinderButtons,
      scaleFinderDisplayMode,
      scaleFinderPattern,
      scaleFinderRoot,
      scaleFinderRowLimit,
      scheduleAbcPlayback,
      scheduleBassPatternPlayback,
      selectedBassPattern,
      selectedButtons,
      selectedChordProgression,
      sendHarmonyRecordedProgressionToAssistant,
      sequenceArrowheadSize,
      sequenceColorPreset,
      sequenceDisplayMode,
      sequenceNumberColorPreset,
      sequenceNumberFontSize,
      sequenceNumberPosition,
      sequenceSteps,
      sequenceThickness,
      setAbcActiveButtonIds,
      setAbcEditorExpanded,
      setAbcExampleValue,
      setAbcFileName,
      setAbcPlaybackState,
      setAbcPositionBeat,
      setAbcStradellaMode,
      setAbcTempoBpm,
      setAbcText,
      setAbcTrebleChordSymbolsMode,
      setAnnotationBold,
      setAnnotationButtonAnchor,
      setAnnotationItalic,
      setAnnotationOffsetPercent,
      setBassPatternBarsPerChord,
      setBassPatternChordVoicing,
      setBassPatternEditorExpanded,
      setBassPatternEditorText,
      setBassPatternExportFormat,
      setBassPatternId,
      setBassPatternRepeatSelection,
      setBassPatternRoot,
      setBassPatternTempoBpm,
      setChordFinderActive,
      setChordFinderInversion,
      setChordFinderOctave,
      setChordFinderPattern,
      setChordFinderRoot,
      setChordProgressionId,
      setFinderExplanationFontSize,
      setFinderMaxButtons,
      setFinderSpanColumns,
      setFingeringDraft,
      setFingeringPosition,
      setHarmonyDiatonicOnly,
      setHarmonyHighlightDiatonic,
      setHarmonyProgression,
      setHarmonyProgressionHandMovementWeight,
      setHarmonyProgressionManualPattern,
      setHarmonyProgressionManualRoot,
      setHarmonyProgressionVoiceLeadingWeight,
      setHarmonyProgressionPreviewIndex,
      setHarmonyProgressionNoteStepId,
      setHarmonyProgressionRhythmPattern,
      setHarmonyReferenceFamilyId,
      setHarmonyRelatedFamilyId,
      setHarmonyScaleId,
      setHarmonyShowNoteRing,
      setAnnotateMode,
      setScaleFinderActive,
      setScaleFinderDisplayMode,
      setScaleFinderPattern,
      setScaleFinderRoot,
      setScaleFinderRowLimit,
      setSequenceArrowheadSize,
      setSequenceColorPreset,
      setSequenceDisplayMode,
      setSequenceNumberColorPreset,
      setSequenceNumberFontSize,
      setSequenceNumberPosition,
      setSequenceThickness,
      setShowFinderRealizationNote,
      setShowStradellaVoicingIntervals,
      setShowTrebleVoicingNote,
      setSoundSequenceTempoBpm,
      setStradellaChordFinderActive,
      setStradellaChordFinderMarkRootBass,
      stradellaRequestedBassOnBassButton,
      setStradellaRequestedBassOnBassButton,
      setStradellaChordFinderMode,
      setStradellaChordFinderPattern,
      setStradellaChordFinderRealizationIndex,
      setStradellaChordFinderRequestedBass,
      setStradellaChordFinderRoot,
      setStradellaMinimumNominalGap,
      setStradellaNoteLevels,
      setTextNoteColor,
      setTextNoteFont,
      setTextNoteFontSize,
      setTrebleChordVoicingMode,
      showFinderRealizationNote,
      showHarmonySelectionOnStradella,
      showStradellaVoicingIntervals,
      showTrebleVoicingNote,
      side,
      soundSequenceTempoBpm,
      stopAbcPlayback,
      stopBassPatternPlayback,
      stopHarmonyRecordedProgressionPlayback,
      stopSoundPlayback,
      stradellaChordFinderActive,
      stradellaChordFinderButtons,
      stradellaChordFinderMarkRootBass,
      stradellaChordFinderMode,
      stradellaChordFinderPattern,
      stradellaChordFinderPlaybackButtons,
      stradellaChordFinderRealizationIndex,
      stradellaChordFinderRealizations,
      stradellaChordFinderRequestedBass,
      stradellaChordFinderEffectiveRequestedBass,
      stradellaChordFinderRootFallback,
      stradellaChordFinderBassButtonFallback,
      stradellaChordFinderReachExtendedTo,
      stradellaChordFinderResult,
      stradellaChordFinderRoot,
      stradellaMinimumNominalGap,
      stradellaNoteLevels,
      stradellaRegisterModel,
      stradellaScaleFinderResult,
      t,
      textNoteColor,
      textNoteFont,
      textNoteFontSize,
      textNotes,
      toggleHarmonyProgressionRecording,
      toggleToolSection,
      trebleChordExplanation,
      trebleChordVoicingMode,
      workspaceMode,
    },
    workspace: {
      rhythmTrainer,
      abcActiveButtonIdSet,
      abcNotationRef,
      abcParseResult,
      abcRenderedNotationVisible,
      abcText,
      abcHandsView,
      setAbcHands,
      renderNotationInto,
      accidentalStyle,
      activeToolSection,
      annotateMode,
      annotationButtonAnchor,
      annotationEditorRef,
      annotationLevelForLine,
      annotationPointForButton,
      bassPatternActiveButtonIdSet,
      bassPatternEvents,
      bassPatternNotationRef,
      bassPatternRenderedNotationVisible,
      bellowsEndLabel,
      bellowsLabelY,
      bellowsStartLabel,
      bellowsStripY,
      buttonSize,
      buttonTrebleFooter,
      buttons,
      cancelInlineAnnotation,
      chordDisplayStyle,
      chordFinderActive,
      chordFinderButtons,
      chordLabelMode,
      clearHarmonyWork,
      colorTheme,
      commitInlineAnnotation,
      downloadCurrentDiagram,
      downloadFormat,
      effectiveTitleSize,
      finalTitle,
      diagramNoteRoot,
      diagramNotePattern,
      finderAnnotationDisplayLines,
      finderArrowheadMarkerId,
      finderButtonIds,
      finderExplanationFontSize,
      finderFooterEnabled,
      finderFooterHeight,
      finderVoicingAnalysis,
      finderVoicingChartVisible,
      fingeringPosition,
      getMainLabel,
      handleHarmonyChordActivated,
      handleSvgClick,
      harmonyAllFamiliesMode,
      harmonyAvailableCounts,
      harmonyColorByFamily,
      harmonyCounts,
      harmonyDiameter,
      harmonyEffectiveDiatonicOnly,
      harmonyEffectiveHighlightDiatonic,
      harmonyExplanation,
      harmonyFocusedReferenceRootPc,
      harmonyFontSize,
      harmonyPlaybackStyle,
      harmonyProgressionActiveButtonIdSet,
      harmonyProgressionNotationRef,
      harmonyProgressionNotationVisible,
      harmonyProgressionPlan,
      harmonyRecordedNotationRef,
      harmonyRecordedNotationVisible,
      harmonyRecordedProgression,
      harmonyReferenceFamily,
      harmonyReferenceFamilyId,
      harmonyRelatedFamilyId,
      harmonyRelatedName,
      harmonyScale,
      harmonyScaleId,
      harmonySectors,
      harmonyShowEnharmonics,
      harmonyShowExplanation,
      harmonyShowLegend,
      harmonyShowNoteRing,
      harmonyShowSeparators,
      harmonyShowToneTooltips,
      harmonySvgRef,
      harmonyVoicingStyle,
      inlineAnnotationEditor,
      labelFont,
      labelFontSize,
      language,
      leftPanelMode,
      mobileDiagramView,
      navigateToTool,
      overlays,
      playHarmonyChord,
      playHarmonyChordRelationship,
      playHarmonyNote,
      progressionPreviewButtonIds,
      resetCurrentToolDefaults,
      resetDiagramWork,
      scaleFinderArrowStyle,
      scaleFinderButtons,
      selectAccordionSide,
      selectedBassPattern,
      selectedChordProgression,
      sequenceArrowStyle,
      sequenceArrowheadMarkerId,
      sequenceArrowheadSize,
      sequenceNotationRef,
      sequenceNumberPosition,
      sequenceRenderedNotationVisible,
      sequenceSteps,
      sequenceStepsWithButtons,
      setDownloadFormat,
      setHarmonySelection,
      setInlineAnnotationEditor,
      setMobileDiagramView,
      setPanel,
      setSoundEnabled,
      showBellowsGuide,
      showButtonLabels,
      showScaleFinderArrows,
      showScaleFinderNumbers,
      showSequenceArrows,
      showSequenceNumbers,
      showStatusBar,
      showStradellaRowLabels,
      side,
      soundEnabled,
      statusBarText,
      stopAbcPlayback,
      stopBassPatternPlayback,
      stradellaChordFinderActive,
      stradellaChordFinderPattern,
      stradellaChordFinderRoot,
      stradellaFinderFooterY,
      stradellaPrimaryFinderButtonIds,
      stradellaRootBassFinderButtonIds,
      svgRef,
      svgStyle,
      t,
      textNotes,
      titleFont,
      titleMode,
      toggleAbcNotation,
      toggleBassPatternNotation,
      toggleButton,
      toggleFocusPanel,
      toggleHarmonyProgressionNotation,
      toggleHarmonyRecordedNotation,
      toggleSequenceNotation,
      trebleFooterEnabled,
      trebleFooterFontSize,
      trebleFooterHeight,
      trebleFooterY,
      trebleVoicingNote,
      viewHeight,
      viewWidth,
      visibleRows,
      workspaceMode,
      // Shared playback bar under the diagram (one transport for every player).
      samplesLoading,
      scheduleAbcPlayback,
      scheduleBassPatternPlayback,
      soundEnginePlayer,
      stopSoundPlayback,
      progressionPathVisible,
    },
  };
}

/** Inferred controller contract shared by the three view modules. */
export type AppControllerModel = ReturnType<typeof useAppController>;
