# Accordion Tools — Developer Guide

The rules to follow when changing the code: who owns what, which contracts other parts rely on, and how to test. It describes the current code only; how it got here is in [`VERSION_HISTORY.md`](../../VERSION_HISTORY.md) and, for the v0.16.0 restructuring, the [modularization roadmap](modularization-roadmap.md).

## Documentation map

- `docs/*.md` are the **user guides**. The app bundles them into its documentation viewer, so write them for players: on-screen names, plain language, no file paths, function names, settings keys or version notes. Links between guides work in the viewer; links to `docs/internal/` should use full GitHub URLs.
- `docs/internal/` is for maintainers and is not bundled:
  - this guide;
  - [`guide-implementation-notes.md`](guide-implementation-notes.md): engine rules and data flow behind each user guide;
  - [`settings-file-reference.md`](settings-file-reference.md): every settings key, versions and migrations;
  - [`bass-pattern-format.md`](bass-pattern-format.md): the pattern and progression file format;
  - [`adding-interface-languages.md`](adding-interface-languages.md);
  - [`test-suite-maintenance-audit.md`](test-suite-maintenance-audit.md): how the tests are organized;
  - historical records: [`modularization-roadmap.md`](modularization-roadmap.md), [`validation.md`](validation.md), [`responsive-validation.md`](responsive-validation.md), [`release-v0.16.0-validation.md`](release-v0.16.0-validation.md), [`instrument-profiles-design.md`](instrument-profiles-design.md), [`localization-plan.md`](localization-plan.md).

## Code ownership

| Layer | Main files | Responsibility |
| --- | --- | --- |
| Diagram/layout generation | `src/stradella.ts`, `src/treble.ts`, `src/pianoTreble.ts` | Produce physical `DiagramButton` positions and note identities |
| Music definitions | `src/music.tsx`, `src/music/chordDefinitions.ts`, `src/music/chordVoicingPolicy.ts` | Pitch classes, chord/scale intervals, and permissible omissions |
| Stradella candidate search | `src/tools/stradellaChordFinder/*.ts`, `src/tools/stradellaChordFinderTools.ts` | Generate, validate, deduplicate, and rank realizations of a requested chord |
| Registral interpretation | `registralAnalysis.ts`, `registralPreference.ts`, `registralExplanation.ts` in the Stradella finder directory | Derive structural roles of sounded bass versus preset-chord buttons, apply limited ranking preference, and explain conditional interpretations |
| Harmony and progressions | `src/tools/harmonyExplorer/*.ts` | Shared-note analysis, musical motion, and global progression optimization |
| Playback | `src/sound.ts`, `src/laMelodiosa.ts`, `src/audio/` | Convert selected buttons into nominal sounding pitches, render synthesizer/sample audio and schedule players on the audio clock |
| Import/notation | `src/tools/abcPlayerTools.ts`, `src/tools/bassPatternPlayerTools.ts` | Parse musical events, choose physical buttons, and create notation/export formats |
| Instrument state | `src/instrument/useInstrumentState.ts` | Physical layout selection and four nominal Stradella register fields (separate from sound configuration) |
| Settings schema and I/O | `src/settings/settingsSchema.ts`, `src/settings/settingsPersistence.ts`, `src/settings/settingsMigrations.ts` | Partial JSON contract, versioned migrations, defaults fetch, import parsing and download |
| Settings validation and export projection | `src/settings/settingsController.ts` | Distinct startup/import validation, old aliases, typed state-owner callbacks, and ordered export serialization |
| Language preference | `src/settings/useLanguageSettings.ts` | Persisted language preference, browser-language changes, document language, and translation callback |
| Scale Finder feature | `src/features/scaleFinder/useScaleFinder.ts` | Root/pattern, row limit, path display, active state, and treble/Stradella button-selection memoization (original engines retained) |
| Treble Chord Finder feature | `src/features/trebleChordFinder/useTrebleChordFinder.ts` | Root/chord type, inversion, octave, voicing preferences, active state, and unchanged treble button-selection delegation |
| Stradella Chord Finder feature | `src/features/stradellaChordFinder/useStradellaChordFinder.ts` | Finder request and explanation-display state, search-input forwarding, ranked result selection, reset on physical/register changes, and exact progression realization handoff by played button IDs; instrument register model is an input |
| ABC Player feature | `src/features/abcPlayer/useAbcPlayer.ts` | Editor/file/example state, manifest fetch and validation, tempo and transport state, mapping preferences, notation visibility, and memoized two-voice parsing and physical-button mapping |
| Bass Pattern Player feature | `src/features/bassPatternPlayer/useBassPatternPlayer.ts` | Bundled and custom patterns, chord progression library, editor validation/save/remove, historical localStorage key, settings setters, transport highlighting and Stradella-only derived events |
| Sequence/Recording feature | `src/features/sequences/useSequenceState.ts` | Ordered recorded button IDs, path/number display preferences, notation visibility, and current physical-button identity lookups |
| Harmony Explorer feature | `src/features/harmonyExplorer/useHarmonyExplorer.ts` | Circle configuration/selection, diatonic and family filters, display options, derived relationships and localized explanations; chord engine remains in tools |
| Progression Assistant feature | `src/features/progressionAssistant/useProgressionAssistant.ts` | Edited/recorded progression state, stable incremental ID ref, optimization preferences, notation/transport UI state, Stradella-only derived plan, preview and sounding-button highlighting |
| Diagram appearance state | `src/diagram/useDiagramAppearanceState.ts`, `src/instrument/sizePresets.ts` | Shared geometry/display/title settings and unchanged treble/piano size presets, not instrument construction or sound |
| Diagram overlay/fingering state | `src/diagram/useDiagramOverlays.ts` | Selected physical IDs, fingering draft/placement, mark/toggle/clear actions; renderer components and audio playback are separate |
| Annotate Diagram state | `src/features/annotateDiagram/useDiagramAnnotations.ts` | Free and button-anchored text notes, formatting controls, inline editor/ref, SVG-coordinate anchor calculation, original note creation |
| Application navigation and shell | `src/app/toolRegistry.ts`, `src/app/useWorkspaceNavigation.ts`, `src/app/components/` | Owns typed tool destinations, workspace/section/panel navigation, the outer DOM frame and toolbar controls; not sound or musical payloads |
| Application composition | `src/App.tsx`, `src/app/views/` | Layout-only composition of the shell and the Settings, Tools and Workspace views |
| Transitional controller | `src/app/useAppController.ts` | Hook order, feature adapters and derived diagrams, transport and reset orchestration, settings snapshot, typed view prop groups. Still large; split it further without creating a new monolith or global store |
| Cross-tool command ordering | `src/app/crossToolCommands.ts` | Pure typed transfer/destination command sequencing with payloads and React state owned by callers |
| Interface localization | `src/i18n/catalog.ts`, `src/i18n/context.tsx`, `src/i18n/useI18n.ts`, `src/i18n/{en,es,fr,pt,it,de}.ts` | Keep typed interface catalogs and language selection separate from musical identities; `LanguageProvider` and the `useI18n()` hook live in separate modules |

Keep these layers apart: harmonic validity uses pitch classes; ergonomics uses physical button coordinates; sounding pitches and octaves belong to playback; registral explanations describe button roles and may only suggest an inversion. Do not derive one from another unless the conversion is explicit and reliable.

## Application shell and navigation

- `src/App.tsx` only composes `LanguageProvider`, `AppShell`, the Settings/Tools sidebar and `WorkspaceView`. The views in `src/app/views/` receive typed prop groups (`AppControllerModel["settings" | "tools" | "workspace"]`); do not put musical state in them.
- `src/app/toolRegistry.ts` defines the eleven tool IDs. `toolDestination()` is pure. `useWorkspaceNavigation()` owns panel visibility, workspace and the active tool/settings section; it holds no musical results, timers or imports. Only the Progression Assistant forces the Stradella side when opened from a toggle.
- `navigateToTool()` handles workspace, side and panel only. Audio stops and data transfers belong to the call sites and to `src/app/crossToolCommands.ts`, which fixes their order. Keep `"transfer"` (clears the preview and stops the Bass Pattern Player) distinct from `"preview"` (keeps both). A Harmony-to-Finder transfer resets the realization; a progression-step-to-Finder transfer keeps the pending match by played-button IDs.
- `AppShell.tsx` holds the outer DOM; `WorkspaceToolbar.tsx` the toolbar, its menus (Reset, Download) and their outside-click/Escape handling. Toolbar toggles are icon buttons with `aria-pressed`, `aria-label` and `title`. `fitToolbar()` lays the toolbar out on one row and adds `.topbar-compact` only if that row overflows; compact mode hides the Settings, Tools, notation, Reset and Download labels visually (they stay in the accessible name) and shows icons.
- Every collapsible section header has `aria-expanded`; use `CollapsibleSection` for new ones.

### Phone workspace

Up to 620 CSS px the left panel becomes a modal bottom sheet. `src/app/usePhonePanel.ts` owns only transient state: visibility, media query, Escape/Tab handling, focus return, and closing on workspace changes or on tool changes made from outside the sheet. Expanding a tool inside the sheet keeps it open. The same `ToolsView` and `SettingsView` stay mounted; opening an already active panel must not toggle it closed. On phones the toolbar shows a workspace switcher, a Tools button and a `details` overflow menu with the same callbacks as the desktop toolbar. The workspace and inspector are inert while the sheet is open.

Up to 860 CSS px the diagram offers Readable (scrolling) and Fit views through `mobileDiagramView`. This never changes the SVG `viewBox`, the instrument geometry or exports; `.canvas-wrap` stays the direct parent of the exported SVG. Neither phone state is saved in settings.

## Playback

- **Audio clock.** `src/audio/audioClock.ts` places timed notes on the Web Audio clock: a timer wakes `AUDIO_LOOKAHEAD_MS` (150 ms) early and passes an exact time to `playButtonSound(button, options, { at, durationMs })`; a second timer lights the button when the note is heard. The ABC Player, Bass Pattern Player, Progression rhythms, Sequence, arpeggios and the Harmony recording all use it. Completion and pause bookkeeping stay on wall-clock time. Infinite Bass Pattern loops prepare each cycle twice the look-ahead before it starts.
- **Note lengths.** Timed players sound each note for its written length times `soundOptions.articulation` (setting `soundArticulation`, default `DEFAULT_NOTE_ARTICULATION` = 0.85); the highlight lasts as long. `soundNoteDurationMs` applies only to untimed clicks and previews.
- **Starting.** `startWhenSamplesReady()` delays a start until `prepareSamplesFor()` has decoded the needed samples (the playback bar shows Loading sounds…) and cancels it if `stopAllSound()` runs first. `src/audio/playbackStart.ts` takes typed ports: an ABC start must not run for an empty sequence, and a Bass Pattern start must not advance the loop counter without events. Keep the stop/cancel, Finder deactivation, clock capture and scheduling order.
- **Stopping.** `src/audio/playbackLifecycle.ts` holds the ordered stop/pause side effects; cancel timers before stopping sound. `src/audio/playbackTransport.ts` clears per-feature timers. `src/audio/playbackScheduling.ts` owns ABC and Bass Pattern schedules.
- **Transport UI.** `src/app/components/PlaybackBar.tsx` is the only transport. `WorkspaceView` builds one `PlaybackTransport` for the active player from the controller's functions. The Progression Assistant and Sequence run inside the sound engine; their playing state (`soundEnginePlayer`) ends on their `onDone` or on any `stopAllSound()`, which notifies `onStopAllSound()` listeners.
- **Progression rhythms.** `src/audio/progressionPulsePlan.ts` is the single planner for `block`, `oom-pah`, `waltz` and `march`. Beat 1 is the lowest nominal sounding bass/counterbass among the played buttons; everything else sounds on the other beats. Without a bass button the root-bass fallback supplies beat 1 without changing `playbackButtons`; an empty remainder gives rests, never a repeated bass. The same output feeds the scheduler, the highlights and the ABC notation.
- **Sound settings.** `src/audio/useSoundSettings.ts` owns sound preferences and builds `SoundOptions`. The instrument hook owns the register model; `laMelodiosaFollowStradellaRegisters` is only the switch that lets playback use it.

## Diagram rendering and export

- `DiagramSvgSurface` holds the root SVG, classes and `viewBox`. `DiagramButtonLayer`, `DiagramConnections` and `DiagramAnnotationsLayer` keep the physical button IDs and drawing order and never infer playable notes from highlights.
- Each button group is `role="button"` with a name such as "C, Root note", one roving tab stop, arrow-key movement along and between rows, and Enter/Space acting as a click. `data-focus` marks highlighted buttons (`active`) and the C reference (`home`); in the Readable phone view `scrollDiagramToFocus()` centres them when the highlighted set changes, not during playback and not when already visible.
- `cloneSvgWithEmbeddedStyles()` strips `role`, `tabindex`, `aria-label`, `data-focus` and `data-button-id`, so exports contain only the drawing.
- `src/diagram/diagramGeometry.ts` is a pure sizing function; both the on-screen viewport and PNG dimensions depend on its numbers. `scripts/fixtures/diagram-geometry-reference.json` freezes five reference results.
- PNG export calls `makeSvgCanvasSafe()` (`src/svgRasterExport.ts`) while the diagram is mounted, converting the HTML `foreignObject` footer and interval chart to SVG primitives so the canvas is not tainted. When changing footer content, check that the visible text and chart survive conversion, not merely that `toBlob` succeeds.
- `src/diagram/stradellaBatchCapture.ts` selects and serializes each candidate synchronously (`flushSync`) and restores the original realization in `finally`; ZIP encoding happens afterwards. `src/diagram/diagramExport.ts` owns filename rules (ASCII-safe, Windows-reserved names avoided), SVG/PNG dispatch and pointer-to-viewBox conversion.
- Diagram state: `useDiagramAppearanceState()` (sizes, spacing, visibility, titles), `useDiagramOverlays()` (selection and fingering by physical ID; no audio), `useDiagramAnnotations(buttonSize)` (text notes and anchor positions). Changing the physical layout or resetting clears overlays and notes.

## Startup payload and deferred imports

A first visit downloads only what the diagram needs.

- Only the English catalog is in the startup bundle. `loadInterfaceCatalog()` loads the others; `main.tsx` loads the visitor's language before mounting; `translate()` falls back to English for an unloaded catalog. Only tests may import `src/i18n/allCatalogs.ts`.
- The Treble and Stradella Chord Finder, Harmony Explorer and Progression Assistant panels, `HarmonicCircle`, `DocumentationViewer`, the ABC engine (`abcEngineLoader.ts`, loaded on the first nonempty score) and `abcjs` (`notationService.ts`, ignoring stale renders) are lazy. Their state hooks stay mounted. Never add a static import of `abcPlayerTools.ts` or `abcjs` on the startup path.
- La Melodiosa samples are preloaded after the first pointer or key gesture, for the side in use only; `unlockAudio()` creates the `AudioContext` inside that gesture.
- `npm run build:analyze` checks the lazy chunks, a 200 KiB gzip budget for the initial JavaScript and a 16 KiB budget for startup assets. `scripts/stradella-search-budget.test.ts` keeps Chord Finder searches under 40 ms (p95).

## Settings

Three operations differ on purpose: `applyStartupSettings` (defaults file, with the stored-language precedence check), `applyImportedSettings` (valid fields of a partial file, persisting the language) and `collectCurrentSettings` (fixed key order). Omitted fields leave state unchanged; aliases such as `roman`/`tonal-function` and `bassPatternBarsPerChord` keep working. `SettingsSetters` must hold stable React setters so the async defaults effect does not restart.

Documents pass through `migrateSettingsDocument()` before any setter runs. To add, rename or retire a key, follow the steps in [`settings-file-reference.md`](settings-file-reference.md#versions-and-migrations). `scripts/settings-controller-compatibility.test.mjs` replays recorded import traces and checks the exported key order against `scripts/settings-export-keys.json`.

## Feature hooks

- **Finders.** Opening any tool other than a Chord Finder deactivates both Chord Finders (highlights and Results panel) without touching their chord or selected realization. `useScaleFinderState()`, `useTrebleChordFinderState()` and `useStradellaChordFinderState()` expose individual setters for settings import. Result hooks receive the current diagram buttons and never rebuild `DiagramButton` identities or re-sort engine output. The Stradella hook owns the request, requested bass (root position by default, with `resolveRequestedBass()` falling back to any bass), limits, selected realization, note levels and a pending cross-tool signature; it receives the instrument's register model and matches handoffs by the sorted IDs of `playbackButtons`.
- **ABC Player.** `useAbcPlayerState()` owns the editor, file/example choice, manifest fetch (`cache: no-store`, entries validated individually), tempo, transport position and mapping preferences. An empty score keeps `tempoBpm: 180` and the empty-score diagnostic.
- **Bass Pattern Player and Sequence.** Pattern events are in meter units; `bassPatternBeat(meter)` gives the tempo beat (dotted in compound meters) and is used by playback and the ABC, LilyPond and MIDI exports alike. `useBassPatternState(t)` owns the built-in and custom libraries (localStorage key `accordionTools.customBassPatterns.v2`). `useSequenceState()` keeps recorded IDs in append order and reconnects them to the current buttons without substitutes.
- **Harmony Explorer.** Relationships are modulo-12 pitch classes and common-tone counts, not physical register overlap or reach.
- **Progression Assistant.** Chord Finder results are cached per layout (a `WeakMap` keyed by the button array), so moving a weight slider only re-runs the transition search. `useHarmonyProgressionResults()` always generates Stradella buttons for optimization and passes `maxRealizationsPerChord: 5` to the Auto shortlist; `progressionRealizationsForChord()` lists every playable candidate for the ← → controls. Pinned choices are keyed by stable step ID and by their `playbackButtons` signature, constrain only their own step, and are pruned when the chord is removed or the layout changes. The eye selection (`progressionNoteSelection.ts`) is also keyed by step ID and session-only. Presets come from the Bass Pattern Player catalog through `progressionPresets.ts`; unsupported numerals are rejected, never reduced. All chord types come from `CHORD_FINDER_OPTIONS`; Harmony family IDs convert through `finderPatternForHarmonyFamily()`, and a missing mapping stays unavailable.

## Results inspector

`resolveWorkspaceInspector()` (`src/app/inspector/inspectorSelection.ts`) decides whether the workspace reserves an inspector slot. `WorkspaceInspectorSlot` lazy-loads the tool content; `WorkspaceInspectorFrame` supplies the frame. The Stradella Chord Finder and the Progression Assistant provide content. The tool's hook stays the only owner of the selection: rows call its setter with the original engine index. `stradellaInspectorRows.ts` derives rows from `playbackButtons`, keeps the original order, and never changes the selection when a filter hides the selected row.

## Stradella engine

### Result contract

`src/tools/stradellaChordFinder/results.ts` builds each `StradellaChordFinderResult`:

- `buttons`: what the diagram may highlight, including visual reference markers.
- `playbackButtons`: the buttons actually played. Use these for coverage, registral analysis, playback and rhythms.
- `coveredPitches`, `missingPitches`, `extraPitches`: pitch classes against the requested chord.
- `exact`: every required pitch class present and nothing foreign, regardless of octave.
- `registral`: button-role interpretation with confidence `button-structure-only`, not an octave map.
- `recommended`: a curated suggestion, not a validity class.

The root-bass reference in Chord buttons only mode is never played and never counts as root support.

### Candidates and ranking

`searchBassAndChordButtons.ts` combines chord buttons, bass/counterbass buttons or both, with omissions from `chordVoicingPolicy.ts` (never foreign pitch classes). A button that adds no new pitch class is rejected, except one root bass/counterbass reinforcing a root already in an otherwise valid chord-button recipe. Button tones are cached and compared as bitmasks; practicality is checked before redundancy. Results are deduplicated by recipe, not truncated; up to three extended-chord results are Recommended (complete, minimally reduced, shell).

The diagram's x axis is the instrument's circle-of-fifths direction; `utils.ts` weights it by 1.10 in the reach estimate. Reach is measured in Stradella column spacings, so display size never changes the ranking. Compactness is the maximum pairwise weighted distance plus 0.25 times the mean. A distinct root bass is worth one point, an extra button costs three. These are heuristics, not biomechanics. When changing scoring, keep the diagram-size invariance, stable tie-breaking and the representative chord tests.

### Registers, density and notes

- `registerModel.ts` maps `playbackButtons` to one hypothetical pitch per tone from the bass and chord ranges (`C-B` or `F-E` grouping; with `F-E`, C to E sit an octave above F). Its lowest pitch is modeled, never measured, and it is not used by candidate search or ergonomic scoring.
- `registralAnalysis.ts` reads only `playbackButtons`. One non-root bass with chord buttons suggests a slash chord; several bass pitches are ambiguous; chord buttons alone have no separate root bass.
- `voicingDensity.ts` works on distinct configured MIDI notes. Its capped cost stays below requested bass, button economy and completeness and never discards a valid chord.
- `diagramAnnotations.ts` produces the four note lines; `StradellaNoteLevels` only toggles them. `explainStradellaRealization()` is independent of the toggles. Never derive a chord identity from a pitch-class set.
- `src/tools/contextualTitles.ts` formats titles. An explicit slash bass reflects the request; a different modeled lowest note is reported as such. Titles are separate from the ASCII recipe filenames.

## La Melodiosa samples

`notesForButton()` uses the register model's MIDI pitches when `source === "la-melodiosa"` and `laMelodiosaFollowStradellaRegisters` is true. The engine picks SFZ regions in register I, II or III and transposes with `playbackRate`, extrapolating from the nearest region outside the mapped range. Never fall back to `scheduleTone()` in sampled mode: a missing sample is a warning and a silent note. The 100 WAV files in `public/samples/la-melodiosa/audio/` are canonical; keep the CC-BY attribution, the original README, SFZ and preset files, and `FILE_MAP.txt`.

## Interface conventions

- Persistent two-way choices use `SegmentedChoice` (both options visible, `aria-pressed`); show/hide commands use `BinaryChoiceButton`; three or more options use a dropdown.
- `src/App.css` defines `--ui-control-font`, `--ui-support-font`, `--ui-section-font`, `--ui-heading-font`, `--ui-dense-font` and `--ui-control-leading` on `.app`, adjusted by the density modes. Do not apply them to diagram SVG text, the explanation footer or the voicing chart, which follow their own settings and measured export geometry.
- `HelpTip` is a keyboard-operable portaled tooltip; keep it in the same `.label-line` as its text.
- Every visible string goes through `t()`, whose key type rejects unknown keys at compile time. See [`adding-interface-languages.md`](adding-interface-languages.md).

## Testing

- `npm run test:all` runs the unit and integration tests in `scripts/` with `tsx` and Node. They import or transpile the real modules and check results, call order and state transitions.
- `npm run test:e2e` runs the Playwright browser tests in `e2e/` against the production build (one-time setup: `npx playwright install chromium`). They cover every tool and settings section at desktop and phone sizes with no console errors, Chord Finder results, Progression Assistant editing, optimization time and playback, the Harmony recording, the ABC and Bass Pattern players, SVG/PNG/ZIP downloads, settings save and load (including a v0.17.0 file), keyboard use of the diagram, the phone sheet and a Spanish interface with no English left over.
- `npm run test:release` checks release metadata, documentation links, the bundle-audit logic and that every test file is wired into a script.
- **Do not write tests that read source files and match their text.** They break on harmless refactors and pass on real regressions. Test exported functions, rendered output or browser behaviour instead. Reading a source file to transpile and execute it is fine.

See [`test-suite-maintenance-audit.md`](test-suite-maintenance-audit.md) for the script layout.

## Before a release

1. `npm ci`
2. `npm run verify:release` (lint, `test:all`, `test:release`, `build:analyze`)
3. `npm run test:e2e`
4. Listen in a real browser: La Melodiosa and the synthesizer, the four Progression rhythms, ABC playback with Pause/Continue, and a Bass Pattern loop.
5. Check representative chords: Em7 (E bass + G major), Cmaj7 (C bass + E minor), C11, Cm11, C13 and the Cmaj13 alternatives, with Requested bass on the root and on Any.

## Commenting standard

Comment why a constraint exists, the units and orientation of a calculation, the meaning of public result fields, and the limits of musical assumptions, next to the code. Prefer short JSDoc on public or non-obvious functions. Do not narrate JSX or restate the obvious. Update this guide when a contract changes.
