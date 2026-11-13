import assert from "node:assert/strict";
import { voicingIntervalLayout, voicingIntervalMetrics } from "../../../src/tools/stradellaChordFinder/voicingIntervalLayout";
import { estimateLegendTextWidth, wrapLegendText } from "../../../src/tools/harmonyExplorer/legendTextLayout";
import type { ModeledStradellaNote } from "../../../src/tools/stradellaChordFinder/registerModel";
import { test } from "vitest";

const note = (midi: number, pitchClass: string, octave: number, buttonId: string): ModeledStradellaNote =>
  ({ midi, pitchClass, octave, buttonId, source: "chord" });
const model = [
  note(59,"B",2,"bass-B"), note(60,"C",3,"chord-C"),
  note(64,"E",3,"chord-C"), note(64,"E",3,"chord-E"),
  note(69,"A",3,"chord-A"),
];
const layout = voicingIntervalLayout(model);

test("Voicing chart: proportional positions, gaps and repeated pitches", () => {
  assert.deepEqual(layout.positions.map((n) => n.midi), [59, 60, 64, 69]);
  assert.deepEqual(layout.distances.map((g) => g.semitones), [1, 4, 5]);
  assert.equal(layout.positions[2].count, 2, "repeated nominal pitches collapse to one dot with count");
  assert.equal(layout.positions[1].x - layout.positions[0].x, 23,
    "one semitone is exactly the base spacing");
  assert.equal(layout.positions[2].x - layout.positions[1].x, 4 * 23,
    "all note positions remain strictly proportional to pitch differences");
  assert.ok(layout.width >= layout.positions.at(-1)!.x + 49);
  assert.deepEqual(voicingIntervalLayout([]).distances, []);
});

test("Nominal spacing stays readable at every footer slider setting, including adjacent semitones, accidentals,…", () => {
  // Nominal spacing stays readable at every footer slider setting, including
  // adjacent semitones, accidentals, and labels with unison multipliers.
  for (const fontSize of [16, 20, 26, 32, 40]) {
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
    assert.ok(dense.metrics.distanceY > dense.metrics.trackY + dense.metrics.circleRadius + dense.metrics.distanceFontSize,
      "semitone numbers sit below the proportional note axis");
    assert.ok(dense.metrics.trackY > dense.metrics.topLabelY +
      Math.max(...dense.positions.map((n) => n.lane)) * dense.metrics.laneStep,
      "note label lanes remain above the proportional axis");
    assert.ok(dense.metrics.leaderBottomY - dense.metrics.leaderTopY <= 12,
      "marker leaders are short even with dense labels");
    assert.ok(dense.width >= dense.positions.at(-1)!.x + dense.positions.at(-1)!.labelWidth / 2,
      "final note label fits within the chart width");
  }
  const metrics = voicingIntervalMetrics(24);
  assert.ok(metrics.noteFontSize > metrics.distanceFontSize, "note labels stay visually prominent");
  assert.ok(metrics.height >= 60 && metrics.height - metrics.distanceY >= 8,
    "compact chart reserves space below the interval labels");
  assert.ok(metrics.noteFontSize <= 20, "chart font stays smaller than main footer text");
  assert.ok(voicingIntervalMetrics(40).noteFontSize <= 20, "maximum explanation size cannot inflate the chart");
  assert.ok(voicingIntervalMetrics(40, 3).height >= 100,
    "dense layouts reserve room for separate label lanes instead of squeezing them");
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
});
