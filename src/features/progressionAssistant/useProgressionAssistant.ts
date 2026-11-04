import { useEffect, useMemo, useRef, useState } from "react";
import type { AccidentalMode, BassCount } from "../../types";
import type { FinderChordPattern } from "../../types";
import type { HarmonyProgressionChord, HarmonyRecordedEvent } from "../../tools/harmonyExplorer/progression";
import { optimizeStradellaProgression, progressionRealizationsForChord, progressionRealizationKey } from "../../tools/harmonyExplorer/progression";
import type { ProgressionRhythmPattern } from "../../sound";
import { generateStradella } from "../../stradella";
import { progressionNoteStep } from "./progressionNoteSelection";

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
  const [harmonyProgressionManualPattern, setHarmonyProgressionManualPattern] = useState<FinderChordPattern>("major-triad");
  const [harmonyProgressionAllowApproximations, setHarmonyProgressionAllowApproximations] = useState(true);
  const [harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight] = useState(0.65);
  const [harmonyProgressionVoiceLeadingWeight, setHarmonyProgressionVoiceLeadingWeight] = useState(0.35);
  const [harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern] = useState<ProgressionRhythmPattern>("block");
  const [harmonyProgressionRealizationKeys, setHarmonyProgressionRealizationKeys] = useState<Record<string, string>>({});
  const [harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex] = useState<number | null>(null);
  // The eye owns one optional chord identity, independently of transport position.
  const [harmonyProgressionNoteStepId, setHarmonyProgressionNoteStepId] = useState<string | null>(null);
  const [harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds] = useState<string[]>([]);
  const [harmonyProgressionPulseSilent, setHarmonyProgressionPulseSilent] = useState(false);
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
    harmonyProgressionManualPattern, setHarmonyProgressionManualPattern,
    harmonyProgressionAllowApproximations, setHarmonyProgressionAllowApproximations,
    harmonyProgressionHandMovementWeight, setHarmonyProgressionHandMovementWeight,
    harmonyProgressionVoiceLeadingWeight, setHarmonyProgressionVoiceLeadingWeight,
    harmonyProgressionRhythmPattern, setHarmonyProgressionRhythmPattern,
    harmonyProgressionRealizationKeys, setHarmonyProgressionRealizationKeys,
    harmonyProgressionPreviewIndex, setHarmonyProgressionPreviewIndex,
    harmonyProgressionNoteStepId, setHarmonyProgressionNoteStepId,
    harmonyProgressionActiveButtonIds, setHarmonyProgressionActiveButtonIds,
    harmonyProgressionPulseSilent, setHarmonyProgressionPulseSilent,
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
  harmonyProgression,
  harmonyProgressionHandMovementWeight, harmonyProgressionVoiceLeadingWeight, harmonyProgressionRealizationKeys, harmonyProgressionPreviewIndex, harmonyProgressionNoteStepId,
  setHarmonyProgressionRealizationKeys, setHarmonyProgressionPreviewIndex, setHarmonyProgressionNoteStepId, harmonyProgressionActiveButtonIds, harmonyProgressionPulseSilent,
  activeToolSection,
}: Pick<ReturnType<typeof useHarmonyProgressionState>,
  "harmonyProgression" |
  "harmonyProgressionHandMovementWeight" | "harmonyProgressionVoiceLeadingWeight" | "harmonyProgressionRealizationKeys" | "setHarmonyProgressionRealizationKeys" | "harmonyProgressionPreviewIndex" |
  "setHarmonyProgressionPreviewIndex" | "harmonyProgressionNoteStepId" | "setHarmonyProgressionNoteStepId" | "harmonyProgressionActiveButtonIds" | "harmonyProgressionPulseSilent"
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

  const harmonyProgressionRealizationOptions = useMemo(() => Object.fromEntries(
    harmonyProgression.map((chord) => [
      chord.id,
      progressionRealizationsForChord(
        harmonyProgressionStradellaButtons, chord, true,
      ),
    ]),
  ), [harmonyProgression, harmonyProgressionStradellaButtons]);

  // Removing a chord or changing physical layouts may
  // invalidate a pinned recipe. Return only that step to Auto, never silently
  // pin an unrelated recipe at the same original rank.
  useEffect(() => {
    const valid = new Set(Object.entries(harmonyProgressionRealizationOptions)
      .flatMap(([id, options]) => options.map(({ result }) => `${id}\n${progressionRealizationKey(result)}`)));
    const existing = Object.entries(harmonyProgressionRealizationKeys);
    if (existing.every(([id, key]) => valid.has(`${id}\n${key}`))) return;
    const next = Object.fromEntries(existing.filter(([id, key]) => valid.has(`${id}\n${key}`)));
    setHarmonyProgressionRealizationKeys(next);
  }, [harmonyProgressionRealizationKeys, harmonyProgressionRealizationOptions, setHarmonyProgressionRealizationKeys]);

  const validPinnedKeys = useMemo(() => Object.fromEntries(
    Object.entries(harmonyProgressionRealizationKeys).filter(([id, key]) =>
      (harmonyProgressionRealizationOptions[id] ?? []).some(({ result }) => progressionRealizationKey(result) === key)),
  ), [harmonyProgressionRealizationKeys, harmonyProgressionRealizationOptions]);

  const harmonyProgressionPlan = useMemo(
    () => optimizeStradellaProgression(
      harmonyProgressionStradellaButtons,
      harmonyProgression,
      {
        allowApproximations: true,
        handMovementWeight: harmonyProgressionHandMovementWeight,
        voiceLeadingWeight: harmonyProgressionVoiceLeadingWeight,
        maxRealizationsPerChord: 5,
        fixedRealizationKeys: validPinnedKeys,
      },
    ),
    [
      harmonyProgressionStradellaButtons,
      harmonyProgression,
      harmonyProgressionHandMovementWeight,
      harmonyProgressionVoiceLeadingWeight,
      validPinnedKeys,
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
  // Reordering never changes which chord the eye refers to; deleting it clears
  // only that presentation selection. No JSON setting is added.
  useEffect(() => {
    if (harmonyProgressionNoteStepId && !harmonyProgression.some((chord) => chord.id === harmonyProgressionNoteStepId)) {
      setHarmonyProgressionNoteStepId(null);
    }
  }, [harmonyProgression, harmonyProgressionNoteStepId, setHarmonyProgressionNoteStepId]);

  const harmonyProgressionNoteStep = progressionNoteStep(harmonyProgressionPlan, harmonyProgressionNoteStepId);
  const progressionPreviewButtonIds = useMemo(() => {
    if (
      activeToolSection !== "progressionAssistant" ||
      (harmonyProgressionPreviewIndex === null && !harmonyProgressionNoteStep) ||
      (harmonyProgressionActiveButtonIds.length > 0 || harmonyProgressionPulseSilent) ||
      !harmonyProgressionPlan.playable
    ) {
      return new Set<string>();
    }
    const step = harmonyProgressionNoteStep ?? harmonyProgressionPlan.steps[harmonyProgressionPreviewIndex ?? -1];
    return new Set((step?.result.playbackButtons ?? []).map((button) => button.id));
  }, [
    activeToolSection,
    harmonyProgressionPreviewIndex, harmonyProgressionNoteStep,
    harmonyProgressionActiveButtonIds.length, harmonyProgressionPulseSilent,
    harmonyProgressionPlan,
  ]);



  const harmonyProgressionActiveButtonIdSet = useMemo(
    () => new Set(harmonyProgressionActiveButtonIds),
    [harmonyProgressionActiveButtonIds],
  );
  return {
    harmonyProgressionStradellaButtons, harmonyProgressionPlan,
    harmonyProgressionRealizationOptions, harmonyProgressionNoteStep,
    progressionPreviewButtonIds, harmonyProgressionActiveButtonIdSet,
  };
}
