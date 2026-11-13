# Accordion Tools — Developer Guide

The rules to follow when changing the code: who owns what, which contracts other parts rely on, and how to test. It describes the current code only; how it got here is in [`VERSION_HISTORY.md`](../../VERSION_HISTORY.md) and, for finished work, the [archive](archive/README.md).

## Documentation map

- `docs/*.md` are the **user guides**. The app bundles them into its documentation viewer, so write them for players: on-screen names, plain language, no file paths, function names, settings keys or version notes. Links between guides work in the viewer; links to `docs/internal/` should use full GitHub URLs.
- `docs/internal/` is for maintainers and is not bundled:
  - this guide;
  - [`guide-implementation-notes.md`](guide-implementation-notes.md): engine rules and data flow behind each user guide;
  - [`settings-file-reference.md`](settings-file-reference.md): every settings key, versions and migrations;
  - [`bass-pattern-format.md`](bass-pattern-format.md): the pattern and progression file format;
  - [`adding-interface-languages.md`](adding-interface-languages.md);
  - [`testing.md`](testing.md): how the tests are organized and the rules for writing them;
  - [`instrument-profiles-design.md`](instrument-profiles-design.md): a design proposal that is not implemented;
  - [`archive/`](archive/README.md): records of finished work (validation worksheets, the modularization roadmap, the localization plan, the bass-pattern audit). Nothing there is kept up to date.
- `docs/releases/` holds the notes written for individual releases; `VERSION_HISTORY.md` at the root is the complete history.

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
| Sequence feature | `src/features/sequences/useSequenceState.ts` | Ordered button IDs added in Annotate Diagram's Sequence mode, path/number display preferences, notation visibility, and current physical-button identity lookups |
| Harmony Explorer feature | `src/features/harmonyExplorer/useHarmonyExplorer.ts` | Circle configuration/selection, diatonic and family filters, display options, derived relationships and localized explanations; chord engine remains in tools |
| Progression Assistant feature | `src/features/progressionAssistant/useProgressionAssistant.ts` | Edited/recorded progression state, stable incremental ID ref, optimization preferences, notation/transport UI state, Stradella-only derived plan, preview and sounding-button highlighting |
| Rhythm Trainer feature | `src/features/rhythmTrainer/useRhythmTrainer.ts`, `rhythmModel.ts`, `treblePitchPatterns.ts`, `rhythmNotation.ts`, `rhythmScoreHighlight.ts` | Meter, template and bass-style state; the two-hand exercise built from the shared chord progressions; audio-clock scheduling; treble pitch assignment per bar; symbolic ABC for the score; and the mapping from rendered score notes to the event keys that also light buttons and timeline markers |
| Shared notation | `src/notation/notationSelection.ts`, `NotationScore.tsx`, `notationService.ts`, `stradellaNotation.ts`, `nativeNoteNames.ts`, `useNotationSettings.ts` | Which tool's score is shown and where, the one score frame (header, engraving host, download, help), symbolic Stradella writing, optional note names, and the notation settings |
| Diagram appearance state | `src/diagram/useDiagramAppearanceState.ts`, `src/instrument/sizePresets.ts` | Shared geometry/display/title settings and unchanged treble/piano size presets, not instrument construction or sound |
| Diagram overlay/fingering state | `src/diagram/useDiagramOverlays.ts` | Annotate Diagram click mode (`annotateMode`: select, finger, sequence or notes), selected physical IDs, fingering draft/placement, per-mode toggle and clear actions; renderer components and audio playback are separate. `toggleButton()` in the controller routes a click to the chosen mode only |
| Annotate Diagram state | `src/features/annotateDiagram/useDiagramAnnotations.ts` | Free and button-anchored text notes, formatting controls, inline editor/ref, SVG-coordinate anchor calculation, original note creation |
| Application navigation and shell | `src/app/toolRegistry.ts`, `src/app/useWorkspaceNavigation.ts`, `src/app/components/` | Owns typed tool destinations, workspace/section/panel navigation, the outer DOM frame and toolbar controls; not sound or musical payloads |
| Application composition | `src/App.tsx`, `src/app/views/`, `src/app/toolSections/`, `src/app/settingsSections/` | `ToolsView` and `SettingsView` are short shells that list sections from a registry; each section component holds the controls of one tool or settings group and declares the slice of the controller model it reads |
| Controller | `src/app/useAppController.ts` | Hook order, derived diagram (buttons, highlights, titles, footer geometry), click routing, tool toggles, resets and the typed view prop groups |
| Controller parts | `src/app/useAccordionPlayback.ts`, `useAccordionNotation.ts`, `useDiagramLabels.ts`, `useHarmonyActions.ts`, `useProgressionActions.ts`, `useProgressionNotation.ts`, `useSettingsTransfer.ts`, plus the pure `sideButtons.ts` | Accordion sound and transports, player notation, button and title text, Harmony playback and recording, Progression Assistant commands and notation, settings files. Each takes a typed `Deps` object built from `Pick<ReturnType<typeof useOwnerHook>, …>`, so a dependency's type always comes from the hook that owns it |
| Cross-tool command ordering | `src/app/crossToolCommands.ts` | Pure typed transfer/destination command sequencing with payloads and React state owned by callers |
| Interface localization | `src/i18n/catalog.ts`, `src/i18n/context.tsx`, `src/i18n/useI18n.ts`, `src/i18n/{en,es,fr,pt,it,de}.ts` | Keep typed interface catalogs and language selection separate from musical identities; `LanguageProvider` and the `useI18n()` hook live in separate modules |

Keep these layers apart: harmonic validity uses pitch classes; ergonomics uses physical button coordinates; sounding pitches and octaves belong to playback; registral explanations describe button roles and may only suggest an inversion. Do not derive one from another unless the conversion is explicit and reliable.

## Application shell and navigation

- `src/App.tsx` only composes `LanguageProvider`, `AppShell`, the Settings/Tools sidebar and `WorkspaceView`. `SettingsView` is fetched the first time Settings is opened; the Tools shell is in the initial download and each tool's controls are fetched when its section is first opened.
- `src/app/toolRegistry.ts` defines the nine tool IDs with their name, summary, workspace, the instrument sides they are offered on, and their order in the Tools panel (`toolsListedFor()`). `toolDestination()` is pure. `useWorkspaceNavigation()` owns panel visibility, workspace and the active tool/settings section; it holds no musical results, timers or imports. Only the Progression Assistant forces the Stradella side when opened from a toggle.
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
- **Stopping.** `src/audio/playbackLifecycle.ts` holds the ordered stop/pause side effects and `lastPlayedAbcButtonIds()`; cancel timers before stopping sound. `src/audio/playbackTransport.ts` clears per-feature timers. `src/audio/playbackScheduling.ts` owns ABC and Bass Pattern schedules.
- **Transport UI.** `src/app/components/PlaybackBar.tsx` is the only transport. `WorkspaceView` builds one `PlaybackTransport` for the active player from the controller's functions. The Progression Assistant and Sequence run inside the sound engine; their playing state (`soundEnginePlayer`) ends on their `onDone` or on any `stopAllSound()`, which notifies `onStopAllSound()` listeners.
- **Progression rhythms.** `src/audio/progressionPulsePlan.ts` is the single planner for `block`, `oom-pah`, `waltz` and `march`. Beat 1 is the lowest nominal sounding bass/counterbass among the played buttons; everything else sounds on the other beats. Without a bass button the root-bass fallback supplies beat 1 without changing `playbackButtons`; an empty remainder gives rests, never a repeated bass. The same output feeds the scheduler, the highlights and the ABC notation.
- **Sound settings.** `src/audio/useSoundSettings.ts` owns sound preferences and builds `SoundOptions`. The instrument hook owns the register model; `laMelodiosaFollowStradellaRegisters` is only the switch that lets playback use it.

## Diagram rendering and export

- `DiagramSvgSurface` holds the root SVG, classes and `viewBox`. `DiagramButtonLayer`, `DiagramConnections` and `DiagramAnnotationsLayer` keep the physical button IDs and drawing order and never infer playable notes from highlights.
- Each button group is `role="button"` with a name such as "C, Root note", one roving tab stop, arrow-key movement along and between rows, and Enter/Space acting as a click. `data-focus` marks highlighted buttons (`active`) and the C reference (`home`); in the Readable phone view `scrollDiagramToFocus()` centres them when the highlighted set changes, not during playback and not when already visible.
- `cloneSvgWithEmbeddedStyles()` strips `role`, `tabindex`, `aria-label`, `data-focus` and `data-button-id`, so exports contain only the drawing.
- `src/diagram/diagramGeometry.ts` is a pure sizing function; both the on-screen viewport and PNG dimensions depend on its numbers. `tests/fixtures/diagram-geometry-reference.json` freezes five reference results.
- PNG export calls `makeSvgCanvasSafe()` (`src/svgRasterExport.ts`) while the diagram is mounted, converting the HTML `foreignObject` footer and interval chart to SVG primitives so the canvas is not tainted. When changing footer content, check that the visible text and chart survive conversion, not merely that `toBlob` succeeds.
- `src/diagram/stradellaBatchCapture.ts` selects and serializes each candidate synchronously (`flushSync`) and restores the original realization in `finally`; ZIP encoding happens afterwards. `src/diagram/diagramExport.ts` owns filename rules (ASCII-safe, Windows-reserved names avoided), SVG/PNG dispatch and pointer-to-viewBox conversion.
- Diagram state: `useDiagramAppearanceState()` (sizes, spacing, visibility, titles), `useDiagramOverlays()` (selection and fingering by physical ID; no audio), `useDiagramAnnotations(buttonSize)` (text notes and anchor positions). Changing the physical layout or resetting clears overlays and notes.

## Startup payload and deferred imports

A first visit downloads only what the diagram needs.

- Only the English catalog is in the startup bundle. `loadInterfaceCatalog()` loads the others; `main.tsx` loads the visitor's language before mounting; `translate()` falls back to English for an unloaded catalog. Only tests may import `src/i18n/allCatalogs.ts`.
- The Treble and Stradella Chord Finder, Harmony Explorer and Progression Assistant panels, `HarmonicCircle`, `DocumentationViewer`, the ABC engine (`abcEngineLoader.ts`, loaded on the first nonempty score) and `abcjs` (`notationService.ts`, ignoring stale renders) are lazy. Their state hooks stay mounted. Never add a static import of `abcPlayerTools.ts` or `abcjs` on the startup path.
- La Melodiosa samples are preloaded after the first pointer or key gesture, for the side in use only; `unlockAudio()` creates the `AudioContext` inside that gesture.
- `npm run build:analyze` checks the lazy chunks, a 200 KiB gzip budget for the initial JavaScript and CSS together and a 16 KiB budget for startup assets. `tests/unit/chords/stradella-search-budget.test.ts` keeps Chord Finder searches under 40 ms (p95).

## Settings

Three operations differ on purpose: `applyStartupSettings` (defaults file, with the stored-language precedence check), `applyImportedSettings` (valid fields of a partial file, persisting the language) and `collectCurrentSettings` (fixed key order).

The last session is kept in the browser (`src/settings/settingsSession.ts`, key `accordionTools.session.v1`) as an ordinary settings document. `useSettingsTransfer` applies it with `applyImportedSettings` right after the defaults file, then stores `collectCurrentSettings()` half a second after the last change. Nothing is written before startup has finished, so a slow defaults fetch cannot replace the saved session with built-in defaults. A new setting is therefore persisted as soon as it is part of the export; there is no second list to maintain. `resetSettingsToDefaults()` clears the session and the saved language and reloads, which is the only reset that reaches every state owner.

`src/app/ErrorBoundary.tsx` wraps the app in `main.tsx`. Its recovery screen offers a reload and a reload that first clears the saved session, because the session is the one input that survives a reload. Omitted fields leave state unchanged; aliases such as `roman`/`tonal-function` and `bassPatternBarsPerChord` keep working. `SettingsSetters` must hold stable React setters so the async defaults effect does not restart.

Documents pass through `migrateSettingsDocument()` before any setter runs. To add, rename or retire a key, follow the steps in [`settings-file-reference.md`](settings-file-reference.md#versions-and-migrations). `tests/unit/modules/settings-controller-compatibility.test.js` replays recorded import traces and checks the exported key order against `tests/fixtures/settings-export-keys.json`.

## Feature hooks

- **Finders.** Opening any tool other than a Chord Finder deactivates both Chord Finders (highlights and Results panel) without touching their chord or selected realization. `useScaleFinderState()`, `useTrebleChordFinderState()` and `useStradellaChordFinderState()` expose individual setters for settings import. Result hooks receive the current diagram buttons and never rebuild `DiagramButton` identities or re-sort engine output. The Stradella hook owns the request, requested bass (root position by default, with `resolveRequestedBass()` falling back to any bass), limits, selected realization, note levels and a pending cross-tool signature; it receives the instrument's register model and matches handoffs by the sorted IDs of `playbackButtons`.
- **ABC Player.** `useAbcPlayerState()` owns the editor, file/example choice, manifest fetch (`cache: no-store`, entries validated individually), tempo, transport position and mapping preferences. An empty score keeps `tempoBpm: 180` and the empty-score diagnostic. The first time the tool opens empty, the controller loads `happy-birthday`; `loadAbcExample()` numbers its requests so only the latest one fills the editor. **Hands** (`abcHands`, saved): with `both` and two or more voices, `useAbcPlayerResults()` maps through `mapAbcEventsToBothHands()` (voice 1 on the treble buttons, voice 2 on the Stradella buttons, each exactly as that side alone would map it, merged by start beat). The controller builds the other side's buttons with `src/app/sideButtons.ts` (`stradellaButtonsFor`, `trebleButtonsFor`, the same builders as the main diagram), and `WorkspaceView` draws both manuals in one SVG with `AbcHandsDiagram` (captions, no title, bellows guide, row names or marks; it receives `svgRef`, so Download saves it). Phones pass one hand at a time. ABC highlights are additive (`setAbcActiveButtonIds` adds each event's buttons and its clear removes them), so both hands can be lit at once; a pause keeps `lastPlayedAbcButtonIds()` lit and a resume clears them.
- **Bass Pattern Player and Sequence.** Pattern events are in meter units; `bassPatternBeat(meter)` gives the tempo beat (dotted in compound meters) and is used by playback and the ABC, LilyPond and MIDI exports alike. `useBassPatternState(t)` owns the built-in and custom libraries (localStorage key `accordionTools.customBassPatterns.v2`). `useSequenceState()` keeps recorded IDs in append order and reconnects them to the current buttons without substitutes.
- **Harmony Explorer.** Relationships are modulo-12 pitch classes and common-tone counts, not physical register overlap or reach.
- **Progression Assistant.** Each chord is searched with `ProgressionSearchSettings`: the Chord Finder's maximum buttons, reach, gap filter, register model and bass-button rule, plus the assistant's own root-position choice, with the same fallback order as the Chord Finder. With both weights at 0 the plan therefore equals the Chord Finder's first realization for every chord (`tests/unit/chords/stradella-bass-policy.test.ts`). Chord Finder results are cached per layout (a `WeakMap` keyed by the button array), so moving a weight slider only re-runs the transition search. Each chord's search follows the Chord Finder's order: requested bass on a bass button, the same with `nextWiderHandSpan()`, the bass as lowest note, then any bass. In Auto, a major or minor triad keeps only realizations with its own chord button when one exists (`ownChordButtonKind()`); pinned choices are exempt. `useHarmonyProgressionResults()` always generates Stradella buttons for optimization and passes `maxRealizationsPerChord: 5` to the Auto shortlist; `progressionRealizationsForChord()` lists every playable candidate for the ← → controls. Pinned choices are keyed by stable step ID and by their `playbackButtons` signature, constrain only their own step, and are pruned when the chord is removed or the layout changes. The eye selection (`progressionNoteSelection.ts`) is also keyed by step ID and session-only. Presets come from the Bass Pattern Player catalog through `progressionPresets.ts` and resolve with the same `resolveRomanChord()` as the Bass Pattern Player (secondary chords, `mode: "minor"` entries); a symbol whose chord type cannot be read is rejected, never reduced. All chord types come from `CHORD_FINDER_OPTIONS`; Harmony family IDs convert through `finderPatternForHarmonyFamily()`, and a missing mapping stays unavailable.

## Results inspector

Panel widths: `src/app/panelWidths.ts` keeps the widths the user dragged the left panel and the inspector to (`null` = the density default), in localStorage under `accordionTools.panelWidths.v1`, not in settings files. `App.tsx` builds the grid tracks with `panelTrack()` (`min(<px>, 40vw)`) and renders two `PanelResizeHandle` separators on the workspace edges (not on phones, and hidden when the inspector stacks under 1120 px). `clampPanelWidth()` keeps each panel within its limits and leaves the workspace at least 480 px.

`resolveWorkspaceInspector()` (`src/app/inspector/inspectorSelection.ts`) decides whether the workspace reserves an inspector slot. `WorkspaceInspectorSlot` lazy-loads the tool content; `WorkspaceInspectorFrame` supplies the frame. The Stradella Chord Finder and the Progression Assistant provide result tables; a visible score takes the slot when the notation position is the right panel. The tool's hook stays the only owner of the selection: rows call its setter with the original engine index. `stradellaInspectorRows.ts` derives rows from `playbackButtons`, keeps the original order, and never changes the selection when a filter hides the selected row.

## Tools and Settings panels

Both panels are data-driven. `ToolsView` maps `toolsListedFor(workspace, side)` to one `CollapsibleSection` per tool, with the title and summary from `TOOL_REGISTRY` and the controls from `TOOL_SECTIONS` (`src/app/toolSections/index.ts`). `SettingsView` does the same with `SETTINGS_SECTIONS` (`src/app/settingsSections/index.ts`). `CollapsibleSection` renders its content only while open, so a tool's controls are downloaded on first use; `keepMounted` in the registry keeps a section mounted after closing when its controls hold choices of their own.

Every section component takes the whole panel model and narrows it in its own file:

```ts
type ScaleFinderSectionModel = Pick<AppControllerModel["tools"], "scaleFinderRoot" | "setScaleFinderRoot" | …>;
```

That `Pick` is the section's contract: it lists everything the section depends on, the compiler rejects a field the controller does not supply, and ESLint rejects a destructured field the section no longer uses.

To add a tool:

1. Add its id to `TOOL_REGISTRY` with `titleKey`, `summaryKey`, `workspace` and `sides`, and place it in `TOOLS_PANEL_ORDER`.
2. Create `src/app/toolSections/<Name>Section.tsx` with a default-exported component and its `Pick` model, and add it to `TOOL_SECTIONS`. Add it to `LAZY_MODULES` in `scripts/bundle-audit-lib.mjs` so the build fails if it ever joins the first download.
3. Put the tool's state in a feature hook under `src/features/`, call it from `useAppController`, and add the fields the section needs to the controller's `tools` model.
4. Add the strings to all six catalogs and a line to the smoke spec's expectations if the tool list is asserted there.

`ToolsView.tsx` itself does not change. `tests/unit/modules/tool-registry.test.ts` checks that every registered tool has controls, a translated name and summary, and is listed somewhere.

`useAppController` remains the composition root: it calls every feature hook, wires the cross-tool commands and assembles the three view models (`settings`, `tools`, `workspace`). The `tools` model is still one flat object because the workspace, the inspector and the notation presenter read it too.

## Staff notation

Every score, whichever tool produced it, goes through one path:

- `selectNotationKind()` in `src/notation/notationSelection.ts` picks at most one score from the active tool and its visibility switch (`rhythm`, `abc`, `bassPattern`, `sequence`, `progression` or `recording`). `notationLocation()` turns the `musicNotationPlacement` setting into `"right"` or `"below"`; phones and a closed inspector always give `"below"`. `App.tsx` calls both, so a tool never decides where its score goes.
- `NotationWorkspaceContent` (`src/app/inspector/`) is the only place that maps a notation kind to a tool's ABC text. It renders `NotationScore`, the shared frame with the header, engraving host, SVG download and help tooltip. It is not lazy because it owns the host element abcjs draws into. Add a new score by adding a kind and a case there, not by rendering abcjs in a tool.
- Generated Stradella scores are symbolic (`stradellaNotation.ts`): a bass or counterbass button is one bass-clef note and a chord button is one note with its quality, in conventional written octaves that do not depend on the audio registers. The `stradellaNotationMode`, `stradellaChordQualityLabels` and `stradellaMarkCounterbass` settings apply to generated scores only. Imported ABC is shown as written.
- `addNativeNoteNames()` (`nativeNoteNames.ts`) adds note letters as ABC annotations before engraving; it never edits the rendered SVG. Imported ABC is annotated only in C major or A minor.

### Rhythm Trainer

- `rhythmModel.ts` works in meter-denominator units (quarters in 2/4, 3/4 and 4/4, eighths in 6/8). A bar's harmonic root comes from the progression, never from a moving alternate-bass note.
- `rhythmEventKey()` is the one identity for an attack. Playback scheduling, the timeline markers, the diagram highlights and the score highlight (`rhythmScoreHighlight.ts`) all use it; do not introduce a second index.
- `treblePitchPatterns.ts` assigns treble pitches per bar from the Finder chord definition, independently of the rhythm template and of the Stradella registers. Its octaves are preferred staff positions, not reed octaves.
- `rhythmNotation.ts` quantizes performance gate lengths to a sixteenth-of-a-beat grid for the score only; audio and the timeline keep exact timing.
- The trainer schedules on the shared audio clock like every other player, and its state is not saved in settings files.

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

The diagram's x axis is the instrument's circle-of-fifths direction; `utils.ts` weights it by 1.10 in the reach estimate. Reach is measured in Stradella column spacings, so display size never changes the ranking. Compactness is the maximum pairwise weighted distance plus 0.25 times the mean. A distinct root bass is worth one point, an extra button costs three, and completeness is just one cost (leaving out only the plain fifth costs 0.25); every chord type is sorted by that one score. These are heuristics, not biomechanics. When changing scoring, keep the diagram-size invariance, stable tie-breaking and the representative chord tests.

### Registers, density and notes

- `registerModel.ts` maps `playbackButtons` to one hypothetical pitch per tone from the bass and chord ranges (`C-B` or `F-E` grouping; with `F-E`, C to E sit an octave above F). Its lowest pitch is modeled, never measured, and it is not used by candidate search or ergonomic scoring.
- `registralAnalysis.ts` reads only `playbackButtons`. One non-root bass with chord buttons suggests a slash chord; several bass pitches are ambiguous; chord buttons alone have no separate root bass.
- `voicingDensity.ts` works on distinct configured MIDI notes. Its capped cost stays below requested bass, button economy and completeness and never discards a valid chord.
- `diagramAnnotations.ts` produces the four note lines; `StradellaNoteLevels` only toggles them. `explainStradellaRealization()` is independent of the toggles. Never derive a chord identity from a pitch-class set.
- `src/tools/contextualTitles.ts` formats titles. An explicit slash bass reflects the request; a different modeled lowest note is reported as such. Titles are separate from the ASCII recipe filenames.

## La Melodiosa samples

`notesForButton()` uses the register model's MIDI pitches when `source === "la-melodiosa"` and `laMelodiosaFollowStradellaRegisters` is true. The engine picks SFZ regions in register I, II or III and transposes with `playbackRate`, extrapolating from the nearest region outside the mapped range. Never fall back to `scheduleTone()` in sampled mode: a missing sample is a warning and a silent note. The 100 WAV files in `public/samples/la-melodiosa/audio/` are canonical; keep the CC-BY attribution, the original README, SFZ and preset files, and `FILE_MAP.txt`.

## Interface conventions

- In Settings, every on/off preference is a checkbox labelled with what it shows or enables. Persistent two-way choices use `SegmentedChoice` (both options visible, `aria-pressed`); a show/hide command inside a tool uses `BinaryChoiceButton`; three or more options use a dropdown.
- The toolbar's view switch (Stradella, Treble, Harmony) is a segmented control because exactly one view is shown; the panel buttons beside it are independent toggles and keep the outlined style.
- The status bar names the active tool through `activeToolStatusLabel()`: sounding audio first, then an active Finder, then whichever tool is open. Tool names and the sides a tool is offered on come from `TOOL_REGISTRY` (`titleKey`, `sides`).
- Stradella row labels share one font size at which each fits the strip left of its row (`src/diagram/rowLabelFit.ts`), and the Stradella diagram is always wide enough for its last button (`calculateDiagramGeometry`). Button coordinates are never moved to make room.
- `src/App.css` defines `--ui-control-font`, `--ui-support-font`, `--ui-section-font`, `--ui-heading-font`, `--ui-dense-font` and `--ui-control-leading` on `.app`, adjusted by the density modes. Do not apply them to diagram SVG text, the explanation footer or the voicing chart, which follow their own settings and measured export geometry.
- `HelpTip` is a keyboard-operable portaled tooltip; keep it in the same `.label-line` as its text.
- Every visible string goes through `t()`, whose key type rejects unknown keys at compile time. See [`adding-interface-languages.md`](adding-interface-languages.md).

## Testing

- `npm test` runs the unit and component tests in `tests/unit/` with Vitest; `npm run test:watch` reruns the affected files while you work, and `npm run test:<area>` runs one folder (for example `test:chords`).
- `npm run test:e2e` runs the Playwright browser tests in `e2e/` against the production build (one-time setup: `npx playwright install chromium`).
- `tsc -b` type-checks the tests together with the application, so a test that passes a value the application would reject does not compile.
- **Do not write tests that read source files and match their text.** They break on harmless refactors and pass on real regressions. Test exported functions, rendered output or browser behaviour instead.

See [`testing.md`](testing.md) for the layout, the three kinds of unit test and the rules for writing them.

## Before a release

1. Set the new version in `package.json`, `package-lock.json`, `src/config/appInfo.ts` and the README, and start `VERSION_HISTORY.md` with a `## v<version>` heading. `npm run test:release` fails if these disagree or if the version is behind the newest git tag. Tag only after this is committed.
2. `npm ci`
3. `npm run verify:release` (lint, `npm test`, `build:analyze`)
4. `npm run test:e2e`
5. Listen in a real browser: La Melodiosa and the synthesizer, the four Progression rhythms, ABC playback with Pause/Continue, and a Bass Pattern loop.
6. Check representative chords: Em7 (E bass + G major), Cmaj7 (C bass + E minor), C11, Cm11, C13 and the Cmaj13 alternatives, with Requested bass on the root and on Any.

GitHub Actions runs steps 3 and 4 on every pull request and every push to `main` (`.github/workflows/deploy.yml`) and deploys to GitHub Pages only when both pass. Steps 5 and 6 cannot be automated.

## Commenting standard

Comment why a constraint exists, the units and orientation of a calculation, the meaning of public result fields, and the limits of musical assumptions, next to the code. Prefer short JSDoc on public or non-obvious functions. Do not narrate JSX or restate the obvious. Update this guide when a contract changes.
