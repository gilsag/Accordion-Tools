/**
 * Cross-feature navigation effects, intentionally independent of React state,
 * musical algorithms, the Stradella instrument model, and sound implementation.
 * Callers construct musical payloads before invoking these commands. Order is
 * part of the compatibility contract: navigation, resets, then audio stops.
 */
export interface ProgressionDestination {
  navigate(): void;
  clearPreview(): void;
  disableStradellaFinder(): void;
  disableScaleFinder(): void;
  disableTrebleChordFinder(): void;
  stopAbc(): void;
  stopBassPattern(): void;
}

/** Preview changes retain their selected step and do not stop Bass Pattern
 * playback; recorded/selected chord transfers clear the preview and stop it. */
export function enterProgressionAssistant(
  actions: ProgressionDestination,
  mode: "transfer" | "preview",
): void {
  actions.navigate();
  if (mode === "transfer") actions.clearPreview();
  actions.disableStradellaFinder();
  actions.disableScaleFinder();
  actions.disableTrebleChordFinder();
  actions.stopAbc();
  if (mode === "transfer") actions.stopBassPattern();
}

export interface StradellaFinderDestination {
  navigate(): void;
  assignChord(): void;
  resetRealization(): void;
  enableFinder(): void;
  disableScaleFinder(): void;
  disableTrebleChordFinder(): void;
  stopAbc(): void;
}

/** The original chord-to-Finder and progression-step-to-Finder transfers differ
 * only in whether they reset the realization index. Progression-step transfers
 * preserve the pending sorted playback-button identity for matching. */
export function enterStradellaFinder(
  actions: StradellaFinderDestination,
  mode: "harmony-selection" | "progression-step",
): void {
  actions.navigate();
  actions.assignChord();
  if (mode === "harmony-selection") actions.resetRealization();
  actions.enableFinder();
  actions.disableScaleFinder();
  actions.disableTrebleChordFinder();
  actions.stopAbc();
}

export interface HarmonyDestination {
  navigate(): void;
  stopAllSound(): void;
  stopAbc(): void;
  stopBassPattern(): void;
}

export function enterHarmonyExplorer(actions: HarmonyDestination): void {
  actions.navigate();
  actions.stopAllSound();
  actions.stopAbc();
  actions.stopBassPattern();
}
