import { useMemo, useState } from "react";
import type { DiagramButton, FinderScalePattern, SequenceDisplayMode, Side } from "../../types";
import { getScaleFinderTrebleButtons } from "../../tools/scaleFinderTools";
import { getStradellaScaleFinderResult } from "../../tools/stradellaScaleFinderTools";

/** Local preferences and request state for the Scale Finder on both manuals.
 * The app shell may activate or deactivate the tool without discarding the
 * current root, pattern, path display style, or treble row restriction.
 */
export function useScaleFinderState() {
  const [scaleFinderActive, setScaleFinderActive] = useState(false);
  const [scaleFinderRoot, setScaleFinderRoot] = useState("C");
  const [scaleFinderPattern, setScaleFinderPattern] = useState<FinderScalePattern>("major-scale");
  const [scaleFinderRowLimit, setScaleFinderRowLimit] = useState<3 | 4 | 5>(5);
  const [scaleFinderDisplayMode, setScaleFinderDisplayMode] =
    useState<SequenceDisplayMode>("numbers-and-straight-arrows");
  return {
    scaleFinderActive, setScaleFinderActive,
    scaleFinderRoot, setScaleFinderRoot,
    scaleFinderPattern, setScaleFinderPattern,
    scaleFinderRowLimit, setScaleFinderRowLimit,
    scaleFinderDisplayMode, setScaleFinderDisplayMode,
  };
}

export type ScaleFinderSelection = {
  buttons: DiagramButton[];
  side: Side;
  isTrebleLikeSide: boolean;
  scaleFinderActive: boolean;
  scaleFinderRoot: string;
  scaleFinderPattern: FinderScalePattern;
  scaleFinderRowLimit: 3 | 4 | 5;
};

/** Compute selected buttons using the pre-existing musical selection engines.
 * On Stradella the analysis is computed even while highlighting is hidden, as
 * before. No button sorting or pitch/identity conversion takes place here.
 */
export function useScaleFinderResults({
  buttons, side, isTrebleLikeSide, scaleFinderActive,
  scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit,
}: ScaleFinderSelection) {
  const stradellaScaleFinderResult = useMemo(() => {
    if (side !== "stradella") {
      return {
        buttons: [], targetPitches: [], targetNames: [],
        missingPitches: [], missingNames: [], found: false,
      };
    }
    return getStradellaScaleFinderResult(buttons, scaleFinderRoot, scaleFinderPattern);
  }, [buttons, scaleFinderRoot, scaleFinderPattern, side]);

  const scaleFinderButtons = useMemo(() => {
    if (!scaleFinderActive) return [];
    if (side === "stradella") return stradellaScaleFinderResult.buttons;
    if (!isTrebleLikeSide) return [];
    return getScaleFinderTrebleButtons(buttons, scaleFinderRoot, scaleFinderPattern, scaleFinderRowLimit);
  }, [
    buttons, isTrebleLikeSide, scaleFinderActive, scaleFinderRoot,
    scaleFinderPattern, scaleFinderRowLimit, side, stradellaScaleFinderResult.buttons,
  ]);

  return { stradellaScaleFinderResult, scaleFinderButtons };
}
