import { useEffect, useState, type ReactNode } from "react";
import { createSettingsRegistry } from "../../settings/settingsRegistry";
import { useOwnedSettings } from "./useOwnedSettings";
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
  PlatformSettingsContext,
  PlatformSoundContext,
  PlatformSpellingContext,
  usePlatformInstrument,
} from "./platformContexts";

type ProviderProps = { children: ReactNode };

/**
 * Owns the shared state every tool may read (see `platformContexts.ts`).
 *
 * The order is part of the contract. The settings registry is outermost:
 * every owner registers its settings with it in a layout effect, and its own
 * startup effect runs after its children's, when all owners are registered.
 * Sound needs the instrument's register model and navigation needs the
 * instrument's side, so both sit inside the instrument provider. Everything in the application renders inside these
 * providers, and they stay mounted for the whole session.
 */
export function PlatformProviders({ children }: ProviderProps) {
  return (
    <SettingsProvider>
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
    </SettingsProvider>
  );
}

function SettingsProvider({ children }: ProviderProps) {
  const [registry] = useState(createSettingsRegistry);
  useEffect(() => registry.start(`${import.meta.env.BASE_URL}default-settings.json`), [registry]);
  return (
    <PlatformSettingsContext.Provider value={registry}>{children}</PlatformSettingsContext.Provider>
  );
}

function LanguageSettingsProvider({ children }: ProviderProps) {
  const value = useLanguageSettings();
  useOwnedSettings("language", value);
  return (
    <PlatformLanguageContext.Provider value={value}>{children}</PlatformLanguageContext.Provider>
  );
}

function InstrumentProvider({ children }: ProviderProps) {
  const value = useInstrumentState();
  useOwnedSettings("instrument", value);
  return (
    <PlatformInstrumentContext.Provider value={value}>
      {children}
    </PlatformInstrumentContext.Provider>
  );
}

function AppearanceProvider({ children }: ProviderProps) {
  const appearance = useDiagramAppearanceState();
  const spelling = useMusicSpelling();
  useOwnedSettings("appearance", appearance);
  useOwnedSettings("spelling", spelling);
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
  useOwnedSettings("sound", value);
  return <PlatformSoundContext.Provider value={value}>{children}</PlatformSoundContext.Provider>;
}

function NotationProvider({ children }: ProviderProps) {
  const value = useNotationSettings();
  useOwnedSettings("notation", value);
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
