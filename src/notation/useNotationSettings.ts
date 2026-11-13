import type { ChordQualityLabelMode, StradellaNotationMode } from "./stradellaNotation";
import { useState } from "react";
import type { NotationPlacement } from "./notationSelection";

/** Owns score-presentation preferences independently of the audio transport,
 * physical instrument and notation renderer. Names/defaults are kept stable
 * for the existing imported/exported settings JSON schema. */
export function useNotationSettings() {
  const [musicNotationIncludeTitle, setMusicNotationIncludeTitle] =
    useState(true);
  const [musicNotationIncludeDescription, setMusicNotationIncludeDescription] =
    useState(false);
  const [musicNotationIncludeSummary, setMusicNotationIncludeSummary] =
    useState(false);
  const [musicNotationUseBarsPerLine, setMusicNotationUseBarsPerLine] =
    useState(true);
  const [musicNotationBarsPerLine, setMusicNotationBarsPerLine] = useState(4);
  const [musicNotationChordFontSize, setMusicNotationChordFontSize] =
    useState(11);
  const [musicNotationScale, setMusicNotationScale] = useState(76);
  const [musicNotationStaffWidth, setMusicNotationStaffWidth] = useState(520);
  const [musicNotationStaffSeparator, setMusicNotationStaffSeparator] =
    useState(14);

  const [stradellaNotationMode, setStradellaNotationMode] = useState<StradellaNotationMode>("symbolic");
  const [stradellaChordQualityLabels, setStradellaChordQualityLabels] = useState<ChordQualityLabelMode>("always");
  const [stradellaMarkCounterbass, setStradellaMarkCounterbass] = useState(false);
  const [musicNotationNoteNamesInNoteheads, setMusicNotationNoteNamesInNoteheads] = useState(false);
  const [musicNotationPlacement, setMusicNotationPlacement] = useState<NotationPlacement>("right");

  return {
    stradellaNotationMode, setStradellaNotationMode,
    stradellaChordQualityLabels, setStradellaChordQualityLabels,
    stradellaMarkCounterbass, setStradellaMarkCounterbass,
    musicNotationNoteNamesInNoteheads, setMusicNotationNoteNamesInNoteheads,
    musicNotationPlacement, setMusicNotationPlacement,
    musicNotationIncludeTitle, setMusicNotationIncludeTitle,
    musicNotationIncludeDescription, setMusicNotationIncludeDescription,
    musicNotationIncludeSummary, setMusicNotationIncludeSummary,
    musicNotationUseBarsPerLine, setMusicNotationUseBarsPerLine,
    musicNotationBarsPerLine, setMusicNotationBarsPerLine,
    musicNotationChordFontSize, setMusicNotationChordFontSize,
    musicNotationScale, setMusicNotationScale,
    musicNotationStaffWidth, setMusicNotationStaffWidth,
    musicNotationStaffSeparator, setMusicNotationStaffSeparator,
  };
}
