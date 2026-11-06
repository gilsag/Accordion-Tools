/** Time budget for the Stradella Chord Finder search, which runs synchronously
 * during render. Before the candidate pre-filter, 95% of these queries took up
 * to 265 ms and the slowest 438 ms; they now take about 2 ms and 20 ms. The
 * limits are loose enough for slow CI machines but fail on that regression. */
import assert from "node:assert/strict";
import { generateStradella } from "../src/stradella.ts";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools.ts";
import { CHORD_FINDER_OPTIONS } from "../src/music/chordDefinitions.ts";

const P95_BUDGET_MS = 40;
const MAX_BUDGET_MS = 200;
const roots = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const buttons = generateStradella("120", 38, 1.18, "default");
// Widest user settings: up to 4 buttons, Extended hand span.
const query = (root: string, pattern: (typeof CHORD_FINDER_OPTIONS)[number]["value"]) =>
  getStradellaChordFinderResults(buttons, root, pattern, "bass-and-chords", true, 4, 5.5);

query("C", "major13"); // warm-up (JIT, caches)
const times: number[] = [];
for (const option of CHORD_FINDER_OPTIONS) {
  for (const root of roots) {
    const started = performance.now();
    query(root, option.value);
    times.push(performance.now() - started);
  }
}
times.sort((a, b) => a - b);
const p95 = times[Math.floor(times.length * 0.95)];
const max = times[times.length - 1];
assert.ok(p95 <= P95_BUDGET_MS, `Stradella search p95 ${p95.toFixed(1)} ms exceeds ${P95_BUDGET_MS} ms`);
assert.ok(max <= MAX_BUDGET_MS, `Slowest Stradella search ${max.toFixed(1)} ms exceeds ${MAX_BUDGET_MS} ms`);
console.log(`✓ Stradella search budget: ${times.length} queries on 120 bass, p95 ${p95.toFixed(1)} ms, max ${max.toFixed(1)} ms`);
