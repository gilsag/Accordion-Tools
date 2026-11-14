import { useMemo, type ReactNode } from "react";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformNavigation,
  usePlatformSpelling,
} from "../../app/platform/platformContexts";
import type { ProgressionSearchSettings } from "../../tools/harmonyExplorer/progression";
import { useStradellaChordFinder } from "../stradellaChordFinder/stradellaChordFinderContext";
import {
  ProgressionAssistantOutputContext,
  useProgressionAssistant,
} from "./progressionAssistantContext";
import { useHarmonyProgressionResults } from "./useProgressionAssistant";

/** The optimized plan for the progression, its realization options, the
 * previewed step and what is lit. */
export function ProgressionAssistantOutputProvider({ children }: { children: ReactNode }) {
  const { basses, stradellaRegisterModel } = usePlatformInstrument();
  const { buttonSize, spacing, diagramVerticalSpacing } = usePlatformAppearance();
  const { accidental } = usePlatformSpelling();
  const { activeToolSection } = usePlatformNavigation();
  const state = useProgressionAssistant();
  const {
    stradellaRequestedBassOnBassButton,
    finderMaxButtons,
    finderSpanColumns,
    stradellaMinimumNominalGap,
  } = useStradellaChordFinder();
  const { harmonyProgressionRootPosition } = state;

  // The assistant searches each chord with the Chord Finder's own limits,
  // register model and bass rules, so that with both weights at 0 every chord
  // gets the Chord Finder's first realization.
  const progressionSearch = useMemo<ProgressionSearchSettings>(
    () => ({
      rootPosition: harmonyProgressionRootPosition,
      requestedBassOnBassButton: stradellaRequestedBassOnBassButton,
      maxButtons: finderMaxButtons,
      spanColumns: finderSpanColumns,
      registerModel: stradellaRegisterModel,
      minimumNominalGap: stradellaMinimumNominalGap,
    }),
    [
      harmonyProgressionRootPosition,
      stradellaRequestedBassOnBassButton,
      finderMaxButtons,
      finderSpanColumns,
      stradellaRegisterModel,
      stradellaMinimumNominalGap,
    ],
  );
  const results = useHarmonyProgressionResults({
    ...state,
    basses,
    buttonSize,
    spacing,
    // Stradella buttons have no enharmonic spelling mode.
    stradellaAccidental: accidental === "enharmonic" ? "natural" : accidental,
    diagramVerticalSpacing,
    activeToolSection,
    progressionSearch,
  });
  const value = useMemo(() => ({ ...results, progressionSearch }), [results, progressionSearch]);
  return (
    <ProgressionAssistantOutputContext.Provider value={value}>
      {children}
    </ProgressionAssistantOutputContext.Provider>
  );
}
