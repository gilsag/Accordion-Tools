import abcjs from "abcjs";
import type { DiagramButton, FinderChordPattern, StradellaChordFinderMode } from "../types";
import { INDEX_TO_PITCH } from "../music";
import { intervalsForChordFinder } from "../music/chordDefinitions";
import { getStradellaChordFinderResult } from "./stradellaChordFinderTools";

export type AbcNote = {
  pitchClass: string;
  octave: number;
  label: string;
};

export type AbcChordSymbol = {
  raw: string;
  root: string;
  pattern: FinderChordPattern;
};

export type AbcEvent = {
  index: number;
  startBeat: number;
  durationBeats: number;
  voiceId?: string;
  notes: AbcNote[];
  chordSymbols: AbcChordSymbol[];
  source: string;
  tieToNext?: boolean;
};

export type AbcParseResult = {
  events: AbcEvent[];
  voiceIds: string[];
  title: string;
  tempoBpm: number;
  key: string;
  keyTonicPitchClass: string;
  errors: string[];
};

export type MappedAbcEvent = AbcEvent & {
  buttons: DiagramButton[];
  missingNotes: string[];
};

export type AbcStradellaMappingMode =
  | "bass-notes-only"
  | "chord-symbols-only"
  | "bass-notes-and-chord-symbols";

const PITCHES = INDEX_TO_PITCH;
const LETTER_TO_INDEX: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const MAJOR_KEY_ACCIDENTALS: Record<string, Record<string, number>> = {
  C: {},
  G: { F: 1 },
  D: { F: 1, C: 1 },
  A: { F: 1, C: 1, G: 1 },
  E: { F: 1, C: 1, G: 1, D: 1 },
  B: { F: 1, C: 1, G: 1, D: 1, A: 1 },
  "F#": { F: 1, C: 1, G: 1, D: 1, A: 1, E: 1 },
  "C#": { F: 1, C: 1, G: 1, D: 1, A: 1, E: 1, B: 1 },
  F: { B: -1 },
  Bb: { B: -1, E: -1 },
  Eb: { B: -1, E: -1, A: -1 },
  Ab: { B: -1, E: -1, A: -1, D: -1 },
  Db: { B: -1, E: -1, A: -1, D: -1, G: -1 },
  Gb: { B: -1, E: -1, A: -1, D: -1, G: -1, C: -1 },
  Cb: { B: -1, E: -1, A: -1, D: -1, G: -1, C: -1, F: -1 },
};

const MINOR_TO_RELATIVE_MAJOR: Record<string, string> = {
  Am: "C",
  Em: "G",
  Bm: "D",
  "F#m": "A",
  "C#m": "E",
  "G#m": "B",
  "D#m": "F#",
  "A#m": "C#",
  Dm: "F",
  Gm: "Bb",
  Cm: "Eb",
  Fm: "Ab",
  Bbm: "Db",
  Ebm: "Gb",
  Abm: "Cb",
};

function normalizeKeyName(rawKey: string) {
  const firstToken = rawKey.trim().split(/\s+/)[0] ?? "C";
  const cleaned = firstToken.replace(/♯/g, "#").replace(/♭/g, "b");
  const minorMatch = cleaned.match(/^([A-Ga-g])([#b]?)(m|min|minor)$/i);
  if (minorMatch) {
    return `${minorMatch[1].toUpperCase()}${minorMatch[2]}m`;
  }

  const majorMatch = cleaned.match(/^([A-Ga-g])([#b]?)/);
  if (!majorMatch) return "C";
  return `${majorMatch[1].toUpperCase()}${majorMatch[2]}`;
}

function keySignatureAccidentals(rawKey: string) {
  const normalized = normalizeKeyName(rawKey);
  const majorKey = normalized.endsWith("m")
    ? MINOR_TO_RELATIVE_MAJOR[normalized] ?? "C"
    : normalized;
  return MAJOR_KEY_ACCIDENTALS[majorKey] ?? {};
}

function keyTonicPitchClass(rawKey: string) {
  const normalized = normalizeKeyName(rawKey);
  const tonic = normalized.endsWith("m") ? normalized.slice(0, -1) : normalized;
  const match = tonic.match(/^([A-G])([#b]?)/);
  if (!match) return "C";

  const letterIndex = LETTER_TO_INDEX[match[1]];
  const accidental = match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0;
  return pitchNameFromIndex(letterIndex + accidental);
}

function parseFraction(value: string, fallback: number) {
  const trimmed = value.trim();
  const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator !== 0) return numerator / denominator;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function parseTempo(headerValue: string, fallback: number) {
  const equals = headerValue.match(/=\s*(\d+(?:\.\d+)?)/);
  if (equals) return Number(equals[1]);

  const number = headerValue.match(/\d+(?:\.\d+)?/);
  return number ? Number(number[0]) : fallback;
}

function durationMultiplier(source: string, index: number) {
  let currentIndex = index;
  let token = "";

  while (currentIndex < source.length && /[0-9/]/.test(source[currentIndex])) {
    token += source[currentIndex];
    currentIndex += 1;
  }

  if (!token) return { multiplier: 1, nextIndex: currentIndex };
  if (token === "/") return { multiplier: 0.5, nextIndex: currentIndex };
  if (/^\d+$/.test(token)) return { multiplier: Number(token), nextIndex: currentIndex };

  const simpleSlash = token.match(/^(\d+)\/$/);
  if (simpleSlash) return { multiplier: Number(simpleSlash[1]) / 2, nextIndex: currentIndex };

  const denominatorOnly = token.match(/^\/(\d+)$/);
  if (denominatorOnly) return { multiplier: 1 / Number(denominatorOnly[1]), nextIndex: currentIndex };

  const fraction = token.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return {
      multiplier: Number(fraction[1]) / Number(fraction[2]),
      nextIndex: currentIndex,
    };
  }

  const repeatedSlashes = token.match(/^(\/+)$/);
  if (repeatedSlashes) return { multiplier: 1 / Math.pow(2, token.length), nextIndex: currentIndex };

  return { multiplier: 1, nextIndex: currentIndex };
}

function pitchNameFromIndex(index: number) {
  return PITCHES[((index % 12) + 12) % 12];
}

function parseOneNote(
  source: string,
  startIndex: number,
  keyAccidentals: Record<string, number>,
  measureAccidentals: Record<string, number>,
) {
  let index = startIndex;
  let explicitAccidental: number | null = null;
  let accidentalText = "";

  if (source[index] === "^" || source[index] === "_" || source[index] === "=") {
    const first = source[index];
    accidentalText += first;
    index += 1;

    if ((first === "^" || first === "_") && source[index] === first) {
      accidentalText += source[index];
      index += 1;
    }

    if (accidentalText === "^") explicitAccidental = 1;
    if (accidentalText === "^^") explicitAccidental = 2;
    if (accidentalText === "_") explicitAccidental = -1;
    if (accidentalText === "__") explicitAccidental = -2;
    if (accidentalText === "=") explicitAccidental = 0;
  }

  const letter = source[index];
  if (!letter || !/[A-Ga-gzZ]/.test(letter)) return null;
  index += 1;

  const isRest = letter === "z" || letter === "Z";
  let octaveOffset = 0;

  while (source[index] === "'" || source[index] === ",") {
    octaveOffset += source[index] === "'" ? 1 : -1;
    index += 1;
  }

  const { multiplier, nextIndex } = durationMultiplier(source, index);
  index = nextIndex;

  const tieToNext = source[index] === "-";
  if (tieToNext) index += 1;

  if (isRest) {
    return {
      note: null,
      durationMultiplier: multiplier,
      nextIndex: index,
      tieToNext: false,
    };
  }

  const upperLetter = letter.toUpperCase();
  const baseOctave = letter === upperLetter ? 4 : 5;
  const accidental = explicitAccidental ?? measureAccidentals[upperLetter] ?? keyAccidentals[upperLetter] ?? 0;

  if (explicitAccidental !== null) {
    measureAccidentals[upperLetter] = explicitAccidental;
  }

  const pitchIndex = LETTER_TO_INDEX[upperLetter] + accidental;
  const pitchClass = pitchNameFromIndex(pitchIndex);
  const octaveShift = Math.floor(pitchIndex / 12);
  const octave = baseOctave + octaveOffset + octaveShift;

  return {
    note: {
      pitchClass,
      octave,
      label: `${pitchClass}${octave}`,
    },
    durationMultiplier: multiplier,
    nextIndex: index,
    tieToNext,
  };
}

function chordPatternFromSuffix(rawSuffix: string): FinderChordPattern | null {

  const raw = rawSuffix.trim();
  if (!raw || raw === "M" || /^maj(or)?$/i.test(raw)) return "major-triad";
  if (/^(m|min|minor|-)$/.test(raw)) return "minor-triad";
  if (/^(m|min|minor|-)6$/i.test(raw)) return "minor6";
  if (/^6$/i.test(raw)) return "major6";
  if (/^(aug|\+|#5)$/i.test(raw)) return "augmented-triad";
  if (/^(sus|sus4)$/i.test(raw)) return "sus4";
  if (/^(dim|o|°)$/i.test(raw)) return "diminished-triad";
  if (/^(dim7|o7|°7)$/i.test(raw)) return "diminished7";
  if (/^7$/i.test(raw)) return "dominant7";
  if (/^(maj7|major7)$/i.test(raw) || raw === "M7" || raw === "Δ7") return "major7";
  if (/^(m|min|minor|-)7$/i.test(raw)) return "minor7";
  if (/^(m|min|minor|-)(maj7|major7|M7|Δ7)$/i.test(raw)) return "minorMajor7";
  if (/^(m|min|minor|-)7b5$/i.test(raw) || /^ø7?$/i.test(raw)) return "minor7b5";
  if (/^7b5$/i.test(raw)) return "dominant7b5";
  if (/^7b9$/i.test(raw)) return "dominant7b9";
  if (/^9sus4$/i.test(raw)) return "dominant9sus4";
  if (/^9$/i.test(raw)) return "dominant9";
  if (/^(maj9|major9)$/i.test(raw) || raw === "M9" || raw === "Δ9") return "major9";
  if (/^(m|min|minor|-)9$/i.test(raw)) return "minor9";
  if (/^(m|min|minor|-)(maj9|major9|M9|Δ9)$/i.test(raw)) return "minorMajor9";
  if (/^11$/i.test(raw)) return "dominant11";

  return null;
}

export function parseAbcChordSymbol(rawSymbol: string): AbcChordSymbol | null {
  const cleaned = rawSymbol
    .trim()
    .replace(/^[_^<>@][^A-Ga-g]*/, "")
    .replace(/♭/g, "b")
    .replace(/♯/g, "#");
  const match = cleaned.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!match) return null;

  const letter = match[1].toUpperCase();
  const accidental = match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0;
  const root = pitchNameFromIndex(LETTER_TO_INDEX[letter] + accidental);
  const pattern = chordPatternFromSuffix(match[3]);
  if (!pattern) return null;

  return {
    raw: rawSymbol.trim(),
    root,
    pattern,
  };
}

function stripInlineNoiseButKeepChordSymbols(line: string) {
  return line
    .replace(/%.*$/g, "")
    .replace(/![^!]*!/g, "")
    .replace(/[.~HLMOPSTuv]/g, "");
}

function noteIdentity(note: AbcNote) {
  return `${note.pitchClass}${note.octave}`;
}

function sameTiedNotes(a: AbcNote[], b: AbcNote[]) {
  if (a.length === 0 || a.length !== b.length) return false;
  const aNotes = a.map(noteIdentity).sort();
  const bNotes = b.map(noteIdentity).sort();
  return aNotes.every((note, index) => note === bNotes[index]);
}

function pushAbcEvent(
  state: {
    beat: number;
    events: AbcEvent[];
    voiceId?: string;
  },
  durationBeats: number,
  notes: AbcNote[],
  chordSymbols: AbcChordSymbol[],
  source: string,
  tieToNext = false,
) {
  const previous = state.events[state.events.length - 1];

  if (notes.length === 0 && chordSymbols.length === 0) {
    if (previous) previous.tieToNext = false;
    state.beat += durationBeats;
    return;
  }

  const shouldMergeTie =
    Boolean(previous?.tieToNext) &&
    chordSymbols.length === 0 &&
    previous.voiceId === state.voiceId &&
    sameTiedNotes(previous.notes, notes);

  if (shouldMergeTie && previous) {
    previous.durationBeats += durationBeats;
    previous.source = `${previous.source}${source}`;
    previous.tieToNext = tieToNext;
  } else {
    if (previous) previous.tieToNext = false;
    state.events.push({
      index: state.events.length,
      startBeat: state.beat,
      durationBeats,
      voiceId: state.voiceId,
      notes,
      chordSymbols,
      source,
      tieToNext,
    });
  }

  state.beat += durationBeats;
}

function parseMusicLine(
  line: string,
  state: {
    beat: number;
    events: AbcEvent[];
    voiceId?: string;
    keyAccidentals: Record<string, number>;
    measureAccidentals: Record<string, number>;
    baseDurationBeats: number;
  },
) {
  const source = stripInlineNoiseButKeepChordSymbols(line);
  let index = 0;
  let pendingChordSymbols: AbcChordSymbol[] = [];

  while (index < source.length) {
    const char = source[index];

    if (char === "|") {
      state.measureAccidentals = {};
      index += 1;
      continue;
    }

    if (char === '"') {
      const closeIndex = source.indexOf('"', index + 1);
      if (closeIndex > index) {
        const symbol = parseAbcChordSymbol(source.slice(index + 1, closeIndex));
        if (symbol) pendingChordSymbols.push(symbol);
        index = closeIndex + 1;
        continue;
      }
    }

    if (/\s|:|\(|\)|-|>/.test(char) || char === "<") {
      index += 1;
      continue;
    }

    if (char === "[") {
      const closeIndex = source.indexOf("]", index + 1);
      if (closeIndex > index) {
        const chordSource = source.slice(index + 1, closeIndex);
        const notes: AbcNote[] = [];
        let chordIndex = 0;
        let longestMultiplier = 1;

        while (chordIndex < chordSource.length) {
          const parsed = parseOneNote(
            chordSource,
            chordIndex,
            state.keyAccidentals,
            state.measureAccidentals,
          );
          if (!parsed) {
            chordIndex += 1;
            continue;
          }
          if (parsed.note) notes.push(parsed.note);
          longestMultiplier = Math.max(longestMultiplier, parsed.durationMultiplier);
          chordIndex = parsed.nextIndex;
        }

        const durationAfterChord = durationMultiplier(source, closeIndex + 1);
        const tieToNext = source[durationAfterChord.nextIndex] === "-";
        const nextIndex = tieToNext ? durationAfterChord.nextIndex + 1 : durationAfterChord.nextIndex;
        const duration = state.baseDurationBeats * durationAfterChord.multiplier * longestMultiplier;
        pushAbcEvent(
          state,
          duration,
          notes,
          pendingChordSymbols,
          source.slice(index, nextIndex),
          tieToNext,
        );
        pendingChordSymbols = [];
        index = nextIndex;
        continue;
      }
    }

    const parsed = parseOneNote(source, index, state.keyAccidentals, state.measureAccidentals);
    if (parsed) {
      const duration = state.baseDurationBeats * parsed.durationMultiplier;
      pushAbcEvent(
        state,
        duration,
        parsed.note ? [parsed.note] : [],
        pendingChordSymbols,
        source.slice(index, parsed.nextIndex),
        parsed.tieToNext,
      );
      pendingChordSymbols = [];
      index = parsed.nextIndex;
      continue;
    }

    index += 1;
  }
}

function parseAbcLegacy(abcText: string): AbcParseResult {
  const lines = abcText.replace(/\r\n/g, "\n").split("\n");
  let title = "Untitled ABC tune";
  let tempoBpm = 120;
  let defaultLength = 1 / 8;
  let key = "C";
  const errors: string[] = [];
  let inBody = false;
  let currentVoiceId = "1";
  const voiceOrder: string[] = [];
  const voiceStates = new Map<
    string,
    {
      beat: number;
      events: AbcEvent[];
      voiceId?: string;
      keyAccidentals: Record<string, number>;
      measureAccidentals: Record<string, number>;
      baseDurationBeats: number;
    }
  >();

  function rememberVoice(rawVoiceId: string) {
    const voiceId = rawVoiceId.trim().split(/\s+/)[0] || "1";
    if (!voiceOrder.includes(voiceId)) voiceOrder.push(voiceId);
    return voiceId;
  }

  function getVoiceState(voiceId: string) {
    const rememberedVoiceId = rememberVoice(voiceId);
    const existing = voiceStates.get(rememberedVoiceId);
    if (existing) return existing;

    const state = {
      beat: 0,
      events: [] as AbcEvent[],
      voiceId: rememberedVoiceId,
      keyAccidentals: keySignatureAccidentals(key),
      measureAccidentals: {} as Record<string, number>,
      baseDurationBeats: defaultLength * 4,
    };
    voiceStates.set(rememberedVoiceId, state);
    return state;
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%")) return;

    const header = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
    if (header && !inBody) {
      const [, field, value] = header;
      if (field === "T") title = value.trim() || title;
      if (field === "Q") tempoBpm = parseTempo(value, tempoBpm);
      if (field === "L") defaultLength = parseFraction(value, defaultLength);
      if (field === "V") rememberVoice(value);
      if (field === "K") {
        key = value.trim() || "C";
        inBody = true;
      }
      return;
    }

    if (header && inBody) {
      const [, field, value] = header;
      if (field === "V") currentVoiceId = rememberVoice(value);
      return;
    }

    parseMusicLine(line, getVoiceState(currentVoiceId));
  });

  const voiceIndex = new Map(voiceOrder.map((voiceId, index) => [voiceId, index]));
  const events = [...voiceStates.values()]
    .flatMap((state) => state.events)
    .sort((a, b) => {
      if (Math.abs(a.startBeat - b.startBeat) > 0.0001) return a.startBeat - b.startBeat;
      return (voiceIndex.get(a.voiceId ?? "1") ?? 0) - (voiceIndex.get(b.voiceId ?? "1") ?? 0);
    })
    .map((event, index) => ({ ...event, index }));

  if (events.length === 0) {
    errors.push("No playable notes or chord symbols were found in this ABC text.");
  }

  return {
    events,
    voiceIds: voiceOrder.length > 0 ? voiceOrder : ["1"],
    title,
    tempoBpm,
    key: normalizeKeyName(key),
    keyTonicPitchClass: keyTonicPitchClass(key),
    errors,
  };
}

type AbcJsPitch = {
  pitch: number;
  name?: string;
  accidental?: string;
  startTie?: object;
  endTie?: boolean;
};

type AbcJsChord = {
  name?: string;
  position?: string;
};

type AbcJsSequenceElement = {
  el_type?: string;
  duration?: number;
  timing?: number;
  pitches?: AbcJsPitch[];
  chord?: AbcJsChord[];
  rest?: { type?: string };
  accidentals?: { acc?: string; note?: string }[];
  qpm?: number;
  elem?: {
    startChar?: number;
    endChar?: number;
    startTriplet?: number;
    endTriplet?: boolean;
  };
};

function accidentalValueFromAbcjs(value: string | undefined) {
  switch (value) {
    case "sharp":
      return 1;
    case "dblsharp":
    case "double-sharp":
    case "double sharp":
      return 2;
    case "flat":
      return -1;
    case "dblflat":
    case "double-flat":
    case "double flat":
      return -2;
    case "natural":
      return 0;
    default:
      return null;
  }
}

function abcjsKeyAccidentals(accidentals: { acc?: string; note?: string }[] | undefined) {
  const result: Record<string, number> = {};
  accidentals?.forEach((accidental) => {
    const letter = accidental.note?.match(/[A-Ga-g]/)?.[0]?.toUpperCase();
    const value = accidentalValueFromAbcjs(accidental.acc);
    if (letter && value !== null) result[letter] = value;
  });
  return result;
}

function letterForAbcjsPitch(pitch: number) {
  const letters = ["C", "D", "E", "F", "G", "A", "B"];
  return letters[((pitch % 7) + 7) % 7];
}

function octaveForAbcjsPitch(pitch: number) {
  return 4 + Math.floor(pitch / 7);
}

function abcjsPitchToNote(
  pitch: AbcJsPitch,
  keyAccidentals: Record<string, number>,
  measureAccidentals: Record<string, number>,
): AbcNote {
  const letter = letterForAbcjsPitch(pitch.pitch);
  const explicitAccidental = accidentalValueFromAbcjs(pitch.accidental);
  const accidental = explicitAccidental ?? measureAccidentals[letter] ?? keyAccidentals[letter] ?? 0;

  if (explicitAccidental !== null) {
    measureAccidentals[letter] = explicitAccidental;
  }

  const pitchIndex = LETTER_TO_INDEX[letter] + accidental;
  const pitchClass = pitchNameFromIndex(pitchIndex);
  const octave = octaveForAbcjsPitch(pitch.pitch) + Math.floor(pitchIndex / 12);
  return {
    pitchClass,
    octave,
    label: `${pitchClass}${octave}`,
  };
}

function abcjsChordSymbols(chords: AbcJsChord[] | undefined) {
  return (chords ?? [])
    .map((chord) => parseAbcChordSymbol(chord.name ?? ""))
    .filter((symbol): symbol is AbcChordSymbol => Boolean(symbol));
}

function parseAbcWithAbcjs(abcText: string): AbcParseResult {
  const tunes = abcjs.parseOnly(abcText);
  const tune = tunes[0];

  if (!tune) {
    return {
      events: [],
      voiceIds: ["1"],
      title: "Untitled ABC tune",
      tempoBpm: 120,
      key: "C",
      keyTonicPitchClass: "C",
      errors: ["abcjs could not parse this ABC text."],
    };
  }

  const title = tune.metaText?.title ?? "Untitled ABC tune";
  const tempoBpm = tune.metaText?.tempo?.bpm ?? tune.getBpm?.(tune.metaText?.tempo) ?? 120;
  const keySignature = tune.getKeySignature?.();
  const key = normalizeKeyName(`${keySignature?.root ?? "C"}${keySignature?.acc ?? ""}${keySignature?.mode ? ` ${keySignature.mode}` : ""}`);
  const keyTonic = keyTonicPitchClass(key);
  const sequencedVoices = abcjs.synth.sequence(tune, {}) as unknown as AbcJsSequenceElement[][];
  const voiceIds = sequencedVoices.map((_, index) => String(index + 1));
  const events: AbcEvent[] = [];

  sequencedVoices.forEach((voice, voiceIndex) => {
    const voiceId = String(voiceIndex + 1);
    let keyAccidentals = keySignatureAccidentals(key);
    let measureAccidentals: Record<string, number> = {};

    voice.forEach((element) => {
      if (element.el_type === "key") {
        keyAccidentals = abcjsKeyAccidentals(element.accidentals);
        measureAccidentals = {};
        return;
      }

      if (element.el_type === "bar") {
        measureAccidentals = {};
        return;
      }

      if (element.el_type !== "note" || typeof element.duration !== "number") return;

      const durationBeats = element.duration * 4;
      const startBeat = typeof element.timing === "number" ? element.timing * 4 : 0;
      const rawPitches = element.pitches ?? [];
      const notes = rawPitches.map((pitch) =>
        abcjsPitchToNote(pitch, keyAccidentals, measureAccidentals),
      );
      const chordSymbols = abcjsChordSymbols(element.chord);

      if (notes.length === 0 && chordSymbols.length === 0) return;

      const tieFromPrevious = rawPitches.some((pitch) => pitch.endTie);
      const tieToNext = rawPitches.some((pitch) => pitch.startTie);
      const previous = events[events.length - 1];
      const shouldMergeTie =
        tieFromPrevious &&
        Boolean(previous?.tieToNext) &&
        previous?.voiceId === voiceId &&
        chordSymbols.length === 0 &&
        previous.chordSymbols.length === 0 &&
        sameTiedNotes(previous.notes, notes);

      if (shouldMergeTie && previous) {
        previous.durationBeats += durationBeats;
        previous.source = `${previous.source}${abcText.slice(element.elem?.startChar ?? 0, element.elem?.endChar ?? 0)}`;
        previous.tieToNext = tieToNext;
        return;
      }

      if (previous?.voiceId === voiceId) previous.tieToNext = false;
      events.push({
        index: events.length,
        startBeat,
        durationBeats,
        voiceId,
        notes,
        chordSymbols,
        source: abcText.slice(element.elem?.startChar ?? 0, element.elem?.endChar ?? 0),
        tieToNext,
      });
    });
  });

  const sortedEvents = events
    .sort((a, b) => {
      if (Math.abs(a.startBeat - b.startBeat) > 0.0001) return a.startBeat - b.startBeat;
      return Number(a.voiceId ?? 1) - Number(b.voiceId ?? 1);
    })
    .map((event, index) => ({ ...event, index }));

  return {
    events: sortedEvents,
    voiceIds: voiceIds.length > 0 ? voiceIds : ["1"],
    title,
    tempoBpm,
    key,
    keyTonicPitchClass: keyTonic,
    errors: sortedEvents.length === 0
      ? ["No playable notes or chord symbols were found in this ABC text."]
      : [],
  };
}

export function parseAbc(abcText: string): AbcParseResult {
  try {
    return parseAbcWithAbcjs(abcText);
  } catch (error) {
    const legacy = parseAbcLegacy(abcText);
    return {
      ...legacy,
      errors: [
        ...legacy.errors,
        `abcjs parsing failed; used legacy parser fallback. ${error instanceof Error ? error.message : ""}`.trim(),
      ],
    };
  }
}

function uniqueEventVoiceIds(events: AbcEvent[]) {
  return [
    ...new Set(
      events
        .map((event) => event.voiceId)
        .filter((voiceId): voiceId is string => Boolean(voiceId)),
    ),
  ];
}

export function abcEventsForTrebleSide(events: AbcEvent[]) {
  const voiceIds = uniqueEventVoiceIds(events);
  if (voiceIds.length <= 1) return events;
  const preferredVoice = voiceIds.includes("1") ? "1" : voiceIds[0];
  return events.filter((event) => event.voiceId === preferredVoice);
}

export function abcEventsForStradellaSide(events: AbcEvent[]) {
  const voiceIds = uniqueEventVoiceIds(events);
  if (voiceIds.length <= 1) return events;
  const preferredVoice = voiceIds.includes("2") ? "2" : voiceIds[voiceIds.length - 1];
  return events.filter((event) => event.voiceId === preferredVoice);
}

function buttonDistance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function noteLabel(note: AbcNote) {
  return `${note.pitchClass}${note.octave}`;
}

function pitchIndexForClass(pitchClass: string) {
  return PITCHES.indexOf(pitchClass);
}

function noteForChordTone(root: string, baseOctave: number, interval: number): AbcNote {
  const rootIndex = pitchIndexForClass(root);
  const absoluteIndex = rootIndex + interval;
  const pitchClass = pitchNameFromIndex(absoluteIndex);
  const octave = baseOctave + Math.floor(absoluteIndex / 12);
  return {
    pitchClass,
    octave,
    label: `${pitchClass}${octave}`,
  };
}

function chooseTrebleButton(
  candidates: DiagramButton[],
  previous: DiagramButton | undefined,
) {
  if (candidates.length === 0) return undefined;
  if (!previous) {
    return [...candidates].sort((a, b) => {
      if (a.column !== b.column) return a.column - b.column;
      return a.row - b.row;
    })[0];
  }

  return [...candidates].sort((a, b) => {
    const distanceDifference = buttonDistance(a, previous) - buttonDistance(b, previous);
    if (Math.abs(distanceDifference) > 0.001) return distanceDifference;
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

export function mapAbcEventsToTrebleButtons(
  buttons: DiagramButton[],
  events: AbcEvent[],
  includeChordSymbols = false,
): MappedAbcEvent[] {
  let previous: DiagramButton | undefined;

  return events.map((event) => {
    const eventButtons: DiagramButton[] = [];
    const missingNotes: string[] = [];
    const playableNotes = [...event.notes];

    if (includeChordSymbols) {
      const baseOctave = event.notes[0]?.octave ?? 4;
      event.chordSymbols.forEach((symbol) => {
        intervalsForChordFinder(symbol.pattern).forEach((interval) => {
          playableNotes.push(noteForChordTone(symbol.root, baseOctave, interval));
        });
      });
    }

    playableNotes.forEach((note) => {
      const candidates = buttons.filter(
        (button) =>
          button.kind === "treble-note" &&
          button.pitchClass === note.pitchClass &&
          (button.soundOctave ?? button.octave) === note.octave,
      );
      const selected = chooseTrebleButton(candidates, previous);

      if (selected) {
        eventButtons.push(selected);
        previous = selected;
      } else {
        missingNotes.push(noteLabel(note));
      }
    });

    return {
      ...event,
      buttons: eventButtons,
      missingNotes,
    };
  });
}

function chooseStradellaRootReference(
  bassButtons: DiagramButton[],
  preferredRootPitchClass: string,
) {
  const rootsForKey = bassButtons.filter(
    (button) => button.kind === "bass-root" && button.pitchClass === preferredRootPitchClass,
  );

  if (rootsForKey.length > 0) {
    return [...rootsForKey].sort((a, b) => a.column - b.column || a.row - b.row)[0];
  }

  const counterbassForKey = bassButtons.filter(
    (button) => button.kind === "bass-counterbass" && button.pitchClass === preferredRootPitchClass,
  );

  if (counterbassForKey.length > 0) {
    return [...counterbassForKey].sort((a, b) => a.column - b.column || a.row - b.row)[0];
  }

  return (
    bassButtons.find((button) => button.kind === "bass-root" && button.pitchClass === "C") ??
    bassButtons[0]
  );
}

function chooseStradellaBassButton(
  candidates: DiagramButton[],
  rootReference: DiagramButton | undefined,
  previous: DiagramButton | undefined,
  usedIds: Set<string>,
) {
  if (candidates.length === 0) return undefined;

  const unused = candidates.filter((button) => !usedIds.has(button.id));
  const pool = unused.length > 0 ? unused : candidates;

  return [...pool].sort((a, b) => {
    const rootScoreA = rootReference ? buttonDistance(a, rootReference) : 0;
    const rootScoreB = rootReference ? buttonDistance(b, rootReference) : 0;
    const previousScoreA = previous ? buttonDistance(a, previous) : 0;
    const previousScoreB = previous ? buttonDistance(b, previous) : 0;
    const scoreA = rootScoreA + previousScoreA * 0.35;
    const scoreB = rootScoreB + previousScoreB * 0.35;
    const scoreDifference = scoreA - scoreB;
    if (Math.abs(scoreDifference) > 0.001) return scoreDifference;

    const rootPreference = (a.kind === "bass-root" ? 0 : 1) - (b.kind === "bass-root" ? 0 : 1);
    if (rootPreference !== 0) return rootPreference;
    if (a.column !== b.column) return a.column - b.column;
    return a.row - b.row;
  })[0];
}

export function mapAbcEventsToStradellaBassButtons(
  buttons: DiagramButton[],
  events: AbcEvent[],
  preferredRootPitchClass = "C",
): MappedAbcEvent[] {
  const bassButtons = buttons.filter(
    (button) => button.kind === "bass-root" || button.kind === "bass-counterbass",
  );
  const rootReference = chooseStradellaRootReference(bassButtons, preferredRootPitchClass);
  let previous: DiagramButton | undefined = rootReference;

  return events.map((event) => {
    const eventButtons: DiagramButton[] = [];
    const missingNotes: string[] = [];
    const usedIds = new Set<string>();

    event.notes.forEach((note) => {
      const candidates = bassButtons.filter((button) => button.pitchClass === note.pitchClass);
      const selected = chooseStradellaBassButton(candidates, rootReference, previous, usedIds);

      if (selected) {
        eventButtons.push(selected);
        usedIds.add(selected.id);
      } else {
        missingNotes.push(noteLabel(note));
      }
    });

    if (eventButtons.length > 0) {
      previous = eventButtons[eventButtons.length - 1];
    }

    return {
      ...event,
      buttons: eventButtons,
      missingNotes,
    };
  });
}

function chordFinderModeForAbc(mode: AbcStradellaMappingMode): StradellaChordFinderMode {
  return mode === "chord-symbols-only" ? "chord-buttons-only" : "bass-and-chords";
}

function uniqueButtons(buttons: DiagramButton[]) {
  const seen = new Set<string>();
  return buttons.filter((button) => {
    if (seen.has(button.id)) return false;
    seen.add(button.id);
    return true;
  });
}

export function mapAbcEventsToStradellaButtons(
  buttons: DiagramButton[],
  events: AbcEvent[],
  preferredRootPitchClass = "C",
  mode: AbcStradellaMappingMode = "bass-notes-and-chord-symbols",
): MappedAbcEvent[] {
  if (mode === "bass-notes-only") {
    return mapAbcEventsToStradellaBassButtons(buttons, events, preferredRootPitchClass);
  }

  const bassMapped = mode === "bass-notes-and-chord-symbols"
    ? mapAbcEventsToStradellaBassButtons(buttons, events, preferredRootPitchClass)
    : undefined;

  return events.map((event, eventIndex) => {
    const eventButtons: DiagramButton[] = bassMapped?.[eventIndex]?.buttons ? [...bassMapped[eventIndex].buttons] : [];
    const missingNotes: string[] = bassMapped?.[eventIndex]?.missingNotes ? [...bassMapped[eventIndex].missingNotes] : [];
    const finderMode = chordFinderModeForAbc(mode);

    event.chordSymbols.forEach((symbol) => {
      const result = getStradellaChordFinderResult(
        buttons,
        symbol.root,
        symbol.pattern,
        finderMode,
        false,
      );
      if (result.playable) {
        eventButtons.push(...result.playbackButtons);
      } else {
        missingNotes.push(`chord ${symbol.raw}`);
      }
    });

    return {
      ...event,
      buttons: uniqueButtons(eventButtons),
      missingNotes: [...new Set(missingNotes)],
    };
  });
}

export function totalAbcBeats(events: AbcEvent[]) {
  if (events.length === 0) return 0;
  return Math.max(...events.map((event) => event.startBeat + event.durationBeats));
}

export function abcPitchNames(events: AbcEvent[]) {
  return [...new Set(events.flatMap((event) => event.notes.map(noteLabel)))];
}

export function abcChordSymbols(events: AbcEvent[]) {
  return [...new Set(events.flatMap((event) => event.chordSymbols.map((symbol) => symbol.raw)))];
}

export function abcMissingNotes(events: MappedAbcEvent[]) {
  return [...new Set(events.flatMap((event) => event.missingNotes))];
}
