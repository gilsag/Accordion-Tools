import type { ModeledStradellaNote } from "./registerModel";

/** Nominal-pitch diagram geometry only: equal MIDI pitches collapse to one
 * point, and adjacent MIDI differences are reported exactly. Horizontal gaps
 * can be expanded to keep labels legible; the numerals are the actual musical
 * distances, not measurements of rendered line lengths or recorded audio. */
export const VOICING_INTERVAL_SEMITONE_PIXELS = 23;
export const VOICING_INTERVAL_SIDE_PADDING = 49;

export function voicingIntervalMetrics(fontSize: number) {
  // Keep the chart subordinate to the main footer, including at 40px text.
  const noteFontSize = Math.max(14, Math.min(20, Math.round(fontSize * 0.60)));
  const distanceFontSize = Math.max(12, Math.min(16, Math.round(fontSize * 0.48)));
  const circleRadius = Math.max(6, Math.min(7, Math.round(fontSize * 0.19)));
  // Two distinct baselines: note labels above/below the track, distances just
  // above it. The top note row and gap numerals must never share a text band.
  const topLabelY = noteFontSize + 2;
  const trackY = topLabelY + distanceFontSize + 14;
  const distanceY = trackY - 6;
  const lowerLabelY = trackY + noteFontSize + 11;
  const height = lowerLabelY + 9;
  return { noteFontSize, distanceFontSize, circleRadius, topLabelY,
    trackY, distanceY, lowerLabelY, height };
}

type IntervalLayoutOptions = {
  fontSize?: number;
  /** The same enharmonic spelling used by the actual SVG labels. */
  displayLabel?: (note: ModeledStradellaNote, count: number) => string;
};

/** Deliberately conservative width estimate for bold SVG music labels.
 * No font metrics are available during pure calculation or in Node tests. */
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
  const metrics = voicingIntervalMetrics(options.fontSize ?? 18);
  const labeled = unique.map((note, index) => {
    const count = notes.filter((other) => other.midi === note.midi).length;
    const label = options.displayLabel?.(note, count) ??
      `${note.pitchClass}${note.octave}${count > 1 ? ` ×${count}` : ""}`;
    return { ...note, count, label, labelWidth: labelWidth(label, metrics.noteFontSize), index };
  });
  const first = labeled[0];
  const leftPad = Math.max(VOICING_INTERVAL_SIDE_PADDING, (first?.labelWidth ?? 0) / 2 + 12);
  const minAdjacentGap = Math.max(
    metrics.circleRadius * 2 + 15,
    metrics.distanceFontSize * 1.55 + 14,
  );
  const positions: (typeof labeled[number] & { x: number })[] = [];
  for (const [index, note] of labeled.entries()) {
    const preceding = labeled[index - 1];
    const twoBack = labeled[index - 2];
    const lastX = index > 0 ? positions[index - 1].x : leftPad;
    const twoBackX = index > 1 ? positions[index - 2].x : leftPad;
    // Notes alternate between the top and bottom lanes. Protect labels two
    // nodes apart, which otherwise collide at high font sizes or with ×N.
    const laneSeparation = twoBack
      ? twoBackX + (twoBack.labelWidth + note.labelWidth) / 2 + 14
      : leftPad;
    const x = Math.max(
      leftPad + (note.midi - start) * VOICING_INTERVAL_SEMITONE_PIXELS,
      preceding ? lastX + minAdjacentGap : leftPad,
      laneSeparation,
    );
    positions.push({ ...note, x });
  }
  const distances = positions.slice(1).map((note, i) => ({
    fromX: positions[i].x,
    toX: note.x,
    semitones: note.midi - positions[i].midi,
  }));
  const last = positions.at(-1);
  const width = Math.ceil(Math.max(300, (last?.x ?? leftPad) +
    Math.max(VOICING_INTERVAL_SIDE_PADDING, (last?.labelWidth ?? 0) / 2 + 12)));
  return { positions, distances, width };
}
