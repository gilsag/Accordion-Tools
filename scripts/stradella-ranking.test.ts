import { omissionPenalty } from "../src/music/chordVoicingPolicy";
import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools.ts";
import { distance, ergonomicDistance, STRADELLA_VERTICAL_WEIGHT } from "../src/tools/stradellaChordFinder/utils.ts";
import type { BassCount, FinderChordPattern } from "../src/types.ts";

// The diagram's rendered button size and spacing must not change musical
// recommendations, physical recipes, or their ordering for the same layout.
// Include the entire ranked list, not only the first Recommended example.
const sizes = [25, 38, 58];
const spacings = [1.0, 1.18, 1.35];

type Scenario = {
  layout: BassCount;
  root: string;
  pattern: FinderChordPattern;
  maxButtons: number;
  spanColumns: number;
};

const scenarios: Scenario[] = [
  { layout: "96", root: "E", pattern: "minor7", maxButtons: 3, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "major7", maxButtons: 3, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "augmented-triad", maxButtons: 4, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "dominant11", maxButtons: 4, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "minor11", maxButtons: 4, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "dominant13", maxButtons: 4, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "major13", maxButtons: 4, spanColumns: 5.5 },
  { layout: "96", root: "C", pattern: "major13", maxButtons: 3, spanColumns: 4.5 },
  { layout: "96", root: "C", pattern: "major13", maxButtons: 2, spanColumns: 3.5 },
  { layout: "72", root: "C", pattern: "major13", maxButtons: 3, spanColumns: 5.5 },
  { layout: "72", root: "C", pattern: "dominant11", maxButtons: 3, spanColumns: 4.5 },
  { layout: "48-8x6", root: "C", pattern: "minor7", maxButtons: 3, spanColumns: 5.5 },
  { layout: "24", root: "C", pattern: "major-triad", maxButtons: 2, spanColumns: 3.5 },
];

function rankedSignature({ layout, root, pattern, maxButtons, spanColumns }: Scenario, size: number, spacing: number) {
  const buttons = generateStradella(layout, size, spacing, "default");
  return getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true, maxButtons, spanColumns)
    .map((candidate) => ({
      playable: candidate.playable,
      exact: candidate.exact,
      recommended: Boolean(candidate.recommended),
      buttonIds: candidate.playbackButtons.map((button) => button.id),
      covered: candidate.coveredPitches,
      missing: candidate.missingPitches,
      extra: candidate.extraPitches,
    }));
}

for (const scenario of scenarios) {
  const baseline = rankedSignature(scenario, 38, 1.18);
  for (const size of sizes) {
    for (const spacing of spacings) {
      assert.deepEqual(
        rankedSignature(scenario, size, spacing), baseline,
        `${scenario.layout} ${scenario.root} ${scenario.pattern}, ${scenario.maxButtons} buttons, span ${scenario.spanColumns}: ` +
          `ranking changed at button size ${size}, spacing ${spacing}`,
      );
    }
  }
}

// Vertical means along the physical accordion's fifths direction, which is
// horizontal on the rendered diagram. The perpendicular direction is neutral.
assert.equal(STRADELLA_VERTICAL_WEIGHT, 1.10);
const orientationButtons = generateStradella("96", 38, 1.18, "default");
const firstBass = orientationButtons.find((b) => b.kind === "bass-root" && b.column === 7);
const secondBass = orientationButtons.find((b) => b.kind === "bass-root" && b.column === 8);
assert.ok(firstBass && secondBass, "Reference bass buttons must exist");
assert.ok(Math.abs(ergonomicDistance(firstBass, secondBass) / distance(firstBass, secondBass) - 1.10) < 1e-9,
  "Physical vertical/fifths movement must be 10% more costly");
const syntheticPerpendicular = { ...firstBass, y: firstBass.y + 75 };
assert.equal(ergonomicDistance(firstBass, syntheticPerpendicular), distance(firstBass, syntheticPerpendicular),
  "Pure movement between functional rows must have no penalty");

// Preserve the established essential realizations at the reference geometry.
const em7 = rankedSignature(scenarios[0], 38, 1.18)[0];
assert.equal(em7.exact, true, "Em7's first result should remain exact");
assert.equal(em7.buttonIds.length, 2, "Em7 should retain the practical two-button alternative");
assert.ok(em7.buttonIds[0].startsWith("stradella-bass-counterbass-"), "Em7 should retain E counterbass + G major");
assert.ok(em7.buttonIds[1].startsWith("stradella-chord-major-"), "Em7 should retain E counterbass + G major");

const cmaj13 = rankedSignature(scenarios[6], 38, 1.18);
assert.ok(cmaj13.length > 3, "Cmaj13 should retain alternatives beyond the recommended shortlist");
assert.ok(cmaj13.filter((candidate) => candidate.recommended).length <= 3, "Cmaj13 should have at most three recommendations");
assert.ok(cmaj13.some((candidate) => candidate.exact), "Cmaj13 should retain exact alternatives");
assert.ok(cmaj13.some((candidate) => !candidate.exact && candidate.missing.length === 1), "Cmaj13 should retain near-complete approximations");

// Pin representative pedagogical examples to catch regressions in physical
// button selection as well as recommendation ordering.
function physicalRecipe(scenario: Scenario) {
  const buttons = generateStradella(scenario.layout, 38, 1.18, "default");
  return getStradellaChordFinderResults(
    buttons, scenario.root, scenario.pattern, "bass-and-chords", true,
    scenario.maxButtons, scenario.spanColumns,
  ).map((candidate) => ({
    ...candidate,
    recipe: candidate.playbackButtons.map((button) =>
      `${button.kind}:${button.kind.startsWith("bass-") ? button.pitchClass : button.chordRoot}`,
    ),
  }));
}
assert.deepEqual(physicalRecipe(scenarios[0])[0].recipe, ["bass-counterbass:E", "chord-major:G"]);
assert.deepEqual(physicalRecipe(scenarios[1])[0].recipe, ["bass-counterbass:B", "chord-major:C"]);
assert.deepEqual(physicalRecipe(scenarios[2])[0].recipe, [
  "bass-root:C", "bass-counterbass:E", "bass-counterbass:G#",
]);
// The 5+-tone score intentionally no longer pins a crowded Cmaj13 recipe
// ahead of clearer reductions. Verify shortlist validity instead.
const cmaj13Results = physicalRecipe(scenarios[6]);
const cmaj13Recommended = cmaj13Results.filter((item) => item.recommended);
assert.ok(cmaj13Recommended.length > 0 && cmaj13Recommended.length <= 3);
assert.ok(cmaj13Results.some((item) => item.recipe.join("|") ===
  "chord-minor:A|chord-diminished7:D"),
  "Keep previously recommended exact/near-complete recipes selectable");
assert.ok(cmaj13Results.some((item) => item.recipe.join("|") ===
  "chord-minor:A|bass-root:B"),
  "Keep a standard 1–3–7–13 reduced alternative selectable");
assert.ok(cmaj13Recommended.every((item) => item.extraPitches.length === 0));

console.log(`✓ Stradella ranking is size- and spacing-independent (${scenarios.length} scenarios × ${sizes.length * spacings.length} geometries)`);

// For dominant/major 13ths, the natural 11th can be omitted to avoid
// rubbing against the retained major third; keeping the ninth is preferable.
// This is a soft preference only: compare like-for-like requests, not C13/D
// against C13/E (different bass constraints and different physical recipes).
for (const family of ["dominant13", "major13"] as const) {
  assert.ok(omissionPenalty("C", family, ["G", "F"]) <
    omissionPenalty("C", family, ["G", "D"]),
  `${family}: omission of natural 11th should cost less than omission of 9th`);
}
assert.ok(omissionPenalty("C", "minor13", ["F"]) >
  omissionPenalty("C", "minor13", ["D"]),
"minor thirteenth retains the distinct, non-clashing eleventh policy");
