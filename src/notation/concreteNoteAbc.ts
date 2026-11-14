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

/** ABC note name for a sounding pitch: octave 4 is the middle octave
 * (`C`), octave 5 and up lower-case with apostrophes, octave 3 and down
 * with commas. */
export function abcNameForConcreteNote(pitchClass: string, octave: number) {
  const base = ABC_NOTE_NAMES[pitchClass] ?? "C";
  if (octave >= 5) return base.toLowerCase() + "'".repeat(Math.max(0, octave - 5));
  if (octave <= 3) return base + ",".repeat(Math.max(0, 4 - octave));
  return base;
}
