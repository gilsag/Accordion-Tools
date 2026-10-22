import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import type { DiagramButton } from "../src/types";
import {
  analyzeConfiguredStradellaVoicing,
  nominalRegisterNote,
  formatRegisterRange,
  formatModeledStradellaNotes,
  explainConfiguredStradellaVoicing,
  DEFAULT_STRADELLA_REGISTER_MODEL,
  type StradellaRegisterModel,
} from "../src/tools/stradellaChordFinder/registerModel";
import { analyzeStradellaRegistralVoicing } from "../src/tools/stradellaChordFinder/registralAnalysis";

const buttons = generateStradella("96", 38, 1.18, "natural");
function select(pitch: string, kind: DiagramButton["kind"]): DiagramButton {
  const selected = buttons.find((b) => b.kind === kind && (kind.startsWith("bass-") ? b.pitchClass : b.chordRoot) === pitch);
  assert.ok(selected, `${pitch} ${kind} must exist in 96-bass layout`);
  return selected;
}
const bassC = select("C", "bass-root");
const bassB = select("B", "bass-counterbass");
const majorC = select("C", "chord-major");

// All twelve pitch classes must occupy exactly one octave-span in both conventions.
for (const grouping of ["C-B", "F-E"] as const) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    .map((pitch) => nominalRegisterNote(pitch, { startOctave: 2, grouping }));
  assert.equal(notes.length, 12);
  assert.equal(new Set(notes.map((note) => note?.midi)).size, 12);
  assert.equal(Math.max(...notes.map((note) => note!.midi)) - Math.min(...notes.map((note) => note!.midi)), 11);
}
assert.equal(nominalRegisterNote("C", { startOctave: 2, grouping: "C-B" })?.midi, 36);
assert.equal(nominalRegisterNote("B", { startOctave: 2, grouping: "C-B" })?.midi, 47);
assert.equal(nominalRegisterNote("F", { startOctave: 2, grouping: "F-E" })?.midi, 41);
assert.equal(nominalRegisterNote("E", { startOctave: 2, grouping: "F-E" })?.midi, 52);
assert.equal(nominalRegisterNote("C", { startOctave: 2, grouping: "F-E" })?.octave, 3);
assert.equal(formatRegisterRange({ startOctave: 2, grouping: "F-E" }), "F2–E3");
assert.equal(nominalRegisterNote("H", { startOctave: 2, grouping: "C-B" }), null);

// Nominal lowest pitch reflects configuration, not visual highlights.
const defaultVoicing = analyzeConfiguredStradellaVoicing([bassB, majorC], "C", DEFAULT_STRADELLA_REGISTER_MODEL);
assert.equal(defaultVoicing.lowestPitch, "B2");
assert.equal(defaultVoicing.lowestNotes[0]?.source, "bass");
assert.equal(defaultVoicing.rootIsLowest, false);
assert.equal(formatModeledStradellaNotes(defaultVoicing.notes), "B2 – C3 – E3 – G3");
assert.equal(formatModeledStradellaNotes([]), "None");
assert.equal(formatModeledStradellaNotes(analyzeConfiguredStradellaVoicing([majorC, majorC], "C", DEFAULT_STRADELLA_REGISTER_MODEL).notes), "C3 ×2 – E3 ×2 – G3 ×2");
assert.equal(analyzeConfiguredStradellaVoicing([majorC], "C", DEFAULT_STRADELLA_REGISTER_MODEL).lowestPitch, "C3");
assert.equal(analyzeConfiguredStradellaVoicing([bassC, majorC], "C", DEFAULT_STRADELLA_REGISTER_MODEL).lowestPitch, "C2");

// Different bass/chord ranges can reverse the actual *modeled* bottom pitch.
const raisedBass: StradellaRegisterModel = {
  bass: { startOctave: 4, grouping: "C-B" },
  chord: { startOctave: 3, grouping: "C-B" },
};
const raised = analyzeConfiguredStradellaVoicing([bassB, majorC], "C", raisedBass);
assert.equal(raised.lowestPitch, "C3");
assert.equal(raised.lowestNotes[0]?.source, "chord");
assert.equal(raised.rootIsLowest, true);
const fEModel: StradellaRegisterModel = {
  bass: { startOctave: 2, grouping: "F-E" },
  chord: { startOctave: 3, grouping: "F-E" },
};
assert.equal(analyzeConfiguredStradellaVoicing([bassC, majorC], "C", fEModel).lowestPitch, "C3");
assert.match(explainConfiguredStradellaVoicing([bassB, majorC], "C", raisedBass), /nominal one-pitch-per-tone calculation/);
assert.match(explainConfiguredStradellaVoicing([bassB, majorC], "C", raisedBass), /Nominal pitches \(low to high\): C3 – E3 – G3 – B4/);

// Changing the configured model cannot change the structural or harmonic identity.
const structural = analyzeStradellaRegistralVoicing([bassB, majorC], "C");
assert.equal(structural.potentialSlashBass, "B");
assert.equal(structural.rootPitchClassPresent, true);
assert.equal(raised.notes.length, defaultVoicing.notes.length);

console.log("Stradella configurable-register tests passed.");
