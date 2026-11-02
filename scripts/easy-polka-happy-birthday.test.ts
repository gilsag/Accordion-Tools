import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  abcEventsForStradellaSide,
  abcEventsForTrebleSide,
  mapAbcEventsToStradellaButtons,
  parseAbc,
} from "../src/tools/abcPlayerTools";
import { generateStradella } from "../src/stradella";

const buttons = generateStradella(96, 28, 2.3, "natural");

function exercise(name: string, preferredRoot: string) {
  const abc = readFileSync(`public/abc/${name}.abc`, "utf8");
  const parsed = parseAbc(abc);
  assert.deepEqual(parsed.errors, [], `${name}: ABC must parse without errors`);
  assert.deepEqual(parsed.voiceIds, ["1", "2"]);
  assert.match(abc, /^% accordion-tools-stradella-bass-chord$/m);
  const melody = abcEventsForTrebleSide(parsed.events);
  const bass = abcEventsForStradellaSide(parsed.events);
  const mapped = mapAbcEventsToStradellaButtons(buttons, bass, preferredRoot);
  assert.equal(mapped.length, bass.length);
  assert.ok(mapped.every((event) => event.missingNotes.length === 0),
    `${name}: all bass and chord events must have physical buttons`);
  for (let index = 1; index < bass.length; index++) {
    assert.ok(bass[index].startBeat > bass[index - 1].startBeat,
      `${name}: repeat expansion must not overlay successive bass events`);
  }
  return { abc, parsed, melody, bass, mapped };
}

const polka = exercise("easy-polka", "C");
assert.match(polka.abc, /T:Easy Polka/);
assert.match(polka.abc, /C:Jean-Michel Bencetti/);
assert.equal(polka.parsed.tempoBpm, 160, "half-note = 80 is quarter-note = 160");
assert.equal(polka.melody[0].notes[0].label, "E4");
assert.equal(polka.melody[1].notes[0].label, "A4");
assert.equal(polka.mapped.length, 63, "Two repeated strains, including alternate endings");
assert.deepEqual(polka.mapped.slice(0, 4).map((event) => event.buttons[0].kind),
  ["bass-root", "chord-major", "bass-root", "chord-major"]);
assert.deepEqual(polka.mapped.slice(0, 4).map((event) => event.startBeat), [1, 2, 3, 4]);
assert.ok(polka.mapped.every((event) => event.buttons.length === 1));
assert.equal(polka.mapped.filter((event) => event.stradellaChordMarker).length, 31);
assert.deepEqual(polka.mapped.filter((event) => event.stradellaChordMarker)
  .map((event) => event.buttons[0].kind), Array(31).fill("chord-major"));
assert.equal(polka.mapped.at(-1)?.startBeat, 63);
assert.equal(polka.mapped.at(-1)?.durationBeats, 1);

const birthday = exercise("happy-birthday", "F");
assert.match(birthday.abc, /K:F/);
assert.equal(birthday.parsed.tempoBpm, 95);
assert.deepEqual(birthday.melody.slice(0, 2).map((event) => event.notes[0].label), ["C4", "C4"]);
assert.deepEqual(birthday.mapped.slice(0, 5).map((event) => event.buttons[0].kind),
  ["bass-root", "chord-major", "chord-major", "bass-root", "chord-major"]);
assert.deepEqual(birthday.mapped.slice(0, 5).map((event) => event.startBeat), [1, 2, 3, 4, 5]);
assert.ok(birthday.mapped.some((event) => event.chordSymbols.some((chord) => chord.raw === "F7")
  && event.buttons.some((button) => button.kind === "chord-dominant7")));
assert.ok(birthday.mapped.some((event) => event.chordSymbols.some((chord) => /^(?:Bb|B♭)$/.test(chord.raw))
  && event.buttons.some((button) => button.kind === "chord-major")));
const last = birthday.mapped.at(-1);
assert.ok(last);
assert.equal(last.startBeat, 47);
assert.equal(last.durationBeats, 3);
assert.deepEqual(last.buttons.map((button) => button.kind).sort(), ["bass-root", "chord-major"]);
assert.ok(last.buttons.every((button) => button.pitchClass === "F"));

const bassOnly = mapAbcEventsToStradellaButtons(buttons, birthday.bass, "F", "bass-notes-only");
const chordOnly = mapAbcEventsToStradellaButtons(buttons, birthday.bass, "F", "chord-symbols-only");
assert.deepEqual(bassOnly.at(-1)?.buttons.map((button) => button.kind), ["bass-root"]);
assert.deepEqual(chordOnly.at(-1)?.buttons.map((button) => button.kind), ["chord-major"]);
assert.ok(bassOnly.filter((event) => event.stradellaChordMarker).every((event) => event.buttons.length === 0));
assert.ok(chordOnly.filter((event) => !event.stradellaChordMarker && event.chordSymbols.length === 0)
  .every((event) => event.buttons.length === 0));

// The existing Katyusha repeat notation must also unfold in chronological time.
const katyusha = exercise("katyusha", "A");
assert.deepEqual(katyusha.mapped.slice(0, 4).map((event) => event.startBeat), [0, 0.5, 1, 1.5]);
assert.ok(katyusha.mapped.at(-1)?.startBeat === 46);
console.log("Easy Polka and Happy Birthday: two-voice notation, repeat timing, bass/chord mapping, alternate endings and final combined button event passed.");
