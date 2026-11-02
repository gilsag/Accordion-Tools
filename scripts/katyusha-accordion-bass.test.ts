import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  abcEventsForStradellaSide,
  mapAbcEventsToStradellaButtons,
  parseAbc,
} from "../src/tools/abcPlayerTools";
import { generateStradella } from "../src/stradella";

const source = readFileSync("public/abc/katyusha.abc", "utf8");
const parsed = parseAbc(source);
assert.deepEqual(parsed.errors, []);
assert.deepEqual(parsed.voiceIds, ["1", "2"]);
assert.match(source, /^% accordion-tools-stradella-bass-chord$/m);
assert.match(source, /Q:1\/4=100/);
const events = abcEventsForStradellaSide(parsed.events);
const buttons = generateStradella(96, 28, 2.3, "natural");
const mapped = mapAbcEventsToStradellaButtons(buttons, events, "A");
assert.equal(mapped.length, events.length);
assert.deepEqual(mapped.slice(0, 4).map((event) => event.buttons.map((button) => button.kind)), [
  ["bass-root"], ["chord-minor"], ["bass-root"], ["chord-minor"],
]);
assert.deepEqual(mapped.slice(0, 4).map((event) => event.buttons[0]?.pitchClass), ["A", "A", "E", "A"]);
assert.deepEqual(mapped.slice(0, 4).map((event) => event.startBeat), [0, 0.5, 1, 1.5]);
assert.ok(events.some((event) => event.stradellaChordMarker));
assert.ok(events.some((event) => !event.stradellaChordMarker));
assert.ok(mapped.every((event) => event.missingNotes.length === 0));

const qualityMap = new Map([
  ["Am", "chord-minor"], ["E", "chord-major"],
  ["C", "chord-major"], ["A7", "chord-dominant7"],
  ["Dm", "chord-minor"], ["E7", "chord-dominant7"],
]);
for (const event of mapped) {
  if (!event.stradellaChordMarker) {
    assert.ok(event.buttons.every((button) => button.kind === "bass-root" || button.kind === "bass-counterbass"));
    continue;
  }
  const chord = event.chordSymbols[0];
  assert.ok(chord, "An upper bass-staff note must have a known chord quality");
  assert.equal(event.buttons.length, 1, `Expected one preset chord button for ${chord.raw}`);
  assert.equal(event.buttons[0].kind, qualityMap.get(chord.raw));
  assert.equal(event.buttons[0].chordRoot, chord.root);
}

const bassOnly = mapAbcEventsToStradellaButtons(buttons, events, "A", "bass-notes-only");
const chordsOnly = mapAbcEventsToStradellaButtons(buttons, events, "A", "chord-symbols-only");
assert.ok(bassOnly.filter((event) => event.stradellaChordMarker).every((event) => event.buttons.length === 0));
assert.ok(chordsOnly.filter((event) => !event.stradellaChordMarker).every((event) => event.buttons.length === 0));

// The special bass-staff interpretation must not affect ordinary two-voice ABC.
const generic = parseAbc(source.replace("% accordion-tools-stradella-bass-chord\n", ""));
const genericEvents = abcEventsForStradellaSide(generic.events);
assert.ok(genericEvents.every((event) => !event.stradellaChordMarker));
const genericMapped = mapAbcEventsToStradellaButtons(buttons, genericEvents, "A");
assert.ok(genericMapped[1].buttons.some((button) => button.kind === "bass-root"));
assert.ok(genericMapped[1].buttons.some((button) => button.kind === "chord-minor"));

console.log("Katyusha: alternating single bass and preset chord buttons, correct harmonic qualities, independent mapping modes and opt-in notation passed.");
