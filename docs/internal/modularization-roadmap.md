# Modularization roadmap — work toward v0.16.0

**Status:** in progress, unreleased. **Base release:** v0.15.28. This document describes implementation boundaries and migration gates; it does not describe a completed modular architecture.

## Motivation and invariants

`src/App.tsx` currently owns tool controllers, settings application, diagram rendering, playback orchestration, and exports. The aim is for it eventually to assemble the application shell. Migrate incrementally: no changes to chord results, ranked realizations, default controls, SVG/PNG/ZIP and notation export content, sound (including sample mapping), localization, or accepted older JSON settings files.

The analytical Stradella register model is **instrument configuration**, not sound configuration. Its `bass` and `chord` ranges are modeled starting octaves and C–B/F–E groupings, not physical reed measurements. Playback-specific settings (`soundSource`, sample registers, volume, `laMelodiosaFollowStradellaRegisters`) remain separate. A future adapter may consume the instrument's *nominal* model when sampled playback follows that model; never merge these state domains.

## Phase 1: initial extraction (implemented in this patch)

| Module | Owns | Intentionally does not own |
| --- | --- | --- |
| `src/instrument/useInstrumentState.ts` | Side, Stradella bass count, treble layout/rows/size, piano range, octave labels, four nominal register fields, and their derived `stradellaRegisterModel` | Sound source, La Melodiosa sample registers, playback settings, chord-finder request/realization state |
| `src/settings/useLanguageSettings.ts` | Language preference, browser-language observation, `accordionTools.interfaceLanguage.v1` persistence, document `lang`, and translation callback | Musical terminology or catalog definitions |
| `src/settings/settingsSchema.ts` | Exact existing partial JSON settings type, including historical aliases | Runtime validation or migrations |
| `src/settings/settingsPersistence.ts` | Fetching editable defaults with `cache: no-store`, JSON parsing, and JSON download (original filename/indentation) | Applying setters or modifying import precedence |
| `src/App.tsx` (temporary compatibility adapter) | Existing setter-by-setter validation, import precedence, `collectCurrentSettings()`, visual state, tool state, rendering, exports, and playback orchestration | The relocated state ownership and settings file I/O |

The initial extraction deliberately retains existing individual React state setters and the current `default-settings.json` / settings-export key order. A future settings-controller migration must explicitly test the distinction between *editable defaults on startup*, *persisted interface language*, and *partial imported JSON applied to a running session*; these paths have distinct validation behavior today.

## Remaining stages — not yet implemented

1. **Settings controller:** extract validation/application and collection behind a typed adapter; test partial legacy import, precedence, ignored unknown keys, and round-trip/export identity. Do not silently normalize unsupported enum values or change fallback semantics.
2. **Feature controllers:** give each tool a dedicated hook/reducer. Keep chord-search engines under `src/tools/` and re-export typed actions and result values, preserving original button identities. For cross-tool operations, introduce explicit commands rather than importing other feature state.
3. **Progressions, diagram, sound and exports:** separate recording, progression choice, canvas, playback cancellation/timing, and export orchestration. Maintain the distinction between highlighted buttons and actually sounding `playbackButtons`.
4. **App shell, registry and lazy loading:** introduce feature registration and optional instrument support; lazy-load heavy panels. Defer `abcjs` behind a shared asynchronous notation/parsing boundary rather than only lazy-loading its panel, since several tools render ABC notation.
5. **Stabilization:** browser-check every tool, all six languages, imported historical settings, mobile rendering, audio source switching, notation, and SVG/PNG/ZIP/MIDI/LilyPond outputs. Compare baseline fixtures, including result ordering and byte/content equivalence where applicable. Tag the validated milestone only after acceptance.

## Development and validation

Run `npm run test:modules`, `npm run test:all`, `npm run lint`, and `npm run build`, then exercise representative browser workflows. `test:modules` checks module ownership and settings I/O without changing existing regressions. Several existing tests inspect the literal contents of `src/App.tsx`; migrate these to tests against module APIs and observable outcomes **as each feature moves**, rather than weakening assertions or adding dummy source strings.

Keep comments concise: explain domain boundaries, backward-compatible serialization, octave-model assumptions, effect ordering, and shared-command invariants. Do not comment every state declaration or copy outdated implementation claims between files.
