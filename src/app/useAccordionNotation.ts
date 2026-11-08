import { useCallback, useEffect, useMemo } from "react";
import type { useInstrumentState } from "../instrument/useInstrumentState";
import type { useBassPatternState, useBassPatternResults } from "../features/bassPatternPlayer/useBassPatternPlayer";
import { type useSequenceState, useSequenceResults } from "../features/sequences/useSequenceState";
import type { useAbcPlayerState } from "../features/abcPlayer/useAbcPlayer";
import { renderNotationInto as renderSharedNotation } from "../notation/notationService";
import type { useNotationSettings } from "../notation/useNotationSettings";
import type { DiagramButton } from "../types";
import { INDEX_TO_PITCH } from "../music";
import { bassPatternEventsToStradellaNotationAbc, type StradellaNotationAbcOptions } from "../tools/bassPatternPlayerTools";

export type UseAccordionNotationDeps = Pick<ReturnType<typeof useAbcPlayerState>,
    "abcNotationRef" | "abcRenderedNotationVisible" | "abcText"> &
  Pick<ReturnType<typeof useBassPatternState>,
    "bassPatternBarsPerChord" | "bassPatternLoopCount" | "bassPatternLoopMode" |
    "bassPatternNotationRef" | "bassPatternRenderedNotationVisible" | "bassPatternRoot" |
    "bassPatternTempoBpm"> &
  Pick<ReturnType<typeof useBassPatternResults>,
    "bassPatternEvents" | "selectedBassPattern" | "selectedChordProgression"> &
  Pick<ReturnType<typeof useNotationSettings>,
    "musicNotationBarsPerLine" | "musicNotationChordFontSize" |
    "musicNotationIncludeDescription" | "musicNotationIncludeSummary" |
    "musicNotationIncludeTitle" | "musicNotationScale" | "musicNotationStaffSeparator" |
    "musicNotationStaffWidth" | "musicNotationUseBarsPerLine"> &
  Pick<ReturnType<typeof useSequenceState>,
    "sequenceNotationRef" | "sequenceRenderedNotationVisible"> &
  Pick<ReturnType<typeof useInstrumentState>,
    "side"> &
  {
    sequenceStepsWithButtons: ReturnType<typeof useSequenceResults>;
  };

/** Staff notation for the accordion players: builds the ABC for the Bass Pattern Player and the Sequence tool and renders it, and the ABC Player's own score, into their notation panels when shown. */
export function useAccordionNotation(deps: UseAccordionNotationDeps) {
  const {
    abcNotationRef, abcRenderedNotationVisible, abcText, bassPatternBarsPerChord, bassPatternEvents,
    bassPatternLoopCount, bassPatternLoopMode, bassPatternNotationRef,
    bassPatternRenderedNotationVisible, bassPatternRoot, bassPatternTempoBpm,
    musicNotationBarsPerLine, musicNotationChordFontSize, musicNotationIncludeDescription,
    musicNotationIncludeSummary, musicNotationIncludeTitle, musicNotationScale,
    musicNotationStaffSeparator, musicNotationStaffWidth, musicNotationUseBarsPerLine,
    selectedBassPattern, selectedChordProgression, sequenceNotationRef,
    sequenceRenderedNotationVisible, sequenceStepsWithButtons, side,
  } = deps;

  const musicNotationAbcOptions: StradellaNotationAbcOptions = useMemo(
    () => ({
      includeTitle: musicNotationIncludeTitle,
      includeDescription: musicNotationIncludeDescription,
      includeSummary: musicNotationIncludeSummary,
      barsPerLine: musicNotationUseBarsPerLine ? musicNotationBarsPerLine : 999,
      chordFontSize: musicNotationChordFontSize,
      titleFontSize: 14,
      staffSeparator: musicNotationStaffSeparator,
    }),
    [
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationIncludeTitle,
      musicNotationStaffSeparator,
      musicNotationUseBarsPerLine,
    ],
  );

  const bassPatternRenderedNotationAbc = useMemo(() => {
    if (
      !selectedBassPattern ||
      !selectedChordProgression ||
      bassPatternEvents.length === 0
    )
      return "";
    return bassPatternEventsToStradellaNotationAbc(
      selectedBassPattern,
      selectedChordProgression,
      bassPatternEvents,
      bassPatternRoot,
      bassPatternBarsPerChord,
      bassPatternTempoBpm,
      bassPatternLoopMode,
      bassPatternLoopCount,
      musicNotationAbcOptions,
    );
  }, [
    bassPatternBarsPerChord,
    bassPatternEvents,
    bassPatternLoopCount,
    bassPatternLoopMode,
    bassPatternRoot,
    bassPatternTempoBpm,
    musicNotationAbcOptions,
    selectedBassPattern,
    selectedChordProgression,
  ]);

  const renderNotationInto = useCallback((target: HTMLDivElement | null, abcSource: string) => {
    renderSharedNotation(target, abcSource, musicNotationScale, musicNotationStaffWidth);
  }, [musicNotationScale, musicNotationStaffWidth]);

  function abcNoteNameForButton(button: DiagramButton) {
    const pitchClass = button.pitchClass ?? button.chordRoot ?? "C";
    const accidentalMap: Record<string, string> = {
      C: "C",
      "C#": "^C",
      Db: "_D",
      D: "D",
      "D#": "^D",
      Eb: "_E",
      E: "E",
      F: "F",
      "F#": "^F",
      Gb: "_G",
      G: "G",
      "G#": "^G",
      Ab: "_A",
      A: "A",
      "A#": "^A",
      Bb: "_B",
      B: "B",
    };
    const baseName = accidentalMap[pitchClass] ?? "C";
    const octave = button.soundOctave ?? button.octave ?? 4;
    if (octave >= 5)
      return baseName.toLowerCase() + "'".repeat(Math.max(0, octave - 5));
    if (octave <= 3) return baseName + ",".repeat(Math.max(0, 4 - octave));
    return baseName;
  }

  function stradellaNotationPitchForButton(
    button: DiagramButton,
    kind: "bass" | "chord",
  ) {
    const pitchClass = button.pitchClass ?? button.chordRoot ?? "C";
    const pitchIndexValue = INDEX_TO_PITCH.indexOf(pitchClass);
    const normalizedPitchClass = pitchIndexValue >= 0 ? pitchClass : "C";
    const normalizedIndex = INDEX_TO_PITCH.indexOf(normalizedPitchClass);
    const accidentalMap: Record<string, string> = {
      C: "C",
      "C#": "^C",
      Db: "_D",
      D: "D",
      "D#": "^D",
      Eb: "_E",
      E: "E",
      F: "F",
      "F#": "^F",
      Gb: "_G",
      G: "G",
      "G#": "^G",
      Ab: "_A",
      A: "A",
      "A#": "^A",
      Bb: "_B",
      B: "B",
    };
    const middleLineD3 = 50;
    const start = kind === "bass" ? middleLineD3 : middleLineD3 + 1;
    const end = kind === "bass" ? 24 : 72;
    const step = kind === "bass" ? -1 : 1;
    for (
      let midi = start;
      kind === "bass" ? midi >= end : midi <= end;
      midi += step
    ) {
      if (((midi % 12) + 12) % 12 === normalizedIndex) {
        const abcBase = accidentalMap[normalizedPitchClass] ?? "C";
        const octave = Math.floor(midi / 12) - 1;
        if (octave <= 3)
          return `${abcBase}${",".repeat(Math.max(0, 4 - octave))}`;
        if (octave === 4) return abcBase;
        return `${abcBase.toLowerCase()}${"'".repeat(Math.max(0, octave - 5))}`;
      }
    }
    return kind === "bass" ? "D," : "F";
  }

  function chordButtonAnnotationForButton(button: DiagramButton) {
    if (button.kind === "chord-minor") return '"^m"';
    if (button.kind === "chord-dominant7") return '"^7"';
    if (button.kind === "chord-diminished7") return '"^d"';
    if (button.kind === "chord-major") return '"^M"';
    return "";
  }

  const sequenceRenderedNotationAbc = useMemo(() => {
  function stradellaSequenceBassTokenForButton(button: DiagramButton) {
    if (button.kind === "bass-root" || button.kind === "bass-counterbass") {
      return stradellaNotationPitchForButton(button, "bass");
    }
    return "x";
  }

  function stradellaSequenceChordTokenForButton(button: DiagramButton) {
    if (button.kind.startsWith("chord-")) {
      return `${chordButtonAnnotationForButton(button)}${stradellaNotationPitchForButton(button, "chord")}`;
    }
    return "x";
  }

    if (sequenceStepsWithButtons.length === 0) return "";

    if (side === "stradella") {
      const bassTokens = sequenceStepsWithButtons.map((step) =>
        stradellaSequenceBassTokenForButton(step.button),
      );
      const chordTokens = sequenceStepsWithButtons.map((step) =>
        stradellaSequenceChordTokenForButton(step.button),
      );
      const bassBars: string[] = [];
      const chordBars: string[] = [];
      for (let index = 0; index < sequenceStepsWithButtons.length; index += 4) {
        const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
        bassBars.push(
          `${lineBreak}| ${bassTokens.slice(index, index + 4).join(" ")} `,
        );
        chordBars.push(
          `${lineBreak}| ${chordTokens.slice(index, index + 4).join(" ")} `,
        );
      }
      return [
        "X:1",
        "%%score (1 2)",
        "%%staffsep 16",
        "M:4/4",
        "L:1/4",
        "K:C clef=bass",
        "V:1 clef=bass stem=down",
        "V:2 clef=bass stem=up",
        `[V:1] ${bassBars.join("")} |`,
        `[V:2] ${chordBars.join("")} |`,
        "",
      ].join("\n");
    }

    const tokens = sequenceStepsWithButtons.map((step) =>
      abcNoteNameForButton(step.button),
    );
    const bars: string[] = [];
    for (let index = 0; index < tokens.length; index += 4) {
      const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
      bars.push(`${lineBreak}| ${tokens.slice(index, index + 4).join(" ")} `);
    }
    return ["X:1", "M:4/4", "L:1/4", "K:C", `${bars.join("")} |`, ""].join(
      "\n",
    );
  }, [sequenceStepsWithButtons, side]);

  useEffect(() => {
    if (!bassPatternRenderedNotationVisible) return;
    renderNotationInto(
      bassPatternNotationRef.current,
      bassPatternRenderedNotationAbc,
    );
  }, [
    bassPatternRenderedNotationAbc,
    bassPatternRenderedNotationVisible,
    bassPatternNotationRef,
    renderNotationInto,
  ]);

  useEffect(() => {
    if (!abcRenderedNotationVisible) return;
    renderNotationInto(abcNotationRef.current, abcText);
  }, [
    abcRenderedNotationVisible,
    abcText,
    abcNotationRef,
    renderNotationInto,
  ]);

  useEffect(() => {
    if (!sequenceRenderedNotationVisible) return;
    renderNotationInto(
      sequenceNotationRef.current,
      sequenceRenderedNotationAbc,
    );
  }, [
    sequenceRenderedNotationAbc,
    sequenceRenderedNotationVisible,
    sequenceNotationRef,
    renderNotationInto,
  ]);

  return {
    renderNotationInto,
  };
}
