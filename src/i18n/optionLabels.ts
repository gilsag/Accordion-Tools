/** User-facing translations of bundled example names. Their IDs, content and
 * user-defined titles are never translated or modified. */
import type { InterfaceLanguage } from "./catalog";

type LocalizedName = readonly [english: string, spanish: string, french: string];

const BUILTIN_PROGRESSION_NAMES: Record<string, LocalizedName> = {
  "i-iv-v-i": ["I–IV–V–I progression", "Progresión I–IV–V–I", "Progression I–IV–V–I"],
  "i-iv-v-v": ["I–IV–V–V progression", "Progresión I–IV–V–V", "Progression I–IV–V–V"],
  "i-i-iv-v": ["I–I–IV–V progression", "Progresión I–I–IV–V", "Progression I–I–IV–V"],
  "i-iv-i-v": ["I–IV–I–V progression", "Progresión I–IV–I–V", "Progression I–IV–I–V"],
  "i-iv-v-iv": ["I–IV–V–IV progression", "Progresión I–IV–V–IV", "Progression I–IV–V–IV"],
  "fifties": ["50s progression", "Progresión de los años 50", "Progression des années 1950"],
  "iv-v-i-vi": ["IV–V–I–vi progression", "Progresión IV–V–I–vi", "Progression IV–V–I–vi"],
  "pop-rock": ["Pop-rock progression", "Progresión pop-rock", "Progression pop-rock"],
  "i-iv-bvii-iv": ["I–IV–♭VII–IV progression", "Progresión I–IV–♭VII–IV", "Progression I–IV–♭VII–IV"],
  "ii-v-i": ["ii–V–I progression", "Progresión ii–V–I", "Progression ii–V–I"],
  "andalusian-cadence": ["Andalusian cadence", "Cadencia andaluza", "Cadence andalouse"],
  "backdoor": ["Backdoor progression", "Progresión backdoor", "Progression backdoor"],
  "bird-blues": ["Bird Blues progression", "Blues de Bird", "Blues de Bird"],
  "circle": ["Circle progression", "Progresión por círculo de quintas", "Progression du cercle des quintes"],
  "coltrane-changes": ["Coltrane changes", "Cambios de Coltrane", "Changements de Coltrane"],
  "eight-bar-blues": ["Eight-bar blues", "Blues de ocho compases", "Blues à huit mesures"],
  "folia": ["Folia", "Folía", "Folia"],
  "montgomery-ward-bridge": ["Montgomery-Ward bridge", "Puente Montgomery-Ward", "Pont Montgomery-Ward"],
  "pachelbel": ["Pachelbel's Canon", "Canon de Pachelbel", "Canon de Pachelbel"],
  "passamezzo-antico": ["Passamezzo antico", "Passamezzo antico", "Passamezzo antico"],
  "passamezzo-moderno": ["Passamezzo moderno", "Passamezzo moderno", "Passamezzo moderno"],
  "ragtime": ["Ragtime progression", "Progresión ragtime", "Progression ragtime"],
  "rhythm-changes": ["Rhythm changes", "Cambios de rhythm", "Rhythm changes"],
  "romanesca": ["Romanesca", "Romanesca", "Romanesca"],
  "royal-road": ["Royal Road progression", "Progresión Royal Road", "Progression Royal Road"],
  "sears-roebuck-bridge": ["Sears Roebuck bridge", "Puente Sears Roebuck", "Pont Sears Roebuck"],
  "sixteen-bar-blues": ["Sixteen-bar blues", "Blues de dieciséis compases", "Blues à seize mesures"],
  "stomp": ["Stomp progression", "Progresión stomp", "Progression stomp"],
  "twelve-bar-blues": ["Twelve-bar blues", "Blues de doce compases", "Blues à douze mesures"],
};

const BUILTIN_PATTERN_NAMES: Record<string, LocalizedName> = {
  "progression-essence": ["Root+Chord", "Fundamental + acorde", "Fondamentale et accord"],
  "oom-pah-pah": ["Waltz", "Vals", "Valse"],
  "mazurca": ["Mazurca", "Mazurca", "Mazurka"],
  "waltz-alternate-bass": ["Alternate-bass waltz", "Vals con bajo alternado", "Valse avec basse alternée"],
  "polka": ["Polka", "Polca", "Polka"],
  "alternate-bass-polka": ["Alternate bass polka", "Polca con bajo alternado", "Polka avec basse alternée"],
  "tarantella": ["Tarantella", "Tarantela", "Tarentelle"],
  "bo-diddley": ["Bo Diddley beat", "Ritmo de Bo Diddley", "Rythme Bo Diddley"],
  "son-clave-3-2": ["Son clave 3-2", "Clave de son 3-2", "Clave son 3-2"],
  "son-clave-2-3": ["Son clave 2-3", "Clave de son 2-3", "Clave son 2-3"],
  "rumba-clave-3-2": ["Rumba clave 3-2", "Clave de rumba 3-2", "Clave rumba 3-2"],
  "rumba-clave-2-3": ["Rumba clave 2-3", "Clave de rumba 2-3", "Clave rumba 2-3"],
  "tango-habanera": ["Tango / habanera", "Tango / habanera", "Tango / habanera"],
  "nuevo-tango": ["Nuevo Tango 3-3-2", "Tango nuevo 3-3-2", "Tango nuevo 3-3-2"],
  "traditional-tango": ["Traditional Tango", "Tango tradicional", "Tango traditionnel"],
  "bolero": ["Bolero", "Bolero", "Boléro"],
  "bass-chord-together": ["Bass + chord together", "Bajo y acorde juntos", "Basse et accord ensemble"],
  "rumba-accordion": ["Rumba", "Rumba", "Rumba"],
  "ska-skank": ["Ska Skank", "Ska skank", "Ska skank"],
  "shuffle": ["Shuffle", "Shuffle", "Shuffle"],
  "swing-three-to-one": ["Swing 3:1", "Swing 3:1", "Swing 3:1"],
  "scotch-snap": ["Scotch snap / Lombard rhythm", "Ritmo lombardo", "Rythme lombard"],
  "bossa-nova": ["Bossa nova", "Bossa nova", "Bossa nova"],
  "standard-african-bell": ["Standard African bell pattern", "Patrón de campana africana", "Motif de cloche africaine"],
  "charleston": ["Charleston", "Charleston", "Charleston"],
  "barbara-ann": ["Barbara Ann-style rhythm", "Ritmo al estilo Barbara Ann", "Rythme style Barbara Ann"],
  "gallop": ["Gallop", "Galope", "Galop"],
};

const BUNDLED_ABC_EXAMPLES: Record<string, LocalizedName> = {
  "c-major-scale": ["C major scale", "Escala de C mayor", "Gamme de do majeur"],
  "happy-birthday": ["Happy Birthday", "Cumpleaños feliz", "Joyeux anniversaire"],
  "twinkle-little-star": ["Twinkle Little Star", "Estrellita", "Ah ! vous dirai-je, maman"],
  "dyads-and-chords": ["Dyads and chords", "Díadas y acordes", "Dyades et accords"],
  "stradella-chord-symbols": ["Stradella chord symbols", "Símbolos de acordes Stradella", "Symboles d’accord Stradella"],
};

type AdditionalLanguage = "pt" | "it" | "de";
const ADDITIONAL_BUILTIN_NAMES: Record<string, Record<AdditionalLanguage, string>> = {
  "i-iv-v-i": { pt: "Progressão I–IV–V–I", it: "Progressione I–IV–V–I", de: "I–IV–V–I-Akkordfolge" },
  "i-iv-v-v": { pt: "Progressão I–IV–V–V", it: "Progressione I–IV–V–V", de: "I–IV–V–V-Akkordfolge" },
  "i-i-iv-v": { pt: "Progressão I–I–IV–V", it: "Progressione I–I–IV–V", de: "I–I–IV–V-Akkordfolge" },
  "i-iv-i-v": { pt: "Progressão I–IV–I–V", it: "Progressione I–IV–I–V", de: "I–IV–I–V-Akkordfolge" },
  "i-iv-v-iv": { pt: "Progressão I–IV–V–IV", it: "Progressione I–IV–V–IV", de: "I–IV–V–IV-Akkordfolge" },
  "fifties": { pt: "Progressão dos anos 1950", it: "Progressione anni ’50", de: "50er-Jahre-Akkordfolge" },
  "iv-v-i-vi": { pt: "Progressão IV–V–I–vi", it: "Progressione IV–V–I–vi", de: "IV–V–I–vi-Akkordfolge" },
  "pop-rock": { pt: "Progressão pop-rock", it: "Progressione pop-rock", de: "Pop-Rock-Akkordfolge" },
  "i-iv-bvii-iv": { pt: "Progressão I–IV–♭VII–IV", it: "Progressione I–IV–♭VII–IV", de: "I–IV–♭VII–IV-Akkordfolge" },
  "ii-v-i": { pt: "Progressão ii–V–I", it: "Progressione ii–V–I", de: "ii–V–I-Akkordfolge" },
  "andalusian-cadence": { pt: "Cadência andaluza", it: "Cadenza andalusa", de: "Andalusische Kadenz" },
  "backdoor": { pt: "Progressão backdoor", it: "Progressione backdoor", de: "Backdoor-Akkordfolge" },
  "bird-blues": { pt: "Blues de Bird", it: "Blues di Bird", de: "Bird Blues" },
  "circle": { pt: "Progressão pelo círculo de quintas", it: "Progressione per circolo delle quinte", de: "Quintenzirkel-Akkordfolge" },
  "coltrane-changes": { pt: "Mudanças de Coltrane", it: "Cambi di Coltrane", de: "Coltrane Changes" },
  "eight-bar-blues": { pt: "Blues de oito compassos", it: "Blues in otto battute", de: "Achttaktiger Blues" },
  "folia": { pt: "Folia", it: "Folia", de: "Folia" },
  "montgomery-ward-bridge": { pt: "Ponte Montgomery-Ward", it: "Ponte Montgomery-Ward", de: "Montgomery-Ward-Bridge" },
  "pachelbel": { pt: "Cânone de Pachelbel", it: "Canone di Pachelbel", de: "Pachelbel-Kanon" },
  "passamezzo-antico": { pt: "Passamezzo antico", it: "Passamezzo antico", de: "Passamezzo antico" },
  "passamezzo-moderno": { pt: "Passamezzo moderno", it: "Passamezzo moderno", de: "Passamezzo moderno" },
  "ragtime": { pt: "Progressão ragtime", it: "Progressione ragtime", de: "Ragtime-Akkordfolge" },
  "rhythm-changes": { pt: "Rhythm changes", it: "Rhythm changes", de: "Rhythm Changes" },
  "romanesca": { pt: "Romanesca", it: "Romanesca", de: "Romanesca" },
  "royal-road": { pt: "Progressão Royal Road", it: "Progressione Royal Road", de: "Royal-Road-Akkordfolge" },
  "sears-roebuck-bridge": { pt: "Ponte Sears Roebuck", it: "Ponte Sears Roebuck", de: "Sears-Roebuck-Bridge" },
  "sixteen-bar-blues": { pt: "Blues de dezesseis compassos", it: "Blues in sedici battute", de: "Sechzehntaktiger Blues" },
  "stomp": { pt: "Progressão stomp", it: "Progressione stomp", de: "Stomp-Akkordfolge" },
  "twelve-bar-blues": { pt: "Blues de doze compassos", it: "Blues in dodici battute", de: "Zwölftaktiger Blues" },
  "progression-essence": { pt: "Fundamental + acorde", it: "Fondamentale + accordo", de: "Grundton + Akkord" },
  "oom-pah-pah": { pt: "Valsa", it: "Valzer", de: "Walzer" },
  "mazurca": { pt: "Mazurca", it: "Mazurca", de: "Mazurka" },
  "waltz-alternate-bass": { pt: "Valsa com baixo alternado", it: "Valzer con basso alternato", de: "Walzer mit Wechselbass" },
  "polka": { pt: "Polca", it: "Polka", de: "Polka" },
  "alternate-bass-polka": { pt: "Polca com baixo alternado", it: "Polka con basso alternato", de: "Polka mit Wechselbass" },
  "tarantella": { pt: "Tarantela", it: "Tarantella", de: "Tarantella" },
  "bo-diddley": { pt: "Ritmo Bo Diddley", it: "Ritmo Bo Diddley", de: "Bo-Diddley-Rhythmus" },
  "son-clave-3-2": { pt: "Clave de son 3-2", it: "Clave son 3-2", de: "Son-Clave 3-2" },
  "son-clave-2-3": { pt: "Clave de son 2-3", it: "Clave son 2-3", de: "Son-Clave 2-3" },
  "rumba-clave-3-2": { pt: "Clave de rumba 3-2", it: "Clave rumba 3-2", de: "Rumba-Clave 3-2" },
  "rumba-clave-2-3": { pt: "Clave de rumba 2-3", it: "Clave rumba 2-3", de: "Rumba-Clave 2-3" },
  "tango-habanera": { pt: "Tango / habanera", it: "Tango / habanera", de: "Tango / Habanera" },
  "nuevo-tango": { pt: "Tango nuevo 3-3-2", it: "Tango nuevo 3-3-2", de: "Nuevo Tango 3-3-2" },
  "traditional-tango": { pt: "Tango tradicional", it: "Tango tradizionale", de: "Traditioneller Tango" },
  "bolero": { pt: "Bolero", it: "Bolero", de: "Bolero" },
  "bass-chord-together": { pt: "Baixo + acorde juntos", it: "Basso + accordo insieme", de: "Bass + Akkord gleichzeitig" },
  "rumba-accordion": { pt: "Rumba", it: "Rumba", de: "Rumba" },
  "ska-skank": { pt: "Ska skank", it: "Ska skank", de: "Ska-Skank" },
  "shuffle": { pt: "Shuffle", it: "Shuffle", de: "Shuffle" },
  "swing-three-to-one": { pt: "Swing 3:1", it: "Swing 3:1", de: "Swing 3:1" },
  "scotch-snap": { pt: "Ritmo lombardo", it: "Ritmo lombardo", de: "Lombardischer Rhythmus" },
  "bossa-nova": { pt: "Bossa nova", it: "Bossa nova", de: "Bossa Nova" },
  "standard-african-bell": { pt: "Padrão de sino africano", it: "Schema di campana africana", de: "Afrikanisches Glockenmuster" },
  "charleston": { pt: "Charleston", it: "Charleston", de: "Charleston" },
  "barbara-ann": { pt: "Ritmo ao estilo Barbara Ann", it: "Ritmo in stile Barbara Ann", de: "Rhythmus im Barbara-Ann-Stil" },
  "gallop": { pt: "Galope", it: "Galoppo", de: "Galopp" },
  "c-major-scale": { pt: "Escala de dó maior", it: "Scala di do maggiore", de: "C-Dur-Tonleiter" },
  "happy-birthday": { pt: "Parabéns a você", it: "Tanti auguri", de: "Zum Geburtstag viel Glück" },
  "twinkle-little-star": { pt: "Brilha, brilha, estrelinha", it: "Brilla, brilla, stellina", de: "Funkel, funkel, kleiner Stern" },
  "dyads-and-chords": { pt: "Díades e acordes", it: "Diadi e accordi", de: "Zweiklänge und Akkorde" },
  "stradella-chord-symbols": { pt: "Símbolos de acordes Stradella", it: "Simboli degli accordi Stradella", de: "Stradella-Akkordsymbole" },
};

function localizeBuiltIn(id: string, originalLabel: string, language: InterfaceLanguage, names: Record<string, LocalizedName>): string {
  if (language === "en") return originalLabel;
  const entry = names[id];
  // Imported/custom names remain as authored, even if they reuse a bundled ID.
  if (!entry || originalLabel !== entry[0]) return originalLabel;
  if (language === "es") return entry[1];
  if (language === "fr") return entry[2];
  return ADDITIONAL_BUILTIN_NAMES[id]?.[language] ?? originalLabel;
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
