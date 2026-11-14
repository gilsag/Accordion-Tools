import { ScoreEntryProvider } from "../../app/notation/ScoreEntryProvider";
import { DiagramContributionProvider } from "../../app/diagram/DiagramContributionProvider";
import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import type { ScoreEntry, ScoreToggle } from "../../app/notation/scoreEntries";
import { PlaybackTransportEntry } from "../../app/playback/PlaybackTransportEntry";
import type { PlaybackTransport } from "../../app/playback/playbackTransports";
import { usePlatformLanguage } from "../../app/platform/platformContexts";
import { useMemo, type ReactNode } from "react";
import { useDiagramButtons } from "../../app/diagram/diagramButtonsContext";
import { usePlatformInstrument, usePlatformNavigation } from "../../app/platform/platformContexts";
import { useSideButtonSettings } from "../../app/platform/useSideButtonSettings";
import { stradellaButtonsFor, trebleButtonsFor } from "../../app/sideButtons";
import { AbcPlayerOutputContext, useAbcPlayer } from "./abcPlayerContext";
import { useAbcPlayerResults } from "./useAbcPlayer";
import type { AbcHands } from "../../types";
import { useAbcTransport } from "./useAbcTransport";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { playerHandle } from "../../app/tools/toolHandles";

/** The parsed tune, its events mapped to buttons, what is lit, and the
 * transport that plays them. */
export function AbcPlayerOutputProvider({ children }: { children: ReactNode }) {
  const { buttons } = useDiagramButtons();
  const { side } = usePlatformInstrument();
  const { workspaceMode, selectAccordionSide } = usePlatformNavigation();
  const sideButtonSettings = useSideButtonSettings();
  const state = useAbcPlayer();
  const { abcHands, abcText } = state;

  /* The Both hands view plays voice 1 on the treble and voice 2 on the
   * Stradella, so it also needs the buttons of the side not on screen. */
  const abcCompanionButtons = useMemo(() => {
    if (workspaceMode !== "accordion" || abcHands !== "both" || !abcText.trim()) return null;
    return side === "stradella"
      ? trebleButtonsFor(sideButtonSettings)
      : stradellaButtonsFor(sideButtonSettings);
  }, [workspaceMode, abcHands, abcText, side, sideButtonSettings]);

  const results = useAbcPlayerResults({
    ...state,
    side,
    isTrebleLikeSide: side === "treble",
    buttons,
    companionButtons: abcCompanionButtons,
  });
  const transport = useAbcTransport(state, results);
  useToolHandle("abcPlayer", playerHandle(transport.stopAbcPlayback));
  function chooseAbcHands(next: AbcHands) {
    transport.stopAbcPlayback();
    state.setAbcHands(next);
    if (next !== "both" && next !== side) selectAccordionSide(next);
  }
  const value = { ...results, ...transport, abcCompanionButtons, chooseAbcHands };
  const { t } = usePlatformLanguage();
  const playbackEntry: PlaybackTransport = {
    label: t("ui.abcDefault"),
    state: state.abcPlaybackState,
    canPlay: results.abcMappedEvents.length > 0,
    onPlay: () => transport.scheduleAbcPlayback(state.abcPositionBeat),
    onPause: transport.pauseAbcPlayback,
    onStop: transport.stopAbcPlayback,
  };
  // The tune's own score, rendered from the editor's text.
  const abcScoreTitle = results.abcParseResult.title || "ABC notation";
  const scoreToggle: ScoreToggle | null = state.abcText.trim()
    ? { visible: state.abcRenderedNotationVisible, toggle: state.toggleAbcNotation }
    : null;
  const scoreEntry: ScoreEntry | null =
    state.abcRenderedNotationVisible && state.abcText.trim()
      ? {
          title: abcScoreTitle,
          abc: state.abcText,
          filename: `${abcScoreTitle}-notation`,
          imported: true,
        }
      : null;
  // The tune's sounding buttons are lit as it plays. With Both hands and a
  // two-voice tune, both manuals are drawn together in place of the diagram.
  const companion = abcCompanionButtons;
  const diagram: DiagramContribution = {
    layers: { abcActiveButtonIdSet: results.abcActiveButtonIdSet },
    handsView:
      results.abcBothHands && companion
        ? {
            hands: [
              {
                key: "treble",
                caption: t("ui.abcHandCaption", { hand: t("nav.treble"), voice: 1 }),
                buttons: side === "stradella" ? companion : buttons,
              },
              {
                key: "stradella",
                caption: t("ui.abcHandCaption", { hand: t("nav.stradella"), voice: 2 }),
                buttons: side === "stradella" ? buttons : companion,
              },
            ],
            activeButtonIds: results.abcActiveButtonIdSet,
            filename: `${results.abcParseResult.title} both hands`,
          }
        : null,
  };
  return (
    <AbcPlayerOutputContext.Provider value={value}>
      <PlaybackTransportEntry tool="abcPlayer" transport={playbackEntry}>
        <ScoreEntryProvider tool="abcPlayer" score={scoreEntry} toggle={scoreToggle}>
          <DiagramContributionProvider tool="abcPlayer" contribution={diagram}>
            {children}
          </DiagramContributionProvider>
        </ScoreEntryProvider>
      </PlaybackTransportEntry>
    </AbcPlayerOutputContext.Provider>
  );
}
