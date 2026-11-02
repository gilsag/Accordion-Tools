import { useMemo, useState } from "react";
import type {
  DiagramButton, FinderChordInversion, FinderChordOctave, FinderChordPattern,
} from "../../types";
import { getChordFinderTrebleButtons, type TrebleChordVoicingMode } from "../../tools/chordFinderTools";

/** Owns the Treble Chord Finder request and its local presentation preferences.
 * Instrument layout and nominal Stradella registers are owned elsewhere;
 * audio source/register state is deliberately not coupled to this feature.
 */
export function useTrebleChordFinderState() {
  const [chordFinderActive, setChordFinderActive] = useState(false);
  const [showTrebleVoicingNote, setShowTrebleVoicingNote] = useState(true);
  const [trebleChordVoicingMode, setTrebleChordVoicingMode] = useState<TrebleChordVoicingMode>("auto");
  const [chordFinderRoot, setChordFinderRoot] = useState("C");
  const [chordFinderPattern, setChordFinderPattern] = useState<FinderChordPattern>("major-triad");
  const [chordFinderInversion, setChordFinderInversion] = useState<FinderChordInversion>("root");
  const [chordFinderOctave, setChordFinderOctave] = useState<FinderChordOctave>(4);
  return {
    chordFinderActive, setChordFinderActive,
    showTrebleVoicingNote, setShowTrebleVoicingNote,
    trebleChordVoicingMode, setTrebleChordVoicingMode,
    chordFinderRoot, setChordFinderRoot,
    chordFinderPattern, setChordFinderPattern,
    chordFinderInversion, setChordFinderInversion,
    chordFinderOctave, setChordFinderOctave,
  };
}

export type TrebleChordFinderSelection = {
  buttons: DiagramButton[];
  isTrebleLikeSide: boolean;
  chordFinderActive: boolean;
  chordFinderRoot: string;
  chordFinderPattern: FinderChordPattern;
  chordFinderInversion: FinderChordInversion;
  chordFinderOctave: FinderChordOctave;
  trebleChordVoicingMode: TrebleChordVoicingMode;
};

/** No extra voicing, filtering, or ordering: delegate to the current engine.
 * Use original DiagramButton objects to preserve SVG IDs and playback mapping.
 */
export function useTrebleChordFinderButtons({
  buttons, isTrebleLikeSide, chordFinderActive, chordFinderRoot,
  chordFinderPattern, chordFinderInversion, chordFinderOctave, trebleChordVoicingMode,
}: TrebleChordFinderSelection) {
  return useMemo(() => {
    if (!chordFinderActive || !isTrebleLikeSide) return [];
    return getChordFinderTrebleButtons(
      buttons, chordFinderRoot, chordFinderPattern,
      chordFinderInversion, chordFinderOctave, trebleChordVoicingMode,
    );
  }, [
    buttons, chordFinderActive, chordFinderRoot, chordFinderPattern,
    chordFinderOctave, chordFinderInversion, trebleChordVoicingMode, isTrebleLikeSide,
  ]);
}
