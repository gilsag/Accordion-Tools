# Accordion Tools — Version History


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
