import { ROOT_POSITION_BASS } from "../features/stradellaChordFinder/engine/harmonicIdentity";
import {
  DEFAULT_STRADELLA_NOTE_LEVELS,
  type StradellaNoteLevels,
} from "../features/stradellaChordFinder/engine/diagramAnnotations";
import type { FinderChordPattern, StradellaChordFinderMode } from "../types";
import type { MinimumNominalGap } from "../features/stradellaChordFinder/engine/voicingDensity";

/** The Stradella Chord Finder's "Reset tool": its own preferences return to
 * their defaults through narrow ports, in a fixed order. Instrument, sound
 * and global preferences are untouched. "Reset work" is the tool
 * coordinator's (src/app/toolCoordinator.ts). */
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
