import type { ModeledStradellaNote } from "./registerModel";

/** Nominal pitch geometry: note positions are strictly proportional to MIDI
 * differences. Label collisions are solved vertically, never by moving notes. */
export const VOICING_INTERVAL_SEMITONE_PIXELS = 23;
export const VOICING_INTERVAL_SIDE_PADDING = 49;

export function voicingIntervalMetrics(fontSize: number, laneCount = 2) {
  const noteFontSize = Math.max(14, Math.min(20, Math.round(fontSize * 0.60)));
  const distanceFontSize = Math.max(12, Math.min(16, Math.round(fontSize * 0.48)));
  const circleRadius = Math.max(6, Math.min(7, Math.round(fontSize * 0.19)));
  const laneStep = noteFontSize + 7;
  const topLabelY = noteFontSize + 3;
  const trackY = topLabelY + (Math.max(1, laneCount) - 1) * laneStep + distanceFontSize + 23;
  const distanceY = trackY - 8;
  const lowerLabelY = trackY + noteFontSize + 11;
  const height = lowerLabelY + 9;
  return { noteFontSize, distanceFontSize, circleRadius, topLabelY, trackY,
    distanceY, lowerLabelY, laneStep, height };
}

type IntervalLayoutOptions = {
  fontSize?: number;
  displayLabel?: (note: ModeledStradellaNote, count: number) => string;
};

/** Conservative estimate for assigning independent label rows. Real rendered
 * glyph metrics should additionally be checked in the browser. */
function labelWidth(label: string, fontSize: number): number {
  return Array.from(label).reduce((width, char) => {
    if (/[\s.,:;!|ilI1']/u.test(char)) return width + fontSize * 0.36;
    if (/[MW@%#]/u.test(char)) return width + fontSize * 0.91;
    if (/[♭♯×]/u.test(char)) return width + fontSize * 0.75;
    return width + fontSize * 0.73;
  }, 0);
}

export function voicingIntervalLayout(
  notes: readonly ModeledStradellaNote[],
  options: IntervalLayoutOptions = {},
) {
  const unique = [...new Map(notes.map((note) => [note.midi, note])).values()]
    .sort((a, b) => a.midi - b.midi);
  const start = unique[0]?.midi ?? 0;
  const baseMetrics = voicingIntervalMetrics(options.fontSize ?? 18);
  const labeled = unique.map((note, index) => {
    const count = notes.filter((other) => other.midi === note.midi).length;
    const label = options.displayLabel?.(note, count) ??
      `${note.pitchClass}${note.octave}${count > 1 ? ` ×${count}` : ""}`;
    return { ...note, count, label, labelWidth: labelWidth(label, baseMetrics.noteFontSize), index };
  });
  const largestHalfLabel = labeled.reduce((max, n) => Math.max(max, n.labelWidth / 2), 0);
  const leftPad = Math.max(VOICING_INTERVAL_SIDE_PADDING, largestHalfLabel + 12);
  const rightEdges: number[] = [];
  const positions = labeled.map((note) => {
    const x = leftPad + (note.midi - start) * VOICING_INTERVAL_SEMITONE_PIXELS;
    let lane = rightEdges.findIndex((right) => x - note.labelWidth / 2 >= right + 12);
    if (lane < 0) { lane = rightEdges.length; rightEdges.push(-Infinity); }
    rightEdges[lane] = x + note.labelWidth / 2;
    return { ...note, x, lane };
  });
  const metrics = voicingIntervalMetrics(options.fontSize ?? 18, Math.max(2, rightEdges.length));
  const distances = positions.slice(1).map((note, i) => ({
    fromX: positions[i].x,
    toX: note.x,
    semitones: note.midi - positions[i].midi,
  }));
  const last = positions.at(-1);
  const width = Math.ceil(Math.max(300, (last?.x ?? leftPad) +
    Math.max(VOICING_INTERVAL_SIDE_PADDING, (last?.labelWidth ?? 0) / 2 + 12)));
  return { positions, distances, width, metrics };
}
