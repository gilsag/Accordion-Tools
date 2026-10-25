/** User-facing translations of bundled example names. Their IDs, content and
 * user-defined titles are never translated or modified. */
import type { InterfaceLanguage } from "./catalog";

type LocalizedName = readonly [english: string, spanish: string];

const BUILTIN_PROGRESSION_NAMES: Record<string, LocalizedName> = {
  "i-iv-v-i": ["I–IV–V–I progression", "Progresión I–IV–V–I"],
  "i-iv-v-v": ["I–IV–V–V progression", "Progresión I–IV–V–V"],
  "i-i-iv-v": ["I–I–IV–V progression", "Progresión I–I–IV–V"],
  "i-iv-i-v": ["I–IV–I–V progression", "Progresión I–IV–I–V"],
  "i-iv-v-iv": ["I–IV–V–IV progression", "Progresión I–IV–V–IV"],
  "fifties": ["50s progression", "Progresión de los años 50"],
  "iv-v-i-vi": ["IV–V–I–vi progression", "Progresión IV–V–I–vi"],
  "pop-rock": ["Pop-rock progression", "Progresión pop-rock"],
  "i-iv-bvii-iv": ["I–IV–♭VII–IV progression", "Progresión I–IV–♭VII–IV"],
  "ii-v-i": ["ii–V–I progression", "Progresión ii–V–I"],
  "andalusian-cadence": ["Andalusian cadence", "Cadencia andaluza"],
  "backdoor": ["Backdoor progression", "Progresión backdoor"],
  "bird-blues": ["Bird Blues progression", "Blues de Bird"],
  "circle": ["Circle progression", "Progresión por círculo de quintas"],
  "coltrane-changes": ["Coltrane changes", "Cambios de Coltrane"],
  "eight-bar-blues": ["Eight-bar blues", "Blues de ocho compases"],
  "folia": ["Folia", "Folía"],
  "montgomery-ward-bridge": ["Montgomery-Ward bridge", "Puente Montgomery-Ward"],
  "pachelbel": ["Pachelbel's Canon", "Canon de Pachelbel"],
  "passamezzo-antico": ["Passamezzo antico", "Passamezzo antico"],
  "passamezzo-moderno": ["Passamezzo moderno", "Passamezzo moderno"],
  "ragtime": ["Ragtime progression", "Progresión ragtime"],
  "rhythm-changes": ["Rhythm changes", "Cambios de rhythm"],
  "romanesca": ["Romanesca", "Romanesca"],
  "royal-road": ["Royal Road progression", "Progresión Royal Road"],
  "sears-roebuck-bridge": ["Sears Roebuck bridge", "Puente Sears Roebuck"],
  "sixteen-bar-blues": ["Sixteen-bar blues", "Blues de dieciséis compases"],
  "stomp": ["Stomp progression", "Progresión stomp"],
  "twelve-bar-blues": ["Twelve-bar blues", "Blues de doce compases"],
};

const BUILTIN_PATTERN_NAMES: Record<string, LocalizedName> = {
  "progression-essence": ["Root+Chord", "Fundamental + acorde"],
  "oom-pah-pah": ["Waltz", "Vals"],
  "mazurca": ["Mazurca", "Mazurca"],
  "waltz-alternate-bass": ["Alternate-bass waltz", "Vals con bajo alternado"],
  "polka": ["Polka", "Polca"],
  "alternate-bass-polka": ["Alternate bass polka", "Polca con bajo alternado"],
  "tarantella": ["Tarantella", "Tarantela"],
  "bo-diddley": ["Bo Diddley beat", "Ritmo de Bo Diddley"],
  "son-clave-3-2": ["Son clave 3-2", "Clave de son 3-2"],
  "son-clave-2-3": ["Son clave 2-3", "Clave de son 2-3"],
  "rumba-clave-3-2": ["Rumba clave 3-2", "Clave de rumba 3-2"],
  "rumba-clave-2-3": ["Rumba clave 2-3", "Clave de rumba 2-3"],
  "tango-habanera": ["Tango / habanera", "Tango / habanera"],
  "nuevo-tango": ["Nuevo Tango 3-3-2", "Tango nuevo 3-3-2"],
  "traditional-tango": ["Traditional Tango", "Tango tradicional"],
  "bolero": ["Bolero", "Bolero"],
  "bass-chord-together": ["Bass + chord together", "Bajo y acorde juntos"],
  "rumba-accordion": ["Rumba", "Rumba"],
  "ska-skank": ["Ska Skank", "Ska skank"],
  "shuffle": ["Shuffle", "Shuffle"],
  "swing-three-to-one": ["Swing 3:1", "Swing 3:1"],
  "scotch-snap": ["Scotch snap / Lombard rhythm", "Ritmo lombardo"],
  "bossa-nova": ["Bossa nova", "Bossa nova"],
  "standard-african-bell": ["Standard African bell pattern", "Patrón de campana africana"],
  "charleston": ["Charleston", "Charleston"],
  "barbara-ann": ["Barbara Ann-style rhythm", "Ritmo al estilo Barbara Ann"],
  "gallop": ["Gallop", "Galope"],
};

const BUNDLED_ABC_EXAMPLES: Record<string, LocalizedName> = {
  "c-major-scale": ["C major scale", "Escala de C mayor"],
  "happy-birthday": ["Happy Birthday", "Cumpleaños feliz"],
  "twinkle-little-star": ["Twinkle Little Star", "Estrellita"],
  "dyads-and-chords": ["Dyads and chords", "Díadas y acordes"],
  "stradella-chord-symbols": ["Stradella chord symbols", "Símbolos de acordes Stradella"],
};

function localizeBuiltIn(id: string, originalLabel: string, language: InterfaceLanguage, names: Record<string, LocalizedName>): string {
  if (language !== "es") return originalLabel;
  const entry = names[id];
  // Imported/custom names remain as authored, even if they reuse a bundled ID.
  return entry && originalLabel === entry[0] ? entry[1] : originalLabel;
}

export function progressionName(id: string, name: string, language: InterfaceLanguage): string {
  return localizeBuiltIn(id, name, language, BUILTIN_PROGRESSION_NAMES);
}
export function bassPatternName(id: string, name: string, language: InterfaceLanguage): string {
  return localizeBuiltIn(id, name, language, BUILTIN_PATTERN_NAMES);
}
export function abcExampleName(id: string, name: string, language: InterfaceLanguage): string {
  return localizeBuiltIn(id, name, language, BUNDLED_ABC_EXAMPLES);
}
