/** Shared state that many tools read and that is not any one tool's: the
 * interface language, the instrument, the diagram's appearance and spelling,
 * sound and notation preferences, and navigation. Each part is owned by its
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

export type PlatformLanguage = ReturnType<typeof useLanguageSettings>;
export type PlatformInstrument = ReturnType<typeof useInstrumentState>;
export type PlatformAppearance = ReturnType<typeof useDiagramAppearanceState>;
export type PlatformSpelling = ReturnType<typeof useMusicSpelling>;
export type PlatformSound = ReturnType<typeof useSoundSettings>;
export type PlatformNotation = ReturnType<typeof useNotationSettings>;
export type PlatformNavigation = ReturnType<typeof useWorkspaceNavigation>;

export const PlatformLanguageContext = createContext<PlatformLanguage | null>(null);
export const PlatformInstrumentContext = createContext<PlatformInstrument | null>(null);
export const PlatformAppearanceContext = createContext<PlatformAppearance | null>(null);
export const PlatformSpellingContext = createContext<PlatformSpelling | null>(null);
export const PlatformSoundContext = createContext<PlatformSound | null>(null);
export const PlatformNotationContext = createContext<PlatformNotation | null>(null);
export const PlatformNavigationContext = createContext<PlatformNavigation | null>(null);

function usePlatformContext<T>(context: Context<T | null>, name: string): T {
  const value = useContext(context);
  if (value === null) throw new Error(`${name}() must be called inside <PlatformProviders>.`);
  return value;
}

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
