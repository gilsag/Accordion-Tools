import type { DiagramButton } from "../../types";
import { makeSequenceArrowPath } from "../../tools/sequenceTools";

/** Each step's anchor is its first chord button, or its first bass button for
 * bass-only steps; arrows join consecutive anchors. */
function stepAnchor(buttons: readonly DiagramButton[]) {
  return buttons.find((button) => button.kind.startsWith("chord-")) ?? buttons[0];
}

/**
 * Draws the Progression Assistant's optimized path: a numbered badge on each
 * step's anchor button (a button reused by several steps shows "1·4") and a
 * curved arrow from step to step. Purely visual; it is included in exports
 * because the path is the content being shown.
 */
export function ProgressionPathLayer({ steps, buttonSize, arrowheadMarkerId }: {
  steps: readonly (readonly DiagramButton[])[];
  buttonSize: number;
  arrowheadMarkerId: string;
}) {
  const anchors = steps.map(stepAnchor);
  const badges = new Map<string, { button: DiagramButton; numbers: number[] }>();
  anchors.forEach((button, index) => {
    if (!button) return;
    const entry = badges.get(button.id) ?? { button, numbers: [] };
    entry.numbers.push(index + 1);
    badges.set(button.id, entry);
  });
  const radius = Math.max(9, buttonSize * 0.3);
  return (
    <g className="progression-path" aria-hidden="true">
      {anchors.slice(0, -1).map((from, index) => {
        const to = anchors[index + 1];
        if (!from || !to || from.id === to.id) return null;
        return (
          <path key={`progression-path-${index}`} className="progression-path-arrow"
            d={makeSequenceArrowPath(from, to, index, buttonSize, "curved")}
            markerEnd={`url(#${arrowheadMarkerId})`} />
        );
      })}
      {[...badges.values()].map(({ button, numbers }) => {
        const text = numbers.join("·");
        const width = Math.max(2 * radius, text.length * radius * 0.95 + radius * 0.7);
        // Upper-right of the button, clear of its label.
        const cx = button.x + buttonSize * 0.42;
        const cy = button.y - buttonSize * 0.46;
        return (
          <g key={`progression-badge-${button.id}`} className="progression-path-badge">
            <rect x={cx - width / 2} y={cy - radius} width={width} height={2 * radius} rx={radius} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={radius * 1.2}>{text}</text>
          </g>
        );
      })}
    </g>
  );
}
