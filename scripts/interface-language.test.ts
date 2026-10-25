import assert from "node:assert/strict";
import {
  EN, ES, detectBrowserLanguage, resolveInterfaceLanguage,
  isInterfaceLanguagePreference, translate,
} from "../src/i18n/catalog";

assert.equal(detectBrowserLanguage(["es-CL", "en-US"]), "es");
assert.equal(detectBrowserLanguage(["es_ES"]), "es");
assert.equal(detectBrowserLanguage(["en-GB", "es-MX"]), "en");
assert.equal(detectBrowserLanguage(["fr-FR", "es-AR"]), "es");
assert.equal(detectBrowserLanguage(["fr-FR", "de-DE"]), "en");
assert.equal(detectBrowserLanguage([]), "en");
assert.equal(resolveInterfaceLanguage("auto", ["es-CL"]), "es");
assert.equal(resolveInterfaceLanguage("en", ["es-CL"]), "en");
assert.equal(resolveInterfaceLanguage("es", ["en-US"]), "es");
assert.equal(isInterfaceLanguagePreference("auto"), true);
assert.equal(isInterfaceLanguagePreference("en"), true);
assert.equal(isInterfaceLanguagePreference("es"), true);
assert.equal(isInterfaceLanguagePreference("de"), false);
assert.equal(translate("es", "nav.settings"), "Configuración");
assert.equal(translate("en", "nav.settings"), "Settings");
assert.equal(translate("es", "tools.upTo", { count: 4 }), "Hasta 4");
assert.equal(translate("en", "tools.upTo", { count: 2 }), "Up to 2");
assert.deepEqual(Object.keys(EN).filter(key => ES[key as keyof typeof EN] === undefined), []);
console.log("✓ Interface language detection, manual override, key coverage and interpolation passed");
