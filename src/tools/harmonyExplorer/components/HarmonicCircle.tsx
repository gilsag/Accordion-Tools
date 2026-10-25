import type { ChordDisplayStyle } from "../../chordDisplay";
import { useI18n } from "../../../i18n/context";
import { familyName, scaleName } from "../../../i18n/musicTerms";
import { harmonyLegendFamilyText } from "../../../i18n/diagramLabels";
import { estimateLegendTextWidth, wrapLegendText } from "../legendTextLayout";
import { translate, type InterfaceLanguage } from "../../../i18n/catalog";
/*
  SVG rendering and interaction for the Harmonic Circle. Sectors arrive from
  the harmony engine; this component lays out rings, labels, tooltips, and
  selection. Visual polar distances are not physical Stradella ergonomics.
*/

import { useEffect, useState } from "react";
import type { Ref, MouseEvent as ReactMouseEvent } from "react";
import type { HarmonyPlaybackStyle, HarmonySelection, HarmonyVoicingStyle } from "../types";
import type { ChordCandidate, ChordFamilyId, ScaleId, SectorRelationships } from "../music";
import {
  analyzeVoiceLeading,
  chordFamily,
  chordFamilyColor,
  circleChordLabel,
  chordPitchNames,
  isSubset,
  pitchClassesForScale,
  pitchName,
  romanNumeralForChord,
  scaleDefinition,
} from "../music";

type HarmonicCircleProps = {
  sectors: SectorRelationships[];
  chordDisplayStyle: ChordDisplayStyle;
  counts: number[];
  referenceFamilyId: ChordFamilyId;
  relatedFamilyName: string;
  allFamiliesMode: boolean;
  scaleId: ScaleId;
  diatonicOnly: boolean;
  highlightDiatonic: boolean;
  showEnharmonics: boolean;
  showSeparators: boolean;
  showLegend: boolean;
  showExplanation: boolean;
  explanation: string;
  showToneTooltips: boolean;
  showNoteRing: boolean;
  colorByFamily: boolean;
  diameter: number;
  fontSize: number;
  playbackStyle: HarmonyPlaybackStyle;
  voicingStyle: HarmonyVoicingStyle;
  svgRef?: Ref<SVGSVGElement>;
  focusedReferenceRootPc?: number | null;
  onPlayChord?: (rootPc: number, familyId: ChordFamilyId, style: HarmonyPlaybackStyle) => void;
  onPlayNote?: (pitchClass: number) => void;
  onChordActivated?: (rootPc: number, familyId: ChordFamilyId, sectorIndex: number) => void;
  onPlayRelationship?: (referenceRootPc: number, referenceFamilyId: ChordFamilyId, targetRootPc: number, targetFamilyId: ChordFamilyId, style: HarmonyPlaybackStyle) => void;
  onSelectionChange?: (selection: HarmonySelection | null) => void;
};

type RingLayout = {
  count: number;
  inner: number;
  outer: number;
  radius: number;
  width: number;
};


type TooltipTone = {
  name: string;
  shared: boolean;
};

type TooltipData = {
  x: number;
  y: number;
  label: string;
  familyName: string;
  tones: TooltipTone[];
  sharedNames: string[];
  romanNumeral: string | null;
  diatonic: boolean;
  voiceLeadingText?: string;
};

type SelectedComparison = {
  sectorIndex: number;
  sharedCount: number;
  candidate: ChordCandidate;
};

function polar(cx: number, cy: number, radius: number, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

/** Bound text by both ring height and circumferential arc width so outer
 * labels remain readable without overflowing neighboring sectors. */
function fittedFontSize(
  requested: number,
  ringWidth: number,
  radius: number,
  labels: readonly string[],
) {
  if (labels.length === 0) return requested;
  const maxChars = Math.max(...labels.map((label) => label.length));
  const verticalMax = (ringWidth * 0.76) / (labels.length * 1.16);
  const arcWidth = 2 * radius * Math.sin((12.7 * Math.PI) / 180);
  const horizontalMax = arcWidth / Math.max(1, maxChars * 0.57);
  return Math.max(4.5, Math.min(requested, verticalMax, horizontalMax));
}

type DenseLayoutMetrics = {
  columns: number;
  rowsPerColumn: number;
  fontSize: number;
  lineHeight: number;
  columnSpacing: number;
  rowsFollowTangent: boolean;
};

function denseLayoutMetrics(
  requested: number,
  ringWidth: number,
  radius: number,
  labels: readonly string[],
  angleRadians: number,
): DenseLayoutMetrics {
  if (labels.length === 0) {
    return {
      columns: 1,
      rowsPerColumn: 1,
      fontSize: requested,
      lineHeight: requested * 1.2,
      columnSpacing: 0,
      rowsFollowTangent: false,
    };
  }

  const sectorArcWidth = 2 * radius * Math.sin((12.7 * Math.PI) / 180);

  // Text itself stays horizontal. Near the left and right sides of the circle,
  // therefore, stacking rows radially makes adjacent words collide horizontally.
  // In those sectors we transpose the grid: rows follow the tangent (mostly
  // vertical) and columns follow the radius (mostly horizontal). Near the top
  // and bottom the conventional orientation is better.
  const rowsFollowTangent = Math.abs(Math.cos(angleRadians)) > Math.abs(Math.sin(angleRadians));
  const horizontalSpan = (rowsFollowTangent ? ringWidth : sectorArcWidth) * 0.84;
  const verticalSpan = (rowsFollowTangent ? sectorArcWidth : ringWidth) * 0.80;

  let bestColumns = 1;
  let bestRows = labels.length;
  let bestFont = 0;
  const maximumColumns = Math.min(3, labels.length);

  for (let columns = 1; columns <= maximumColumns; columns += 1) {
    const rows = Math.ceil(labels.length / columns);
    const verticalMax = verticalSpan / Math.max(1, rows * 1.22);
    const columnWidth = horizontalSpan / columns;
    let horizontalMax = requested;

    for (let column = 0; column < columns; column += 1) {
      const start = column * rows;
      const end = Math.min(labels.length, start + rows);
      const columnLabels = labels.slice(start, end);
      if (columnLabels.length === 0) continue;
      const maxChars = Math.max(...columnLabels.map((label) => label.length));
      horizontalMax = Math.min(horizontalMax, columnWidth / Math.max(1, maxChars * 0.56));
    }

    const candidateFont = Math.min(requested, verticalMax, horizontalMax);
    if (candidateFont > bestFont + 0.01) {
      bestFont = candidateFont;
      bestColumns = columns;
      bestRows = rows;
    }
  }

  const fontSize = Math.max(6.25, Math.min(requested, bestFont));
  const lineHeight = Math.min(verticalSpan / Math.max(1, bestRows), fontSize * 1.22);
  const columnSpacing = bestColumns > 1 ? horizontalSpan / bestColumns : 0;

  return {
    columns: bestColumns,
    rowsPerColumn: bestRows,
    fontSize,
    lineHeight,
    columnSpacing,
    rowsFollowTangent,
  };
}

function wrapText(text: string, width: number, fontSize: number) {
  const maxChars = Math.max(18, Math.floor(width / Math.max(5, fontSize * 0.54)));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || current.length === 0) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}


function maxCandidatesForCount(sectors: readonly SectorRelationships[], count: number) {
  return Math.max(0, ...sectors.map((sector) => sector.bySharedCount.get(count)?.length ?? 0));
}

function relationshipRingWeight(sectors: readonly SectorRelationships[], count: number, allFamiliesMode: boolean) {
  if (!allFamiliesMode) return 1;
  const maximum = maxCandidatesForCount(sectors, count);
  // Give dense aggregate rings additional radial room, but leave enough space
  // for neighbouring rings. The geometry-aware text grid handles the remaining
  // variation between top/bottom and side sectors.
  return Math.max(1, Math.min(2.5, maximum / 5));
}


function voiceLeadingText(
  referencePitches: readonly number[],
  targetPitches: readonly number[],
  sectorIndex: number,
  language: InterfaceLanguage,
) {
  const analysis = analyzeVoiceLeading(referencePitches, targetPitches);
  const parts = [translate(language, "ui.semitoneMotion", { count: analysis.totalMotion, unit: translate(language, analysis.totalMotion === 1 ? "ui.oneSemitone" : "ui.manySemitones") })];
  if (analysis.addedPitchClasses.length > 0) {
    parts.push(`+${analysis.addedPitchClasses.map((pc) => pitchName(pc, sectorIndex, false)).join("/")}`);
  }
  if (analysis.removedPitchClasses.length > 0) {
    parts.push(`−${analysis.removedPitchClasses.map((pc) => pitchName(pc, sectorIndex, false)).join("/")}`);
  }
  return parts.join(" · ");
}

function tooltipPosition(x: number, y: number, width: number, height: number, canvasWidth: number, canvasHeight: number) {
  const offset = 16;
  const preferredX = x + offset;
  const preferredY = y + offset;
  return {
    x: Math.max(8, Math.min(preferredX, canvasWidth - width - 8)),
    y: Math.max(8, Math.min(preferredY, canvasHeight - height - 8)),
  };
}

export function HarmonicCircle({
  sectors,
  chordDisplayStyle,
  counts,
  referenceFamilyId,
  relatedFamilyName,
  allFamiliesMode,
  scaleId,
  diatonicOnly,
  highlightDiatonic,
  showEnharmonics,
  showSeparators,
  showLegend,
  showExplanation,
  explanation,
  showToneTooltips,
  showNoteRing,
  colorByFamily,
  diameter,
  fontSize,
  playbackStyle,
  voicingStyle,
  svgRef,
  focusedReferenceRootPc = null,
  onPlayChord,
  onPlayNote,
  onChordActivated,
  onPlayRelationship,
  onSelectionChange,
}: HarmonicCircleProps) {
  const { t, language } = useI18n();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selected, setSelected] = useState<SelectedComparison | null>(null);
  useEffect(() => {
    setTooltip(null);
    setSelected(null);
    onSelectionChange?.(null);
  }, [sectors, counts, onSelectionChange]);
  const margin = Math.max(22, diameter * 0.03);
  const gap = Math.max(34, diameter * 0.045);
  const rightColumnWidth = Math.max(380, diameter * 0.55);
  const hasRightColumn = showLegend || showExplanation;
  const referenceFamily = chordFamily(referenceFamilyId);
  const scale = scaleDefinition(scaleId);
  const strokeWidth = Math.max(1.3, diameter / 520);

  const legendFont = Math.max(11, fontSize);
  const legendNoteFont = Math.max(10, fontSize * 0.73);
  const legendValueFont = Math.max(10, legendFont * 0.9);
  const legendValueLineHeight = legendValueFont * 1.28;
  const legendNoteLineHeight = Math.max(14, legendNoteFont * 1.35);
  const referenceName = familyName(referenceFamilyId, referenceFamily.name, language);
  const legendRows = [
    { heading: `${t("ui.innerRing")}:`, name: referenceName, details: "" },
    ...counts.map((count, index) => ({
      heading: language === "es" ? `${t("ui.ringOrdinal", { count: index + 2 })}:` : `${ordinal(index + 2)} ring:`,
      name: harmonyLegendFamilyText(relatedFamilyName, language, diatonicOnly, allFamiliesMode),
      details: t("ui.sharedCount", { count, tone: count === 1 ? t("ui.oneNote") : t("ui.manyNotes") }),
    })),
  ];
  // Allocate only the width needed by the headings; a fixed 36% heading
  // column previously forced premature wrapping with empty space at right.
  const legendHeadingWidth = Math.max(...legendRows.map((row) =>
    estimateLegendTextWidth(row.heading, legendFont)));
  const legendContentX = Math.max(88, 20 + legendHeadingWidth + 12);
  const legendValueWidth = rightColumnWidth - legendContentX - 24;
  const measuredLegendRows = legendRows.map((row) => {
    const nameLines = wrapLegendText(row.name, legendValueWidth, legendValueFont);
    const detailLines = row.details ? wrapLegendText(row.details, legendValueWidth, legendNoteFont) : [];
    const height = Math.max(44, 8 + nameLines.length * legendValueLineHeight +
      detailLines.length * legendNoteLineHeight + 8);
    return { ...row, nameLines, detailLines, height };
  });
  let legendRowCursor = 18;
  const positionedLegendRows = measuredLegendRows.map((row) => {
    const position = { ...row, top: legendRowCursor };
    legendRowCursor += row.height;
    return position;
  });
  const legendNotes = [
    t("ui.parentScaleContext", { scale: scaleName(scaleId, scale.name, language) }),
    ...(highlightDiatonic && !diatonicOnly ? [colorByFamily ? t("ui.diatonicBoldLegend") : t("ui.diatonicBlueLegend")] : []),
    ...(colorByFamily ? [t("ui.familyColorsLegend")] : []),
  ].map((text) => wrapLegendText(text, rightColumnWidth - 48, legendNoteFont));
  const legendNotesY = legendRowCursor + 9;
  const legendNotesHeight = legendNotes.reduce((sum, lines) => sum + lines.length * legendNoteLineHeight + 4, 0);
  const legendBoxHeight = legendNotesY + legendNotesHeight + 12;

  const explanationFont = Math.max(11, fontSize * 0.78);
  const explanationLineHeight = explanationFont * 1.35;
  const explanationLines = wrapText(explanation, rightColumnWidth - 48, explanationFont);
  const explanationBoxHeight = 58 + explanationLines.length * explanationLineHeight + 18;
  const stackGap = showLegend && showExplanation ? 18 : 0;
  const rightStackHeight =
    (showLegend ? legendBoxHeight : 0) +
    stackGap +
    (showExplanation ? explanationBoxHeight : 0);

  const canvasWidth = diameter + margin * 2 + (hasRightColumn ? gap + rightColumnWidth : 0);
  const canvasHeight = Math.max(diameter + margin * 2, rightStackHeight + margin * 2);
  const cx = margin + diameter / 2;
  const cy = canvasHeight / 2;
  const outerRadius = diameter / 2 - 10;
  const holeRadius = outerRadius * 0.27;
  const centerHoleRadius = showNoteRing ? outerRadius * 0.15 : holeRadius;
  const noteRingRadius = (centerHoleRadius + holeRadius) / 2;
  const noteRingWidth = holeRadius - centerHoleRadius;

  // Single-family diagrams retain equal-width bands. Aggregate diagrams use
  // wider bands for the relationship classes with the densest sector lists.
  const referenceWeight = 1;
  const relationshipWeights = counts.map((count) => relationshipRingWeight(sectors, count, allFamiliesMode));
  const totalWeight = referenceWeight + relationshipWeights.reduce((sum, value) => sum + value, 0);
  const radialUnit = (outerRadius - holeRadius) / Math.max(1, totalWeight);
  const referenceBandWidth = radialUnit * referenceWeight;
  const referenceRadius = holeRadius + referenceBandWidth / 2;

  let ringCursor = holeRadius + referenceBandWidth;
  const ringLayouts: RingLayout[] = counts.map((count, index) => {
    const width = radialUnit * relationshipWeights[index];
    const inner = ringCursor;
    const outer = inner + width;
    ringCursor = outer;
    return { count, inner, outer, radius: inner + width / 2, width };
  });
  const ringBoundaries = [holeRadius, holeRadius + referenceBandWidth, ...ringLayouts.map((layout) => layout.outer)];

  const rightX = margin * 2 + diameter + gap;
  const rightStartY = (canvasHeight - rightStackHeight) / 2;
  const legendY = rightStartY;
  const explanationY = rightStartY + (showLegend ? legendBoxHeight + stackGap : 0);

  const showCandidateTooltip = (
    candidate: ChordCandidate,
    sector: SectorRelationships,
    sectorIndex: number,
    label: string,
    x: number,
    y: number,
  ) => {
    if (!showToneTooltips) return;
    const sharedSet = new Set(sector.referencePitches.filter((pc) => candidate.pitchClasses.includes(pc)));
    const toneNames = candidate.pitchClasses.map((pc) => ({
      name: pitchName(pc, sectorIndex, false),
      shared: sharedSet.has(pc),
    }));
    const sharedNames = candidate.pitchClasses
      .filter((pc) => sharedSet.has(pc))
      .map((pc) => pitchName(pc, sectorIndex, false));
    setTooltip({
      x,
      y,
      label,
      familyName: familyName(candidate.familyId, chordFamily(candidate.familyId).name, language),
      tones: toneNames,
      sharedNames,
      romanNumeral: romanNumeralForChord(candidate.rootPc, candidate.familyId, sector.referenceRootPc, scaleId),
      diatonic: candidate.diatonic,
      voiceLeadingText: voiceLeadingText(sector.referencePitches, candidate.pitchClasses, sectorIndex, language),
    });
  };

  const selectAndPlayCandidate = (
    event: ReactMouseEvent<SVGTextElement>,
    candidate: ChordCandidate,
    sector: SectorRelationships,
    sectorIndex: number,
    sharedCount: number,
  ) => {
    event.stopPropagation();
    setSelected({ sectorIndex, sharedCount, candidate });
    onChordActivated?.(candidate.rootPc, candidate.familyId, sectorIndex);
    onSelectionChange?.({
      sectorIndex,
      sharedCount,
      referenceRootPc: sector.referenceRootPc,
      referenceFamilyId,
      candidate,
    });
    if (voicingStyle === "smooth") {
      onPlayRelationship?.(
        sector.referenceRootPc,
        referenceFamilyId,
        candidate.rootPc,
        candidate.familyId,
        playbackStyle,
      );
    } else {
      onPlayChord?.(candidate.rootPc, candidate.familyId, playbackStyle);
    }
  };

  return (
    <svg
      ref={svgRef}
      className="harmonic-diagram"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      aria-label={t("ui.harmonicCircleAria")}
      onClick={() => { setSelected(null); onSelectionChange?.(null); }}
    >
      <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="#ffffff" />

      <g className="circle-geometry">
        {ringBoundaries.map((radius, index) => (
          <circle
            key={`ring-${index}-${radius}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill={index === 0 ? "#ffffff" : "none"}
            stroke="#16191f"
            strokeWidth={strokeWidth}
          />
        ))}
        {showNoteRing && (
          <circle
            cx={cx}
            cy={cy}
            r={centerHoleRadius}
            fill="none"
            stroke="#16191f"
            strokeWidth={strokeWidth}
          />
        )}

        {showSeparators &&
          Array.from({ length: 12 }, (_unused, index) => {
            const angle = -105 + index * 30;
            const inner = polar(cx, cy, showNoteRing ? centerHoleRadius : holeRadius, angle);
            const outer = polar(cx, cy, outerRadius, angle);
            return (
              <line
                key={`separator-${index}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#16191f"
                strokeWidth={strokeWidth * 0.82}
              />
            );
          })}
      </g>

      {showNoteRing && (
        <g className="note-ring">
          {sectors.map((sector, sectorIndex) => {
            const angle = -90 + sectorIndex * 30;
            const position = polar(cx, cy, noteRingRadius, angle);
            const label = pitchName(sector.referenceRootPc, sectorIndex, showEnharmonics);
            const noteFont = Math.max(8, Math.min(fontSize * 0.82, noteRingWidth * 0.44));
            return (
              <text
                key={`note-${sector.referenceRootPc}`}
                className="chord-label note-ring-label"
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={noteFont}
                onClick={(event) => {
                  event.stopPropagation();
                  onPlayNote?.(sector.referenceRootPc);
                }}
              >
                {label}
              </text>
            );
          })}
        </g>
      )}

      <g className="reference-ring">
        {sectors.map((sector, sectorIndex) => {
          const angle = -90 + sectorIndex * 30;
          const position = polar(cx, cy, referenceRadius, angle);
          const label = circleChordLabel(
            sector.referenceRootPc,
            referenceFamilyId,
            sectorIndex,
            showEnharmonics,
            chordDisplayStyle,
          );
          const toneNames = chordPitchNames(sector.referenceRootPc, referenceFamilyId, sectorIndex);
          const referenceFont = fittedFontSize(fontSize * 1.12, referenceBandWidth, referenceRadius, [label]);
          const romanNumeral = romanNumeralForChord(
            sector.referenceRootPc,
            referenceFamilyId,
            sector.referenceRootPc,
            scaleId,
          );
          const referenceSelected = selected?.sectorIndex === sectorIndex;
          const referenceFocused = focusedReferenceRootPc !== null && sector.referenceRootPc === focusedReferenceRootPc;
          return (
            <text
              key={`reference-${sector.referenceRootPc}`}
              className={`chord-label reference-label${referenceSelected ? " selected-reference" : ""}${referenceFocused ? " focused-reference" : ""}`}
              x={position.x}
              y={position.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={referenceFont}
              style={colorByFamily ? { fill: chordFamilyColor(referenceFamilyId) } : undefined}
              onMouseEnter={() => {
                if (!showToneTooltips) return;
                setTooltip({
                  x: position.x,
                  y: position.y,
                  label,
                  familyName: familyName(referenceFamilyId, referenceFamily.name, language),
                  tones: toneNames.map((name) => ({ name, shared: false })),
                  sharedNames: [],
                  romanNumeral,
                  diatonic: isSubset(
                    sector.referencePitches,
                    pitchClassesForScale(sector.referenceRootPc, scaleId),
                  ),
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={(event) => {
                event.stopPropagation();
                setSelected(null);
                onSelectionChange?.(null);
                onChordActivated?.(sector.referenceRootPc, referenceFamilyId, sectorIndex);
                onPlayChord?.(sector.referenceRootPc, referenceFamilyId, playbackStyle);
              }}
            >
              {label}
            </text>
          );
        })}
      </g>

      {ringLayouts.map((layout) => {
        const sharedCount = layout.count;
        return (
          <g key={`relationship-${sharedCount}`} className="relationship-ring">
            {sectors.map((sector, sectorIndex) => {
              const candidates = sector.bySharedCount.get(sharedCount) ?? [];
              if (candidates.length === 0) return null;
              const angleDegrees = -90 + sectorIndex * 30;
              const angle = (angleDegrees * Math.PI) / 180;
              const center = polar(cx, cy, layout.radius, angleDegrees);
              const labels = candidates.map((candidate) =>
                circleChordLabel(candidate.rootPc, candidate.familyId, sectorIndex, showEnharmonics, chordDisplayStyle),
              );

              if (allFamiliesMode) {
                const denseLayout = denseLayoutMetrics(fontSize, layout.width, layout.radius, labels, angle);
                const radialX = Math.cos(angle);
                const radialY = Math.sin(angle);
                const tangentX = -Math.sin(angle);
                const tangentY = Math.cos(angle);

                return (
                  <g key={`sector-${sectorIndex}-shared-${sharedCount}`}>
                    {candidates.map((candidate, candidateIndex) => {
                      const column = Math.floor(candidateIndex / denseLayout.rowsPerColumn);
                      const row = candidateIndex % denseLayout.rowsPerColumn;
                      const itemsInColumn = Math.min(
                        denseLayout.rowsPerColumn,
                        candidates.length - column * denseLayout.rowsPerColumn,
                      );
                      const rowOffset = (row - (itemsInColumn - 1) / 2) * denseLayout.lineHeight;
                      const columnOffset = (column - (denseLayout.columns - 1) / 2) * denseLayout.columnSpacing;

                      // At the sides, rows run tangentially (mostly vertically) and
                      // columns radially (mostly horizontally). At the top/bottom the
                      // axes are left in their conventional orientation. This keeps
                      // horizontal chord labels from colliding in side sectors.
                      const radialOffset = denseLayout.rowsFollowTangent ? columnOffset : rowOffset;
                      const tangentOffset = denseLayout.rowsFollowTangent ? rowOffset : columnOffset;
                      const x = center.x + radialOffset * radialX + tangentOffset * tangentX;
                      const y = center.y + radialOffset * radialY + tangentOffset * tangentY;
                      const label = labels[candidateIndex];
                      const isHighlighted = !diatonicOnly && highlightDiatonic && candidate.diatonic;
                      const isSelected = selected?.sectorIndex === sectorIndex
                        && selected.sharedCount === sharedCount
                        && selected.candidate.familyId === candidate.familyId
                        && selected.candidate.rootPc === candidate.rootPc;
                      const highlightClass = isHighlighted
                        ? (colorByFamily ? " diatonic-family-highlight" : " diatonic-highlight")
                        : "";
                      return (
                        <text
                          key={`${sectorIndex}-${sharedCount}-${candidate.familyId}-${candidate.rootPc}`}
                          className={`chord-label related-label${highlightClass}${isSelected ? " selected-chord" : ""}`}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={denseLayout.fontSize}
                          style={colorByFamily ? { fill: chordFamilyColor(candidate.familyId) } : undefined}
                          onMouseEnter={() => showCandidateTooltip(candidate, sector, sectorIndex, label, x, y)}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={(event) => selectAndPlayCandidate(event, candidate, sector, sectorIndex, sharedCount)}
                        >
                          {label}
                        </text>
                      );
                    })}
                  </g>
                );
              }

              const candidateFont = fittedFontSize(fontSize, layout.width, layout.radius, labels);
              const lineHeight = candidateFont * 1.18;
              const firstOffset = -((candidates.length - 1) * lineHeight) / 2;

              return (
                <g key={`sector-${sectorIndex}-shared-${sharedCount}`}>
                  {candidates.map((candidate, candidateIndex) => {
                    const label = labels[candidateIndex];
                    const isHighlighted = !diatonicOnly && highlightDiatonic && candidate.diatonic;
                    const isSelected = selected?.sectorIndex === sectorIndex
                      && selected.sharedCount === sharedCount
                      && selected.candidate.familyId === candidate.familyId
                      && selected.candidate.rootPc === candidate.rootPc;
                    const highlightClass = isHighlighted
                      ? (colorByFamily ? " diatonic-family-highlight" : " diatonic-highlight")
                      : "";
                    const y = center.y + firstOffset + candidateIndex * lineHeight;
                    return (
                      <text
                        key={`${sectorIndex}-${sharedCount}-${candidate.familyId}-${candidate.rootPc}`}
                        className={`chord-label related-label${highlightClass}${isSelected ? " selected-chord" : ""}`}
                        x={center.x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={candidateFont}
                        style={colorByFamily ? { fill: chordFamilyColor(candidate.familyId) } : undefined}
                        onMouseEnter={() => showCandidateTooltip(candidate, sector, sectorIndex, label, center.x, y)}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(event) => selectAndPlayCandidate(event, candidate, sector, sectorIndex, sharedCount)}
                      >
                        {label}
                      </text>
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}

      {selected && (() => {
        const sector = sectors[selected.sectorIndex];
        if (!sector) return null;
        const candidate = selected.candidate;
        const referenceLabel = circleChordLabel(
          sector.referenceRootPc,
          referenceFamilyId,
          selected.sectorIndex,
          showEnharmonics,
          chordDisplayStyle,
        );
        const targetLabel = circleChordLabel(
          candidate.rootPc,
          candidate.familyId,
          selected.sectorIndex,
          showEnharmonics,
          chordDisplayStyle,
        );
        const analysis = analyzeVoiceLeading(sector.referencePitches, candidate.pitchClasses);
        const sharedNames = candidate.pitchClasses
          .filter((pc) => analysis.sharedPitchClasses.includes(pc))
          .map((pc) => pitchName(pc, selected.sectorIndex, false));
        const romanNumeral = romanNumeralForChord(
          candidate.rootPc,
          candidate.familyId,
          sector.referenceRootPc,
          scaleId,
        );
        const comparisonFont = Math.max(7.5, Math.min(fontSize * 0.72, centerHoleRadius * 0.105));
        const lineHeight = comparisonFont * 1.38;
        const lines = 4;
        const startY = cy - ((lines - 1) * lineHeight) / 2;
        return (
          <g className="selection-comparison" data-export-ignore="true" pointerEvents="none">
            <text
              x={cx}
              y={startY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={comparisonFont * 1.08}
              fontWeight="800"
            >
              {`${referenceLabel} → ${targetLabel}`}
            </text>
            <text
              x={cx}
              y={startY + lineHeight}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={comparisonFont}
              className="comparison-roman"
            >
              {`${t("ui.romanNumeral")}: ${romanNumeral ?? t("ui.chromaticRoot")}`}
            </text>
            <text
              x={cx}
              y={startY + lineHeight * 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={comparisonFont}
              className="comparison-shared"
              fontWeight="750"
            >
              {`${t("ui.sharedTooltip")}: ${sharedNames.length > 0 ? sharedNames.join(" · ") : t("common.none")}`}
            </text>
            <text
              x={cx}
              y={startY + lineHeight * 3}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={comparisonFont * 0.92}
              className="comparison-motion"
            >
              {voiceLeadingText(sector.referencePitches, candidate.pitchClasses, selected.sectorIndex, language)}
            </text>
          </g>
        );
      })()}



      {showLegend && (
        <g className="legend" transform={`translate(${rightX}, ${legendY})`}>
          <rect
            x="0"
            y="0"
            width={rightColumnWidth}
            height={legendBoxHeight}
            fill="#ffffff"
            stroke="#16191f"
            strokeWidth={strokeWidth}
          />

          {positionedLegendRows.map((row, rowIndex) => (
            <g key={`legend-row-${rowIndex}`}>
              <text x="24" y={row.top + 13} className="legend-heading"
                fontSize={legendFont} fontWeight="800">{row.heading}</text>
              <text x={legendContentX} y={row.top + 13} className="legend-row"
                fontSize={legendValueFont}>
                {row.nameLines.map((line, i) => (
                  <tspan key={`name-${i}`} x={legendContentX} dy={i === 0 ? 0 : legendValueLineHeight}>{line}</tspan>
                ))}
              </text>
              {row.detailLines.length > 0 && (
                <text x={legendContentX} y={row.top + 13 + row.nameLines.length * legendValueLineHeight - 1}
                  className="legend-row" fontSize={legendNoteFont}>
                  {row.detailLines.map((line, i) => (
                    <tspan key={`detail-${i}`} x={legendContentX} dy={i === 0 ? 0 : legendNoteLineHeight}>{line}</tspan>
                  ))}
                </text>
              )}
            </g>
          ))}
          {legendNotes.map((lines, i) => {
            const previousLines = legendNotes.slice(0, i).reduce((total, item) => total + item.length * legendNoteLineHeight + 4, 0);
            const y = legendNotesY + previousLines;
            return (
              <text key={`legend-note-${i}`} x="24" y={y}
                className={i === 1 && !colorByFamily ? "legend-note diatonic-highlight" : "legend-note"}
                fontSize={legendNoteFont} fontWeight={i > 0 ? "800" : undefined}>
                {lines.map((line, index) => (
                  <tspan key={index} x="24" dy={index === 0 ? 0 : legendNoteLineHeight}>{line}</tspan>
                ))}
              </text>
            );
          })}
        </g>
      )}

      {showExplanation && (
        <g className="explanation" transform={`translate(${rightX}, ${explanationY})`}>
          <rect
            x="0"
            y="0"
            width={rightColumnWidth}
            height={explanationBoxHeight}
            fill="#ffffff"
            stroke="#16191f"
            strokeWidth={strokeWidth}
          />
          <text x="24" y="35" className="explanation-heading" fontSize={fontSize} fontWeight="800">
            {t("ui.explanationHeading")}
          </text>
          <text x="24" y="59" className="explanation-text" fontSize={explanationFont}>
            {explanationLines.map((line, index) => (
              <tspan key={`${index}-${line}`} x="24" dy={index === 0 ? 0 : explanationLineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      )}
      {tooltip && showToneTooltips && (() => {
        const tooltipWidth = Math.max(280, Math.min(360, diameter * 0.42));
        const tooltipHeight = tooltip.voiceLeadingText ? 176 : 150;
        const position = tooltipPosition(
          tooltip.x,
          tooltip.y,
          tooltipWidth,
          tooltipHeight,
          canvasWidth,
          canvasHeight,
        );
        return (
          <foreignObject
            data-export-ignore="true"
            className="rich-tooltip-host"
            x={position.x}
            y={position.y}
            width={tooltipWidth}
            height={tooltipHeight}
            pointerEvents="none"
          >
            <div className="rich-tooltip">
              <div className="tooltip-title">{tooltip.label}</div>
              <div className="tooltip-family">{tooltip.familyName}</div>
              <div className="tooltip-row">
                <span className="tooltip-label">{t("ui.tonesTooltip")}:</span>{" "}
                {tooltip.tones.map((tone, index) => (
                  <span key={`${tone.name}-${index}`}>
                    <span className={tone.shared ? "shared-tone" : undefined}>{tone.name}</span>
                    {index < tooltip.tones.length - 1 ? " · " : ""}
                  </span>
                ))}
              </div>
              {tooltip.sharedNames.length > 0 && (
                <div className="tooltip-row">
                  <span className="tooltip-label">{t("ui.sharedTooltip")}:</span>{" "}
                  <span className="shared-tone">{tooltip.sharedNames.join(" · ")}</span>
                </div>
              )}
              <div className="tooltip-row">
                <span className="tooltip-label">{t("ui.romanNumeral")}:</span>{" "}
                {tooltip.romanNumeral ?? t("ui.chromaticRoot")}
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">{t("ui.parentRelation")}:</span>{" "}
                {tooltip.diatonic ? t("ui.diatonicShort") : t("ui.nonDiatonicShort")}
              </div>
              {tooltip.voiceLeadingText && (
                <div className="tooltip-row">
                  <span className="tooltip-label">{t("ui.voiceLeading")}:</span>{" "}
                  {tooltip.voiceLeadingText}
                </div>
              )}
            </div>
          </foreignObject>
        );
      })()}

    </svg>
  );
}
