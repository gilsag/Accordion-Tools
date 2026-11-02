# Modularization roadmap — work toward v0.16.0

**Status:** in progress, unreleased. **Base release:** v0.15.28. This document describes implementation boundaries and migration gates; it does not describe a completed modular architecture.

## Motivation and invariants

`src/App.tsx` currently owns tool controllers, state values, diagram rendering, playback orchestration, and exports; settings validation and export mapping are delegated to `settingsController.ts`. The aim is for it eventually to assemble the application shell. Migrate incrementally: no changes to chord results, ranked realizations, default controls, SVG/PNG/ZIP and notation export content, sound (including sample mapping), localization, or accepted older JSON settings files.

The analytical Stradella register model is **instrument configuration**, not sound configuration. Its `bass` and `chord` ranges are modeled starting octaves and C–B/F–E groupings, not physical reed measurements. Playback-specific settings (`soundSource`, sample registers, volume, `laMelodiosaFollowStradellaRegisters`) remain separate. A future adapter may consume the instrument's *nominal* model when sampled playback follows that model; never merge these state domains.

## Phase 1: instrument, language and settings file I/O (implemented)

| Module | Owns | Intentionally does not own |
| --- | --- | --- |
| `src/instrument/useInstrumentState.ts` | Side, Stradella bass count, treble layout/rows/size, piano range, octave labels, four nominal register fields, and their derived `stradellaRegisterModel` | Sound source, La Melodiosa sample registers, playback settings, chord-finder request/realization state |
| `src/settings/useLanguageSettings.ts` | Language preference, browser-language observation, `accordionTools.interfaceLanguage.v1` persistence, document `lang`, and translation callback | Musical terminology or catalog definitions |
| `src/settings/settingsSchema.ts` | Exact existing partial JSON settings type, including historical aliases | Runtime validation or migrations |
| `src/settings/settingsPersistence.ts` | Fetching editable defaults with `cache: no-store`, JSON parsing, and JSON download (original filename/indentation) | Applying setters or modifying import precedence |
| `src/App.tsx` (temporary compatibility adapter) | Connects stable feature state setters to the settings controller; supplies the current settings snapshot; tool state, rendering, exports, and playback orchestration | Field validators, import precedence rules, JSON projection, settings file I/O |

The initial extraction deliberately retains individual React state setters and the original `default-settings.json` / settings-export key order.

## Phase 2: settings controller (implemented in this patch)

`src/settings/settingsController.ts` now implements three separate typed entry points:

- `applyStartupSettings(defaults, setters)` validates **editable startup defaults**. It respects the persisted `accordionTools.interfaceLanguage.v1` value, including `auto`; if browser storage throws, a valid default language is accepted as before.
- `applyImportedSettings(settings, setters)` applies only supplied valid fields to the running session. An explicitly imported language goes through `changeLanguage()` and remains persisted. Legacy `chordLabelMode` (`roman`, `tonal-function`) and `bassPatternBarsPerChord` fallback behavior stay unchanged.
- `collectCurrentSettings(snapshot)` defines the **118 keys and their insertion order** in exported JSON, including historical aliases. `App.tsx` supplies the current values without deciding the JSON format.

`SettingsSetters` is a typed adapter to the current feature-state owners, held in a stable `useRef` in `App.tsx`. It does not move audio or instrument state into settings; the controller only validates and routes values. Keep setter identity stable when extracting future feature hooks. The initial startup effect still runs once and fetches editable defaults with `cache: no-store`. The parsing/downloading implementation remains in `settingsPersistence.ts`.

`npm run test:modules` now executes **golden action-trace comparisons** recorded from the original Phase 1 implementation for seven settings scenarios, plus exact export-key ordering. It checks import versus startup precedence, legacy fields, invalid values, clamping, and register/sample separation. The fixtures are regression evidence, not a new settings migration specification.


## Phase 3a: Scale Finder and Treble Chord Finder (implemented in this patch)

- `src/features/scaleFinder/useScaleFinder.ts` owns Scale Finder request/presentation state (active, root, pattern, treble row limit, path display) and computes highlights for treble or Stradella via the **existing** selection algorithms. The Stradella result continues to be computed when highlighting is hidden, matching the previous contract.
- `src/features/trebleChordFinder/useTrebleChordFinder.ts` owns Treble Chord Finder request/presentation state (active, root, chord family, inversion, octave, voicing mode, voicing-note visibility) and delegates button selection to the unchanged treble chord engine.
- `App.tsx` retains **temporary** tool exclusivity, manual-change resets, UI panel composition, shared diagram composition, playback commands, and settings adapters. Hooks return the same stable setter functions and original physical `DiagramButton` objects; import/export format, musical result ordering, and translations are not modified. Do not transfer one Finder's selection state into the other; cross-tool commands are a later stage.
- `scripts/finder-feature-modules.test.mjs` exercises the actual hook modules using React hook stubs and musical engine spies: exact defaults, inactive/active cases, branch routing, setter exposure, and physical button identity. It is included in `npm run test:modules`. Existing chord/Stradella regression scripts continue to validate musical computation independently.

## Remaining stages — not yet implemented

1. **Further feature controllers:** migrate Stradella Chord Finder, ABC Player, Bass Pattern Player, Harmony Explorer, sequences, and progression state incrementally. Keep chord-search engines under `src/tools/` and re-export typed actions and result values, preserving original button identities. For cross-tool operations, introduce explicit commands rather than importing other feature state.
2. **Progressions, diagram, sound and exports:** separate recording, progression choice, canvas, playback cancellation/timing, and export orchestration. Maintain the distinction between highlighted buttons and actually sounding `playbackButtons`.
3. **App shell, registry and lazy loading:** introduce feature registration and optional instrument support; lazy-load heavy panels. Defer `abcjs` behind a shared asynchronous notation/parsing boundary rather than only lazy-loading its panel, since several tools render ABC notation.
4. **Stabilization:** browser-check every tool, all six languages, imported historical settings, mobile rendering, audio source switching, notation, and SVG/PNG/ZIP/MIDI/LilyPond outputs. Compare baseline fixtures, including result ordering and byte/content equivalence where applicable. Tag the validated milestone only after acceptance.

## Development and validation

Run `npm run test:modules`, `npm run test:all`, `npm run lint`, and `npm run build`, then exercise representative browser workflows. `test:modules` checks module ownership, settings I/O, golden settings-application traces, exact settings export order, and Finder state/selection contracts without changing musical regressions. Some existing tests inspect the literal contents of `src/App.tsx`; update those source-level checks to follow the owning module when code moves, retaining the original assertions. For example, `stradella-four-level-notes.test.ts` checks import validation and settings serialization in `src/settings/settingsController.ts` after Phase 2, while UI-caption checks remain in `App.tsx`. Prefer module APIs and observable outcomes for new regression tests.

Keep comments concise: explain domain boundaries, backward-compatible serialization, octave-model assumptions, effect ordering, and shared-command invariants. Do not comment every state declaration or copy outdated implementation claims between files.
