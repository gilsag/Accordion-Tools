import { useAbcPlayer } from "../../features/abcPlayer/abcPlayerContext";
import { useBassPatternPlayer } from "../../features/bassPatternPlayer/bassPatternPlayerContext";
import { useScaleFinder } from "../../features/scaleFinder/scaleFinderContext";
import { useStradellaChordFinder } from "../../features/stradellaChordFinder/stradellaChordFinderContext";
import { useTrebleChordFinder } from "../../features/trebleChordFinder/trebleChordFinderContext";
import { accordionStatusText } from "../../i18n/diagramLabels";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformSound,
  usePlatformSpelling,
} from "../platform/platformContexts";
import { activeToolStatusLabel } from "../workspacePresentation";

/** The accordion workspace's status line: instrument, notation, sound and
 * the tool in use (a playing player first, then the open or active tool; see
 * `activeToolStatusLabel`). */
export function useAccordionStatusText() {
  const { t, language } = usePlatformLanguage();
  const { side, basses, trebleLayout, pianoTrebleRange, trebleRows } = usePlatformInstrument();
  const { notation } = usePlatformSpelling();
  const { soundEnabled } = usePlatformSound();
  const { activeToolSection } = usePlatformNavigation();
  const { bassPatternPlaybackState } = useBassPatternPlayer();
  const { abcPlaybackState } = useAbcPlayer();
  const { scaleFinderActive } = useScaleFinder();
  const { stradellaChordFinderActive } = useStradellaChordFinder();
  const { chordFinderActive } = useTrebleChordFinder();
  const activeTool =
    activeToolSection === "rhythmTrainer"
      ? t("rhythm.title")
      : activeToolStatusLabel({
          side,
          bassPatternPlaybackState,
          abcPlaybackState,
          activeToolSection,
          scaleFinderActive,
          stradellaChordFinderActive,
          chordFinderActive,
          t,
        });
  return accordionStatusText({
    side,
    basses,
    trebleLayout,
    pianoRange: pianoTrebleRange,
    trebleRows,
    notation,
    soundEnabled,
    activeTool,
    language,
  });
}
