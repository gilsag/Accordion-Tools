# Accordion Tools — Developer Guide

This guide documents the **implementation boundaries and assumptions** that are most important when maintaining the current React/TypeScript/Vite project. It complements the user-facing guides under `docs/` and the inline comments in the source code.

**Localization:** `src/i18n/catalog.ts` registers `en`, `es`, `fr`, `pt` (Brazilian Portuguese), `it` and `de`. Separate typed catalogs define interface text; `musicTerms.ts`, `optionLabels.ts` and localized explanation templates provide musical terminology and generated descriptions. See [Adding Interface Languages](adding-interface-languages.md) for key and placeholder parity, saved preferences, and export invariants.

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
| UI/orchestration | `src/App.tsx`, `src/components/` | Own user state, derived data, SVG rendering, controls, and downloads |

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

`src/tools/stradellaChordFinder/registerModel.ts` maps actual `playbackButtons` into a *hypothetical* pitch set using independent bass/counterbass and preset-chord ranges. The ranges are a starting MIDI octave and grouping (`C-B` or `F-E`); for `F-E`, C through E lie in the octave **above** the starting F. The calculation returns a lowest *modeled* pitch, retaining its played-button source, and **must not** be treated as measured reed voicing. Real-world registers may produce multi-octave ranks. This model is not passed into harmonic candidate search or ergonomic scoring. When sampled playback is configured to follow the register model, the sound engine uses its nominal MIDI mapping, as documented below. The app stores four independent setting fields, and the explanatory UI explicitly labels the result as a model prediction.

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

Check representative chords including Em7 (E counterbass + G major), Cmaj7 (B counterbass + C major), C11, Cmin11, C13, and the compact/shell/complete Cmaj13 alternatives. Review sampled and synthesized audio, visual root markers, physical hand positions, all Show/Hide controls, and diagram export. See `validation.md` for outstanding acceptance gates and prior test scope.

### Commenting standard

Use comments to record *why* a constraint exists, the units and coordinate orientation of a calculation, the meaning of public result fields, and the scope/limits of musical assumptions. Keep these comments adjacent to the relevant code. Prefer short JSDoc comments on public or non-obvious functions; avoid repeating self-evident statements, narrating JSX markup, or adding comments that would become incorrect when implementation changes. Update this guide when an architectural invariant changes.

### Four-level diagram-note presentation

`src/tools/stradellaChordFinder/diagramAnnotations.ts` produces four independent, labeled concise strings (`lines`) from the selected played-button result and the optional nominal register model. `StradellaNoteLevels` toggles only these export/diagram strings. Never derive a new chord identity from a pitch-class collection, and never claim the nominal `lowestPitch` is a measured acoustic note. `App.tsx` owns the selected level switches; `StradellaChordFinderPanel.tsx` provides four checkboxes beneath the master diagram-note toggle. The rendered SVG `foreignObject` uses the same filtered `lines` for both the screen and SVG/PNG downloads; height estimation must account for wrapping independently on each line. With no enabled lines, remove the entire footer.

The inline note-spacing option defaults on and is represented by the optional settings JSON field `stradellaShowNominalNoteSpacing`; absent values retain the default. The Harmony `showNoteRing` state flows through the SVG legend and `buildDiagramExplanation`, with the on/off state controlling their text. The expanded `explainStradellaRealization` remains independent of these toggles. The default settings loader and exported/imported settings must remain backward compatible with older files lacking `stradellaNoteLevels`. Unit tests live in `scripts/stradella-four-level-notes.test.ts`.


## Stradella sampled playback and register alignment

`stradellaRegisterModel` remains a nominal one-pitch-per-pitch-class analysis layer. The sound engine's `notesForButton()` optionally maps the physical played bass and preset chord buttons to these same MIDI pitches when `source === "la-melodiosa"` and `laMelodiosaFollowStradellaRegisters` is true. Otherwise the earlier playback mapping remains available. Harmony Explorer's abstract pitch-class playback does not represent physical buttons and is unchanged. Never infer a particular accordion's measured reed spectrum from the model.

The La Melodiosa engine selects SFZ regions in its original register I, II, or III and transposes the selected WAV via `AudioBufferSourceNode.playbackRate` for requested pitches, including out-of-range pitches by nearest-region extrapolation. Both the original in-range SFZ mapping and out-of-range extrapolation may require transposition of a recorded sample. Do not silently fall back to `scheduleTone()` in sampled mode: missing/corrupt assets must be disclosed through warnings, not covered with synthesized notes. The explicit `synth` source remains separate. Be mindful that large playback-rate changes modify sample duration, transients, and timbre.

## Stradella explanation and settings presentation

The analytical register state remains stored under the existing `stradellaBassRegister*` / `stradellaChordRegister*` keys and is exposed in a dedicated `stradellaRegisters` settings section. Sound still controls the independent La Melodiosa pitch-mapping toggle and sample reed register. No changes are made to the nominal model, candidate generation, or playback.

`formatModeledStradellaNotes` renders ascending modeled MIDI pitches, grouping repeated same-MIDI contributions as `×N`. The four independently enabled `realizationAnnotation().lines` retain their fixed presentation-only role. The SVG `foreignObject` uses left-aligned, label-emphasized markup with extra wrap space, ensuring exports match the on-screen diagram. Level toggles are conditionally rendered under the master checkbox but persist when hidden. Arrow navigation changes only the selected realization index, without autoplay.

## v0.15.4 density, audio asset and UI invariants

`voicingDensity.ts` analyzes distinct configured MIDI notes, not pitch-class intervals. Its capped cost must remain secondary to valid requested bass, button economy and harmonic completeness; do not discard dissonant but valid chords. The same analysis feeds concise and expanded explanations and recommendation preferences. Physical coordinates remain independent of these notes.

The 100 browser-safe WAV files in `public/samples/la-melodiosa/audio/` are the canonical media. Top-level WAV duplicates were SHA-256-identical and were deleted; retain CC-BY attribution, original README/SFZ/preset reference files and `FILE_MAP.txt`. The original instrument mappings refer to unnormalized sibling WAV filenames, so standalone reuse requires restoring paths (audio data remains unchanged).

Persistent two-way choices use `SegmentedChoice` (`aria-pressed` on both visible options); hide/show commands continue to use `BinaryChoiceButton`. Keep original state setters to preserve existing import/export settings.

## v0.15.5 — Musical inversion, spelling, and filename separation

`src/tools/stradellaChordFinder/chordSpelling.ts` is a display-only layer: `chordToneName` derives spellings from the requested root and interval *degree* (including E♭/B♭ for Cmin7, E♯ for C♯ major, and B𝄫 for C diminished seventh). Do not change the internal pitch classes stored by button generation, ranking, or audio.

`realizedChordName` uses the explicitly requested chord root/quality and (when available) the nominal lowest chord tone to form an ordinary slash symbol. A specified bass remains authoritative. Conventional triad/seventh inversion names come from theoretical chord tone order, not the button's physical position; extended chords are instead described by the bass role. This interpretation is conditional on the selected register model, not a measured acoustic inversion.

`realizationAnnotation.filenameKey` passes through `safeChordFilenameKey`: music spelling (slashes, ♯, ♭, 𝄪, 𝄫, #) never reaches filesystem filenames directly. The SVG/PNG download layer performs a separate final ASCII allow-list check. The filename retains the played-button recipe, unlike the contextual title.

## Conservative cleanup policy

- Keep the main `docs/` level for the in-app user guides; developer-only material belongs under `docs/internal/`.
- Avoid removing saved-settings migration fields or the ABC legacy parser without versioned compatibility tests.
- Preserve La Melodiosa SFZ source metadata, sample attribution, and unmapped recordings until a separate sample-archive decision.
- An unused export is not necessarily disposable: verify external consumers and run the native build before deleting it.

## Interface localization

The English, Spanish and French string catalogs are stored in `src/i18n/en.ts`, `es.ts` and `fr.ts`. The typed locale registry and fallback in `src/i18n/catalog.ts` are the public API. UI option labels, generated descriptions, musical terminology and example names use separate presentation helpers without modifying harmonic IDs, sounding pitches or filename recipes. The Settings language menu derives its options from the registry. See [Adding Interface Languages](adding-interface-languages.md) for adding locales and the corresponding validation requirements.
