import { lazy, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { ResultsEntryProvider } from "../../app/inspector/ResultsEntryProvider";
import {
  usePlatformInstrument,
  usePlatformSound,
  usePlatformSpelling,
} from "../../app/platform/platformContexts";
import {
  formatChordFinderPitches,
  formatChordFinderText,
} from "../../tools/stradellaChordFinder/chordSpelling";
import { playButtonArpeggioThenChord, playButtonCombination } from "../../sound";
import {
  StradellaChordFinderOutputContext,
  useStradellaChordFinder,
} from "./stradellaChordFinderContext";
import { useStradellaChordFinderResults } from "./useStradellaChordFinder";

const StradellaResultsInspector = lazy(() =>
  import("./StradellaResultsInspector").then((module) => ({
    default: module.StradellaResultsInspector,
  })),
);

/** The ranked realizations of the requested chord on the generated buttons,
 * the selected one, what it lights and plays, and its Play command. */
export function StradellaChordFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side, stradellaRegisterModel } = usePlatformInstrument();
  const { soundOptions } = usePlatformSound();
  const state = useStradellaChordFinder();
  const results = useStradellaChordFinderResults({
    ...state,
    buttons,
    side,
    stradellaRegisterModel,
  });
  function playStradellaChordFinder() {
    const playback = results.stradellaChordFinderPlaybackButtons;
    if (state.stradellaChordFinderMode === "bass-only") {
      playButtonArpeggioThenChord(playback, soundOptions);
      return;
    }
    playButtonCombination(playback, soundOptions);
  }
  const value = { ...results, playStradellaChordFinder };

  const { notation, accidental, chordDisplayStyle } = usePlatformSpelling();
  // Stradella buttons have no enharmonic spelling mode.
  const stradellaAccidental = accidental === "enharmonic" ? "natural" : accidental;
  const { stradellaChordFinderRoot: root, stradellaChordFinderPattern: pattern } = state;
  const realizations = results.stradellaChordFinderRealizations;
  // The realization table beside the diagram, while the Finder is active on the Stradella side.
  const resultsPanel =
    side === "stradella" && state.stradellaChordFinderActive ? (
      <StradellaResultsInspector
        root={root}
        pattern={pattern}
        requestedBass={results.stradellaChordFinderEffectiveRequestedBass}
        mode={state.stradellaChordFinderMode}
        selectedIndex={Math.min(
          state.stradellaChordFinderRealizationIndex,
          Math.max(0, realizations.length - 1),
        )}
        onSelect={state.setStradellaChordFinderRealizationIndex}
        realizations={realizations}
        result={results.stradellaChordFinderResult}
        registerModel={stradellaRegisterModel}
        chordDisplayStyle={chordDisplayStyle}
        formatPitches={(pitches) =>
          formatChordFinderPitches(root, pattern, pitches, notation, stradellaAccidental)
        }
        formatText={(text) =>
          formatChordFinderText(root, pattern, text, notation, stradellaAccidental)
        }
      />
    ) : null;
  return (
    <StradellaChordFinderOutputContext.Provider value={value}>
      <ResultsEntryProvider tool="stradellaChordFinder" panel={resultsPanel}>
        {children}
      </ResultsEntryProvider>
    </StradellaChordFinderOutputContext.Provider>
  );
}
