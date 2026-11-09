import { useCallback, useEffect, useMemo } from "react";
import type { useInstrumentState } from "../instrument/useInstrumentState";
import type { useBassPatternState, useBassPatternResults } from "../features/bassPatternPlayer/useBassPatternPlayer";
import { type useSequenceState, useSequenceResults } from "../features/sequences/useSequenceState";
import type { useAbcPlayerState } from "../features/abcPlayer/useAbcPlayer";
import { renderNotationInto as renderSharedNotation } from "../notation/notationService";
import type { useNotationSettings } from "../notation/useNotationSettings";
import type { DiagramButton } from "../types";
import { stradellaButtonToken,
  type StradellaNotationPreferences } from "../notation/stradellaNotation";
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
    "musicNotationStaffWidth" | "musicNotationUseBarsPerLine" |
    "stradellaNotationMode" | "stradellaChordQualityLabels" | "stradellaMarkCounterbass"> &
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
    stradellaNotationMode, stradellaChordQualityLabels, stradellaMarkCounterbass,
    selectedBassPattern, selectedChordProgression, sequenceNotationRef,
    sequenceRenderedNotationVisible, sequenceStepsWithButtons, side,
  } = deps;

  const stradellaPreferences: StradellaNotationPreferences = useMemo(() => ({
    mode: stradellaNotationMode,
    chordQualityLabels: stradellaChordQualityLabels,
    markCounterbass: stradellaMarkCounterbass,
  }), [stradellaNotationMode, stradellaChordQualityLabels, stradellaMarkCounterbass]);

  const musicNotationAbcOptions: StradellaNotationAbcOptions = useMemo(
    () => ({
      includeTitle: musicNotationIncludeTitle,
      includeDescription: musicNotationIncludeDescription,
      includeSummary: musicNotationIncludeSummary,
      barsPerLine: musicNotationUseBarsPerLine ? musicNotationBarsPerLine : 999,
      chordFontSize: musicNotationChordFontSize,
      titleFontSize: 14,
      staffSeparator: musicNotationStaffSeparator,
      stradellaPreferences,
    }),
    [
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationIncludeTitle,
      musicNotationStaffSeparator,
      musicNotationUseBarsPerLine, stradellaPreferences,
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

  const sequenceRenderedNotationAbc = useMemo(() => {
    if (sequenceStepsWithButtons.length === 0) return "";
    if (side === "stradella") {
      const tokens = sequenceStepsWithButtons.reduce<{notes:string[];quality:string|null}>((state,step) => {
        const result = stradellaButtonToken([step.button], stradellaPreferences, state.quality);
        return {notes:[...state.notes,result.token],quality:result.quality};
      }, {notes:[],quality:null}).notes;
      const bars: string[] = [];
      for (let index = 0; index < tokens.length; index += 4) {
        const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
        const barTokens = tokens.slice(index,index + 4);
        // Short final measures are padded with true rests, not a second ghost voice.
        bars.push(`${lineBreak}| ${[...barTokens, ...Array.from({length:4 - barTokens.length},()=>"z")].join(" ")} `);
      }
      return [
        "X:1", "%%score 1", "%%staffsep 16", "M:4/4", "L:1/4",
        "K:C clef=bass", "V:1 clef=bass", `[V:1] ${bars.join("")} |`, "",
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
  }, [sequenceStepsWithButtons, side, stradellaPreferences]);

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
    bassPatternRenderedNotationAbc,
    renderNotationInto,
  };
}
