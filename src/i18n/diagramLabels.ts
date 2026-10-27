import { translate, type InterfaceLanguage } from "./catalog";
import { familyName, scaleName } from "./musicTerms";
import type { ChordFamilyId, RelatedFamilyId, ScaleId } from "../tools/harmonyExplorer/music";
import type { NotationMode, PianoTrebleRange, TrebleLayout } from "../types";

/** Presentation only: never use these translations for stored music data or download filenames. */
export function notationStatusLabel(mode: NotationMode, language: InterfaceLanguage): string {
  const key = {
    english: "status.englishNotation",
    german: "status.germanNotation",
    solfege: "status.solfegeNotation",
    intervals: "status.intervalNotation",
    blank: "status.blankNotation",
  } as const;
  return translate(language, key[mode]);
}

export function trebleLayoutStatusLabel(layout: TrebleLayout, language: InterfaceLanguage): string {
  if (layout === "c-system") return translate(language, "status.cSystem");
  if (layout === "b-system") return translate(language, "status.bSystem");
  return translate(language, "status.piano");
}

export function pianoRangeStatusLabel(range: PianoTrebleRange, language: InterfaceLanguage): string {
  const key = {
    "two-octave": "status.pianoTwoOctaves",
    "three-octave": "status.pianoThreeOctaves",
    "four-octave": "status.pianoFourOctaves",
  } as const;
  return translate(language, key[range]);
}

/** Mirrors the legacy automatic English title, but translates the *visible* SVG title. */
export function diagramAutoTitle(
  side: "stradella" | "treble",
  basses: string | number,
  trebleLayout: TrebleLayout,
  language: InterfaceLanguage,
): string {
  if (side === "stradella") return language === "en"
    ? `${basses}-Bass Stradella`
    : translate(language, "status.stradellaDiagramTitle", { count: basses });
  if (trebleLayout === "piano") return translate(language, "status.pianoTrebleTitle");
  return translate(language, "status.chromaticTrebleTitle", {
    system: trebleLayout === "c-system" ? translate(language, "status.cSystem") : translate(language, "status.bSystem"),
  });
}

export type AccordionStatusOptions = {
  side: "stradella" | "treble";
  basses: string | number;
  trebleLayout: TrebleLayout;
  pianoRange: PianoTrebleRange;
  trebleRows: number;
  notation: NotationMode;
  soundEnabled: boolean;
  activeTool: string;
  language: InterfaceLanguage;
};

export function accordionStatusText(options: AccordionStatusOptions): string {
  const { side, basses, trebleLayout, pianoRange, trebleRows, notation, soundEnabled, activeTool, language } = options;
  const sound = `${translate(language, "status.sound")} ${translate(language, soundEnabled ? "status.soundOn" : "status.soundOff")}`;
  const notationName = notationStatusLabel(notation, language);
  if (side === "stradella") {
    return `Stradella · ${basses} ${translate(language, "status.bass")} · ${notationName} · ${sound} · ${activeTool}`;
  }
  const size = trebleLayout === "piano" ? pianoRangeStatusLabel(pianoRange, language)
    : `${trebleRows} ${translate(language, "status.rows")}`;
  return `${translate(language, "nav.treble")} · ${trebleLayoutStatusLabel(trebleLayout, language)} · ${size} · ${notationName} · ${sound} · ${activeTool}`;
}

/** The same localized family label is used by the status bar and the SVG legend. */
export function harmonyRelatedDisplayName(
  familyId: RelatedFamilyId,
  englishName: string,
  language: InterfaceLanguage,
): string {
  return familyId === "all" ? translate(language, "ui.allDiatonicFamilies")
    : familyName(familyId, englishName, language);
}

export function harmonyStatusText(options: {
  referenceFamilyId: ChordFamilyId;
  referenceFamilyEnglishName: string;
  relatedFamilyId: RelatedFamilyId;
  relatedFamilyEnglishName: string;
  scaleId: ScaleId;
  scaleEnglishName: string;
  soundEnabled: boolean;
  language: InterfaceLanguage;
}): string {
  const { referenceFamilyId, referenceFamilyEnglishName, relatedFamilyId, relatedFamilyEnglishName, scaleId, scaleEnglishName, soundEnabled, language } = options;
  return `${translate(language, "nav.harmony")} · ${familyName(referenceFamilyId, referenceFamilyEnglishName, language)} → ${harmonyRelatedDisplayName(relatedFamilyId, relatedFamilyEnglishName, language)} · ${scaleName(scaleId, scaleEnglishName, language)} · ${translate(language, "status.sound")} ${translate(language, soundEnabled ? "status.soundOn" : "status.soundOff")}`;
}


export function harmonyLegendFamilyText(
  relatedName: string,
  language: InterfaceLanguage,
  diatonicOnly: boolean,
  allFamiliesMode: boolean,
): string {
  if (allFamiliesMode) return translate(language, "ui.diatonicAll");
  return diatonicOnly
    ? translate(language, "ui.diatonicFamily", { family: relatedName.toLowerCase() })
    : relatedName.toLowerCase();
}
