import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResults, getStradellaChordFinderResult } from "../src/tools/stradellaChordFinderTools.ts";
import { explainStradellaRealization } from "../src/tools/stradellaChordFinder/explainRealization.ts";
import { realizationAnnotation } from "../src/tools/stradellaChordFinder/diagramAnnotations.ts";
import type { DiagramButton, FinderChordPattern } from "../src/types.ts";

const buttons = generateStradella("96", 38, 1.18, "natural");
const find = (root: string, pattern: FinderChordPattern, maxButtons = 4) =>
  getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true, maxButtons, 5.5);
const recipe = (played: DiagramButton[]) => played.map((button) =>
  button.kind.startsWith("bass-") ? `bass:${button.pitchClass}` : `${button.kind}:${button.chordRoot}`);
const named = (root: string, pattern: FinderChordPattern, names: string[], maxButtons = 4) => {
  const result = find(root, pattern, maxButtons).find((item) => {
    const actual = recipe(item.playbackButtons);
    return actual.length === names.length && names.every((name) => actual.includes(name));
  });
  assert.ok(result, `Expected ${root}/${pattern}: ${names.join(" + ")}`);
  return result;
};
{
  const r = named("E", "minor7", ["bass:E", "chord-major:G"]);
  const text = explainStradellaRealization("E", "minor7", r);
  assert.match(text, /Registral character: root-supported/i);
  assert.match(text, /counterbass/i);
  assert.match(realizationAnnotation("E", "minor7", r).detail, /Physical realization: E counterbass/);
}
{
  const r = named("C", "major7", ["bass:B", "chord-major:C"]);
  const text = explainStradellaRealization("C", "major7", r);
  assert.match(text, /potential Cmaj7\/B/);
  assert.match(text, /not proof that B is the lowest acoustic pitch/);
  assert.match(realizationAnnotation("C", "major7", r).detail, /Physical realization: B counterbass/);
}
{
  const r = named("C", "major13", ["bass:B", "chord-minor:A"]);
  const text = explainStradellaRealization("C", "major13", r);
  assert.match(text, /omits G \(fifth\), D \(ninth\), F \(eleventh\)/);
  assert.match(text, /potential Cmaj13\/B/);
  assert.match(text, /functional 1–3–7–13 shell/i);
}
{
  const r = named("C", "major13", ["chord-minor:A", "chord-diminished7:D"]);
  const text = explainStradellaRealization("C", "major13", r);
  assert.match(text, /preset-chord buttons only/);
  assert.match(text, /no separate bass\/counterbass button/);
  assert.match(text, /E.?F|major third and natural eleventh/);
  assert.match(realizationAnnotation("C", "major13", r).detail, /Chord buttons only/);
}
{
  const r = named("C", "major-triad", ["bass:C", "chord-major:C"], 2);
  const text = explainStradellaRealization("C", "major-triad", r);
  assert.match(text, /root-supported/);
  assert.match(text, /rather than adding a new pitch class/);
}
{
  const withMarker = getStradellaChordFinderResult(buttons, "C", "major-triad", "chord-buttons-only", true);
  const text = explainStradellaRealization("C", "major-triad", withMarker, "chord-buttons-only");
  assert.match(text, /preset-chord buttons only/);
  assert.doesNotMatch(text, /Registral character: root-supported/);
  assert.match(realizationAnnotation("C", "major-triad", withMarker).detail, /no separate bass/);
}
{
  const r = getStradellaChordFinderResult(buttons, "C", "major-triad", "bass-only");
  const text = explainStradellaRealization("C", "major-triad", r, "bass-only");
  assert.match(text, /multiple bass pitches/);
  assert.match(text, /Button roles alone cannot identify the lowest acoustic pitch/);
}
{
  const c11 = find("C", "dominant11").find((item) => item.playable && item.coveredPitches.includes("E") && item.coveredPitches.includes("F"));
  assert.ok(c11);
  assert.match(explainStradellaRealization("C", "dominant11", c11), /semitone/);
  const min11 = find("C", "minor11").find((item) => item.playable && item.coveredPitches.includes("D#") && item.coveredPitches.includes("F"));
  assert.ok(min11, "Expected a Cmin11 realization retaining third and eleventh");
  assert.match(explainStradellaRealization("C", "minor11", min11), /whole tone/i);
}
console.log("✓ Stradella registral explanations and diagram-note tests passed");
