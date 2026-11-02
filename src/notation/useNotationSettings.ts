import { useState } from "react";

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
  const [musicNotationScale, setMusicNotationScale] = useState(54);
  const [musicNotationStaffWidth, setMusicNotationStaffWidth] = useState(520);
  const [musicNotationStaffSeparator, setMusicNotationStaffSeparator] =
    useState(14);

  return {
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
