# Automated test suite — maintenance and coverage policy

**Baseline for this update:** reconstructed v0.16.0 source with the Stradella/Progression UI patches, eye-note preview, lint correction, and test/localization hotfixes already applied. The real Windows checkout HEAD and remote publication state have **not** been independently inspected.

## Current structure

The repository currently has **70 automated `*.test.ts`, `*.test.mjs` or `*.test.cjs` files**, including the new test-inventory guard. They are grouped under npm scripts rather than migration milestones. No existing behavioral tests have been deleted or disabled. The `test:all` command now includes `test:responsive`; consequently `npm run verify:release` covers the responsive regression check without needing a separate command.

| Command | Coverage |
| --- | --- |
| `npm run test:chords` | Harmony, Finder ranking, nominal/register rules, omissions, chord configurations, diagram notes, treble chords |
| `npm run test:notation`, `npm run test:abc` | Notation, ABC parsing and examples, timing and mapped button events |
| `npm run test:harmony` | Harmony Explorer, transfer adapters, progression optimizer |
| `npm run test:controls`, `npm run test:display` | UI contracts, settings grouping, text/diagram geometry and exports |
| `npm run test:audio` | Sample and nominal register mapping |
| `npm run test:i18n` | Six languages, translated options and UI bindings |
| `npm run test:modules` | Hook ownership, cross-tool command ordering, settings round trips, lazy-load boundaries, audio/export orchestration, inspector and progression behavior |
| `npm run test:responsive` | Existing responsive layout assertions |
| `npm run test:release` | Metadata and bundle audit fixtures, plus `test-suite-integrity` |
| `npm run build:analyze` | TypeScript semantic compilation, Vite production build and initial/lazy chunk manifest audit |

The `scripts/test-suite-integrity.test.mjs` guard verifies that **every checked-in test file** is referenced by an npm script, that referenced test files exist, and that the full suite includes responsive coverage. It automatically counts files rather than assuming a fixed inventory. The test runner remains the existing `tsx`/Node workflow; the test scripts have not been replaced by an incompatible framework.

## What was modernized

- The transport-start/geometry regression and its frozen fixture have descriptive, purpose-based filenames: `playback-start-geometry.test.mjs` and `fixtures/diagram-geometry-reference.json`. The **five numerical expectations are unchanged**.
- Historical milestone wording was removed from the test-file headings, assertions, output messages, and test/fixture filenames, without removing or weakening their regression coverage. Historical documentation under `modularization-roadmap.md` remains an archive of the original work.
- Duplicate source-expression assertions for the diagram-note footer were removed; the generated four-level notes are checked by `stradella-four-level-notes.test.ts`, while the Progression eye selection and shared annotation are exercised by `progression-eye-entry.test.cjs`.
- The view/command test no longer relies on the exact name of the eye-toggle controller function; the eye-button integration has its own test. The remaining architecture checks deliberately verify module boundaries and command ordering.
- Chord-label localization uses the shared 35-type Finder catalog in all six languages. Its UI binding test now checks the translation mechanism rather than an exact expression from an obsolete implementation.

## Preserve these invariants

1. **Musical:** actual Chord Finder results, ranking order, physical and sounded `playbackButtons` identities, extended-chord omissions, pitch-class and registral distinctions, and manually pinned progression realizations.
2. **Settings:** exact 118-key export order, partial-import semantics, default/startup behavior, aliases and persistence. The captured settings traces remain reference data.
3. **Audio and notation:** pulse ordering, sample/register mapping, cancel/stop precedence, ABC timing and first-use lazy parser, MIDI/LilyPond/notation exports.
4. **Diagrams:** frozen SVG sizing, note/footer rendering, PNG/ZIP capture, filenames and annotations. Snapshot names are not evidence of an obsolete test.
5. **UI:** six locales, phone navigation, keyboard selection, shared inspector state, eye-note preview, accessible descriptions and consistent controls.
6. **Bundle:** the manifest must continue to detect eager imports of optional heavy panels and `abcjs`.

## Rules for further cleanup

Keep a test when it protects a current regression contract even if written years ago. Replace brittle string or file-location assertions with tested exports, DOM/render behavior or state transitions whenever possible. Some architectural source checks remain useful for module ownership and lazy loading; they should use precise, concise failure messages instead of dumping whole source files. Do not remove such checks unless an equivalent safeguard is in place. Avoid renaming frozen data keys or changing numerical fixtures merely for cosmetic reasons.

For browser-sensitive features, source and unit tests are not a substitute for testing audio, SVG/PNG exports, note text, focus behavior, phone sheets, initial network transfers and first-use lazy imports in a browser.

## Validation and publication

Run `npm run verify:release` in Windows CMD. The command includes `npm run lint`, `npm run test:all` (with responsive coverage), `npm run test:release`, and `npm run build:analyze`. A successful build may still report the existing nonfatal large-chunk advisory; do not alter warning thresholds merely to silence it. Inspect changed files with `git diff --check` and `git diff --cached --check` before committing. GitHub deployment, tag and Release remain separate actions.

This guide documents the test-suite policy; it does **not** claim that the complete Windows release pipeline or real-device browser checks were executed by the author of this update.
