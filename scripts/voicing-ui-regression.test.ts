import assert from "node:assert/strict";
import { voicingIntervalLayout, voicingIntervalMetrics } from "../src/tools/stradellaChordFinder/voicingIntervalLayout";
import { estimateLegendTextWidth, wrapLegendText } from "../src/tools/harmonyExplorer/legendTextLayout";
import { readFileSync } from "node:fs";
import type { ModeledStradellaNote } from "../src/tools/stradellaChordFinder/registerModel";

const note = (midi: number, pitchClass: string, octave: number, buttonId: string): ModeledStradellaNote =>
  ({ midi, pitchClass, octave, buttonId, source: "chord" });
const model = [
  note(59,"B",2,"bass-B"), note(60,"C",3,"chord-C"),
  note(64,"E",3,"chord-C"), note(64,"E",3,"chord-E"),
  note(69,"A",3,"chord-A"),
];
const layout = voicingIntervalLayout(model);
assert.deepEqual(layout.positions.map((n) => n.midi), [59, 60, 64, 69]);
assert.deepEqual(layout.distances.map((g) => g.semitones), [1, 4, 5]);
assert.equal(layout.positions[2].count, 2, "repeated nominal pitches collapse to one dot with count");
assert.equal(layout.positions[1].x - layout.positions[0].x, 23,
  "one semitone is exactly the base spacing");
assert.equal(layout.positions[2].x - layout.positions[1].x, 4 * 23,
  "all note positions remain strictly proportional to pitch differences");
assert.ok(layout.width >= layout.positions.at(-1)!.x + 49);
assert.deepEqual(voicingIntervalLayout([]).distances, []);
// Nominal spacing stays readable at every footer slider setting, including
// adjacent semitones, accidentals, and labels with unison multipliers.
for (const fontSize of [16, 20, 26, 32, 40]) {
  const metrics = voicingIntervalMetrics(fontSize);
  const compactCluster = Array.from({ length: 10 }, (_, i) =>
    note(60 + i, ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"][i], 3, `pitch-${i}`));
  compactCluster.push(note(66, "F#", 3, "second-button"));
  const dense = voicingIntervalLayout(compactCluster, {
    fontSize,
    displayLabel: (n, count) => `${n.pitchClass.replace("#", "♯")}${n.octave}${count > 1 ? ` ×${count}` : ""}`,
  });
  assert.ok(dense.distances.every((gap) => gap.semitones === 1));
  for (let i = 0; i < dense.positions.length; i += 1) {
    if (i > 0) {
      assert.ok(Math.abs(dense.positions[i].x - dense.positions[i - 1].x - 23) < 1e-8,
        "notes must not be displaced horizontally to avoid text collisions");
    }
    for (let j = 0; j < i; j += 1) {
      const before = dense.positions[j];
      const current = dense.positions[i];
      if (before.lane !== current.lane) continue;
      assert.ok(current.x - before.x >= (before.labelWidth + current.labelWidth) / 2 + 11,
        `labels in the same lane overlap at font ${fontSize}`);
    }
  }
  assert.ok(dense.metrics.distanceY >= dense.metrics.topLabelY +
    (Math.max(...dense.positions.map((n) => n.lane)) * dense.metrics.laneStep) + metrics.distanceFontSize,
    "all label lanes remain above the interval numbers");
  assert.ok(metrics.lowerLabelY > metrics.trackY + metrics.noteFontSize,
    "lower note labels clear the marker line");
  assert.ok(dense.width >= dense.positions.at(-1)!.x + dense.positions.at(-1)!.labelWidth / 2,
    "final note label fits within the chart width");
}

const metrics = voicingIntervalMetrics(24);
assert.ok(metrics.noteFontSize > metrics.distanceFontSize, "note labels stay visually prominent");
assert.ok(metrics.height >= 60 && metrics.height - metrics.lowerLabelY >= 8,
  "compact chart reserves room for the lower note labels");
assert.ok(metrics.noteFontSize <= 20, "chart font stays smaller than main footer text");
assert.ok(voicingIntervalMetrics(40).noteFontSize <= 20, "maximum explanation size cannot inflate the chart");
assert.ok(voicingIntervalMetrics(40).height >= 100,
  "chart reserves enough vertical space for separate label lanes instead of squeezing them");
assert.equal(voicingIntervalLayout([note(60, "C", 3, "C"), note(64, "E", 3, "E"),
  note(67, "G", 3, "G")]).width, 300, "small triads use their intrinsic width, not a stretched 480px panel");

const spanish = "séptima mayor con quinta aumentada y relaciones cromáticas";
for (const width of [85, 125, 220, 340]) {
  for (const line of wrapLegendText(spanish, width, 13)) {
    assert.ok(estimateLegendTextWidth(line, 13) <= width,
      `Legend line exceeds allocated width: ${line}`);
  }
}
assert.deepEqual(wrapLegendText("", 100, 12), [""]);
assert.deepEqual(wrapLegendText("Minor seventh with shared tones", 340, 13),
  ["Minor seventh with shared tones"], "use available horizontal room before wrapping");
assert.ok(wrapLegendText("Pneumonoultramicroscopicsilicovolcanoconiosis", 85, 13).length > 1,
  "split a single overlong word rather than drawing it outside the legend");
const circle = readFileSync(new URL("../src/tools/harmonyExplorer/components/HarmonicCircle.tsx", import.meta.url), "utf8");
assert.match(circle, /legendHeadingWidth/, "legend column fits translated headings");
assert.doesNotMatch(circle, /rightColumnWidth \* 0\.36/, "no fixed 36%-width legend heading column");
assert.match(circle, /Math\.max\(44, 8 \+ nameLines.length \* legendValueLineHeight/, "legend rows use tighter vertical spacing when text wraps");
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
assert.match(app, /finderVoicingChartVisible/, "Stradella footer tracks when the interval chart should replace the registral line text");
assert.match(app, /<StradellaVoicingIntervals[\s\S]*fontSize=\{finderExplanationFontSize\}/,
  "render the interval chart inside the exported footer using the explanation font size");
assert.doesNotMatch(app, /showStradellaVoicingIntervals && \([\s\S]*<StradellaVoicingIntervals/,
  "do not render the interval chart as a detached panel below the diagram");
const intervalComponent = readFileSync(new URL("../src/components/tools/StradellaVoicingIntervals.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/App.css", import.meta.url), "utf8");
assert.match(intervalComponent, /voicing-interval-gap-tight/, "1-semitone gaps receive a dedicated red style");
assert.match(intervalComponent, /width=\{width\}/, "SVG retains intrinsic chart width");
assert.match(intervalComponent, /x1=\{gap.fromX\}[\s\S]*?x2=\{gap.toX\}/,
  "colored interval lines use full proportional center-to-center distances");
assert.match(intervalComponent, /width: `min\(100%, \$\{width\}px\)`/, "only shrink long charts, never upscale short ones");
const panel = readFileSync(new URL("../src/components/tools/StradellaChordFinderPanel.tsx", import.meta.url), "utf8");
assert.match(panel, /\{showRealizationNote && \(/, "spacing control belongs to the master diagram-note section");
assert.match(panel, /\{level === "voicing" && \([\s\S]*finder-voicing-spacing-option/, "spacing checkbox is nested under Registral voicing");
assert.match(panel, /disabled=\{!noteLevels\.voicing\}/, "spacing control cannot be used with hidden registral note");
assert.match(panel, /\["physical", t\("tools\.physicalRealization"\)\][\s\S]*?\["voicing", t\("tools\.registralVoicing"\)\]/,
  "physical realization precedes registral voicing in the menu at all times");
assert.match(app, /const finderAnnotationDisplayLines = finderAnnotation\?\.lines \?\? \[\]/,
  "diagram uses permanent note-generator ordering, independent of chart setting");
assert.match(css, /\.finder-annotation-line \{[\s\S]*?grid-template-columns: max-content minmax\(0, 1fr\)/,
  "footer notes use a label/value grid to reduce awkward wrapped lines");
assert.match(css, /\.finder-annotation-line-voicing \{[\s\S]*?align-items: center/, "title and chart share the same footer row");
assert.match(css, /\.voicing-interval-gap-tight \{[\s\S]*?stroke: #c43f35/,
  "1-semitone intervals are highlighted in red");
console.log("✓ Nominal interval spacing and bilingual SVG legend wrapping passed");
