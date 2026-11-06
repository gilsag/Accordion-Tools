import { useCallback, useEffect, useState } from "react";
import { browserLanguagePreferences, detectBrowserLanguage, isInterfaceCatalogLoaded, isInterfaceLanguagePreference, loadInterfaceCatalog, resolveInterfaceLanguage, translate, type InterfaceLanguage, type InterfaceLanguagePreference } from "../i18n/catalog";

const LANGUAGE_STORAGE_KEY = 'accordionTools.interfaceLanguage.v1';

function storedLanguagePreference(): InterfaceLanguagePreference {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isInterfaceLanguagePreference(saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

/** The language the first render will request. main.tsx loads its catalog
 * before mounting so a non-English interface does not flash English. */
export function initialInterfaceLanguage(): InterfaceLanguage {
  return resolveInterfaceLanguage(storedLanguagePreference(), browserLanguagePreferences());
}

/** User language overrides editable defaults; browser preference is the fallback.
 * Keep the v1 localStorage key stable for existing installations.
 */
export function useLanguageSettings() {
  const [languagePreference, setLanguagePreference] = useState<InterfaceLanguagePreference>(storedLanguagePreference);
  const [browserLanguage, setBrowserLanguage] = useState(() =>
    detectBrowserLanguage(browserLanguagePreferences()),
  );
  const requestedLanguage = resolveInterfaceLanguage(languagePreference, [browserLanguage]);
  // While a newly requested catalog chunk loads, keep showing the last language
  // whose catalog was available, instead of switching to English mid-session.
  const [loadedLanguage, setLoadedLanguage] = useState<InterfaceLanguage>(() =>
    isInterfaceCatalogLoaded(requestedLanguage) ? requestedLanguage : 'en');
  const language = isInterfaceCatalogLoaded(requestedLanguage) ? requestedLanguage : loadedLanguage;
  useEffect(() => {
    if (isInterfaceCatalogLoaded(requestedLanguage)) return;
    let cancelled = false;
    loadInterfaceCatalog(requestedLanguage).then(
      () => { if (!cancelled) setLoadedLanguage(requestedLanguage); },
      () => { /* Stay on the current language; a later change retries the load. */ },
    );
    return () => { cancelled = true; };
  }, [requestedLanguage]);
  const t = useCallback((key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(language, key, params), [language]);
  function changeLanguage(next: InterfaceLanguagePreference) {
    setLanguagePreference(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
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
