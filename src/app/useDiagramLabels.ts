import { diagramAutoTitle } from "../i18n/diagramLabels";
import { displayStradellaButtonChord, type ChordDisplayStyle } from "../tools/chordDisplay";
import { formatChordFinderTone } from "../tools/stradellaChordFinder/chordSpelling";
import type { useLanguageSettings } from "../settings/useLanguageSettings";
import type { useInstrumentState } from "../instrument/useInstrumentState";
import type { useStradellaChordFinderState } from "../features/stradellaChordFinder/useStradellaChordFinder";
import type { useTrebleChordFinderState } from "../features/trebleChordFinder/useTrebleChordFinder";
import type { AccidentalMode, ButtonKind, ChordLabelMode, DiagramButton, NotationMode } from "../types";
import { chordTones, formatPitch, INDEX_TO_PITCH, INTERVALS_FROM_C, isChordKind, rowFunction } from "../music";
import { intervalsForChordFinder } from "../music/chordDefinitions";

export type UseDiagramLabelsDeps = Pick<ReturnType<typeof useInstrumentState>,
    "basses" | "side" | "trebleLayout"> &
  Pick<ReturnType<typeof useTrebleChordFinderState>,
    "chordFinderOctave" | "chordFinderPattern" | "chordFinderRoot"> &
  Pick<ReturnType<typeof useLanguageSettings>,
    "language"> &
  Pick<ReturnType<typeof useStradellaChordFinderState>,
    "stradellaChordFinderPattern" | "stradellaChordFinderRoot"> &
  {
    accidental: AccidentalMode;
    chordDisplayStyle: ChordDisplayStyle;
    chordLabelMode: ChordLabelMode;
    isPianoTreble: boolean;
    notation: NotationMode;
    stradellaAccidental: "natural" | "flats" | "sharps";
  };

/** Text for buttons, Finder note lists and automatic titles, following the notation, accidental and chord-label settings. */
export function useDiagramLabels(deps: UseDiagramLabelsDeps) {
  const {
    accidental, basses, chordDisplayStyle, chordFinderOctave, chordFinderPattern, chordFinderRoot,
    chordLabelMode, isPianoTreble, language, notation, side, stradellaAccidental,
    stradellaChordFinderPattern, stradellaChordFinderRoot, trebleLayout,
  } = deps;

  /** Semitones of a pitch class above C (0–11), used for key-independent functional-reference labels. */
  function semiAboveCRef(pitch: string): number {
    return (INDEX_TO_PITCH.indexOf(pitch) - INDEX_TO_PITCH.indexOf("C") + 12) % 12;
  }

  const MAJOR_FUNCTION_REF = ["I","♭II","II","♭III","III","IV","♭V","V","♭VI","VI","♭VII","VII"];
  const MINOR_FUNCTION_REF = ["i","♭ii","ii","♭iii","iii","iv","♭v","v","♭vi","vi","♭vii","vii"];

  function functionalReferenceLabelForChord(kind: ButtonKind, rootPitch: string): string {
    const d = semiAboveCRef(rootPitch);
    if (kind === "chord-major") return MAJOR_FUNCTION_REF[d] ?? "I";
    if (kind === "chord-minor") return MINOR_FUNCTION_REF[d] ?? "i";
    if (kind === "chord-dominant7") return (MAJOR_FUNCTION_REF[d] ?? "I") + "7";
    if (kind === "chord-diminished7") return (MINOR_FUNCTION_REF[d] ?? "i") + "°7";
    return "";
  }

  /** Computes the visible label for one button using notation and chord-label settings. */
  function getMainLabel(button: DiagramButton) {
    // Decided by the button, not the current side: the ABC Player's Both
    // hands view also labels the buttons of the other side.
    const onStradella = button.kind !== "treble-note";
    const labelAccidental = onStradella ? stradellaAccidental : accidental;

    if (onStradella && isChordKind(button.kind)) {
      if (chordLabelMode === "none") return "";

      const root = formatPitch(
        button.chordRoot,
        notation,
        labelAccidental,
        button.chordDisplayName ?? button.chordNaturalName,
      );

      if (chordLabelMode === "root-only") return root;
      if (chordLabelMode === "row-function") return rowFunction(button.kind);
      if (chordLabelMode === "chord-tones") {
        return chordTones(
          button.chordRoot ?? "C",
          button.kind,
          notation,
          labelAccidental,
        );
      }
      if (chordLabelMode === "functional-reference") {
        return functionalReferenceLabelForChord(button.kind, button.chordRoot ?? "C");
      }

      return displayStradellaButtonChord(root, button.kind, chordDisplayStyle);
    }

    // Bass rows: interval mode shows key-independent interval name
    if (
      onStradella &&
      (button.kind === "bass-root" || button.kind === "bass-counterbass") &&
      chordLabelMode === "functional-reference"
    ) {
      return (INTERVALS_FROM_C[button.pitchClass ?? "C"] ?? "").replace(/b/g, "♭");
    }

    return formatPitch(
      button.pitchClass,
      notation,
      labelAccidental,
      button.displayName ?? button.naturalName,
      button.octave,
    );
  }

  /** Finder tone spelling follows chord harmony, never the leftmost bass-button label. */
  function formatStradellaFinderPitch(pitch: string) {
    return formatChordFinderTone(stradellaChordFinderRoot, stradellaChordFinderPattern, pitch, notation, stradellaAccidental);
  }

  /** Formats the Chord Finder pitch list using its requested harmonic context. */
  function formatStradellaFinderPitches(pitches: string[]) {
    if (pitches.length === 0) return "none";
    return pitches.map(formatStradellaFinderPitch).join(", ");
  }

  /** Formats Stradella Scale Finder note names, preserving scale spelling such as E#, B#, and F##. */
  function formatStradellaScaleFinderNames(names: string[], fallbackPitches: string[]) {
    const source = names.length > 0 ? names : fallbackPitches.map((pitch) => formatPitch(pitch, notation, stradellaAccidental));
    if (source.length === 0) return "none";
    return source.map((name) => name.replaceAll("##", "𝄪")).join(", ");
  }

  /** Rewrites pitch-class names in technical finder text using harmonic spelling. */
  function formatStradellaFinderText(text: string) {
    return [...INDEX_TO_PITCH]
      .sort((a, b) => b.length - a.length)
      .reduce((current, pitch) => {
        const escapedPitch = pitch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `(^|[^A-Za-z#])(${escapedPitch})(?![A-Za-z#])`,
          "g",
        );
        return current.replace(
          pattern,
          (_match, prefix) => `${prefix}${formatStradellaFinderPitch(pitch)}`,
        );
      }, text);
  }

  /** Formats the current treble Chord Finder tones with the selected notation. */
  function formatTrebleChordFinderPitches() {
    if (!INDEX_TO_PITCH.includes(chordFinderRoot)) return "none";
    const rootIndex = INDEX_TO_PITCH.indexOf(chordFinderRoot);
    return intervalsForChordFinder(chordFinderPattern)
      .map((interval) => {
        const absolute = chordFinderOctave * 12 + rootIndex + interval;
        const pitch = INDEX_TO_PITCH[((absolute % 12) + 12) % 12];
        const octave = Math.floor(absolute / 12);
        return formatPitch(pitch, notation, accidental, undefined, octave);
      })
      .join(", ");
  }

  /** Builds the automatic title for the current diagram side and preset. */
  function autoTitle() {
    if (side === "stradella") return `${basses}-Bass Stradella`;
    if (isPianoTreble) return "Piano Treble";
    return `${trebleLayout === "c-system" ? "C-system" : "B-system / Bayan"} Treble`;
  }

  function localizedAutoTitle() {
    return diagramAutoTitle(side, basses, trebleLayout, language);
  }

  return {
    getMainLabel, formatStradellaFinderPitches, formatStradellaScaleFinderNames,
    formatStradellaFinderText, formatTrebleChordFinderPitches, autoTitle, localizedAutoTitle,
  };
}
