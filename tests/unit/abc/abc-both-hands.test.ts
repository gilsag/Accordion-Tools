import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  abcEventsForStradellaSide, abcEventsForTrebleSide, mapAbcEventsToBothHands,
  mapAbcEventsToStradellaButtons, mapAbcEventsToTrebleButtons, parseAbc,
} from "../../../src/tools/abcPlayerTools";
import { stradellaButtonsFor, trebleButtonsFor, type SideButtonSettings } from "../../../src/app/sideButtons";
import { generateStradella } from "../../../src/stradella";
import { generateTreble } from "../../../src/treble";
import { test } from "vitest";

const settings: SideButtonSettings = {
  basses: "96", stradellaAccidental: "natural", trebleLayout: "c-system", trebleRows: 5,
  trebleSize: "full", pianoTrebleRange: "three-octave", buttonSize: 28, spacing: 2.3,
  diagramVerticalSpacing: 0, pianoKeyWidthScale: 1, pianoKeyHeightScale: 1,
  pianoBlackKeyWidthScale: 1, pianoBlackKeyHeightScale: 1, trebleAngle: 30, showTrebleOctaves: true,
};

test("The side builders reproduce the generators the workspace has always used", () => {
  assert.deepEqual(stradellaButtonsFor(settings), generateStradella("96", 28, 2.3, "natural", 0));
  assert.deepEqual(trebleButtonsFor(settings), generateTreble("c-system", 5, "full", 28, 2.3, 30, true, 0));
  const compact = { ...settings, trebleSize: "one-octave" as const };
  const wanted = (reference: ReturnType<typeof generateTreble>) => reference.filter((button) => button.column >= 10 && button.column <= 12);
  const windowed = trebleButtonsFor(compact, wanted);
  assert.ok(windowed.some((button) => button.column === 10) && windowed.some((button) => button.column === 12),
    "Compact treble sizes keep the wanted buttons in view");
  assert.ok(Math.min(...windowed.map((button) => button.column)) > 0, "and center the window on them");
  assert.ok(trebleButtonsFor({ ...settings, trebleLayout: "piano" }).every((button) => button.id.startsWith("piano-treble-")));
});

test("Both hands = what Treble alone plays (voice 1) + what Stradella alone plays (voice 2)", () => {
  const parsed = parseAbc(readFileSync("public/abc/katyusha.abc", "utf8"));
  const treble = trebleButtonsFor(settings);
  const stradella = stradellaButtonsFor(settings);
  const both = mapAbcEventsToBothHands(treble, stradella, parsed.events, parsed.keyTonicPitchClass,
    "bass-notes-and-chord-symbols", false);
  const trebleOnly = mapAbcEventsToTrebleButtons(treble, abcEventsForTrebleSide(parsed.events), false);
  const stradellaOnly = mapAbcEventsToStradellaButtons(stradella, abcEventsForStradellaSide(parsed.events),
    parsed.keyTonicPitchClass, "bass-notes-and-chord-symbols");
  assert.equal(both.mapped.length, trebleOnly.length + stradellaOnly.length);
  assert.equal(both.playable.length, both.mapped.length);
  for (let index = 1; index < both.mapped.length; index += 1) {
    assert.ok(both.mapped[index - 1].startBeat <= both.mapped[index].startBeat, "One timeline in start order");
  }
  const ids = (events: typeof both.mapped) => events.flatMap((event) => event.buttons.map((button) => button.id)).sort();
  assert.deepEqual(ids(both.mapped), ids([...trebleOnly, ...stradellaOnly]), "Same buttons as each side alone");
  assert.ok(both.mapped.some((event) => event.buttons.some((button) => button.kind === "treble-note")));
  assert.ok(both.mapped.some((event) => event.buttons.some((button) => button.kind === "bass-root")));
  const firstBeat = both.mapped.filter((event) => event.startBeat === 0);
  assert.ok(firstBeat.some((event) => event.voiceId === "1") && firstBeat.some((event) => event.voiceId === "2"),
    "Melody and bass start together");
});
