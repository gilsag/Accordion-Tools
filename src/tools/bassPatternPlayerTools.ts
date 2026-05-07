import type {
  BassPatternChordVoicing,
  DiagramButton,
  FinderChordPattern,
} from "../types";
import { INDEX_TO_PITCH } from "../music";
import { getStradellaChordFinderResult } from "./stradellaChordFinderTools";

export type BassPatternPlayToken =
  | "bass:1"
  | "bass:3"
  | "bass:5"
  | "bass:b7"
  | "counter:1"
  | "counter:3"
  | "chord"
  | "chord:simple"
  | "chord:full"
  | "rest"
  | string;

export type BassPatternAccent =
  | ">"
  | "^"
  | "."
  | "strong"
  | "weak"
  | "marcato"
  | "ghost";

export type BassPatternRhythmicValue = number | string;

export type BassPatternStep = {
  /** Position within the pattern, measured in the denominator unit of the meter. */
  t: BassPatternRhythmicValue;
  /** Duration, measured in the denominator unit of the meter. */
  d: BassPatternRhythmicValue;
  play: BassPatternPlayToken[];
  accent?: BassPatternAccent;
  /** Optional notation-level tie marker. Playback treats tied spans as normal sustained durations. */
  tie?: "start" | "stop" | "continue";
};

type NormalizedBassPatternStep = {
  t: number;
  d: number;
  play: BassPatternPlayToken[];
  accent?: BassPatternAccent;
  tie?: "start" | "stop" | "continue";
};

export type BassPatternDefinition = {
  id: string;
  name: string;
  meter: string;
  /** Number of notated bars in one full pattern cycle. Defaults to 1. */
  bars?: number;
  description?: string;
  tags?: string[];
  legend?: Record<string, BassPatternPlayToken[] | string>;
  pattern?: string;
  steps?: BassPatternStep[];
};

export type BassPatternLibrary = {
  version: 2;
  legend?: Record<string, BassPatternPlayToken[] | string>;
  patterns: BassPatternDefinition[];
};

export type ChordProgressionStep = {
  symbol: string;
  bars: number;
};

export type ChordProgressionDefinition = {
  id: string;
  name: string;
  description?: string;
  /** Compact format: symbols separated by spaces, e.g. "I vi IV V". */
  progression?: string;
  /** Alternative compact format for symbols that are easier to maintain as an array. */
  symbols?: string[];
  /** Expanded format, still supported internally for future per-chord bar overrides. */
  steps?: ChordProgressionStep[];
};

export type BassPatternPlaybackEvent = {
  index: number;
  /** Absolute position in the expanded progression, measured in meter denominator units. */
  startBeat: number;
  /** Duration measured in meter denominator units. */
  durationBeats: number;
  /** One-based bar number in the expanded progression. */
  barNumber: number;
  /** Zero-based meter-unit position inside the current bar. */
  unitInBar: number;
  /** Original progression symbol, e.g. I, V7, Am. */
  progressionSymbol: string;
  /** Resolved ABC-style chord label after applying the selected root, e.g. C, G7, Am. */
  resolvedChordLabel: string;
  buttons: DiagramButton[];
  label: string;
  missing: string[];
  play: BassPatternPlayToken[];
  accent?: BassPatternAccent;
  tie?: "start" | "stop" | "continue";
  gain: number;
};

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

export function chordProgressionSteps(
  progression: ChordProgressionDefinition,
): ChordProgressionStep[] {
  if (Array.isArray(progression.steps) && progression.steps.length > 0) {
    return progression.steps
      .map((step) => ({
        symbol: String(step.symbol ?? "").trim(),
        bars: Math.max(1, Math.round(Number(step.bars ?? 1))),
      }))
      .filter((step) => step.symbol.length > 0);
  }

  const symbols = Array.isArray(progression.symbols)
    ? progression.symbols
    : typeof progression.progression === "string"
      ? progression.progression.split(/\s+/)
      : [];

  return symbols
    .map((symbol) => String(symbol).trim())
    .filter(Boolean)
    .map((symbol) => ({ symbol, bars: 1 }));
}

function normalizeRomanSymbol(symbol: string) {
  return symbol
    .replace(/[♭𝄫]/g, "b")
    .replace(/[♯𝄪]/g, "#")
    .replace(/–|—/g, "-")
    .trim();
}

const ROMAN_TO_DEGREE: Record<string, number> = {
  I: 0,
  II: 1,
  III: 2,
  IV: 3,
  V: 4,
  VI: 5,
  VII: 6,
};

function pitchIndex(pitchClass: string) {
  return INDEX_TO_PITCH.indexOf(pitchClass);
}

function pitchClassAt(index: number) {
  return INDEX_TO_PITCH[((index % 12) + 12) % 12];
}

function distance(a: DiagramButton, b: DiagramButton) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function uniqueButtons(buttons: DiagramButton[]) {
  const seen = new Set<string>();
  return buttons.filter((button) => {
    if (seen.has(button.id)) return false;
    seen.add(button.id);
    return true;
  });
}

export function chooseBassPatternReferenceButton(
  buttons: DiagramButton[],
  rootPitchClass: string,
) {
  const roots = buttons.filter(
    (button) =>
      button.kind === "bass-root" && button.pitchClass === rootPitchClass,
  );
  if (roots.length > 0)
    return [...roots].sort((a, b) => a.column - b.column || a.row - b.row)[0];

  const bassButtons = buttons.filter(
    (button) =>
      button.kind === "bass-root" || button.kind === "bass-counterbass",
  );
  return bassButtons[0];
}

function closestBassButton(
  buttons: DiagramButton[],
  pitchClass: string,
  reference: DiagramButton | undefined,
  previous: DiagramButton | undefined,
  preferredRow: "root" | "counterbass" | "any" = "root",
) {
  const rowKinds =
    preferredRow === "root"
      ? ["bass-root", "bass-counterbass"]
      : preferredRow === "counterbass"
        ? ["bass-counterbass", "bass-root"]
        : ["bass-root", "bass-counterbass"];

  for (const rowKind of rowKinds) {
    const candidates = buttons.filter(
      (button) => button.kind === rowKind && button.pitchClass === pitchClass,
    );
    if (candidates.length === 0) continue;

    return [...candidates].sort((a, b) => {
      const referenceScoreA = reference ? distance(a, reference) : 0;
      const referenceScoreB = reference ? distance(b, reference) : 0;
      const previousScoreA = previous ? distance(a, previous) : 0;
      const previousScoreB = previous ? distance(b, previous) : 0;
      const scoreA = referenceScoreA + previousScoreA * 0.2;
      const scoreB = referenceScoreB + previousScoreB * 0.2;
      if (Math.abs(scoreA - scoreB) > 0.001) return scoreA - scoreB;
      return a.column - b.column || a.row - b.row;
    })[0];
  }

  return undefined;
}

function chordPatternFromRoman(symbol: string): FinderChordPattern {
  const compact = normalizeRomanSymbol(symbol).replace(/\s+/g, "");
  if (/dim/i.test(compact) || /°/.test(compact))
    return /7/.test(compact) ? "diminished7" : "diminished-triad";
  if (/m7b5|ø/i.test(compact)) return "minor7b5";
  if (/maj9|M9|Δ9/.test(compact)) return "major9";
  if (/maj7|M7|Δ7/.test(compact)) return "major7";
  if (/m9/.test(compact) || /^[ivx]+9/.test(compact)) return "minor9";
  if (/7b5/i.test(compact)) return "dominant7b5";
  if (/7b9/i.test(compact)) return "dominant7b9";
  if (/9sus4/i.test(compact)) return "dominant9sus4";
  if (/m7/.test(compact) || /^[ivx]+7/.test(compact)) return "minor7";
  if (/11/.test(compact)) return "dominant11";
  if (/9/.test(compact)) return "dominant9";
  if (/7/.test(compact)) return "dominant7";
  if (/sus4/i.test(compact)) return "sus4";
  if (/6/.test(compact) && compact[0] === compact[0].toLowerCase())
    return "minor6";
  if (/6/.test(compact)) return "major6";
  return compact[0] === compact[0].toLowerCase()
    ? "minor-triad"
    : "major-triad";
}

export function resolveRomanChord(symbol: string, keyRootPitchClass: string) {
  const compact = normalizeRomanSymbol(symbol).replace(/\s+/g, "");
  const romanMatch = compact.match(
    /^(b|#)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/,
  );
  if (!romanMatch) {
    return {
      root: keyRootPitchClass,
      pattern: "major-triad" as FinderChordPattern,
      label: symbol,
    };
  }

  const accidental = romanMatch[1] === "#" ? 1 : romanMatch[1] === "b" ? -1 : 0;
  const roman = romanMatch[2];
  const degree = ROMAN_TO_DEGREE[roman.toUpperCase()] ?? 0;
  const keyIndex = pitchIndex(keyRootPitchClass);
  const root = pitchClassAt(
    keyIndex + MAJOR_SCALE_INTERVALS[degree] + accidental,
  );
  return {
    root,
    pattern: chordPatternFromRoman(compact),
    label: symbol,
  };
}

function simpleChordButtonKindForPattern(
  pattern: FinderChordPattern,
): DiagramButton["kind"] | undefined {
  if (
    pattern === "major-triad" ||
    pattern === "major6" ||
    pattern === "major7" ||
    pattern === "major9" ||
    pattern === "major7add9"
  ) {
    return "chord-major";
  }

  if (
    pattern === "minor-triad" ||
    pattern === "minor6" ||
    pattern === "minor7" ||
    pattern === "minor7b5" ||
    pattern === "minor9" ||
    pattern === "minorMajor7" ||
    pattern === "minorMajor9"
  ) {
    return "chord-minor";
  }

  if (
    pattern === "dominant7" ||
    pattern === "dominant7b5" ||
    pattern === "dominant7b9" ||
    pattern === "dominant9" ||
    pattern === "dominant9sus4" ||
    pattern === "dominant11"
  ) {
    return "chord-dominant7";
  }

  if (pattern === "diminished-triad" || pattern === "diminished7") {
    return "chord-diminished7";
  }

  if (pattern === "sus4") {
    return "chord-major";
  }

  return undefined;
}

function closestChordButton(
  buttons: DiagramButton[],
  root: string,
  kind: DiagramButton["kind"],
  reference: DiagramButton | undefined,
) {
  const candidates = buttons.filter(
    (button) => button.kind === kind && button.pitchClass === root,
  );
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => {
    const scoreA = reference ? distance(a, reference) : 0;
    const scoreB = reference ? distance(b, reference) : 0;
    if (Math.abs(scoreA - scoreB) > 0.001) return scoreA - scoreB;
    return a.column - b.column || a.row - b.row;
  })[0];
}

function chordButtonsForSymbol(
  buttons: DiagramButton[],
  root: string,
  pattern: FinderChordPattern,
  chordVoicing: BassPatternChordVoicing,
  reference: DiagramButton | undefined,
) {
  if (chordVoicing === "simple") {
    const simpleKind = simpleChordButtonKindForPattern(pattern);
    const simpleButton = simpleKind
      ? closestChordButton(buttons, root, simpleKind, reference)
      : undefined;
    return simpleButton ? [simpleButton] : [];
  }

  const result = getStradellaChordFinderResult(
    buttons,
    root,
    pattern,
    "chord-buttons-only",
    false,
  );
  if (result.playable && result.playbackButtons.length > 0)
    return result.playbackButtons;

  const fallback = getStradellaChordFinderResult(
    buttons,
    root,
    pattern,
    "bass-and-chords",
    false,
  );
  return fallback.playable
    ? fallback.playbackButtons.filter((button) =>
        button.kind.startsWith("chord-"),
      )
    : [];
}

const DEFAULT_PATTERN_LEGEND: Record<string, BassPatternPlayToken[]> = {
  B: ["bass:1"],
  A: ["bass:5"],
  T: ["bass:3"],
  K: ["counter:3"],
  C: ["chord"],
  X: ["bass:1", "chord"],
  z: ["rest"],
};

function accentGain(accent: BassPatternAccent | undefined) {
  if (accent === ">" || accent === "strong") return 1.25;
  if (accent === "marcato" || accent === "^") return 1.35;
  if (accent === "." || accent === "weak") return 0.8;
  if (accent === "ghost") return 0.45;
  return 1;
}

const TICKS_PER_METER_UNIT = 5040;
const SUPPORTED_RHYTHM_DENOMINATORS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12,
]);

type ParsedRhythmicValue = {
  value: number;
  ticks: number;
};

function roundRhythm(value: number) {
  return Number(value.toFixed(6));
}

function parseFractionText(text: string): number | undefined {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d+)(?:\/(\d+))?$/);
  if (!match) return undefined;
  const numerator = Number(match[1]);
  const denominator = match[2] ? Number(match[2]) : 1;
  if (
    !Number.isInteger(numerator) ||
    !Number.isInteger(denominator) ||
    denominator <= 0
  )
    return undefined;
  if (!SUPPORTED_RHYTHM_DENOMINATORS.has(denominator)) return undefined;
  return numerator / denominator;
}

export function parseBassPatternRhythmicValue(
  value: BassPatternRhythmicValue,
): ParsedRhythmicValue | undefined {
  let numericValue: number | undefined;

  if (typeof value === "number") {
    numericValue = value;
  } else if (typeof value === "string") {
    const parts = value
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return undefined;
    numericValue = 0;
    for (const part of parts) {
      const parsed = parseFractionText(part);
      if (parsed === undefined) return undefined;
      numericValue += parsed;
    }
  } else {
    return undefined;
  }

  if (!Number.isFinite(numericValue)) return undefined;
  const ticks = Math.round(numericValue * TICKS_PER_METER_UNIT);
  if (Math.abs(ticks / TICKS_PER_METER_UNIT - numericValue) > 0.000001)
    return undefined;
  return { value: roundRhythm(ticks / TICKS_PER_METER_UNIT), ticks };
}

function parsePatternDurationSuffix(
  durationText: string | undefined,
  dotted: boolean,
) {
  let duration: BassPatternRhythmicValue = 1;
  if (durationText) {
    if (durationText.startsWith("/")) {
      duration = `1/${durationText.slice(1)}`;
    } else {
      duration = durationText;
    }
  }

  const parsed = parseBassPatternRhythmicValue(duration);
  if (!parsed) return undefined;
  const value = dotted ? parsed.value * 1.5 : parsed.value;
  return parseBassPatternRhythmicValue(roundRhythm(value));
}

function normalizeLegendValue(
  value: BassPatternPlayToken[] | string | undefined,
): BassPatternPlayToken[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return undefined;
}

function playTokensForCompactSymbol(
  symbolText: string,
  legend: Record<
    string,
    BassPatternPlayToken[] | string
  > = DEFAULT_PATTERN_LEGEND,
): BassPatternPlayToken[] {
  if (symbolText.startsWith("[") && symbolText.endsWith("]")) {
    return symbolText
      .slice(1, -1)
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean)
      .flatMap((part) => normalizeLegendValue(legend[part]) ?? [part]);
  }

  return normalizeLegendValue(legend[symbolText]) ?? [symbolText];
}

function parseBassPatternString(
  patternText: string,
  legend: Record<
    string,
    BassPatternPlayToken[] | string
  > = DEFAULT_PATTERN_LEGEND,
): NormalizedBassPatternStep[] {
  const tokens = patternText
    .replace(/\|/g, " | ")
    .replace(/(\[[^\]]+\](?:(?:\d+(?:\/\d+)?)|(?:\/\d+))?\.?~?)/g, " $1 ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const steps: NormalizedBassPatternStep[] = [];
  let t = 0;
  let pendingAccent: BassPatternAccent | undefined;

  tokens.forEach((rawToken) => {
    if (rawToken === "|") return;

    let token = rawToken;
    while (/^[>^.!]/.test(token)) {
      const marker = token[0];
      pendingAccent = marker === "!" ? "strong" : (marker as BassPatternAccent);
      token = token.slice(1);
    }

    let tie: NormalizedBassPatternStep["tie"] | undefined;
    if (token.endsWith("~")) {
      tie = "start";
      token = token.slice(0, -1);
    }

    const match = token.match(
      /^(\[[^\]]+\]|[A-Za-z])((?:\d+(?:\/\d+)?)|(?:\/\d+))?(\.)?$/,
    );
    if (!match) return;

    const symbol = match[1];
    const durationText = match[2];
    const dotted = Boolean(match[3]);
    const basePlay = playTokensForCompactSymbol(symbol, legend);
    const duration = parsePatternDurationSuffix(durationText, dotted);
    if (!duration || duration.value <= 0) return;

    steps.push({
      t: roundRhythm(t),
      d: duration.value,
      play: basePlay,
      ...(pendingAccent ? { accent: pendingAccent } : {}),
      ...(tie ? { tie } : {}),
    });
    pendingAccent = undefined;
    t = roundRhythm(t + duration.value);
  });

  return steps;
}

export function normalizedPatternSteps(
  pattern: BassPatternDefinition,
): NormalizedBassPatternStep[] {
  if (pattern.steps && pattern.steps.length > 0) {
    return pattern.steps.flatMap((step) => {
      const parsedT = parseBassPatternRhythmicValue(step.t);
      const parsedD = parseBassPatternRhythmicValue(step.d);
      if (!parsedT || !parsedD) return [];
      return [
        {
          t: parsedT.value,
          d: parsedD.value,
          play: step.play,
          ...(step.accent ? { accent: step.accent } : {}),
          ...(step.tie ? { tie: step.tie } : {}),
        },
      ];
    });
  }
  if (pattern.pattern)
    return parseBassPatternString(
      pattern.pattern,
      pattern.legend ?? DEFAULT_PATTERN_LEGEND,
    );
  return [];
}

function isKnownPlayToken(token: BassPatternPlayToken) {
  return (
    token === "chord" ||
    token === "chord:simple" ||
    token === "chord:full" ||
    token === "rest" ||
    /^bass:(b|#)?[1-7]$/.test(token) ||
    /^counter:(b|#)?[1-7]$/.test(token)
  );
}

function isValidMeter(meter: string) {
  const match = meter.match(/^(\d+)\/(\d+)$/);
  if (!match) return false;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  return (
    Number.isInteger(numerator) &&
    numerator > 0 &&
    [1, 2, 4, 8, 16].includes(denominator)
  );
}

export function meterUnitsPerBarForPattern(
  pattern: Pick<BassPatternDefinition, "meter">,
) {
  return Number(pattern.meter.split("/")[0] || 4);
}

export function patternBarCount(pattern: Pick<BassPatternDefinition, "bars">) {
  return Math.max(1, Math.round(Number(pattern.bars ?? 1)));
}

export function patternUnitsForPattern(
  pattern: Pick<BassPatternDefinition, "meter" | "bars">,
) {
  return meterUnitsPerBarForPattern(pattern) * patternBarCount(pattern);
}

export function validateBassPatternLibrary(
  library: BassPatternLibrary,
): string[] {
  const errors: string[] = [];

  if (!library || library.version !== 2)
    errors.push('Bass pattern library must use "version": 2.');
  if (!Array.isArray(library?.patterns)) {
    errors.push('Bass pattern library must contain a "patterns" array.');
    return errors;
  }

  const ids = new Set<string>();
  library.patterns.forEach((pattern, patternIndex) => {
    const name =
      typeof pattern?.name === "string" && pattern.name.trim()
        ? pattern.name
        : `pattern #${patternIndex + 1}`;

    if (typeof pattern?.id !== "string" || !pattern.id.trim()) {
      errors.push(`${name}: missing id.`);
    } else if (ids.has(pattern.id)) {
      errors.push(`${name}: duplicate id "${pattern.id}".`);
    } else {
      ids.add(pattern.id);
    }

    if (typeof pattern?.name !== "string" || !pattern.name.trim())
      errors.push(`${name}: missing name.`);
    if (typeof pattern?.meter !== "string" || !isValidMeter(pattern.meter))
      errors.push(`${name}: invalid meter "${pattern?.meter ?? ""}".`);

    if (
      pattern.bars !== undefined &&
      (!Number.isInteger(Number(pattern.bars)) || Number(pattern.bars) < 1)
    ) {
      errors.push(`${name}: bars must be a positive integer when provided.`);
    }

    const unitsPerBar =
      typeof pattern?.meter === "string" && isValidMeter(pattern.meter)
        ? Number(pattern.meter.split("/")[0])
        : undefined;
    const totalPatternUnits =
      unitsPerBar !== undefined
        ? unitsPerBar * patternBarCount(pattern)
        : undefined;

    if (pattern.pattern && pattern.steps && pattern.steps.length > 0) {
      errors.push(`${name}: use either pattern or steps, not both.`);
    }

    const steps = normalizedPatternSteps({
      ...pattern,
      legend: pattern.legend ?? library.legend,
    });
    if (steps.length === 0)
      errors.push(`${name}: no playable pattern string or steps.`);

    steps.forEach((step, stepIndex) => {
      const prefix = `${name}, step ${stepIndex + 1}`;
      const parsedT = parseBassPatternRhythmicValue(step.t);
      const parsedD = parseBassPatternRhythmicValue(step.d);
      if (!parsedT || parsedT.value < 0)
        errors.push(
          `${prefix}: t must be a non-negative number or fraction string.`,
        );
      if (!parsedD || parsedD.value <= 0)
        errors.push(
          `${prefix}: d must be a positive number or fraction string.`,
        );
      if (
        parsedT &&
        parsedD &&
        totalPatternUnits !== undefined &&
        parsedT.value + parsedD.value > totalPatternUnits + 0.000001
      ) {
        errors.push(
          `${prefix}: step extends past the end of the ${pattern.meter}${patternBarCount(pattern) > 1 ? ` × ${patternBarCount(pattern)} bars` : ""} pattern.`,
        );
      }
      if (!Array.isArray(step.play) || step.play.length === 0) {
        errors.push(`${prefix}: play must be a non-empty array.`);
      } else {
        if (step.play.includes("rest") && step.play.length > 1)
          errors.push(
            `${prefix}: rest cannot be combined with other play tokens.`,
          );
        step.play.forEach((token) => {
          if (typeof token !== "string" || !isKnownPlayToken(token))
            errors.push(`${prefix}: unknown play token "${String(token)}".`);
        });
      }
      if (
        step.accent &&
        ![">", "^", ".", "strong", "weak", "marcato", "ghost"].includes(
          step.accent,
        )
      ) {
        errors.push(`${prefix}: invalid accent "${step.accent}".`);
      }
      if (step.tie && !["start", "stop", "continue"].includes(step.tie)) {
        errors.push(`${prefix}: invalid tie marker "${step.tie}".`);
      }
    });
  });

  return errors;
}

function labelForPlayTokens(tokens: BassPatternPlayToken[]) {
  if (tokens.includes("rest")) return "rest";
  return tokens
    .map((token) => {
      if (token === "bass:1") return "root bass";
      if (token === "bass:3") return "third bass";
      if (token === "bass:5") return "fifth bass";
      if (token === "bass:b7") return "flat-seven bass";
      if (token === "counter:1") return "root counterbass";
      if (token === "counter:3") return "third counterbass";
      if (token === "chord" || token === "chord:simple") return "chord";
      if (token === "chord:full") return "full chord";
      return token;
    })
    .join(" + ");
}

function bassIntervalForToken(token: BassPatternPlayToken) {
  const match = token.match(/^bass:(b|#)?(\d+)$/);
  if (!match) return undefined;

  const accidental = match[1] === "#" ? 1 : match[1] === "b" ? -1 : 0;
  const degree = Number(match[2]);
  const intervals: Record<number, number> = {
    1: 0,
    2: 2,
    3: 4,
    4: 5,
    5: 7,
    6: 9,
    7: 11,
  };
  const interval = intervals[degree];
  return interval === undefined ? undefined : interval + accidental;
}

function selectButtonsForPlayTokens(
  tokens: BassPatternPlayToken[],
  buttons: DiagramButton[],
  chordRoot: string,
  chordPattern: FinderChordPattern,
  progressionSymbol: string,
  chordVoicing: BassPatternChordVoicing,
  reference: DiagramButton | undefined,
  previousBass: DiagramButton | undefined,
) {
  const selected: DiagramButton[] = [];
  const missing: string[] = [];
  let nextPreviousBass = previousBass;

  tokens.forEach((token) => {
    if (token === "rest") return;

    const bassInterval = bassIntervalForToken(token);
    if (bassInterval !== undefined) {
      const pitch = pitchClassAt(pitchIndex(chordRoot) + bassInterval);
      const bass = closestBassButton(
        buttons,
        pitch,
        reference,
        nextPreviousBass,
        "root",
      );
      if (bass) {
        selected.push(bass);
        nextPreviousBass = bass;
      } else {
        missing.push(`${pitch} bass`);
      }
      return;
    }

    if (token.startsWith("counter:")) {
      const degree = token.split(":")[1] ?? "3";
      const interval =
        degree === "1"
          ? 0
          : degree === "3"
            ? 4
            : (bassIntervalForToken(`bass:${degree}`) ?? 0);
      const pitch = pitchClassAt(pitchIndex(chordRoot) + interval);
      const counterBass = closestBassButton(
        buttons,
        pitch,
        reference,
        nextPreviousBass,
        "counterbass",
      );
      if (counterBass) {
        selected.push(counterBass);
        nextPreviousBass = counterBass;
      } else {
        missing.push(`${pitch} counterbass`);
      }
      return;
    }

    if (
      token === "chord" ||
      token === "chord:simple" ||
      token === "chord:full"
    ) {
      const effectiveVoicing =
        token === "chord:full"
          ? "full"
          : token === "chord:simple"
            ? "simple"
            : chordVoicing;
      const chordButtons = chordButtonsForSymbol(
        buttons,
        chordRoot,
        chordPattern,
        effectiveVoicing,
        reference,
      );
      if (chordButtons.length > 0) selected.push(...chordButtons);
      else missing.push(`${progressionSymbol} chord`);
    }
  });

  return { selected: uniqueButtons(selected), missing, nextPreviousBass };
}

function chordSuffixForPattern(pattern: FinderChordPattern) {
  if (pattern === "minor-triad") return "m";
  if (pattern === "dominant7") return "7";
  if (pattern === "major6") return "6";
  if (pattern === "minor6") return "m6";
  if (pattern === "dominant7b5") return "7b5";
  if (pattern === "dominant7b9") return "7b9";
  if (pattern === "dominant9") return "9";
  if (pattern === "dominant9sus4") return "9sus4";
  if (pattern === "dominant11") return "11";
  if (pattern === "major7") return "maj7";
  if (pattern === "major9") return "maj9";
  if (pattern === "major7add9") return "maj7add9";
  if (pattern === "minor7") return "m7";
  if (pattern === "minorMajor7") return "mMaj7";
  if (pattern === "minor7b5") return "m7b5";
  if (pattern === "minor9") return "m9";
  if (pattern === "minorMajor9") return "mMaj9";
  if (pattern === "diminished-triad") return "dim";
  if (pattern === "diminished7") return "dim7";
  if (pattern === "augmented-triad") return "aug";
  if (pattern === "sus4") return "sus4";
  return "";
}

function resolvedChordName(root: string, pattern: FinderChordPattern) {
  return `${root}${chordSuffixForPattern(pattern)}`;
}

export function makeBassPatternEvents(
  buttons: DiagramButton[],
  pattern: BassPatternDefinition,
  progression: ChordProgressionDefinition,
  keyRootPitchClass: string,
  chordVoicing: BassPatternChordVoicing = "simple",
  repeatsPerChordOverride?: number,
): BassPatternPlaybackEvent[] {
  const events: BassPatternPlaybackEvent[] = [];
  const reference = chooseBassPatternReferenceButton(
    buttons,
    keyRootPitchClass,
  );
  const patternSteps = normalizedPatternSteps(pattern);
  let currentBeat = 0;
  let previousBass: DiagramButton | undefined = reference;

  chordProgressionSteps(progression).forEach((progressionStep) => {
    const chord = resolveRomanChord(progressionStep.symbol, keyRootPitchClass);
    const repeatsPerChord = Math.max(
      1,
      Math.round(repeatsPerChordOverride ?? progressionStep.bars ?? 1),
    );
    const meterUnitsPerBar = meterUnitsPerBarForPattern(pattern);
    const patternBars = patternBarCount(pattern);
    const patternUnits = meterUnitsPerBar * patternBars;

    for (let repeatIndex = 0; repeatIndex < repeatsPerChord; repeatIndex += 1) {
      const patternStartBeat = currentBeat + repeatIndex * patternUnits;
      patternSteps.forEach((step) => {
        const { selected, missing, nextPreviousBass } =
          selectButtonsForPlayTokens(
            step.play,
            buttons,
            chord.root,
            chord.pattern,
            progressionStep.symbol,
            chordVoicing,
            reference,
            previousBass,
          );
        previousBass = nextPreviousBass;

        const absoluteStartBeat = patternStartBeat + step.t;
        const resolvedLabel = resolvedChordName(chord.root, chord.pattern);

        events.push({
          index: events.length,
          startBeat: absoluteStartBeat,
          durationBeats: step.d,
          barNumber: Math.floor(absoluteStartBeat / meterUnitsPerBar) + 1,
          unitInBar: roundRhythm(absoluteStartBeat % meterUnitsPerBar),
          progressionSymbol: progressionStep.symbol,
          resolvedChordLabel: resolvedLabel,
          buttons: selected,
          label: `${resolvedLabel} · ${labelForPlayTokens(step.play)}`,
          missing,
          play: step.play,
          accent: step.accent,
          tie: step.tie,
          gain: accentGain(step.accent),
        });
      });
    }

    currentBeat += repeatsPerChord * patternUnits;
  });

  return events
    .sort((a, b) => a.startBeat - b.startBeat || a.index - b.index)
    .map((event, index) => ({
      ...event,
      index,
    }));
}

function escapeAbcText(text: string) {
  return text.replace(/"/g, "'");
}

function abcAccidentalNoteName(pitchClass: string) {
  const letter = pitchClass[0] ?? "C";
  if (pitchClass.includes("#")) return `^${letter}`;
  if (pitchClass.includes("b")) return `_${letter}`;
  return letter;
}

function abcPitchForMidi(pitchClass: string, midiNumber: number) {
  const abcBase = abcAccidentalNoteName(pitchClass);
  const octave = Math.floor(midiNumber / 12) - 1;

  if (octave < 4) {
    return `${abcBase}${",".repeat(4 - octave)}`;
  }

  if (octave === 4) {
    return abcBase;
  }

  return `${abcBase.toLowerCase()}${"'".repeat(octave - 5)}`;
}

function stradellaNotationPitch(pitchClass: string, kind: "bass" | "chord") {
  const pitchIndexValue = pitchIndex(pitchClass);
  const normalizedPitchClass =
    pitchIndexValue >= 0 ? pitchClassAt(pitchIndexValue) : "C";
  const normalizedIndex = pitchIndex(normalizedPitchClass);

  // Bass-clef middle line is D3. In this Stradella convention,
  // fundamental and counterbass buttons use the first occurrence at or below
  // that line; chord buttons use the first occurrence above it.
  const middleLineD3 = 50;
  if (kind === "bass") {
    for (let midi = middleLineD3; midi >= 24; midi -= 1) {
      if (((midi % 12) + 12) % 12 === normalizedIndex) {
        return abcPitchForMidi(normalizedPitchClass, midi);
      }
    }
  } else {
    for (let midi = middleLineD3 + 1; midi <= 72; midi += 1) {
      if (((midi % 12) + 12) % 12 === normalizedIndex) {
        return abcPitchForMidi(normalizedPitchClass, midi);
      }
    }
  }

  return abcPitchForMidi(normalizedPitchClass, kind === "bass" ? 48 : 52);
}

function abcDuration(duration: number) {
  const rounded = roundRhythm(duration);
  if (rounded === 1) return "";
  if (Number.isInteger(rounded)) return String(rounded);
  const denominatorLimit = 32;
  for (let denominator = 2; denominator <= denominatorLimit; denominator += 1) {
    const numerator = Math.round(rounded * denominator);
    if (Math.abs(numerator / denominator - rounded) < 0.0001) {
      if (numerator === 1) return `/${denominator}`;
      return `${numerator}/${denominator}`;
    }
  }
  return String(rounded);
}

function abcAccentDecoration(accent: BassPatternAccent | undefined) {
  if (accent === ">" || accent === "strong") return "!accent!";
  if (accent === "^" || accent === "marcato") return "!marcato!";
  if (accent === "." || accent === "weak") return "!tenuto!";
  if (accent === "ghost") return "!pp!";
  return "";
}

function abcTokenForEvent(event: BassPatternPlaybackEvent) {
  if (event.play.includes("rest") || event.buttons.length === 0) {
    return `z${abcDuration(event.durationBeats)}`;
  }

  const chordLabel = event.buttons.some((button) =>
    button.kind.startsWith("chord-"),
  )
    ? `"${escapeAbcText(event.resolvedChordLabel)}"`
    : "";
  const bassNotes = event.buttons
    .filter(
      (button) =>
        button.kind === "bass-root" || button.kind === "bass-counterbass",
    )
    .map((button) => abcAccidentalNoteName(button.pitchClass ?? "C"));
  const noteBody =
    bassNotes.length === 0
      ? "z"
      : bassNotes.length === 1
        ? bassNotes[0]
        : `[${bassNotes.join("")}]`;
  const tie = event.tie === "start" || event.tie === "continue" ? "-" : "";
  const accent = abcAccentDecoration(event.accent);
  return `${accent}${chordLabel}${noteBody}${abcDuration(event.durationBeats)}${tie}`;
}

export function bassPatternEventsToAbc(
  pattern: BassPatternDefinition,
  progression: ChordProgressionDefinition,
  events: BassPatternPlaybackEvent[],
  keyRootPitchClass: string,
  repeatsPerChord: number,
  tempoBpm: number,
) {
  const [meterNumerator, meterDenominatorRaw] = pattern.meter.split("/");
  const denominator = Number(meterDenominatorRaw ?? 4);
  const meterUnitsPerBar = Number(meterNumerator || 4);
  const unitLength = `1/${denominator}`;
  const groupedByBar = new Map<number, BassPatternPlaybackEvent[]>();
  events.forEach((event) => {
    const group = groupedByBar.get(event.barNumber) ?? [];
    group.push(event);
    groupedByBar.set(event.barNumber, group);
  });

  const bodyLines: string[] = [];
  [...groupedByBar.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([barNumber, barEvents]) => {
      const sorted = [...barEvents].sort(
        (a, b) => a.unitInBar - b.unitInBar || a.index - b.index,
      );
      const tokens: string[] = [];
      let cursor = 0;
      sorted.forEach((event) => {
        const gap = event.unitInBar - cursor;
        if (gap > 0.0001) tokens.push(`x${abcDuration(gap)}`);
        tokens.push(abcTokenForEvent(event));
        cursor = Math.max(cursor, event.unitInBar + event.durationBeats);
      });
      const trailing = meterUnitsPerBar - cursor;
      if (trailing > 0.0001) tokens.push(`z${abcDuration(trailing)}`);
      bodyLines.push(
        `| ${tokens.join(" ")} ` +
          (barNumber === Math.max(...groupedByBar.keys()) ? "|" : ""),
      );
    });

  const progressionSummary = chordProgressionSteps(progression)
    .map((step) => step.symbol)
    .join(" ");
  return [
    "X:1",
    `T:${escapeAbcText(pattern.name)} over ${escapeAbcText(progression.name)}`,
    `% Root: ${keyRootPitchClass}`,
    `% Progression: ${progressionSummary}`,
    `% Repeats per chord: ${repeatsPerChord}`,
    `% Pattern: ${pattern.id}`,
    `M:${pattern.meter}`,
    `L:${unitLength}`,
    `Q:1/4=${Math.max(30, Math.round(tempoBpm))}`,
    `K:${keyRootPitchClass}`,
    bodyLines.join("\n") || "z",
    "",
  ].join("\n");
}

function abcLowerBassNoteName(pitchClass: string) {
  return stradellaNotationPitch(pitchClass, "bass");
}

function abcUpperChordNoteName(pitchClass: string) {
  return stradellaNotationPitch(pitchClass, "chord");
}

function chordButtonAbcAnnotation(button: DiagramButton | undefined) {
  if (!button) return "";
  if (button.kind === "chord-minor") return '"^m"';
  if (button.kind === "chord-dominant7") return '"^7"';
  if (button.kind === "chord-diminished7") return '"^d"';
  if (button.kind === "chord-major") return '"^M"';
  return "";
}

function abcBassVoiceTokenForEvent(event: BassPatternPlaybackEvent) {
  const bassButtons = event.buttons.filter(
    (button) =>
      button.kind === "bass-root" || button.kind === "bass-counterbass",
  );

  if (event.play.includes("rest")) {
    return `z${abcDuration(event.durationBeats)}`;
  }

  if (bassButtons.length === 0) {
    return `x${abcDuration(event.durationBeats)}`;
  }

  const noteNames = bassButtons.map((button) =>
    abcLowerBassNoteName(button.pitchClass ?? "C"),
  );
  const noteBody =
    noteNames.length === 1 ? noteNames[0] : `[${noteNames.join("")}]`;
  const accent = abcAccentDecoration(event.accent);
  const tie = event.tie === "start" || event.tie === "continue" ? "-" : "";
  return `${accent}${noteBody}${abcDuration(event.durationBeats)}${tie}`;
}

function abcChordVoiceTokenForEvent(event: BassPatternPlaybackEvent) {
  const chordButtons = event.buttons.filter((button) =>
    button.kind.startsWith("chord-"),
  );

  if (event.play.includes("rest") || chordButtons.length === 0) {
    return `x${abcDuration(event.durationBeats)}`;
  }

  const noteNames = chordButtons.map((button) =>
    abcUpperChordNoteName(button.chordRoot ?? button.pitchClass ?? "C"),
  );
  const noteBody =
    noteNames.length === 1 ? noteNames[0] : `[${noteNames.join("")}]`;
  const annotation = chordButtonAbcAnnotation(chordButtons[0]);
  const accent = abcAccentDecoration(event.accent);
  const tie = event.tie === "start" || event.tie === "continue" ? "-" : "";
  return `${annotation}${accent}${noteBody}${abcDuration(event.durationBeats)}${tie}`;
}

type AbcBarTokenPart = {
  token: string;
  beamable: boolean;
};

function isSilentAbcToken(token: string) {
  return token.startsWith("x") || token.startsWith("z");
}

function abcVoiceBarTokens(
  barEvents: BassPatternPlaybackEvent[],
  meterUnitsPerBar: number,
  meterDenominator: number,
  tokenForEvent: (event: BassPatternPlaybackEvent) => string,
) {
  const parts: AbcBarTokenPart[] = [];
  let cursor = 0;
  const isBeamableDuration = (durationUnits: number) =>
    durationUnits / meterDenominator <= 1 / 8 + 0.0001;

  [...barEvents]
    .sort((a, b) => a.unitInBar - b.unitInBar || a.index - b.index)
    .forEach((event) => {
      const gap = event.unitInBar - cursor;
      if (gap > 0.0001) {
        parts.push({ token: `x${abcDuration(gap)}`, beamable: false });
      }

      const token = tokenForEvent(event);
      const beamable =
        !event.play.includes("rest") &&
        !isSilentAbcToken(token) &&
        isBeamableDuration(event.durationBeats);
      parts.push({ token, beamable });
      cursor = Math.max(cursor, event.unitInBar + event.durationBeats);
    });

  const trailing = meterUnitsPerBar - cursor;
  if (trailing > 0.0001) {
    parts.push({ token: `x${abcDuration(trailing)}`, beamable: false });
  }

  if (parts.length === 0) return "x";

  return parts.reduce((line, part, index) => {
    if (index === 0) return part.token;
    const previous = parts[index - 1];
    const separator = previous.beamable && part.beamable ? "" : " ";
    return `${line}${separator}${part.token}`;
  }, "");
}

export type StradellaNotationAbcOptions = {
  includeTitle?: boolean;
  includeDescription?: boolean;
  includeSummary?: boolean;
  barsPerLine?: number;
  chordFontSize?: number;
  titleFontSize?: number;
  staffSeparator?: number;
};

export function bassPatternEventsToStradellaNotationAbc(
  pattern: BassPatternDefinition,
  progression: ChordProgressionDefinition,
  events: BassPatternPlaybackEvent[],
  keyRootPitchClass: string,
  repeatsPerChord: number,
  tempoBpm: number,
  loopMode: "once" | "fixed" | "infinite" = "once",
  loopCount = 1,
  options: StradellaNotationAbcOptions = {},
) {
  const [meterNumerator, meterDenominatorRaw] = pattern.meter.split("/");
  const denominator = Number(meterDenominatorRaw ?? 4);
  const meterUnitsPerBar = Number(meterNumerator || 4);
  const unitLength = `1/${denominator}`;
  const includeTitle = options.includeTitle ?? true;
  const includeDescription = options.includeDescription ?? false;
  const includeSummary = options.includeSummary ?? false;
  const barsPerLine = Math.max(
    1,
    Math.min(8, Math.round(options.barsPerLine ?? 4)),
  );
  const chordFontSize = Math.max(
    8,
    Math.min(24, Math.round(options.chordFontSize ?? 11)),
  );
  const titleFontSize = Math.max(
    10,
    Math.min(24, Math.round(options.titleFontSize ?? 14)),
  );
  const staffSeparator = Math.max(
    8,
    Math.min(32, Math.round(options.staffSeparator ?? 14)),
  );
  const groupedByBar = new Map<number, BassPatternPlaybackEvent[]>();
  events.forEach((event) => {
    const group = groupedByBar.get(event.barNumber) ?? [];
    group.push(event);
    groupedByBar.set(event.barNumber, group);
  });

  const barNumbers = [...groupedByBar.keys()].sort((a, b) => a - b);
  const useRepeatSigns = loopMode !== "once";
  const barPrefix = (index: number) =>
    useRepeatSigns && index === 0 ? "|:" : "|";
  const barSuffix = (index: number) =>
    useRepeatSigns && index === barNumbers.length - 1 ? ":|" : "";
  const lineBreakBeforeBar = (index: number) =>
    index > 0 && index % barsPerLine === 0 ? "\n" : "";
  const bassBars = barNumbers.map(
    (barNumber, index) =>
      `${lineBreakBeforeBar(index)}${barPrefix(index)} ${abcVoiceBarTokens(groupedByBar.get(barNumber) ?? [], meterUnitsPerBar, denominator, abcBassVoiceTokenForEvent)} ${barSuffix(index)}`,
  );
  const chordBars = barNumbers.map(
    (barNumber, index) =>
      `${lineBreakBeforeBar(index)}${barPrefix(index)} ${abcVoiceBarTokens(groupedByBar.get(barNumber) ?? [], meterUnitsPerBar, denominator, abcChordVoiceTokenForEvent)} ${barSuffix(index)}`,
  );
  const summaryLine = includeSummary
    ? `W: ${progression.name} · ${pattern.name} · ${barNumbers.length} bar${barNumbers.length === 1 ? "" : "s"} · Root ${keyRootPitchClass} · ${repeatsPerChord} repeat${repeatsPerChord === 1 ? "" : "s"} per chord · ${pattern.meter}`
    : "";
  const descriptionLine =
    includeDescription && pattern.description
      ? `W: ${pattern.description}`
      : "";
  void tempoBpm;
  void loopCount;

  return [
    "X:1",
    `%%titlefont sans-serif ${titleFontSize}`,
    `%%subtitlefont sans-serif ${Math.max(9, titleFontSize - 2)}`,
    `%%gchordfont sans-serif ${chordFontSize}`,
    `%%annotationfont sans-serif ${Math.max(8, chordFontSize - 1)}`,
    includeTitle ? `T:${pattern.name} over ${progression.name}` : "",
    "%%score (1 2)",
    `%%staffsep ${staffSeparator}`,
    "%%stretchlast 0",
    `M:${pattern.meter}`,
    `L:${unitLength}`,
    `K:${keyRootPitchClass} clef=bass`,
    "V:1 clef=bass stem=down",
    "V:2 clef=bass stem=up",
    `[V:1] ${bassBars.join("")}`,
    `[V:2] ${chordBars.join("")}`,
    descriptionLine,
    summaryLine,
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function lilypondEscapeText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function fractionFromNumber(value: number, maxDenominator = 5040) {
  if (!Number.isFinite(value)) return { numerator: 0, denominator: 1 };
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  let bestNumerator = Math.round(absolute);
  let bestDenominator = 1;
  let bestError = Math.abs(bestNumerator - absolute);

  for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
    const numerator = Math.round(absolute * denominator);
    const error = Math.abs(numerator / denominator - absolute);
    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
      if (error < 1e-8) break;
    }
  }

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.abs(bestNumerator), bestDenominator) || 1;
  return {
    numerator: sign * (bestNumerator / divisor),
    denominator: bestDenominator / divisor,
  };
}

function lilypondDurationForMeterUnits(
  units: number,
  meterDenominator: number,
) {
  const rounded = roundRhythm(units);
  const fraction = fractionFromNumber(rounded);
  if (fraction.denominator === 1 && fraction.numerator === 1)
    return String(meterDenominator);
  if (fraction.denominator === 1)
    return `${meterDenominator}*${fraction.numerator}`;
  return `${meterDenominator}*${fraction.numerator}/${fraction.denominator}`;
}

function lilypondPitchName(pitchClass: string) {
  const names: Record<string, string> = {
    C: "c",
    "C#": "cis",
    Db: "des",
    D: "d",
    "D#": "dis",
    Eb: "ees",
    E: "e",
    F: "f",
    "F#": "fis",
    Gb: "ges",
    G: "g",
    "G#": "gis",
    Ab: "aes",
    A: "a",
    "A#": "ais",
    Bb: "bes",
    B: "b",
  };
  return names[pitchClass] ?? "c";
}

function lilypondChordName(label: string) {
  const match = label.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return "c";
  const pitch = lilypondPitchName(match[1]);
  const suffix = match[2] ?? "";
  const suffixMap: Array<[RegExp, string]> = [
    [/^mMaj9$/i, ":m.maj9"],
    [/^mMaj7$/i, ":m.maj7"],
    [/^m7b5$/i, ":m7.5-"],
    [/^m9$/i, ":m9"],
    [/^m7$/i, ":m7"],
    [/^m6$/i, ":m6"],
    [/^m$/i, ":m"],
    [/^maj9$/i, ":maj9"],
    [/^maj7add9$/i, ":maj7.9"],
    [/^maj7$/i, ":maj7"],
    [/^7b5$/i, ":7.5-"],
    [/^7b9$/i, ":7.9-"],
    [/^9sus4$/i, ":9sus4"],
    [/^11$/i, ":11"],
    [/^9$/i, ":9"],
    [/^7$/i, ":7"],
    [/^6$/i, ":6"],
    [/^dim7$/i, ":dim7"],
    [/^dim$/i, ":dim"],
    [/^aug$/i, ":aug"],
    [/^sus4$/i, ":sus4"],
  ];
  const mapped = suffixMap.find(([regex]) => regex.test(suffix));
  return `${pitch}${mapped ? mapped[1] : ""}`;
}

function lilypondEventMarkup(event: BassPatternPlaybackEvent) {
  const label = event.play.includes("rest") ? "rest" : event.play.join("+");
  const parts = [label];
  if (event.accent) parts.push(`accent ${event.accent}`);
  if (event.tie) parts.push(`tie ${event.tie}`);
  return lilypondEscapeText(parts.join(" · "));
}

function lilypondTokenForEvent(
  event: BassPatternPlaybackEvent,
  meterDenominator: number,
) {
  const duration = lilypondDurationForMeterUnits(
    event.durationBeats,
    meterDenominator,
  );
  const articulation =
    event.accent === ">" || event.accent === "strong" ? "->" : "";
  const tie = event.tie === "start" || event.tie === "continue" ? "~" : "";
  if (event.play.includes("rest") || event.buttons.length === 0) {
    return `r${duration}`;
  }
  return `c${duration}${articulation}${tie}^\\markup \\tiny \"${lilypondEventMarkup(event)}\"`;
}

export function bassPatternEventsToLilyPond(
  pattern: BassPatternDefinition,
  progression: ChordProgressionDefinition,
  events: BassPatternPlaybackEvent[],
  keyRootPitchClass: string,
  repeatsPerChord: number,
  tempoBpm: number,
) {
  const [meterNumeratorRaw, meterDenominatorRaw] = pattern.meter.split("/");
  const meterUnitsPerBar = Number(meterNumeratorRaw || 4);
  const meterDenominator = Number(meterDenominatorRaw || 4);
  const groupedByBar = new Map<number, BassPatternPlaybackEvent[]>();
  events.forEach((event) => {
    const group = groupedByBar.get(event.barNumber) ?? [];
    group.push(event);
    groupedByBar.set(event.barNumber, group);
  });

  const barNumbers = [...groupedByBar.keys()].sort((a, b) => a - b);
  const rhythmBars = barNumbers.map((barNumber) => {
    const sorted = [...(groupedByBar.get(barNumber) ?? [])].sort(
      (a, b) => a.unitInBar - b.unitInBar || a.index - b.index,
    );
    const tokens: string[] = [];
    let cursor = 0;
    sorted.forEach((event) => {
      const gap = event.unitInBar - cursor;
      if (gap > 0.0001)
        tokens.push(`r${lilypondDurationForMeterUnits(gap, meterDenominator)}`);
      tokens.push(lilypondTokenForEvent(event, meterDenominator));
      cursor = Math.max(cursor, event.unitInBar + event.durationBeats);
    });
    const trailing = meterUnitsPerBar - cursor;
    if (trailing > 0.0001)
      tokens.push(
        `r${lilypondDurationForMeterUnits(trailing, meterDenominator)}`,
      );
    return `${tokens.join(" ")} |`;
  });

  const chordBars = barNumbers.map((barNumber) => {
    const firstEvent = (groupedByBar.get(barNumber) ?? [])[0];
    const chord = lilypondChordName(
      firstEvent?.resolvedChordLabel ?? keyRootPitchClass,
    );
    return `${chord}${lilypondDurationForMeterUnits(meterUnitsPerBar, meterDenominator)}`;
  });

  const progressionSummary = chordProgressionSteps(progression)
    .map((step) => step.symbol)
    .join(" ");
  return [
    `\\version "2.24.0"`,
    `% Generated by Accordion Tools Bass Pattern Player`,
    `% Root: ${keyRootPitchClass}`,
    `% Progression: ${progressionSummary}`,
    `% Repeats per chord: ${repeatsPerChord}`,
    `% Pattern: ${pattern.id}`,
    `% This file is an engraving/export view of the selected app state.`,
    ``,
    `\\header {`,
    `  title = \"${lilypondEscapeText(pattern.name)} over ${lilypondEscapeText(progression.name)}\"`,
    `  subtitle = \"Root ${lilypondEscapeText(keyRootPitchClass)} · ${lilypondEscapeText(progressionSummary)} · ${repeatsPerChord} repeat${repeatsPerChord === 1 ? "" : "s"} per chord\"`,
    `  tagline = \"Generated by Accordion Tools\"`,
    `}`,
    ``,
    `chords = \\chordmode {`,
    `  ${chordBars.join(" ")}`,
    `}`,
    ``,
    `patternRhythm = {`,
    `  \\time ${pattern.meter}`,
    `  \\tempo 4 = ${Math.max(30, Math.round(tempoBpm))}`,
    `  ${rhythmBars.join("\n  ") || `r${lilypondDurationForMeterUnits(meterUnitsPerBar, meterDenominator)}`}`,
    `}`,
    ``,
    `\\score {`,
    `  <<`,
    `    \\new ChordNames \\chords`,
    `    \\new RhythmicStaff \\with {`,
    `      \\remove "Time_signature_engraver"`,
    `    } \\patternRhythm`,
    `  >>`,
    `  \\layout { }`,
    `  \\midi { }`,
    `}`,
    ``,
  ].join("\n");
}

function writeVarLength(value: number) {
  const bytes = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function midiPitchForButton(button: DiagramButton) {
  const pitchClass = button.pitchClass ? pitchIndex(button.pitchClass) : 0;
  const baseOctave = button.kind.startsWith("chord-") ? 60 : 48;
  return baseOctave + ((pitchClass + 12) % 12);
}

export function bassPatternEventsToMidiBytes(
  events: BassPatternPlaybackEvent[],
  tempoBpm: number,
) {
  const ppq = 480;
  const microsecondsPerQuarter = Math.round(60000000 / Math.max(30, tempoBpm));
  const track: number[] = [];
  track.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (microsecondsPerQuarter >> 16) & 0xff,
    (microsecondsPerQuarter >> 8) & 0xff,
    microsecondsPerQuarter & 0xff,
  );
  track.push(0x00, 0xc0, 0x20);

  const noteEvents: Array<{
    tick: number;
    type: "on" | "off";
    pitch: number;
    velocity: number;
  }> = [];
  events.forEach((event) => {
    const startTick = Math.round(event.startBeat * ppq);
    const endTick = Math.round((event.startBeat + event.durationBeats) * ppq);
    const velocity = Math.max(20, Math.min(127, Math.round(82 * event.gain)));
    event.buttons.forEach((button) => {
      const pitch = midiPitchForButton(button);
      noteEvents.push({ tick: startTick, type: "on", pitch, velocity });
      noteEvents.push({
        tick: Math.max(startTick + 1, endTick),
        type: "off",
        pitch,
        velocity: 0,
      });
    });
  });

  noteEvents.sort((a, b) => a.tick - b.tick || (a.type === "off" ? -1 : 1));
  let previousTick = 0;
  noteEvents.forEach((event) => {
    track.push(...writeVarLength(Math.max(0, event.tick - previousTick)));
    track.push(
      event.type === "on" ? 0x90 : 0x80,
      event.pitch & 0x7f,
      event.velocity & 0x7f,
    );
    previousTick = event.tick;
  });
  track.push(0x00, 0xff, 0x2f, 0x00);

  const header = [
    0x4d,
    0x54,
    0x68,
    0x64,
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x01,
    (ppq >> 8) & 0xff,
    ppq & 0xff,
  ];
  const trackHeader = [
    0x4d,
    0x54,
    0x72,
    0x6b,
    (track.length >> 24) & 0xff,
    (track.length >> 16) & 0xff,
    (track.length >> 8) & 0xff,
    track.length & 0xff,
  ];
  return new Uint8Array([...header, ...trackHeader, ...track]);
}

export function totalBassPatternBeats(events: BassPatternPlaybackEvent[]) {
  if (events.length === 0) return 0;
  return Math.max(
    ...events.map((event) => event.startBeat + event.durationBeats),
  );
}

export function bassPatternMissingItems(events: BassPatternPlaybackEvent[]) {
  return [...new Set(events.flatMap((event) => event.missing))];
}
