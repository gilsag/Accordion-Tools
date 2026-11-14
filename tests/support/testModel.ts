/** The flat command-and-state view the app tests use, assembled from the
 * platform and tool contexts. Tests read and call `model.tools.*`,
 * `model.workspace.*` and `model.settings.*`; all three are the same object,
 * so a test reads a value or calls a command by its owner's own name. */
import { useAbcPlayer, useAbcPlayerOutput } from "../../src/features/abcPlayer/abcPlayerContext";
import {
  useAnnotateDiagram,
  useAnnotateDiagramOutput,
} from "../../src/features/annotateDiagram/annotateDiagramContext";
import {
  useBassPatternPlayer,
  useBassPatternPlayerOutput,
} from "../../src/features/bassPatternPlayer/bassPatternPlayerContext";
import {
  useHarmonyExplorer,
  useHarmonyExplorerOutput,
} from "../../src/features/harmonyExplorer/harmonyExplorerContext";
import {
  useProgressionAssistant,
  useProgressionAssistantOutput,
} from "../../src/features/progressionAssistant/progressionAssistantContext";
import { useRhythmTrainer } from "../../src/features/rhythmTrainer/rhythmTrainerContext";
import {
  useScaleFinder,
  useScaleFinderOutput,
} from "../../src/features/scaleFinder/scaleFinderContext";
import {
  useStradellaChordFinder,
  useStradellaChordFinderOutput,
} from "../../src/features/stradellaChordFinder/stradellaChordFinderContext";
import {
  useTrebleChordFinder,
  useTrebleChordFinderOutput,
} from "../../src/features/trebleChordFinder/trebleChordFinderContext";
import { useCrossToolActions } from "../../src/app/crossTool/crossToolContext";
import { useDiagramButtons } from "../../src/app/diagram/diagramButtonsContext";
import { useDiagramModel } from "../../src/app/diagram/useDiagramModel";
import {
  usePlatformAppearance,
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformNotation,
  usePlatformShell,
  usePlatformSound,
  usePlatformSpelling,
  usePlatformTools,
} from "../../src/app/platform/platformContexts";
import { useInstrumentPresets } from "../../src/app/platform/useInstrumentPresets";

export function useTestModel() {
  const tools = usePlatformTools();
  const annotate = useAnnotateDiagram();
  const diagram = useDiagramModel();
  const model = {
    ...usePlatformLanguage(),
    ...usePlatformInstrument(),
    ...usePlatformAppearance(),
    ...usePlatformSpelling(),
    ...usePlatformSound(),
    ...usePlatformNotation(),
    ...usePlatformNavigation(),
    ...usePlatformShell(),
    ...useInstrumentPresets(),
    ...useScaleFinder(),
    ...useScaleFinderOutput(),
    ...useTrebleChordFinder(),
    ...useTrebleChordFinderOutput(),
    ...useStradellaChordFinder(),
    ...useStradellaChordFinderOutput(),
    ...annotate.overlays,
    ...annotate.sequence,
    ...annotate.annotations,
    toggleSequenceNotation: annotate.toggleSequenceNotation,
    ...useAnnotateDiagramOutput(),
    ...useAbcPlayer(),
    ...useAbcPlayerOutput(),
    ...useBassPatternPlayer(),
    ...useBassPatternPlayerOutput(),
    ...useHarmonyExplorer(),
    ...useHarmonyExplorerOutput(),
    ...useProgressionAssistant(),
    ...useProgressionAssistantOutput(),
    ...useCrossToolActions(),
    rhythmTrainer: useRhythmTrainer(),
    buttons: useDiagramButtons().buttons,
    toggleButton: diagram.toggleButton,
    toggleToolSection: tools.toggleTool,
    resetCurrentToolDefaults: tools.resetTool,
    stopSoundPlayback: tools.stopAllPlayback,
    resetDiagramWork: () => tools.resetWork("accordion"),
    clearHarmonyWork: () => tools.resetWork("harmony"),
  };
  return { ...model, tools: model, workspace: model, settings: model };
}

export type TestModel = ReturnType<typeof useTestModel>;
