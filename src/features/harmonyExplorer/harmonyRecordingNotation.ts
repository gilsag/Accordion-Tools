import { abcNameForConcreteNote } from "../../notation/concreteNoteAbc";
import { pitchClassNameFromNumber } from "./engine/integration";
import {
  chordLabel as harmonyChordLabel,
  chordMidiNotes as harmonyChordMidiNotes,
} from "./engine/music";
import type { HarmonyRecordedEvent } from "../progressionAssistant/engine/progression";

/** The Harmony recording's score: one whole note per recorded chord or note,
 * chords in close position from octave 4 with their circle label above. */
export function harmonyRecordingNotationAbc(
  recorded: HarmonyRecordedEvent[],
  showEnharmonics: boolean,
  tempoBpm: number,
): string {
  if (recorded.length === 0) return "";
  const bars = recorded.map((event) => {
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
    const label = harmonyChordLabel(
      event.rootPc,
      event.familyId,
      event.sectorIndex,
      showEnharmonics,
    );
    return `"${label}"[${notes.join("")}]4`;
  });
  return [
    "X:1",
    "T:Recorded Harmony progression",
    "M:4/4",
    "L:1/4",
    `Q:1/4=${tempoBpm}`,
    "K:C",
    `${bars.map((bar) => `| ${bar} `).join("")} |`,
    "",
  ].join("\n");
}
