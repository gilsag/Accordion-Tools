/** The Bass Pattern tempo counts conventional beats: the denominator in simple
 * meters, dotted beats of three units in compound meters. Exports must agree
 * with playback. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  bassPatternBeat, bassPatternEventsToAbc, bassPatternEventsToLilyPond, bassPatternEventsToMidiBytes,
  type BassPatternDefinition, type ChordProgressionDefinition,
} from "../src/tools/bassPatternPlayerTools";

const expected: Array<[string, string, number, string]> = [
  ["4/4", "quarter", 1, "1/4"], ["3/4", "quarter", 1, "1/4"], ["2/2", "half", 1, "1/2"],
  ["6/8", "dotted-quarter", 3, "3/8"], ["9/8", "dotted-quarter", 3, "3/8"], ["12/8", "dotted-quarter", 3, "3/8"],
  ["3/8", "eighth", 1, "1/8"], ["5/8", "eighth", 1, "1/8"], ["8/8", "eighth", 1, "1/8"],
  ["6/16", "dotted-eighth", 3, "3/16"],
];
for (const [meter, beat, unitsPerBeat, abcLength] of expected) {
  const result = bassPatternBeat(meter);
  assert.deepEqual([result.beat, result.unitsPerBeat, result.abcLength], [beat, unitsPerBeat, abcLength], meter);
}

// MIDI: the tempo meta event is in microseconds per quarter note.
function midiTempo(bytes: Uint8Array) {
  const index = bytes.findIndex((byte, i) => byte === 0xff && bytes[i + 1] === 0x51 && bytes[i + 2] === 0x03);
  return (bytes[index + 3] << 16) | (bytes[index + 4] << 8) | bytes[index + 5];
}
assert.equal(midiTempo(bassPatternEventsToMidiBytes([], 60, "4/4")), 1_000_000, "4/4 at 60: one quarter per second");
assert.equal(midiTempo(bassPatternEventsToMidiBytes([], 60, "6/8")), 666_667, "6/8 at 60: one dotted quarter per second");
assert.equal(midiTempo(bassPatternEventsToMidiBytes([], 60, "2/2")), 500_000, "2/2 at 60: one half note per second");

// ABC and LilyPond state the same beat.
const patterns = JSON.parse(readFileSync("public/bass-patterns/bass-patterns.json", "utf8")).patterns as BassPatternDefinition[];
const progression = (JSON.parse(readFileSync("public/chord-progressions/chord-progressions.json", "utf8")) as ChordProgressionDefinition[])[0];
const tarantella = patterns.find((pattern) => pattern.meter === "6/8")!;
const march = patterns.find((pattern) => pattern.meter === "4/4")!;
assert.match(bassPatternEventsToAbc(tarantella, progression, [], "C", 1, 80), /^Q:3\/8=80$/m);
assert.match(bassPatternEventsToAbc(march, progression, [], "C", 1, 80), /^Q:1\/4=80$/m);
assert.match(bassPatternEventsToLilyPond(tarantella, progression, [], "C", 1, 80), /\\tempo 4\. = 80/);
assert.match(bassPatternEventsToLilyPond(march, progression, [], "C", 1, 80), /\\tempo 4 = 80/);

console.log("✓ Bass Pattern tempo beats, MIDI tempo and ABC/LilyPond tempo marks");
