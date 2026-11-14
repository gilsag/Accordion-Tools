# Plan: splitting `useAppController`

Status: agreed; steps 1 to 4 (characterization tests, platform providers, settings registry, tool coordinator) done. Written for the roadmap item that asks for a plan before any code.

Decisions taken: tools own their state through providers listed in the tool registry; files in `src/app/` stay under 500 formatted lines; Harmony Explorer owns the recorded progression and the Progression Assistant the optimized plan. When the work is finished, move this file to the [archive](archive/README.md) and update the ownership table in the [developer guide](developer-guide.md).

## Where things stand

`src/app/useAppController.ts` (1,272 lines before the Prettier pass, 2,706 after) does five jobs at once:

1. It calls every state hook (about twenty) and destructures roughly 400 names from them.
2. It wires the tools to each other: Finder exclusivity, one visible score at a time, clearing marks when the layout changes, the side effects of opening a tool, the Reset menu and the three cross-tool transfers.
3. It derives the diagram: buttons, highlights, title, footer notes, voicing chart and geometry.
4. It hands about 300 values and setters to `useSettingsTransfer` so that settings files and the saved session can reach every owner.
5. It flattens everything into three view models (`settings` about 180 fields, `tools` about 300, `workspace` about 190).

The tool sections already declare what they read. Counting the `Pick` types in `src/app/toolSections/` and `src/app/settingsSections/`:

| Section | Fields read |
| --- | --- |
| Annotate Diagram | 53 |
| Stradella Chord Finder | 42 |
| Bass Pattern Player | 39 |
| ABC Player | 34 |
| Progression Assistant | 33 |
| Harmony Explorer | 23 |
| Scale Finder, Treble Chord Finder | 21 each |
| Rhythm Trainer | 3 (it already owns its state) |

Only seven fields are read by three or more sections: `t` (15), `side` (7), `language` (6), `chordDisplayStyle` (4) and the three Finder activation setters (3 each). Everything else belongs to one tool. That is the evidence that the split below is mostly a move, not a redesign: the shared surface is small, and the Finder setters are the one place where tools reach into each other.

The Rhythm Trainer shows the target shape: one hook, one object (`rhythmTrainer`) passed through, and a section that reads three fields.

## Target shape

Three layers, from the bottom up.

**Platform.** State that many tools read and that is not a tool: language, instrument (side, layout, register model), diagram appearance, sound options, notation settings, navigation (workspace, active tool, `navigateToTool`) and the generated diagram buttons. Each is a React context with its own provider. The hooks already exist (`useLanguageSettings`, `useInstrumentState`, `useDiagramAppearanceState`, `useSoundSettings`, `useNotationSettings`, `useWorkspaceNavigation`); the providers only wrap them. The buttons provider computes `buttons` from instrument and appearance, so no tool rebuilds `DiagramButton` identities. It comes last, with the diagram model (step 8): on the compact treble sizes the generated buttons keep the Treble Chord Finder's and Scale Finder's result and the marked buttons visible, so `buttons` depends on tool state until the tools can contribute the buttons they need kept.

**Tools.** Each tool has one provider that owns its state and results hooks and exposes two things:

- a context (`useScaleFinder()`, `useAbcPlayer()`, …) that its section, its inspector and its diagram contribution read;
- a **handle** registered with the coordinator: a small typed object of commands other parts may call (`deactivate`, `stop`, `resetWork`, `resetPreferences`, `onLayoutChange`, plus tool-specific entry points such as `stradellaChordFinder.receiveChord(...)`). Every member is optional.

`TOOL_REGISTRY` gains a `provider` field. `App.tsx` nests the registered providers in registry order, so adding a tool means adding a registry entry and a folder. All providers stay mounted for the whole session, as the state hooks are today.

**Coordinator.** A thin provider above the tools that holds the handle registry and the rules that span tools: exclusivity, reset scopes, layout changes, stop-all and the transfer sequences in `crossToolCommands.ts`. It holds no musical state.

Provider order is fixed: Settings registry, Language, Instrument, Appearance, Sound, Notation settings, Navigation, Buttons, Playback, Coordinator, then the tools in registry order. Owners register their settings in layout effects, which all run before any passive effect, and the registry's startup effect, being outermost, runs last; so every owner is registered when startup runs (question 4 depends on this).

Why contexts and not one smaller composition hook: a hook that calls each tool's hook would still have to be edited for every new tool, and the roadmap's "done" condition is that adding a tool does not touch the controller. Calling hooks in a loop over the registry would satisfy that, but the React hooks lint rule rejects it and it would hide the call order. Nested providers keep the order explicit and lintable. The flat model already re-renders every view on every change, so contexts do not make rendering worse; splitting them can only make it better.

## 1. Which tool owns which state

The section `Pick` types are the inventory. Ownership after the split:

| Owner | State it owns (today's hooks) | Moves out of the controller |
| --- | --- | --- |
| Scale Finder | `useScaleFinderState`, `useScaleFinderResults` | `playScaleFinder`, scale-path arrow and number flags |
| Treble Chord Finder | `useTrebleChordFinderState`, `useTrebleChordFinderButtons`, `describeTrebleChord` | `playChordFinder`, treble voicing note and footer flag |
| Stradella Chord Finder | `useStradellaChordFinderState`, `useStradellaChordFinderResults` | `showStradellaVoicingIntervals`, `batchExporting`, `downloadAllStradellaRealizations`, `resetStradellaFinderDefaults`, `finderAnnotation` |
| Annotate Diagram | `useDiagramOverlays`, `useSequenceState`, `useSequenceResults`, `useDiagramAnnotations` | `toggleButton` routing for the four modes, `handleSvgClick`, `playSelectedButtons`, `playRecordedSequence`, sequence notation |
| ABC Player | `useAbcPlayerState`, `useAbcPlayerResults` | ABC scheduling refs, `chooseAbcHands`, default tune loading, `abcCompanionButtons`, `abcHandsView`, ABC notation |
| Bass Pattern Player | `useBassPatternState`, `useBassPatternResults` | repeat selection, scheduling and export, bass-pattern notation |
| Rhythm Trainer | `useRhythmTrainer` | nothing (already self-contained) |
| Harmony Explorer | `useHarmonyExplorerState`, `useHarmonyExplorerResults`, `useHarmonyActions` | `clearHarmonyWork`, the Harmony SVG ref and filename |
| Progression Assistant | `useHarmonyProgressionState`, `useHarmonyProgressionResults`, `useProgressionActions`, `useProgressionNotation` | `progressionSearch`, the progression note annotation |

Three pieces of state look tool-owned but are shared, and become platform state:

- `notation`, `accidental`, `chordLabelMode`, `chordDisplayStyle`: diagram labels, titles and four tools read them. They join the appearance provider (labels) and a small "music spelling" part of it.
- `downloadFormat` and `mobileDiagramView`: the workspace's, not a tool's.
- `interfaceDensity`: the shell's.

The Progression Assistant's recorded progression belongs to Harmony Explorer (it is recorded on the circle), and the optimized plan to the Progression Assistant. Today both live in `useHarmonyProgressionState`; the hook is split along that line when the two providers are created.

## 2. How cross-tool commands are routed

Three kinds of interaction exist today. Each gets one mechanism.

**Rules that apply to every tool** become coordinator calls on handles, never direct setter calls between tools:

| Rule today | After |
| --- | --- |
| Opening a tool deactivates both Chord Finders; opening a Finder activates it and deactivates the others (`toggleToolSection`) | `coordinator.toolOpened(id)` calls `deactivate()` on every Finder handle except the opened one, then `activate()` on it. The "keep chord and selected realization" rule stays inside each Finder. |
| One visible score at a time (`toggle*Notation`, the effect that hides scores when a tool closes) | Each tool's notation toggle calls `coordinator.showNotation(id)`, which hides the others. Closing a tool calls its `hideNotation()`. |
| Layout change clears overlays, sequence, notes and Finder highlights (`layoutSignature` effect) | The Buttons provider owns `layoutSignature` and calls `onLayoutChange()` on every handle. The signature itself, and its exclusion of chord and scale choices, is unchanged. |
| Toggling the Progression Assistant stops ABC and Bass Pattern playback and deactivates the Finders; toggling the Rhythm Trainer stops sound | Registry flag `stopsPlayersOnToggle`, executed by the coordinator through the playback provider. |

Calls go to handles in registry order. Where order matters today, it stays written out in one function instead of being left to registration order.

**Transfers between two named tools** (Harmony to Progression Assistant, Harmony or a progression step to the Stradella Chord Finder, Stradella Chord Finder to Harmony) stay explicit. `crossToolCommands.ts` keeps its pure sequencing functions and their tests. The ports they receive are filled from handles: the destination tool exposes a typed entry point (`progressionAssistant.receiveProgression(chords, mode)`, `stradellaChordFinder.receiveChord(request, playedButtonIds?)`, `harmonyExplorer.focusChord(...)`), and the source gets the destination with `useToolHandle("stradellaChordFinder")`. The difference between `"transfer"` and `"preview"`, and between resetting the realization and keeping the pending match by played-button IDs, is preserved exactly. A tool that receives transfers imports nothing from the tool that sends them.

**One transport for every player.** A Playback provider takes over the shared part of `useAccordionPlayback`: `samplesLoading`, `startWhenSamplesReady`, `soundEnginePlayer`, `stopAllSound` listeners and the active player. Each player registers a `PlayerAdapter` (`state`, `play`, `pause?`, `stop`, `position?`, `totalBeats?`). `PlaybackBar` renders the adapter of the active tool, which removes the dozen transport fields from the workspace model. The ABC and Bass Pattern scheduling move into those tools and keep using `src/audio/playbackStart.ts`, `playbackLifecycle.ts` and `playbackScheduling.ts` unchanged, including the documented order (cancel timers, then stop sound; deactivate the Finder, capture the clock, then schedule).

**Reset by scope.** The toolbar's Reset menu has three scopes today, each a hand-written list of setters. They become handle methods:

| Scope | Today | After |
| --- | --- | --- |
| Work on the diagram | `resetDiagramWork()` → `resetDiagramWorkState` | `coordinator.reset("work")` calls `resetWork()` on every handle, then stops sound |
| Current tool's preferences | `resetCurrentToolDefaults()`: Harmony reset, or Stradella Finder defaults plus work | `coordinator.reset("tool", activeTool)` calls that handle's `resetPreferences()` |
| Everything | `resetSettingsToDefaults()`: clear the session and reload | unchanged; it stays the only reset that reaches every owner |

`resetStradellaFinder` and `resetDiagramWorkState` move into the tools that own the values; their values and order do not change.

## 3. What the workspace, the inspector and the notation presenter read

**Workspace diagram.** Today `WorkspaceView` (548 lines before formatting, 897 after) reads a 190-field model. It is split into the diagram, the Harmony circle, the score area and the toolbar wiring, and the diagram gets one composed input built in `src/app/diagram/useDiagramModel.ts`:

- buttons and geometry inputs from the platform providers;
- a **diagram contribution** from each tool (`highlightedIds`, `primaryIds`, `rootBassIds`, `path` for sequences and scale paths, `onButtonClick`, `onSurfaceClick`), merged in registry order. Highlights are additive, as ABC highlights already are;
- the title and footer from the active tool's contribution (`title`, `filenameKey`, `footer`), falling back to the automatic title. Today's precedence (progression note, then Stradella Finder, then Treble Chord Finder, then Scale Finder, then automatic) follows from "active tool first" plus one rule: the Progression Assistant's eye selection outranks the Finder, which it already does because only one of them is active.

`calculateDiagramGeometry` and its frozen reference data are untouched. The footer note pipeline ("one common diagram-note pipeline", `annotationLevelForLine`, the voicing chart) moves with the Stradella Chord Finder and the Progression Assistant into a shared `stradellaDiagramNote.ts`, because both produce it.

**Inspector.** `resolveWorkspaceInspector()` keeps its pure signature. The registry gains an optional `inspector` entry (lazy component plus `available(state)`), and `StradellaResultsInspector` and `ProgressionResultsInspector` read their tool's context instead of the `tools` model. The selection still has one owner, the tool, and rows still call its setter with the engine index.

**Notation presenter.** `selectNotationKind()` stays pure. Its six booleans come from the tools' handles (`notation.visible`, `notation.abc`) instead of being assembled in `App.tsx`. `NotationWorkspaceContent` stops mapping kinds to tool fields and renders the active tool's `notation.abc`. `notationLocation()` and the `musicNotationPlacement` setting are unchanged; a tool still never decides where its score goes.

## 4. How settings export, import and the saved session collect state

The contracts that users depend on stay where they are: `settingsController.ts` (validation, aliases, the language precedence check), `settingsMigrations.ts`, `settingsSession.ts`, the frozen import traces and `tests/fixtures/settings-export-keys.json`. What changes is how the setters and the snapshot are gathered.

- Each owner registers a **settings slice** with the Settings registry through `useSettingsSlice(values, setters)`, where `values` is typed as a `Pick` of `SettingsExportSnapshot` and `setters` as a `Pick` of `SettingsSetters`. Setters are React state setters, so they stay stable, as the async defaults effect requires.
- An ownership table, `SETTINGS_KEY_OWNERS: Record<keyof SettingsExportSnapshot, OwnerId>`, gives every exported key exactly one owner. The compiler rejects a missing key; a unit test rejects a key registered twice or not at all at runtime.
- `applyStartupSettings`, `applyImportedSettings` and `collectCurrentSettings` receive the merged setters and the merged snapshot. Their code does not change, so the key order, aliases and migration behaviour cannot change either.
- **Startup.** The registry's startup effect (defaults file, then saved session, then `sessionReady`) runs after every child effect, so all slices are registered. A test renders the providers and asserts that a key from each owner was applied.
- **Session saving.** Today an effect runs after every render of the controller and compares the serialized snapshot. After the split there is no single render, so `useSettingsSlice` reports a change when its own values change (compared by serialization), and the registry debounces 500 ms, collects every slice and writes only if the string differs. Nothing is written before startup has finished, as today.
- **Reset to defaults** is unchanged.

This removes the 300-name `deps` object from `useSettingsTransfer` and the duplicate lists in the controller. Adding a setting means adding the key to the schema and the owner's slice; the compiler then points at `SETTINGS_KEY_OWNERS`.

## Tests

Done together with the hook-test rewrite, as the roadmap asks.

- Before moving anything, characterization tests are written against today's controller for the behaviours that move. They are in `tests/unit/app/` and use `renderApp()` from `tests/support/appHarness.ts`: Finder exclusivity on opening tools, one visible score, layout change clearing marks, the work and tool Reset scopes (the third scope reloads the page and stays with the browser tests), the default ABC tune loading once, the transfers between tools, and startup order with the session written only after startup. Each was checked by breaking the rule in the code and seeing the test fail. They must pass unchanged after every step; only the harness changes when the controller goes away.
- Each tool provider gets a `renderHook` test with a wrapper of platform providers. These replace the isolated-module hook tests that use hand-made React doubles: `abc-feature-module`, `controller-lifecycle`, `finder-feature-modules`, `pattern-sequence-feature-modules`, `diagram-annotation-modules`, `harmony-progression-feature-modules`, `stradella-finder-module` and `app-navigation-modules`. Isolated-module tests that check call order without React (`render-audio-services`, `playback-start-geometry`, `png-export-regression`) stay.
- `settings-controller-compatibility.test.js`, `crossToolCommands` tests and the e2e suite do not change. They are the proof that nothing visible moved.
- `performance.spec.ts` and the Chord Finder search budget guard against context re-render costs.

## Order of work

Each step leaves `verify:release` and `test:e2e` green, is one or a few commits, and can ship on its own.

1. Characterization tests (above). Done.
2. Platform providers. The controller reads them instead of calling the hooks. No visible change. Done: `src/app/platform/` holds language, instrument, appearance with spelling (`useMusicSpelling`, formerly four `useState` calls in the controller), sound, notation settings and navigation. Still in the controller until the diagram model (step 8): `buttons`, `interfaceDensity`, `downloadFormat` and `mobileDiagramView`.
3. Settings registry and slices. `useSettingsTransfer` shrinks to the registry. Done. As built: one ownership table, `SETTINGS_OWNERS`, maps every exported key to an owner, and setters are found by name (`setX` for `x`, plus `changeLanguage`), so an owner registers with a single call, `useOwnedSettings(owner, hookResult)`. The registry is the outermost platform provider rather than sitting below Language, because the language preference is itself a setting. Tool owners still register from the controller and will register from their own providers in step 5. `useSettingsTransfer` went from 957 lines to 41 and the controller from 2,707 to 2,484.
4. Coordinator and handles for exclusivity, layout change, reset scopes and stop-all, with the controller still owning the tools. Done. As built: `src/app/toolCoordinator.ts` holds the rules and no state; which tools react to what is data in `TOOL_REGISTRY` (`highlights`, `onToggle`). Handles have optional `activate`, `deactivate`, `stop`, `resetWork(workspace)`, `resetPreferences` and `onLayoutChange`; a `playback` handle stands for all players until step 6. Reset work takes the workspace because the Harmony workspace's Reset work clears different state. The rule "one visible score" moves with the notation entries in step 7, because its present asymmetries (showing the Harmony recording's score hides the Progression Assistant's, not the reverse) are easier to keep exact once each tool's score has an entry. The controller is down to 2,433 lines.
5. Move the tools into providers, simplest first: Rhythm Trainer, Scale Finder, Treble Chord Finder, Annotate Diagram, Bass Pattern Player, ABC Player, Stradella Chord Finder, Harmony Explorer, Progression Assistant. Each move deletes that tool's fields from the `tools` model, and its section reads the tool's context. Feature hooks move as they are; folder consolidation is item 3.
6. Playback provider and `PlayerAdapter`; `useAccordionPlayback` disappears.
7. Notation and inspector entries in the registry.
8. Diagram model and contributions; `WorkspaceView` split.
9. `useAppController` is deleted. Update the developer guide: ownership table, "To add a tool", and the description of the composition root.

## Constraints to keep

- Nothing on the startup path may import `abcPlayerTools.ts` or `abcjs`. Tool providers are in the first download (their state must stay mounted), so they import engines lazily exactly as the hooks do today. The bundle audit and the 200 KiB budget catch mistakes.
- `stradellaBatchCapture` relies on `flushSync` re-rendering the diagram with each realization; this must still work when the selection lives in a context.
- The Stradella engine, register model, Finder ranking and diagram geometry are not touched.

## Decisions

1. **Contexts and providers**, as described. A smaller step that keeps one composition hook calling per-tool hooks was rejected because it does not meet "add a tool without editing the controller".
2. **Line limit: 500 formatted lines** in `src/app/`, enforced with ESLint's `max-lines` once step 9 is done. The roadmap's "roughly 400 lines" was written before the Prettier pass, which made dense files about 1.5 to 2.2 times longer; even before it, `WorkspaceView.tsx` (548), `useSettingsTransfer.ts` (554) and `AnnotateDiagramSection.tsx` (431) were over 400. Today four files exceed 500: the controller (2,706), `useSettingsTransfer.ts` (957), `WorkspaceView.tsx` (897) and `WorkspaceToolbar.tsx` (628). The plan removes the first three; the toolbar needs its Reset and Download menus moved into their own components, which is a small separate step.
3. **The recorded progression belongs to Harmony Explorer**, which records it on the circle; the optimized plan belongs to the Progression Assistant.
