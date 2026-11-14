import type { ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformSound,
  usePlatformSpelling,
} from "../../app/platform/platformContexts";
import { DiagramContributionProvider } from "../../app/diagram/DiagramContributionProvider";
import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import { trebleContextualTitle } from "../../music/contextualTitles";
import { describeTrebleChord } from "./trebleChordExplanation";
import { playButtonArpeggioThenChord } from "../../audio/sound";
import { TrebleChordFinderOutputContext, useTrebleChordFinder } from "./trebleChordFinderContext";
import { useTrebleChordFinderButtons } from "./useTrebleChordFinder";

/** The chord's buttons on the treble diagram and how exact they are. */
export function TrebleChordFinderOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const { soundOptions } = usePlatformSound();
  const state = useTrebleChordFinder();
  const chordFinderButtons = useTrebleChordFinderButtons({
    ...state,
    buttons,
    isTrebleLikeSide: side === "treble",
  });
  const { language } = usePlatformLanguage();
  // Report the actual highlighted buttons for every chord family.
  const trebleChordExplanation = describeTrebleChord(
    chordFinderButtons,
    state.chordFinderRoot,
    state.chordFinderPattern,
    state.trebleChordVoicingMode,
    language,
  );
  const value = {
    chordFinderButtons,
    trebleChordExplanation,
    playChordFinder: () => playButtonArpeggioThenChord(chordFinderButtons, soundOptions),
  };
  const { chordDisplayStyle } = usePlatformSpelling();
  const active = side === "treble" && state.chordFinderActive;
  const title = (displayStyle: typeof chordDisplayStyle) =>
    trebleContextualTitle({
      root: state.chordFinderRoot,
      pattern: state.chordFinderPattern,
      inversion: state.chordFinderInversion,
      hasButtons: chordFinderButtons.length > 0,
      exact: trebleChordExplanation.exact,
      displayStyle,
    });
  // While active on the treble side: the chord titles the diagram, and the
  // note on its voicing goes below it if shown.
  const diagram: DiagramContribution = {
    note: active
      ? {
          title: title(chordDisplayStyle),
          filename: title("words"),
          footer:
            state.showTrebleVoicingNote && trebleChordExplanation.note
              ? { kind: "treble", text: trebleChordExplanation.note }
              : null,
        }
      : null,
    layers: {
      finderButtonIds: new Set(chordFinderButtons.map((button) => button.id)),
      chordFinderActive: state.chordFinderActive,
      chordFinderButtons,
    },
  };
  return (
    <TrebleChordFinderOutputContext.Provider value={value}>
      <DiagramContributionProvider tool="chordFinder" contribution={diagram}>
        {children}
      </DiagramContributionProvider>
    </TrebleChordFinderOutputContext.Provider>
  );
}
