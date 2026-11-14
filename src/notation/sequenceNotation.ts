/** The recorded sequence's score: one quarter note per step, four per bar,
 * on the bass staff for the Stradella side and the treble staff otherwise. */
import type { SequenceStepWithButton } from "../tools/sequenceTools";
import type { DiagramButton, Side } from "../types";
import { stradellaButtonToken, type StradellaNotationPreferences } from "./stradellaNotation";

const ABC_NOTE_NAMES: Record<string, string> = {
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

function abcNoteNameForButton(button: DiagramButton) {
  const pitchClass = button.pitchClass ?? button.chordRoot ?? "C";
  const baseName = ABC_NOTE_NAMES[pitchClass] ?? "C";
  const octave = button.soundOctave ?? button.octave ?? 4;
  if (octave >= 5) return baseName.toLowerCase() + "'".repeat(Math.max(0, octave - 5));
  if (octave <= 3) return baseName + ",".repeat(Math.max(0, 4 - octave));
  return baseName;
}

export function sequenceNotationAbc(
  steps: SequenceStepWithButton[],
  side: Side,
  stradellaPreferences: StradellaNotationPreferences,
): string {
  if (steps.length === 0) return "";
  if (side === "stradella") {
    const tokens = steps.reduce<{ notes: string[]; quality: string | null }>(
      (state, step) => {
        const result = stradellaButtonToken([step.button], stradellaPreferences, state.quality);
        return { notes: [...state.notes, result.token], quality: result.quality };
      },
      { notes: [], quality: null },
    ).notes;
    const bars: string[] = [];
    for (let index = 0; index < tokens.length; index += 4) {
      const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
      const barTokens = tokens.slice(index, index + 4);
      // Short final measures are padded with true rests, not a second ghost voice.
      bars.push(
        `${lineBreak}| ${[...barTokens, ...Array.from({ length: 4 - barTokens.length }, () => "z")].join(" ")} `,
      );
    }
    return [
      "X:1",
      "%%score 1",
      "%%staffsep 16",
      "M:4/4",
      "L:1/4",
      "K:C clef=bass",
      "V:1 clef=bass",
      `[V:1] ${bars.join("")} |`,
      "",
    ].join("\n");
  }

  const tokens = steps.map((step) => abcNoteNameForButton(step.button));
  const bars: string[] = [];
  for (let index = 0; index < tokens.length; index += 4) {
    const lineBreak = index > 0 && index % 16 === 0 ? "\n" : "";
    bars.push(`${lineBreak}| ${tokens.slice(index, index + 4).join(" ")} `);
  }
  return ["X:1", "M:4/4", "L:1/4", "K:C", `${bars.join("")} |`, ""].join("\n");
}
