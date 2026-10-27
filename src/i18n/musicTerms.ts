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

const HARMONY_FAMILIES_FR: Record<ChordFamilyId, string> = {
  major: "triade majeure", minor: "triade mineure", diminished: "triade diminuée", augmented: "triade augmentée",
  sus2: "seconde suspendue", sus4: "quarte suspendue", sixth: "sixte majeure", minor6: "sixte mineure",
  dominant7: "septième de dominante", major7: "septième majeure", minor7: "septième mineure",
  minorMajor7: "septième majeure avec tierce mineure", halfDiminished7: "septième demi-diminuée",
  diminished7: "septième diminuée", augmented7: "septième de dominante augmentée",
  augmentedMajor7: "septième majeure augmentée",
};
const SCALES_FR: Record<ScaleId, string> = {
  ionian: "ionien (majeur)", dorian: "dorien", phrygian: "phrygien", lydian: "lydien",
  mixolydian: "mixolydien", aeolian: "éolien (mineur naturel)", locrian: "locrien",
  harmonicMinor: "mineur harmonique", melodicMinor: "mineur mélodique (ascendant)",
  harmonicMajor: "majeur harmonique", majorPentatonic: "pentatonique majeure",
  minorPentatonic: "pentatonique mineure", wholeTone: "gamme par tons",
};
const ROLES_FR: Record<string, string> = {
  root: "fondamentale", "suspended second": "seconde suspendue", third: "tierce", fourth: "quarte",
  "altered fifth": "quinte altérée", fifth: "quinte", "sixth/seventh": "sixte/septième",
  seventh: "septième", "flat ninth": "neuvième bémol", ninth: "neuvième", "sharp ninth": "neuvième dièse",
  eleventh: "onzième", "sharp eleventh": "onzième dièse", thirteenth: "treizième",
  "chord tone": "note de l’accord", "diminished seventh": "septième diminuée", sixth: "sixte",
};
const STRADELLA_DIAGRAM_ROWS_FR: Record<string, string> = {
  "bass-counterbass": "Contrebasse", "bass-root": "Basse", "chord-major": "Majeur",
  "chord-minor": "Mineur", "chord-dominant7": "7e dominante", "chord-diminished7": "7e diminuée",
};

const HARMONY_FAMILIES_PT: Record<ChordFamilyId, string> = {
  major: "tríade maior", minor: "tríade menor", diminished: "tríade diminuta", augmented: "tríade aumentada",
  sus2: "segunda suspensa", sus4: "quarta suspensa", sixth: "sexta maior", minor6: "sexta menor",
  dominant7: "sétima da dominante", major7: "sétima maior", minor7: "sétima menor",
  minorMajor7: "sétima maior com terça menor", halfDiminished7: "sétima meio-diminuta",
  diminished7: "sétima diminuta", augmented7: "sétima da dominante aumentada",
  augmentedMajor7: "sétima maior aumentada",
};
const HARMONY_FAMILIES_IT: Record<ChordFamilyId, string> = {
  major: "triade maggiore", minor: "triade minore", diminished: "triade diminuita", augmented: "triade aumentata",
  sus2: "seconda sospesa", sus4: "quarta sospesa", sixth: "sesta maggiore", minor6: "sesta minore",
  dominant7: "settima di dominante", major7: "settima maggiore", minor7: "settima minore",
  minorMajor7: "settima maggiore con terza minore", halfDiminished7: "settima semidiminuita",
  diminished7: "settima diminuita", augmented7: "settima di dominante aumentata",
  augmentedMajor7: "settima maggiore aumentata",
};
const HARMONY_FAMILIES_DE: Record<ChordFamilyId, string> = {
  major: "Dur-Dreiklang", minor: "Moll-Dreiklang", diminished: "verminderter Dreiklang", augmented: "übermäßiger Dreiklang",
  sus2: "Sekundvorhalt", sus4: "Quartvorhalt", sixth: "große Sexte", minor6: "kleine Sexte",
  dominant7: "Dominantseptakkord", major7: "große Septime", minor7: "kleine Septime",
  minorMajor7: "große Septime mit kleiner Terz", halfDiminished7: "halbverminderter Septakkord",
  diminished7: "verminderter Septakkord", augmented7: "übermäßiger Dominantseptakkord",
  augmentedMajor7: "übermäßiger Durmaj7-Akkord",
};
const SCALES_PT: Record<ScaleId, string> = {
  ionian: "jônio (maior)", dorian: "dórico", phrygian: "frígio", lydian: "lídio",
  mixolydian: "mixolídio", aeolian: "eólio (menor natural)", locrian: "lócrio",
  harmonicMinor: "menor harmônica", melodicMinor: "menor melódica (ascendente)",
  harmonicMajor: "maior harmônica", majorPentatonic: "pentatônica maior",
  minorPentatonic: "pentatônica menor", wholeTone: "tons inteiros",
};
const SCALES_IT: Record<ScaleId, string> = {
  ionian: "ionico (maggiore)", dorian: "dorico", phrygian: "frigio", lydian: "lidio",
  mixolydian: "misolidio", aeolian: "eolio (minore naturale)", locrian: "locrio",
  harmonicMinor: "minore armonica", melodicMinor: "minore melodica (ascendente)",
  harmonicMajor: "maggiore armonica", majorPentatonic: "pentatonica maggiore",
  minorPentatonic: "pentatonica minore", wholeTone: "toni interi",
};
const SCALES_DE: Record<ScaleId, string> = {
  ionian: "ionisch (Dur)", dorian: "dorisch", phrygian: "phrygisch", lydian: "lydisch",
  mixolydian: "mixolydisch", aeolian: "äolisch (natürliches Moll)", locrian: "lokrisch",
  harmonicMinor: "harmonisch Moll", melodicMinor: "melodisch Moll (aufsteigend)",
  harmonicMajor: "harmonisch Dur", majorPentatonic: "Durpentatonik",
  minorPentatonic: "Mollpentatonik", wholeTone: "Ganztonleiter",
};
const ROLES_PT: Record<string, string> = {
  root: "fundamental", "suspended second": "segunda suspensa", third: "terça", fourth: "quarta",
  "altered fifth": "quinta alterada", fifth: "quinta", "sixth/seventh": "sexta/sétima",
  seventh: "sétima", "flat ninth": "nona bemol", ninth: "nona", "sharp ninth": "nona sustenida",
  eleventh: "décima primeira", "sharp eleventh": "décima primeira sustenida", thirteenth: "décima terceira",
  "chord tone": "nota do acorde", "diminished seventh": "sétima diminuta", sixth: "sexta",
};
const ROLES_IT: Record<string, string> = {
  root: "fondamentale", "suspended second": "seconda sospesa", third: "terza", fourth: "quarta",
  "altered fifth": "quinta alterata", fifth: "quinta", "sixth/seventh": "sesta/settima",
  seventh: "settima", "flat ninth": "nona bemolle", ninth: "nona", "sharp ninth": "nona diesis",
  eleventh: "undicesima", "sharp eleventh": "undicesima diesis", thirteenth: "tredicesima",
  "chord tone": "nota dell’accordo", "diminished seventh": "settima diminuita", sixth: "sesta",
};
const ROLES_DE: Record<string, string> = {
  root: "Grundton", "suspended second": "Sekundvorhalt", third: "Terz", fourth: "Quarte",
  "altered fifth": "alterierte Quinte", fifth: "Quinte", "sixth/seventh": "Sexte/Septime",
  seventh: "Septime", "flat ninth": "kleine None", ninth: "None", "sharp ninth": "übermäßige None",
  eleventh: "Undezime", "sharp eleventh": "übermäßige Undezime", thirteenth: "Tredezime",
  "chord tone": "Akkordton", "diminished seventh": "verminderte Septime", sixth: "Sexte",
};
const STRADELLA_DIAGRAM_ROWS_PT: Record<string, string> = {
  "bass-counterbass": "Contrabaixo", "bass-root": "Baixo", "chord-major": "Maior",
  "chord-minor": "Menor", "chord-dominant7": "7ª dominante", "chord-diminished7": "7ª diminuta",
};
const STRADELLA_DIAGRAM_ROWS_IT: Record<string, string> = {
  "bass-counterbass": "Controbasso", "bass-root": "Basso", "chord-major": "Maggiore",
  "chord-minor": "Minore", "chord-dominant7": "7ª dominante", "chord-diminished7": "7ª diminuita",
};
const STRADELLA_DIAGRAM_ROWS_DE: Record<string, string> = {
  "bass-counterbass": "Gegenbass", "bass-root": "Bass", "chord-major": "Dur",
  "chord-minor": "Moll", "chord-dominant7": "Dom. 7", "chord-diminished7": "Verm. 7",
};

const FAMILY_NAMES: Partial<Record<InterfaceLanguage, Record<ChordFamilyId, string>>> = {
  es: HARMONY_FAMILIES_ES, fr: HARMONY_FAMILIES_FR, pt: HARMONY_FAMILIES_PT,
  it: HARMONY_FAMILIES_IT, de: HARMONY_FAMILIES_DE,
};
const SCALE_NAMES: Partial<Record<InterfaceLanguage, Record<ScaleId, string>>> = {
  es: SCALES_ES, fr: SCALES_FR, pt: SCALES_PT, it: SCALES_IT, de: SCALES_DE,
};
const CHORD_ROLES: Partial<Record<InterfaceLanguage, Record<string, string>>> = {
  es: ROLES_ES, fr: ROLES_FR, pt: ROLES_PT, it: ROLES_IT, de: ROLES_DE,
};
const STRADELLA_ROW_NAMES: Partial<Record<InterfaceLanguage, Record<string, string>>> = {
  es: STRADELLA_DIAGRAM_ROWS_ES, fr: STRADELLA_DIAGRAM_ROWS_FR,
  pt: STRADELLA_DIAGRAM_ROWS_PT, it: STRADELLA_DIAGRAM_ROWS_IT, de: STRADELLA_DIAGRAM_ROWS_DE,
};

export function stradellaDiagramRowLabel(kind: string, english: string, language: InterfaceLanguage): string {
  return STRADELLA_ROW_NAMES[language]?.[kind] ?? english;
}
export function familyName(id: ChordFamilyId, english: string, language: InterfaceLanguage): string {
  return FAMILY_NAMES[language]?.[id] ?? english;
}
export function scaleName(id: ScaleId, english: string, language: InterfaceLanguage): string {
  return SCALE_NAMES[language]?.[id] ?? english;
}
export function chordRole(english: string, language: InterfaceLanguage): string {
  return CHORD_ROLES[language]?.[english] ?? english;
}

/** Names for actual Stradella button functions (not chord symbols). */
export function stradellaButtonFunction(kind: string, language: InterfaceLanguage): string {
  const names: Partial<Record<InterfaceLanguage, Record<string, string>>> = {
    en: { major: "major", minor: "minor", dominant7: "dominant seventh", diminished7: "diminished", "7": "7", dim: "dim" },
    es: { major: "mayor", minor: "menor", dominant7: "séptima dominante", diminished7: "disminuido", "7": "séptima dominante", dim: "disminuido" },
    fr: { major: "majeur", minor: "mineur", dominant7: "septième de dominante", diminished7: "diminué", "7": "septième de dominante", dim: "diminué" },
    pt: { major: "maior", minor: "menor", dominant7: "sétima da dominante", diminished7: "diminuto", "7": "sétima da dominante", dim: "diminuto" },
    it: { major: "maggiore", minor: "minore", dominant7: "settima di dominante", diminished7: "diminuito", "7": "settima di dominante", dim: "diminuito" },
    de: { major: "Dur", minor: "Moll", dominant7: "Dominantseptakkord", diminished7: "vermindert", "7": "Dominantseptakkord", dim: "vermindert" },
  };
  return names[language]?.[kind] ?? kind;
}
