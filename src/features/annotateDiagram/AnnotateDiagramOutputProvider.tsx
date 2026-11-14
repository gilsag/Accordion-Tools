import { ScoreEntryProvider } from "../../app/notation/ScoreEntryProvider";
import type { ScoreEntry } from "../../app/notation/scoreEntries";
import { PlaybackTransportEntry } from "../../app/playback/PlaybackTransportEntry";
import type { PlaybackTransport } from "../../app/playback/playbackTransports";
import { usePlatformLanguage, usePlatformTools } from "../../app/platform/platformContexts";
import { useMemo, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import {
  usePlatformInstrument,
  usePlatformPlayback,
  usePlatformSound,
} from "../../app/platform/platformContexts";
import { useScoreRendering } from "../../app/platform/useScoreRendering";
import { sequenceNotationAbc } from "../../notation/sequenceNotation";
import { playButtonArpeggioThenChord, playButtonSequence } from "../../sound";
import type { DiagramButton } from "../../types";
import { useSequenceResults } from "../sequences/useSequenceState";
import { AnnotateDiagramOutputContext, useAnnotateDiagram } from "./annotateDiagramContext";

/** The selected buttons and the sequence's steps as generated buttons, in
 * selection and step order; the sequence's score; and the two Play commands. */
export function AnnotateDiagramOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const { soundOptions } = usePlatformSound();
  const { setSoundEnginePlayer, startWhenSamplesReady } = usePlatformPlayback();
  const { stradellaPreferences } = useScoreRendering();
  const { overlays, sequence } = useAnnotateDiagram();
  const { selectedButtonIds } = overlays;
  const selectedButtons = useMemo(
    () =>
      selectedButtonIds
        .map((id) => buttons.find((button) => button.id === id))
        .filter(Boolean) as DiagramButton[],
    [selectedButtonIds, buttons],
  );
  const sequenceStepsWithButtons = useSequenceResults(sequence.sequenceSteps, buttons);
  const sequenceRenderedNotationAbc = useMemo(
    () => sequenceNotationAbc(sequenceStepsWithButtons, side, stradellaPreferences),
    [sequenceStepsWithButtons, side, stradellaPreferences],
  );

  function playRecordedSequence() {
    const sequenceButtons = sequenceStepsWithButtons.map((step) => step.button);
    startWhenSamplesReady(sequenceButtons, () => {
      playButtonSequence(sequenceButtons, soundOptions, () => setSoundEnginePlayer(null));
      // Set after the player's own stopAllSound(), which clears this state.
      if (soundOptions.enabled && sequenceButtons.length > 0) setSoundEnginePlayer("sequence");
    });
  }

  const value = {
    selectedButtons,
    sequenceStepsWithButtons,
    sequenceRenderedNotationAbc,
    playSelectedButtons: () => playButtonArpeggioThenChord(selectedButtons, soundOptions),
    playRecordedSequence,
  };
  const { t } = usePlatformLanguage();
  const { soundEnginePlayer } = usePlatformPlayback();
  const { stopAllPlayback } = usePlatformTools();
  // Sequence mode owns the sequence's transport.
  const playbackEntry: PlaybackTransport | null =
    overlays.annotateMode === "sequence"
      ? {
          label: t("ui.sequence"),
          state: soundEnginePlayer === "sequence" ? "playing" : "stopped",
          canPlay: sequence.sequenceSteps.length > 0,
          onPlay: playRecordedSequence,
          onStop: stopAllPlayback,
        }
      : null;
  // The sequence's score belongs to Sequence mode.
  const scoreEntry: ScoreEntry | null =
    overlays.annotateMode === "sequence" &&
    sequence.sequenceRenderedNotationVisible &&
    sequence.sequenceSteps.length > 0
      ? {
          title: t("ui.sequenceNotation"),
          abc: sequenceRenderedNotationAbc,
          filename: "sequence-notation",
        }
      : null;
  return (
    <AnnotateDiagramOutputContext.Provider value={value}>
      <PlaybackTransportEntry tool="annotateDiagram" transport={playbackEntry}>
        <ScoreEntryProvider tool="annotateDiagram" score={scoreEntry}>
          {children}
        </ScoreEntryProvider>
      </PlaybackTransportEntry>
    </AnnotateDiagramOutputContext.Provider>
  );
}
