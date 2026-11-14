/** Which state owner holds each exported setting.
 *
 * A settings file, the saved session and an import all go through the
 * functions in `settingsController.ts`; they need one value and one setter per
 * key. Each owner (a platform provider today, a tool provider later) supplies
 * the keys assigned to it here through `useOwnedSettings()`, and the compiler
 * checks the assignment both ways: every exported key has exactly one owner,
 * and an owner must supply exactly its keys and their setters.
 *
 * To add a setting: add it to the schema and `SettingsExportSnapshot`, give it
 * an owner below, and return the value and its `set…` setter from that
 * owner's hook. See docs/internal/settings-file-reference.md. */
import type { SettingsExportSnapshot, SettingsSetters } from "./settingsController";

export type SettingsOwnerId =
  | "language"
  | "instrument"
  | "appearance"
  | "spelling"
  | "sound"
  | "notation"
  | "shell"
  | "scaleFinder"
  | "trebleChordFinder"
  | "stradellaChordFinder"
  | "annotateDiagram"
  | "abcPlayer"
  | "bassPatternPlayer"
  | "harmonyExplorer"
  | "progressionAssistant";

export const SETTINGS_OWNERS = {
  // language
  languagePreference: "language",
  // instrument
  basses: "instrument",
  pianoTrebleRange: "instrument",
  showTrebleOctaves: "instrument",
  side: "instrument",
  stradellaBassRegisterGrouping: "instrument",
  stradellaBassRegisterOctave: "instrument",
  stradellaChordRegisterGrouping: "instrument",
  stradellaChordRegisterOctave: "instrument",
  trebleLayout: "instrument",
  trebleRows: "instrument",
  trebleSize: "instrument",
  // appearance
  accidentalStyle: "appearance",
  buttonSize: "appearance",
  buttonStrokeWidth: "appearance",
  chordFillStrength: "appearance",
  colorTheme: "appearance",
  customTitle: "appearance",
  diagramScale: "appearance",
  diagramVerticalSpacing: "appearance",
  labelFont: "appearance",
  labelFontSize: "appearance",
  pianoBlackKeyHeightScale: "appearance",
  pianoBlackKeyWidthScale: "appearance",
  pianoKeyHeightScale: "appearance",
  pianoKeyWidthScale: "appearance",
  referenceStrokeWidth: "appearance",
  showBellowsGuide: "appearance",
  showButtonLabels: "appearance",
  showStatusBar: "appearance",
  showStradellaRowLabels: "appearance",
  spacing: "appearance",
  titleFont: "appearance",
  titleMode: "appearance",
  titleSize: "appearance",
  trebleAngle: "appearance",
  // spelling
  accidental: "spelling",
  chordDisplayStyle: "spelling",
  chordLabelMode: "spelling",
  notation: "spelling",
  // sound
  laMelodiosaBassRegister: "sound",
  laMelodiosaFollowStradellaRegisters: "sound",
  laMelodiosaTrebleRegister: "sound",
  soundArticulation: "sound",
  countIn: "sound",
  metronome: "sound",
  soundAttackMs: "sound",
  soundEnabled: "sound",
  soundMusetteDetuneCents: "sound",
  soundNoteDurationMs: "sound",
  soundReleaseMs: "sound",
  soundSequenceTempoBpm: "sound",
  soundSource: "sound",
  soundVoicePreset: "sound",

  soundVolume: "sound",
  soundWaveform: "sound",
  stradellaBassVoicing: "sound",
  // notation
  musicNotationBarsPerLine: "notation",
  musicNotationChordFontSize: "notation",
  musicNotationIncludeDescription: "notation",
  musicNotationIncludeSummary: "notation",
  musicNotationIncludeTitle: "notation",
  musicNotationNoteNamesInNoteheads: "notation",
  musicNotationPlacement: "notation",
  musicNotationScale: "notation",
  musicNotationStaffSeparator: "notation",
  musicNotationStaffWidth: "notation",
  musicNotationUseBarsPerLine: "notation",
  stradellaChordQualityLabels: "notation",
  stradellaMarkCounterbass: "notation",
  stradellaNotationMode: "notation",
  // shell
  downloadFormat: "shell",
  interfaceDensity: "shell",
  interfaceTheme: "shell",
  // scaleFinder
  scaleFinderDisplayMode: "scaleFinder",
  scaleFinderPattern: "scaleFinder",
  scaleFinderRoot: "scaleFinder",
  scaleFinderRowLimit: "scaleFinder",
  // trebleChordFinder
  chordFinderInversion: "trebleChordFinder",
  chordFinderOctave: "trebleChordFinder",
  chordFinderPattern: "trebleChordFinder",
  chordFinderRoot: "trebleChordFinder",
  // stradellaChordFinder
  showStradellaVoicingIntervals: "stradellaChordFinder",
  stradellaChordFinderMarkRootBass: "stradellaChordFinder",
  stradellaChordFinderMode: "stradellaChordFinder",
  stradellaMinimumNominalGap: "stradellaChordFinder",
  stradellaNoteLevels: "stradellaChordFinder",
  stradellaRequestedBassOnBassButton: "stradellaChordFinder",
  // annotateDiagram
  annotationBold: "annotateDiagram",
  annotationButtonAnchor: "annotateDiagram",
  annotationItalic: "annotateDiagram",
  annotationOffsetPercent: "annotateDiagram",
  fingeringPosition: "annotateDiagram",
  sequenceArrowheadSize: "annotateDiagram",
  sequenceColorPreset: "annotateDiagram",
  sequenceDisplayMode: "annotateDiagram",
  sequenceNumberColorPreset: "annotateDiagram",
  sequenceNumberFontSize: "annotateDiagram",
  sequenceNumberPosition: "annotateDiagram",
  sequenceThickness: "annotateDiagram",
  textNoteColor: "annotateDiagram",
  textNoteFont: "annotateDiagram",
  textNoteFontSize: "annotateDiagram",
  // abcPlayer
  abcHands: "abcPlayer",
  abcStradellaMode: "abcPlayer",
  abcTempoBpm: "abcPlayer",
  abcTrebleChordSymbolsMode: "abcPlayer",
  // bassPatternPlayer
  bassPatternBarsPerChord: "bassPatternPlayer",
  bassPatternChordVoicing: "bassPatternPlayer",
  bassPatternLoopCount: "bassPatternPlayer",
  bassPatternLoopMode: "bassPatternPlayer",
  bassPatternRoot: "bassPatternPlayer",
  bassPatternTempoBpm: "bassPatternPlayer",
  // harmonyExplorer
  harmonyColorByFamily: "harmonyExplorer",
  harmonyDiameter: "harmonyExplorer",
  harmonyFontSize: "harmonyExplorer",
  harmonyPlaybackStyle: "harmonyExplorer",
  harmonyRingVisibility: "harmonyExplorer",
  harmonyShowEnharmonics: "harmonyExplorer",
  harmonyShowExplanation: "harmonyExplorer",
  harmonyShowLegend: "harmonyExplorer",
  harmonyShowNoteRing: "harmonyExplorer",
  harmonyShowSeparators: "harmonyExplorer",
  harmonyShowToneTooltips: "harmonyExplorer",
  harmonyVoicingStyle: "harmonyExplorer",
  // progressionAssistant
  harmonyProgressionHandMovementWeight: "progressionAssistant",
  harmonyProgressionRhythmPattern: "progressionAssistant",
  harmonyProgressionRootPosition: "progressionAssistant",
} as const satisfies Record<keyof SettingsExportSnapshot, SettingsOwnerId>;

export type SettingsKey = keyof typeof SETTINGS_OWNERS;

/** The exported keys an owner supplies. */
export type OwnedKey<O extends SettingsOwnerId> = {
  [K in SettingsKey]: (typeof SETTINGS_OWNERS)[K] extends O ? K : never;
}[SettingsKey];

/** `soundVolume` is set by `setSoundVolume`, and so on for every key. */
export type SetterName<K extends string> = `set${Capitalize<K>}`;

/** The setters an owner supplies. The language owner also supplies
 * `changeLanguage`, which stores the choice for the next visit. */
export type OwnedSetter<O extends SettingsOwnerId> =
  SetterName<OwnedKey<O>> | (O extends "language" ? "changeLanguage" : never);

/** What an owner hands over: its values and its setters, by name. */
export type OwnedSettings<O extends SettingsOwnerId> = Pick<SettingsExportSnapshot, OwnedKey<O>> &
  Pick<SettingsSetters, OwnedSetter<O>>;

// Every setter the settings controller calls belongs to some owner.
type UnownedSetter = Exclude<keyof SettingsSetters, OwnedSetter<SettingsOwnerId>>;
const everySetterIsOwned: [UnownedSetter] extends [never] ? true : UnownedSetter = true;
void everySetterIsOwned;

export const SETTINGS_OWNER_IDS: readonly SettingsOwnerId[] = [
  ...new Set(Object.values(SETTINGS_OWNERS)),
];

export function ownedKeys<O extends SettingsOwnerId>(owner: O): OwnedKey<O>[] {
  return (Object.keys(SETTINGS_OWNERS) as SettingsKey[]).filter(
    (key) => SETTINGS_OWNERS[key] === owner,
  ) as OwnedKey<O>[];
}

export function setterName<K extends string>(key: K): SetterName<K> {
  return `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as SetterName<K>;
}
