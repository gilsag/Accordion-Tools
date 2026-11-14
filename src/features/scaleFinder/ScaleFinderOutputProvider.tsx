import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformSound,
} from "../../app/platform/platformContexts";
import { DiagramContributionProvider } from "../../app/diagram/DiagramContributionProvider";
import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import { translateKnownLabel } from "../../i18n/catalog";
import { SCALE_FINDER_OPTIONS } from "../../tools/scaleFinderTools";
import {
  sequenceArrowStyleFromMode,
  sequenceModeShowsArrows,
  sequenceModeShowsNumbers,
} from "../../tools/sequenceTools";
import { useAnnotateDiagram } from "../annotateDiagram/annotateDiagramContext";
import { playButtonSequence } from "../../sound";
import { ScaleFinderOutputContext, useScaleFinder } from "./scaleFinderContext";
import { useScaleFinderResults } from "./useScaleFinder";

/** The scale's buttons on the diagram, taken from the generated buttons so
 * identities, order and row choices match what is drawn and played. */
export function ScaleFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const { soundOptions } = usePlatformSound();
  const state = useScaleFinder();
  const results = useScaleFinderResults({
    ...state,
    buttons,
    side,
    isTrebleLikeSide: side === "treble",
  });
  const value = {
    ...results,
    playScaleFinder: () => playButtonSequence(results.scaleFinderButtons, soundOptions),
  };
  const { language } = usePlatformLanguage();
  const { sequenceNumberPosition } = useAnnotateDiagram().sequence;
  const active = state.scaleFinderActive;
  const scaleLabel =
    SCALE_FINDER_OPTIONS.find((option) => option.value === state.scaleFinderPattern)?.label ??
    "scale";
  // While active: the scale titles the diagram; its buttons are lit and, as
  // its display mode says, numbered and joined by arrows.
  const diagram: DiagramContribution = {
    note: active
      ? { title: `${state.scaleFinderRoot} ${translateKnownLabel(language, scaleLabel)}` }
      : null,
    layers: {
      finderButtonIds: new Set(results.scaleFinderButtons.map((button) => button.id)),
      scaleFinderButtons: results.scaleFinderButtons,
      showScaleFinderNumbers:
        sequenceNumberPosition !== "none" &&
        active &&
        sequenceModeShowsNumbers(state.scaleFinderDisplayMode),
      showScaleFinderArrows: active && sequenceModeShowsArrows(state.scaleFinderDisplayMode),
      scaleFinderArrowStyle: sequenceArrowStyleFromMode(state.scaleFinderDisplayMode),
    },
  };
  return (
    <ScaleFinderOutputContext.Provider value={value}>
      <DiagramContributionProvider tool="scaleFinder" contribution={diagram}>
        {children}
      </DiagramContributionProvider>
    </ScaleFinderOutputContext.Provider>
  );
}
