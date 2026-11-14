import { lazy, Suspense } from "react";
import { harmonyRelatedDisplayName } from "../../i18n/diagramLabels";
import type { AppControllerModel } from "../useAppController";

type WorkspaceModel = AppControllerModel["workspace"];

const HarmonicCircle = lazy(() =>
  import("../../tools/harmonyExplorer/components/HarmonicCircle").then((module) => ({
    default: module.HarmonicCircle,
  })),
);

/** The Harmony workspace: the harmonic circle, or why nothing is drawn. */
export function HarmonyWorkspace({ model }: { model: WorkspaceModel }) {
  const {
    chordDisplayStyle,
    handleHarmonyChordActivated,
    harmonyAllFamiliesMode,
    harmonyAvailableCounts,
    harmonyColorByFamily,
    harmonyCounts,
    harmonyDiameter,
    harmonyEffectiveDiatonicOnly,
    harmonyEffectiveHighlightDiatonic,
    harmonyExplanation,
    harmonyFocusedReferenceRootPc,
    harmonyFontSize,
    harmonyPlaybackStyle,
    harmonyReferenceFamilyId,
    harmonyRelatedFamilyId,
    harmonyRelatedName,
    harmonyScaleId,
    harmonySectors,
    harmonyShowEnharmonics,
    harmonyShowExplanation,
    harmonyShowLegend,
    harmonyShowNoteRing,
    harmonyShowSeparators,
    harmonyShowToneTooltips,
    harmonySvgRef,
    harmonyVoicingStyle,
    language,
    playHarmonyChord,
    playHarmonyChordRelationship,
    playHarmonyNote,
    setHarmonySelection,
    t,
  } = model;
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
