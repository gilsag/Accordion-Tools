import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { chordToneName, realizedInversionDescription, safeChordFilenameKey } from "../src/tools/stradellaChordFinder/chordSpelling";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import { explainStradellaRealization } from "../src/tools/stradellaChordFinder/explainRealization";

assert.deepEqual(["C", "D#", "G", "A#"].map((pc) => chordToneName("C", "minor7", pc)), ["C", "E♭", "G", "B♭"]);
assert.deepEqual(["C#", "F", "G#", "C"].map((pc) => chordToneName("C#", "major7", pc)), ["C♯", "E♯", "G♯", "B♯"]);
assert.equal(chordToneName("C", "diminished7", "A"), "B𝄫");
assert.equal(chordToneName("C", "dominant7b9", "C#"), "D♭");
assert.equal(realizedInversionDescription("C", "minor7", "A#"), "Third inversion");
assert.equal(realizedInversionDescription("C", "major-triad", "E"), "First inversion");
assert.equal(realizedInversionDescription("C", "major13", "B"), "seventh in bass");

const buttons = generateStradella("96", 38, 1.18, "natural");
const candidates = getStradellaChordFinderResults(buttons, "C", "minor7", "bass-and-chords", false, 4, 5.5);
const candidate = candidates.find((r) => r.playable &&
  r.playbackButtons.some((b) => b.kind.startsWith("bass-") && b.pitchClass === "A#") &&
  r.playbackButtons.some((b) => b.kind === "chord-minor" && b.chordRoot === "C"));
assert.ok(candidate, "Expect the B♭ bass + C minor recipe");
const note = realizationAnnotation("C", "minor7", candidate, DEFAULT_STRADELLA_REGISTER_MODEL);
assert.equal(note.title, "Cmin7/B♭ - Exact - 2 buttons");
assert.match(note.lines[0], /^Harmonic identity: Cmin7\/B♭ · Third inversion$/);
assert.match(note.lines[1], /C–E♭–G–B♭ · Exact \(complete\)/);
assert.match(note.lines[3], /B♭2 – C3 – E♭3 – G3/);
assert.match(note.lines[2], /B♭ bass \+ C minor · 2 played buttons/);
assert.doesNotMatch(note.detail, /bass unspecified|modeled lowest|D#|A#/i);
assert.match(note.filenameKey, /^Cmin7-over-Bflat-Exact-2buttons-Bflat-bass-C-minor$/);
assert.match(note.filenameKey, /^[A-Za-z0-9-]+$/);
const more = explainStradellaRealization("C", "minor7", candidate, "bass-and-chords", DEFAULT_STRADELLA_REGISTER_MODEL);
assert.match(more, /Cmin7\/B♭/);
assert.match(more, /third inversion/i);
assert.match(more, /C–E♭–G–B♭/);
assert.doesNotMatch(more, /pitch classes C–D#–G–A#/);

// Other chord symbols, accidentals and slash instructions remain safe on all
// supported operating systems (including Windows, which forbids / in names).
for (const name of ["Cmin7/B♭", "C♯maj7/E♯", "F#min7/A#", "Cdim7/B𝄫", "Gmaj7/D𝄪"]) {
  const safe = safeChordFilenameKey(name);
  assert.match(safe, /^[A-Za-z0-9-]+$/);
  assert.ok(safe.includes("-over-"));
}
console.log("Musical spelling, inversion and ASCII-safe export tests passed.");
