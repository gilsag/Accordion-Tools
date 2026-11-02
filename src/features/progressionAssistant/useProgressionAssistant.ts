import { useEffect, useMemo, useRef, useState } from "react";
import type { AccidentalMode, BassCount } from "../../types";
import type { ChordFamilyId } from "../../tools/harmonyExplorer/music";
import type { HarmonyProgressionChord, HarmonyRecordedEvent } from "../../tools/harmonyExplorer/progression";
import { optimizeStradellaProgression } from "../../tools/harmonyExplorer/progression";
import type { ProgressionRhythmPattern } from "../../sound";
import { generateStradella } from "../../stradella";

/** Owns the editable/recorded progression and preview state. The monotonic ID
 * counter must survive renders; imported settings only modify the optimization
 * preferences, not recorded events or the counter. Audio scheduling is shared.
 */
export function useHarmonyProgressionState() {
  const [harmonyProgression, setHarmonyProgression] = useState<HarmonyProgressionChord[]>([]);
  const [harmonyRecordedProgression, setHarmonyRecordedProgression] = useState<HarmonyRecordedEvent[]>([]);
  const [harmonyProgressionRecording, setHarmonyProgressionRecording] = useState(false);
  const [harmonyRecordedNotationVisible, setHarmonyRecordedNotationVisible] = useState(false);
  const [harmonyRecordedProgressionPlaying, setHarmonyRecordedProgressionPlaying] = useState(false);
  const harmonyRecordedPlaybackTimeoutsRef = useRef<number[]>([]);
  const harmonyRecordedNotationRef = useRef<HTMLDivElement | null>(null);
  const [harmonyProgressionManualRoot, setHarmonyProgressionManualRoot] = useState("C");
  const [harmonyProgressionManualFamilyId, setHarmonyProgressionManualFamilyId] = useState<ChordFamilyId>("major");
  const [harmonyProgressionAllowApproximations, setHarmonyProgressionAllowApproximations] = useState(true);
  const [harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight] = useState(0.65);
  const [harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern] = useState<ProgressionRhythmPattern>("block");
  const [harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex] = useState<number | null>(null);
  const [harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds] = useState<string[]>([]);
  const [harmonyProgressionNotationVisible, setHarmonyProgressionNotationVisible] = useState(false);
  const harmonyProgressionIdRef = useRef(1);
  const harmonyProgressionNotationRef = useRef<HTMLDivElement | null>(null);
  return {
    harmonyProgression, setHarmonyProgression,
    harmonyRecordedProgression, setHarmonyRecordedProgression,
    harmonyProgressionRecording, setHarmonyProgressionRecording,
    harmonyRecordedNotationVisible, setHarmonyRecordedNotationVisible,
    harmonyRecordedProgressionPlaying, setHarmonyRecordedProgressionPlaying,
    harmonyProgressionManualRoot, setHarmonyProgressionManualRoot,
    harmonyProgressionManualFamilyId, setHarmonyProgressionManualFamilyId,
    harmonyProgressionAllowApproximations, setHarmonyProgressionAllowApproximations,
    harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight,
    harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern,
    harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex,
    harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds,
    harmonyProgressionNotationVisible, setHarmonyProgressionNotationVisible,
    harmonyRecordedPlaybackTimeoutsRef, harmonyRecordedNotationRef,
    harmonyProgressionIdRef, harmonyProgressionNotationRef,
  };
}

/** Optimization always uses a generated Stradella manual even if the workspace
 * currently displays treble or Harmony. The original physical button identity,
 * ranked realization and note/playback distinction are not rewritten here.
 */
export function useHarmonyProgressionResults({
  basses, buttonSize, spacing, stradellaAccidental, diagramVerticalSpacing,
  harmonyProgression, harmonyProgressionAllowApproximations,
  harmonyProgressionHandMovementWeight, harmonyProgressionPreviewIndex,
  setHarmonyProgressionPreviewIndex, harmonyProgressionActiveButtonIds,
  activeToolSection,
}: Pick<ReturnType<typeof useHarmonyProgressionState>,
  "harmonyProgression" | "harmonyProgressionAllowApproximations" |
  "harmonyProgressionHandMovementWeight" | "harmonyProgressionPreviewIndex" |
  "setHarmonyProgressionPreviewIndex" | "harmonyProgressionActiveButtonIds"
> & {
  basses: BassCount; buttonSize: number; spacing: number;
  stradellaAccidental: AccidentalMode; diagramVerticalSpacing: number;
  activeToolSection: string | null;
}) {
  /* Harmony progression optimization always targets the Stradella manual, even
     while the Harmony workspace is visible or the treble side was last active. */
  const harmonyProgressionStradellaButtons = useMemo(
    () => generateStradella(
      basses,
      buttonSize,
      spacing,
      stradellaAccidental,
      diagramVerticalSpacing,
    ),
    [basses, buttonSize, spacing, stradellaAccidental, diagramVerticalSpacing],
  );

  const harmonyProgressionPlan = useMemo(
    () => optimizeStradellaProgression(
      harmonyProgressionStradellaButtons,
      harmonyProgression,
      {
        allowApproximations: harmonyProgressionAllowApproximations,
        handMovementWeight: harmonyProgressionHandMovementWeight,
        maxRealizationsPerChord: 5,
      },
    ),
    [
      harmonyProgressionStradellaButtons,
      harmonyProgression,
      harmonyProgressionAllowApproximations,
      harmonyProgressionHandMovementWeight,
    ],
  );

  useEffect(() => {
    if (!harmonyProgressionPlan.playable) {
      setHarmonyProgressionPreviewIndex(null);
      return;
    }
    setHarmonyProgressionPreviewIndex((current) =>
      current !== null && current >= harmonyProgressionPlan.steps.length ? null : current,
    );
  }, [harmonyProgressionPlan.playable, harmonyProgressionPlan.steps.length, setHarmonyProgressionPreviewIndex]);
  const progressionPreviewButtonIds = useMemo(() => {
    if (
      activeToolSection !== "progressionAssistant" ||
      harmonyProgressionPreviewIndex === null ||
      harmonyProgressionActiveButtonIds.length > 0 ||
      !harmonyProgressionPlan.playable
    ) {
      return new Set<string>();
    }
    const step = harmonyProgressionPlan.steps[harmonyProgressionPreviewIndex];
    return new Set((step?.result.playbackButtons ?? []).map((button) => button.id));
  }, [
    activeToolSection,
    harmonyProgressionPreviewIndex,
    harmonyProgressionActiveButtonIds.length,
    harmonyProgressionPlan,
  ]);



  const harmonyProgressionActiveButtonIdSet = useMemo(
    () => new Set(harmonyProgressionActiveButtonIds),
    [harmonyProgressionActiveButtonIds],
  );
  return {
    harmonyProgressionStradellaButtons, harmonyProgressionPlan,
    progressionPreviewButtonIds, harmonyProgressionActiveButtonIdSet,
  };
}
