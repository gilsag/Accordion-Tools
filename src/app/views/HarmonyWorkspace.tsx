import { lazy, Suspense } from "react";
import { harmonyRelatedDisplayName } from "../../i18n/diagramLabels";
import {
  useHarmonyExplorer,
  useHarmonyExplorerOutput,
} from "../../features/harmonyExplorer/harmonyExplorerContext";
import {
  usePlatformLanguage,
  usePlatformShell,
  usePlatformSpelling,
} from "../platform/platformContexts";

const HarmonicCircle = lazy(() =>
  import("../../features/harmonyExplorer/HarmonicCircle").then((module) => ({
    default: module.HarmonicCircle,
  })),
);

/** The Harmony workspace: the harmonic circle, or why nothing is drawn. */
export function HarmonyWorkspace() {
  const { language, t } = usePlatformLanguage();
  const { chordDisplayStyle } = usePlatformSpelling();
  const { harmonySvgRef } = usePlatformShell();
  const {
    harmonyColorByFamily,
    harmonyDiameter,
    harmonyFocusedReferenceRootPc,
    harmonyFontSize,
    harmonyPlaybackStyle,
    harmonyReferenceFamilyId,
    harmonyRelatedFamilyId,
    harmonyScaleId,
    harmonyShowEnharmonics,
    harmonyShowExplanation,
    harmonyShowLegend,
    harmonyShowNoteRing,
    harmonyShowSeparators,
    harmonyShowToneTooltips,
    harmonyVoicingStyle,
    setHarmonySelection,
  } = useHarmonyExplorer();
  const {
    handleHarmonyChordActivated,
    harmonyAllFamiliesMode,
    harmonyAvailableCounts,
    harmonyCounts,
    harmonyEffectiveDiatonicOnly,
    harmonyEffectiveHighlightDiatonic,
    harmonyExplanation,
    harmonyRelatedName,
    harmonySectors,
    playHarmonyChord,
    playHarmonyChordRelationship,
    playHarmonyNote,
  } = useHarmonyExplorerOutput();
  return (
    <>
      {harmonyAvailableCounts.length === 0 && (
        <div className="harmony-empty-result">
          {t("ui.noChordRelationshipsSatisfyTheCurrentHarmonicFilter")}
        </div>
      )}
      {harmonyAvailableCounts.length > 0 && harmonyCounts.length === 0 && (
        <div className="harmony-empty-result">
          {t("ui.allAvailableOuterRingsAreHiddenReEnableAtLeastOneRingInHarmonyExplorer")}
        </div>
      )}
      <div className="canvas-wrap harmony-canvas-wrap">
        <div
          className="harmony-svg-host"
          style={{
            width: `${harmonyDiameter + (harmonyShowLegend || harmonyShowExplanation ? Math.max(460, harmonyDiameter * 0.65) : 0)}px`,
          }}
        >
          <Suspense fallback={<div className="harmony-empty-result" aria-busy="true" />}>
            <HarmonicCircle
              chordDisplayStyle={chordDisplayStyle}
              sectors={harmonySectors}
              counts={harmonyCounts}
              referenceFamilyId={harmonyReferenceFamilyId}
              relatedFamilyName={harmonyRelatedDisplayName(
                harmonyRelatedFamilyId,
                harmonyRelatedName,
                language,
              )}
              allFamiliesMode={harmonyAllFamiliesMode}
              scaleId={harmonyScaleId}
              diatonicOnly={harmonyEffectiveDiatonicOnly}
              highlightDiatonic={harmonyEffectiveHighlightDiatonic}
              showEnharmonics={harmonyShowEnharmonics}
              showSeparators={harmonyShowSeparators}
              showLegend={harmonyShowLegend}
              showExplanation={harmonyShowExplanation}
              explanation={harmonyExplanation}
              showToneTooltips={harmonyShowToneTooltips}
              showNoteRing={harmonyShowNoteRing}
              colorByFamily={harmonyColorByFamily}
              diameter={harmonyDiameter}
              fontSize={harmonyFontSize}
              playbackStyle={harmonyPlaybackStyle}
              voicingStyle={harmonyVoicingStyle}
              svgRef={harmonySvgRef}
              focusedReferenceRootPc={harmonyFocusedReferenceRootPc}
              onPlayChord={playHarmonyChord}
              onPlayNote={playHarmonyNote}
              onChordActivated={handleHarmonyChordActivated}
              onPlayRelationship={playHarmonyChordRelationship}
              onSelectionChange={setHarmonySelection}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
