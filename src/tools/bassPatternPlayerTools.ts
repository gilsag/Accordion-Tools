import type { BassPatternChordVoicing, DiagramButton, FinderChordPattern } from "../types";
import { INDEX_TO_PITCH } from "../music";
import { getStradellaChordFinderResult } from "./stradellaChordFinderTools";

export type BassPatternStepAction =
  | "root-bass"
  | "counterbass"
  | "alternate-bass"
  | "chord"
  | "root-and-chord";

export type BassPatternStep = {
  beat: number;
  durationBeats: number;
  action: BassPatternStepAction;
};

export type BassPatternDefinition = {
  id: string;
  name: string;
  beatsPerBar: number;
  description?: string;
  steps: BassPatternStep[];
};

export type ChordProgressionStep = {
  symbol: string;
  bars: number;
};

export type ChordProgressionDefinition = {
  id: string;
  name: string;
  description?: string;
  steps: ChordProgressionStep[];
};

export type BassPatternPlaybackEvent = {
  index: number;
  startBeat: number;
  durationBeats: number;
  buttons: DiagramButton[];
  label: string;
  missing: string[];
};

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
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

export function chooseBassPatternReferenceButton(buttons: DiagramButton[], rootPitchClass: string) {
  const roots = buttons.filter(
    (button) => button.kind === "bass-root" && button.pitchClass === rootPitchClass,
  );
  if (roots.length > 0) return [...roots].sort((a, b) => a.column - b.column || a.row - b.row)[0];

  const bassButtons = buttons.filter(
    (button) => button.kind === "bass-root" || button.kind === "bass-counterbass",
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
  const compact = symbol.replace(/\s+/g, "");
  if (/dim/i.test(compact) || /°/.test(compact)) return /7/.test(compact) ? "diminished7" : "diminished-triad";
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
  if (/6/.test(compact) && compact[0] === compact[0].toLowerCase()) return "minor6";
  if (/6/.test(compact)) return "major6";
  return compact[0] === compact[0].toLowerCase() ? "minor-triad" : "major-triad";
}

export function resolveRomanChord(symbol: string, keyRootPitchClass: string) {
  const compact = symbol.replace(/\s+/g, "");
  const romanMatch = compact.match(/^(b|#)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/);
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
  const root = pitchClassAt(keyIndex + MAJOR_SCALE_INTERVALS[degree] + accidental);
  return {
    root,
    pattern: chordPatternFromRoman(compact),
    label: symbol,
  };
}

function simpleChordButtonKindForPattern(pattern: FinderChordPattern): DiagramButton["kind"] | undefined {
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
  const candidates = buttons.filter((button) => button.kind === kind && button.pitchClass === root);
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
    const simpleButton = simpleKind ? closestChordButton(buttons, root, simpleKind, reference) : undefined;
    return simpleButton ? [simpleButton] : [];
  }

  const result = getStradellaChordFinderResult(buttons, root, pattern, "chord-buttons-only", false);
  if (result.playable && result.playbackButtons.length > 0) return result.playbackButtons;

  const fallback = getStradellaChordFinderResult(buttons, root, pattern, "bass-and-chords", false);
  return fallback.playable ? fallback.playbackButtons.filter((button) => button.kind.startsWith("chord-")) : [];
}

export function makeBassPatternEvents(
  buttons: DiagramButton[],
  pattern: BassPatternDefinition,
  progression: ChordProgressionDefinition,
  keyRootPitchClass: string,
  chordVoicing: BassPatternChordVoicing = "simple",
): BassPatternPlaybackEvent[] {
  const events: BassPatternPlaybackEvent[] = [];
  const reference = chooseBassPatternReferenceButton(buttons, keyRootPitchClass);
  let currentBeat = 0;
  let previousBass: DiagramButton | undefined = reference;

  progression.steps.forEach((progressionStep) => {
    const chord = resolveRomanChord(progressionStep.symbol, keyRootPitchClass);
    const totalBars = Math.max(1, progressionStep.bars || 1);
    const chordButtons = chordButtonsForSymbol(buttons, chord.root, chord.pattern, chordVoicing, reference);
    const rootBass = closestBassButton(buttons, chord.root, reference, previousBass, "root");
    const fifthBass = closestBassButton(buttons, pitchClassAt(pitchIndex(chord.root) + 7), reference, previousBass, "root");

    for (let barIndex = 0; barIndex < totalBars; barIndex += 1) {
      pattern.steps.forEach((step) => {
        const selected: DiagramButton[] = [];
        const missing: string[] = [];

        if (step.action === "root-bass" || step.action === "root-and-chord") {
          if (rootBass) selected.push(rootBass);
          else missing.push(`${chord.root} bass`);
        }

        if (step.action === "counterbass") {
          const counterBass = closestBassButton(buttons, chord.root, reference, previousBass, "counterbass");
          if (counterBass) selected.push(counterBass);
          else if (rootBass) selected.push(rootBass);
          else missing.push(`${chord.root} counterbass`);
        }

        if (step.action === "alternate-bass") {
          if (fifthBass) selected.push(fifthBass);
          else if (rootBass) selected.push(rootBass);
          else missing.push(`${pitchClassAt(pitchIndex(chord.root) + 7)} bass`);
        }

        if (step.action === "chord" || step.action === "root-and-chord") {
          if (chordButtons.length > 0) selected.push(...chordButtons);
          else missing.push(`${progressionStep.symbol} chord`);
        }

        if (selected.some((button) => button.kind === "bass-root" || button.kind === "bass-counterbass")) {
          previousBass = selected.find((button) => button.kind === "bass-root" || button.kind === "bass-counterbass") ?? previousBass;
        }

        events.push({
          index: events.length,
          startBeat: currentBeat + barIndex * pattern.beatsPerBar + step.beat,
          durationBeats: step.durationBeats,
          buttons: uniqueButtons(selected),
          label: `${progressionStep.symbol} · ${step.action}`,
          missing,
        });
      });
    }

    currentBeat += totalBars * pattern.beatsPerBar;
  });

  return events.sort((a, b) => a.startBeat - b.startBeat || a.index - b.index).map((event, index) => ({
    ...event,
    index,
  }));
}

export function totalBassPatternBeats(events: BassPatternPlaybackEvent[]) {
  if (events.length === 0) return 0;
  return Math.max(...events.map((event) => event.startBeat + event.durationBeats));
}

export function bassPatternMissingItems(events: BassPatternPlaybackEvent[]) {
  return [...new Set(events.flatMap((event) => event.missing))];
}
