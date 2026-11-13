# Settings file reference

Developer and maintainer notes for the settings JSON: the file written by **Settings → About → Save settings JSON**, read by **Load settings JSON**, and shipped as `public/default-settings.json`. The user-facing guide is [`../settings.md`](../settings.md), which describes the same settings by their on-screen names.

## Files and loading order

- `public/default-settings.json` holds the startup defaults. It is fetched with `cache: "no-store"` on every load; if it is missing or invalid the app keeps its built-in defaults. Edit it when publishing your own copy of the app with different defaults.
- The browser keeps the settings of the last session in `localStorage` under `accordionTools.session.v1`, in the same shape as a settings file. It is applied after `default-settings.json`, so the order of precedence at startup is: built-in defaults, then `default-settings.json`, then the saved session. **Reset to defaults** in Settings → About removes the saved session and the saved language and reloads.
- A saved settings file has the same shape. Loading one changes the current session (and therefore the saved session); it never rewrites `public/default-settings.json`.
- Keys are optional. A partial file applies only the keys it contains, and each value is validated by its setter (`src/settings/settingsController.ts`); invalid values are ignored.
- The exported key set and its order are fixed by `tests/fixtures/settings-export-keys.json`, checked by `tests/unit/modules/settings-controller-compatibility.test.js`.

## Versions and migrations

Every exported file starts with `settingsVersion` (currently `3`). Files without it are version 1, which covers everything exported up to v0.17.0.

`src/settings/settingsMigrations.ts` brings older files up to date before any setter runs, both for the startup defaults and for imported files:

| Step | Change |
|---|---|
| 1 → 2 | Drops `progressionAllowApproximations` (retired from the interface). `soundArticulation` is new; files without it keep the default `0.85`. |
| 2 → 3 | Drops `selectionOnClick`: Selection is now a mode of Annotate Diagram, where clicks in Select mode always toggle the selection. |

To change the format: bump `SETTINGS_VERSION`, add a step to `MIGRATIONS` that turns a version N document into version N + 1, update `collectCurrentSettings()` and `tests/fixtures/settings-export-keys.json`, and add a case to `tests/unit/modules/settings-migrations.test.ts`. Files from newer builds pass through unchanged: known keys still validate and unknown ones are ignored.

## Keys by area

### Main mode and layout settings

| Setting | Purpose |
|---|---|
| `language` | Interface language: `auto` (follow the browser), `en`, `es`, `fr`, `pt`, `it` or `de`. The bundled default file applies it only when this browser has no saved language choice; a file the user loads always applies it. |
| `side` | Starts the app in `stradella` or `treble` mode. |
| `basses` | Stradella bass count, such as `48`, `72`, `96`, or `120`. |
| `trebleLayout` | Treble layout: `c-system`, `b-system`, or `piano`. |
| `trebleRows` | Number of chromatic-button treble rows. |
| `trebleSize` | Chromatic-button treble size. Existing 3-octave and larger layouts are preserved; new 1- and 2-octave choices automatically expand if selected chord, scale, fingered, or sequence buttons require more columns. |
| `pianoTrebleRange` | Piano keyboard range preset. |
| `showTrebleOctaves` | Shows or hides octave numbers on treble labels. |

### Notation settings

| Setting | Purpose |
|---|---|
| `notation` | Label style: English, German, solfege, intervals, or blank labels. |
| `accidental` | Treble accidental spelling preference: default/natural, prefer sharps, prefer flats, or show enharmonic pairs. Stradella keeps its own spelling logic. |
| `chordLabelMode` | Controls how chord labels are displayed. |
| `chordDisplayStyle` | Chord symbol style: `compact` (C / Cm), `letter` (CM / Cm, default) or `words` (Cmaj / Cmin). |

### Music notation settings

These settings control rendered staff-notation panels in the accordion workspace, including Bass Pattern Player, ABC Player, Annotate Diagram's Sequence mode, and Progression Assistant. They are hidden in the Harmony workspace because Harmony diagrams do not render staff notation.

| Setting | Default | Purpose |
|---|---:|---|
| `musicNotationIncludeTitle` | `true` | Includes the generated title in app-generated notation. |
| `musicNotationIncludeDescription` | `false` | Includes the selected pattern description as text below generated notation when available. |
| `musicNotationIncludeSummary` | `false` | Includes a compact summary note such as progression, pattern, root, repeats per chord, pattern bars, and meter. |
| `musicNotationUseBarsPerLine` | `true` | Enables automatic line wrapping for app-generated notation. |
| `musicNotationBarsPerLine` | `4` | Number of bars per line when wrapping is enabled. |
| `musicNotationChordFontSize` | `11` | Chord-symbol/annotation font size in rendered notation. |
| `musicNotationScale` | `76` | Overall abcjs render scale percentage. |
| `musicNotationStaffWidth` | `520` | Staff width used by the in-app renderer. |
| `musicNotationStaffSeparator` | `14` | Vertical spacing between rendered voices/staves. |

### Diagram appearance settings

| Setting | Purpose |
|---|---|
| `colorTheme` | Diagram color theme. |
| `titleMode` | Auto (layout), Contextual (tool and selected realization; default), Custom, or None. In Chord Finder, Contextual shows harmonic identity plus realization status, with a modeled-lowest qualifier for unspecified Stradella non-root voicings and the selected inversion for Treble. This does not affect recipe-based filenames. |
| `customTitle` | Title used when custom title mode is active. |
| `showButtonLabels` | Shows or hides button/key labels. |
| `showBellowsGuide` | Shows or hides the bellows guide. |
| `showStradellaRowLabels` | Shows or hides Stradella row labels. |
| `diagramVerticalSpacing` | Vertical spacing between title, bellows guide, and diagram. |
| `diagramScale` | Overall diagram scale percentage. |
| `buttonSize` | Default circular button size. |
| `buttonSpacing` | Default spacing between buttons. |
| `trebleAngle` | Default treble-grid slant angle. |
| `buttonStrokeWidth` | Default button border width. |
| `referenceStrokeWidth` | Default reference-button border width. |
| `chordFillStrength` | Default chord-button fill intensity. |
| `accidentalStyle` | Default visual style for treble accidental buttons. |
| `labelFontSize` | Default button-label font size. |
| `titleFont` | Default title font. |
| `titleSize` | Default title size. |
| `labelFont` | Default button-label font. |
| `interfaceDensity` | Control-panel density. |
| `showStatusBar` | Shows or hides the status bar. |

### Piano appearance settings

| Setting | Purpose |
|---|---|
| `pianoKeyWidthScale` | White-key width scale. |
| `pianoKeyHeightScale` | White-key height scale. |
| `pianoBlackKeyWidthScale` | Black-key width scale. |
| `pianoBlackKeyHeightScale` | Black-key height scale. |

### Interaction settings

| Setting | Purpose |
|---|---|
| `downloadFormat` | Default diagram download format: SVG or PNG. |

### Stradella registers

| Key | Default | Values |
|---|---|---|
| `stradellaBassRegisterOctave` | `2` | Octaves 1–4 |
| `stradellaBassRegisterGrouping` | `"C-B"` | `"C-B"` or `"F-E"` |
| `stradellaChordRegisterOctave` | `3` | Octaves 2–5 |
| `stradellaChordRegisterGrouping` | `"C-B"` | `"C-B"` or `"F-E"` |

### Chord Finder and Progression Assistant bass

| Key | Default | Meaning |
|---|---|---|
| `stradellaRequestedBassOnBassButton` | `true` | **Play lowest note on bass button**: a requested bass must sound on a bass or counterbass button. Also used by the Progression Assistant. |
| `progressionRootPosition` | `true` | Progression Assistant **Bass**: root position for every chord (`true`) or any bass (`false`). |

Both were added after v0.18.0 without a settings-version change: files without them keep the defaults.

### Chord Finder diagram notes

`stradellaNoteLevels` is an object with boolean fields `identity`, `pitchClasses`, `voicing` and `physical`, all `true` by default. Older files omit it and keep showing all four lines; a partial object defaults only its missing or invalid fields to `true`. `stradellaShowNominalNoteSpacing` (default `true`) replaces the pitch list with the interval chart.

`stradellaMinimumNominalGap` is `0` (allow all gaps, default), `2` (exclude adjacent nominal pitches 1 semitone apart) or `3` (exclude 1 or 2 semitones). Distinct nominal MIDI pitches are compared; shared pitch classes and unison doublings are not treated as clashes.

### Sound settings

| Setting | Purpose |
|---|---|
| `soundEnabled` | Enables or disables browser sound playback. |
| `soundVolume` | Default sound volume. |
| `soundSource` | Chooses the built-in synthesizer or the La Melodiosa sampled accordion. |
| `laMelodiosaTrebleRegister` | La Melodiosa treble register: `I` (upper), `II` (lower), or `III` (both). |
| `laMelodiosaBassRegister` | La Melodiosa bass sample reed selection: `I` (upper), `II` (lower), or `III` (both). |
| `laMelodiosaFollowStradellaRegisters` | `true` (default): sample playback follows the independently configured bass and chord ranges. `false`: preserve the original C2–B2 bass / C3–B3 chord MIDI mapping. |
| `soundVoicePreset` | Default synthesized voice preset. |
| `soundWaveform` | Default oscillator waveform. |
| `soundMusetteDetuneCents` | Default detune amount for musette-style sound. |
| `soundAttackMs` | Default sound attack time. |
| `soundReleaseMs` | Default sound release time. |
| `soundNoteDurationMs` | Note duration for clicks, chord previews and step-by-step playback. The ABC Player, Bass Pattern Player and Progression Assistant rhythms instead sound each note for its written length (by default 85% of it; see `soundArticulation`). |
| `soundArticulation` | **Note length in players**: how much of each written note sounds in the ABC Player, Bass Pattern Player, Progression Assistant rhythms and the Harmony recording, from `0.3` to `1` (100% is fully legato). The button stays highlighted for the same time. Default: `0.85`. |
| `stradellaBassVoicing` | Chooses the synthetic voicing used for Stradella bass buttons. |

`laMelodiosaFollowStradellaRegisters` defaults to `true` when absent, so files from before register-following keep working.

### Harmony Explorer settings

Secondary Harmony Explorer preferences are stored in Settings so the main Harmony Tools panel can stay focused on reference family, related family, parent scale/mode, and diatonic filtering.

| Setting | Purpose |
|---|---|
| `harmonyShowEnharmonics` | Shows enharmonic equivalents in chord labels. |
| `harmonyShowSeparators` | Shows radial segment separator lines. |
| `harmonyShowLegend` | Shows the diagram legend. |
| `harmonyShowExplanation` | Shows the optional explanation box. |
| `harmonyRingVisibility` | Controls visibility of each shared-note ring. The `0` ring is off by default. |
| `harmonyShowToneTooltips` | Shows rich chord-tone tooltips. |
| `harmonyShowNoteRing` | Shows the twelve-note pitch-class ring by default; the legend and explanation follow its visibility. |
| `harmonyColorByFamily` | Colors chord labels by family. |
| `harmonyDiameter` | Circle diameter in pixels. |
| `harmonyFontSize` | Maximum chord-label font size. |
| `harmonyPlaybackStyle` | `block` or `arpeggio`. |
| `harmonyVoicingStyle` | `root` for selected chord only or `smooth` for reference→related playback. |

### Progression Assistant settings

| Setting | Purpose |
|---|---|
| `progressionRhythmPattern` | Progression Assistant playback pattern: `block`, `oom-pah`, or `waltz`. |
| `progressionHandMovementWeight` | Weight from `0` to `1` assigned to physical Stradella movement versus pitch-class voice motion. Default: `0.65`. |

### Tool defaults

| Setting | Purpose |
|---|---|
| `scaleFinderDisplayMode` | Default path display mode for Scale Finder. |
| `scaleFinderRoot` | Default Scale Finder root. |
| `scaleFinderPattern` | Default Scale Finder pattern. |
| `scaleFinderRowLimit` | Default treble-row limit for Scale Finder. |
| `stradellaChordFinderMode` | Default search mode for Stradella Chord Finder. |
| `stradellaChordFinderMarkRootBass` | Marks the root bass as a visual reference in chord-button results. |

| `chordFinderRoot` | Default Chord Finder root. |
| `chordFinderPattern` | Default Chord Finder pattern. |
| `chordFinderInversion` | Default Chord Finder inversion. |
| `chordFinderOctave` | Default Chord Finder octave. |
| `abcStradellaMode` | Default ABC mapping mode in Stradella mode. |
| `abcTrebleChordSymbolsMode` | Default quoted chord-symbol behavior in Treble mode. |
| `abcHands` | ABC Player hands: `stradella`, `treble` or `both` (default). With `both`, two-voice tunes play voice 1 on the treble and voice 2 on the Stradella at once. Files without it use `both`. |
| `bassPatternChordVoicing` | Bass Pattern Player chord voicing: simple chord button or fuller recipe when available. |
| `bassPatternRepeatsPerChord` | Number of complete bass-pattern cycles played for each progression chord. |
| `bassPatternTempoBpm` | Default Bass Pattern Player tempo, 30–220 beats per minute. The beat is the meter's denominator, except in compound meters (6/8, 9/8, 12/8, and the same over 16), where it is a dotted beat of three units (see `bassPatternBeat()`). Until v0.18.0 the value counted denominator units in every meter; files were not converted because the settings do not record which pattern was selected, and only the compound patterns play differently. |
| `bassPatternLoopMode` | Default Bass Pattern Player repeat mode. |
| `bassPatternLoopCount` | Default fixed repeat count when repeat mode is fixed. |
| `abcTempoBpm` | Default ABC Player tempo when the tune does not override it. |
| `soundSequenceTempoBpm` | Default playback tempo for Annotate Diagram's Sequence mode. |
| `sequenceDisplayMode` | Default Sequence display mode. |
| `sequenceColorPreset` | Default Sequence arrow color. |
| `sequenceThickness` | Default Sequence arrow thickness. |
| `sequenceArrowheadSize` | Default Sequence arrowhead size. |
| `sequenceNumberFontSize` | Default Sequence number font size. |
| `sequenceNumberColorPreset` | Default Sequence number color. |
| `sequenceNumberPosition` | Default Sequence number position. Use `none` for no numbers. |
| `fingeringPosition` | Default fingering-number position. |
| `bassPatternRoot` | Default Bass Pattern Player root. |
| `annotationTextSize` | Default new-annotation text size. |
| `annotationTextColor` | Default new-annotation text color. |
| `annotationFont` | Default new-annotation font. |
| `annotationBold` | Default new-annotation bold toggle. |
| `annotationItalic` | Default new-annotation italic toggle. |
| `annotationOffsetPercent` | Default button-annotation distance from center. The project default is `50`. |
| `annotationButtonAnchor` | Default button-annotation anchor. |

## Interface conventions for settings controls

Persistent binary **choices** use a segmented control with **both options visible** and the active option highlighted, such as `C–B | F–E` for Stradella grouping, `La Melodiosa | Synthesizer` for sound source, `Configured registers | Original mapping` for sample pitch mapping, interface density, chord playback, Bass Pattern voicing, ABC chord symbols, and SVG/PNG export. Changes preserve the original saved-setting keys.

Commands that show or hide content (e.g., **Show/Hide Stradella row labels**, **Show/Hide octave numbers**) remain action buttons, describing the next action; visibility controls also expose their current state to assistive technologies. All three-or-more-option selectors remain dropdowns.

Appearance sliders show the translated label, the current value and the range control in one compact vertical group. Sound has contextual help for the source and pitch-mapping controls.

## Titles and filenames

The `titleMode` setting supports **Auto** (instrument/layout), **Contextual** (default; chord/scale and selection information when a finder is active), **Custom**, and **None**. Contextual titles apply to both Chord Finders and both Scale Finders. There are no competing Chord Finder title checkboxes. The annotation checkbox in Stradella and the extended-chord voicing-note checkbox in Treble control footer text only. SVG/PNG filenames are ASCII-safe, with individual Stradella realization buttons included when Contextual is selected.

## ABC example manifest

The ABC Player catalog is generated at development and build time by scanning `public/abc/*.abc`. To add an example, copy an ABC file into that folder and rebuild or redeploy; no manifest edit is needed. The title comes from the ABC `T:` header, with the filename as fallback. Static GitHub Pages hosting cannot list files uploaded without rebuilding the site.


### Shared symbolic Stradella notation (Phase 6)

The optional JSON fields `stradellaNotationMode` (`symbolic` / `sounding`), `stradellaChordQualityLabels` (`always` / `changes`), and `stradellaMarkCounterbass` (boolean) are exported and imported with the other notation settings; missing keys in historical settings files preserve current application defaults. Standard defaults: `symbolic`, `always`, `false`. The sounding/expanded mode is used by the Progression Assistant; generated exercises and bass patterns always retain symbolic Stradella notation. No settings value derived from audio/reed register shifts standard staff positions.

- `musicNotationNoteNamesInNoteheads` (boolean, default `false`): display an optional pitch-letter overlay in enlarged notehead circles on generated scores. Imported ABC is excluded.

- `musicNotationPlacement`: `right` (default) or `below`, shared across notation-capable tools.

The legacy key `musicNotationNoteNamesInNoteheads` controls **native below-note labels**, not an SVG notehead overlay.
