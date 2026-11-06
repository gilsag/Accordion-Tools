import { useState, type KeyboardEvent } from "react";
import type { DiagramButton, Overlay, SequenceStep, ChordLabelMode, FontFamily, NumberPosition, DiagramAnnotationAnchor } from "../../types";
import { fontClass, isChordKind, isAccidentalPitch, renderMusicLabel } from "../../music";
import { getSequenceLabelsForButton } from "../../tools/sequenceTools";

/** One DOM-preserving drawing boundary for the physical keys/buttons, overlays,
 * Finder highlights and fingering. Playback still uses its own playbackButtons:
 * no rendered highlight is treated as a sounding note here.
 */
type DiagramButtonLayerProps = {
  buttons: DiagramButton[];
  overlays: Record<string, Overlay>;
  sequenceSteps: SequenceStep[];
  scaleFinderButtons: DiagramButton[];
  finderButtonIds: ReadonlySet<string>;
  progressionPreviewButtonIds: ReadonlySet<string>;
  abcActiveButtonIdSet: ReadonlySet<string>;
  bassPatternActiveButtonIdSet: ReadonlySet<string>;
  harmonyProgressionActiveButtonIdSet: ReadonlySet<string>;
  stradellaChordFinderActive: boolean;
  stradellaPrimaryFinderButtonIds: ReadonlySet<string>;
  stradellaRootBassFinderButtonIds: ReadonlySet<string>;
  getMainLabel: (button: DiagramButton) => string;
  /** Spoken name for assistive technology, e.g. "C, Root note". */
  getAccessibleLabel: (button: DiagramButton) => string;
  toggleButton: (button: DiagramButton) => void;
  buttonSize: number;
  chordLabelMode: ChordLabelMode;
  showScaleFinderNumbers: boolean;
  labelFontSize: number;
  showButtonLabels: boolean;
  labelFont: FontFamily;
  showSequenceNumbers: boolean;
  sequenceNumberPosition: NumberPosition;
  annotationActive: boolean;
  annotationPointForButton: (button: DiagramButton, anchor: DiagramAnnotationAnchor) => { x: number; y: number };
  annotationButtonAnchor: DiagramAnnotationAnchor;
  fingeringPosition: NumberPosition;
};

/** Button reached by an arrow key: the neighbour in the same row, or the
 * horizontally nearest button in the row above or below. */
function neighbourButton(buttons: DiagramButton[], from: DiagramButton, key: string) {
  if (key === "ArrowLeft" || key === "ArrowRight") {
    const step = key === "ArrowRight" ? 1 : -1;
    return buttons
      .filter((button) => button.row === from.row && Math.sign(button.x - from.x) === step)
      .sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))[0];
  }
  const rows = [...new Set(buttons.map((button) => button.row))].sort((a, b) => a - b);
  const targetRow = rows[rows.indexOf(from.row) + (key === "ArrowDown" ? 1 : -1)];
  if (targetRow === undefined) return undefined;
  return buttons
    .filter((button) => button.row === targetRow)
    .sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))[0];
}

function finderLabelsForButton(buttons: DiagramButton[], buttonId: string) {
  return buttons
    .map((button, index) => (button.id === buttonId ? String(index + 1) : ""))
    .filter(Boolean)
    .join(",");
}

/** Calculates the y-coordinate for a sequence number relative to a button. */
function numberY(
  buttonY: number,
  buttonSize: number,
  position: NumberPosition,
) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

/** Calculates the y-coordinate for a fingering label relative to a button. */
function fingeringY(
  buttonY: number,
  buttonSize: number,
  position: NumberPosition,
) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

export function DiagramButtonLayer({ buttons, overlays, sequenceSteps, scaleFinderButtons, finderButtonIds,
  progressionPreviewButtonIds, abcActiveButtonIdSet, bassPatternActiveButtonIdSet,
  harmonyProgressionActiveButtonIdSet, stradellaChordFinderActive,
  stradellaPrimaryFinderButtonIds, stradellaRootBassFinderButtonIds,
  getMainLabel, getAccessibleLabel, toggleButton, buttonSize, chordLabelMode, showScaleFinderNumbers,
  labelFontSize, showButtonLabels, labelFont, showSequenceNumbers,
  sequenceNumberPosition, annotationActive, annotationPointForButton,
  annotationButtonAnchor, fingeringPosition }: DiagramButtonLayerProps) {
  // Roving tab stop: Tab reaches the diagram once, arrow keys move between
  // buttons, Enter or Space acts like a click.
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const tabStopId = buttons.some((button) => button.id === focusedId) ? focusedId : buttons[0]?.id;
  function onButtonKeyDown(event: KeyboardEvent<SVGGElement>, button: DiagramButton) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleButton(button);
      return;
    }
    if (!event.key.startsWith("Arrow")) return;
    const next = neighbourButton(buttons, button, event.key);
    if (!next) return;
    event.preventDefault();
    setFocusedId(next.id);
    const element = event.currentTarget.ownerSVGElement?.querySelector<SVGGElement>(`[data-button-id="${next.id}"]`);
    element?.focus();
  }
  return <>
            {buttons.map((button) => {
              const overlay = overlays[button.id] ?? {};
              const mainLabel = getMainLabel(button);
              const isChord = isChordKind(button.kind);
              const isTreble = button.kind === "treble-note";
              const isTrebleAccidental =
                isTreble && isAccidentalPitch(button.pitchClass);
              const isPianoKey =
                button.visualShape?.startsWith("piano-") ?? false;
              const isPianoBlackKey = button.visualShape === "piano-black-key";
              const sequenceLabels = getSequenceLabelsForButton(
                sequenceSteps,
                button.id,
              );
              const scaleFinderLabels = showScaleFinderNumbers
                ? finderLabelsForButton(scaleFinderButtons, button.id)
                : "";
              const finderMatch = finderButtonIds.has(button.id) || progressionPreviewButtonIds.has(button.id);
              const abcMatch =
                abcActiveButtonIdSet.has(button.id) ||
                bassPatternActiveButtonIdSet.has(button.id) ||
                harmonyProgressionActiveButtonIdSet.has(button.id);
              const primaryFinderMatch =
                stradellaChordFinderActive &&
                stradellaPrimaryFinderButtonIds.has(button.id);
              const rootBassFinderMatch =
                stradellaChordFinderActive &&
                stradellaRootBassFinderButtonIds.has(button.id);

              const fontSize =
                chordLabelMode === "chord-tones" && isChord
                  ? Math.max(7, labelFontSize * 0.75)
                  : labelFontSize;

              return (
                <g
                  key={button.id}
                  className="button-group"
                  data-button-id={button.id}
                  data-focus={finderMatch || abcMatch || overlay.selected || sequenceLabels || scaleFinderLabels
                    ? "active"
                    : button.isReference && button.pitchClass === "C" ? "home" : undefined}
                  role="button"
                  tabIndex={button.id === tabStopId ? 0 : -1}
                  aria-label={getAccessibleLabel(button)}
                  onFocus={() => setFocusedId(button.id)}
                  onKeyDown={(event) => onButtonKeyDown(event, button)}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleButton(button);
                  }}
                >
                  {isPianoKey ? (
                    <>
                      <rect
                        x={button.x - (button.width ?? buttonSize * 2) / 2}
                        y={button.y - (button.height ?? buttonSize * 2) / 2}
                        width={button.width ?? buttonSize * 2}
                        height={button.height ?? buttonSize * 2}
                        rx={isPianoBlackKey ? 5 : 7}
                        className={[
                          "button",
                          "piano-key",
                          isPianoBlackKey
                            ? "piano-black-key"
                            : "piano-white-key",
                          overlay.selected ? "selected" : "",
                          finderMatch ? "finder-match" : "",
                          abcMatch ? "abc-match" : "",
                          primaryFinderMatch ? "finder-primary" : "",
                          rootBassFinderMatch ? "finder-root-bass" : "",
                          sequenceLabels || scaleFinderLabels
                            ? "in-sequence"
                            : "",
                        ].join(" ")}
                      />
                      {(finderMatch || abcMatch) && (
                        <rect
                          x={
                            button.x - (button.width ?? buttonSize * 2) / 2 + 3
                          }
                          y={
                            button.y - (button.height ?? buttonSize * 2) / 2 + 3
                          }
                          width={(button.width ?? buttonSize * 2) - 6}
                          height={(button.height ?? buttonSize * 2) - 6}
                          rx={isPianoBlackKey ? 4 : 6}
                          className={
                            abcMatch
                              ? "finder-ring abc-ring"
                              : rootBassFinderMatch
                                ? "finder-ring finder-root-bass-ring"
                                : primaryFinderMatch
                                  ? "finder-ring finder-primary-ring"
                                  : "finder-ring"
                          }
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <circle
                        cx={button.x}
                        cy={button.y}
                        r={buttonSize}
                        className={[
                          "button",
                          isChord ? "chord" : "note",
                          isTreble ? "treble-button" : "",
                          isTrebleAccidental ? "treble-accidental" : "",
                          overlay.selected ? "selected" : "",
                          button.isReference ? "reference" : "",
                          finderMatch ? "finder-match" : "",
                          abcMatch ? "abc-match" : "",
                          primaryFinderMatch ? "finder-primary" : "",
                          rootBassFinderMatch ? "finder-root-bass" : "",
                          sequenceLabels || scaleFinderLabels
                            ? "in-sequence"
                            : "",
                        ].join(" ")}
                      />
                      {(finderMatch || abcMatch) && (
                        <circle
                          cx={button.x}
                          cy={button.y}
                          r={buttonSize + 4}
                          className={
                            abcMatch
                              ? "finder-ring abc-ring"
                              : rootBassFinderMatch
                                ? "finder-ring finder-root-bass-ring"
                                : primaryFinderMatch
                                  ? "finder-ring finder-primary-ring"
                                  : "finder-ring"
                          }
                        />
                      )}
                    </>
                  )}

                  {showButtonLabels && (
                    <text
                      x={button.x}
                      y={
                        isPianoKey
                          ? button.y +
                            (button.height ?? buttonSize * 2) / 2 -
                            18
                          : button.y -
                            (overlay.finger || sequenceLabels ? 2 : 0)
                      }
                      textAnchor="middle"
                      className={[
                        "main-label",
                        fontClass(labelFont),
                        isTreble ? "treble-label" : "",
                        isTrebleAccidental || isPianoBlackKey
                          ? "treble-accidental-label"
                          : "",
                        (isTrebleAccidental || isPianoBlackKey) && (finderMatch || abcMatch)
                          ? "highlighted-accidental-label"
                          : "",
                      ].join(" ")}
                      style={{ fontSize }}
                    >
                      {renderMusicLabel(mainLabel)}
                    </text>
                  )}
                  {showSequenceNumbers && sequenceLabels && (
                    <text
                      x={button.x}
                      y={numberY(button.y, buttonSize, sequenceNumberPosition)}
                      textAnchor="middle"
                      className="sequence-number"
                    >
                      {sequenceLabels}
                    </text>
                  )}
                  {scaleFinderLabels && (
                    <text
                      x={button.x}
                      y={numberY(button.y, buttonSize, sequenceNumberPosition)}
                      textAnchor="middle"
                      className="finder-number"
                    >
                      {scaleFinderLabels}
                    </text>
                  )}

                  {annotationActive && !isPianoKey && (() => {
                    const point = annotationPointForButton(button, annotationButtonAnchor);
                    return (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={Math.max(5, buttonSize * 0.24)}
                        className="annotation-anchor-placeholder"
                      />
                    );
                  })()}

                  {annotationActive && isPianoKey && (() => {
                    const point = annotationPointForButton(button, annotationButtonAnchor);
                    const markerSize = Math.max(10, buttonSize * 0.42);
                    return (
                      <rect
                        x={point.x - markerSize / 2}
                        y={point.y - markerSize / 2}
                        width={markerSize}
                        height={markerSize}
                        rx="4"
                        className="annotation-anchor-placeholder"
                      />
                    );
                  })()}

                  {overlay.finger && (
                    <text
                      x={button.x}
                      y={fingeringY(button.y, buttonSize, fingeringPosition)}
                      textAnchor="middle"
                      className={[
                        "finger-label",
                        fontClass(labelFont),
                        isTrebleAccidental ? "treble-accidental-label" : "",
                        isTrebleAccidental && (finderMatch || abcMatch)
                          ? "highlighted-accidental-label"
                          : "",
                      ].join(" ")}
                      style={{ fontSize: buttonSize * 0.44 }}
                    >
                      {overlay.finger}
                    </text>
                  )}
                </g>
              );
            })}
  </>;
}
