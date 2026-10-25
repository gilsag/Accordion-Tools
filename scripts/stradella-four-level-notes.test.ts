import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { DEFAULT_STRADELLA_NOTE_LEVELS, normalizeStradellaNoteLevels, realizationAnnotation, type StradellaNoteLevels } from "../src/tools/stradellaChordFinder/diagramAnnotations";
import { DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import { EN, ES } from "../src/i18n/catalog";

const buttons = generateStradella("96", 38, 1.18, "natural");
const results = getStradellaChordFinderResults(buttons, "E", "minor7", "bass-and-chords", false, 4, 5.5, "G", DEFAULT_STRADELLA_REGISTER_MODEL);
const result = results.find((candidate) => candidate.playable && candidate.exact);
assert.ok(result, "Expect a complete Emin7/G realization");
const createNote = (levels: StradellaNoteLevels) => realizationAnnotation("E", "minor7", result, DEFAULT_STRADELLA_REGISTER_MODEL, "G", levels);
const all = createNote({ ...DEFAULT_STRADELLA_NOTE_LEVELS });
assert.equal(all.lines.length, 4);
assert.match(all.lines[0], /^Harmonic identity: Emin7\/G/);
assert.match(all.lines[1], /^Pitch-class realization:/);
assert.match(all.lines[2], /^Physical realization:/);
assert.match(all.lines[3], /^Registral voicing:/);
assert.equal(all.detail, all.lines.join("\n"));

for (const level of ["identity", "pitchClasses", "voicing", "physical"] as const) {
  const toggles = { identity: false, pitchClasses: false, voicing: false, physical: false, [level]: true };
  const note = createNote(toggles);
  assert.equal(note.lines.length, 1, `${level} should be independently selectable`);
  assert.equal(note.detail, note.lines[0]);
  assert.equal(note.title, all.title, "Note toggles must not change harmonic identity or contextual title");
  assert.equal(note.filenameKey, all.filenameKey, "Note toggles must not change export filenames");
}
const none = createNote({ identity: false, pitchClasses: false, voicing: false, physical: false });
assert.deepEqual(none.lines, []);
assert.equal(none.detail, "");
assert.ok(result.playable);
assert.deepEqual(normalizeStradellaNoteLevels({ identity: false, voicing: false }), {
  identity: false, pitchClasses: true, voicing: false, physical: true,
});
assert.deepEqual(normalizeStradellaNoteLevels(null), DEFAULT_STRADELLA_NOTE_LEVELS);
assert.match(all.lines[3], /Registral voicing: G2/);
assert.doesNotMatch(all.lines[3], /Low to high:/);
assert.doesNotMatch(all.lines[3], /not measured|Lowest modeled:/i);
const chordOnly = getStradellaChordFinderResults(buttons, "C", "major13", "bass-and-chords", false, 4, 5.5)
  .find((candidate) => candidate.playable && candidate.missingPitches.length === 1 && candidate.playbackButtons.every((button) => button.kind.startsWith("chord-")));
assert.ok(chordOnly, "Expect chord-button-only Cmaj13 approximation");
const chordOnlyNote = realizationAnnotation("C", "major13", chordOnly, DEFAULT_STRADELLA_REGISTER_MODEL);
assert.match(chordOnlyNote.lines[3], /^Registral voicing: [A-G]/);
assert.doesNotMatch(chordOnlyNote.lines[3], /Chord buttons only|no separate bass|Low to high:/i);
assert.match(chordOnlyNote.lines[2], /Physical realization: .*Chord buttons only; no separate bass/);
const onlyVoicing = realizationAnnotation("C", "major13", chordOnly, DEFAULT_STRADELLA_REGISTER_MODEL, null,
  { identity: false, pitchClasses: false, voicing: true, physical: false });
assert.doesNotMatch(onlyVoicing.detail, /Chord buttons only|Physical realization:/);
const onlyPhysical = realizationAnnotation("C", "major13", chordOnly, DEFAULT_STRADELLA_REGISTER_MODEL, null,
  { identity: false, pitchClasses: false, voicing: false, physical: true });
assert.match(onlyPhysical.detail, /Chord buttons only; no separate bass/);
assert.doesNotMatch(onlyPhysical.detail, /Registral voicing:/);
const reduced = realizationAnnotation("C", "major13", chordOnly, DEFAULT_STRADELLA_REGISTER_MODEL, null,
  { identity: false, pitchClasses: true, voicing: false, physical: false });
assert.match(reduced.detail, /Omitted: G \(fifth\)/);
assert.doesNotMatch(reduced.detail, /Registral voicing:|Physical realization:|Harmonic identity:/);
const g6 = getStradellaChordFinderResults(buttons, "G", "major6", "bass-and-chords", false, 4, 5.5)
  .find((candidate) => candidate.playable && candidate.exact);
assert.ok(g6);
assert.match(realizationAnnotation("G", "major6", g6, DEFAULT_STRADELLA_REGISTER_MODEL, null,
  { identity: true, pitchClasses: false, voicing: false, physical: false }).detail, /Harmonic identity: Gmaj6/);
assert.deepEqual(normalizeStradellaNoteLevels(null), DEFAULT_STRADELLA_NOTE_LEVELS);
for (const catalog of [EN, ES]) {
  for (const key of ["tools.harmonicIdentity", "tools.pitchClassRealization",
    "tools.physicalRealization", "tools.registralVoicing"] as const) {
    assert.doesNotMatch(catalog[key], /^\d+\.\s/, "Settings labels must not use stale numbering");
  }
}
// Lightweight integration contracts for UI state and exported SVG captions.
const app = readFileSync("src/App.tsx", "utf8");
const panel = readFileSync("src/components/tools/StradellaChordFinderPanel.tsx", "utf8");
const defaults = JSON.parse(readFileSync("public/default-settings.json", "utf8"));
assert.deepEqual(defaults.stradellaNoteLevels, DEFAULT_STRADELLA_NOTE_LEVELS);
assert.match(app, /stradellaNoteLevels,\r?\n\s+diagramVerticalSpacing/);
assert.match(app, /normalizeStradellaNoteLevels\(settings.stradellaNoteLevels\)/);
assert.match(app, /finderAnnotationDisplayLines\.map/);
assert.match(app, /Boolean\(finderAnnotation\?\.lines.length\)/);
assert.match(panel, /noteLevels\[level\]/);
// UI labels are translated at render time; verify bindings and both language catalogs.
for (const [level, key] of [
  ["identity", "tools.harmonicIdentity"],
  ["pitchClasses", "tools.pitchClassRealization"],
  ["voicing", "tools.registralVoicing"],
  ["physical", "tools.physicalRealization"],
] as const) {
  assert.ok(panel.includes(`["${level}", t("${key}")]`), `Missing UI translation binding: ${level}`);
  assert.ok(EN[key].trim(), `Missing English UI label: ${key}`);
  assert.ok(ES[key]?.trim(), `Missing Spanish UI label: ${key}`);
}
console.log("Stradella four-level note tests passed.");
