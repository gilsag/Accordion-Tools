import type { useAccordionNotation } from "./useAccordionNotation";
import { progressionPulsePlan } from "../audio/progressionPulsePlan";
import { useCallback, useEffect, useMemo } from "react";
import type { useHarmonyExplorerState } from "../features/harmonyExplorer/useHarmonyExplorer";
import type { useHarmonyProgressionState, useHarmonyProgressionResults } from "../features/progressionAssistant/useProgressionAssistant";
import type { useSoundSettings } from "../audio/useSoundSettings";
import type { DiagramButton } from "../types";
import { notesForButton } from "../sound";
import { chordLabel as harmonyChordLabel, chordMidiNotes as harmonyChordMidiNotes } from "../tools/harmonyExplorer/music";
import { progressionBassPulseButtons } from "../tools/harmonyExplorer/progression";
import { pitchClassNameFromNumber, pitchClassNumberFromName } from "../tools/harmonyExplorer/integration";

export type UseProgressionNotationDeps = Pick<ReturnType<typeof useHarmonyProgressionState>,
    "harmonyProgressionNotationRef" | "harmonyProgressionNotationVisible" |
    "harmonyProgressionRhythmPattern" | "harmonyRecordedNotationRef" |
    "harmonyRecordedNotationVisible" | "harmonyRecordedProgression"> &
  Pick<ReturnType<typeof useHarmonyProgressionResults>,
    "harmonyProgressionPlan"> &
  Pick<ReturnType<typeof useHarmonyExplorerState>,
    "harmonyShowEnharmonics"> &
  Pick<ReturnType<typeof useAccordionNotation>,
    "renderNotationInto"> &
  Pick<ReturnType<typeof useSoundSettings>,
    "soundOptions" | "soundSequenceTempoBpm"> &
  {
    buttons: DiagramButton[];
  };

/** Rhythm pulses for the Progression Assistant and staff notation for it and for the Harmony recording, rendered into their notation panels when shown. */
export function useProgressionNotation(deps: UseProgressionNotationDeps) {
  const {
    buttons, harmonyProgressionNotationRef, harmonyProgressionNotationVisible,
    harmonyProgressionPlan, harmonyProgressionRhythmPattern, harmonyRecordedNotationRef,
    harmonyRecordedNotationVisible, harmonyRecordedProgression, harmonyShowEnharmonics,
    renderNotationInto, soundOptions, soundSequenceTempoBpm,
  } = deps;

  function abcNameForConcreteNote(pitchClass: string, octave: number) {
    const accidentalMap: Record<string, string> = {
      C: "C", "C#": "^C", Db: "_D", D: "D", "D#": "^D", Eb: "_E",
      E: "E", F: "F", "F#": "^F", Gb: "_G", G: "G", "G#": "^G",
      Ab: "_A", A: "A", "A#": "^A", Bb: "_B", B: "B",
    };
    const base = accidentalMap[pitchClass] ?? "C";
    if (octave >= 5) return base.toLowerCase() + "'".repeat(Math.max(0, octave - 5));
    if (octave <= 3) return base + ",".repeat(Math.max(0, 4 - octave));
    return base;
  }

  const progressionRhythmPulses = useCallback((step: (typeof harmonyProgressionPlan.steps)[number]) =>
    progressionPulsePlan(
      step.result.playbackButtons,
      progressionBassPulseButtons(buttons, step),
      harmonyProgressionRhythmPattern,
      (button) => Math.min(...notesForButton(button, soundOptions).map((note) =>
        note.octave * 12 + (pitchClassNumberFromName(note.pitchClass) ?? 0))),
    ),
  [buttons, harmonyProgressionRhythmPattern, soundOptions, harmonyProgressionPlan]);

  const harmonyProgressionRenderedNotationAbc = useMemo(() => {
    if (!harmonyProgressionPlan.playable || harmonyProgressionPlan.steps.length === 0) return "";
    const meter = harmonyProgressionRhythmPattern === "waltz"
      ? "3/4"
      : harmonyProgressionRhythmPattern === "oom-pah"
        ? "2/4"
        : "4/4";
    const bars = harmonyProgressionPlan.steps.map((step) => {
      const pulses = progressionRhythmPulses(step);
      if (harmonyProgressionRhythmPattern === "block") {
        const notes = pulses[0]
          .flatMap((button) => notesForButton(button, soundOptions))
          .map((note) => abcNameForConcreteNote(note.pitchClass, note.octave));
        const unique = [...new Set(notes)];
        return `"${step.label}"[${unique.join("")}]4`;
      }
      const tokens = pulses.map((pulse, index) => {
        const notes = pulse
          .flatMap((button) => notesForButton(button, soundOptions))
          .map((note) => abcNameForConcreteNote(note.pitchClass, note.octave));
        const unique = [...new Set(notes)];
        return `${index === 0 ? `"${step.label}"` : ""}${unique.length ? `[${unique.join("")}]` : "z"}`;
      });
      return tokens.join(" ");
    });
    return [
      "X:1",
      `M:${meter}`,
      "L:1/4",
      `Q:1/4=${soundSequenceTempoBpm}`,
      "K:C clef=bass",
      `${bars.map((bar) => `| ${bar} `).join("")} |`,
      "",
    ].join("\n");
  }, [
    harmonyProgressionPlan,
    harmonyProgressionRhythmPattern,
    soundSequenceTempoBpm,
    progressionRhythmPulses,
    soundOptions,
  ]);

  useEffect(() => {
    if (!harmonyProgressionNotationVisible) return;
    renderNotationInto(
      harmonyProgressionNotationRef.current,
      harmonyProgressionRenderedNotationAbc,
    );
  }, [
    harmonyProgressionNotationVisible,
    harmonyProgressionRenderedNotationAbc,
    harmonyProgressionNotationRef,
    renderNotationInto,
  ]);

  const harmonyRecordedProgressionNotationAbc = useMemo(() => {
    if (harmonyRecordedProgression.length === 0) return "";
    const bars = harmonyRecordedProgression.map((event) => {
      if (event.kind === "note") {
        const pitchClass = pitchClassNameFromNumber(event.pitchClass);
        const note = abcNameForConcreteNote(pitchClass, 4);
        return `"${pitchClass}"${note}4`;
      }
      const notes = harmonyChordMidiNotes(event.rootPc, event.familyId, 4).map((midi) => {
        const pitchClass = pitchClassNameFromNumber(((midi % 12) + 12) % 12);
        const octave = Math.floor(midi / 12) - 1;
        return abcNameForConcreteNote(pitchClass, octave);
      });
      const label = harmonyChordLabel(event.rootPc, event.familyId, event.sectorIndex, harmonyShowEnharmonics);
      return `"${label}"[${notes.join("")}]4`;
    });
    return [
      "X:1",
      "T:Recorded Harmony progression",
      "M:4/4",
      "L:1/4",
      `Q:1/4=${soundSequenceTempoBpm}`,
      "K:C",
      `${bars.map((bar) => `| ${bar} `).join("")} |`,
      "",
    ].join("\n");
  }, [harmonyRecordedProgression, harmonyShowEnharmonics, soundSequenceTempoBpm]);

  useEffect(() => {
    if (!harmonyRecordedNotationVisible || !harmonyRecordedProgressionNotationAbc) return;
    renderNotationInto(
      harmonyRecordedNotationRef.current,
      harmonyRecordedProgressionNotationAbc,
    );
  }, [
    harmonyRecordedNotationVisible,
    harmonyRecordedProgressionNotationAbc,
    harmonyRecordedNotationRef,
    renderNotationInto,
  ]);

  return {
    progressionRhythmPulses,
  };
}
