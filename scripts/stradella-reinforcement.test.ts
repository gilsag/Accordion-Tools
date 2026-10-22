import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools.ts";
import { combinationTones, isBassButton } from "../src/tools/stradellaChordFinder/voicings.ts";
import type { DiagramButton, FinderChordPattern } from "../src/types.ts";

const buttons = generateStradella("96", 38, 1.18, "default");
const find = (root: string, pattern: FinderChordPattern, maxButtons = 4, spanColumns = 5.5) =>
  getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true, maxButtons, spanColumns);
const labels = (played: DiagramButton[]) => played.map((button) =>
  isBassButton(button) ? `${button.kind}:${button.pitchClass}` : `${button.kind}:${button.chordRoot}`);

// Phase 3: root reinforcement is a separate sounding button even when it adds
// no *new* pitch class to a triad. The regular chord-only option is retained.
{
  const results = find("C", "major-triad", 2);
  const chordOnly = results.find((item) => labels(item.playbackButtons).join("|") === "chord-major:C");
  assert.ok(chordOnly && chordOnly.exact && !chordOnly.registral.rootBassSupported);
  const supported = results.find((item) =>
    item.playbackButtons.length === 2 && item.registral.rootBassSupported &&
    item.registral.bassChordOverlaps.includes("C"));
  assert.ok(supported, "C bass + C major must survive pitch-class-redundancy filtering");
  assert.equal(supported.exact, true);
  assert.equal(supported.registral.bassButtonCount, 1);
  assert.equal(supported.registral.chordButtonCount, 1);
  assert.deepEqual(labels(supported.playbackButtons), ["bass-root:C", "chord-major:C"]);
  assert.deepEqual(supported.extraPitches, []);
  assert.deepEqual(supported.missingPitches, []);
  assert.equal(supported.registral.inversionCharacter, "root-supported");
  assert.equal(find("C", "major-triad", 1).some((item) => item.registral.bassChordOverlaps.includes("C")), false,
    "A reinforcing bass must respect the maximum button count");
  assert.equal(find("C", "major-triad", 2, 0.1).some((item) => item.registral.bassChordOverlaps.includes("C")), false,
    "A reinforcing bass must respect the configured maximum physical span");
}

// This phase adds one root bass only to chord-button-only bases; no second
// bass note or alternative non-root reinforcement is introduced.
for (const [root, pattern] of [
  ["C", "major-triad"], ["C", "dominant11"], ["C", "minor11"],
  ["C", "major13"], ["C", "dominant13"], ["E", "minor7"],
] as [string, FinderChordPattern][]) {
  const candidates = find(root, pattern);
  const seen = new Set<string>();
  for (const candidate of candidates.filter((item) => item.playable)) {
    assert.deepEqual(candidate.extraPitches, [], `${root} ${pattern}: no foreign pitch classes`);
    const ids = candidate.playbackButtons.map((button) => button.id);
    assert.equal(new Set(ids).size, ids.length, `${root} ${pattern}: no repeated button`);
    // All buttons must add a pitch class except, optionally, one bass button
    // reinforcing the requested root already present in the preset chords.
    const full = combinationTones(candidate.playbackButtons);
    const redundant = candidate.playbackButtons.filter((_, i) => {
      const reduced = combinationTones(candidate.playbackButtons.filter((__, j) => i !== j));
      return full.length === reduced.length && full.every((pitch) => reduced.includes(pitch));
    });
    if (redundant.length) {
      assert.equal(redundant.length, 1, `${root} ${pattern}: at most one redundant button`);
      assert.equal(isBassButton(redundant[0]), true, `${root} ${pattern}: only bass reinforcement may be redundant`);
      assert.equal(redundant[0].pitchClass, root, `${root} ${pattern}: only root reinforcement permitted`);
      assert.equal(candidate.registral.bassButtonCount, 1,
        `${root} ${pattern}: no secondary bass combined with reinforced root`);
      assert.ok(candidate.registral.bassChordOverlaps.includes(root), `${root} ${pattern}: root must also sound in chords`);
    }
    // Canonicalize sounded musical button roles to catch duplicate realizations
    // at alternative physical positions or bass/counterbass locations.
    const recipe = candidate.playbackButtons.map((button) => isBassButton(button)
      ? `bass:${button.pitchClass}` : `${button.kind}:${button.chordRoot}`).sort().join("|");
    assert.equal(seen.has(recipe), false, `${root} ${pattern}: duplicate musical recipe ${recipe}`);
    seen.add(recipe);
  }
}

// The earlier important outputs must remain accessible, even though the
// candidate list is now larger. Recommendation tuning belongs to Phase 4.
{
  const em7 = find("E", "minor7", 3)[0];
  assert.deepEqual(labels(em7.playbackButtons), ["bass-counterbass:E", "chord-major:G"]);
  const cmaj7 = find("C", "major7", 3)[0];
  assert.deepEqual(labels(cmaj7.playbackButtons), ["bass-counterbass:B", "chord-major:C"]);
  const cmaj13 = find("C", "major13");
  assert.ok(cmaj13.some((item) => labels(item.playbackButtons).join("|") ===
    "chord-minor:A|chord-diminished7:D"));
  assert.ok(cmaj13.some((item) => labels(item.playbackButtons).join("|") ===
    "chord-minor:A|bass-root:B"));
  assert.ok(cmaj13.some((item) => item.registral.rootBassSupported &&
    item.registral.bassChordOverlaps.includes("C")),
    "Extended chords should also expose physically feasible root reinforcement");
}
console.log("✓ Stradella selective root-bass reinforcement tests passed");
