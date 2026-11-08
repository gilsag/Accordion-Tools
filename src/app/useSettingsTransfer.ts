import type { ChordDisplayStyle } from "../tools/chordDisplay";
import { useEffect, useRef } from "react";
import type { DefaultSettingsFile } from "../settings/settingsSchema";
import { applyStartupSettings, applyImportedSettings, collectCurrentSettings, type SettingsSetters } from "../settings/settingsController";
import { fetchDefaultSettingsDocument, parseSettingsDocumentFile, downloadSettingsDocument } from "../settings/settingsPersistence";
import type { useLanguageSettings } from "../settings/useLanguageSettings";
import type { useInstrumentState } from "../instrument/useInstrumentState";
import type { useDiagramAppearanceState } from "../diagram/useDiagramAppearanceState";
import type { useDiagramOverlays } from "../diagram/useDiagramOverlays";
import type { useDiagramAnnotations } from "../features/annotateDiagram/useDiagramAnnotations";
import type { useBassPatternState } from "../features/bassPatternPlayer/useBassPatternPlayer";
import type { useSequenceState } from "../features/sequences/useSequenceState";
import type { useAbcPlayerState } from "../features/abcPlayer/useAbcPlayer";
import type { useHarmonyExplorerState } from "../features/harmonyExplorer/useHarmonyExplorer";
import type { useHarmonyProgressionState } from "../features/progressionAssistant/useProgressionAssistant";
import type { useStradellaChordFinderState } from "../features/stradellaChordFinder/useStradellaChordFinder";
import type { useScaleFinderState } from "../features/scaleFinder/useScaleFinder";
import type { useTrebleChordFinderState } from "../features/trebleChordFinder/useTrebleChordFinder";
import type { useSoundSettings } from "../audio/useSoundSettings";
import type { useNotationSettings } from "../notation/useNotationSettings";
import type { AccidentalMode, ChordLabelMode, DownloadFormat, InterfaceDensity, NotationMode } from "../types";
import type { Dispatch, SetStateAction } from "react";

export type UseSettingsTransferDeps = Pick<ReturnType<typeof useAbcPlayerState>,
    "abcStradellaMode" | "abcTempoBpm" | "abcTrebleChordSymbolsMode" | "setAbcStradellaMode" |
    "setAbcTempoBpm" | "setAbcTrebleChordSymbolsMode" | "abcHands" | "setAbcHands"> &
  Pick<ReturnType<typeof useDiagramAppearanceState>,
    "accidentalStyle" | "buttonSize" | "buttonStrokeWidth" | "chordFillStrength" |
    "colorTheme" | "customTitle" | "diagramScale" | "diagramVerticalSpacing" | "labelFont" |
    "labelFontSize" | "pianoBlackKeyHeightScale" | "pianoBlackKeyWidthScale" |
    "pianoKeyHeightScale" | "pianoKeyWidthScale" | "referenceStrokeWidth" |
    "setAccidentalStyle" | "setButtonSize" | "setButtonStrokeWidth" | "setChordFillStrength" |
    "setColorTheme" | "setCustomTitle" | "setDiagramScale" | "setDiagramVerticalSpacing" |
    "setLabelFont" | "setLabelFontSize" | "setPianoBlackKeyHeightScale" |
    "setPianoBlackKeyWidthScale" | "setPianoKeyHeightScale" | "setPianoKeyWidthScale" |
    "setReferenceStrokeWidth" | "setShowBellowsGuide" | "setShowButtonLabels" |
    "setShowStatusBar" | "setShowStradellaRowLabels" | "setSpacing" | "setTitleFont" |
    "setTitleMode" | "setTitleSize" | "setTrebleAngle" | "showBellowsGuide" |
    "showButtonLabels" | "showStatusBar" | "showStradellaRowLabels" | "spacing" | "titleFont" |
    "titleMode" | "titleSize" | "trebleAngle"> &
  Pick<ReturnType<typeof useDiagramAnnotations>,
    "annotationBold" | "annotationButtonAnchor" | "annotationItalic" |
    "annotationOffsetPercent" | "setAnnotationBold" | "setAnnotationButtonAnchor" |
    "setAnnotationItalic" | "setAnnotationOffsetPercent" | "setTextNoteColor" |
    "setTextNoteFont" | "setTextNoteFontSize" | "textNoteColor" | "textNoteFont" |
    "textNoteFontSize"> &
  Pick<ReturnType<typeof useBassPatternState>,
    "bassPatternBarsPerChord" | "bassPatternChordVoicing" | "bassPatternLoopCount" |
    "bassPatternLoopMode" | "bassPatternRoot" | "bassPatternTempoBpm" |
    "setBassPatternBarsPerChord" | "setBassPatternChordVoicing" | "setBassPatternLoopCount" |
    "setBassPatternLoopMode" | "setBassPatternRoot" | "setBassPatternTempoBpm"> &
  Pick<ReturnType<typeof useInstrumentState>,
    "basses" | "pianoTrebleRange" | "setBasses" | "setPianoTrebleRange" |
    "setShowTrebleOctaves" | "setSide" | "setStradellaBassRegisterGrouping" |
    "setStradellaBassRegisterOctave" | "setStradellaChordRegisterGrouping" |
    "setStradellaChordRegisterOctave" | "setTrebleLayout" | "setTrebleRows" | "setTrebleSize" |
    "showTrebleOctaves" | "side" | "stradellaBassRegisterGrouping" |
    "stradellaBassRegisterOctave" | "stradellaChordRegisterGrouping" |
    "stradellaChordRegisterOctave" | "trebleLayout" | "trebleRows" | "trebleSize"> &
  Pick<ReturnType<typeof useLanguageSettings>,
    "changeLanguage" | "languagePreference" | "setLanguagePreference" | "t"> &
  Pick<ReturnType<typeof useTrebleChordFinderState>,
    "chordFinderInversion" | "chordFinderOctave" | "chordFinderPattern" | "chordFinderRoot" |
    "setChordFinderInversion" | "setChordFinderOctave" | "setChordFinderPattern" |
    "setChordFinderRoot"> &
  Pick<ReturnType<typeof useDiagramOverlays>,
    "fingeringPosition" | "setFingeringPosition"> &
  Pick<ReturnType<typeof useHarmonyExplorerState>,
    "harmonyColorByFamily" | "harmonyDiameter" | "harmonyFontSize" | "harmonyPlaybackStyle" |
    "harmonyRingVisibility" | "harmonyShowEnharmonics" | "harmonyShowExplanation" |
    "harmonyShowLegend" | "harmonyShowNoteRing" | "harmonyShowSeparators" |
    "harmonyShowToneTooltips" | "harmonyVoicingStyle" | "setHarmonyColorByFamily" |
    "setHarmonyDiameter" | "setHarmonyFontSize" | "setHarmonyPlaybackStyle" |
    "setHarmonyRingVisibility" | "setHarmonyShowEnharmonics" | "setHarmonyShowExplanation" |
    "setHarmonyShowLegend" | "setHarmonyShowNoteRing" | "setHarmonyShowSeparators" |
    "setHarmonyShowToneTooltips" | "setHarmonyVoicingStyle"> &
  Pick<ReturnType<typeof useHarmonyProgressionState>,
    "harmonyProgressionHandMovementWeight" | "harmonyProgressionRhythmPattern" |
    "harmonyProgressionRootPosition" | "setHarmonyProgressionHandMovementWeight" |
    "setHarmonyProgressionRhythmPattern" | "setHarmonyProgressionRootPosition"> &
  Pick<ReturnType<typeof useSoundSettings>,
    "laMelodiosaBassRegister" | "laMelodiosaFollowStradellaRegisters" |
    "laMelodiosaTrebleRegister" | "setLaMelodiosaBassRegister" |
    "setLaMelodiosaFollowStradellaRegisters" | "setLaMelodiosaTrebleRegister" |
    "setSoundArticulation" | "setSoundAttackMs" | "setSoundEnabled" |
    "setSoundMusetteDetuneCents" | "setSoundNoteDurationMs" | "setSoundReleaseMs" |
    "setSoundSequenceTempoBpm" | "setSoundSource" | "setSoundVoicePreset" | "setSoundVolume" |
    "setSoundWaveform" | "setStradellaBassVoicing" | "soundArticulation" | "soundAttackMs" |
    "soundEnabled" | "soundMusetteDetuneCents" | "soundNoteDurationMs" | "soundReleaseMs" |
    "soundSequenceTempoBpm" | "soundSource" | "soundVoicePreset" | "soundVolume" |
    "soundWaveform" | "stradellaBassVoicing"> &
  Pick<ReturnType<typeof useNotationSettings>,
    "musicNotationBarsPerLine" | "musicNotationChordFontSize" |
    "musicNotationIncludeDescription" | "musicNotationIncludeSummary" |
    "musicNotationIncludeTitle" | "musicNotationScale" | "musicNotationStaffSeparator" |
    "musicNotationStaffWidth" | "musicNotationUseBarsPerLine" | "setMusicNotationBarsPerLine" |
    "setMusicNotationChordFontSize" | "setMusicNotationIncludeDescription" |
    "setMusicNotationIncludeSummary" | "setMusicNotationIncludeTitle" |
    "setMusicNotationScale" | "setMusicNotationStaffSeparator" | "setMusicNotationStaffWidth" |
    "setMusicNotationUseBarsPerLine"> &
  Pick<ReturnType<typeof useScaleFinderState>,
    "scaleFinderDisplayMode" | "scaleFinderPattern" | "scaleFinderRoot" |
    "scaleFinderRowLimit" | "setScaleFinderDisplayMode" | "setScaleFinderPattern" |
    "setScaleFinderRoot" | "setScaleFinderRowLimit"> &
  Pick<ReturnType<typeof useSequenceState>,
    "sequenceArrowheadSize" | "sequenceColorPreset" | "sequenceDisplayMode" |
    "sequenceNumberColorPreset" | "sequenceNumberFontSize" | "sequenceNumberPosition" |
    "sequenceThickness" | "setSequenceArrowheadSize" | "setSequenceColorPreset" |
    "setSequenceDisplayMode" | "setSequenceNumberColorPreset" | "setSequenceNumberFontSize" |
    "setSequenceNumberPosition" | "setSequenceThickness"> &
  Pick<ReturnType<typeof useStradellaChordFinderState>,
    "setStradellaChordFinderMarkRootBass" | "setStradellaChordFinderMode" |
    "setStradellaMinimumNominalGap" | "setStradellaNoteLevels" |
    "setStradellaRequestedBassOnBassButton" | "stradellaChordFinderMarkRootBass" |
    "stradellaChordFinderMode" | "stradellaMinimumNominalGap" | "stradellaNoteLevels" |
    "stradellaRequestedBassOnBassButton"> &
  {
    accidental: AccidentalMode;
    chordDisplayStyle: ChordDisplayStyle;
    chordLabelMode: ChordLabelMode;
    downloadFormat: DownloadFormat;
    interfaceDensity: InterfaceDensity;
    notation: NotationMode;
    setAccidental: Dispatch<SetStateAction<AccidentalMode>>;
    setChordDisplayStyle: Dispatch<SetStateAction<ChordDisplayStyle>>;
    setChordLabelMode: Dispatch<SetStateAction<ChordLabelMode>>;
    setDownloadFormat: Dispatch<SetStateAction<DownloadFormat>>;
    setInterfaceDensity: Dispatch<SetStateAction<InterfaceDensity>>;
    setNotation: Dispatch<SetStateAction<NotationMode>>;
    setShowStradellaVoicingIntervals: Dispatch<SetStateAction<boolean>>;
    showStradellaVoicingIntervals: boolean;
  };

/** Settings files: applies the startup defaults once, imports a saved file, and collects the current settings for download. Setters and values come from the feature hooks that own them. */
export function useSettingsTransfer(deps: UseSettingsTransferDeps) {
  const {
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
  } = deps;

  // React's state setters are stable. Keep this adapter stable so asynchronous
  // editable-default loading runs once; the controller owns validation only.
  const settingsSettersRef = useRef<SettingsSetters>({
    changeLanguage,
    setAbcStradellaMode,
    setAbcTempoBpm,
    setAbcTrebleChordSymbolsMode,
    setAbcHands,
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
      abcHands,
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

  return {
    downloadCurrentSettings, importSettingsFile,
  };
}
