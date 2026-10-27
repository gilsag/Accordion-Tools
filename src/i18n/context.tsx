import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { translate, type InterfaceLanguage, type TranslationKey } from './catalog';

const LanguageContext = createContext<InterfaceLanguage>('en');

export function LanguageProvider({ language, children }: { language: InterfaceLanguage; children: ReactNode }) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const language = useContext(LanguageContext);
  return useMemo(() => ({
    language,
    t: (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params),
  }), [language]);
}
