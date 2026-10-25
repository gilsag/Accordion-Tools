/** Interface localization registry and API. Musical identifiers and downloaded
 * filenames are independent of the interface locale. */
import { EN, type TranslationKey } from "./en";
import { ES } from "./es";
import { FR } from "./fr";
import { PT } from "./pt";
import { IT } from "./it";
import { DE } from "./de";

export { EN, ES, FR, PT, IT, DE };
export type { TranslationKey };

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português (Brasil)" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
] as const;

export type InterfaceLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];
export type InterfaceLanguagePreference = InterfaceLanguage | "auto";

const catalogs: Record<InterfaceLanguage, Readonly<Partial<Record<TranslationKey, string>>>> = {
  en: EN,
  es: ES,
  fr: FR,
  pt: PT,
  it: IT,
  de: DE,
};

export function isInterfaceLanguage(value: unknown): value is InterfaceLanguage {
  return SUPPORTED_LANGUAGES.some(({ code }) => code === value);
}

/** First supported browser locale wins; unsupported browser languages use English. */
export function detectBrowserLanguage(locales: readonly string[]): InterfaceLanguage {
  for (const locale of locales) {
    const primary = locale.trim().replace(/_/g, "-").split("-")[0].toLowerCase();
    if (isInterfaceLanguage(primary)) return primary;
  }
  return "en";
}

export function browserLanguagePreferences(): string[] {
  if (typeof navigator === "undefined") return [];
  const locales = Array.isArray(navigator.languages) ? [...navigator.languages] : [];
  if (navigator.language && !locales.includes(navigator.language)) locales.push(navigator.language);
  return locales;
}

export function resolveInterfaceLanguage(
  preference: InterfaceLanguagePreference,
  browserLocales: readonly string[],
): InterfaceLanguage {
  return preference === "auto" ? detectBrowserLanguage(browserLocales) : preference;
}

export function isInterfaceLanguagePreference(value: unknown): value is InterfaceLanguagePreference {
  return value === "auto" || isInterfaceLanguage(value);
}

export function translate(language: InterfaceLanguage, key: TranslationKey, params?: Record<string, string | number>): string {
  const template = catalogs[language][key] ?? EN[key];
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (original, name: string) =>
    params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : original);
}

/** Display-only translation for enumerated UI labels; unknown names are unchanged. */
const UI_LABEL_TRANSLATION_KEYS = new Map<string, TranslationKey>(
  (Object.keys(EN) as TranslationKey[]).filter((key) => key.startsWith("ui.")).map((key): [string, TranslationKey] => [EN[key], key]),
);
export function translateKnownLabel(language: InterfaceLanguage, label: string): string {
  const key = UI_LABEL_TRANSLATION_KEYS.get(label);
  return key ? translate(language, key) : label;
}
