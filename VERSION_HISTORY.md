## v0.15.4 — Voicing density, sample cleanup and clearer controls (2026-10-22)

- Replaced action-style buttons for persistent two-choice settings with segmented choices that show both options and clearly indicate the active selection. Show/Hide commands remain action buttons.
- Removed the redundant register-ordering qualifier from concise diagram notes. Added concise, optional semitone/cluster observations to Registral voicing when justified by the configured nominal MIDI pitches; fuller discussion appears in More explanation.
- Introduced a restrained, register-aware density score (maximum 1.1 points) for Stradella recommendations; exactness, requested inversions and physical validity are unchanged. Some orderings may change where alternatives are otherwise comparable.
- Removed 100 duplicated, top-level La Melodiosa WAV files after SHA-256 validation against the browser-audio copies. Preserved the original instrument definitions and attribution; standalone original-SFZ reuse requires restoring the original relative filenames, as documented in FILE_MAP.txt.
- Added regression tests for nominal density, note wording, and selected-state controls. Updated Settings, Chord Finder, and Developer guides.
- Native npm production build and browser/audio acceptance tests remain to be verified locally.

## v0.15.3 — Concise notes and documentation cleanup (2026-10-22)

- Removed the redundant “Low to high:” phrase from the Registral voicing line; the nominal MIDI pitches remain in ascending order.
- Moved “Chord buttons only; no separate bass” from Registral voicing to Physical realization in the optional four-level notes. Detailed More explanation and search logic are unchanged.
- Kept only `README.md` and `VERSION_HISTORY.md` as root-level Markdown. Moved the developer guide and configuration validation audit into `docs/`, retired superseded phase-by-phase release notes and installation text files, and repaired links.
- Added regression assertions that the four independently selectable levels contain the appropriate information.
- This release does not modify harmonic candidate generation, inversions, rankings, sampled playback or diagram export mechanisms.

## v0.15.2 — Stradella configuration and explanation UX (2026-10-22)

- Moved independent nominal bass/counterbass and preset-chord octave/grouping controls from Sound into **Settings → Stradella registers**, retaining their persisted setting keys and sample-playback integration.
- Replaced “Lowest modeled: … (not measured)” in concise diagram notes with ascending modeled pitches and octave numbers; unison contributions display multiplicity where applicable. More explanation still documents acoustic limitations.
- Grouped the Previous/Next realization buttons into one compact, accessible ← / → navigation row with an index indicator; no autoplay/wraparound.
- Show the four explanation levels and text-size slider only when their master display checkbox is enabled, preserving previous choices.
- Moved lengthy instructional paragraphs into help tooltips.
- Left-aligned four-level notes in the SVG/PNG diagram footer with bold labels and adjusted wrap spacing; Treble footer alignment remains unchanged.
- Updated tests, Settings/Chord Finder guides, README and Developer Guide; musical search and playback logic remain unchanged.

## v0.15.1 — Sampled Stradella register-following playback (2026-10-22)

- La Melodiosa remains the default sound source; sampled Stradella button playback can now follow the configured independent bass and chord octave groupings, enabled by default.
- Added a Show/Hide-style action to restore the legacy sample C2–B2/C3–B3 mapping without changing the analytical register configuration.
- Kept La Melodiosa reed selections I/II/III independent of nominal MIDI octave mapping and kept Harmony Explorer abstract pitch-class playback unchanged.
- For notes beyond SFZ C2–B3 bass coverage, reused the nearest sample region with playback-rate transposition; no automatic oscillator fallback on missing mappings. Explicit synth source remains available.
- Preserved setting import/export and older configuration files; added standalone nominal playback mapping tests and documentation of out-of-range sample transposition, timbral/duration limitations and multi-reed ambiguity.
- Native npm build and browser audio validation remain pending unless separately verified.

## v0.15.0 — Stradella interpretation, realizations and contextual titles (2026-10-22)

This release consolidates the previously unreleased Chord Finder developments since v0.14.0. It includes normalized ergonomic ranking, registral analysis, selectable register ranges, explicit requested-bass inversions, four independently selectable explanatory note levels, realization navigation and contextual-title refinements. The analytical register model is separate from actual sampled/synth playback and does not claim a measured acoustic inversion. See [Stradella configuration validation](docs/validation.md) for verification scope and remaining build/browser gates.

### Contextual title consistency audit

- Preserved the requested Stradella harmonic identity and explicit slash bass in titles; for unspecified-bass combinations with a different nominal lowest pitch, added a clearly labeled `modeled lowest` suffix (never an inferred slash chord).
- Added the selected inversion and Exact/Approximate/No realization status to Treble Chord Finder contextual titles, reflecting the actual highlighted pitches.
- Kept contextual title formatting independent of the four optional concise diagram-note levels, auto-fit longer contextual titles on compact diagrams, and kept existing Stradella recipe-based export filenames stable across register-model changes.
- Added isolated title-format regression tests and updated the Chord Finder, Settings, README, and developer documentation. No changes to harmonic search, voicing analysis, scoring, or playback.

### Independently selectable four-level diagram explanations

- Added four independently selectable concise Stradella Chord Finder note levels: harmonic identity, pitch-class realization, registral voicing, and physical realization.
- Updated on-screen diagram captions and SVG/PNG exports to show only enabled levels, including correct footer sizing and no empty footer when all levels are off.
- Preserved the separate More explanation section and all musical candidate, recommendation, playback, and title/filename behavior.
- Added import/export/default-settings support with backward-compatible handling of older settings and a focused regression test.
- Updated the Chord Finder guide, Settings guide, and developer architecture guide.

### Explicit Stradella chord identity and requested bass (Phase D)

- Added a requested bass/inversion selector to Stradella Chord Finder, defaulting to Any, with the choice restricted to theoretical chord tones.
- Kept harmonic identity independent of pitch-class realization: e.g., `Emin7/G` is not automatically reinterpreted as `Gmaj6`.
- Added strict modeled-lowest-pitch filtering using independent bass/preset-chord octave grouping settings. Bass specifications cannot be silently replaced by a different inversion.
- Allowed one reinforcing button for the explicitly requested chord-tone bass, even when it duplicates the pitch class of a preset chord; preserved ergonomic, omission, and button-count safeguards.
- Selected Recommended alternatives only after inversion filtering. Without a specified bass, retained the previous root-support ranking behavior.
- Updated More explanation, result caption, contextual title and ASCII-safe export filenames (`-over-G`) to reflect the user's intended bass.
- Added requested-bass tests and documentation. No audio or sample-map changes.

# Accordion Tools — Version History

### Configurable Stradella register analysis

- Added independent analytical register settings for bass/counterbass and preset-chord buttons: octave start and `C–B` / `F–E` grouping.
- Added a pure, played-buttons-only nominal voicing model reporting ordered pitches and the lowest modeled note; its acoustic limitations are explicit.
- Integrated the model into Chord Finder results, More explanation, and exported diagram annotations, without changing pitch-class search, ranking, physical reach, or playback.
- Added Previous/Next navigation for ranked mixed-mode Stradella realizations.
- Persisted the four new settings in startup defaults and imported/exported settings; added mapping and regression tests.

### Code documentation audit

- Added source-level comments and JSDoc around the ABC parser, bass-pattern timing, Stradella results/ranking, registral interpretation, sound/sample mapping, Harmony Explorer and core UI orchestration.
- Added `docs/developer-guide.md` to document module boundaries, pitch-class versus playback-register assumptions, physical-button identity, ergonomic units, and release checks.
- Comments and documentation only: no runtime logic, scoring constants, API signatures, or UI behavior changed.

### Integration validation and release candidate (Phase 6)

- Audited the consolidated Phase 1–5 Stradella implementation, ranking, registral explanations, and binary-control replacements.
- Updated an obsolete notation-test expectation to the existing **Major 9** UI label (test-only correction).
- Added a static binary-controls regression test and a `test:controls` npm script; incorporated it into `test:all`.
- Recorded functional regression results and explicit remaining production, browser, and audio verification gates in `docs/validation.md`.
- No additional changes to candidate generation, scoring, harmonic definitions, audio, or interface behavior. This is a **release candidate**, not a fully production-verified build.


### Stradella registral explanations and binary control cleanup (Phase 5)

- Expanded **More explanation** with result-specific root support, conditional slash-bass character, preset-chord-only compression, and multiple-bass ambiguity. Explanations use played buttons (`playbackButtons`) only and never assume universal reed octaves.
- Added a compact structural bass-role label to optional exported diagram annotations, retaining selected buttons, chord pitch classes, and named omissions.
- Clarified the functional seventh in thirteenth-chord explanations without assuming it is always present.
- Replaced all static two-option dropdowns with one state-aware action button: Stradella row labels, treble octave numbers, visual root marker, panel density, sound source, Harmony playback/relationship styles, Bass Pattern voicing, ABC chord symbols, and SVG/PNG format selection.
- Kept all existing setting state variables, persistence, harmonic searching, candidate generation, recommendation ranking, and playback logic.
- Added registral explanation tests and retained the previous Stradella and Harmony regression suites.


### Registrally informed Stradella recommendations (Phase 4)

- Added a small one-point cost advantage for a **single played root bass/counterbass supporting preset chord buttons**, based on Phase 2 structural registral metadata. The bonus is smaller than the three-point additional-button cost; non-root slash basses, chord-only voicings, and multi-bass combinations are not penalized.
- Applied the bounded preference to extended-chord Recommended selection and to compactness tie-breaking between otherwise comparably classified nonextended realizations. Harmonic exactness, omission penalties, button-count priorities, and physical reach constraints remain unchanged.
- Root-supported extended-chord recommendations now mention separate bass reinforcement in their existing *Why Recommended* text, without asserting universal octave assignments.
- Preserved Em7 (E counterbass + G major), Cmaj7/B (B counterbass + C major), and Cmaj13 compact, slash-bass shell, and complete alternatives. Added dedicated root-support and recommendation regression tests, including a C9 realization with C bass + C major + G minor.


### Selective Stradella root-bass reinforcement (Phase 3)

- Added playable mixed-mode alternatives in which one physical C-style root bass/counterbass reinforces a root pitch class already supplied by preset chord buttons; this gives a distinct bass-register role rather than a new harmonic pitch class.
- Restricted additional reinforcement to previously valid chord-button-only recipes, at most one bass button, and the existing button-count and weighted hand-span limits. All other redundant chord/bass combinations remain disallowed.
- Consolidated equivalent physical bass placements by musical recipe and kept the original chord-only, mixed, and bass-only alternatives. No changes to exactness/omission rules, recommendation scoring, audio playback, or explanatory UI.
- Added targeted regression tests for C root reinforcement, count/span limits, deduplication, harmonic invariants, and preserved Em7, Cmaj7, and Cmaj13 examples.

### Stradella structural registral interpretation (Phase 2)

- Added a pure, independent registral-analysis module, distinguishing actual sounded bass/counterbass buttons from preset chords and optional visual root markers.
- Every Stradella Chord Finder result now exposes structural `registral` metadata: root pitch-class presence, played-root bass support, bass roles, separate chord-register participation, overlapping reinforced tones and conditional non-root slash-bass character. Multiple distinct bass notes are left indeterminate for inversion.
- Explicitly classified inference as button-structure-only: no universal octave assumptions, sample-register claims or changes to playback.
- Added regression tests for Em7, Cmaj7/B, Cmaj13 shell and chord-only cases, visual root markers, bass-only cases and multi-bass ambiguity.
- Left harmonic search, ranking, Exact/Approximate labels, explanatory UI and audio unchanged for later development phases.

### Stradella Chord Finder: scale-independent ergonomics (Phase 1)

- Applied a small 1.10 ergonomic weight along the physical accordion’s vertical circle-of-fifths axis (the diagram’s horizontal direction), keeping the perpendicular direction at 1.00; applied consistently to Stradella proximity, filtering, and ranking. Column spacing remains unweighted for size normalization.
- Normalized mixed-mode physical compactness by the spacing between adjacent Stradella columns, rather than scoring raw screen pixels. The physical reach filter still uses the same relative column span.
- Calibrated the normalized compactness weight to preserve recommendations at the established 38px / 1.18-spacing reference layout where possible.
- Made equally compact bass-only choices and recommendation ties deterministic, independently of diagram button size or spacing; maintained ergonomic preference for clusters near the requested root reference.
- Added ranked-result invariance tests covering 13 chord/layout/reach configurations at nine diagram geometries (117 comparisons), plus reference-chord assertions. No change to harmonic omission rules, audio, or registral interpretation.

### Treble Chord Finder completeness and notes

- Added Auto, Full chord, and Practical voicing choices to the Treble Chord Finder. Auto now retains all available chord tones for chords with five or fewer tones; Full chord exposes complete six- and seven-tone extended chords as theoretical diagrams.
- Made chord-result classification and the optional SVG/PNG explanation apply to every chord family, not just extended chords. Missing tones and their harmonic roles are identified, with a warning for six- or seven-button theoretical shapes and for tones outside the selected keyboard range.
- Added targeted treble chord regression tests covering major/minor/augmented chords, sevenths, ninths, elevenths, and thirteenths on C-system, B-system, and piano layouts.

### Stradella recommendation and explanation refinements

- Replaced the two-recommendation, pitch-class-deduplicated shortlist with up to **three recommended examples** reflecting compact complete voicings, minimal omissions, and functional extended-chord shells. Distinct exact button recipes can each qualify; all valid alternatives remain available.
- Reduced the previous strong fixed preference for thirteenth shells. Recommendation scoring now balances button count, geometric compactness, harmonic omission penalties, number of omitted notes, and major-third/natural-eleventh density.
- Expanded **More explanation** for each selected Stradella realization: actual button combination, produced pitch classes, named omissions and roles, fixed-register extension compression, 11th/13th harmonic consequences, and a reason when the realization is marked Recommended. Explained that pitch-class completeness is distinct from literal upper-octave stacking.
- Kept concise exported-diagram annotations unchanged to preserve legibility in teaching materials.

### Chord Finder voicings, titles, and compact treble layouts

- Added **Contextual** diagram titles as the default, shared across Chord Finders and Scale Finders; the pre-existing Auto, Custom, and None modes remain available. Removed redundant per-Chord-Finder title checkboxes.
- Standardized unambiguous chord symbols (`Cmaj`, `Cmin`, `Cmaj7`, `Cmin7`, `Cdim`, `Caug`) and ASCII-safe realization-specific export filenames.
- Added dominant, major, and minor **eleventh** and **thirteenth** chords; chord types appear in increasing order of theoretical size.
- Extended conservative omission rules: eleventh ninth omissions, qualified third omission for dominant/major elevenths, and fifth/ninth/eleventh omissions for thirteenths. Triads and altered fifths remain protected except the existing standard diminished-seventh-button exception.
- Initially marked up to two distinct, musically useful extended-chord voicings as **Recommended**, ahead of other exact and approximate results. Complete alternatives remain available.
- Added an optional treble extended-chord diagram footer describing the sounded notes and omitted harmonic roles.
- Added **1-octave** and **2-octave** CBA/B-system treble size presets while keeping the existing sizes and all piano range options. Compact views expand and recenter when the highlighted or selected buttons require more room.
- Updated Chord Finder, Scale Finder, and Settings guides; these are accessible in the in-app documentation viewer.

### Earlier work: Stradella Chord Finder refinements (October 2026)

- Expanded **Bass + chord buttons** results to include bass/counterbass-only exact realizations alongside mixed and chord-only combinations.
- Removed the previous five-result cap; candidate enumeration remains subject to the generator, ergonomic reach checks, and consolidation of equivalent button arrangements.
- Refined ranking to prefer exact results, fewer omissions, fewer buttons, and compact physical layouts. Added redundancy and reach filtering.
- Restricted approximate triads to complete three-tone realizations; permitted selected fifth omissions for larger chords, ninth omission for dominant eleventh chords, and the conventional single diminished-seventh-button exception.
- Added independent diagram options for an automatic chord/realization title and a full-width realization explanation, including omitted-pitch roles.
- SVG/PNG diagram downloads now use the visible title as the filename when available, sanitizing invalid filename characters and using a layout-based fallback otherwise.



## v0.14.0 - Harmony progression recording and note ring

- Added progression recording directly in Harmony Explorer: start/stop recording, sequential chord capture, repeated chord events, clear, and direct transfer to the Stradella Progression Assistant.
- Added a compact recorded-progression readout inside Harmony Explorer.
- Added Harmony-workspace staff notation for recorded progressions; the **Show notation** top-bar action appears once a progression contains at least one chord, and the rendered notation can be downloaded as SVG.
- Added an optional inner **note ring** (off by default) inside the reference-family ring. The twelve pitch classes follow the circle-of-fifths sectors and can be auditioned by clicking.
- Note-ring clicks are now recorded while Harmony progression recording is active, displayed in the recorded sequence, and included in Harmony staff notation. Note events remain in Harmony; only chord events are transferred to the Stradella Progression Assistant.
- Added local **Play recording / Stop** controls in Harmony Explorer so mixed note/chord recordings can be auditioned in sequence using the current Harmony sound settings.
- Sending a mixed recording to Progression Assistant now shows a concise warning that single-note events are not exported; chord events are then transferred normally.
- Added persistent `harmonyShowNoteRing` settings support and updated Harmony documentation, README, settings documentation, and version metadata.

## v0.13.1 - Mode-specific settings and Progression Assistant playback

- Reorganized Settings by workspace. Harmony now exposes only settings that affect the Harmony workspace (Appearance, Sound, Harmony, and About); accordion-only Layout, Notation, Music notation, and Title sections are hidden while Harmony is active.
- Moved the Harmony settings section near the end of the Harmony settings list, immediately before About.
- Refined Harmony Sound settings so only the bass/sample controls relevant to Harmony playback are shown.
- Progression Assistant playback now highlights the Stradella buttons actually sounding on every rhythmic pulse.
- Added four Progression Assistant playback patterns: all buttons together, basic oom-pah (2/4), waltz (3/4), and march (4/4), with an in-tool tempo control. Oom-pah, waltz, and march use a root-pitch bass/counterbass pulse on beat 1 followed by chord-row accompaniment pulses. When the optimized realization already contains the root pitch on a specific bass row, that exact physical button is preserved (for example E counterbass + G major for Em7); chord-only realizations fall back to the ordinary fundamental root bass.
- Added **Show notation** for the Progression Assistant, using the shared abcjs rendered-notation panel and SVG download workflow.
- Conservative fifth-omission approximations remain enabled by default.
- Refined ergonomic ranking so pitch-class voice-leading and physical button choice remain separate criteria; equivalent pitches on fundamental and counterbass rows are distinguished only by Stradella ergonomics, and progression rhythm playback preserves the optimized bass-row choice.

## v0.13.0 - Harmony/Progression workflow cleanup

- Moved the **Progression Assistant** out of Harmony Explorer and made it a separate Stradella-side tool.
- Added direct Stradella preview of each optimized progression step, with an optional handoff to Chord Finder for comparing alternative realizations.
- Enabled conservative fifth-omission approximations by default in the Progression Assistant while retaining a strong preference for exact realizations.
- Added **Add relationship to Progression** in Harmony Explorer to transfer the selected reference→related pair into the Stradella Progression Assistant.
- Simplified the Harmony workspace: while Harmony is selected in the top bar, unrelated accordion tools are hidden from the Tools panel.
- Moved secondary Harmony display/audio controls to **Settings → Harmony**, including ring visibility, legend, explanation, enharmonics, tooltips, family colors, diameter/font size, and playback options.
- Fixed **Explore harmony** from Stradella Chord Finder so it preserves the current Harmony reference family. A finder chord is treated as the related/outer-ring family instead of replacing the inner reference family.
- Preserved an existing Harmony selection when a chord was sent to Stradella with **Show on Stradella** and then returned with **Explore harmony**.
- Added persistent Harmony and Progression defaults to `public/default-settings.json` and settings JSON save/load.
- Added dedicated Progression Assistant documentation and updated Harmony Explorer, Chord Finder, Settings, README, and version metadata.

## v0.12.0 - Stradella progression and voice-leading assistant

- Added a **Progression assistant** to Harmony Explorer for building chord sequences manually or from selected harmonic relationships.
- Added whole-progression Stradella optimization using dynamic programming across ranked **Bass + chord buttons** realizations.
- Combined harmonic pitch-class motion with normalized physical button movement, while retaining a small compactness preference and a strong exact-realization preference.
- Added an adjustable **Hand-movement emphasis** control and an explicit option to allow conservative fifth-omission approximations; approximations remain off by default.
- Added per-transition reporting of harmonic motion, physical movement in approximate button spacings, shared tones, and the selected physical realization.
- Added **Play optimized progression** using the current Accordion Tools sound engine and sequence tempo.
- Added one-click handoff from any optimized progression step to its selected realization in the Stradella Chord Finder.
- Added progression-optimizer regression coverage and integrated it into `npm run test:harmony`.

## v0.11.0 - Harmony Explorer integration

- Integrated Harmonic Circle Explorer as a new **Harmony** workspace while keeping its pitch-class relationship engine modular.
- Added common-tone rings, selectable reference/related chord families, parent scales and modes, diatonic filtering/highlighting, independent ring visibility, rich chord tooltips, Roman numerals, family colors, voice-leading information, and SVG/PNG export inside Accordion Tools.
- Added two-way navigation between Harmony Explorer and the Stradella Chord Finder: selected harmonic relationships can be sent to **Show on Stradella**, and supported Stradella finder chords can be opened with **Explore harmony**.
- Harmony Explorer playback now uses Accordion Tools' existing sound engine and current sound settings. In integrated playback, chord pitch classes are kept in the single C3-B3 Stradella chord octave, including La Melodiosa bass-register playback.
- Added block/arpeggio playback and an optional reference-to-related transition mode for hearing harmonic relationships without introducing piano-style octave assumptions.
- Added Harmony Explorer tests and adapter tests for chord-family and pitch-class handoff to the Stradella finder.
- Updated SVG/PNG export cleanup so transient Harmony Explorer tooltips, selections, and navigation highlights are not exported.

## v0.10.2
- Chord Finder: Bass + chord buttons remains the default mode and now keeps a valid fifth-omission approximation visible even when several exact realizations exist.

- Fixed La Melodiosa treble sample delivery by moving playback WAVs to fresh URL-safe asset paths and replacing `#` in playback filenames with `sharp`.
- La Melodiosa mode no longer falls back silently to the synthesizer when a sample cannot be loaded; it tries the alternate take and nearby sampled regions instead.
- Retained the original SFZ/Decent Sampler definitions and added `FILE_MAP.txt` documenting the browser-safe filename mapping.
- Made La Melodiosa the default sound source, with treble register I and Stradella register III as the default sampled registers.
- Added gentle high-frequency damping to the lower treble range of register III to reduce occasional harsh/screeching sample playback.
- Tightened Stradella Chord Finder approximations: approximate realizations no longer add foreign pitches and may omit only a non-defining natural fifth; thirds, sevenths, altered fifths, and extensions must be preserved.

## v0.10.1 - La Melodiosa sample playback fixes

- Fixed La Melodiosa sample URLs containing `#` (for example `D#` and `F#` filenames) by URL-encoding sample filenames before loading them. These files were previously interpreted as URL fragments by the browser, causing large portions of the treble mapping to fall back to the synthesizer.
- Extended the nearest La Melodiosa treble sample region beyond the native C4-C7 SFZ range instead of switching abruptly to the synthesizer at the sampled boundaries.
- Fixed sampled Stradella chord voicing so all chord tones remain within the complete C3-B3 sampled chord register rather than allowing ascending chord tones to spill into octave 4 and trigger synth fallback.

## v0.10.0 - Multiple Stradella realizations and La Melodiosa sampled sound

- Expanded the Stradella Chord Finder to generate and rank multiple playable realizations instead of stopping at a single solution.
- In **Bass + chord buttons** mode, exact mixed bass/counterbass + chord-button realizations are preferred when available, with compact physical layouts ranked ahead of more spread-out alternatives.
- Added clearly identified approximate Stradella realizations for chords that cannot be represented exactly or have idiomatic accordion simplifications; ranking favors retaining harmonically important tones and penalizes omission of the root, third, or seventh more than omission of the fifth.
- Added La Melodiosa as an optional sampled accordion sound source while retaining the existing synthesizer as a fallback.
- Reproduced the supplied SFZ mappings, including sample zones, root pitches, tuning adjustments, level adjustments, treble A/B alternation, and separate treble/bass register states.
- Added La Melodiosa sample caching/preloading and cancellation protection for notes stopped while a sample is still loading.
- Added concise La Melodiosa attribution in About, fuller documentation attribution, and attribution/provenance files alongside the sample assets.

## v0.9.0 - abcjs-based ABC parser refactor

- Refactored ABC Player event extraction to use `abcjs.parseOnly()` and `abcjs.synth.sequence()` instead of relying only on the custom hand-written parser.
- Improved handling of score-style ABC files, including resolved simple repeats, voice/staff sequencing, key signatures, tuplets/durations, ties, and quoted chord symbols.
- Kept the existing accordion-specific mapping layer for treble, piano, and Stradella button highlighting.
- Added `Bella Ciao` and `Un Gorro de Lana` to the ABC examples manifest for parser testing.
- Expanded ABC parser tests to cover ties, repeat expansion, key-signature accidentals, voice routing, and chord symbols.

## 0.8.8 - Responsive diagram preset sizing fix

- Restored preset-controlled default button sizing by removing the fixed `buttonSize` override from `public/default-settings.json`.
- This prevents the treble diagram from starting smaller after loading defaults while keeping user-imported settings able to override button size explicitly.
- Clarified in the README that omitting `buttonSize` lets the selected treble/piano preset choose the starting button size.


## v0.8.7 - Defaults and ABC example manifest

- Expanded `public/default-settings.json` to include additional visual, sound, finder, sequence, fingering, bass-pattern, and annotation defaults.
- Added `public/abc/examples.json` so the ABC Player example menu is loaded from a manifest instead of a hard-coded list in `App.tsx`.
- Added `Oye Bonita` to the ABC example manifest.
- Set the default Annotate Diagram distance from center to 50%.
- Fixed annotation bold styling so the bold toggle visibly changes newly created annotations.
- Updated README and settings/ABC/annotation documentation.

## v0.8.6 - ABC tie handling

- Added tie-aware ABC event merging so tied notes sustain across the combined duration instead of retriggering as repeated button activations.
- Supports simple note ties such as `A-A2` and whole chord ties such as `[CE]-[CE]`.
- Added ABC tie tests and included them in `npm run test:all`.

## v0.8.5 - ABC voice routing

- Updated ABC playback to respect `V:` voice sections for common two-hand accordion ABC files.
- Treble and piano sides use voice `1` by default when multiple voices are present.
- Stradella uses voice `2` by default and defaults to bass notes plus chord symbols for left-hand accompaniment.


## v0.8.4 - Finder highlight readability and optional sequence numbering

- Improved Scale Finder and Chord Finder highlight readability on treble accidental buttons by keeping dark accidental fills and using a high-contrast highlight stroke.
- Added stronger text outlining for accidental labels so note names remain legible when finder highlights are active.
- Updated black piano-key finder highlighting to use a contrast ring instead of a yellow fill.
- Added **No numbers** to the Sequence **Number position** menu. This hides sequence/finder step numbers while leaving arrows and highlights available.

## v0.8.3 - Local annotation style controls

- Added a local **Distance from center** slider for button-attached annotations.
- Added local **Bold** and **Italic** annotation toggles.
- Stored text size, color, font, offset, bold, and italic settings with each annotation when it is created.
- Styled inline annotation editing so the preview reflects the selected local text style.


## 0.8.2 - Annotation list and Text Notes removal

- Removed the separate Text Notes tool from the Tools panel so Annotate Diagram is now the single workflow for diagram text annotations.
- Added an annotation list in the Annotate Diagram section, including a preview, location label, count, and per-annotation × delete button.
- Kept the clear-all annotations action, now disabled when there are no annotations.
- Removed obsolete Text Notes placement UI behavior so button clicks are no longer split between two annotation workflows.

## 0.8.1 - Annotate Diagram click-first workflow

- Added an Annotate Diagram tool with a click-first workflow: choose the tool, click a button or empty diagram location, then type the annotation inline on the diagram.
- Button annotations can be placed at center, edge, or corner anchor positions.
- Empty-space clicks create free-position text labels.
- Button sound, selection, fingering, and sequence actions are suppressed while Annotate Diagram is active so clicks place annotations instead of playing notes.
- Existing sidebar Text notes behavior was preserved in this version for users who prefer typing the text first and then placing it.

## 0.7.9 - Fingering input and treble enharmonic labels

- Changed the fingering tool so applying a fingering to a button clears the fingering input afterward, preventing new values from being appended to the previous one.
- Also clears the fingering input after applying one fingering value to the currently selected buttons.
- Renamed the notation setting from Accidentals to Treble accidentals, because Stradella spelling follows its own circle-of-fifths and counterbass logic.
- Added a new optional Treble accidentals value: Show enharmonic pairs.
- The enharmonic-pair option affects treble labels only; Stradella diagrams keep their existing Stradella-specific spelling logic.



## 0.7.8 - Bellows guide top/bottom label orientation

- Fixed the bellows guide end labels so they are no longer hard-coded as Bottom on the left and Top on the right for every side.
- Treble-side diagrams now show Top on the left and Bottom on the right.
- Stradella diagrams keep Bottom on the left and Top on the right.
- This is a display-label correction only; button notes, positions, and tool logic are unchanged.


## 0.7.7 - Stradella scale spelling normalization fix

- Fixed target-note spelling in the Stradella Scale Finder when the conventional spelling crosses the octave boundary, such as B# in C# major.
- Replaced JavaScript remainder-based accidental normalization with positive modulo normalization so spellings like B# are not rendered as long strings of flats.
- Internal target-note spellings remain compatible with the compact Stradella path search introduced in v0.7.6.

## 0.7.6 - Stradella scale finder path and double-sharp display refinement

- Enlarged the displayed double-sharp symbol so it better matches the visual weight of the other lowered accidentals.
- Reworked the Stradella Scale Finder so target notes use conventional scale spelling, including E#, B#, and double sharps when required.
- Changed Stradella Scale Finder button selection from a greedy nearest-note lookup to a compact path search that favors nearby buttons and keeps the result closer to the center of the bass manual.

## 0.7.5 - Double-sharp display style

- Kept internal Stradella labels such as F## and C## for parsing and pitch normalization.
- Updated label rendering so ## is displayed as the standard double-sharp sign 𝄪.
- The double-sharp sign uses the same lowered accidental styling as existing sharp and flat symbols.
- The affected counterbass labels now render visually as F𝄪 and C𝄪 while preserving the internal F## and C## spellings.

## 0.7.4 - Stradella counterbass sharp-side spelling

- Updated the Major 3rd / counterbass row at the extreme sharp side to keep conventional Stradella diagonal spellings.
- The affected 120-bass sequence now displays C# -> E#, G# -> B#, D# -> F##, and A# -> C## instead of F, C, G, and D in natural Stradella naming mode.
- No pitch-class logic was changed; this is a note-name spelling/nomenclature correction.


This file tracks functional changes, fixes, and release notes for Accordion Tools.

## Versioning convention

Use semantic-style version numbers:

- **Major** version: large structural changes or incompatible changes.
- **Minor** version: new tools, features, or significant interface improvements.
- **Patch** version: bug fixes, corrections, documentation updates, or small refinements.

Suggested format: `vMAJOR.MINOR.PATCH`, for example `v0.7.1`.

---

## v0.8.5 — 2026-06-16

### Fixed

- Updated the ABC Player to respect ABC `V:` voice sections instead of reading all voices sequentially.
- On treble/piano layouts, multi-voice ABC playback now uses voice 1 by default, so it does not continue into the bass voice after the melody.
- On Stradella layouts, multi-voice ABC playback now uses voice 2 by default, so bass/chord accompaniment voices can be played independently from the treble melody.

### Changed

- The default Stradella ABC mapping is now Bass notes + chord symbols, which better matches accordion-style left-hand ABC files containing written bass notes plus quoted chord labels.

### Verification

- Checked with `Bella Ciao.abc`, where voice 1 contains the treble melody and voice 2 contains bass notes with chord symbols.

### Files changed

- `src/tools/abcPlayerTools.ts`
- `src/App.tsx`
- `public/default-settings.json`
- `package.json`
- `package-lock.json`
- `src/config/appInfo.ts`

---

## v0.7.1 — 2026-06-11

### Fixed

- Corrected the Stradella Major 3rd / counterbass row note labels near the sharp end of the layout.
- Fixed the issue where labels starting at the `C#` root column were a half step out or repeated the wrong root-based names.
- The row now uses the computed major-third pitch name when the shifted circle-of-fifths label lookup goes beyond the available root-label range.

### Verification

For the right end of the root row, the corrected mapping is:

```text
Root row:       B   F#   C#   G#   D#   A#
Major 3rd row: D#  A#   F    C    G    D
```

### Files changed

- `src/stradella.ts`

---

## v0.7.0 — 2026-05-19

### Baseline

- Baseline project version used before the Stradella Major 3rd row correction.
- Includes the existing Accordion Tools interface, Stradella layout, treble tools, ABC Player, Bass Pattern Player, chord/scale tools, fingering tools, sequence tools, settings, and documentation.

---

## Template for future entries

```markdown
## vX.Y.Z — YYYY-MM-DD

### Added

- 

### Changed

- 

### Fixed

- 

### Removed

- 

### Verification

- 

### Files changed

- 
```
## La Melodiosa sampled sound integration

- Added La Melodiosa as an optional sampled accordion sound source while retaining the built-in synthesizer.
- Added independent treble and bass register selection for the three register states defined by the original instrument (upper, lower, both).
- Preserved the supplied SFZ sample ranges, root pitches, tuning offsets, relative levels, and treble round-robin alternation.
- Added lazy/cached Web Audio sample loading, selected-register preloading, synth fallback outside mapped ranges, and stop protection while samples are decoding.
- Added La Melodiosa attribution in About, README/settings documentation, and the sample directory; retained the author's original README, SFZ, and Decent Sampler preset.

### In-app documentation viewer (unreleased)

- Added **Open documentation** in Settings → About.
- Bundles the project Markdown guides into a searchable, navigable reader without external dependencies or network access.
- Preserves the existing external README link.

- Chord Finder: configurable maximum of 1–4 buttons and compact/moderate/extended hand span for combined searches.
- Chord Finder: diagram titles identify realization exactness, button count and bass/chord composition; major-triad titles explicitly use `M`.
- Diagram download filenames: ASCII-only labels with realization details, using safe hyphen separators.
