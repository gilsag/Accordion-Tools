import assert from "node:assert/strict";
import {
  EN, ES, FR, PT, IT, DE, SUPPORTED_LANGUAGES, detectBrowserLanguage, resolveInterfaceLanguage,
  isInterfaceLanguagePreference, translate,
} from "../src/i18n/catalog";

assert.equal(detectBrowserLanguage(["es-CL", "en-US"]), "es");
assert.equal(detectBrowserLanguage(["es_ES"]), "es");
assert.equal(detectBrowserLanguage(["en-GB", "es-MX"]), "en");
assert.equal(detectBrowserLanguage(["fr-FR", "es-AR"]), "fr");
assert.equal(detectBrowserLanguage(["fr_CA"]), "fr");
assert.equal(detectBrowserLanguage(["fr-FR", "de-DE"]), "fr");
assert.equal(detectBrowserLanguage(["it-IT", "de-DE"]), "it");
assert.equal(detectBrowserLanguage(["pt-BR", "it-IT"]), "pt");
assert.equal(detectBrowserLanguage(["pt-PT"]), "pt");
assert.equal(detectBrowserLanguage(["de-AT"]), "de");
assert.equal(detectBrowserLanguage(["nl-NL"]), "en");
assert.equal(detectBrowserLanguage([]), "en");
assert.equal(resolveInterfaceLanguage("auto", ["es-CL"]), "es");
assert.equal(resolveInterfaceLanguage("en", ["es-CL"]), "en");
assert.equal(resolveInterfaceLanguage("es", ["en-US"]), "es");
assert.equal(resolveInterfaceLanguage("fr", ["es-CL"]), "fr");
assert.equal(isInterfaceLanguagePreference("auto"), true);
assert.equal(isInterfaceLanguagePreference("en"), true);
assert.equal(isInterfaceLanguagePreference("es"), true);
assert.equal(isInterfaceLanguagePreference("fr"), true);
assert.equal(isInterfaceLanguagePreference("de"), true);
assert.equal(isInterfaceLanguagePreference("pt"), true);
assert.equal(isInterfaceLanguagePreference("it"), true);
assert.equal(isInterfaceLanguagePreference("pt-BR"), false);
assert.equal(translate("es", "nav.settings"), "Configuración");
assert.equal(translate("en", "nav.settings"), "Settings");
assert.equal(translate("fr", "nav.settings"), "Paramètres");
assert.equal(translate("fr", "tools.upTo", { count: 3 }), "Jusqu’à 3");
assert.deepEqual(SUPPORTED_LANGUAGES.map((entry) => entry.code), ["en", "es", "fr", "pt", "it", "de"]);
assert.equal(translate("es", "tools.upTo", { count: 4 }), "Hasta 4");
assert.equal(translate("en", "tools.upTo", { count: 2 }), "Up to 2");
for (const catalog of [ES, FR, PT, IT, DE]) {
  assert.deepEqual(Object.keys(EN).filter(key => catalog[key as keyof typeof EN] === undefined), []);
}
console.log("✓ Interface language detection, manual override, key coverage and interpolation passed");
