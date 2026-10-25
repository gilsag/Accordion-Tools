import assert from "node:assert/strict";
import { analyzeVoicingDensity } from "../src/tools/stradellaChordFinder/voicingDensity";
import { analyzeConfiguredStradellaVoicing, DEFAULT_STRADELLA_REGISTER_MODEL, type ModeledStradellaNote } from "../src/tools/stradellaChordFinder/registerModel";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations";
const mock = (midi: number): ModeledStradellaNote => ({
  midi, octave: Math.floor(midi / 12) - 1, pitchClass: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][midi % 12],
  source: "chord", buttonId: `pitch-${midi}`,
});
assert.equal(analyzeVoicingDensity([mock(60),mock(64),mock(67)]).penalty, 0);
assert.equal(analyzeVoicingDensity([mock(60),mock(61)]).penalty, 0, "Do not penalize a higher-register semitone by default");
assert.ok(analyzeVoicingDensity([mock(48),mock(49)]).penalty > 0);
assert.ok(analyzeVoicingDensity([mock(36),mock(37)]).penalty > analyzeVoicingDensity([mock(48),mock(49)]).penalty);
assert.equal(analyzeVoicingDensity([mock(48),mock(48)]).penalty, 0, "Unison is reinforcement, not a close-voicing warning");
assert.match(analyzeVoicingDensity([mock(48), mock(50), mock(52), mock(53)]).note ?? "", /4-note close cluster/);
assert.ok(analyzeVoicingDensity([mock(36),mock(37),mock(38),mock(39)]).penalty < 3, "Density must not outweigh another button");
const buttons = generateStradella("96", 38, 1.18, "default");
const find = (model = DEFAULT_STRADELLA_REGISTER_MODEL) => getStradellaChordFinderResults(buttons,"C","major13","bass-and-chords",false,4,5.5,null,model);
const candidate = find().find((item) => item.playable && item.playbackButtons.some((b)=>b.kind === "chord-diminished7") && item.playbackButtons.some((b)=>b.kind === "chord-minor"));
assert.ok(candidate);
const regular = realizationAnnotation("C", "major13", candidate, DEFAULT_STRADELLA_REGISTER_MODEL);
const shifted = { bass: DEFAULT_STRADELLA_REGISTER_MODEL.bass, chord: { startOctave: 4, grouping: "C-B" as const } };
const shiftedAnnotation = realizationAnnotation("C", "major13", candidate, shifted);
assert.match(regular.lines[3], /close E3–F3 semitone/);
assert.doesNotMatch(shiftedAnnotation.lines[3], /ordering depends on register|not measured/);
assert.equal(regular.lines[0],shiftedAnnotation.lines[0],"Register changes must preserve harmonic identity");
assert.equal(regular.lines[1],shiftedAnnotation.lines[1],"Register changes must preserve pitch-class content");
assert.ok(analyzeConfiguredStradellaVoicing(candidate.playbackButtons,"C",shifted).notes.every((note)=>note.octave === 4), "Chord-only realization follows configured register");
console.log("✓ Voicing-density and four-level annotation tests passed");
