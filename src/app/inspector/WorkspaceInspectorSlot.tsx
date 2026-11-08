import { lazy, Suspense } from "react";
import type { AppControllerModel } from "../useAppController";
import type { WorkspaceInspectorId } from "./inspectorSelection";
// Small, and it owns the notation host element, so it is not lazy.
import { AbcNotationInspector } from "./AbcNotationInspector";

// The slot is shared; loading and inputs stay feature-specific. Do not eagerly
// import a future tool's inspector or copy its selection into local state.
const StradellaResultsInspector = lazy(() => import("./StradellaResultsInspector")
  .then((module) => ({ default: module.StradellaResultsInspector })));

const ProgressionResultsInspector = lazy(() => import("./ProgressionResultsInspector")
  .then((module) => ({ default: module.ProgressionResultsInspector })));

export function WorkspaceInspectorSlot({ inspector, tools, blocked = false }: {
  inspector: WorkspaceInspectorId;
  tools: AppControllerModel["tools"];
  blocked?: boolean;
}) {
  if (inspector === "abcNotation") return <AbcNotationInspector blocked={blocked}
    abcText={tools.abcText} title={tools.abcParseResult.title} renderNotationInto={tools.renderNotationInto} />;
  return <Suspense fallback={<aside className="workspace-inspector" aria-busy="true" inert={blocked} />}>
    {inspector === "progressionAssistant" && <ProgressionResultsInspector
      blocked={blocked}
      plan={tools.harmonyProgressionPlan}
      hasProgression={tools.harmonyProgression.length > 0}
      previewIndex={tools.harmonyProgressionPreviewIndex}
      onPreviewStep={tools.previewHarmonyProgressionStepOnStradella}
    />}
    {inspector === "stradellaChordFinder" && <StradellaResultsInspector
      blocked={blocked}
      root={tools.stradellaChordFinderRoot}
      pattern={tools.stradellaChordFinderPattern}
      requestedBass={tools.stradellaChordFinderEffectiveRequestedBass}
      mode={tools.stradellaChordFinderMode}
      selectedIndex={Math.min(tools.stradellaChordFinderRealizationIndex,
        Math.max(0, tools.stradellaChordFinderRealizations.length - 1))}
      onSelect={tools.setStradellaChordFinderRealizationIndex}
      realizations={tools.stradellaChordFinderRealizations}
      result={tools.stradellaChordFinderResult}
      registerModel={tools.stradellaRegisterModel}
      chordDisplayStyle={tools.chordDisplayStyle}
      formatPitches={tools.formatStradellaFinderPitches}
      formatText={tools.formatStradellaFinderText}
    />}
  </Suspense>;
}
