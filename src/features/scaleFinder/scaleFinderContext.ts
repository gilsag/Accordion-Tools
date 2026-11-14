import { createToolContext } from "../../app/tools/createToolContext";
import type { useScaleFinderState } from "./useScaleFinder";

export type ScaleFinderState = ReturnType<typeof useScaleFinderState>;
export const [ScaleFinderContext, useScaleFinder] =
  createToolContext<ScaleFinderState>("useScaleFinder");
