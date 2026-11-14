import {
  PIANO_TREBLE_PRESET_BUTTON_SIZE,
  TREBLE_PRESET_BUTTON_SIZE,
} from "../../instrument/sizePresets";
import type { PianoTrebleRange, TrebleLayout, TrebleSizePreset } from "../../types";
import { usePlatformAppearance, usePlatformInstrument } from "./platformContexts";

/** Treble size, layout and piano range changes, each with its matching
 * default button size. */
export function useInstrumentPresets() {
  const {
    side,
    trebleLayout,
    setTrebleLayout,
    trebleSize,
    setTrebleSize,
    pianoTrebleRange,
    setPianoTrebleRange,
  } = usePlatformInstrument();
  const { setButtonSize } = usePlatformAppearance();

  /** Applies a treble size preset and its matching default button size. */
  function changeTrebleSize(nextSize: TrebleSizePreset) {
    setTrebleSize(nextSize);
    setButtonSize(TREBLE_PRESET_BUTTON_SIZE[nextSize]);
  }

  /** Changes between C-system, B-system, and piano treble layouts. */
  function changeTrebleLayout(nextLayout: TrebleLayout) {
    setTrebleLayout(nextLayout);
    if (nextLayout === "piano") {
      setButtonSize(PIANO_TREBLE_PRESET_BUTTON_SIZE[pianoTrebleRange]);
      return;
    }
    setButtonSize(TREBLE_PRESET_BUTTON_SIZE[trebleSize]);
  }

  /** Applies a piano treble range preset and its matching default key size. */
  function changePianoTrebleRange(nextRange: PianoTrebleRange) {
    setPianoTrebleRange(nextRange);
    setButtonSize(PIANO_TREBLE_PRESET_BUTTON_SIZE[nextRange]);
  }

  return {
    changeTrebleSize,
    changeTrebleLayout,
    changePianoTrebleRange,
    isPianoTreble: side === "treble" && trebleLayout === "piano",
  };
}
