import { useCallback, useEffect, useState } from "react";
import { browserLanguagePreferences, detectBrowserLanguage, isInterfaceLanguagePreference, resolveInterfaceLanguage, translate, type InterfaceLanguagePreference } from "../i18n/catalog";

/** User language overrides editable defaults; browser preference is the fallback.
 * Keep the v1 localStorage key stable for existing installations.
 */
export function useLanguageSettings() {
  const [languagePreference, setLanguagePreference] = useState<InterfaceLanguagePreference>(() => {
    try {
      const saved = window.localStorage.getItem('accordionTools.interfaceLanguage.v1');
      return isInterfaceLanguagePreference(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [browserLanguage, setBrowserLanguage] = useState(() =>
    detectBrowserLanguage(browserLanguagePreferences()),
  );
  const language = resolveInterfaceLanguage(languagePreference, [browserLanguage]);
  const t = useCallback((key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(language, key, params), [language]);
  function changeLanguage(next: InterfaceLanguagePreference) {
    setLanguagePreference(next);
    try {
      window.localStorage.setItem('accordionTools.interfaceLanguage.v1', next);
    } catch {
      /* The setting remains active for this session when storage is unavailable. */
    }
  }
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const refresh = () => setBrowserLanguage(detectBrowserLanguage(browserLanguagePreferences()));
    window.addEventListener('languagechange', refresh);
    return () => window.removeEventListener('languagechange', refresh);
  }, []);
  return { languagePreference, setLanguagePreference, browserLanguage, language, t, changeLanguage };
}
