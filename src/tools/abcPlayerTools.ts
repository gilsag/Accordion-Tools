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
  notes: AbcNote[];
  chordSymbols: AbcChordSymbol[];
  source: string;
};

export type AbcParseResult = {
  events: AbcEvent[];
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

  if (isRest) {
    return {
      note: null,
      durationMultiplier: multiplier,
      nextIndex: index,
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
  };
}

function chordPatternFromSuffix(rawSuffix: string): FinderChordPattern | null {
  const suffix = rawSuffix
    .trim()
    .replace(/♭/g, "b")
    .replace(/♯/g, "#")
    .replace(/Δ/g, "maj")
    .replace(/ø/g, "m7b5")
    .replace(/°/g, "dim")
    .replace(/\s+/g, "")
    .toLowerCase();

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

function pushAbcEvent(
  state: {
    beat: number;
    events: AbcEvent[];
  },
  durationBeats: number,
  notes: AbcNote[],
  chordSymbols: AbcChordSymbol[],
  source: string,
) {
  if (notes.length > 0 || chordSymbols.length > 0) {
    state.events.push({
      index: state.events.length,
      startBeat: state.beat,
      durationBeats,
      notes,
      chordSymbols,
      source,
    });
  }
  state.beat += durationBeats;
}

function parseMusicLine(
  line: string,
  state: {
    beat: number;
    events: AbcEvent[];
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
        const duration = state.baseDurationBeats * durationAfterChord.multiplier * longestMultiplier;
        pushAbcEvent(
          state,
          duration,
          notes,
          pendingChordSymbols,
          source.slice(index, durationAfterChord.nextIndex),
        );
        pendingChordSymbols = [];
        index = durationAfterChord.nextIndex;
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
      );
      pendingChordSymbols = [];
      index = parsed.nextIndex;
      continue;
    }

    index += 1;
  }
}

export function parseAbc(abcText: string): AbcParseResult {
  const lines = abcText.replace(/\r\n/g, "\n").split("\n");
  let title = "Untitled ABC tune";
  let tempoBpm = 120;
  let defaultLength = 1 / 8;
  let key = "C";
  const musicLines: string[] = [];
  const errors: string[] = [];
  let inBody = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%")) return;

    const header = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
    if (header && !inBody) {
      const [, field, value] = header;
      if (field === "T") title = value.trim() || title;
      if (field === "Q") tempoBpm = parseTempo(value, tempoBpm);
      if (field === "L") defaultLength = parseFraction(value, defaultLength);
      if (field === "K") {
        key = value.trim() || "C";
        inBody = true;
      }
      return;
    }

    if (/^[A-Za-z]:/.test(trimmed) && inBody) {
      // Ignore later ABC metadata and voice declarations in this first single-line player.
      return;
    }

    musicLines.push(line);
  });

  if (musicLines.length === 0) {
    errors.push("No playable ABC body was found. Make sure the tune has a K: key line followed by notes.");
  }

  const state = {
    beat: 0,
    events: [] as AbcEvent[],
    keyAccidentals: keySignatureAccidentals(key),
    measureAccidentals: {} as Record<string, number>,
    baseDurationBeats: defaultLength * 4,
  };

  musicLines.forEach((line) => parseMusicLine(line, state));

  if (state.events.length === 0 && errors.length === 0) {
    errors.push("No playable notes or chord symbols were found in this ABC text.");
  }

  return {
    events: state.events,
    title,
    tempoBpm,
    key: normalizeKeyName(key),
    keyTonicPitchClass: keyTonicPitchClass(key),
    errors,
  };
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
  mode: AbcStradellaMappingMode = "bass-notes-only",
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
