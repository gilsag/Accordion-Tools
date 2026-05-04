/*
  Helpers for the sequence tool.

  This module converts recorded sequence steps into button-aware data and creates
  SVG paths for straight, curved, and self-loop arrows.
*/

import type { DiagramButton, SequenceArrowStyle, SequenceDisplayMode, SequenceStep } from "../types";

/** A recorded sequence step after its button metadata has been found. */
export type SequenceStepWithButton = SequenceStep & { button: DiagramButton };

/** Attaches current button geometry to every recorded sequence step. */
export function getSequenceStepsWithButtons(
  steps: SequenceStep[],
  buttons: DiagramButton[]
): SequenceStepWithButton[] {
  return steps
    .map((step) => ({ ...step, button: buttons.find((button) => button.id === step.id) }))
    .filter((step): step is SequenceStepWithButton => Boolean(step.button));
}

/** Returns the comma-separated step numbers that belong to a given button. */
export function getSequenceLabelsForButton(steps: SequenceStep[], buttonId: string) {
  return steps
    .filter((step) => step.id === buttonId)
    .map((step) => step.step)
    .join(",");
}

/** Returns whether the selected sequence display mode includes step numbers. */
export function sequenceModeShowsNumbers(mode: SequenceDisplayMode) {
  return mode === "numbers" || mode === "numbers-and-straight-arrows" || mode === "numbers-and-curved-arrows";
}

/** Returns whether the selected sequence display mode includes arrows. */
export function sequenceModeShowsArrows(mode: SequenceDisplayMode) {
  return (
    mode === "straight-arrows" ||
    mode === "curved-arrows" ||
    mode === "numbers-and-straight-arrows" ||
    mode === "numbers-and-curved-arrows"
  );
}

/** Extracts straight or curved arrow style from the combined display mode. */
export function sequenceArrowStyleFromMode(mode: SequenceDisplayMode): SequenceArrowStyle {
  if (mode === "straight-arrows" || mode === "numbers-and-straight-arrows") return "straight";
  return "curved";
}

/** Returns the preferred visual anchor point for a sequence/finder arrow. */
function arrowAnchor(button: DiagramButton, buttonSize: number) {
  const height = button.height ?? buttonSize * 2;

  if (button.visualShape === "piano-white-key") {
    /*
      White piano keys have black keys drawn over their upper area. Anchoring
      sequence lines in the mathematical center can make arrows appear to begin
      on a neighboring accidental. Use the lower visible part of the key instead.
    */
    return {
      x: button.x,
      y: button.y + height * 0.26,
    };
  }

  if (button.visualShape === "piano-black-key") {
    return {
      x: button.x,
      y: button.y + height * 0.16,
    };
  }

  return {
    x: button.x,
    y: button.y,
  };
}

/** Returns a small inset so arrows stay visually inside the target shape. */
function arrowInset(button: DiagramButton, buttonSize: number) {
  if (button.visualShape?.startsWith("piano-")) {
    return Math.max(3, Math.min(button.width ?? buttonSize, button.height ?? buttonSize) * 0.08);
  }

  return buttonSize * 0.45;
}

/**
 * Places arrow endpoints inside the source and target shapes.
 *
 * Accordion buttons use the circular center. Piano keys use a lower anchor on
 * white keys so the line is visually connected to the key body instead of the
 * black-key/accidental area above it.
 */
function shortenedEndpoints(from: DiagramButton, to: DiagramButton, buttonSize: number) {
  const fromAnchor = arrowAnchor(from, buttonSize);
  const toAnchor = arrowAnchor(to, buttonSize);
  const dx = toAnchor.x - fromAnchor.x;
  const dy = toAnchor.y - fromAnchor.y;
  const length = Math.hypot(dx, dy);

  if (length < 1) return null;

  const unitX = dx / length;
  const unitY = dy / length;
  const startPadding = arrowInset(from, buttonSize);
  const endPadding = arrowInset(to, buttonSize);

  return {
    startX: fromAnchor.x + unitX * startPadding,
    startY: fromAnchor.y + unitY * startPadding,
    endX: toAnchor.x - unitX * endPadding,
    endY: toAnchor.y - unitY * endPadding,
    unitX,
    unitY,
    length,
  };
}

/** Builds a loop path used when a sequence goes from a button back to itself. */
function selfLoopPath(button: DiagramButton, buttonSize: number) {
  if (button.visualShape?.startsWith("piano-")) {
    const anchor = arrowAnchor(button, buttonSize);
    const width = button.width ?? buttonSize * 2;
    const height = button.height ?? buttonSize * 2;
    const loopWidth = Math.max(buttonSize * 1.2, width * 0.62);
    const loopDepth = Math.max(buttonSize * 1.0, height * 0.18);
    const x1 = anchor.x + loopWidth * 0.42;
    const y1 = anchor.y;
    const x2 = anchor.x - loopWidth * 0.42;
    const y2 = anchor.y;
    const cx = anchor.x;
    const cy = anchor.y + loopDepth;

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  const loopRadius = buttonSize * 1.55;
  const x1 = button.x + buttonSize * 0.48;
  const y1 = button.y - buttonSize * 0.95;
  const x2 = button.x - buttonSize * 0.48;
  const y2 = button.y - buttonSize * 0.95;
  const cx = button.x;
  const cy = button.y - loopRadius * 1.85;

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/** Builds the SVG path string for one sequence arrow. */
export function makeSequenceArrowPath(
  from: DiagramButton,
  to: DiagramButton,
  index: number,
  buttonSize: number,
  style: SequenceArrowStyle
) {
  const endpoints = shortenedEndpoints(from, to, buttonSize);

  if (!endpoints) return selfLoopPath(from, buttonSize);

  const { startX, startY, endX, endY, unitX, unitY, length } = endpoints;

  if (style === "straight") return `M ${startX} ${startY} L ${endX} ${endY}`;

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const normalX = -unitY;
  const normalY = unitX;
  const curveSide = index % 2 === 0 ? 1 : -1;
  const curveAmount = Math.min(28, Math.max(10, length * 0.16));

  const controlX = midX + normalX * curveAmount * curveSide;
  const controlY = midY + normalY * curveAmount * curveSide;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
}
