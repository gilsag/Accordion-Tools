import type { DiagramButton, SequenceArrowStyle, SequenceDisplayMode, SequenceStep } from "../types";

export type SequenceStepWithButton = SequenceStep & { button: DiagramButton };

export function getSequenceStepsWithButtons(
  steps: SequenceStep[],
  buttons: DiagramButton[]
): SequenceStepWithButton[] {
  return steps
    .map((step) => ({ ...step, button: buttons.find((button) => button.id === step.id) }))
    .filter((step): step is SequenceStepWithButton => Boolean(step.button));
}

export function getSequenceLabelsForButton(steps: SequenceStep[], buttonId: string) {
  return steps
    .filter((step) => step.id === buttonId)
    .map((step) => step.step)
    .join(",");
}

export function sequenceModeShowsNumbers(mode: SequenceDisplayMode) {
  return mode === "numbers" || mode === "numbers-and-straight-arrows" || mode === "numbers-and-curved-arrows";
}

export function sequenceModeShowsArrows(mode: SequenceDisplayMode) {
  return (
    mode === "straight-arrows" ||
    mode === "curved-arrows" ||
    mode === "numbers-and-straight-arrows" ||
    mode === "numbers-and-curved-arrows"
  );
}

export function sequenceArrowStyleFromMode(mode: SequenceDisplayMode): SequenceArrowStyle {
  if (mode === "straight-arrows" || mode === "numbers-and-straight-arrows") return "straight";
  return "curved";
}

function shortenedEndpoints(from: DiagramButton, to: DiagramButton, buttonSize: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length < 1) return null;

  const padding = buttonSize + 7;
  const unitX = dx / length;
  const unitY = dy / length;

  return {
    startX: from.x + unitX * padding,
    startY: from.y + unitY * padding,
    endX: to.x - unitX * padding,
    endY: to.y - unitY * padding,
    unitX,
    unitY,
    length,
  };
}

function selfLoopPath(button: DiagramButton, buttonSize: number) {
  const loopRadius = buttonSize * 1.55;
  const x1 = button.x + buttonSize * 0.48;
  const y1 = button.y - buttonSize * 0.95;
  const x2 = button.x - buttonSize * 0.48;
  const y2 = button.y - buttonSize * 0.95;
  const cx = button.x;
  const cy = button.y - loopRadius * 1.85;

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

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
