import { createContext, useContext, useMemo } from 'react';
import { translate, type InterfaceLanguage, type TranslationKey } from './catalog';

export const LanguageContext = createContext<InterfaceLanguage>('en');

export function useI18n() {
  const language = useContext(LanguageContext);
  return useMemo(() => ({
    language,
    t: (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params),
  }), [language]);
}
