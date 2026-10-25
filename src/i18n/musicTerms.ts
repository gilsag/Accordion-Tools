import type { InterfaceLanguage } from "./catalog";
import type { ChordFamilyId, ScaleId } from "../tools/harmonyExplorer/music";

const HARMONY_FAMILIES_ES: Record<ChordFamilyId, string> = {
  major: "tríada mayor", minor: "tríada menor", diminished: "tríada disminuida", augmented: "tríada aumentada",
  sus2: "segunda suspendida", sus4: "cuarta suspendida", sixth: "sexta mayor", minor6: "sexta menor",
  dominant7: "séptima de dominante", major7: "séptima mayor", minor7: "séptima menor",
  minorMajor7: "séptima mayor con tercera menor", halfDiminished7: "séptima semidisminuida",
  diminished7: "séptima disminuida", augmented7: "séptima de dominante aumentada",
  augmentedMajor7: "séptima mayor aumentada",
};
const SCALES_ES: Record<ScaleId, string> = {
  ionian: "jónico (mayor)", dorian: "dórico", phrygian: "frigio", lydian: "lidio",
  mixolydian: "mixolidio", aeolian: "eólico (menor natural)", locrian: "locrio",
  harmonicMinor: "menor armónica", melodicMinor: "menor melódica (ascendente)",
  harmonicMajor: "mayor armónica", majorPentatonic: "pentatónica mayor",
  minorPentatonic: "pentatónica menor", wholeTone: "tonos enteros",
};
const ROLES_ES: Record<string, string> = {
  root: "fundamental", "suspended second": "segunda suspendida", third: "tercera", fourth: "cuarta",
  "altered fifth": "quinta alterada", fifth: "quinta", "sixth/seventh": "sexta/séptima",
  seventh: "séptima", "flat ninth": "novena bemol", ninth: "novena", "sharp ninth": "novena sostenida",
  eleventh: "oncena", "sharp eleventh": "oncena sostenida", thirteenth: "trecena",
  "chord tone": "nota del acorde",
};
/** Compact captions for Stradella rows drawn inside the SVG.
 * Keep the exported diagram coordinates and English captions unchanged. */
const STRADELLA_DIAGRAM_ROWS_ES: Record<string, string> = {
  "bass-counterbass": "Contrabajo",
  "bass-root": "Bajo",
  "chord-major": "Mayor",
  "chord-minor": "Menor",
  "chord-dominant7": "7.ª dominante",
  "chord-diminished7": "7.ª disminuida",
};
export function stradellaDiagramRowLabel(kind: string, english: string, language: InterfaceLanguage): string {
  return language === "es" ? (STRADELLA_DIAGRAM_ROWS_ES[kind] ?? english) : english;
}

export function familyName(id: ChordFamilyId, english: string, language: InterfaceLanguage): string {
  return language === "es" ? HARMONY_FAMILIES_ES[id] : english;
}
export function scaleName(id: ScaleId, english: string, language: InterfaceLanguage): string {
  return language === "es" ? SCALES_ES[id] : english;
}
export function chordRole(english: string, language: InterfaceLanguage): string {
  return language === "es" ? (ROLES_ES[english] ?? english) : english;
}
