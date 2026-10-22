import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools.ts";
import { ROOT_BASS_SUPPORT_BONUS, registralPreferenceAdjustment } from
  "../src/tools/stradellaChordFinder/registralPreference.ts";
import { isBassButton } from "../src/tools/stradellaChordFinder/voicings.ts";
import type { DiagramButton, FinderChordPattern } from "../src/types.ts";

const buttons = generateStradella("96", 38, 1.18, "default");
const find = (root: string, pattern: FinderChordPattern, maxButtons = 4) =>
  getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true, maxButtons, 5.5);
const recipe = (played: DiagramButton[]) => played.map((button) =>
  isBassButton(button) ? `bass:${button.pitchClass}` : `${button.kind}:${button.chordRoot}`).join("|");

// A small, explicit preference is added ONLY for one played root bass and
// at least one preset chord button. Non-root slash basses are not penalized.
assert.equal(ROOT_BASS_SUPPORT_BONUS, 1);
assert.ok(ROOT_BASS_SUPPORT_BONUS < 3, "Root support must cost less than adding a button");
{
  const major = find("C", "major-triad", 2);
  const chordOnly = major.find((r) => recipe(r.playbackButtons) === "chord-major:C");
  const reinforced = major.find((r) => recipe(r.playbackButtons) === "bass:C|chord-major:C");
  assert.ok(chordOnly && reinforced);
  assert.equal(registralPreferenceAdjustment(chordOnly.registral), 0);
  assert.equal(registralPreferenceAdjustment(reinforced.registral), -ROOT_BASS_SUPPORT_BONUS);
  assert.equal(major[0], chordOnly, "A root bass must not automatically justify an extra button");
}
{
  const cmaj7 = find("C", "major7", 3);
  assert.equal(recipe(cmaj7[0].playbackButtons), "bass:B|chord-major:C",
    "The ergonomic Cmaj7/B alternative must remain first");
  assert.equal(registralPreferenceAdjustment(cmaj7[0].registral), 0,
    "A non-root bass is legitimate, not intrinsically penalized");
  const rootSupported = cmaj7.find((r) => r.registral.inversionCharacter === "root-supported");
  assert.ok(rootSupported);
  assert.equal(registralPreferenceAdjustment(rootSupported.registral), -ROOT_BASS_SUPPORT_BONUS);
}
{
  const em7 = find("E", "minor7", 3);
  assert.equal(recipe(em7[0].playbackButtons), "bass:E|chord-major:G");
  assert.equal(em7[0].playbackButtons[0].kind, "bass-counterbass");
  assert.equal(registralPreferenceAdjustment(em7[0].registral), -ROOT_BASS_SUPPORT_BONUS);
}
{
  const c9 = find("C", "dominant9");
  const recommended = c9.filter((r) => r.recommended);
  assert.equal(recipe(c9[2].playbackButtons), "bass:C|chord-major:C|chord-minor:G",
    "A root-supported C9 moves ahead of comparable mixed alternatives, without overriding button cost");
  assert.equal(c9[2].recommended, false,
    "Root reinforcement alone must not turn a less convenient option into a recommendation");
  assert.ok(recommended.some((r) => r.registral.bassRole === "none"),
    "Chord-only exact alternatives remain worth recommending");
  assert.ok(c9.some((r) => r.registral.bassRole === "non-root"),
    "Non-root-bass alternatives remain available");
  assert.ok(c9.filter((r) => r.recommended).length <= 3);
}
{
  const cmaj13 = find("C", "major13");
  const recommended = cmaj13.filter((r) => r.recommended);
  assert.equal(recipe(recommended[0].playbackButtons), "chord-minor:A|chord-diminished7:D",
    "Retain the compact two-button Cmaj13 choice");
  assert.deepEqual(new Set(recommended.map((r) => recipe(r.playbackButtons))), new Set([
    "chord-minor:A|chord-diminished7:D",
    "chord-minor:A|bass:B",
    "chord-minor:D|chord-minor:A|chord-dominant7:G",
  ]), "Retain three musically different Cmaj13 recommendation strategies");
  const slashShell = recommended.find((r) => recipe(r.playbackButtons) === "chord-minor:A|bass:B");
  assert.ok(slashShell);
  assert.equal(slashShell.registral.potentialSlashBass, "B");
  assert.equal(registralPreferenceAdjustment(slashShell.registral), 0);
  assert.ok(cmaj13.some((r) => r.registral.rootBassSupported),
    "Root-supported alternatives should remain selectable, even when not top-three");
}
{
  const c11 = find("C", "dominant11");
  const supported = c11.find((r) => r.recommended && r.registral.rootBassSupported);
  assert.ok(supported);
  assert.match(supported.recommendationReason ?? "", /bass\/counterbass button also reinforces C/,
    "Recommend root support conditionally, without asserting octave assignments");
  assert.ok(c11.some((r) => r.recommended && r.registral.bassRole === "none"));
}
console.log("✓ Stradella registral recommendation and bounded root-support tests passed");
