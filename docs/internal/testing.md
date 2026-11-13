# Automated tests: structure and policy

## Two suites

**Unit and component tests** live in `tests/unit/` and run with [Vitest](https://vitest.dev), which uses the application's own Vite configuration. They need no browser.

| Command | What it runs |
| --- | --- |
| `npm test` | Everything in `tests/unit/`, once |
| `npm run test:watch` | The same, rerunning the tests affected by each saved change |
| `npm run test:coverage` | Everything, with a coverage report in `coverage/` |
| `npm run test:<area>` | One folder of `tests/unit/`, listed below |
| `npx vitest run -t "requested bass"` | Only the cases whose name matches |

| Folder | Coverage |
| --- | --- |
| `chords/` | Chord formulas, Stradella ranking, registers, omissions, configurations, inversions, diagram notes, treble chords, search-time budget |
| `patterns/` | The built-in bass patterns: meter spans, complete multi-bar cycles and reference onsets |
| `notation/` | Notation export, the shared score presenter, symbolic Stradella writing, note names below notes, tempo marks |
| `abc/` | ABC parsing, ties, repeats, two-hand playback, the bundled example tunes and their catalog |
| `rhythm/` | Rhythm Trainer meters, templates, treble pitch patterns, generated notation and score highlighting |
| `harmony/` | Harmony Explorer engine and integration, the progression optimizer, and the Progression Assistant panel |
| `audio/` | Sample and register pitch mapping |
| `display/` | Chord symbols, voicing chart layout, row label fitting, PNG export conversion |
| `i18n/` | Six catalogs, language detection, translated options, explanations and diagram labels |
| `modules/` | Settings I/O, migrations, import traces and the saved session; feature hooks; cross-tool command order; audio scheduling and export services; inspector rows; progression selection and rhythms |
| `release/` | Version files agree with each other, with `VERSION_HISTORY.md` and with the newest git tag; documentation links resolve; bundle-audit logic |

`tests/fixtures/` holds the frozen reference data and `tests/support/` the shared helpers. `scripts/` now contains only build tooling.

### Three kinds of unit test

1. **Plain imports** for pure logic, which is most of the suite: import the function from `src/` and assert on what it returns.
2. **Component tests** for what the player sees: render the real component with Testing Library in the `jsdom` environment and query it by role and name, as `harmony/ProgressionAssistantPanel.test.tsx` does. Start the file with `// @vitest-environment jsdom`.
3. **Isolated modules** for code whose contract is what it calls and in which order (transport lifecycles, capture sequences, feature hooks): `loadIsolated()` from `tests/support/isolatedModule.js` loads the real source file with every import replaced by a test double, and fails on an import that was not listed. These files are `.test.js`. Prefer kinds 1 and 2 for new tests; write a hook test with Testing Library's `renderHook` instead of a hand-made React double.

Tests use `node:assert/strict` or Vitest's `expect`; both report a diff on failure. TypeScript tests are type-checked by `tsc -b` together with the application.

**Browser tests** live in `e2e/` and run with Playwright against the production build served by `vite preview`, at 1440 × 900 and at a 390 px phone size. Run `npx playwright install chromium` once, then `npm run test:e2e`. Every test fails on a console error or uncaught exception.

| Spec | Coverage |
| --- | --- |
| `smoke.spec.ts` | Every tool of every workspace and every settings section opens; no sideways scrolling; the documentation viewer opens and closes |
| `chord-finder.spec.ts` | Root-position default, wider results with Any bass, the 6/9 fallback note, Cmaj7 on the diagram |
| `progression.spec.ts` | ↑ ↓ × row buttons; playback and Stop |
| `performance.spec.ts` | Loading a preset without main-thread tasks over 400 ms. Runs in its own `performance` project after the others finish, so parallel workers do not inflate the timing |
| `harmony.spec.ts` | Recording chords on the circle and playing the recording on the audio clock |
| `rhythm-trainer.spec.ts` | Rhythm Trainer progressions, meters and accompaniments; audio for both hands and a clean Stop; notation in the right panel or below the diagram; score highlighting; note names below notes |
| `stradella-notation.spec.ts` | The global Stradella notation defaults and preferences |
| `players.spec.ts` | ABC Player Play, Pause, Continue and Stop; Bass Pattern Player Play and Stop |
| `files.spec.ts` | SVG, PNG and ZIP downloads; settings save with version and note length; loading a v0.17.0 settings file |
| `interaction.spec.ts` | Annotate Diagram click modes; keyboard navigation of the diagram; the phone Tools sheet; readable button size on phones; the one-row toolbar at 1280 px; resizing and resetting the panels |
| `translation.spec.ts` | The Spanish interface shows no English labels in any tool or settings section |

`e2e/fixtures.ts` holds the shared helpers: opening tools and settings in any language, closing the phone sheet, and counting notes started on the Web Audio clock (`recordAudioStarts`), which is how the tests know a player really made sound.

Vitest finds test files by name (`tests/unit/**/*.test.{ts,tsx,js}`) and Playwright by folder, so there is no list of tests to keep in step.

## Policy

- **Test behaviour, not source text.** Do not read a source file and match its contents with regular expressions or substring checks: such tests break on harmless refactors and stay green through real regressions. They were all retired. Test exported functions, rendered output, state transitions or browser behaviour instead. Reading a source file in order to transpile and execute it is fine.
- Translation keys are checked by the compiler (`t()` takes a `TranslationKey`); untranslated text is caught by `translation.spec.ts`.
- Keep frozen reference data (diagram geometry, settings import traces, exported key order): it pins numbers and file formats users depend on.
- When a test fails after an intended change, update the expectation to the new contract and say why in the commit.
- Name tests after what they protect, not after the release, phase or example that introduced them. When a new case belongs to an existing subject, add it to that file (for example a new bundled tune goes in `bundled-abc-examples.test.ts`).
- One `test()` per behaviour, named as a statement of that behaviour, so a failure report reads as a list of what broke.
- A loop over generated cases ends by asserting that it checked something, so a filter that matches nothing cannot pass.
- Release metadata is checked in one place, `release/release-readiness.test.js`. Other tests do not read `package.json` or the README.

## Continuous integration

`.github/workflows/deploy.yml` runs `npm run verify:release` and `npm run test:e2e` on every pull request and every push to `main`. The site is deployed only from `main` and only when both pass. Browser traces of a failed run are kept as a workflow artifact for seven days.

## Before a release

Run `npm run verify:release` (lint, `npm test`, `build:analyze`) and `npm run test:e2e`. The browser suite does not judge how things sound; listen to the players in a real browser before publishing.
