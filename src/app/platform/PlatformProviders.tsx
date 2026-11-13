import type { ReactNode } from "react";
import { useLanguageSettings } from "../../settings/useLanguageSettings";
import { useInstrumentState } from "../../instrument/useInstrumentState";
import { useDiagramAppearanceState } from "../../diagram/useDiagramAppearanceState";
import { useMusicSpelling } from "../../diagram/useMusicSpelling";
import { useSoundSettings } from "../../audio/useSoundSettings";
import { useNotationSettings } from "../../notation/useNotationSettings";
import { useWorkspaceNavigation } from "../useWorkspaceNavigation";
import {
  PlatformAppearanceContext,
  PlatformInstrumentContext,
  PlatformLanguageContext,
  PlatformNavigationContext,
  PlatformNotationContext,
  PlatformSoundContext,
  PlatformSpellingContext,
  usePlatformInstrument,
} from "./platformContexts";

type ProviderProps = { children: ReactNode };

/**
 * Owns the shared state every tool may read (see `platformContexts.ts`).
 *
 * The order is part of the contract: sound needs the instrument's register
 * model and navigation needs the instrument's side, so both sit inside the
 * instrument provider. Everything in the application renders inside these
 * providers, and they stay mounted for the whole session.
 */
export function PlatformProviders({ children }: ProviderProps) {
  return (
    <LanguageSettingsProvider>
      <InstrumentProvider>
        <AppearanceProvider>
          <SoundProvider>
            <NotationProvider>
              <NavigationProvider>{children}</NavigationProvider>
            </NotationProvider>
          </SoundProvider>
        </AppearanceProvider>
      </InstrumentProvider>
    </LanguageSettingsProvider>
  );
}

function LanguageSettingsProvider({ children }: ProviderProps) {
  const value = useLanguageSettings();
  return (
    <PlatformLanguageContext.Provider value={value}>{children}</PlatformLanguageContext.Provider>
  );
}

function InstrumentProvider({ children }: ProviderProps) {
  const value = useInstrumentState();
  return (
    <PlatformInstrumentContext.Provider value={value}>
      {children}
    </PlatformInstrumentContext.Provider>
  );
}

function AppearanceProvider({ children }: ProviderProps) {
  const appearance = useDiagramAppearanceState();
  const spelling = useMusicSpelling();
  return (
    <PlatformAppearanceContext.Provider value={appearance}>
      <PlatformSpellingContext.Provider value={spelling}>
        {children}
      </PlatformSpellingContext.Provider>
    </PlatformAppearanceContext.Provider>
  );
}

function SoundProvider({ children }: ProviderProps) {
  const { stradellaRegisterModel } = usePlatformInstrument();
  const value = useSoundSettings(stradellaRegisterModel);
  return <PlatformSoundContext.Provider value={value}>{children}</PlatformSoundContext.Provider>;
}

function NotationProvider({ children }: ProviderProps) {
  const value = useNotationSettings();
  return (
    <PlatformNotationContext.Provider value={value}>{children}</PlatformNotationContext.Provider>
  );
}

function NavigationProvider({ children }: ProviderProps) {
  const { side, setSide } = usePlatformInstrument();
  const value = useWorkspaceNavigation(side, setSide);
  return (
    <PlatformNavigationContext.Provider value={value}>
      {children}
    </PlatformNavigationContext.Provider>
  );
}
