# Accordion Tools — Version History

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
