import { useEffect, useMemo, useState } from "react";
import type { InterfaceLanguage } from "../../i18n/catalog";
import { familyName, scaleName } from "../../i18n/musicTerms";
import { buildDiagramExplanation } from "../../tools/harmonyExplorer/explanation";
import { DEFAULT_RING_VISIBILITY, buildSectorRelationships,
  chordFamily as harmonyChordFamily, relatedFamilyName as harmonyRelatedFamilyName,
  relationshipCounts as harmonyRelationshipCounts,
  filterRelationshipCounts, scaleDefinition as harmonyScaleDefinition,
} from "../../tools/harmonyExplorer/music";
import type { ChordFamilyId, RelatedFamilyId, ScaleId } from "../../tools/harmonyExplorer/music";
import type { HarmonyPlaybackStyle, HarmonySelection, HarmonyVoicingStyle } from "../../tools/harmonyExplorer/types";
import type { translate } from "../../i18n/catalog";

type Translator = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => string;

/** Owns exploration controls and selected harmonic relationship. Physical
 * manuals, Stradella registers, samples, and the cross-tool navigation commands
 * remain outside the Explorer. Setters retain their original settings contract.
 */
export function useHarmonyExplorerState() {
  /* Harmony Explorer state. Kept independent from accordion layout state so the
     harmonic relationship engine can remain reusable and later evolve separately. */
  const [harmonyReferenceFamilyId, setHarmonyReferenceFamilyId] = useState<ChordFamilyId>("major");
  const [harmonyRelatedFamilyId, setHarmonyRelatedFamilyId] = useState<RelatedFamilyId>("minor7");
  const [harmonyScaleId, setHarmonyScaleId] = useState<ScaleId>("ionian");
  const [harmonyDiatonicOnly, setHarmonyDiatonicOnly] = useState(false);
  const [harmonyHighlightDiatonic, setHarmonyHighlightDiatonic] = useState(true);
  const [harmonyShowEnharmonics, setHarmonyShowEnharmonics] = useState(false);
  const [harmonyShowSeparators, setHarmonyShowSeparators] = useState(true);
  const [harmonyShowLegend, setHarmonyShowLegend] = useState(true);
  const [harmonyShowExplanation, setHarmonyShowExplanation] = useState(false);
  const [harmonyRingVisibility, setHarmonyRingVisibility] = useState<Record<number, boolean>>(() => ({ ...DEFAULT_RING_VISIBILITY }));
  const [harmonyShowToneTooltips, setHarmonyShowToneTooltips] = useState(true);
  const [harmonyShowNoteRing, setHarmonyShowNoteRing] = useState(true);
  const [harmonyColorByFamily, setHarmonyColorByFamily] = useState(false);
  const [harmonyDiameter, setHarmonyDiameter] = useState(900);
  const [harmonyFontSize, setHarmonyFontSize] = useState(18);
  const [harmonyPlaybackStyle, setHarmonyPlaybackStyle] = useState<HarmonyPlaybackStyle>("block");
  const [harmonyVoicingStyle, setHarmonyVoicingStyle] = useState<HarmonyVoicingStyle>("root");
  const [harmonySelection, setHarmonySelection] = useState<HarmonySelection | null>(null);
  const [harmonyFocusedReferenceRootPc, setHarmonyFocusedReferenceRootPc] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear a stale selection when harmonic reference settings change.
    setHarmonySelection(null);
  }, [harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId, harmonyDiatonicOnly]);
  return {
    harmonyReferenceFamilyId, setHarmonyReferenceFamilyId,
    harmonyRelatedFamilyId, setHarmonyRelatedFamilyId,
    harmonyScaleId, setHarmonyScaleId,
    harmonyDiatonicOnly, setHarmonyDiatonicOnly,
    harmonyHighlightDiatonic, setHarmonyHighlightDiatonic,
    harmonyShowEnharmonics, setHarmonyShowEnharmonics,
    harmonyShowSeparators, setHarmonyShowSeparators,
    harmonyShowLegend, setHarmonyShowLegend,
    harmonyShowExplanation, setHarmonyShowExplanation,
    harmonyRingVisibility, setHarmonyRingVisibility,
    harmonyShowToneTooltips, setHarmonyShowToneTooltips,
    harmonyShowNoteRing, setHarmonyShowNoteRing,
    harmonyColorByFamily, setHarmonyColorByFamily,
    harmonyDiameter, setHarmonyDiameter,
    harmonyFontSize, setHarmonyFontSize,
    harmonyPlaybackStyle, setHarmonyPlaybackStyle,
    harmonyVoicingStyle, setHarmonyVoicingStyle,
    harmonySelection, setHarmonySelection,
    harmonyFocusedReferenceRootPc, setHarmonyFocusedReferenceRootPc,
  };
}

/** Keep relationship counts and localized explanations derived, not persisted.
 * These functions delegate to the established harmony engine unchanged.
 */
export function useHarmonyExplorerResults({
  harmonyReferenceFamilyId,
  harmonyRelatedFamilyId,
  harmonyScaleId,
  harmonyDiatonicOnly,
  harmonyHighlightDiatonic,
  harmonyRingVisibility,
  harmonyShowNoteRing,
  language, t,
}: Pick<ReturnType<typeof useHarmonyExplorerState>,
  "harmonyReferenceFamilyId" | "harmonyRelatedFamilyId" | "harmonyScaleId" |
  "harmonyDiatonicOnly" | "harmonyHighlightDiatonic" | "harmonyRingVisibility" |
  "harmonyShowNoteRing"
> & { language: InterfaceLanguage; t: Translator }) {
  /* Harmony Explorer derives all diagram data from pitch-class relationships. */
  const harmonyAllFamiliesMode = harmonyRelatedFamilyId === "all";
  const harmonyEffectiveDiatonicOnly = harmonyDiatonicOnly || harmonyAllFamiliesMode;
  const harmonyEffectiveHighlightDiatonic = !harmonyEffectiveDiatonicOnly && harmonyHighlightDiatonic;
  const harmonySectors = useMemo(
    () => buildSectorRelationships(
      harmonyReferenceFamilyId,
      harmonyRelatedFamilyId,
      harmonyScaleId,
      harmonyEffectiveDiatonicOnly,
      true,
    ),
    [harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId, harmonyEffectiveDiatonicOnly],
  );
  const harmonyAvailableCounts = useMemo(
    () => harmonyRelationshipCounts(harmonySectors),
    [harmonySectors],
  );
  const harmonyCounts = useMemo(
    () => filterRelationshipCounts(harmonyAvailableCounts, harmonyRingVisibility),
    [harmonyAvailableCounts, harmonyRingVisibility],
  );
  const harmonyAllSectors = useMemo(
    () => buildSectorRelationships(
      harmonyReferenceFamilyId,
      harmonyRelatedFamilyId,
      harmonyScaleId,
      harmonyAllFamiliesMode,
      true,
    ),
    [harmonyReferenceFamilyId, harmonyRelatedFamilyId, harmonyScaleId, harmonyAllFamiliesMode],
  );
  const harmonyAllCounts = useMemo(
    () => harmonyRelationshipCounts(harmonyAllSectors),
    [harmonyAllSectors],
  );
  const harmonyReferenceFamily = harmonyChordFamily(harmonyReferenceFamilyId);
  const harmonyRelatedName = harmonyRelatedFamilyName(harmonyRelatedFamilyId);
  const harmonyScale = harmonyScaleDefinition(harmonyScaleId);
  const harmonyExplanation = useMemo(
    () => buildDiagramExplanation({
      referenceFamilyName: familyName(harmonyReferenceFamily.id, harmonyReferenceFamily.name, language),
      relatedFamilyName: harmonyRelatedFamilyId === "all" ? t("ui.allDiatonicFamilies") : familyName(harmonyRelatedFamilyId, harmonyRelatedName, language),
      scaleName: scaleName(harmonyScale.id, harmonyScale.name, language),
      diatonicOnly: harmonyEffectiveDiatonicOnly,
      highlightDiatonic: harmonyEffectiveHighlightDiatonic,
      allFamiliesMode: harmonyAllFamiliesMode,
      showNoteRing: harmonyShowNoteRing,
      counts: harmonyCounts,
      availableCounts: harmonyAvailableCounts,
      allCounts: harmonyAllCounts,
      language,
    }),
    [
      harmonyReferenceFamily.id,
      harmonyReferenceFamily.name,
      harmonyRelatedFamilyId,
      harmonyRelatedName,
      harmonyScale.id,
      harmonyScale.name,
      harmonyEffectiveDiatonicOnly,
      harmonyEffectiveHighlightDiatonic,
      harmonyAllFamiliesMode,
      harmonyShowNoteRing,
      harmonyCounts,
      harmonyAvailableCounts,
      harmonyAllCounts,
      language,
      t,
    ],
  );

  return {
    harmonyAllFamiliesMode, harmonyEffectiveDiatonicOnly, harmonyEffectiveHighlightDiatonic,
    harmonySectors, harmonyAvailableCounts, harmonyCounts, harmonyAllSectors,
    harmonyAllCounts, harmonyReferenceFamily, harmonyRelatedName, harmonyScale,
    harmonyExplanation,
  };
}
