import { useState } from "react";
import { DEFAULT_CHORD_DISPLAY_STYLE, type ChordDisplayStyle } from "../music/chordDisplay";
import type { AccidentalMode, ChordLabelMode, NotationMode } from "../types";

/** How notes and chords are spelled on the diagram, in titles and in the
 * tools: note-name system, accidentals, chord-button labels and chord-symbol
 * style. Read by the diagram labels and by several tools, so it is shared
 * state rather than any one tool's. */
export function useMusicSpelling() {
  const [notation, setNotation] = useState<NotationMode>("english");
  const [accidental, setAccidental] = useState<AccidentalMode>("natural");
  const [chordDisplayStyle, setChordDisplayStyle] = useState<ChordDisplayStyle>(
    DEFAULT_CHORD_DISPLAY_STYLE,
  );
  const [chordLabelMode, setChordLabelMode] = useState<ChordLabelMode>("chord-name");
  return {
    notation,
    setNotation,
    accidental,
    setAccidental,
    chordDisplayStyle,
    setChordDisplayStyle,
    chordLabelMode,
    setChordLabelMode,
  };
}
