/**
 * v0.15.0 Stradella configuration regression matrix.
 *
 * Tests layout/row availability, harmonic identity versus nominal inversions,
 * actual played buttons versus visual markers, configured C–B/F–E ranges,
 * physical reach and ranking invariants across search modes. Not an acoustic
 * verification of reeds or the La Melodiosa sound engine.
 */
import assert from "node:assert/strict";
import { STRADELLA_PRESETS, generateStradella } from "../src/stradella";
import type { BassCount, FinderChordPattern, StradellaChordFinderMode } from "../src/types";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { combinationTones } from "../src/tools/stradellaChordFinder/voicings";
import { ergonomicSpanLimit } from "../src/tools/stradellaChordFinder/searchBassAndChordButtons";
import { ergonomicDistance } from "../src/tools/stradellaChordFinder/utils";
import {
  analyzeConfiguredStradellaVoicing,
  nominalRegisterNote,
  type StradellaRegisterModel,
} from "../src/tools/stradellaChordFinder/registerModel";

const layouts = Object.keys(STRADELLA_PRESETS) as BassCount[];
const modes: StradellaChordFinderMode[] = ["bass-only", "chord-buttons-only", "bass-and-chords"];
const patterns: FinderChordPattern[] = ["major-triad", "minor-triad", "minor7"];
const octaveGroups = ["C-B", "F-E"] as const;
const models: StradellaRegisterModel[] = [];
for (const bassGrouping of octaveGroups) for (const chordGrouping of octaveGroups) {
  models.push({
    bass: { startOctave: 2, grouping: bassGrouping },
    chord: { startOctave: 3, grouping: chordGrouping },
  });
  models.push({
    bass: { startOctave: 4, grouping: bassGrouping },
    chord: { startOctave: 2, grouping: chordGrouping },
  });
}
let cases = 0;
let candidates = 0;
let unavailable = 0;
const matrix: string[] = [];

/** Assert only musical/physical invariants common to all search modes. */
function verifyResult(buttons: ReturnType<typeof generateStradella>, results: ReturnType<typeof getStradellaChordFinderResults>, mode: StradellaChordFinderMode, maximum: number, reachColumns: number, requestedBass: string | null, root: string, model: StradellaRegisterModel) {
  const visibleIds = new Set(buttons.map((b) => b.id));
  const reach = ergonomicSpanLimit(buttons.filter((b) => b.kind.startsWith("chord-")), reachColumns);
  assert.ok(results.length > 0, "API should explain an unavailable combination");
  assert.ok(results.filter((r) => r.recommended).length <= 3);
  for (const result of results) {
    if (!result.playable) { unavailable += 1; continue; }
    candidates += 1;
    assert.ok(result.playbackButtons.length > 0, "Playable candidates must sound at least one button");
    assert.equal(new Set(result.playbackButtons.map((b) => b.id)).size, result.playbackButtons.length, "Repeated physical button");
    for (const b of result.playbackButtons) assert.ok(visibleIds.has(b.id), "Button outside chosen preset");
    const produced = new Set(combinationTones(result.playbackButtons));
    const target = new Set(result.targetPitches);
    assert.deepEqual(result.coveredPitches.filter((p) => !produced.has(p)), []);
    assert.deepEqual(result.missingPitches.filter((p) => produced.has(p)), []);
    assert.deepEqual(result.extraPitches.filter((p) => target.has(p)), []);
    assert.equal(result.exact, result.missingPitches.length === 0 && result.extraPitches.length === 0);
    assert.equal(result.registral.rootPitchClassPresent, produced.has(root));
    if (mode === "bass-only") assert.ok(result.playbackButtons.every((b) => b.kind.startsWith("bass-")));
    if (mode === "chord-buttons-only") assert.ok(result.playbackButtons.every((b) => b.kind.startsWith("chord-")));
    if (mode === "bass-and-chords") {
      assert.ok(result.playbackButtons.length <= maximum, "Exceeded button cap");
      assert.deepEqual(result.extraPitches, [], "Mixed finder adds foreign pitch classes");
      for (let i = 0; i < result.playbackButtons.length; i++) for (let j = i + 1; j < result.playbackButtons.length; j++) {
        assert.ok(ergonomicDistance(result.playbackButtons[i], result.playbackButtons[j]) <= reach + 1e-7, "Exceeded reach limit");
      }
    }
    if (requestedBass) {
      const modeled = analyzeConfiguredStradellaVoicing(result.playbackButtons, root, model);
      assert.equal(modeled.lowestPitchClass, requestedBass, "Requested slash bass not lowest under active model");
    }
    assert.ok(!result.recommended || result.playable, "Unplayable candidate is Recommended");
  }
}

// All declared physical layouts, including both non-equivalent 48-bass variants.
for (const layout of layouts) {
  const buttons = generateStradella(layout, 38, 1.18, "natural");
  const preset = STRADELLA_PRESETS[layout];
  assert.equal(buttons.length, Number(layout.split("-")[0]));
  assert.equal(buttons.length, preset.rows.length * preset.count);
  assert.equal(new Set(buttons.map((b) => b.id)).size, buttons.length);
  assert.deepEqual(new Set(buttons.map((b) => b.kind)), new Set(preset.rows));
  for (const mode of modes) for (const pattern of patterns) {
    const res = getStradellaChordFinderResults(buttons, "C", pattern, mode, true, 3, 5.5);
    verifyResult(buttons, res, mode, 3, 5.5, null, "C", models[0]);
    cases += 1;
  }
  const triad = getStradellaChordFinderResults(buttons, "C", "major-triad", "bass-and-chords", false, 3, 5.5);
  matrix.push(`${layout}: ${triad.filter((r) => r.playable).length} Cmaj realizations`);
}

// The layout really changes capabilities: a tiny 8-bass instrument cannot
// supply every C minor-seven note, while the full-size layouts can.
assert.equal(getStradellaChordFinderResults(generateStradella("8", 38, 1.18, "natural"), "C", "minor7", "bass-and-chords", false, 3, 5.5).some((r) => r.playable), false);
assert.ok(getStradellaChordFinderResults(generateStradella("96", 38, 1.18, "natural"), "C", "minor7", "bass-and-chords", false, 3, 5.5).some((r) => r.playable));

// Eight register combinations: two octave groupings independently for each
// button family, plus a low-bass and a higher-bass scenario.
for (const model of models) {
  for (const grouping of octaveGroups) {
    for (const pitch of ["C", "E", "F", "B"]) {
      const note = nominalRegisterNote(pitch, { startOctave: 2, grouping });
      assert.ok(note);
      const expectedOctave = 2 + Number(grouping === "F-E" && ["C", "E"].includes(pitch));
      assert.equal(note.octave, expectedOctave);
    }
  }
  for (const layout of ["48-8x6", "72", "96", "120"] as BassCount[]) {
    const buttons = generateStradella(layout, 38, 1.18, "natural");
    for (const [root, pattern, bass] of [
      ["E", "minor7", "G"], ["G", "major6", "G"], ["C", "major7", "B"],
    ] as const) {
      const result = getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", false, 4, 5.5, bass, model);
      verifyResult(buttons, result, "bass-and-chords", 4, 5.5, bass, root, model);
      cases += 1;
    }
  }
}

// Separate harmonic identity is retained for pitch-class equivalents.
const standardButtons = generateStradella("96", 38, 1.18, "natural");
const em = getStradellaChordFinderResults(standardButtons, "E", "minor7", "bass-and-chords", false, 4, 5.5, "G", models[0]);
const g6 = getStradellaChordFinderResults(standardButtons, "G", "major6", "bass-and-chords", false, 4, 5.5, null, models[0]);
assert.ok(em.some((r) => r.playable && r.exact));
assert.ok(g6.some((r) => r.playable && r.exact));
assert.deepEqual(new Set(em.find((r) => r.playable && r.exact)!.coveredPitches), new Set(g6.find((r) => r.playable && r.exact)!.coveredPitches));

// Rendering geometry must not alter candidate identities in the same preset.
for (const layout of ["24", "48-12x4", "72", "96", "120"] as BassCount[]) {
  const signature = (size: number, spacing: number) => getStradellaChordFinderResults(
    generateStradella(layout, size, spacing, "natural"), "C", "minor7", "bass-and-chords", false, 3, 5.5,
  ).map((r) => ({ ids: r.playbackButtons.map((b) => b.id), recommended: !!r.recommended, exact: r.exact }));
  assert.deepEqual(signature(26, 1), signature(38, 1.18), `${layout}: layout zoom changed recommendations`);
  assert.deepEqual(signature(58, 1.35), signature(38, 1.18), `${layout}: spacing changed recommendations`);
  cases += 2;
}
console.log(`Stradella v0.15.0 configuration matrix passed: ${cases} cases, ${candidates} playable candidate checks, ${unavailable} unavailable results checked.`);
console.log(`Presets: ${layouts.join(", ")}. Models: ${models.length} C–B/F–E and octave combinations.`);
console.log(matrix.join(" | "));
