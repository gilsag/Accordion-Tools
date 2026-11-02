import { useMemo, useState } from "react";
import type { BassCount, PianoTrebleRange, Side, TrebleLayout, TrebleSizePreset } from "../types";
import { DEFAULT_STRADELLA_REGISTER_MODEL, type StradellaOctaveGrouping, type StradellaRegisterModel } from "../tools/stradellaChordFinder/registerModel";

/** Owns physical manual configuration and the *nominal* Stradella register model.
 * These registers describe modeled sounding octaves, not synthesizer voices,
 * La Melodiosa sample selection, or measured reed ranks. Sound remains separate.
 * Individual setters are exposed during the incremental migration so the
 * existing JSON import/export behavior and tool callbacks remain unchanged.
 */
export function useInstrumentState() {
  const [side, setSide] = useState<Side>("stradella");
  const [basses, setBasses] = useState<BassCount>("96");
  const [trebleLayout, setTrebleLayout] = useState<TrebleLayout>("c-system");
  const [trebleRows, setTrebleRows] = useState<3 | 4 | 5>(5);
  const [trebleSize, setTrebleSize] = useState<TrebleSizePreset>("small");
  const [pianoTrebleRange, setPianoTrebleRange] =
    useState<PianoTrebleRange>("three-octave");
  const [showTrebleOctaves, setShowTrebleOctaves] = useState(false);
  // Register assumptions describe nominal pitch placement, not sound source or reed registration.
  const [stradellaBassRegisterOctave, setStradellaBassRegisterOctave] = useState(DEFAULT_STRADELLA_REGISTER_MODEL.bass.startOctave);
  const [stradellaBassRegisterGrouping, setStradellaBassRegisterGrouping] = useState<StradellaOctaveGrouping>(DEFAULT_STRADELLA_REGISTER_MODEL.bass.grouping);
  const [stradellaChordRegisterOctave, setStradellaChordRegisterOctave] = useState(DEFAULT_STRADELLA_REGISTER_MODEL.chord.startOctave);
  const [stradellaChordRegisterGrouping, setStradellaChordRegisterGrouping] = useState<StradellaOctaveGrouping>(DEFAULT_STRADELLA_REGISTER_MODEL.chord.grouping);
  const stradellaRegisterModel: StradellaRegisterModel = useMemo(() => ({
    bass: { startOctave: stradellaBassRegisterOctave, grouping: stradellaBassRegisterGrouping },
    chord: { startOctave: stradellaChordRegisterOctave, grouping: stradellaChordRegisterGrouping },
  }), [stradellaBassRegisterOctave, stradellaBassRegisterGrouping, stradellaChordRegisterOctave, stradellaChordRegisterGrouping]);
  return {
    side, setSide, basses, setBasses, trebleLayout, setTrebleLayout,
    trebleRows, setTrebleRows, trebleSize, setTrebleSize,
    pianoTrebleRange, setPianoTrebleRange, showTrebleOctaves, setShowTrebleOctaves,
    stradellaBassRegisterOctave, setStradellaBassRegisterOctave,
    stradellaBassRegisterGrouping, setStradellaBassRegisterGrouping,
    stradellaChordRegisterOctave, setStradellaChordRegisterOctave,
    stradellaChordRegisterGrouping, setStradellaChordRegisterGrouping,
    stradellaRegisterModel,
  };
}
