/**
 * Start-of-transport orchestration. Both commands are deliberately synchronous:
 * cancel the other player and clear prior audio before scheduling new events.
 * React owns the state and refs; this module owns only the historically ordered
 * side effects. Do not rearrange the calls without checking playback regressions.
 */
export interface AbcStartPorts {
  eventCount: number;
  startBeat: number;
  clearTimers(): void;
  stopBassPattern(): void;
  stopSound(): void;
  clearProgressionButtons(): void;
  setScaleFinderActive(value: false): void;
  setChordFinderActive(value: false): void;
  setStradellaFinderActive(value: false): void;
  setPlaybackState(value: "playing"): void;
  setPosition(beat: number): void;
  startedAtRef: { current: number | null };
  startBeatRef: { current: number };
  nowMs(): number;
  schedule(): void;
}

export function startAbcTransport(ports: AbcStartPorts): boolean {
  if (ports.eventCount === 0) return false;
  ports.clearTimers();
  ports.stopBassPattern();
  ports.stopSound();
  ports.clearProgressionButtons();
  ports.setScaleFinderActive(false);
  ports.setChordFinderActive(false);
  ports.setStradellaFinderActive(false);
  ports.setPlaybackState("playing");
  ports.setPosition(ports.startBeat);
  ports.startedAtRef.current = ports.nowMs();
  ports.startBeatRef.current = ports.startBeat;
  ports.schedule();
  return true;
}

export interface BassPatternStartPorts {
  eventCount: number;
  runRef: { current: number };
  clearTimers(): void;
  stopAbc(): void;
  clearActiveButtons(): void;
  stopSound(): void;
  setScaleFinderActive(value: false): void;
  setChordFinderActive(value: false): void;
  setStradellaFinderActive(value: false): void;
  setPlaybackState(value: "playing"): void;
  schedule(runId: number): void;
}

export function startBassPatternTransport(ports: BassPatternStartPorts): boolean {
  if (ports.eventCount === 0) return false;
  // Invalidate any prior loop before removing its timers and clearing audio.
  ports.runRef.current += 1;
  const runId = ports.runRef.current;
  ports.clearTimers();
  ports.stopAbc();
  ports.clearActiveButtons();
  ports.stopSound();
  ports.setScaleFinderActive(false);
  ports.setChordFinderActive(false);
  ports.setStradellaFinderActive(false);
  ports.setPlaybackState("playing");
  ports.schedule(runId);
  return true;
}
