# Automated tests: structure and policy

## Two suites

**Unit and component tests** run with [Vitest](https://vitest.dev), which uses the application's own Vite configuration. They need no browser. A tool's tests sit in its folder next to its code (`src/features/<tool>/`, the Stradella Chord Finder's search suites under `engine/`); tests of shared code and of the composed application live in `tests/unit/`.

| Command | What it runs |
| --- | --- |
| `npm test` | Every test, once |
| `npm run test:watch` | The same, rerunning the tests affected by each saved change |
| `npm run test:coverage` | Everything, with a coverage report in `coverage/`; fails below the thresholds in `vitest.config.ts` |
| `npm run test:tools` | Every tool's own tests (`src/features/`) |
| `npm run test:<area>` | One group, listed below |
| `npx vitest run -t "requested bass"` | Only the cases whose name matches |

Coverage counts statements run by the unit tests only; the browser tests are not measured. The thresholds in `vitest.config.ts` sit just under the measured values (statements 60%, branches 51%, functions 55%, lines 61%), so a change that removes tests or adds untested code fails the release check. Raise them when coverage grows; never lower them to make a change pass.

| Group | Folders | Coverage |
| --- | --- | --- |
| `chords` | `src/features/stradellaChordFinder`, `src/features/trebleChordFinder`, `tests/unit/chords` | Chord formulas, Stradella ranking, registers, omissions, configurations, inversions, diagram notes, treble chords, search-time budget; the Finders' hooks and inspector rows; the bass policy and contextual titles shared with other tools |
| `patterns` | `src/features/bassPatternPlayer` | The built-in bass patterns (meter spans, complete multi-bar cycles, reference onsets), tempo marks and the player's hooks |
| `notation` | `tests/unit/notation` | Notation export, the shared score presenter, symbolic Stradella writing, note names below notes |
| `abc` | `src/features/abcPlayer` | ABC parsing, ties, repeats, two-hand playback, the bundled example tunes and their catalog, the player's hooks |
| `rhythm` | `src/features/rhythmTrainer` | Rhythm Trainer meters, templates, treble pitch patterns, generated notation and score highlighting |
| `harmony` | `src/features/harmonyExplorer`, `src/features/progressionAssistant`, `tests/unit/harmony` | Harmony Explorer engine, integration, recording and hooks; the progression optimizer, its realization selection, note selection, hooks and panel; the progression checks that span both |
| `audio` | `tests/unit/audio` | Sample and register pitch mapping; count-in and metronome click grids and timing |
| `display` | `tests/unit/display` | Chord symbols, voicing chart layout, row label fitting, PNG export conversion, the design tokens (no colour outside the token files, every token defined, TypeScript drawing colours equal to their tokens) |
| `i18n` | `tests/unit/i18n` | Six catalogs, language detection, translated options, explanations and diagram labels |
| `modules` | `tests/unit/modules` | Settings I/O, migrations, import traces and the saved session; in-page notices; navigation and the tool registry; the diagram's appearance, overlay and annotation hooks; command and capture order; audio scheduling and export services; progression chord types, ranking weights and rhythms |
| `app` | `tests/unit/app` | The whole state composition rendered in jsdom: what opening a tool does to the others, one visible score, what the diagram presents and what a click does, what clears the diagram and what each Reset scope resets, the commands between tools, startup order and when the session is saved |
| `release` | `tests/unit/release` | Version files agree with each other, with `VERSION_HISTORY.md` and with the newest git tag; documentation links resolve; bundle-audit logic |

Annotate Diagram's sequence hook test is in `src/features/annotateDiagram/` and runs with `test:tools`.

`tests/fixtures/` holds the frozen reference data and `tests/support/` the shared helpers. `scripts/` now contains only build tooling.

The `app/` tests reach the application only through `renderApp()` in `tests/support/appHarness.ts`, which serves the files in `public/` to `fetch`, waits for startup and switches sound off. They describe behaviour the player relies on, not the code that produces it, so they passed unchanged throughout [the controller split](archive/controller-split-plan.md); only the support files follow the code. The `model` a test drives is assembled from the platform and tool contexts in `tests/support/testModel.ts`, and `app.diagram` shows what the diagram presents (title, footer, Finder highlights, status line, downloaded file name).

### Four kinds of unit test

1. **Plain imports** for pure logic, which is most of the suite: import the function from `src/` and assert on what it returns.
2. **Component tests** for what the player sees: render the real component with Testing Library in the `jsdom` environment and query it by role and name, as `src/features/progressionAssistant/ProgressionAssistantPanel.test.tsx` does. Start the file with `// @vitest-environment jsdom`.
3. **Hooks** render with Testing Library's `renderHook`, with real React; replace an engine a hook calls with `vi.mock` to see what the hook passes it, as `src/features/scaleFinder/useScaleFinder.test.js` does.
4. **Isolated modules** for code without React whose contract is what it calls and in which order (transport lifecycles, capture sequences, settings compatibility): `loadIsolated()` from `tests/support/isolatedModule.js` loads the real source file with every import replaced by a test double, and fails on an import that was not listed. Its doubles are keyed by the import as the module writes it, so they follow a moved file. These files are `.test.js`. Prefer kinds 1 to 3 for new tests.

Tests use `node:assert/strict` or Vitest's `expect`; both report a diff on failure. TypeScript tests are type-checked by `tsc -b` with the test configuration; the application's type-check leaves them out.

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

`e2e/fixtures.ts` holds the shared helpers: opening tools and settings in any language, closing the phone sheet, and counting notes started on the Web Audio clock (`recordAudioStarts`), which is how the tests know a player really made sound; downloading a file (`downloadFrom`, `chooseDownload`); and `expectAccessible`, which runs axe.

Two browser checks guard against regressions nobody would notice by eye:

- **Accessibility.** `smoke.spec.ts` runs axe in each workspace with nothing open, with each tool open and with each settings section open (light theme on both sizes, dark theme on desktop), and in the documentation viewer. Fix the markup rather than disabling a rule.
- **Export snapshots.** `export-snapshots.spec.ts` downloads reference diagrams as SVG (Stradella 48, 96 and 120 basses, Em7 in the Chord Finder, the C-system, B-system and piano trebles) and compares one line per button: its shapes' positions and sizes, its classes and its label, against `e2e/__snapshots__/`. Styles and fonts are left out. When a layout change is intended, review the diff and run `npx playwright test export-snapshots --update-snapshots`. The files are stored with LF endings on every system (`.gitattributes`).

Vitest finds test files by name (`*.test.{ts,tsx,js}` under `src/` and `tests/unit/`) and Playwright by folder, so there is no list of tests to keep in step.

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

Run `npm run verify:release` (lint, `npm run test:coverage`, `build:analyze`) and `npm run test:e2e`. The browser suite does not judge how things sound; listen to the players in a real browser before publishing.
