import { useEffect, useMemo, useState } from "react";
import type { DiagramButton, FinderChordPattern, Side, StradellaChordFinderMode } from "../../types";
import { DEFAULT_STRADELLA_NOTE_LEVELS, type StradellaNoteLevels } from "../../tools/stradellaChordFinder/diagramAnnotations";
import type { MinimumNominalGap } from "../../tools/stradellaChordFinder/voicingDensity";
import type { StradellaRegisterModel } from "../../tools/stradellaChordFinder/registerModel";
import { getStradellaChordFinderResult, getStradellaChordFinderResults } from "../../tools/stradellaChordFinderTools";
import { ROOT_POSITION_BASS, resolveRequestedBass } from "../../tools/stradellaChordFinder/harmonicIdentity";

/** Finder-owned request and presentation state. The nominal register model and
 * physical layout belong to the instrument, and sample registers belong to
 * sound. Keep the existing setters for settings import and cross-tool commands.
 */
export function useStradellaChordFinderState() {
  const [stradellaChordFinderActive, setStradellaChordFinderActive] = useState(false);
  const [stradellaChordFinderRoot, setStradellaChordFinderRoot] = useState("C");
  const [stradellaChordFinderPattern, setStradellaChordFinderPattern] = useState<FinderChordPattern>("major-triad");
  const [stradellaChordFinderMode, setStradellaChordFinderMode] = useState<StradellaChordFinderMode>("bass-and-chords");
  const [stradellaChordFinderRealizationIndex, setStradellaChordFinderRealizationIndex] = useState(0);
  // Harmonic intent (slash bass) for this chord, not an instrument preference.
  // The stored choice is ROOT_POSITION_BASS (default: follow the chord's root),
  // null (any bass) or a specific pitch class; consumers read the resolved pitch.
  const [requestedBassChoice, setStradellaChordFinderRequestedBass] = useState<string | null>(ROOT_POSITION_BASS);
  const stradellaChordFinderRequestedBass = resolveRequestedBass(stradellaChordFinderRoot, requestedBassChoice);
  // Root position is a preference: when no root-position realization exists the
  // results fall back to any bass (see useStradellaChordFinderResults).
  const stradellaChordFinderRootPreferred = requestedBassChoice === ROOT_POSITION_BASS;
  const [finderMaxButtons, setFinderMaxButtons] = useState(3);
  const [finderSpanColumns, setFinderSpanColumns] = useState(4.3);
  const [stradellaMinimumNominalGap, setStradellaMinimumNominalGap] = useState<MinimumNominalGap>(0);
  const [showFinderRealizationNote, setShowFinderRealizationNote] = useState(true);
  const [stradellaNoteLevels, setStradellaNoteLevels] = useState<StradellaNoteLevels>({ ...DEFAULT_STRADELLA_NOTE_LEVELS });
  const [finderExplanationFontSize, setFinderExplanationFontSize] = useState(26);
  // An exact physical button signature selected in another tool.
  const [pendingProgressionRealizationKey, setPendingProgressionRealizationKey] = useState<string | null>(null);
  const [stradellaChordFinderMarkRootBass, setStradellaChordFinderMarkRootBass] = useState(true);

  return {
    stradellaChordFinderActive, setStradellaChordFinderActive,
    stradellaChordFinderRoot, setStradellaChordFinderRoot,
    stradellaChordFinderPattern, setStradellaChordFinderPattern,
    stradellaChordFinderMode, setStradellaChordFinderMode,
    stradellaChordFinderRealizationIndex, setStradellaChordFinderRealizationIndex,
    stradellaChordFinderRequestedBass, setStradellaChordFinderRequestedBass,
    stradellaChordFinderRootPreferred,
    finderMaxButtons, setFinderMaxButtons,
    finderSpanColumns, setFinderSpanColumns,
    stradellaMinimumNominalGap, setStradellaMinimumNominalGap,
    showFinderRealizationNote, setShowFinderRealizationNote,
    stradellaNoteLevels, setStradellaNoteLevels,
    finderExplanationFontSize, setFinderExplanationFontSize,
    pendingProgressionRealizationKey, setPendingProgressionRealizationKey,
    stradellaChordFinderMarkRootBass, setStradellaChordFinderMarkRootBass,
  };
}

type FinderState = ReturnType<typeof useStradellaChordFinderState>;
export type StradellaFinderSelection = Pick<FinderState,
  | "stradellaChordFinderActive" | "stradellaChordFinderRoot" | "stradellaChordFinderPattern"
  | "stradellaChordFinderMode" | "stradellaChordFinderRealizationIndex"
  | "stradellaChordFinderRequestedBass" | "stradellaChordFinderRootPreferred" | "finderMaxButtons" | "finderSpanColumns"
  | "stradellaMinimumNominalGap" | "stradellaChordFinderMarkRootBass"
  | "pendingProgressionRealizationKey" | "setPendingProgressionRealizationKey"
  | "setStradellaChordFinderRealizationIndex"
> & {
  buttons: DiagramButton[];
  side: Side;
  stradellaRegisterModel: StradellaRegisterModel;
};

/** Reuses the unchanged search engines and candidate ordering. In particular,
 * fallback results, selection clamping, and both synchronization effects must
 * retain their old behavior for diagrams, audio, and batch export.
 */
export function useStradellaChordFinderResults({
  buttons, side, stradellaRegisterModel, stradellaChordFinderActive,
  stradellaChordFinderRoot, stradellaChordFinderPattern,
  stradellaChordFinderMode, stradellaChordFinderRealizationIndex,
  stradellaChordFinderRequestedBass: requestedBass, stradellaChordFinderRootPreferred,
  finderMaxButtons, finderSpanColumns,
  stradellaMinimumNominalGap, stradellaChordFinderMarkRootBass,
  pendingProgressionRealizationKey, setPendingProgressionRealizationKey,
  setStradellaChordFinderRealizationIndex,
}: StradellaFinderSelection) {
  const realizationSearch = useMemo(() => {
    if (!stradellaChordFinderActive || side !== "stradella") return { results: [], rootFallback: false };
    const search = (bass: string | null) => getStradellaChordFinderResults(
      buttons, stradellaChordFinderRoot, stradellaChordFinderPattern,
      stradellaChordFinderMode, stradellaChordFinderMarkRootBass,
      finderMaxButtons, finderSpanColumns, bass,
      stradellaRegisterModel, stradellaMinimumNominalGap,
    );
    const preferred = search(requestedBass);
    // The default root-position choice is a preference: if nothing puts the
    // root lowest, show any-bass results and say so. An explicit non-root slash
    // bass stays a strict requirement.
    if (stradellaChordFinderRootPreferred && !preferred.some((result) => result.playable)) {
      const anyBass = search(null);
      if (anyBass.some((result) => result.playable)) return { results: anyBass, rootFallback: true };
    }
    return { results: preferred, rootFallback: false };
  }, [
    buttons, side, stradellaChordFinderActive, stradellaChordFinderRoot,
    stradellaChordFinderPattern, stradellaChordFinderMode,
    stradellaChordFinderMarkRootBass, finderMaxButtons, finderSpanColumns,
    requestedBass, stradellaChordFinderRootPreferred, stradellaRegisterModel, stradellaMinimumNominalGap,
  ]);
  const stradellaChordFinderRealizations = realizationSearch.results;
  /** True when root position was preferred but unavailable, so any bass is shown. */
  const stradellaChordFinderRootFallback = realizationSearch.rootFallback;
  /** The requested bass the shown results actually satisfy (null after a fallback). */
  const stradellaChordFinderRequestedBass = stradellaChordFinderRootFallback ? null : requestedBass;

  const stradellaChordFinderResult = useMemo(() => {
    if (stradellaChordFinderRealizations.length === 0) {
      return getStradellaChordFinderResult([], stradellaChordFinderRoot,
        stradellaChordFinderPattern, stradellaChordFinderMode,
        stradellaChordFinderMarkRootBass, stradellaChordFinderRequestedBass,
        stradellaRegisterModel);
    }
    return stradellaChordFinderRealizations[
      Math.min(stradellaChordFinderRealizationIndex, stradellaChordFinderRealizations.length - 1)
    ];
  }, [
    stradellaChordFinderRealizations, stradellaChordFinderRealizationIndex,
    stradellaChordFinderRoot, stradellaChordFinderPattern, stradellaChordFinderMode,
    stradellaChordFinderMarkRootBass, stradellaChordFinderRequestedBass, stradellaRegisterModel,
  ]);

  useEffect(() => {
    // Preserve the existing reset when search inputs or instrument registers change.
    setStradellaChordFinderRealizationIndex(0);
  }, [
    stradellaChordFinderRoot, stradellaChordFinderPattern,
    stradellaChordFinderMode, stradellaChordFinderRequestedBass,
    stradellaRegisterModel, finderMaxButtons, finderSpanColumns,
    stradellaMinimumNominalGap, side, setStradellaChordFinderRealizationIndex,
  ]);

  /* A progression handoff identifies actual pressed buttons, not only a
     pitch-class-equivalent realization (bass vs counterbass matters). */
  useEffect(() => {
    if (!pendingProgressionRealizationKey || stradellaChordFinderRealizations.length === 0) return;
    const index = stradellaChordFinderRealizations.findIndex((result) =>
      result.playbackButtons.map((button) => button.id).sort().join("|") === pendingProgressionRealizationKey,
    );
    // The matching index refers to the exact playback-button recipe.
    if (index >= 0) setStradellaChordFinderRealizationIndex(index);
    setPendingProgressionRealizationKey(null);
  }, [
    pendingProgressionRealizationKey, stradellaChordFinderRealizations,
    setStradellaChordFinderRealizationIndex, setPendingProgressionRealizationKey,
  ]);

  // Optional visual root guides can be highlighted but must not be played.
  const stradellaChordFinderButtons = stradellaChordFinderResult.buttons;
  const stradellaChordFinderPlaybackButtons = stradellaChordFinderResult.playbackButtons;
  const stradellaRootBassFinderButtonIds = useMemo(
    () => new Set(stradellaChordFinderResult.rootBassButtonIds),
    [stradellaChordFinderResult.rootBassButtonIds],
  );
  const stradellaPrimaryFinderButtonIds = useMemo(
    () => new Set(stradellaChordFinderResult.primaryButtonIds),
    [stradellaChordFinderResult.primaryButtonIds],
  );
  return {
    stradellaChordFinderRealizations, stradellaChordFinderResult,
    stradellaChordFinderButtons, stradellaChordFinderPlaybackButtons,
    stradellaRootBassFinderButtonIds, stradellaPrimaryFinderButtonIds,
    stradellaChordFinderRootFallback,
    stradellaChordFinderEffectiveRequestedBass: stradellaChordFinderRequestedBass,
  };
}
