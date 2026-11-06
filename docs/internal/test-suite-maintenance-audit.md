# Automated tests — structure and policy

## Two suites

**Unit and integration tests** live in `scripts/` and run with `tsx` and Node, without a browser. They import the real modules, or transpile and execute them with mocked dependencies, and check results, call order and state transitions.

| Command | Coverage |
| --- | --- |
| `npm run test:chords` | Chord formulas, Stradella ranking, registers, omissions, configurations, inversions, diagram notes, treble chords, search-time budget |
| `npm run test:notation`, `npm run test:abc` | Notation export, ABC parsing, ties, repeats and the bundled examples |
| `npm run test:harmony` | Harmony Explorer engine and integration, progression optimizer |
| `npm run test:audio` | Sample and register pitch mapping |
| `npm run test:display` | Chord symbols, voicing chart layout, PNG export conversion |
| `npm run test:i18n` | Six catalogs, language detection, translated options, explanations and diagram labels |
| `npm run test:modules` | Settings I/O, migrations and import traces; feature hooks; cross-tool command order; audio scheduling and export services; inspector rows; progression selection and rhythms |
| `npm run test:all` | All of the above |
| `npm run test:release` | Release metadata, documentation links, bundle-audit logic and test-suite integrity |

**Browser tests** live in `e2e/` and run with Playwright against the production build served by `vite preview`, at 1440 × 900 and at a 390 px phone size. Run `npx playwright install chromium` once, then `npm run test:e2e`. Every test fails on a console error or uncaught exception.

| Spec | Coverage |
| --- | --- |
| `smoke.spec.ts` | Every tool of every workspace and every settings section opens; no sideways scrolling; the documentation viewer opens and closes |
| `chord-finder.spec.ts` | Root-position default, wider results with Any bass, the 6/9 fallback note, Cmaj7 on the diagram |
| `progression.spec.ts` | ↑ ↓ × row buttons; playback and Stop |
| `performance.spec.ts` | Loading a preset without main-thread tasks over 400 ms. Runs in its own `performance` project after the others finish, so parallel workers do not inflate the timing |
| `harmony.spec.ts` | Recording chords on the circle and playing the recording on the audio clock |
| `players.spec.ts` | ABC Player Play, Pause, Continue and Stop; Bass Pattern Player Play and Stop |
| `files.spec.ts` | SVG, PNG and ZIP downloads; settings save with version and note length; loading a v0.17.0 settings file |
| `interaction.spec.ts` | Keyboard navigation of the diagram; the phone Tools sheet; readable button size on phones |
| `translation.spec.ts` | The Spanish interface shows no English labels in any tool or settings section |

`e2e/fixtures.ts` holds the shared helpers: opening tools and settings in any language, closing the phone sheet, and counting notes started on the Web Audio clock (`recordAudioStarts`), which is how the tests know a player really made sound.

`scripts/test-suite-integrity.test.mjs` fails if a test file in `scripts/` is not referenced by an npm script, if a script references a missing file, or if `test:all` would need a browser.

## Policy

- **Test behaviour, not source text.** Do not read a source file and match its contents with regular expressions or substring checks: such tests break on harmless refactors and stay green through real regressions. They were all retired. Test exported functions, rendered output, state transitions or browser behaviour instead. Reading a source file in order to transpile and execute it is fine.
- Translation keys are checked by the compiler (`t()` takes a `TranslationKey`); untranslated text is caught by `translation.spec.ts`.
- Keep frozen reference data (diagram geometry, settings import traces, exported key order): it pins numbers and file formats users depend on.
- When a test fails after an intended change, update the expectation to the new contract and say why in the commit.
- Name tests after what they protect, not after the release that introduced them.

## Before a release

Run `npm run verify:release` (lint, `test:all`, `test:release`, `build:analyze`) and `npm run test:e2e`. The browser suite does not judge how things sound; listen to the players in a real browser before publishing.
