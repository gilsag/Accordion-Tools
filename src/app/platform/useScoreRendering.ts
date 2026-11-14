import { useCallback, useMemo } from "react";
import { renderNotationInto as renderSharedNotation } from "../../notation/notationService";
import type { StradellaNotationPreferences } from "../../notation/stradellaNotation";
import type { StradellaNotationAbcOptions } from "../../features/bassPatternPlayer/bassPatternPlayerTools";
import { usePlatformNotation } from "./platformContexts";

/** What every score shares, derived from the notation settings: the
 * Stradella notation preferences, the ABC options for generated scores, and
 * the function that renders an ABC source into a score panel. */
export function useScoreRendering() {
  const {
    musicNotationBarsPerLine,
    musicNotationChordFontSize,
    musicNotationIncludeDescription,
    musicNotationIncludeSummary,
    musicNotationIncludeTitle,
    musicNotationScale,
    musicNotationStaffSeparator,
    musicNotationStaffWidth,
    musicNotationUseBarsPerLine,
    musicNotationNoteNamesInNoteheads,
    stradellaNotationMode,
    stradellaChordQualityLabels,
    stradellaMarkCounterbass,
  } = usePlatformNotation();

  const stradellaPreferences: StradellaNotationPreferences = useMemo(
    () => ({
      mode: stradellaNotationMode,
      chordQualityLabels: stradellaChordQualityLabels,
      markCounterbass: stradellaMarkCounterbass,
    }),
    [stradellaNotationMode, stradellaChordQualityLabels, stradellaMarkCounterbass],
  );

  const musicNotationAbcOptions: StradellaNotationAbcOptions = useMemo(
    () => ({
      includeTitle: musicNotationIncludeTitle,
      includeDescription: musicNotationIncludeDescription,
      includeSummary: musicNotationIncludeSummary,
      barsPerLine: musicNotationUseBarsPerLine ? musicNotationBarsPerLine : 999,
      chordFontSize: musicNotationChordFontSize,
      titleFontSize: 14,
      staffSeparator: musicNotationStaffSeparator,
      stradellaPreferences,
    }),
    [
      musicNotationBarsPerLine,
      musicNotationChordFontSize,
      musicNotationIncludeDescription,
      musicNotationIncludeSummary,
      musicNotationIncludeTitle,
      musicNotationStaffSeparator,
      musicNotationUseBarsPerLine,
      stradellaPreferences,
    ],
  );

  const renderNotationInto = useCallback(
    (target: HTMLDivElement | null, abcSource: string, imported = false) =>
      renderSharedNotation(
        target,
        abcSource,
        musicNotationScale,
        musicNotationStaffWidth,
        musicNotationNoteNamesInNoteheads,
        {
          staffSeparator: musicNotationStaffSeparator,
          barsPerLine: musicNotationUseBarsPerLine ? musicNotationBarsPerLine : 999,
          chordFontSize: musicNotationChordFontSize,
        },
        imported,
      ),
    [
      musicNotationScale,
      musicNotationStaffWidth,
      musicNotationNoteNamesInNoteheads,
      musicNotationStaffSeparator,
      musicNotationBarsPerLine,
      musicNotationUseBarsPerLine,
      musicNotationChordFontSize,
    ],
  );

  return { stradellaPreferences, musicNotationAbcOptions, renderNotationInto };
}
