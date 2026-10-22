import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import { notesForButton } from "../src/sound";
import { analyzeConfiguredStradellaVoicing, type StradellaRegisterModel } from "../src/tools/stradellaChordFinder/registerModel";
import { LA_MELODIOSA_REGIONS } from "../src/laMelodiosa";

const buttons = generateStradella("96", 38, 1.18, "natural");
function get(kind: string, pitch: string) {
  const button = buttons.find((item) => item.kind === kind &&
    (kind.startsWith("bass-") ? item.pitchClass : item.chordRoot) === pitch);
  assert.ok(button, `Missing ${kind} ${pitch}`);
  return button;
}
const cBass = get("bass-root", "C");
const eCounterbass = get("bass-counterbass", "E");
const cMajor = get("chord-major", "C");
const bCounterbass = get("bass-counterbass", "B");
const model: StradellaRegisterModel = {
  bass: { startOctave: 2, grouping: "F-E" },
  chord: { startOctave: 3, grouping: "F-E" },
};
const modeledOptions = {source: "la-melodiosa" as const, stradellaBassVoicing: "single-low" as const,
  stradellaRegisterModel: model, laMelodiosaFollowStradellaRegisters: true};
const legacyOptions = {...modeledOptions, laMelodiosaFollowStradellaRegisters: false};

assert.deepEqual(notesForButton(cBass, modeledOptions).map((n) => `${n.pitchClass}${n.octave}`), ["C3"]);
assert.deepEqual(notesForButton(eCounterbass, modeledOptions).map((n) => `${n.pitchClass}${n.octave}`), ["E3"]);
assert.deepEqual(notesForButton(cMajor, modeledOptions).map((n) => `${n.pitchClass}${n.octave}`), ["C4", "E4", "G3"]);
assert.deepEqual(notesForButton(cBass, legacyOptions).map((n) => `${n.pitchClass}${n.octave}`), ["C2"]);
assert.deepEqual(notesForButton(cMajor, legacyOptions).map((n) => `${n.pitchClass}${n.octave}`), ["C3", "E3", "G3"]);
assert.deepEqual(notesForButton(cBass, {...modeledOptions, source: "synth"}).map((n) => `${n.pitchClass}${n.octave}`), ["C2"],
  "Changing sample playback settings must not alter the existing explicit synth mode");
const soundedButtons = [bCounterbass, cMajor];
const soundedNotes = soundedButtons.flatMap((b) => notesForButton(b, modeledOptions));
const resultMidi = soundedNotes.map((n) => ((n.octave + 1) * 12 +
  ({C:0,D:2,E:4,F:5,G:7,A:9,B:11} as Record<string,number>)[n.pitchClass]));
const analytic = analyzeConfiguredStradellaVoicing(soundedButtons, "C", model);
assert.equal(Math.min(...resultMidi), analytic.notes[0]?.midi,
  "Sampled note selection must agree with the configured lowest modeled pitch");
// SFZ bass-side regions cover C2–B3; remaining settings require transposition.
for (const register of ["I", "II", "III"]) {
 const regions = LA_MELODIOSA_REGIONS.filter((r) => r.side === "bass" && r.register === register);
 for (let midi = 36; midi <= 59; midi++) assert.ok(regions.some((r) => r.lowMidi <= midi && r.highMidi >= midi),
   `Missing SFZ bass region ${register} ${midi}`);
}
const highRange: StradellaRegisterModel = {
 bass: {startOctave:4, grouping:"C-B"}, chord:{startOctave:5, grouping:"F-E"},
};
assert.equal(notesForButton(cBass, {...modeledOptions, stradellaRegisterModel:highRange})[0]?.octave, 4);
assert.deepEqual(notesForButton(cMajor, {...modeledOptions, stradellaRegisterModel:highRange}).map((n)=>`${n.pitchClass}${n.octave}`), ["C6","E6","G5"]);
console.log("La Melodiosa nominal-register playback mapping tests passed.");
