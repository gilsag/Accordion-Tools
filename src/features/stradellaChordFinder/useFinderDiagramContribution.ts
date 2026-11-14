import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import { usePlatformLanguage, usePlatformSpelling } from "../../app/platform/platformContexts";
import { displayRealizedChord } from "../../tools/chordDisplay";
import { displayRoot, realizedChordName } from "../../tools/stradellaChordFinder/chordSpelling";
import { finderChordSymbol } from "../../tools/stradellaChordFinder/chordSymbol";
import { realizationAnnotation } from "../../tools/stradellaChordFinder/diagramAnnotations";
import type { StradellaRegisterModel } from "../../tools/stradellaChordFinder/registerModel";
import type { StradellaChordFinderState } from "./stradellaChordFinderContext";
import { stradellaFooter } from "./stradellaFooter";
import type { useStradellaChordFinderResults } from "./useStradellaChordFinder";

/** While the Finder is active on the Stradella side, the diagram is titled
 * with the selected realization (or the chord and "no realization") and the
 * footer explains it; its buttons are lit as primary or root bass. */
export function useFinderDiagramContribution(
  state: StradellaChordFinderState,
  results: ReturnType<typeof useStradellaChordFinderResults>,
  side: "treble" | "stradella",
  registerModel: StradellaRegisterModel,
): DiagramContribution {
  const { t, language } = usePlatformLanguage();
  const { chordDisplayStyle } = usePlatformSpelling();
  const { stradellaChordFinderRoot: root, stradellaChordFinderPattern: pattern } = state;
  const result = results.stradellaChordFinderResult;
  const requestedBass = results.stradellaChordFinderEffectiveRequestedBass;
  const active = side === "stradella" && state.stradellaChordFinderActive;
  const annotation =
    active && result.playable
      ? realizationAnnotation(
          root,
          pattern,
          result,
          registerModel,
          requestedBass,
          state.stradellaNoteLevels,
          chordDisplayStyle,
          language,
        )
      : null;
  const chordName = displayRealizedChord(
    root,
    pattern,
    realizedChordName(
      root,
      pattern,
      requestedBass,
      requestedBass,
      `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`,
    ),
    chordDisplayStyle,
  );
  return {
    note: active
      ? {
          title: annotation ? annotation.title : `${chordName} - ${t("ui.titleNoRealization")}`,
          filename: annotation ? annotation.filenameKey : undefined,
          footer:
            annotation && state.showFinderRealizationNote
              ? stradellaFooter({
                  lines: annotation.lines,
                  playbackButtons: result.playbackButtons,
                  root,
                  pattern,
                  registerModel,
                  showStradellaVoicingIntervals: state.showStradellaVoicingIntervals,
                  stradellaNoteLevels: state.stradellaNoteLevels,
                  finderExplanationFontSize: state.finderExplanationFontSize,
                  t,
                })
              : null,
        }
      : null,
    layers: {
      finderButtonIds: new Set(results.stradellaChordFinderButtons.map((button) => button.id)),
      stradellaChordFinderActive: state.stradellaChordFinderActive,
      stradellaPrimaryFinderButtonIds: results.stradellaPrimaryFinderButtonIds,
      stradellaRootBassFinderButtonIds: results.stradellaRootBassFinderButtonIds,
    },
  };
}
