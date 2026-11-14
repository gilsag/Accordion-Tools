import { PROGRESSION_ARROWHEAD_ID } from "../../app/diagram/diagramMarkers";
import type { DiagramContribution } from "../../app/diagram/diagramContributions";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformSpelling,
} from "../../app/platform/platformContexts";
import { ProgressionPathLayer } from "../../diagram/components/ProgressionPathLayer";
import { pitchClassNameFromNumber } from "../harmonyExplorer/engine/integration";
import { progressionFinderPattern } from "./engine/progression";
import { realizationAnnotation } from "../stradellaChordFinder/engine/diagramAnnotations";
import { useStradellaChordFinder } from "../stradellaChordFinder/stradellaChordFinderContext";
import { stradellaFooter } from "../stradellaChordFinder/stradellaFooter";
import type {
  ProgressionAssistantOutput,
  ProgressionAssistantState,
} from "./progressionAssistantContext";

/** While the assistant is open on the Stradella side, an eye-selected step
 * titles the diagram and is explained below it (with the Chord Finder's note
 * settings), unless the plan is playing; the file keeps the automatic name.
 * The previewed and playing steps are lit, and the plan's path is drawn when
 * asked for. */
export function useProgressionDiagramContribution(
  state: ProgressionAssistantState,
  output: Pick<
    ProgressionAssistantOutput,
    | "harmonyProgressionNoteStep"
    | "harmonyProgressionPlan"
    | "progressionPreviewButtonIds"
    | "harmonyProgressionActiveButtonIdSet"
  >,
): DiagramContribution {
  const { t, language } = usePlatformLanguage();
  const { side, stradellaRegisterModel } = usePlatformInstrument();
  const { activeToolSection, workspaceMode } = usePlatformNavigation();
  const { chordDisplayStyle } = usePlatformSpelling();
  const { buttonSize } = usePlatformAppearance();
  const finder = useStradellaChordFinder();
  const open = side === "stradella" && activeToolSection === "progressionAssistant";
  const step = output.harmonyProgressionNoteStep;
  const pattern = step ? progressionFinderPattern(step.chord) : null;
  const root = step ? pitchClassNameFromNumber(step.chord.rootPc) : null;
  const annotation =
    open &&
    step &&
    pattern &&
    root &&
    state.harmonyProgressionActiveButtonIds.length === 0 &&
    !state.harmonyProgressionPulseSilent
      ? realizationAnnotation(
          root,
          pattern,
          step.result,
          stradellaRegisterModel,
          null,
          finder.stradellaNoteLevels,
          chordDisplayStyle,
          language,
        )
      : null;
  const plan = output.harmonyProgressionPlan;
  const showPath =
    workspaceMode === "accordion" && open && state.progressionPathVisible && plan.playable;
  return {
    note:
      annotation && step && root && pattern
        ? {
            title: annotation.title,
            filename: null,
            footer: stradellaFooter({
              lines: annotation.lines,
              playbackButtons: step.result.playbackButtons,
              root,
              pattern,
              registerModel: stradellaRegisterModel,
              showStradellaVoicingIntervals: finder.showStradellaVoicingIntervals,
              stradellaNoteLevels: finder.stradellaNoteLevels,
              finderExplanationFontSize: finder.finderExplanationFontSize,
              t,
            }),
          }
        : null,
    layers: {
      progressionPreviewButtonIds: output.progressionPreviewButtonIds,
      harmonyProgressionActiveButtonIdSet: output.harmonyProgressionActiveButtonIdSet,
    },
    overlay: showPath
      ? () => (
          <ProgressionPathLayer
            steps={plan.steps.map((planStep) => planStep.result.playbackButtons)}
            buttonSize={buttonSize}
            arrowheadMarkerId={PROGRESSION_ARROWHEAD_ID}
          />
        )
      : undefined,
  };
}
