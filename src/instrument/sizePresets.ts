import type { PianoTrebleRange, TrebleSizePreset } from "../types";

/** Default button sizes applied when a treble size preset is selected. */
export const TREBLE_PRESET_BUTTON_SIZE: Record<TrebleSizePreset, number> = {
  "one-octave": 28,
  "two-octave": 28,
  small: 28,
  full: 24,
  large: 20,
};

/** Default key-size slider values applied when a piano range is selected. */
export const PIANO_TREBLE_PRESET_BUTTON_SIZE: Record<PianoTrebleRange, number> = {
  "two-octave": 28,
  "three-octave": 24,
  "four-octave": 20,
};
