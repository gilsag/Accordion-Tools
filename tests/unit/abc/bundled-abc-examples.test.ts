/** The bundled two-voice ABC tunes in public/abc: each must parse, keep its
 * tempo and meter, and map its bass voice to the intended Stradella buttons.
 * One section per tune family; add a section when a tune with its own
 * bass-mapping expectations is bundled. */
import assert from "node:assert/strict";
import abcjs from "abcjs";
import { readFileSync } from "node:fs";
import { abcEventsForStradellaSide, abcEventsForTrebleSide, mapAbcEventsToStradellaButtons, parseAbc } from "../../../src/tools/abcPlayerTools";
import { generateStradella } from "../../../src/stradella";
import { discoverAbcExamples } from "../../../scripts/abc-example-catalog.mjs";
import { join, resolve } from "node:path";
import { test } from "vitest";

test("Easy Polka and Happy Birthday", () => {
  {
    const buttons = generateStradella("96", 28, 2.3, "natural");

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
  }
});

test("Katyusha: accordion bass mapping", () => {
  // Katyusha: accordion bass mapping
  {
    const source = readFileSync("public/abc/katyusha.abc", "utf8");
    const parsed = parseAbc(source);
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.voiceIds, ["1", "2"]);
    assert.match(source, /^% accordion-tools-stradella-bass-chord$/m);
    assert.match(source, /Q:1\/4=100/);
    const events = abcEventsForStradellaSide(parsed.events);
    const buttons = generateStradella("96", 28, 2.3, "natural");
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
  }
});

test("Cueca floreos", async () => {
  {
    const root = resolve(".");
    const examples = await discoverAbcExamples(join(root, "public/abc"));
    const cases = [
      ["cueca-floreo-1-c", "C", "C,,", "G,,", ["C D E F E F", "G B d g z2", "G F E F E D", "C E G c z2"]],
      ["cueca-floreo-2-g", "G", "G,,", "D,,", ["G/ G/ F/ G/ A/ B/ c2 ^c", "d f a d' z2", "d c B c B A", "G B d g z2"]],
      ["cueca-floreo-2-am", "Am", "A,,", "E,,", ["A/ A/ ^G/ A/ B/ c/ d2 ^d", "e ^g b e' z2", "e d c d c B", "A c e a z2"]],
      ["cueca-floreo-3-c", "C", "C,,", "G,,", ["c e d c B A", "G ^F/ G/ B/ d/ g z2", "G A G F E D", "C B,/ C/ E/ G/ c z2"]],
      ["cueca-floreo-3-em", "Em", "E,,", "B,,", ["e g f e d c", "B ^A/ B/ ^d/ f/ b z2", "b c' b a g f", "e ^d/ e/ g/ b/ e' z2"]],
    ];

    function durationUnits(bar: string) {
      return bar.trim().split(/\s+/).reduce((sum: number, token: string) => {
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
      // abcjs types the sequence loosely; these are the fields the assertions read.
      const sequenced = abcjs.synth.sequence(tune, {}) as unknown as
        Array<Array<{ el_type: string; timing: number; pitches?: Array<{ name: string }> }>>;
      assert.equal(sequenced.length, 2, `${id}: abcjs must preserve melody and bass voices`);
      const bassNotes = sequenced[1].filter((event) => event.el_type === "note" && event.pitches?.length);
      assert.equal(bassNotes.length, 16, `${id}: exactly four bass attacks in each bar`);
      const expectedTimes = [0, 1, 2, 3].flatMap((bar) => [1, 2, 4, 5].map((slot) => (bar * 6 + slot) / 8));
      assert.deepEqual(bassNotes.map((event) => event.timing), expectedTimes,
        `${id}: abcjs bass attack times (whole-note units)`);
      assert.deepEqual(bassNotes.map((event) => event.pitches![0].name),
        [tonic, dominant, dominant, tonic].flatMap((pitch) => Array(4).fill(pitch)),
        `${id}: ABC bass root sequence`);
    }
    console.log("Five two-voice cueca ABC examples: 80 BPM, exact 6/8 bass attack positions, unchanged melody except Floreo 1 correction, and six-language labels passed.");
  }
});
