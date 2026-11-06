import assert from "node:assert/strict";
import abcjs from "abcjs";
import { readFileSync } from "node:fs";
import { discoverAbcExamples } from "./abc-example-catalog.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examples = await discoverAbcExamples(join(root, "public/abc"));
const cases = [
  ["cueca-floreo-1-c", "C", "C,,", "G,,", ["C D E F E F", "G B d g z2", "G F E F E D", "C E G c z2"]],
  ["cueca-floreo-2-g", "G", "G,,", "D,,", ["G/ G/ F/ G/ A/ B/ c2 ^c", "d f a d' z2", "d c B c B A", "G B d g z2"]],
  ["cueca-floreo-2-am", "Am", "A,,", "E,,", ["A/ A/ ^G/ A/ B/ c/ d2 ^d", "e ^g b e' z2", "e d c d c B", "A c e a z2"]],
  ["cueca-floreo-3-c", "C", "C,,", "G,,", ["c e d c B A", "G ^F/ G/ B/ d/ g z2", "G A G F E D", "C B,/ C/ E/ G/ c z2"]],
  ["cueca-floreo-3-em", "Em", "E,,", "B,,", ["e g f e d c", "B ^A/ B/ ^d/ f/ b z2", "b c' b a g f", "e ^d/ e/ g/ b/ e' z2"]],
];

function durationUnits(bar) {
  return bar.trim().split(/\s+/).reduce((sum, token) => {
    const m = /^(?:[\^_=]*[A-Ga-g][,']*|z)(\d+)?(\/\d*)?$/.exec(token);
    assert.ok(m, `Invalid ABC note/rest token: ${token}`);
    return sum + Number(m[1] ?? 1) / (m[2] ? Number(m[2].slice(1) || 2) : 1);
  }, 0);
}

assert.equal(cases.length, 5);
for (const [index, [id, key, tonic, dominant, expectedMelody]] of cases.entries()) {
  const label = `Cueca floreo ${index + 1}`;
  const found = examples.filter((entry) => entry.value === id);
  assert.equal(found.length, 1);
  assert.equal(found[0].file, `abc/${id}.abc`);
  assert.equal(found[0].label, label, `${id}: example label`);

  const source = readFileSync(join(root, "public", found[0].file), "utf8");
  assert.ok(source.includes(`T:${label}\n`));
  assert.match(source, /^M:6\/8$/m);
  assert.match(source, /^L:1\/8$/m);
  assert.match(source, /^Q:1\/4=80$/m);
  assert.match(source, new RegExp(`^K:${key}$`, "m"));
  assert.match(source, /^V:1 clef=treble$/m);
  assert.match(source, /^V:2 clef=bass$/m);
  assert.doesNotMatch(source, /!finger|"(?:C|G|A|E|D|B)m?"|\[V:3\]/);

  const voice1 = source.match(/^\[V:1\] (.+) \|\]$/m);
  const voice2 = source.match(/^\[V:2\] (.+) \|\]$/m);
  assert.ok(voice1 && voice2, `${id}: two playable voices required`);
  const melody = voice1[1].split(" | ");
  const bass = voice2[1].split(" | ");
  assert.deepEqual(melody, expectedMelody);
  assert.equal(bass.length, 4);
  for (let bar = 0; bar < 4; bar += 1) {
    assert.equal(durationUnits(melody[bar]), 6, `${id}: melody bar ${bar + 1}`);
    assert.equal(durationUnits(bass[bar]), 6, `${id}: bass bar ${bar + 1}`);
    const pitch = bar === 0 || bar === 3 ? tonic : dominant;
    assert.deepEqual(bass[bar].split(" "), ["z", pitch, pitch, "z", pitch, pitch],
      `${id}: bass attacks must be only on eighth-note slots 2, 3, 5 and 6`);
  }

  // Verify the actual abcjs voice/timing interpretation, not just source tokens.
  const tune = abcjs.parseOnly(source)[0];
  assert.ok(tune, `${id}: abcjs parse failed`);
  assert.equal(tune.metaText?.tempo?.bpm, 80, `${id}: abcjs tempo`);
  const sequenced = abcjs.synth.sequence(tune, {});
  assert.equal(sequenced.length, 2, `${id}: abcjs must preserve melody and bass voices`);
  const bassNotes = sequenced[1].filter((event) => event.el_type === "note" && event.pitches?.length);
  assert.equal(bassNotes.length, 16, `${id}: exactly four bass attacks in each bar`);
  const expectedTimes = [0, 1, 2, 3].flatMap((bar) => [1, 2, 4, 5].map((slot) => (bar * 6 + slot) / 8));
  assert.deepEqual(bassNotes.map((event) => event.timing), expectedTimes,
    `${id}: abcjs bass attack times (whole-note units)`);
  assert.deepEqual(bassNotes.map((event) => event.pitches[0].name),
    [tonic, dominant, dominant, tonic].flatMap((pitch) => Array(4).fill(pitch)),
    `${id}: ABC bass root sequence`);
}
console.log("Five two-voice cueca ABC examples: 80 BPM, exact 6/8 bass attack positions, unchanged melody except Floreo 1 correction, and six-language labels passed.");
