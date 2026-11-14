import { progressionPulsePlan } from "../../audio/progressionPulsePlan";
import { useCallback, useMemo } from "react";
import type {
  useHarmonyProgressionState,
  useHarmonyProgressionResults,
} from "./useProgressionAssistant";
import type { useSoundSettings } from "../../audio/useSoundSettings";
import type { DiagramButton } from "../../types";
import { notesForButton } from "../../sound";
import {
  stradellaButtonToken,
  type StradellaNotationPreferences,
} from "../../notation/stradellaNotation";
import { progressionBassPulseButtons } from "../../tools/harmonyExplorer/progression";
import { pitchClassNumberFromName } from "../../tools/harmonyExplorer/integration";
import { abcNameForConcreteNote } from "../../notation/concreteNoteAbc";

export type UseProgressionNotationDeps = Pick<
  ReturnType<typeof useHarmonyProgressionState>,
  "harmonyProgressionRhythmPattern"
> &
  Pick<ReturnType<typeof useHarmonyProgressionResults>, "harmonyProgressionPlan"> &
  Pick<ReturnType<typeof useSoundSettings>, "soundOptions" | "soundSequenceTempoBpm"> & {
    stradellaNotationMode: StradellaNotationPreferences["mode"];
    stradellaChordQualityLabels: StradellaNotationPreferences["chordQualityLabels"];
    stradellaMarkCounterbass: boolean;
  } & {
    buttons: DiagramButton[];
  };

/** The Progression Assistant's rhythm pulses and score. */
export function useProgressionNotation(deps: UseProgressionNotationDeps) {
  const {
    buttons,
    harmonyProgressionPlan,
    harmonyProgressionRhythmPattern,
    soundOptions,
    soundSequenceTempoBpm,
    stradellaNotationMode,
    stradellaChordQualityLabels,
    stradellaMarkCounterbass,
  } = deps;

  const progressionRhythmPulses = useCallback(
    (step: (typeof harmonyProgressionPlan.steps)[number]) =>
      progressionPulsePlan(
        step.result.playbackButtons,
        progressionBassPulseButtons(buttons, step),
        harmonyProgressionRhythmPattern,
        (button) =>
          Math.min(
            ...notesForButton(button, soundOptions).map(
              (note) => note.octave * 12 + (pitchClassNumberFromName(note.pitchClass) ?? 0),
            ),
          ),
      ),
    [buttons, harmonyProgressionRhythmPattern, soundOptions, harmonyProgressionPlan],
  );

  const harmonyProgressionRenderedNotationAbc = useMemo(() => {
    if (!harmonyProgressionPlan.playable || harmonyProgressionPlan.steps.length === 0) return "";
    const meter =
      harmonyProgressionRhythmPattern === "waltz"
        ? "3/4"
        : harmonyProgressionRhythmPattern === "oom-pah"
          ? "2/4"
          : "4/4";
    const preferences: StradellaNotationPreferences = {
      mode: stradellaNotationMode,
      chordQualityLabels: stradellaChordQualityLabels,
      markCounterbass: stradellaMarkCounterbass,
    };
    let precedingQuality: string | null = null;
    const bars = harmonyProgressionPlan.steps.map((step) => {
      const pulses = progressionRhythmPulses(step);
      if (stradellaNotationMode === "symbolic") {
        const tokens = pulses.map((pulse) => {
          if (!pulse.length) return "z";
          const result = stradellaButtonToken(pulse, preferences, precedingQuality);
          precedingQuality = result.quality;
          return result.token;
        });
        return harmonyProgressionRhythmPattern === "block" ? `${tokens[0]}4` : tokens.join(" ");
      }
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
    stradellaNotationMode,
    stradellaChordQualityLabels,
    stradellaMarkCounterbass,
  ]);

  return {
    progressionRhythmPulses,
    harmonyProgressionRenderedNotationAbc,
  };
}
