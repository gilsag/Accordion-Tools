/** Shared state that many tools read and that is not any one tool's: the
 * settings registry, the interface language, the instrument, the diagram's appearance and spelling,
 * sound and notation preferences, navigation, shared playback state, the
 * application shell's state and the tool coordinator. Each part is owned by its
 * existing hook; `PlatformProviders` calls the hooks once and these contexts
 * hand the results to whoever reads them. See
 * docs/internal/controller-split-plan.md. */
import { createContext, useContext, type Context } from "react";
import type { useLanguageSettings } from "../../settings/useLanguageSettings";
import type { useInstrumentState } from "../../instrument/useInstrumentState";
import type { useDiagramAppearanceState } from "../../diagram/useDiagramAppearanceState";
import type { useMusicSpelling } from "../../diagram/useMusicSpelling";
import type { useSoundSettings } from "../../audio/useSoundSettings";
import type { useNotationSettings } from "../../notation/useNotationSettings";
import type { useWorkspaceNavigation } from "../useWorkspaceNavigation";
import type { SettingsRegistry } from "../../settings/settingsRegistry";
import type { usePlaybackState } from "./usePlaybackState";
import type { useShellState } from "./useShellState";
import type { ToolCoordinator } from "../toolCoordinator";
import type { ToolId, WorkspaceMode } from "../toolRegistry";

export type PlatformLanguage = ReturnType<typeof useLanguageSettings>;
export type PlatformInstrument = ReturnType<typeof useInstrumentState>;
export type PlatformAppearance = ReturnType<typeof useDiagramAppearanceState>;
export type PlatformSpelling = ReturnType<typeof useMusicSpelling>;
export type PlatformSound = ReturnType<typeof useSoundSettings>;
export type PlatformNotation = ReturnType<typeof useNotationSettings>;
export type PlatformNavigation = ReturnType<typeof useWorkspaceNavigation>;
export type PlatformPlayback = ReturnType<typeof usePlaybackState>;
export type PlatformShell = ReturnType<typeof useShellState>;
export interface PlatformTools {
  coordinator: ToolCoordinator;
  /** Opens or closes a tool's section, with its effects on the other tools. */
  toggleTool(section: ToolId): void;
  /** The Reset menu's "work" scope in the given workspace. */
  resetWork(workspace: WorkspaceMode): void;
  /** The Reset menu's "tool" scope: Harmony Explorer in the Harmony
   * workspace, otherwise the open tool if it is offered on this side. */
  resetTool(): void;
  /** Stop: every tool stops its playback, then all sound stops. */
  stopAllPlayback(): void;
}

export const PlatformSettingsContext = createContext<SettingsRegistry | null>(null);
export const PlatformLanguageContext = createContext<PlatformLanguage | null>(null);
export const PlatformInstrumentContext = createContext<PlatformInstrument | null>(null);
export const PlatformAppearanceContext = createContext<PlatformAppearance | null>(null);
export const PlatformSpellingContext = createContext<PlatformSpelling | null>(null);
export const PlatformSoundContext = createContext<PlatformSound | null>(null);
export const PlatformNotationContext = createContext<PlatformNotation | null>(null);
export const PlatformNavigationContext = createContext<PlatformNavigation | null>(null);
export const PlatformPlaybackContext = createContext<PlatformPlayback | null>(null);
export const PlatformToolsContext = createContext<PlatformTools | null>(null);
export const PlatformShellContext = createContext<PlatformShell | null>(null);

function usePlatformContext<T>(context: Context<T | null>, name: string): T {
  const value = useContext(context);
  if (value === null) throw new Error(`${name}() must be called inside <PlatformProviders>.`);
  return value;
}

/** The settings registry: owners register their settings with it, and
 * settings files, imports and the saved session read through it. */
export const usePlatformSettings = () =>
  usePlatformContext(PlatformSettingsContext, "usePlatformSettings");
/** Interface language preference, the language in use and `t()`. */
export const usePlatformLanguage = () =>
  usePlatformContext(PlatformLanguageContext, "usePlatformLanguage");
/** Side, physical layout and the Stradella register model. */
export const usePlatformInstrument = () =>
  usePlatformContext(PlatformInstrumentContext, "usePlatformInstrument");
/** Diagram geometry, display and title settings. */
export const usePlatformAppearance = () =>
  usePlatformContext(PlatformAppearanceContext, "usePlatformAppearance");
/** Note names, accidentals, chord-button labels and chord-symbol style. */
export const usePlatformSpelling = () =>
  usePlatformContext(PlatformSpellingContext, "usePlatformSpelling");
/** Sound preferences and the `SoundOptions` built from them. */
export const usePlatformSound = () => usePlatformContext(PlatformSoundContext, "usePlatformSound");
/** Staff-notation preferences shared by every score. */
export const usePlatformNotation = () =>
  usePlatformContext(PlatformNotationContext, "usePlatformNotation");
/** Workspace, panels and the open tool or settings section. */
export const usePlatformNavigation = () =>
  usePlatformContext(PlatformNavigationContext, "usePlatformNavigation");
/** The tool coordinator and the commands built on it. */
/** Interface density, download format, the phone's diagram view and the drawn diagrams. */
export const usePlatformShell = () => usePlatformContext(PlatformShellContext, "usePlatformShell");
export const usePlatformTools = () => usePlatformContext(PlatformToolsContext, "usePlatformTools");
/** Sample loading, the sound-engine player and starting once samples are ready. */
export const usePlatformPlayback = () =>
  usePlatformContext(PlatformPlaybackContext, "usePlatformPlayback");
