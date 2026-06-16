# Accordion Tools — Version History

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