import { ROOT_POSITION_BASS } from "../tools/stradellaChordFinder/harmonicIdentity";
import { DEFAULT_STRADELLA_NOTE_LEVELS, type StradellaNoteLevels } from "../tools/stradellaChordFinder/diagramAnnotations";
import type { FinderChordPattern, StradellaChordFinderMode, Overlay, SequenceStep, TextNote } from "../types";
import type { MinimumNominalGap } from "../tools/stradellaChordFinder/voicingDensity";

/** Narrow reset ports: all affected state remains owned by its feature.
 * The explicit calls (not a generic settings reset) preserve the original
 * reset scope, values and order. Sound/instrument/global preferences survive.
 */
export interface StradellaFinderResetPorts {
  setRoot(value: string): void;
  setPattern(value: FinderChordPattern): void;
  setMode(value: StradellaChordFinderMode): void;
  setRequestedBass(value: string | null): void;
  setRealizationIndex(value: number): void;
  setMaxButtons(value: number): void;
  setSpanColumns(value: number): void;
  setMinimumNominalGap(value: MinimumNominalGap): void;
  setMarkRootBass(value: boolean): void;
  setShowRealizationNote(value: boolean): void;
  setShowVoicingIntervals(value: boolean): void;
  setNoteLevels(value: StradellaNoteLevels): void;
  setExplanationFontSize(value: number): void;
}

export function resetStradellaFinder(ports: StradellaFinderResetPorts) {
  ports.setRoot("C");
  ports.setPattern("major-triad");
  ports.setMode("bass-and-chords");
  ports.setRequestedBass(ROOT_POSITION_BASS);
  ports.setRealizationIndex(0);
  ports.setMaxButtons(3);
  ports.setSpanColumns(4.3);
  ports.setMinimumNominalGap(0);
  ports.setMarkRootBass(true);
  ports.setShowRealizationNote(true);
  ports.setShowVoicingIntervals(true);
  ports.setNoteLevels({ ...DEFAULT_STRADELLA_NOTE_LEVELS });
  ports.setExplanationFontSize(26);
}

export interface DiagramWorkResetPorts {
  setOverlays(value: Record<string, Overlay>): void;
  setSequenceSteps(value: SequenceStep[]): void;
  setRecording(value: boolean): void;
  setApplyingFingering(value: boolean): void;
  setTextNotes(value: TextNote[]): void;
  setScaleFinderActive(value: boolean): void;
  setChordFinderActive(value: boolean): void;
  setStradellaChordFinderActive(value: boolean): void;
  setProgressionPreview(value: number | null): void;
  stopAbc(): void;
  stopBassPattern(): void;
  stopSound(): void;
  setProgressionActiveButtons(value: string[]): void;
}

export function resetDiagramWorkState(ports: DiagramWorkResetPorts) {
  ports.setOverlays({});
  ports.setSequenceSteps([]);
  ports.setRecording(false);
  ports.setApplyingFingering(false);
  ports.setTextNotes([]);
  ports.setScaleFinderActive(false);
  ports.setChordFinderActive(false);
  ports.setStradellaChordFinderActive(false);
  ports.setProgressionPreview(null);
  ports.stopAbc();
  ports.stopBassPattern();
  ports.stopSound();
  ports.setProgressionActiveButtons([]);
}
