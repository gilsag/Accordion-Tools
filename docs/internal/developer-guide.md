# Accordion Tools — Developer Guide

This guide documents the **implementation boundaries and assumptions** that are most important when maintaining the current React/TypeScript/Vite project. It complements the user-facing guides under `docs/` and the inline comments in the source code.

For the ongoing, deliberately incremental modularization, see the [modularization roadmap](modularization-roadmap.md). The ownership below reflects the **settings/instrument extraction, three Finder-state extractions, ABC Player, Bass Pattern Player, Sequence/Recording, Harmony Explorer, Progression Assistant, and the diagram/annotation state modules**; `App.tsx` is not yet just a layout shell.

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
| Bass Pattern Player feature | `src/features/bassPatternPlayer/useBassPatternPlayer.ts` | Bundled and custom patterns, chord progression library, editor validation/save/remove, historical localStorage key, settings setters, transport highlighting, and Stradella-only derived events; shared scheduling/export remain in App |
| Sequence/Recording feature | `src/features/sequences/useSequenceState.ts` | Ordered recorded button IDs, path/number display preferences, notation visibility, and current physical-button identity lookups; playback remains in App |
| Harmony Explorer feature | `src/features/harmonyExplorer/useHarmonyExplorer.ts` | Circle configuration/selection, diatonic and family filters, display options, derived relationships and localized explanations; chord engine remains in tools |
| Progression Assistant feature | `src/features/progressionAssistant/useProgressionAssistant.ts` | Edited/recorded progression state, stable incremental ID ref, optimization preferences, notation/transport UI state, Stradella-only derived plan, preview and actual sounding-button highlighting; shared audio and cross-tool commands remain in App |
| Diagram appearance state | `src/diagram/useDiagramAppearanceState.ts`, `src/instrument/sizePresets.ts` | Shared geometry/display/title settings and unchanged treble/piano size presets, not instrument construction or sound |
| Diagram overlay/fingering state | `src/diagram/useDiagramOverlays.ts` | Selected physical IDs, fingering draft/placement, mark/toggle/clear actions; renderer and playback remain in App |
| Annotate Diagram state | `src/features/annotateDiagram/useDiagramAnnotations.ts` | Free and button-anchored text notes, formatting controls, inline editor/ref, SVG-coordinate anchor calculation, original note creation |
| UI/orchestration (pending extraction) | `src/App.tsx`, `src/components/` | Owns shared tool navigation, supplies typed settings adapters and a current-state snapshot, derived diagrams, controls, playback orchestration, and downloads |
| Interface localization | `src/i18n/catalog.ts`, `src/i18n/context.tsx`, `src/i18n/useI18n.ts`, `src/i18n/{en,es,fr,pt,it,de}.ts` | Keep typed interface catalogs and language selection separate from musical identities; `LanguageProvider` and the `useI18n()` hook live in separate modules |

### Diagram state and annotation boundary (combined Phase 3f)

`useDiagramAppearanceState()` supplies the same per-field setters used by the settings controller for diagram sizing, spacing, visibility, text styling and titles. The treble size presets now reside in `src/instrument/sizePresets.ts`; this contains exactly the old values. Do not confuse diagram button sizing with construction of the physical Stradella register model or with sample/sound settings.

`useDiagramOverlays()` handles the diagram-local `Record<string, Overlay>` and fingering/selection behavior. It never replaces `DiagramButton` instances, converts IDs to sounding pitch, or invokes audio. `useDiagramAnnotations(buttonSize)` owns text-note drafts and the existing anchor-coordinate formula, including the `Math.min(..., buttonSize * 0.9)` cap. Notes still go through `makeTextNote`, retaining the existing timestamp-based note IDs and the original SVG positions. Keep `svgPointFromMouse`, SVG viewBox composition, the SVG/PNG/ZIP download pipelines and sound commands outside these hooks until separately tested.

Changing physical layout or invoking reset still clears overlays and annotation notes from the App orchestration effect. The settings contract is unchanged: annotation font/color/size, offset, anchor, bold/italic, fingering placement, appearance and title fields must continue to import/export under the same JSON keys and order. `scripts/diagram-annotation-modules.test.mjs` protects state defaults, editing and mark behavior; visual focus, click positioning and exported output require browser smoke testing.

### Settings compatibility — migration contract

Maintain three distinct settings operations: `applyStartupSettings` (editable defaults, with the stored-language precedence check), `applyImportedSettings` (valid fields from a partial user file, including explicit language persistence), and `collectCurrentSettings` (exact JSON key order). They intentionally differ. Old `roman` / `tonal-function` chord-label aliases and `bassPatternBarsPerChord` must continue to work; omitted fields must leave the current state unchanged. The separate `SettingsSetters` adapter must reference **stable React state setters** so the initial async defaults effect is not restarted by unrelated renders. Avoid reading snapshot values in asynchronous callbacks when a freshly collected export is required.

The source-of-truth regression is `scripts/settings-controller-compatibility.test.mjs`: fixture traces were captured from the original inline validation logic before extraction and cover seven startup/import scenarios. `scripts/settings-export-keys.json` pins all 118 exported field names and their insertion order; a change to this ordering can affect byte-for-byte JSON exports. Run `npm run test:modules` before merging refactor branches. Do not refactor these historically different paths into one generic setter table without proving identical results.

### ABC Player feature boundary (Phase 3c)

`useAbcPlayerState()` owns the ABC editor text and visibility, loaded filename/example choices, catalog manifest validation and asynchronous example fetch, tempo, transport position/status, active physical button IDs, treble/Stradella voice-mapping preferences and the ABC notation container ref. It returns the original individual setters used by settings JSON import; **do not** modify their defaults, accepted values, or setter identities. `useAbcPlayerResults()` calls the existing `parseAbc`, voice filtering, physical button-mapping, beat counting and missing-note functions in `src/tools/abcPlayerTools.ts`. It preserves their exact `DiagramButton` references and the existing effect that synchronizes score tempo only when playback is not playing. Do not combine treble and Stradella voice streams or transform their original start beats.

`App.tsx` still owns `scheduleAbcPlayback`, pause/stop, timeout refs, cross-tool cancellation, `playButtonSound`, playback-clock calculations, notation rendering via `abcjs`, and shared downloaded-image/export behavior. These operations are intentionally **not migrated in Phase 3c**; moving them requires independently verified sound, notation and lazy-loading steps. The ABC example manifest is still loaded once with `cache: no-store`, its options are validated individually, and a failed example request still produces the original visible diagnostic text. Regression: `scripts/abc-feature-module.test.mjs` (in `test:modules`), plus the existing `test:abc` suite (ties, repeats, two-voice song examples, catalog and localizations).

### Bass Pattern and Sequence/Recording boundaries (combined Phase 3d)

`useBassPatternState(t)` owns the built-in library and custom pattern definitions, including the unchanged `accordionTools.customBassPatterns.v2` key and its JSON read/write semantics. The bundled library and progression fetches still occur together, preserve original version/validation rules, inherit shared legends where absent, and select the original pattern/progression fallback. Editor save and removal use exactly the prior messages through the current translation callback. `useBassPatternResults()` delegates to `makeBassPatternEvents`, `totalBassPatternBeats` and `bassPatternMissingItems` without changing argument order, musical contents, or physical `DiagramButton` references; it returns no accompaniment events for non-Stradella manuals. The feature exposes the original stable state setters to the 118-key settings controller.

`useSequenceState()` owns sequence recording, step numbering (incrementing in append order, even if button IDs repeat), number/arrow display settings and notation visibility. `useSequenceResults()` reconnects recorded IDs to the **current** physical buttons without altering their order or creating substitute button identities. Resetting a physical layout still clears recordings from `App.tsx`. Shared notation toggles, audio scheduling and cancellation, export orchestration and cross-tool exclusivity are **not** duplicated inside either feature: they remain in App until those shared services are extracted. Run `scripts/pattern-sequence-feature-modules.test.mjs` (part of `test:modules`) and the existing pattern/sequence display, audio, export and localization regressions after migration.

### Harmony Explorer and Progression Assistant (combined Phase 3e)

`useHarmonyExplorerState()` exposes the same individual settings setters as before and owns selection plus the original selection-reset effect. `useHarmonyExplorerResults()` computes the same sector relationships, available/visible counts, and localized diagram explanation with the unchanged Harmony engine. Pitch-class and common-tone relationships are **not** physical sound-register comparisons. Keep the default all-families/diatonic behavior, ring visibility, note-ring flag and translated explanation independent of Stradella layout and audio. `harmony-note-ring-ui.test.ts` now inspects the owning module for state and derived explanation inputs, but still verifies the App reset action and the original settings controller.

`useHarmonyProgressionState()` owns edited chords, recorded note/chord events, the monotonic ID ref, manual entry options, optimization preferences, notation visibility/ref, recorded playback state/timeouts ref, currently highlighted physical button IDs and preview index. `useHarmonyProgressionResults()` **always generates Stradella buttons for optimization**, even if another workspace/manual is selected; it delegates with the original options (`maxRealizationsPerChord: 5`), retains original button objects, and exposes a preview set based on `result.playbackButtons` only when the Assistant is active and not already highlighting playback. The preview-clamping effect and unplayable-plan handling are unchanged. `App.tsx` still handles playing/cancelling audio, recording commands, navigation between Harmony and the Stradella Finder, transfer of actual physical played-button IDs, and ABC notation rendering/downloads. Do not merge sample registers or global sound state into the Harmony/progression feature hooks.

Run `scripts/harmony-progression-feature-modules.test.mjs` via `npm run test:modules`, as well as the independent Harmony engine/integration/progression tests. Do not replace behavioral tests with tests of whether `App.tsx` contains certain lines; assertions about ownership must follow the feature file.

### Finder feature boundaries

`useScaleFinderState()` and `useTrebleChordFinderState()` expose the existing individual React setters so `settingsController.ts` continues to route imports without a schema change. Their corresponding result hooks receive the **current** diagram `buttons` and manual/visibility inputs; never rebuild `DiagramButton` identities or sort finder output in these adapters. The Scale Finder supports Stradella as well as treble; Treble Chord Finder is intentionally disabled on non-treble manuals. While the migration is in progress, `App.tsx` still coordinates mutual exclusivity and layout-change clearing; do not duplicate it inside the feature hooks.

`useStradellaChordFinderState()` owns chord root/pattern/mode, requested bass, max buttons, span, minimum modeled note gap, selected realization, root-reference marking, the four optional note levels, explanatory font/visibility, and a pending cross-tool realization signature. `useStradellaChordFinderResults()` receives physical buttons and the **instrument-owned nominal register model**, and delegates to the unchanged Stradella engines. It preserves the original empty-result fallback, selected-index clamping, index reset triggers and progression handoff matched to the sorted IDs of **`playbackButtons`**, not theoretical pitches or diagram guides. Only the actual playback recipe controls audio. `App.tsx` still coordinates tool activation/exclusivity, diagrams, sample playback and batch export, and wires settings imports through stable setters. Do not duplicate these state values in App.

The hook modules contain explanatory comments for these non-obvious contracts. `scripts/finder-feature-modules.test.mjs` and `scripts/stradella-finder-module.test.mjs` verify defaults, routing, selected recipe, and reset/handoff ordering without requiring esbuild; the existing musical tests verify candidate selection and ordering. The feature files are **not** lazy-loaded yet, and importing these hooks does not imply the UI panels have been extracted.

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
