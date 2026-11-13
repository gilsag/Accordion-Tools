import assert from "node:assert/strict";
import {
  finderPatternForHarmonyFamily,
  harmonyFamilyForFinderPattern,
  pitchClassNameFromNumber,
  pitchClassNumberFromName,
} from "../../../src/tools/harmonyExplorer/integration.ts";
import { test } from "vitest";

test("harmony-integration.test.ts: all Harmony/Stradella adapter tests", () => {
  assert.equal(finderPatternForHarmonyFamily("major"), "major-triad");
  assert.equal(finderPatternForHarmonyFamily("minor7"), "minor7");
  assert.equal(finderPatternForHarmonyFamily("halfDiminished7"), "minor7b5");
  assert.equal(finderPatternForHarmonyFamily("sus2"), "sus2");
  assert.equal(finderPatternForHarmonyFamily("augmented7"), "dominant7sharp5");
  assert.equal(harmonyFamilyForFinderPattern("dominant7sharp5"), "augmented7");
  assert.equal(harmonyFamilyForFinderPattern("dominant7"), "dominant7");
  assert.equal(harmonyFamilyForFinderPattern("major9"), null);
  assert.equal(pitchClassNameFromNumber(10), "A#");
  assert.equal(pitchClassNumberFromName("Bb"), 10);
  assert.equal(pitchClassNumberFromName("F#"), 6);
});
