import type { StradellaFooter } from "../../app/diagram/diagramContributions";
import type { PlatformLanguage } from "../../app/platform/platformContexts";
import { chordToneName } from "./engine/chordSpelling";
import type { StradellaNoteLevels } from "./engine/diagramAnnotations";
import {
  analyzeConfiguredStradellaVoicing,
  type StradellaRegisterModel,
} from "./engine/registerModel";
import { voicingIntervalLayout } from "./engine/voicingIntervalLayout";
import type { DiagramButton, FinderChordPattern } from "../../types";

/** The one diagram-note pipeline, for the Stradella Chord Finder's
 * realization and the Progression Assistant's eye-selected step: the
 * explanation's enabled lines, and the registral voicing as a chart when the
 * Finder's settings ask for it and it has two or more notes. The voicing is
 * analysed from the played buttons, never from guide markers. */
export function stradellaFooter(input: {
  lines: string[];
  playbackButtons: DiagramButton[];
  root: string;
  pattern: FinderChordPattern;
  registerModel: StradellaRegisterModel;
  /** The Stradella Chord Finder's presentation settings. */
  showStradellaVoicingIntervals: boolean;
  stradellaNoteLevels: StradellaNoteLevels;
  finderExplanationFontSize: number;
  t: PlatformLanguage["t"];
}): StradellaFooter | null {
  const { lines, root, pattern, t, finderExplanationFontSize: fontSize } = input;
  if (lines.length === 0) return null;
  const labels = {
    identity: `${t("analysis.harmonicIdentity")}:`,
    pitchClasses: `${t("analysis.pitchClassRealization")}:`,
    voicing: `${t("analysis.registralVoicing")}:`,
    physical: `${t("analysis.physicalRealization")}:`,
  } satisfies Record<keyof StradellaNoteLevels, string>;
  const levelForLine = (line: string): keyof StradellaNoteLevels | null =>
    (Object.entries(labels).find(([, prefix]) => line.startsWith(prefix))?.[0] as
      keyof StradellaNoteLevels | undefined) ?? null;
  const analysis =
    input.showStradellaVoicingIntervals && input.stradellaNoteLevels.voicing
      ? analyzeConfiguredStradellaVoicing(input.playbackButtons, root, input.registerModel)
      : null;
  const layout = analysis
    ? voicingIntervalLayout(analysis.notes, {
        fontSize,
        displayLabel: (note, count) =>
          `${chordToneName(root, pattern, note.pitchClass)}${note.octave}${count > 1 ? ` ×${count}` : ""}`,
      })
    : null;
  return {
    kind: "stradella",
    lines,
    fontSize,
    levelForLine,
    voicing:
      analysis && layout && layout.positions.length >= 2
        ? { notes: analysis.notes, height: layout.metrics.height }
        : null,
    root,
    pattern,
  };
}
