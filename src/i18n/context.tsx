import { type ReactNode } from 'react';
import { LanguageContext } from './useI18n';
import type { InterfaceLanguage } from './catalog';

export function LanguageProvider({ language, children }: { language: InterfaceLanguage; children: ReactNode }) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

