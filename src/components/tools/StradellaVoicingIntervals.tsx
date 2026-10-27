import type { FinderChordPattern } from "../../types";
import { chordToneName } from "../../tools/stradellaChordFinder/chordSpelling";
import type { ModeledStradellaNote } from "../../tools/stradellaChordFinder/registerModel";
import { useI18n } from "../../i18n/context";
import { voicingIntervalLayout } from "../../tools/stradellaChordFinder/voicingIntervalLayout";

type StradellaVoicingIntervalsProps = {
  notes: readonly ModeledStradellaNote[];
  root: string;
  pattern: FinderChordPattern;
  fontSize?: number;
  className?: string;
};

export function StradellaVoicingIntervals({
  notes,
  root,
  pattern,
  fontSize = 18,
  className = "",
}: StradellaVoicingIntervalsProps) {
  const { t } = useI18n();
  const { positions, distances, width, metrics } = voicingIntervalLayout(notes, {
    fontSize,
    displayLabel: (note, count) =>
      `${chordToneName(root, pattern, note.pitchClass)}${note.octave}${count > 1 ? ` ×${count}` : ""}`,
  });
  if (positions.length < 2) return null;

  return (
    <div className={`voicing-interval-chart ${className}`.trim()} aria-label={t("ui.voicingIntervalsTitle")}>
      <svg
        viewBox={`0 0 ${width} ${metrics.height}`}
        width={width}
        height={metrics.height}
        style={{ width: `min(100%, ${width}px)`, height: "auto" }}
        preserveAspectRatio="xMinYMin meet"
        className="voicing-interval-svg"
        role="img"
        aria-label={`${t("ui.voicingIntervalsTitle")}: ${positions.map((note) =>
          note.label).join(" – ")}`}
      >
        <line
          x1={positions[0].x}
          y1={metrics.trackY}
          x2={positions.at(-1)?.x}
          y2={metrics.trackY}
          className="voicing-interval-track"
        />
        {distances.map((gap, index) => (
          <g key={`gap-${index}`}>
            <title>
              {gap.semitones} {t(gap.semitones === 1 ? "ui.oneSemitone" : "ui.manySemitones")}
            </title>
            <line
              x1={gap.fromX}
              y1={metrics.trackY}
              x2={gap.toX}
              y2={metrics.trackY}
              className={gap.semitones === 1
                ? "voicing-interval-gap-tight"
                : gap.semitones === 2
                  ? "voicing-interval-close"
                  : "voicing-interval-open"}
            />
            <text
              x={(gap.fromX + gap.toX) / 2}
              y={metrics.distanceY}
              textAnchor="middle"
              className="voicing-interval-distance"
              style={{ fontSize: `${metrics.distanceFontSize}px` }}
            >
              {gap.semitones}
            </text>
          </g>
        ))}
        {positions.map((note) => (
          <g key={`note-${note.midi}`}>
            <circle
              cx={note.x}
              cy={metrics.trackY}
              r={metrics.circleRadius}
              className={note.source === "bass" ? "voicing-interval-bass" : "voicing-interval-chord"}
            />
            <line
              x1={note.x} x2={note.x}
              y1={metrics.leaderTopY}
              y2={metrics.leaderBottomY}
              className="voicing-interval-leader"
            />
            <text
              x={note.x}
              y={metrics.topLabelY + note.lane * metrics.laneStep}
              textAnchor="middle"
              className="voicing-interval-note"
              style={{ fontSize: `${metrics.noteFontSize}px` }}
            >
              {note.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
