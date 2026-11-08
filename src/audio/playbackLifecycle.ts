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
  /** Buttons to keep lit at the paused beat (see lastPlayedAbcButtonIds). */
  buttonsAtPosition?(beat: number): string[];
}

/**
 * The buttons a pause leaves lit: for each voice, the last event that started
 * at or before `beat` (all its buttons). With both hands this is the last
 * melody note and the last bass or chord, even if a short note had already
 * been released when Pause was pressed.
 */
export function lastPlayedAbcButtonIds(
  events: ReadonlyArray<{ startBeat: number; voiceId?: string; buttons: ReadonlyArray<{ id: string }> }>,
  beat: number,
): string[] {
  const latest = new Map<string, number>();
  for (const event of events) {
    if (event.buttons.length === 0 || event.startBeat > beat + 1e-6) continue;
    const voice = event.voiceId ?? "";
    latest.set(voice, Math.max(latest.get(voice) ?? -Infinity, event.startBeat));
  }
  const ids: string[] = [];
  for (const event of events) {
    if (event.buttons.length === 0 || latest.get(event.voiceId ?? "") !== event.startBeat) continue;
    for (const button of event.buttons) if (!ids.includes(button.id)) ids.push(button.id);
  }
  return ids;
}

export function pauseAbcTransport(ports: AbcPausePorts) {
  if (ports.playbackState !== "playing") return;
  const elapsedBeats = ports.startedAt === null
    ? 0
    : ((ports.nowMs() - ports.startedAt) / 1000) * (ports.tempoBpm / 60);
  const position = Math.min(ports.totalBeats, ports.startingBeat + elapsedBeats);
  ports.setPosition(position);
  ports.setState("paused");
  ports.setActiveButtons(ports.buttonsAtPosition?.(position) ?? []);
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
