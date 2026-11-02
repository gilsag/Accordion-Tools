# Interface localization — historical v0.15.14 implementation and follow-up

**Status:** The original localization work was released in v0.15.14. As of the v0.15.28 documentation audit, English, Spanish, French, Brazilian Portuguese, Italian and German interface catalogs remain in `src/i18n/en.ts`, `es.ts`, `fr.ts`, `pt.ts`, `it.ts` and `de.ts`. `catalog.ts` holds the registry, lookup, browser-language detection and English fallback; `context.tsx` supplies `LanguageProvider`, and `useI18n.ts` supplies the context/hook. Bundled help articles remain in English. See [Adding Interface Languages](adding-interface-languages.md) for current extension instructions. The validation notes below are a checklist, not evidence of a completed v0.15.28 multilingual browser review.

## Scope and invariants

Interface localization covers navigation, settings, buttons, tooltips, accessibility labels, chord-family selectors, player controls, and major dynamic explanations for Stradella, Treble, and Harmony. It does **not** translate musical pitch classes, chord symbols selected by the user, stable IDs, pattern/music data, audio, MIDI/ABC, SVG geometry, or exported filenames.

The Stradella explanatory renderer accepts an optional interface language and uses the same search results. Its four-level notes may be localized in SVG/PNG presentation, but the filename is derived from the canonical English button naming and remains identical. The original English detailed explanation still follows its established rule-by-rule path. Spanish, French, Portuguese, Italian and German provide concise factual equivalents built from the selected realization, omissions and register analysis.

## Validation checklist (rerun for each release)

Local source checks: translation-key parity, parameter-placeholder parity, browser detection, translated static controls, representative dynamic explanation tests and language-invariant filenames. Source-level musical regressions should include ranking, registral notes, Harmony integration, notation and audio tests.

Complete these checks before release from a fully provisioned development machine:

```
npm ci
npm run test:i18n
npm run test:all
npm run test:responsive
npm run build
```

Then visually test all six languages on desktop and mobile, including manual selection, browser language changes, scroll/wrapping, tooltips, status bars, diagrams, explanations, and settings JSON import/export. Verify on Android Chrome and iOS Safari where practical.

## Future languages and residual work

New languages add a catalog, a registry entry and locale-specific terminology and explanation resources without modifying the musical engines. Bundled documentation translations remain out of scope. Existing pattern names supplied by users, imported tune text, and some parser-specific error messages are not translated by design; review any residual English interface text found in device testing before considering any translation fully reviewed.
