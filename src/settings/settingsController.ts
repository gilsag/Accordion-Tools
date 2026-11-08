import type { DefaultSettingsFile } from "./settingsSchema";
import { SETTINGS_VERSION } from "./settingsMigrations";
import { isInterfaceLanguagePreference } from "../i18n/catalog";
import { normalizeStradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import type { MinimumNominalGap } from "../tools/stradellaChordFinder/voicingDensity";
import { DEFAULT_RING_VISIBILITY } from "../tools/harmonyExplorer/music";

/** Callbacks supplied by feature owners; the settings controller never owns
 * instrument, sound or tool state. Typed per exported JSON field so future
 * changes cannot silently widen the accepted setter values.
 */
export interface SettingsSetters {
  changeLanguage: (value: NonNullable<DefaultSettingsFile["language"]>) => void;
  setAbcStradellaMode: (value: NonNullable<DefaultSettingsFile["abcStradellaMode"]>) => void;
  setAbcTempoBpm: (value: NonNullable<DefaultSettingsFile["abcTempoBpm"]>) => void;
  setAbcTrebleChordSymbolsMode: (value: NonNullable<DefaultSettingsFile["abcTrebleChordSymbolsMode"]>) => void;
  setAbcHands: (value: NonNullable<DefaultSettingsFile["abcHands"]>) => void;
  setAccidental: (value: NonNullable<DefaultSettingsFile["accidental"]>) => void;
  setAccidentalStyle: (value: NonNullable<DefaultSettingsFile["accidentalStyle"]>) => void;
  setAnnotationBold: (value: NonNullable<DefaultSettingsFile["annotationBold"]>) => void;
  setAnnotationButtonAnchor: (value: NonNullable<DefaultSettingsFile["annotationButtonAnchor"]>) => void;
  setAnnotationItalic: (value: NonNullable<DefaultSettingsFile["annotationItalic"]>) => void;
  setAnnotationOffsetPercent: (value: NonNullable<DefaultSettingsFile["annotationOffsetPercent"]>) => void;
  setBassPatternBarsPerChord: (value: NonNullable<DefaultSettingsFile["bassPatternRepeatsPerChord"]>) => void;
  setBassPatternChordVoicing: (value: NonNullable<DefaultSettingsFile["bassPatternChordVoicing"]>) => void;
  setBassPatternLoopCount: (value: NonNullable<DefaultSettingsFile["bassPatternLoopCount"]>) => void;
  setBassPatternLoopMode: (value: NonNullable<DefaultSettingsFile["bassPatternLoopMode"]>) => void;
  setBassPatternRoot: (value: NonNullable<DefaultSettingsFile["bassPatternRoot"]>) => void;
  setBassPatternTempoBpm: (value: NonNullable<DefaultSettingsFile["bassPatternTempoBpm"]>) => void;
  setBasses: (value: NonNullable<DefaultSettingsFile["basses"]>) => void;
  setButtonSize: (value: NonNullable<DefaultSettingsFile["buttonSize"]>) => void;
  setButtonStrokeWidth: (value: NonNullable<DefaultSettingsFile["buttonStrokeWidth"]>) => void;
  setChordDisplayStyle: (value: NonNullable<DefaultSettingsFile["chordDisplayStyle"]>) => void;
  setChordFillStrength: (value: NonNullable<DefaultSettingsFile["chordFillStrength"]>) => void;
  setChordFinderInversion: (value: NonNullable<DefaultSettingsFile["chordFinderInversion"]>) => void;
  setChordFinderOctave: (value: NonNullable<DefaultSettingsFile["chordFinderOctave"]>) => void;
  setChordFinderPattern: (value: NonNullable<DefaultSettingsFile["chordFinderPattern"]>) => void;
  setChordFinderRoot: (value: NonNullable<DefaultSettingsFile["chordFinderRoot"]>) => void;
  setChordLabelMode: (value: NonNullable<DefaultSettingsFile["chordLabelMode"]>) => void;
  setColorTheme: (value: NonNullable<DefaultSettingsFile["colorTheme"]>) => void;
  setCustomTitle: (value: NonNullable<DefaultSettingsFile["customTitle"]>) => void;
  setDiagramScale: (value: NonNullable<DefaultSettingsFile["diagramScale"]>) => void;
  setDiagramVerticalSpacing: (value: NonNullable<DefaultSettingsFile["diagramVerticalSpacing"]>) => void;
  setDownloadFormat: (value: NonNullable<DefaultSettingsFile["downloadFormat"]>) => void;
  setFingeringPosition: (value: NonNullable<DefaultSettingsFile["fingeringPosition"]>) => void;
  setHarmonyColorByFamily: (value: NonNullable<DefaultSettingsFile["harmonyColorByFamily"]>) => void;
  setHarmonyDiameter: (value: NonNullable<DefaultSettingsFile["harmonyDiameter"]>) => void;
  setHarmonyFontSize: (value: NonNullable<DefaultSettingsFile["harmonyFontSize"]>) => void;
  setHarmonyPlaybackStyle: (value: NonNullable<DefaultSettingsFile["harmonyPlaybackStyle"]>) => void;
  setHarmonyProgressionHandMovementWeight: (value: NonNullable<DefaultSettingsFile["progressionHandMovementWeight"]>) => void;
  setHarmonyProgressionRhythmPattern: (value: NonNullable<DefaultSettingsFile["progressionRhythmPattern"]>) => void;
  setHarmonyProgressionRootPosition: (value: NonNullable<DefaultSettingsFile["progressionRootPosition"]>) => void;
  setHarmonyRingVisibility: (value: Record<number, boolean>) => void;
  setHarmonyShowEnharmonics: (value: NonNullable<DefaultSettingsFile["harmonyShowEnharmonics"]>) => void;
  setHarmonyShowExplanation: (value: NonNullable<DefaultSettingsFile["harmonyShowExplanation"]>) => void;
  setHarmonyShowLegend: (value: NonNullable<DefaultSettingsFile["harmonyShowLegend"]>) => void;
  setHarmonyShowNoteRing: (value: NonNullable<DefaultSettingsFile["harmonyShowNoteRing"]>) => void;
  setHarmonyShowSeparators: (value: NonNullable<DefaultSettingsFile["harmonyShowSeparators"]>) => void;
  setHarmonyShowToneTooltips: (value: NonNullable<DefaultSettingsFile["harmonyShowToneTooltips"]>) => void;
  setHarmonyVoicingStyle: (value: NonNullable<DefaultSettingsFile["harmonyVoicingStyle"]>) => void;
  setInterfaceDensity: (value: NonNullable<DefaultSettingsFile["interfaceDensity"]>) => void;
  setLaMelodiosaBassRegister: (value: NonNullable<DefaultSettingsFile["laMelodiosaBassRegister"]>) => void;
  setLaMelodiosaFollowStradellaRegisters: (value: NonNullable<DefaultSettingsFile["laMelodiosaFollowStradellaRegisters"]>) => void;
  setLaMelodiosaTrebleRegister: (value: NonNullable<DefaultSettingsFile["laMelodiosaTrebleRegister"]>) => void;
  setLabelFont: (value: NonNullable<DefaultSettingsFile["labelFont"]>) => void;
  setLabelFontSize: (value: NonNullable<DefaultSettingsFile["labelFontSize"]>) => void;
  setLanguagePreference: (value: NonNullable<DefaultSettingsFile["language"]>) => void;
  setMusicNotationBarsPerLine: (value: NonNullable<DefaultSettingsFile["musicNotationBarsPerLine"]>) => void;
  setMusicNotationChordFontSize: (value: NonNullable<DefaultSettingsFile["musicNotationChordFontSize"]>) => void;
  setMusicNotationIncludeDescription: (value: NonNullable<DefaultSettingsFile["musicNotationIncludeDescription"]>) => void;
  setMusicNotationIncludeSummary: (value: NonNullable<DefaultSettingsFile["musicNotationIncludeSummary"]>) => void;
  setMusicNotationIncludeTitle: (value: NonNullable<DefaultSettingsFile["musicNotationIncludeTitle"]>) => void;
  setMusicNotationScale: (value: NonNullable<DefaultSettingsFile["musicNotationScale"]>) => void;
  setMusicNotationStaffSeparator: (value: NonNullable<DefaultSettingsFile["musicNotationStaffSeparator"]>) => void;
  setMusicNotationStaffWidth: (value: NonNullable<DefaultSettingsFile["musicNotationStaffWidth"]>) => void;
  setMusicNotationUseBarsPerLine: (value: NonNullable<DefaultSettingsFile["musicNotationUseBarsPerLine"]>) => void;
  setNotation: (value: NonNullable<DefaultSettingsFile["notation"]>) => void;
  setPianoBlackKeyHeightScale: (value: NonNullable<DefaultSettingsFile["pianoBlackKeyHeightScale"]>) => void;
  setPianoBlackKeyWidthScale: (value: NonNullable<DefaultSettingsFile["pianoBlackKeyWidthScale"]>) => void;
  setPianoKeyHeightScale: (value: NonNullable<DefaultSettingsFile["pianoKeyHeightScale"]>) => void;
  setPianoKeyWidthScale: (value: NonNullable<DefaultSettingsFile["pianoKeyWidthScale"]>) => void;
  setPianoTrebleRange: (value: NonNullable<DefaultSettingsFile["pianoTrebleRange"]>) => void;
  setReferenceStrokeWidth: (value: NonNullable<DefaultSettingsFile["referenceStrokeWidth"]>) => void;
  setScaleFinderDisplayMode: (value: NonNullable<DefaultSettingsFile["scaleFinderDisplayMode"]>) => void;
  setScaleFinderPattern: (value: NonNullable<DefaultSettingsFile["scaleFinderPattern"]>) => void;
  setScaleFinderRoot: (value: NonNullable<DefaultSettingsFile["scaleFinderRoot"]>) => void;
  setScaleFinderRowLimit: (value: NonNullable<DefaultSettingsFile["scaleFinderRowLimit"]>) => void;
  setSequenceArrowheadSize: (value: NonNullable<DefaultSettingsFile["sequenceArrowheadSize"]>) => void;
  setSequenceColorPreset: (value: NonNullable<DefaultSettingsFile["sequenceColorPreset"]>) => void;
  setSequenceDisplayMode: (value: NonNullable<DefaultSettingsFile["sequenceDisplayMode"]>) => void;
  setSequenceNumberColorPreset: (value: NonNullable<DefaultSettingsFile["sequenceNumberColorPreset"]>) => void;
  setSequenceNumberFontSize: (value: NonNullable<DefaultSettingsFile["sequenceNumberFontSize"]>) => void;
  setSequenceNumberPosition: (value: NonNullable<DefaultSettingsFile["sequenceNumberPosition"]>) => void;
  setSequenceThickness: (value: NonNullable<DefaultSettingsFile["sequenceThickness"]>) => void;
  setShowBellowsGuide: (value: NonNullable<DefaultSettingsFile["showBellowsGuide"]>) => void;
  setShowButtonLabels: (value: NonNullable<DefaultSettingsFile["showButtonLabels"]>) => void;
  setShowStatusBar: (value: NonNullable<DefaultSettingsFile["showStatusBar"]>) => void;
  setShowStradellaRowLabels: (value: NonNullable<DefaultSettingsFile["showStradellaRowLabels"]>) => void;
  setShowStradellaVoicingIntervals: (value: NonNullable<DefaultSettingsFile["stradellaShowNominalNoteSpacing"]>) => void;
  setShowTrebleOctaves: (value: NonNullable<DefaultSettingsFile["showTrebleOctaves"]>) => void;
  setSide: (value: NonNullable<DefaultSettingsFile["side"]>) => void;
  setSoundAttackMs: (value: NonNullable<DefaultSettingsFile["soundAttackMs"]>) => void;
  setSoundEnabled: (value: NonNullable<DefaultSettingsFile["soundEnabled"]>) => void;
  setSoundMusetteDetuneCents: (value: NonNullable<DefaultSettingsFile["soundMusetteDetuneCents"]>) => void;
  setSoundNoteDurationMs: (value: NonNullable<DefaultSettingsFile["soundNoteDurationMs"]>) => void;
  setSoundArticulation: (value: NonNullable<DefaultSettingsFile["soundArticulation"]>) => void;
  setSoundReleaseMs: (value: NonNullable<DefaultSettingsFile["soundReleaseMs"]>) => void;
  setSoundSequenceTempoBpm: (value: NonNullable<DefaultSettingsFile["soundSequenceTempoBpm"]>) => void;
  setSoundSource: (value: NonNullable<DefaultSettingsFile["soundSource"]>) => void;
  setSoundVoicePreset: (value: NonNullable<DefaultSettingsFile["soundVoicePreset"]>) => void;
  setSoundVolume: (value: NonNullable<DefaultSettingsFile["soundVolume"]>) => void;
  setSoundWaveform: (value: NonNullable<DefaultSettingsFile["soundWaveform"]>) => void;
  setSpacing: (value: NonNullable<DefaultSettingsFile["buttonSpacing"]>) => void;
  setStradellaBassRegisterGrouping: (value: NonNullable<DefaultSettingsFile["stradellaBassRegisterGrouping"]>) => void;
  setStradellaBassRegisterOctave: (value: NonNullable<DefaultSettingsFile["stradellaBassRegisterOctave"]>) => void;
  setStradellaBassVoicing: (value: NonNullable<DefaultSettingsFile["stradellaBassVoicing"]>) => void;
  setStradellaChordFinderMarkRootBass: (value: NonNullable<DefaultSettingsFile["stradellaChordFinderMarkRootBass"]>) => void;
  setStradellaRequestedBassOnBassButton: (value: NonNullable<DefaultSettingsFile["stradellaRequestedBassOnBassButton"]>) => void;
  setStradellaChordFinderMode: (value: NonNullable<DefaultSettingsFile["stradellaChordFinderMode"]>) => void;
  setStradellaChordRegisterGrouping: (value: NonNullable<DefaultSettingsFile["stradellaChordRegisterGrouping"]>) => void;
  setStradellaChordRegisterOctave: (value: NonNullable<DefaultSettingsFile["stradellaChordRegisterOctave"]>) => void;
  setStradellaMinimumNominalGap: (value: NonNullable<DefaultSettingsFile["stradellaMinimumNominalGap"]>) => void;
  setStradellaNoteLevels: (value: NonNullable<DefaultSettingsFile["stradellaNoteLevels"]>) => void;
  setTextNoteColor: (value: NonNullable<DefaultSettingsFile["annotationTextColor"]>) => void;
  setTextNoteFont: (value: NonNullable<DefaultSettingsFile["annotationFont"]>) => void;
  setTextNoteFontSize: (value: NonNullable<DefaultSettingsFile["annotationTextSize"]>) => void;
  setTitleFont: (value: NonNullable<DefaultSettingsFile["titleFont"]>) => void;
  setTitleMode: (value: NonNullable<DefaultSettingsFile["titleMode"]>) => void;
  setTitleSize: (value: NonNullable<DefaultSettingsFile["titleSize"]>) => void;
  setTrebleAngle: (value: NonNullable<DefaultSettingsFile["trebleAngle"]>) => void;
  setTrebleLayout: (value: NonNullable<DefaultSettingsFile["trebleLayout"]>) => void;
  setTrebleRows: (value: NonNullable<DefaultSettingsFile["trebleRows"]>) => void;
  setTrebleSize: (value: NonNullable<DefaultSettingsFile["trebleSize"]>) => void;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

// Maintain the original five allowed sequence-display values; this list is
// deliberately independent of localized dropdown labels.
const SEQUENCE_DISPLAY_MODE_VALUES = [
  "numbers", "straight-arrows", "curved-arrows",
  "numbers-and-straight-arrows", "numbers-and-curved-arrows",
] as const;

/** The startup path retains its own precedence and validation rules. */
export function applyStartupSettings(defaults: DefaultSettingsFile, setters: SettingsSetters): void {
  const {
    setAbcStradellaMode,
    setAbcTempoBpm,
    setAbcTrebleChordSymbolsMode,
    setAbcHands,
    setAccidental,
    setBassPatternBarsPerChord,
    setBassPatternChordVoicing,
    setBassPatternLoopCount,
    setBassPatternLoopMode,
    setBassPatternTempoBpm,
    setBasses,
    setChordDisplayStyle,
    setChordLabelMode,
    setColorTheme,
    setCustomTitle,
    setDiagramScale,
    setDiagramVerticalSpacing,
    setDownloadFormat,
    setInterfaceDensity,
    setLaMelodiosaBassRegister,
    setLaMelodiosaFollowStradellaRegisters,
    setLaMelodiosaTrebleRegister,
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
    setScaleFinderDisplayMode,
    setShowBellowsGuide,
    setShowButtonLabels,
    setShowStatusBar,
    setShowStradellaRowLabels,
    setShowTrebleOctaves,
    setSide,
    setSoundEnabled,
    setSoundSequenceTempoBpm,
    setSoundSource,
    setStradellaBassRegisterGrouping,
    setStradellaBassRegisterOctave,
    setStradellaBassVoicing,
    setStradellaChordFinderMarkRootBass,
    setStradellaRequestedBassOnBassButton,
    setStradellaChordFinderMode,
    setStradellaChordRegisterGrouping,
    setStradellaChordRegisterOctave,
    setStradellaNoteLevels,
    setTitleMode,
    setTrebleLayout,
    setTrebleRows,
    setTrebleSize,
  } = setters;

// Persisted preference (even "auto") wins over editable startup defaults.
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
        if (typeof defaults.stradellaRequestedBassOnBassButton === "boolean") {
          setStradellaRequestedBassOnBassButton(defaults.stradellaRequestedBassOnBassButton);
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
        if (isOneOf(defaults.abcHands, ["stradella", "treble", "both"] as const)) {
          setAbcHands(defaults.abcHands);
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
              30,
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
        applyExtendedDefaultSettings(defaults, setters);
  }

/** Shared visual, musical-tool, audio and progression settings validation. */
function applyExtendedDefaultSettings(settings: DefaultSettingsFile, setters: SettingsSetters): void {
  const {
    setAccidentalStyle,
    setAnnotationBold,
    setAnnotationButtonAnchor,
    setAnnotationItalic,
    setAnnotationOffsetPercent,
    setBassPatternRoot,
    setButtonSize,
    setButtonStrokeWidth,
    setChordFillStrength,
    setChordFinderInversion,
    setChordFinderOctave,
    setChordFinderPattern,
    setChordFinderRoot,
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
    setLaMelodiosaBassRegister,
    setLaMelodiosaFollowStradellaRegisters,
    setLaMelodiosaTrebleRegister,
    setLabelFont,
    setLabelFontSize,
    setReferenceStrokeWidth,
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
    setShowStradellaVoicingIntervals,
    setSoundAttackMs,
    setSoundMusetteDetuneCents,
    setSoundNoteDurationMs,
    setSoundArticulation,
    setSoundReleaseMs,
    setSoundSource,
    setSoundVoicePreset,
    setSoundVolume,
    setSoundWaveform,
    setSpacing,
    setStradellaMinimumNominalGap,
    setTextNoteColor,
    setTextNoteFont,
    setTextNoteFontSize,
    setTitleFont,
    setTitleSize,
    setTrebleAngle,
  } = setters;

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
      setChordFinderOctave(Number(settings.chordFinderOctave) as NonNullable<DefaultSettingsFile["chordFinderOctave"]>);
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
    if (typeof settings.soundArticulation === "number" && Number.isFinite(settings.soundArticulation))
      setSoundArticulation(Math.max(0.3, Math.min(1, Math.round(settings.soundArticulation * 100) / 100)));
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
    if (typeof settings.progressionHandMovementWeight === "number")
      setHarmonyProgressionHandMovementWeight(Math.max(0, Math.min(1, settings.progressionHandMovementWeight)));
    if (isOneOf(settings.progressionRhythmPattern, ["block", "oom-pah", "waltz", "march"] as const))
      setHarmonyProgressionRhythmPattern(settings.progressionRhythmPattern);
    if (typeof settings.progressionRootPosition === "boolean")
      setHarmonyProgressionRootPosition(settings.progressionRootPosition);
  }

/** Imported partial JSON affects only valid supplied fields, and persists an
 * explicitly imported language (unlike the startup default path).
 */
export function applyImportedSettings(settings: DefaultSettingsFile, setters: SettingsSetters): void {
  const {
    changeLanguage,
    setAbcStradellaMode,
    setAbcTempoBpm,
    setAbcTrebleChordSymbolsMode,
    setAbcHands,
    setAccidental,
    setBassPatternBarsPerChord,
    setBassPatternChordVoicing,
    setBassPatternLoopCount,
    setBassPatternLoopMode,
    setBassPatternTempoBpm,
    setBasses,
    setChordDisplayStyle,
    setChordLabelMode,
    setColorTheme,
    setCustomTitle,
    setDiagramScale,
    setDiagramVerticalSpacing,
    setDownloadFormat,
    setInterfaceDensity,
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
    setScaleFinderDisplayMode,
    setShowBellowsGuide,
    setShowButtonLabels,
    setShowStatusBar,
    setShowStradellaRowLabels,
    setShowTrebleOctaves,
    setSide,
    setSoundEnabled,
    setSoundSequenceTempoBpm,
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
    setTitleMode,
    setTrebleLayout,
    setTrebleRows,
    setTrebleSize,
  } = setters;

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
    if (typeof settings.stradellaRequestedBassOnBassButton === "boolean")
      setStradellaRequestedBassOnBassButton(settings.stradellaRequestedBassOnBassButton);
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
    if (isOneOf(settings.abcHands, ["stradella", "treble", "both"] as const))
      setAbcHands(settings.abcHands);
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
        Math.max(30, Math.min(220, Math.round(settings.bassPatternTempoBpm))),
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
    applyExtendedDefaultSettings(settings, setters);
  }

/** Read-only snapshot of the current values provided by the domain owners.
 * JSON keys and insertion order are defined only by collectCurrentSettings.
 */
export type SettingsExportSnapshot = Required<Pick<DefaultSettingsFile,
  "side" |
  "notation" |
  "accidental" |
  "chordLabelMode" |
  "chordDisplayStyle" |
  "basses" |
  "trebleLayout" |
  "trebleRows" |
  "trebleSize" |
  "pianoTrebleRange" |
  "showTrebleOctaves" |
  "colorTheme" |
  "titleMode" |
  "customTitle" |
  "showButtonLabels" |
  "showBellowsGuide" |
  "showStradellaRowLabels" |
  "downloadFormat" |
  "soundEnabled" |
  "stradellaBassVoicing" |
  "stradellaBassRegisterOctave" |
  "stradellaBassRegisterGrouping" |
  "stradellaChordRegisterOctave" |
  "stradellaChordRegisterGrouping" |
  "stradellaChordFinderMarkRootBass" |
  "stradellaRequestedBassOnBassButton" |
  "stradellaChordFinderMode" |
  "stradellaNoteLevels" |
  "stradellaMinimumNominalGap" |
  "diagramVerticalSpacing" |
  "pianoKeyWidthScale" |
  "pianoKeyHeightScale" |
  "pianoBlackKeyWidthScale" |
  "pianoBlackKeyHeightScale" |
  "diagramScale" |
  "interfaceDensity" |
  "showStatusBar" |
  "scaleFinderDisplayMode" |
  "abcStradellaMode" |
  "abcTrebleChordSymbolsMode" |
  "abcHands" |
  "bassPatternChordVoicing" |
  "bassPatternTempoBpm" |
  "bassPatternLoopMode" |
  "bassPatternLoopCount" |
  "abcTempoBpm" |
  "soundSequenceTempoBpm" |
  "musicNotationIncludeTitle" |
  "musicNotationIncludeDescription" |
  "musicNotationIncludeSummary" |
  "musicNotationUseBarsPerLine" |
  "musicNotationBarsPerLine" |
  "musicNotationChordFontSize" |
  "musicNotationScale" |
  "musicNotationStaffWidth" |
  "musicNotationStaffSeparator" |
  "buttonSize" |
  "trebleAngle" |
  "buttonStrokeWidth" |
  "referenceStrokeWidth" |
  "chordFillStrength" |
  "accidentalStyle" |
  "labelFontSize" |
  "titleFont" |
  "titleSize" |
  "labelFont" |
  "sequenceDisplayMode" |
  "sequenceColorPreset" |
  "sequenceThickness" |
  "sequenceArrowheadSize" |
  "sequenceNumberFontSize" |
  "sequenceNumberColorPreset" |
  "sequenceNumberPosition" |
  "fingeringPosition" |
  "scaleFinderRoot" |
  "scaleFinderPattern" |
  "scaleFinderRowLimit" |
  "chordFinderRoot" |
  "chordFinderPattern" |
  "chordFinderInversion" |
  "chordFinderOctave" |
  "bassPatternRoot" |
  "annotationBold" |
  "annotationItalic" |
  "annotationOffsetPercent" |
  "annotationButtonAnchor" |
  "soundVolume" |
  "soundSource" |
  "laMelodiosaTrebleRegister" |
  "laMelodiosaBassRegister" |
  "laMelodiosaFollowStradellaRegisters" |
  "soundVoicePreset" |
  "soundWaveform" |
  "soundMusetteDetuneCents" |
  "soundAttackMs" |
  "soundReleaseMs" |
  "soundNoteDurationMs" |
  "soundArticulation" |
  "harmonyShowEnharmonics" |
  "harmonyShowSeparators" |
  "harmonyShowLegend" |
  "harmonyShowExplanation" |
  "harmonyShowToneTooltips" |
  "harmonyShowNoteRing" |
  "harmonyColorByFamily" |
  "harmonyDiameter" |
  "harmonyFontSize" |
  "harmonyPlaybackStyle" |
  "harmonyVoicingStyle"
>> & {
  languagePreference: NonNullable<DefaultSettingsFile["language"]>;
  showStradellaVoicingIntervals: NonNullable<DefaultSettingsFile["stradellaShowNominalNoteSpacing"]>;
  bassPatternBarsPerChord: NonNullable<DefaultSettingsFile["bassPatternRepeatsPerChord"]>;
  spacing: NonNullable<DefaultSettingsFile["buttonSpacing"]>;
  textNoteFontSize: NonNullable<DefaultSettingsFile["annotationTextSize"]>;
  textNoteColor: NonNullable<DefaultSettingsFile["annotationTextColor"]>;
  textNoteFont: NonNullable<DefaultSettingsFile["annotationFont"]>;
  harmonyRingVisibility: Record<number, boolean>;
  harmonyProgressionHandMovementWeight: NonNullable<DefaultSettingsFile["progressionHandMovementWeight"]>;
  harmonyProgressionRhythmPattern: NonNullable<DefaultSettingsFile["progressionRhythmPattern"]>;
  harmonyProgressionRootPosition: NonNullable<DefaultSettingsFile["progressionRootPosition"]>;
};

/** Retains historical JSON ordering, alias names and normalization. */
export function collectCurrentSettings(snapshot: SettingsExportSnapshot): DefaultSettingsFile {
  const {
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
  } = snapshot;
    return {
      settingsVersion: SETTINGS_VERSION,
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
      downloadFormat,
      soundEnabled,
      stradellaBassVoicing,
      stradellaBassRegisterOctave,
      stradellaBassRegisterGrouping,
      stradellaChordRegisterOctave,
      stradellaChordRegisterGrouping,
      stradellaChordFinderMarkRootBass,
      stradellaRequestedBassOnBassButton,
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
      abcHands,
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
      soundArticulation,
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
      progressionHandMovementWeight: harmonyProgressionHandMovementWeight,
      progressionRhythmPattern: harmonyProgressionRhythmPattern,
      progressionRootPosition: harmonyProgressionRootPosition,
    };
}
