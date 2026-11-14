import { createToolContext } from "../../app/tools/createToolContext";
import type { useScaleFinderResults, useScaleFinderState } from "./useScaleFinder";

export type ScaleFinderState = ReturnType<typeof useScaleFinderState>;
export const [ScaleFinderContext, useScaleFinder] =
  createToolContext<ScaleFinderState>("useScaleFinder");

/** What the tool derives from its state and the diagram's buttons. */
export type ScaleFinderOutput = ReturnType<typeof useScaleFinderResults>;
export const [ScaleFinderOutputContext, useScaleFinderOutput] =
  createToolContext<ScaleFinderOutput>("useScaleFinderOutput");
