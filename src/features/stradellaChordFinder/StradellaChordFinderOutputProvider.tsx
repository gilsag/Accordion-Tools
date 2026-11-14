import { lazy, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { downloadDiagramBatch } from "../../diagram/diagramExport";
import { captureStradellaBatch } from "../../diagram/stradellaBatchCapture";
import { realizationAnnotation } from "./engine/diagramAnnotations";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { ResultsEntryProvider } from "../../app/inspector/ResultsEntryProvider";
import { DiagramContributionProvider } from "../../app/diagram/DiagramContributionProvider";
import { useFinderDiagramContribution } from "./useFinderDiagramContribution";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformShell,
  usePlatformSound,
  usePlatformSpelling,
} from "../../app/platform/platformContexts";
import { formatChordFinderPitches, formatChordFinderText } from "./engine/chordSpelling";
import { playButtonArpeggioThenChord, playButtonCombination } from "../../audio/sound";
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
  const { svgRef, downloadFormat } = usePlatformShell();
  const { language } = usePlatformLanguage();
  const [batchExporting, setBatchExporting] = useState(false);

  /** Download every eligible realization with the current filter, labels,
   * layout, register model, footer and SVG/PNG settings. Capture each live SVG
   * synchronously, then restore selection before asynchronous PNG encoding. */
  async function downloadAllStradellaRealizations() {
    if (batchExporting || side !== "stradella" || !state.stradellaChordFinderActive) return;
    const candidates = realizations
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => candidate.playable);
    if (!candidates.length || !svgRef.current) return;
    setBatchExporting(true);
    try {
      const snapshots = captureStradellaBatch({
        candidates,
        originalIndex: state.stradellaChordFinderRealizationIndex,
        selectIndex: (index) =>
          flushSync(() => state.setStradellaChordFinderRealizationIndex(index)),
        currentSvg: () => svgRef.current,
        filenameKey: (candidate) =>
          realizationAnnotation(
            root,
            pattern,
            candidate,
            stradellaRegisterModel,
            results.stradellaChordFinderEffectiveRequestedBass,
            state.stradellaNoteLevels,
            chordDisplayStyle,
            language,
          )?.filenameKey,
        format: downloadFormat,
      });
      await downloadDiagramBatch(
        snapshots,
        downloadFormat,
        `stradella-${root}-${pattern}-${downloadFormat}-${snapshots.length}-realizations.zip`,
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not export all diagrams.");
    } finally {
      setBatchExporting(false);
    }
  }

  const diagram = useFinderDiagramContribution(state, results, side, stradellaRegisterModel);
  return (
    <StradellaChordFinderOutputContext.Provider
      value={{ ...value, batchExporting, downloadAllStradellaRealizations }}
    >
      <ResultsEntryProvider tool="stradellaChordFinder" panel={resultsPanel}>
        <DiagramContributionProvider tool="stradellaChordFinder" contribution={diagram}>
          {children}
        </DiagramContributionProvider>
      </ResultsEntryProvider>
    </StradellaChordFinderOutputContext.Provider>
  );
}
