# Accordion Tools — Developer Guide

This guide documents the **implementation boundaries and assumptions** that are most important when maintaining the current React/TypeScript/Vite project. It complements the user-facing guides under `docs/` and the inline comments in the source code.

For the ongoing, deliberately incremental modularization, see the [modularization roadmap](modularization-roadmap.md). Phase 6 has moved the complete Settings, Tools and Workspace JSX out of `App.tsx`. The controller in `src/app/useAppController.ts` is still large and coordinates state and audio, while the view components are presentational and tool-specific state remains in dedicated feature hooks. This is not a finished modular controller. Phase 7 introduced deferred tool panels and abcjs; Phases 8–9 extracted lifecycle/start commands, reset, batch capture, SVG geometry and status-label selectors. The controller remains transitional. Real bundle and first-use behavior still require Windows/browser validation.

### Phase 9 playback-start and SVG geometry contracts

- `src/audio/playbackStart.ts` takes typed callback ports; React state, timers, sound engine and actual playback scheduler stay in their original modules. ABC start must not run for an empty mapped sequence. Bass start must not increment the loop run counter when no events exist. Do not reorder stop/cancel, Finder deactivation, clock capture or scheduling calls; `scripts/phase9-playback-geometry.test.mjs` checks the historical call order.
- `src/diagram/diagramGeometry.ts` is a pure sizing selector. Pass current instrument layout, rendered physical button coordinates, title text, and footer display flags. Preserve its numeric results because both the SVG viewport and exported PNG dimensions are affected. `scripts/fixtures/diagram-geometry-phase8.json` contains five frozen results evaluated from the original Phase 8 expressions; they check compact treble, piano scaling, and Stradella note/chart footers.
- Prefer tests of exported commands and numeric outputs over static assumptions that expressions remain in a specific source file. The contextual-title source-location check was migrated during Phase 9, after earlier i18n and PNG-export tests were corrected.

### Phase 8 reset, transport and export-capture contracts

- `src/audio/playbackLifecycle.ts` contains the ordered, typed **stop/pause** side effects; the calling controller owns transport refs and dispatches start/schedule operations. Preserve cancellation-before-stop sequencing and beat-position math. Instrument nominal registers and sampled audio configuration remain separate.
- `src/app/resetCommands.ts` contains the original default values and exact order for Stradella Finder reset versus diagram-work reset. Do not replace these with a broad settings reset; no user-defined audio, register, language or persistent pattern preferences should be cleared.
- `src/diagram/stradellaBatchCapture.ts` synchronously selects and serializes each playable candidate; its injected selector performs React `flushSync`, and a `finally` restores the original realization even after an error. ZIP encoding is async **after** capture. Retain original filename ASCII normalization, candidate order, dimensions, and markup-safe PNG serialization.
- `src/app/workspacePresentation.ts` derives only UI status priority/grid layout. It does not drive musical or audio state. Run `npm run test:modules` and `node scripts/controller-lifecycle.test.mjs` after changes, then native build and browser checks.

### Phase 7 deferred import contracts

`src/app/controllerOptions.ts` owns presentation constants and progression-option label formatting; `src/notation/useNotationSettings.ts` owns score rendering preferences using the original defaults and JSON setters. The transitional `useAppController.ts` still coordinates transport, resets, batch exports and feature handoffs.

`src/features/abcPlayer/abcEngineLoader.ts` caches the dynamic import of the existing synchronous ABC parser and mapping engine. The ABC hook loads it on first **nonempty** source; do not add a static import of `abcPlayerTools.ts` anywhere in the application's initial dependency path, or the `abcjs` parser will return to the startup bundle. An empty source retains the exact baseline `tempoBpm: 180` and empty-event diagnostics; the first populated score has a brief asynchronous loading window. All five rendered notation panels independently use `src/notation/notationService.ts`, which dynamically imports `abcjs` and ignores stale renders. Run `npm run test:modules` (including the static import-graph check), then confirm the actual build chunks and first-use state transitions on Windows. This is a performance/code-organization refactor, not a change to musical results or to the JSON contract.

## Code ownership and data flow

| Layer | Main files | Responsibility |
| --- | --- | --- |
| Diagram/layout generation | `src/stradella.ts`, `src/treble.ts`, `src/pianoTreble.ts` | Produce physical `DiagramButton` positions and note identities |
| Music definitions | `src/music.tsx`, `src/music/chordDefinitions.ts`, `src/music/chordVoicingPolicy.ts` | Pitch classes, chord/scale intervals, and permissible omissions |
| Stradella candidate search | `src/tools/stradellaChordFinder/*.ts`, `src/tools/stradellaChordFinderTools.ts` | Generate, validate, deduplicate, and rank realizations of a requested chord |
| Registral interpretation | `registralAnalysis.ts`, `registralPreference.ts`, `registralExplanation.ts` in the Stradella finder directory | Derive structural roles of sounded bass versus preset-chord buttons, apply limited ranking preference, and explain conditional interpretations |
| Harmony and progressions | `src/tools/harmonyExplorer/*.ts` | Shared-note analysis, musical motion, and global progression optimization |
| Playback | `src/sound.ts`, `src/laMelodiosa.ts` | Convert selected buttons into nominal sounding pitches and render synthesizer/sample audio |
| Import/notation | `src/tools/abcPlayerTools.ts`, `src/tools/bassPatternPlayerTools.ts` | Parse musical events, choose physical buttons, and create notation/export formats |
| Instrument state | `src/instrument/useInstrumentState.ts` | Physical layout selection and four nominal Stradella register fields (separate from sound configuration) |
| Settings schema and I/O | `src/settings/settingsSchema.ts`, `src/settings/settingsPersistence.ts` | Existing partial JSON contract, editable defaults fetch, import parsing, and download serialization |
| Settings validation and export projection | `src/settings/settingsController.ts` | Distinct startup/import validation, old aliases, typed state-owner callbacks, and ordered export serialization |
| Language preference | `src/settings/useLanguageSettings.ts` | Persisted language preference, browser-language changes, document language, and translation callback |
| Scale Finder feature | `src/features/scaleFinder/useScaleFinder.ts` | Root/pattern, row limit, path display, active state, and treble/Stradella button-selection memoization (original engines retained) |
| Treble Chord Finder feature | `src/features/trebleChordFinder/useTrebleChordFinder.ts` | Root/chord type, inversion, octave, voicing preferences, active state, and unchanged treble button-selection delegation |
| Stradella Chord Finder feature | `src/features/stradellaChordFinder/useStradellaChordFinder.ts` | Finder request and explanation-display state, search-input forwarding, ranked result selection, reset on physical/register changes, and exact progression realization handoff by played button IDs; instrument register model is an input |
| ABC Player feature | `src/features/abcPlayer/useAbcPlayer.ts` | Editor/file/example state, manifest fetch and validation, tempo and transport state, mapping preferences, notation visibility, and memoized original two-voice parsing and physical-button mapping; audio scheduling stays in App |
| Bass Pattern Player feature | `src/features/bassPatternPlayer/useBassPatternPlayer.ts` | Bundled and custom patterns, chord progression library, editor validation/save/remove, historical localStorage key, settings setters, transport highlighting, and Stradella-only derived events; shared playback control remains in App; event scheduling and download helpers are extracted |
| Sequence/Recording feature | `src/features/sequences/useSequenceState.ts` | Ordered recorded button IDs, path/number display preferences, notation visibility, and current physical-button identity lookups; playback remains in App |
| Harmony Explorer feature | `src/features/harmonyExplorer/useHarmonyExplorer.ts` | Circle configuration/selection, diatonic and family filters, display options, derived relationships and localized explanations; chord engine remains in tools |
| Progression Assistant feature | `src/features/progressionAssistant/useProgressionAssistant.ts` | Edited/recorded progression state, stable incremental ID ref, optimization preferences, notation/transport UI state, Stradella-only derived plan, preview and actual sounding-button highlighting; shared audio and cross-tool commands remain in App |
| Diagram appearance state | `src/diagram/useDiagramAppearanceState.ts`, `src/instrument/sizePresets.ts` | Shared geometry/display/title settings and unchanged treble/piano size presets, not instrument construction or sound |
| Diagram overlay/fingering state | `src/diagram/useDiagramOverlays.ts` | Selected physical IDs, fingering draft/placement, mark/toggle/clear actions; renderer components and audio playback are separate |
| Annotate Diagram state | `src/features/annotateDiagram/useDiagramAnnotations.ts` | Free and button-anchored text notes, formatting controls, inline editor/ref, SVG-coordinate anchor calculation, original note creation |
| Application navigation and shell | `src/app/toolRegistry.ts`, `src/app/useWorkspaceNavigation.ts`, `src/app/components/` | Owns typed tool destinations, workspace/section/panel navigation, the outer DOM frame and toolbar controls; not sound or musical payloads |
| Application composition | `src/App.tsx`, `src/app/views/` | App assembles the shell and distinct Settings/Tools/Workspace view components; markup and behavior remain unchanged |
| Transitional controller | `src/app/useAppController.ts` | Existing hook order, feature state adapter/derived diagrams, reset and media orchestration, settings snapshot, and typed view prop groups; further decomposition remains pending |
| Cross-tool command ordering | `src/app/crossToolCommands.ts` | Pure typed transfer/destination command sequencing with payloads and React state owned by callers |
| Interface localization | `src/i18n/catalog.ts`, `src/i18n/context.tsx`, `src/i18n/useI18n.ts`, `src/i18n/{en,es,fr,pt,it,de}.ts` | Keep typed interface catalogs and language selection separate from musical identities; `LanguageProvider` and the `useI18n()` hook live in separate modules |

### Diagram state and annotation boundary (combined Phase 3f)

`useDiagramAppearanceState()` supplies the same per-field setters used by the settings controller for diagram sizing, spacing, visibility, text styling and titles. The treble size presets now reside in `src/instrument/sizePresets.ts`; this contains exactly the old values. Do not confuse diagram button sizing with construction of the physical Stradella register model or with sample/sound settings.

`useDiagramOverlays()` handles the diagram-local `Record<string, Overlay>` and fingering/selection behavior. It never replaces `DiagramButton` instances, converts IDs to sounding pitch, or invokes audio. `useDiagramAnnotations(buttonSize)` owns text-note drafts and the existing anchor-coordinate formula, including the `Math.min(..., buttonSize * 0.9)` cap. Notes still go through `makeTextNote`, retaining the existing timestamp-based note IDs and the original SVG positions. The pointer/viewBox conversion and diagram export logic now live in `src/diagram/diagramExport.ts`; the SVG wrapper and drawing layers are in `src/diagram/components/`. The annotation hooks remain independent of all rendering, ZIP/downloads and sound.

Changing physical layout or invoking reset still clears overlays and annotation notes from the App orchestration effect. The settings contract is unchanged: annotation font/color/size, offset, anchor, bold/italic, fingering placement, appearance and title fields must continue to import/export under the same JSON keys and order. `scripts/diagram-annotation-modules.test.mjs` protects state defaults, editing and mark behavior; visual focus, click positioning and exported output require browser smoke testing.

#
### Phase 5: workspace navigation and application shell

The **eleven tool IDs** are now defined once in `src/app/toolRegistry.ts`. `toolDestination()` is a typed, pure helper; it distinguishes Harmony from Accordion and supplies the default Stradella side for *command navigation* to the Stradella Finder and Progression Assistant. `useWorkspaceNavigation()` owns left-panel visibility, workspace selection, active tool/settings sections and their original focus/toggle rules. It does not contain musical results, timers, settings imports or instrument construction.

At Phase 5, `App.tsx` coordinated cross-tool state transfer and sound cancellation; those call sites now reside in `src/app/useAppController.ts` and their destination side-effect ordering is handled by `src/app/crossToolCommands.ts`. For example, opening a Harmony relationship in the Stradella Finder must continue to set the exact root, requested bass, chord family, activation and `playbackButtons` realization signature after routing. `navigateToTool()` only handles workspace, side and panel visibility; do not move audio stop or data-transfer operations into a generic navigation helper. Tool toggles retain the historical exception that only Progression Assistant forces the Stradella side, even though explicit commands to the Stradella Finder have a Stradella destination.

The outer DOM lives in `AppShell.tsx` and the top navigation/reset/notation/download bar in `WorkspaceToolbar.tsx`; the toolbar owns its own outside-click/Escape listeners. During Phase 5, `App.tsx` still supplied the large sidebar and workspace children; Phase 6 subsequently moved them to `src/app/views/`. App is now a layout-only component. Phase 7 subsequently deferred the larger tool panels; the transitional controller still needs decomposition. Verify with `node scripts/app-navigation-modules.test.mjs`, followed by the complete suite and browser checks (focus return, reset menu Escape, ABC stop on workspace switches, notation toggle/download and Harmony-to-Progression-to-Stradella handoffs).

### Phase 6: layout-only App and view-scoped commands

`src/App.tsx` now only composes `LanguageProvider`, `AppShell`, the conditional Settings/Tools sidebar and `WorkspaceView`. The three view components live in `src/app/views/`; each receives a typed, feature-specific prop group (`AppControllerModel["settings" | "tools" | "workspace"]`). Do not add new musical state directly to these presentational components. The controller hook still owns a substantial portion of state coordination; extraction was deliberately structural to preserve the previous hook order, asynchronous startup-default behavior, refs, exact DOM/classes and controls. Future refactoring should divide its logic without creating a different monolithic component or global store.

`src/app/crossToolCommands.ts` provides testable command ordering. Maintain the difference between `"transfer"` (clear preview and stop Bass Pattern) and `"preview"` (retain preview and leave Bass Pattern untouched); the Harmony-to-Finder transfer resets realization, while a progression-step-to-Finder transfer must preserve pending playback-button ID matching. The payload, nominal instrument register and sound settings never belong to the command module. Test with `node scripts/app-view-and-commands.test.mjs` and the full suite; review physical IDs, audio cancellation and all transfer actions in the browser.

The source-location test changes in this phase concatenate view/controller sources to preserve existing assertions temporarily. New tests should inspect observable feature APIs, render outputs and state transitions instead of file positions. Phase 7 subsequently introduced lazy loading; Phase 6 itself did not change import timing.

### Combined Phase 4: rendering, export and shared media services

- `src/diagram/components/DiagramSvgSurface.tsx` holds the root SVG ref, class names and viewBox. `DiagramButtonLayer`, `DiagramConnections`, and `DiagramAnnotationsLayer` retain original physical button IDs, JSX ordering, overlays, SVG editor behavior, and rendering coordinates. They must not infer playable notes from highlights.
- `src/diagram/diagramExport.ts` owns filename rules (including Windows-reserved names), SVG/PNG selection, asynchronously encoding captured ZIP snapshots, and screen-to-viewBox pointer conversion. App remains responsible for musical contextual titles and synchronously capturing each realization with `flushSync` **before** restoring selection; avoid moving that capture into an asynchronous loop. Original CSS embedding and rasterization remain in `src/download.ts`.
- `src/audio/useSoundSettings.ts` owns sound preferences and assembles `SoundOptions`. The instrument hook still owns the nominal Stradella register model; `laMelodiosaFollowStradellaRegisters` is only an explicit audio adapter. `src/audio/playbackTransport.ts` shares per-feature timeout clearing, and `src/audio/playbackScheduling.ts` owns ABC and Bass Pattern note-on/highlight/stop schedules. App retains cross-tool exclusivity, stop/start and progressions.
- `src/notation/notationService.ts` owns the common `abcjs` rendering options, existing render errors and score-SVG download filename behavior. Phase 7 changed its renderer dependency to an asynchronous shared import. Rendering options and error text remain unchanged, while stale in-flight renders must be ignored. First-use behavior needs browser checks across all five notation panels.
- `scripts/render-audio-services.test.mjs` executes filename/ZIP/PNG dispatch, SVG mouse coordinates, notation options, event timeouts and highlighting/gain with fake clock/DOM objects. Run via `npm run test:modules` plus the full regression suite. Do browser checks for actual SVG/PNG export, annotation editor behavior, sound source cancellation and simultaneous tool changes.

## Settings compatibility — migration contract

Maintain three distinct settings operations: `applyStartupSettings` (editable defaults, with the stored-language precedence check), `applyImportedSettings` (valid fields from a partial user file, including explicit language persistence), and `collectCurrentSettings` (exact JSON key order). They intentionally differ. Old `roman` / `tonal-function` chord-label aliases and `bassPatternBarsPerChord` must continue to work; omitted fields must leave the current state unchanged. The separate `SettingsSetters` adapter must reference **stable React state setters** so the initial async defaults effect is not restarted by unrelated renders. Avoid reading snapshot values in asynchronous callbacks when a freshly collected export is required.

The source-of-truth regression is `scripts/settings-controller-compatibility.test.mjs`: fixture traces were captured from the original inline validation logic before extraction and cover seven startup/import scenarios. `scripts/settings-export-keys.json` pins all 118 exported field names and their insertion order; a change to this ordering can affect byte-for-byte JSON exports. Run `npm run test:modules` before merging refactor branches. Do not refactor these historically different paths into one generic setter table without proving identical results.

### ABC Player feature boundary (Phase 3c)

`useAbcPlayerState()` owns the ABC editor text and visibility, loaded filename/example choices, catalog manifest validation and asynchronous example fetch, tempo, transport position/status, active physical button IDs, treble/Stradella voice-mapping preferences and the ABC notation container ref. It returns the original individual setters used by settings JSON import; **do not** modify their defaults, accepted values, or setter identities. `useAbcPlayerResults()` calls the existing `parseAbc`, voice filtering, physical button-mapping, beat counting and missing-note functions in `src/tools/abcPlayerTools.ts`. It preserves their exact `DiagramButton` references and the existing effect that synchronizes score tempo only when playback is not playing. Do not combine treble and Stradella voice streams or transform their original start beats.

`App.tsx` still owns start/pause/stop command coordination and cross-tool cancellation, but Phase 4 moved event scheduling, notation rendering and export helpers into services. This historical Phase 3c boundary must not be interpreted as the current implementation. The ABC example manifest is still loaded once with `cache: no-store`, its options are validated individually, and a failed example request still produces the original visible diagnostic text. Regression: `scripts/abc-feature-module.test.mjs` (in `test:modules`), plus the existing `test:abc` suite (ties, repeats, two-voice song examples, catalog and localizations).

### Bass Pattern and Sequence/Recording boundaries (combined Phase 3d)

`useBassPatternState(t)` owns the built-in library and custom pattern definitions, including the unchanged `accordionTools.customBassPatterns.v2` key and its JSON read/write semantics. The bundled library and progression fetches still occur together, preserve original version/validation rules, inherit shared legends where absent, and select the original pattern/progression fallback. Editor save and removal use exactly the prior messages through the current translation callback. `useBassPatternResults()` delegates to `makeBassPatternEvents`, `totalBassPatternBeats` and `bassPatternMissingItems` without changing argument order, musical contents, or physical `DiagramButton` references; it returns no accompaniment events for non-Stradella manuals. The feature exposes the original stable state setters to the 118-key settings controller.

`useSequenceState()` owns sequence recording, step numbering (incrementing in append order, even if button IDs repeat), number/arrow display settings and notation visibility. `useSequenceResults()` reconnects recorded IDs to the **current** physical buttons without altering their order or creating substitute button identities. Resetting a physical layout still clears recordings from `App.tsx`. Shared notation toggles and cross-tool exclusivity remain in App, whereas notation rendering, ABC/Bass Pattern event scheduling and diagram exports now live in shared services. Run `scripts/pattern-sequence-feature-modules.test.mjs` (part of `test:modules`) and the existing pattern/sequence display, audio, export and localization regressions after migration.

### Harmony Explorer and Progression Assistant (combined Phase 3e)

`useHarmonyExplorerState()` exposes the same individual settings setters as before and owns selection plus the original selection-reset effect. `useHarmonyExplorerResults()` computes the same sector relationships, available/visible counts, and localized diagram explanation with the unchanged Harmony engine. Pitch-class and common-tone relationships are **not** physical sound-register comparisons. Keep the default all-families/diatonic behavior, ring visibility, note-ring flag and translated explanation independent of Stradella layout and audio. `harmony-note-ring-ui.test.ts` now inspects the owning module for state and derived explanation inputs, but still verifies the App reset action and the original settings controller.

`useHarmonyProgressionState()` owns edited chords, recorded note/chord events, the monotonic ID ref, manual entry options, optimization preferences, notation visibility/ref, recorded playback state/timeouts ref, currently highlighted physical button IDs and preview index. `useHarmonyProgressionResults()` **always generates Stradella buttons for optimization**, even if another workspace/manual is selected; it delegates with the original options (`maxRealizationsPerChord: 5`), retains original button objects, and exposes a preview set based on `result.playbackButtons` only when the Assistant is active and not already highlighting playback. The preview-clamping effect and unplayable-plan handling are unchanged. `App.tsx` still handles playing/cancelling audio, recording commands, navigation between Harmony and the Stradella Finder, transfer of actual physical played-button IDs, and ABC notation rendering/downloads. Do not merge sample registers or global sound state into the Harmony/progression feature hooks.

Run `scripts/harmony-progression-feature-modules.test.mjs` via `npm run test:modules`, as well as the independent Harmony engine/integration/progression tests. Do not replace behavioral tests with tests of whether `App.tsx` contains certain lines; assertions about ownership must follow the feature file.

### Finder feature boundaries

`useScaleFinderState()` and `useTrebleChordFinderState()` expose the existing individual React setters so `settingsController.ts` continues to route imports without a schema change. Their corresponding result hooks receive the **current** diagram `buttons` and manual/visibility inputs; never rebuild `DiagramButton` identities or sort finder output in these adapters. The Scale Finder supports Stradella as well as treble; Treble Chord Finder is intentionally disabled on non-treble manuals. While the migration is in progress, `App.tsx` still coordinates mutual exclusivity and layout-change clearing; do not duplicate it inside the feature hooks.

`useStradellaChordFinderState()` owns chord root/pattern/mode, requested bass, max buttons, span, minimum modeled note gap, selected realization, root-reference marking, the four optional note levels, explanatory font/visibility, and a pending cross-tool realization signature. `useStradellaChordFinderResults()` receives physical buttons and the **instrument-owned nominal register model**, and delegates to the unchanged Stradella engines. It preserves the original empty-result fallback, selected-index clamping, index reset triggers and progression handoff matched to the sorted IDs of **`playbackButtons`**, not theoretical pitches or diagram guides. Only the actual playback recipe controls audio. `App.tsx` still coordinates tool activation/exclusivity, audio transport start/stop and synchronous batch capture, and wires settings imports through stable setters. Do not duplicate these state values in App.

The hook modules contain explanatory comments for these non-obvious contracts. `scripts/finder-feature-modules.test.mjs` and `scripts/stradella-finder-module.test.mjs` verify defaults, routing, selected recipe, and reset/handoff ordering without requiring esbuild; the existing musical tests verify candidate selection and ordering. The state hooks remain eager and mounted. Phase 7 lazily imports the large Finder/Harmony/Progression **view panels**; that does not lazily mount state hooks or change their musical calculation interfaces.

**Important separation:** harmonic validity uses pitch classes; ergonomics uses physical button coordinates; sounding pitches/octaves belong to playback; registral explanation describes button roles and may express a *conditional* inversion character. Do not derive one of these directly from a different layer unless the conversion is explicit and reliable.

## Stradella chord-result contract

A `StradellaChordFinderResult` is built through `src/tools/stradellaChordFinder/results.ts`.

- `buttons`: physical buttons that the diagram may highlight, including optional visual reference markers.
- `playbackButtons`: actual selected/sounded buttons. Use these for pitch-class coverage, registral analysis, playback, and rhythm patterns.
- `coveredPitches`, `missingPitches`, `extraPitches`: pitch classes relative to the theoretical requested chord.
- `exact`: every required pitch class is present with no unwanted classes, **independent of octave**.
- `registral`: button-role interpretation; its confidence is `button-structure-only`, *not* a measured octave map.
- `recommended`: a curated suggestion, not a different harmonic-validity class. Alternative valid recipes remain available.

The root-bass reference displayed in chord-buttons-only mode is **not played**. A key regression is to confirm that enabling it never produces artificial root support or changes playback.

## Candidate generation, omissions and deduplication

`searchBassAndChordButtons.ts` considers combinations of preset chord buttons, bass/counterbass buttons, and mixed selections. Its harmonic constraints reuse `chordVoicingPolicy.ts`. The omission policy permits conservative reductions (for instance an unaltered fifth in certain extended chords), but does not permit unrelated extra pitch classes.

The search normally rejects a selected button that contributes no new pitch class. **Exception:** one root bass/counterbass can reinforce an already-present root from an otherwise valid chord-button-only recipe. This adds a distinct physical bass role. It does *not* license redundant chord buttons, multiple arbitrary bass notes, or additional non-root bass reinforcement. Maximum button count and reach limits still apply.

Results are deduplicated by musical/physical recipe, retaining appropriate ergonomics, not arbitrarily truncated. Up to three extended-chord realizations may be marked Recommended, representing distinct approaches where suitable: complete, minimally reduced, and functional shell.

## Geometry and ranking

The Stradella diagram is drawn with its fifths direction along **diagram x**, although that direction is vertical on the physical instrument. `utils.ts` applies a small **1.10 factor** to that axis in its ergonomic distance estimate. Both diagram axes count; the factor is not a one-dimensional or row-omitting metric.

The mixed finder measures reach in units of adjacent Stradella column spacing, rather than raw display pixels. Compactness uses maximum pairwise weighted distance plus 0.25 times mean pairwise distance, then divides by that column spacing. The normalized compactness coefficient is calibrated to the former reference geometry. A one-point preference for distinct root-bass support is smaller than the three-point additional-button cost. These are heuristics, **not validated biomechanical measurements**.

When changing scoring, preserve tests for diagram-size invariance, stable tie-breaking, and meaningful physical alternatives. Do not introduce a reach cutoff without checking representative chords and multiple Stradella sizes.

## Registral interpretation and playback limits

`registralAnalysis.ts` examines only `playbackButtons`. A single non-root bass pitch accompanying preset chords can *suggest* slash-chord character; it does not prove which reed sounds lowest. Multiple distinct bass pitches are structurally ambiguous for inversion. A chord-button-only realization has no separately played root bass, even if its theoretical root occurs among the chord tones.

`src/sound.ts` maps buttons to **nominal** pitches for the synthesizer and La Melodiosa playback. Sample regions in `src/laMelodiosa.ts` reflect the supplied SFZ mapping. These software choices are not universal facts about the actual reed ranks, octave doubling, or registers of every Stradella accordion. Keep harmonic search independent of these octave assignments. Expanded explanations may discuss possible register compression and harmonic density, but should label instrument-dependent predictions conditionally.

### Configured nominal Stradella register model

`src/tools/stradellaChordFinder/registerModel.ts` maps actual `playbackButtons` into a *hypothetical* pitch set using independent bass/counterbass and preset-chord ranges. The ranges are a starting MIDI octave and grouping (`C-B` or `F-E`); for `F-E`, C through E lie in the octave **above** the starting F. The calculation returns a lowest *modeled* pitch, retaining its played-button source, and **must not** be treated as measured reed voicing. Real-world registers may produce multi-octave ranks. This model is not passed into harmonic candidate search or ergonomic scoring. When sampled playback is configured to follow the register model, the sound engine uses its nominal MIDI mapping, as documented below. The instrument state hook owns four independent setting fields, and the explanatory UI explicitly labels the result as a model prediction.

## Other key invariants

- **Progression Assistant:** global optimization uses complete progression transitions, rather than independent greedy chord selections. Retain the chosen physical `playbackButtons` through preview, exported notation, and rhythmic playback.
- **Harmony Explorer:** its graph is based on modulo-12 pitch classes and common-tone counts, not literal sounding-register overlap. Diagram ring geometry is not a physical reach metric.
- **ABC input:** `abcjs` is the primary parser. A narrower legacy parser handles exceptions; parsing errors remain visible. ABC event times are in quarter-note beats before being mapped to treble or Stradella buttons.
- **Bass Pattern Player:** its pattern coordinates and durations use **meter-denominator units**, quantized to a common integer tick grid, not necessarily quarter-note beats. Notation exports are reductions for teaching, not reed-rank transcriptions.
- **Two-state UI controls:** a `BinaryChoiceButton` shows the next action (Show/Hide, Use, etc.) while retaining the underlying setting value. Multichoice selectors should not be converted blindly.
- **Titles/exports:** `src/tools/contextualTitles.ts` formats harmonic-identity-aware display titles. Explicit Stradella slash basses reflect user intent; a different, *modeled* lowest note is reported as such, never silently substituted as an identity. Treble titles report the selected inversion and actual pitch-class completeness. This presentation layer is independent of the four note checkboxes. Contextual diagram titles are distinct from sanitized ASCII recipe filenames; do not reintroduce tool-local title controls that conflict with the central title setting.
- **La Melodiosa:** retain attribution and the original sample mapping/resources in `public/samples/la-melodiosa/`.

## Validation before release

After installing project dependencies, run:

```bash
npm ci
npm run test:all
npm run lint
npm run build
npm run dev
```

Check representative chords including Em7 (E counterbass + G major), Cmaj7 (B counterbass + C major), C11, Cmin11, C13, and the compact/shell/complete Cmaj13 alternatives. Review sampled and synthesized audio, visual root markers, physical hand positions, all Show/Hide controls, and diagram export. Record the results for the **current** release. The [earlier Stradella validation audit](validation.md) (v0.15.0–v0.15.6) and [responsive fixture report](responsive-validation.md) (v0.15.7) provide historical context only; their unverified gates are not evidence of a failed or passed v0.15.28 build.

### Commenting standard

Use comments to record *why* a constraint exists, the units and coordinate orientation of a calculation, the meaning of public result fields, and the scope/limits of musical assumptions. Keep these comments adjacent to the relevant code. Prefer short JSDoc comments on public or non-obvious functions; avoid repeating self-evident statements, narrating JSX markup, or adding comments that would become incorrect when implementation changes. Update this guide when an architectural invariant changes.

### Four-level diagram-note presentation

`src/tools/stradellaChordFinder/diagramAnnotations.ts` produces four independent, labeled concise strings (`lines`) from the selected played-button result and the optional nominal register model. `StradellaNoteLevels` toggles only these export/diagram strings. Never derive a new chord identity from a pitch-class collection, and never claim the nominal `lowestPitch` is a measured acoustic note. `useStradellaChordFinderState()` owns the selected level switches; `StradellaChordFinderPanel.tsx` provides four checkboxes beneath the master diagram-note toggle. The rendered SVG `foreignObject` uses the same filtered `lines` for both the screen and SVG/PNG downloads; height estimation must account for wrapping independently on each line. With no enabled lines, remove the entire footer.

The expanded `explainStradellaRealization` remains independent of these toggles. The settings controller owns per-field validation and ordered JSON projection; `settingsPersistence.ts` preserves the file format. `App.tsx` provides current values and stable setter callbacks. Default settings and exported/imported settings must remain backward compatible with older files lacking `stradellaNoteLevels`. Unit tests live in `scripts/stradella-four-level-notes.test.ts`.


## Stradella sampled playback and register alignment

`stradellaRegisterModel` is derived within `useInstrumentState()` and remains a nominal one-pitch-per-pitch-class analysis layer. The sound engine's `notesForButton()` optionally maps the physical played bass and preset chord buttons to these same MIDI pitches when `source === "la-melodiosa"` and `laMelodiosaFollowStradellaRegisters` is true. Otherwise the earlier playback mapping remains available. Harmony Explorer's abstract pitch-class playback does not represent physical buttons and is unchanged. Never infer a particular accordion's measured reed spectrum from the model.

The La Melodiosa engine selects SFZ regions in its original register I, II, or III and transposes the selected WAV via `AudioBufferSourceNode.playbackRate` for requested pitches, including out-of-range pitches by nearest-region extrapolation. Both the original in-range SFZ mapping and out-of-range extrapolation may require transposition of a recorded sample. Do not silently fall back to `scheduleTone()` in sampled mode: missing/corrupt assets must be disclosed through warnings, not covered with synthesized notes. The explicit `synth` source remains separate. Be mindful that large playback-rate changes modify sample duration, transients, and timbre.

## Stradella explanation and settings presentation

The analytical register state is owned by `useInstrumentState()`, remains exported under the existing `stradellaBassRegister*` / `stradellaChordRegister*` JSON keys, and is exposed in the **Instrument** settings section. Sound still controls the independent La Melodiosa pitch-mapping toggle and sample reed register. No changes are made to the nominal model, candidate generation, or playback.

`formatModeledStradellaNotes` renders ascending modeled MIDI pitches, grouping repeated same-MIDI contributions as `×N`. The four independently enabled `realizationAnnotation().lines` retain their fixed presentation-only role. The SVG `foreignObject` uses left-aligned, label-emphasized markup with extra wrap space, ensuring exports match the on-screen diagram. Level toggles are conditionally rendered under the master checkbox but persist when hidden. Arrow navigation changes only the selected realization index, without autoplay.

## v0.15.4 density, audio asset and UI invariants

`voicingDensity.ts` analyzes distinct configured MIDI notes, not pitch-class intervals. Its capped cost must remain secondary to valid requested bass, button economy and harmonic completeness; do not discard dissonant but valid chords. The same analysis feeds concise and expanded explanations and recommendation preferences. Physical coordinates remain independent of these notes.

The 100 browser-safe WAV files in `public/samples/la-melodiosa/audio/` are the canonical media. Top-level WAV duplicates were SHA-256-identical and were deleted; retain CC-BY attribution, original README/SFZ/preset reference files and `FILE_MAP.txt`. The original instrument mappings refer to unnormalized sibling WAV filenames, so standalone reuse requires restoring paths (audio data remains unchanged).

Persistent two-way choices use `SegmentedChoice` (`aria-pressed` on both visible options); hide/show commands continue to use `BinaryChoiceButton`. Keep original state setters to preserve existing import/export settings.

## PNG export of diagram explanations

`src/download.ts` embeds CSS when serializing diagrams. SVG downloads keep the HTML `foreignObject` footer, but drawing that SVG into a browser canvas may mark the canvas as tainted and prevent PNG encoding. PNG export therefore calls `makeSvgCanvasSafe` (`src/svgRasterExport.ts`) while the original diagram is mounted: it converts visible HTML footer text and nested interval-chart SVG elements to native SVG primitives using measured browser positions. Both single-diagram and batch exports use this conversion; the displayed diagram and SVG format are unchanged.

When editing footer content, ensure the conversion includes its visible text and SVG graphics, not merely that `canvas.toBlob` succeeds. Check basic and dense Chord Finder realizations, Treble notes, diagrams with no footer, and ZIP exports in a browser; font wrapping and `foreignObject` behavior vary by browser.
