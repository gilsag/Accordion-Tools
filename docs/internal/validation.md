# Historical Stradella configuration validation (v0.15.0–v0.15.5)

**Reference audit:** 22 October 2026

**Note:** Earlier results are historical evidence. The v0.15.6 offline cleanup checks below are not a native build or browser/audio acceptance.

**Baseline:** v0.15.0 configuration matrix; unchanged search/regression scope in v0.15.3.

**Scope:** source-level regression testing. These tests are **not** measurements of a physical accordion, actual La Melodiosa samples, or browser-rendered SVG/PNG files.

## v0.15.6 conservative cleanup verification (22 October 2026)

The source import graph has 56 of 56 remaining modules reachable from `src/main.tsx`, with no unresolved relative imports. TypeScript parser checks found no syntax errors in the remaining source and test files. Every local Markdown link resolved. The two removed components were not reachable from the original application entry point. For retained changed TS files, transpilation with comments omitted produced identical executable JavaScript to v0.15.5.

The offline CommonJS test harness passed: Stradella register model, structural registral analysis, root reinforcement, explicit requested bass, harmonic/inversion spelling, voicing density, registral ranking, four-level notes, contextual titles, La Melodiosa mapping, Harmony integration/explorer/progression, 117 geometry/spacing cases, 223 Stradella configuration scenarios, 321 Treble Auto cases, notation, and binary-control checks.

`npm ci --offline` still fails (`ENOTCACHED`, `zod-validation-error`); online registry access failed (`EAI_AGAIN`). The full native build, lint, complete npm test suite, and visual/audio browser acceptance therefore remain unverified. None of these tests involved measuring a physical accordion.

## Configuration matrix

The test `scripts/stradella-configurations.test.ts` passed using an offline TypeScript-to-CommonJS test harness. It checks **223 scenarios**, including **371 playable candidates** and **38 unavailable results**.

- **Physical Stradella presets:** 8, 12, 24, 32, 40, 48 (8 columns × 6 rows), 48 (12 columns × 4 rows), 60, 72, 80, 96, 100 and 120 basses.
- **Search strategies:** Bass rows only; Chord buttons only; Bass + chord buttons. The cross-preset tests use C major, C minor and C minor seventh.
- **Analytical register configurations:** eight independent combinations of C–B and F–E groupings for bass/counterbass and preset chord buttons, with low bass (octave 2)/chords (octave 3) and higher bass (octave 4)/lower chords (octave 2). This spans situations where the modeled lowest pitch shifts from a bass button to a chord button.
- **Requested inversions:** Em7/G, Gmaj6/G and Cmaj7/B, tested in both 48 (8×6), 72, 96 and 120 bass presets under each of the eight analytical register configurations. A candidate is accepted for an explicit inversion only if the **nominal modeled** lowest pitch class matches it.
- **Physical constraints:** selected buttons exist on the chosen preset, unique button IDs, mixed-mode maximum button count and weighted hand-span limit.
- **Harmonic invariants:** computed pitch classes agree with each result's Exact/Approximate classification; mixed-mode candidates add no foreign pitch classes; visual reference markers do not count as sounded notes.
- **Scaling invariance:** candidate identity, recommendations and order remain unchanged across tested diagram sizes/spacings for selected 24-, 48-, 72-, 96- and 120-bass configurations.
- **Different harmonic identities:** Em7/G and Gmaj6 may cover the same pitch classes but preserve distinct requested roots and inversion semantics.

**Expected limitations:** The smallest presets cannot reproduce every requested chord, so the search may correctly return an unavailable result. Alternative physical positions and register models can change which inversion-qualified realizations exist. A register setting specifies **one nominal pitch per tone**, not the measured reed spectrum. When **Follow configured Stradella registers** is enabled under Sound, La Melodiosa requests those nominal MIDI pitches (transposing nearby samples where necessary); it still cannot guarantee the acoustic behavior of a particular real accordion.

## Related regressions completed in this release audit

The following suites passed individually using the offline harness:

- `stradella-register-model.test.ts`, `stradella-requested-bass.test.ts`
- `stradella-registral.test.ts`, `stradella-reinforcement.test.ts`
- `stradella-registral-ranking.test.ts`, `stradella-registral-explanations.test.ts`
- `stradella-four-level-notes.test.ts`, `contextual-titles.test.ts`
- `stradella-ranking.test.ts` — 117 ranking/geometry configurations
- `treble-chord-finder.test.ts` — 321 Auto cases
- `harmony-explorer.test.ts`, `harmony-integration.test.ts`, `harmony-progression.test.ts`
- `notation.test.ts`, `binary-controls.test.ts`

The broader `chord-logic.test.ts` exhaustive suite **did not finish within the execution window**. It is not listed as passing in this audit.

## Current release limitations

The original configuration matrix and focused regressions were run through the offline TypeScript harness, not a browser or an installed Vite build. Later release increments also added sampled register-following playback and four-level explanations; those features have focused tests, but this matrix is not evidence of a successful production build or acoustic validation.

## Remaining verification gates

- `npm ci --offline` failed because a required dependency archive was not cached (`ENOTCACHED`, for `zod-validation-error`).
- Consequently, `npm run build` could not complete: type definitions `vite/client` and `node` were unavailable. This is a dependency/environment limitation, **not** proof of a successful compile. Run the actual project toolchain with installed dependencies before release/deployment.
- The ABC playback regression could not be run without `abcjs`.
- Visual, mouse/keyboard, SVG/PNG output, browser navigation, live synthesizer and La Melodiosa listening checks remain manual release gates.

Suggested local commands (from the project root):

```powershell
npm ci
npm run test:configurations
npm run test:chords
npm run test:all
npm run lint
npm run build
npm run dev
```

In the browser, inspect at least the 8-, 48- (both layouts), 72-, 96- and 120-bass configurations, and switch both analytical register groupings independently. Confirm that requested slash-bass filters, contextual titles, four explanatory note toggles, and Previous/Next update together. Confirm SVG and PNG exports and both sound engines by listening; switching the **Follow configured Stradella registers** setting changes nominal La Melodiosa sample playback, but does not alter harmonic validity or the search rankings.
