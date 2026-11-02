/** React-independent transport commands. These retain the historical order of
 * timer cancellation, state changes, highlighted buttons and sound teardown.
 * Scheduling and the audio engine remain owned by their existing services.
 */
export interface AbcStopPorts {
  clearTimers(): void;
  setState(value: "stopped"): void;
  setPosition(beat: number): void;
  setActiveButtons(ids: string[]): void;
  startedAtRef: { current: number | null };
  stopSound(): void;
}

export function stopAbcTransport(ports: AbcStopPorts) {
  ports.clearTimers();
  ports.setState("stopped");
  ports.setPosition(0);
  ports.setActiveButtons([]);
  ports.startedAtRef.current = null;
  ports.stopSound();
}

export interface AbcPausePorts {
  playbackState: string;
  startedAt: number | null;
  startingBeat: number;
  tempoBpm: number;
  totalBeats: number;
  nowMs(): number;
  setPosition(beat: number): void;
  setState(value: "paused"): void;
  setActiveButtons(ids: string[]): void;
  clearTimers(): void;
  stopBassPattern(): void;
  stopSound(): void;
  clearProgressionButtons(): void;
}

export function pauseAbcTransport(ports: AbcPausePorts) {
  if (ports.playbackState !== "playing") return;
  const elapsedBeats = ports.startedAt === null
    ? 0
    : ((ports.nowMs() - ports.startedAt) / 1000) * (ports.tempoBpm / 60);
  ports.setPosition(Math.min(ports.totalBeats, ports.startingBeat + elapsedBeats));
  ports.setState("paused");
  ports.setActiveButtons([]);
  ports.clearTimers();
  ports.stopBassPattern();
  ports.stopSound();
  ports.clearProgressionButtons();
}

export interface BassStopPorts {
  runRef: { current: number };
  clearTimers(): void;
  setState(value: "stopped"): void;
  setActiveButtons(ids: string[]): void;
  stopSound(): void;
}

export function stopBassPatternTransport(ports: BassStopPorts) {
  ports.runRef.current += 1; // Invalidate previously scheduled loop callbacks.
  ports.clearTimers();
  ports.setState("stopped");
  ports.setActiveButtons([]);
  ports.stopSound();
}
