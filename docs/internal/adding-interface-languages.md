# Adding Interface Languages

**Accordion Tools — developer guide**
**Location:** `docs/internal/adding-interface-languages.md`

## Purpose and scope

Accordion Tools separates **interface language** from musical notation, harmony, instrument layout, audio, and exported data. Interface localization covers navigation, controls, settings, help text, accessible labels, legends, and generated explanations. Translated labels must not change chord formulas, pitch classes, button selection, sample mappings, MIDI/ABC data, or stable identifiers.

English (`en`) is the reference language and fallback. Spanish (`es`), French (`fr`), Brazilian Portuguese (`pt`), Italian (`it`) and German (`de`) are supported. The `pt` catalog currently uses Brazilian Portuguese for all `pt-*` browser locales. The language preference can be `auto` or an explicitly selected language; automatic selection uses the browser's language preferences. A manual choice takes precedence and is retained by the existing local preference and settings JSON mechanisms.

The application uses a typed language registry and separate per-language catalogs. Interface language is distinct from musical pitch notation and chord-symbol conventions.

## Source organization

```text
src/i18n/
  catalog.ts           # Typed registry, lookup, fallback, locale detection
  en.ts                # Canonical English strings and translation keys
  es.ts                # Spanish strings
  fr.ts                # French strings
  pt.ts                # Brazilian Portuguese strings
  it.ts                # Italian strings
  de.ts                # German strings
  context.tsx          # React LanguageProvider and useI18n()
  musicTerms.ts        # Chord-family, scale, role and row terminology
  optionLabels.ts      # Names of bundled progressions, patterns and ABC examples
  diagramLabels.ts     # Localized diagram and status presentation
```

The locale files hold ordinary interface strings; specialized helpers remain responsible for translating musical terminology and presentation derived from musical data. New languages should normally require a new locale file and additions to language-specific terminology/explanation mappings, **not changes to the musical engines**.

### Catalog contract

- `en.ts` defines the authoritative translation keys and English default strings.
- Each supported locale implements the same keys, preserving interpolation parameters such as `{count}`, `{name}`, and `{family}`.
- `catalog.ts` exports the public API currently used by the application: `EN`, `ES` where compatibility requires them, `TranslationKey`, `InterfaceLanguage`, `InterfaceLanguagePreference`, `translate()`, `translateKnownLabel()`, browser-language detection and preference validators.
- The language registry should supply user-facing language names (e.g., `English`, `Español`, `Français`, `Português (Brasil)`, `Italiano`, `Deutsch`) and a stable locale code. **Generate the Settings selector from this registry**, avoiding a growing list of hard-coded options in `App.tsx`.
- An absent translation falls back to English. **Supported locales require complete key coverage**; fallback remains a safeguard, not a substitute for translation review.
- Keep translation keys stable. A new string belongs in the English source first, then in every supported locale. Do not use translated wording as a data identifier.

Illustrative pattern consistent with the implementation:

```ts
// en.ts
export const EN = {
  'nav.settings': 'Settings',
  'tools.upTo': 'Up to {count}',
  // ...all existing English keys
} as const;
export type TranslationKey = keyof typeof EN;

// fr.ts
import type { TranslationKey } from './en';
export const FR = {
  'nav.settings': 'Paramètres',
  'tools.upTo': "Jusqu’à {count}",
  // ...remaining translations
} satisfies Record<TranslationKey, string>;

// catalog.ts: concept only
const catalogs = { en: EN, es: ES, fr: FR, pt: PT, it: IT, de: DE };
export type InterfaceLanguage = keyof typeof catalogs;
```

The actual migration must preserve existing import paths and exports. Before extracting the catalogs, check tests and consumers of `EN`, `ES`, `TranslationKey`, and `translate()`; avoid circular runtime imports between the catalog and locale modules.

## Adding a language

The following steps apply to additional locales; the current Italian catalog (`it`) is an implementation example.

1. **Create a locale file, for example `src/i18n/nl.ts`.** Translate all English keys. Preserve parameter names and meaningful musical distinctions such as Exact/Approximate, bass/counterbass, register, and nominal-versus-measured pitch.
2. **Register the locale.** Add the code and native label to `SUPPORTED_LANGUAGES` in `catalog.ts` and include the catalog in `catalogs`. Browser preferences such as `fr-FR` and `fr-CA` resolve to `fr`, while `pt-BR` and `pt-PT` resolve to the Brazilian Portuguese `pt` catalog; unsupported languages continue to use the documented English fallback.
3. **Extend musical terminology.** Add locale mappings for chord families, scale and mode names, harmonic roles, and Stradella row labels in `musicTerms.ts`. Reuse stable chord/scale/button IDs rather than translating the identifiers.
4. **Translate bundled example names.** Extend `optionLabels.ts` for built-in progressions, bass patterns and ABC examples. Preserve user-edited names, imported titles, and example identifiers exactly as supplied.
5. **Localize generated explanations.** Review `src/tools/harmonyExplorer/explanation.ts`, `src/tools/stradellaChordFinder/explainRealization.ts`, `src/tools/stradellaChordFinder/diagramAnnotations.ts`, and `src/tools/trebleChordExplanation.ts`, together with their consumers. Replace two-language conditional branches with keyed locale-specific formatters or translation templates as appropriate; do not duplicate harmonic calculations.
6. **Review presentation and help.** Check status lines, tooltips, controls, accessibility text, diagram labels, legends, exported footers, and About. Bundled Markdown guides remain English; translating them is a separate scope decision and must not be implied by UI language support.
7. **Test and document.** Extend the translation, option-label, dynamic-explanation, layout, and export tests. Document the new language in README, settings/help, and relevant release notes when it is shipped.

## Non-translatable musical and data invariants

- Keep internal pitch-class IDs, chord-family IDs, button IDs, and algorithmic interval values stable.
- Interface language is distinct from **pitch notation** (English/German/solfège), enharmonic spelling, and chord-symbol style. Do not silently change these settings when the interface language changes.
- Use the same result objects across locales for Chord Finders, Harmony Explorer, and Progression Assistant. Translating an explanation must not alter exactness, omissions, registral analysis, recommendation order, or playback.
- Keep SVG/PNG **filenames stable and language-independent** under the current convention, even when text rendered within the diagram is translated.
- Preserve La Melodiosa attribution, sample mapping, licenses, nominal register caveats, and the distinction between configured pitches and measured acoustic behavior.
- Preserve user-authored pattern names and imported ABC/music data. Some third-party parser diagnostics may remain in their original language unless separately localized.

## Validation checklist

**Automated checks**

- Translation-key coverage and placeholder parity for each supported language; detect unexpected and missing keys.
- English fallback behavior, language validation, and browser preference priority (including region-specific codes and unsupported locales).
- Manual selection, persistence, settings JSON import/export, and compatibility with saved `auto`, `en`, `es`, `fr`, `pt`, `it`, and `de` values.
- Built-in option names versus custom names; generated Stradella, Treble, and Harmony explanations; language-independent results and filenames.
- Existing chord, register, notation, audio, integration, and layout regressions.

Recommended commands (run from the repository root):

```cmd
npm run test:i18n
npm run test:all
npm run test:responsive
npm run build
```

**Visual and export checks**

Inspect each language in desktop and narrow-screen layouts, with short/long labels, tooltips, dropdowns, status bars, Harmony legends, chord explanations, and the minimum/default/maximum font settings where applicable. Confirm complete text without clipping or overlap. Inspect downloaded **SVG and PNG** files, including diagrams that use SVG `foreignObject` or nested SVG elements. Passing TypeScript compilation or source-level layout tests alone does not establish visual correctness.

Report automated results, browser checks, export checks, and tests not performed as separate categories.

## Related documentation

- [`localization-plan.md`](localization-plan.md) — current localization scope and historical implementation notes.
- [`developer-guide.md`](developer-guide.md) — architecture, musical invariants, validation, and contribution practices.
- [`../settings.md`](../settings.md) — user-facing language and settings behavior.
