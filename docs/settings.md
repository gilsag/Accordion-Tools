# Settings Guide

Accordion-Tools has two kinds of settings:

1. **Session settings** changed in the browser while using the app.
2. **Startup defaults** stored in `public/default-settings.json` and loaded when the app starts.

The app also lets you save and load a separate settings JSON file from the About panel. Loading a settings file changes the current session; it does not rewrite `public/default-settings.json`.


## Mobile diagram viewing (not a saved setting)

When the viewport is at most **860 CSS px**, the diagram viewer offers **Readable · scroll** and **Fit entire diagram**.

- **Readable · scroll** is the initial mobile/tablet view. The on-screen diagram is larger and scrolls horizontally to keep button targets readable.
- **Fit entire diagram** displays the whole keyboard at once, with smaller button targets.

These choices affect the **browser viewer only**. They do not modify `diagramScale`, musical geometry, SVG/PNG exports, audio, or the saved settings JSON. On narrow phones the left tool panel scrolls separately, help tips can be tapped, and the documentation viewer uses a horizontal topic list.

## Interface language

Choose **Auto (browser)**, **English**, **Español**, **Français**, **Português (Brasil)**, **Italiano**, or **Deutsch** in Settings → Language. Auto uses the first supported language preference from the browser, including regional locale tags such as `es-CL`, `fr-CA`, `pt-BR`, `it-IT`, and `de-DE`; unsupported preferences fall back to English. The `pt` language uses Brazilian Portuguese for all Portuguese regional variants, including `pt-PT`. The explicit selection persists independently of music notation settings and is compatible with existing imported/exported settings JSON.

Interface translations cover controls, tooltips, status summaries, Harmony legends, and major generated chord explanations. The bundled Markdown help articles remain in English, as do some third-party parser diagnostics and user-authored text. Changing interface language does not alter musical IDs, chords, pitch spelling settings, playback, or export filenames. The developer instructions are in [`internal/adding-interface-languages.md`](internal/adding-interface-languages.md).

## Workspace-specific settings

The Settings sidebar is filtered by the active workspace so controls that cannot affect the current diagram are not shown.

- **Accordion workspace:** Layout, Notation, Music notation, Appearance, Sound, Title, and About.
- **Harmony workspace:** Appearance, Sound, Harmony, and About.

Harmony uses its own pitch-class spelling and diagram controls, so the accordion **Notation** section is intentionally hidden there. The Harmony section is placed immediately before About.

## Startup defaults file

Built-in startup defaults live here:

```text
public/default-settings.json
```

This file is useful when publishing your own copy of the app with preferred defaults.

If the file is missing or invalid, the app falls back to internal defaults.

## Save and load settings

The About panel provides:

- **Save settings JSON**: downloads the current settings as `accordion-tools-settings.json`.
- **Load settings JSON**: applies a previously saved settings file to the current browser session.

This is the safest way to move your personal settings between machines without editing source files.

## Main mode and layout settings

| Setting | Purpose |
|---|---|
| `side` | Starts the app in `stradella` or `treble` mode. |
| `basses` | Stradella bass count, such as `48`, `72`, `96`, or `120`. |
| `trebleLayout` | Treble layout: `c-system`, `b-system`, or `piano`. |
| `trebleRows` | Number of chromatic-button treble rows. |
| `trebleSize` | Chromatic-button treble size. Existing 3-octave and larger layouts are preserved; new 1- and 2-octave choices automatically expand if selected chord, scale, fingered, or sequence buttons require more columns. |
| `pianoTrebleRange` | Piano keyboard range preset. |
| `showTrebleOctaves` | Shows or hides octave numbers on treble labels. |

## Notation settings

| Setting | Purpose |
|---|---|
| `notation` | Label style: English, German, solfege, intervals, or blank labels. |
| `accidental` | Treble accidental spelling preference: default/natural, prefer sharps, prefer flats, or show enharmonic pairs. Stradella keeps its own spelling logic. |
| `chordLabelMode` | Controls how chord labels are displayed. |


## Music notation settings

These settings control rendered staff-notation panels in the accordion workspace, including Bass Pattern Player, ABC Player, Sequence Tool, and Progression Assistant. They are hidden in the Harmony workspace because Harmony diagrams do not render staff notation.

| Setting | Default | Purpose |
|---|---:|---|
| `musicNotationIncludeTitle` | `true` | Includes the generated title in app-generated notation. |
| `musicNotationIncludeDescription` | `false` | Includes the selected pattern description as text below generated notation when available. |
| `musicNotationIncludeSummary` | `false` | Includes a compact summary note such as progression, pattern, root, repeats per chord, pattern bars, and meter. |
| `musicNotationUseBarsPerLine` | `true` | Enables automatic line wrapping for app-generated notation. |
| `musicNotationBarsPerLine` | `4` | Number of bars per line when wrapping is enabled. |
| `musicNotationChordFontSize` | `11` | Chord-symbol/annotation font size in rendered notation. |
| `musicNotationScale` | `54` | Overall abcjs render scale percentage. |
| `musicNotationStaffWidth` | `520` | Staff width used by the in-app renderer. |
| `musicNotationStaffSeparator` | `14` | Vertical spacing between rendered voices/staves. |

## Diagram appearance settings

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

## Piano appearance settings

| Setting | Purpose |
|---|---|
| `pianoKeyWidthScale` | White-key width scale. |
| `pianoKeyHeightScale` | White-key height scale. |
| `pianoBlackKeyWidthScale` | Black-key width scale. |
| `pianoBlackKeyHeightScale` | Black-key height scale. |

## Interaction settings

| Setting | Purpose |
|---|---|
| `selectionOnClick` | Enables or disables selecting buttons/keys by clicking them. |
| `downloadFormat` | Default diagram download format: SVG or PNG. |

## Two-way controls

Persistent binary **choices** use a segmented control with **both options visible** and the active option highlighted, such as `C–B | F–E` for Stradella grouping, `La Melodiosa | Synthesizer` for sound source, `Configured registers | Original mapping` for sample pitch mapping, interface density, chord playback, Bass Pattern voicing, ABC chord symbols, and SVG/PNG export. Changes preserve the original saved-setting keys.

Commands that show or hide content (e.g., **Show/Hide Stradella row labels**, **Show/Hide octave numbers**) remain action buttons, describing the next action; visibility controls also expose their current state to assistive technologies. All three-or-more-option selectors remain dropdowns.

## Stradella analytical registers

Under **Settings → Stradella registers** (separate from Sound), two compact groups—**Bass / counterbass** and **Preset chords**—provide independent **Starting octave** and **Grouping** controls, followed by their **Configured range**. The C–B/F–E grouping tooltip explains the octave boundary. The section help explains that these are nominal model pitches rather than measured reed frequencies. Configure the two twelve-pitch ranges independently:

| Setting | Default | Choices |
|---|---|---|
| Bass/counterbass starting octave | 2 | Octaves 1–4 |
| Bass/counterbass grouping | `C-B` | `C-B` or `F-E` |
| Preset chord starting octave | 3 | Octaves 2–5 |
| Preset chord grouping | `C-B` | `C-B` or `F-E` |

`C2–B2` maps C2 through B2; `F2–E3` maps F2 through B2 followed by C3 through E3. The two groupings are **different twelve-note octave partitions**, not different chord formulas. The controls save and load via the keys `stradellaBassRegisterOctave`, `stradellaBassRegisterGrouping`, `stradellaChordRegisterOctave`, and `stradellaChordRegisterGrouping`.

**Scope:** these are nominal one-pitch-per-tone assumptions, *not* an acoustic recording of any particular accordion. They determine the nominal pitches listed from low to high in the Chord Finder and four-level diagram notes, as well as the modeled lowest pitch used for inversion analysis. When **Follow configured Stradella registers** is enabled under La Melodiosa playback, they also determine the MIDI pitches requested from the sampler. The underlying WAV files and the selected sample reed register I/II/III do not change. Acoustic reed doublings within a sample can alter the perceived lowest note. These settings never change chord identity, harmonic completeness, ergonomics or the optional synthesizer's mapping. With register-aware density ranking enabled, changing modeled octaves can slightly reorder otherwise comparable Chord Finder recommendations.

## Stradella Chord Finder diagram notes

**Show diagram explanation** controls the four optional footer levels: **Harmonic identity**, **Pitch-class realization**, **Physical realization**, and **Registral voicing**. They appear in that order in the settings menu and in exported SVG/PNG diagrams. The level checkboxes appear when the master option is enabled; disabling it preserves their selections. All four levels are enabled by default, and hiding all four removes the footer and its reserved space.

**Registral voicing** lists nominal modeled pitches and octaves (including `×2` for duplicated unisons) from the configured Stradella bass and chord registers. These values do not represent measured acoustic frequencies. The nested **Show nominal note spacing** option, on by default, substitutes an interval chart for the pitch list. It displays semitone differences between adjacent nominal pitches, marks one-semitone gaps red, and includes the chart in SVG/PNG exports. The diagram text-size control affects the chart within bounded font sizes. Its pitch-marker positions and connecting interval lines remain strictly proportional to semitones; note labels use separate rows for collision avoidance, short marker ticks, and interval counts below the axis. Hiding Registral voicing disables the nested control without changing its stored value. The checkbox value is stored in settings JSON as `stradellaShowNominalNoteSpacing`; older settings without that field use the default. The diagram footer uses one shared label column across all four explanation levels. Preset chord-button symbols are compact while bass/counterbass roles remain unabbreviated; only the subordinate spacing option is indented in the settings panel. Neither option alters chord generation, harmonic interpretation, ranking, audio, or filenames.

The import/export setting `stradellaNoteLevels` is an object with boolean fields `identity`, `pitchClasses`, `voicing`, and `physical`, all `true` by default. Older settings files omit this object and continue to show all four lines. A partially specified object defaults only its missing/invalid fields to `true`. The default settings file in `public/default-settings.json` contains the same keys.

## Sound settings

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
| `soundNoteDurationMs` | Default button-click note duration. |
| `stradellaBassVoicing` | Chooses the synthetic voicing used for Stradella bass buttons. |

The sound engine uses the browser Web Audio API. The built-in synthesizer is an explicit alternative for reference and practice. La Melodiosa plays recorded WAV samples using its SFZ region mappings; outside the mapped range it transposes the nearest available recording rather than falling back to synthesis. If no usable sample loads, that note is silent and a warning is logged.


### Compact settings controls

The Appearance sliders display each translated label, its current value and a range control in a compact vertical group. The Stradella row-label action is a full-width Show/Hide toggle alongside the button-label and bellows-guide actions. Sound has contextual help for the source and pitch-mapping controls; the visible mapping summary identifies the currently selected behavior. Stradella registers use two mirrored groups for bass/counterbass and preset chords. Each shows its configured nominal range and a grouping tooltip; the section help distinguishes configured pitches from measured accordion voicing. La Melodiosa attribution and transposition limitations remain in About and this guide.

### La Melodiosa attribution

The **La Melodiosa** sample set was sampled, edited, and programmed by **Petri Pohjanmies (Finland), 2026**, and is distributed under the **Creative Commons Attribution (CC-BY)** license. Accordion-Tools preserves the supplied SFZ mapping details, including separate bass/treble registers, tuning offsets, relative levels, and treble sample alternation. The original README and preset files are retained in `public/samples/la-melodiosa/` together with an `ATTRIBUTION.txt` file.

## Harmony Explorer settings

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

## Progression Assistant settings

| Setting | Purpose |
|---|---|
| `progressionAllowApproximations` | Allows conservative fifth-omission Stradella approximations. Default: `true`. |
| `progressionRhythmPattern` | Progression Assistant playback pattern: `block`, `oom-pah`, or `waltz`. |
| `progressionHandMovementWeight` | Weight from `0` to `1` assigned to physical Stradella movement versus pitch-class voice motion. Default: `0.65`. |

## Tool defaults

| Setting | Purpose |
|---|---|
| `scaleFinderDisplayMode` | Default path display mode for Scale Finder. |
| `scaleFinderRoot` | Default Scale Finder root. |
| `scaleFinderPattern` | Default Scale Finder pattern. |
| `scaleFinderRowLimit` | Default treble-row limit for Scale Finder. |
| `stradellaChordFinderMode` | Default search mode for Stradella Chord Finder. |
| `stradellaChordFinderMarkRootBass` | Marks the root bass as a visual reference in chord-button results. |

The Stradella Chord Finder has a master **Show diagram explanation** checkbox with dependent level controls and tooltip guidance; its chord/realization title is controlled centrally by **Title** settings. The root bass location reference in **Chord buttons only** is now controlled by a Show/Hide button. SVG/PNG downloads use the displayed diagram title as their sanitized filename (or a layout-based fallback).
| `chordFinderRoot` | Default Chord Finder root. |
| `chordFinderPattern` | Default Chord Finder pattern. |
| `chordFinderInversion` | Default Chord Finder inversion. |
| `chordFinderOctave` | Default Chord Finder octave. |
| `abcStradellaMode` | Default ABC mapping mode in Stradella mode. |
| `abcTrebleChordSymbolsMode` | Default quoted chord-symbol behavior in Treble mode. |
| `bassPatternChordVoicing` | Bass Pattern Player chord voicing: simple chord button or fuller recipe when available. |
| `bassPatternRepeatsPerChord` | Number of complete bass-pattern cycles played for each progression chord. |
| `bassPatternTempoBpm` | Default Bass Pattern Player tempo. |
| `bassPatternLoopMode` | Default Bass Pattern Player repeat mode. |
| `bassPatternLoopCount` | Default fixed repeat count when repeat mode is fixed. |
| `abcTempoBpm` | Default ABC Player tempo when the tune does not override it. |
| `soundSequenceTempoBpm` | Default Sequence Tool playback tempo. |
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

## Bass Pattern Player repeat behavior

Playback repeat controls are part of the Bass Pattern Player UI. They can play once, repeat a fixed number of times, or loop until stopped.

The repeat control affects playback only. The pattern definition still describes one pattern cycle, while the progression and repeats-per-chord setting determine the expanded accompaniment.

## ABC example manifest

Built-in ABC examples are not discovered by scanning the folder at runtime. The browser loads this manifest instead:

```text
public/abc/examples.json
```

To add a new example to the dropdown, place the `.abc` file in `public/abc/` and add a manifest entry with `value`, `label`, and `file`.

## Recommended workflow

1. Adjust the app interactively until it looks and behaves the way you want.
2. Save the settings JSON from the About panel.
3. Keep that saved file as a backup.
4. If you are publishing your own build, copy the relevant values into `public/default-settings.json`.


Harmony settings include an optional **Show inner note ring** control (off by default).

## In-app documentation

Open **Settings → About → Open documentation** to read the user guides without leaving Accordion Tools. The viewer includes topic navigation and a text search across the bundled Markdown guides. Links between Markdown guides open the corresponding topic in the viewer. The **Open README.md** link remains available for viewing the GitHub version.

## Contextual diagram titles

The `titleMode` setting supports **Auto** (instrument/layout), **Contextual** (default; chord/scale and selection information when a finder is active), **Custom**, and **None**. Contextual titles apply to both Chord Finders and both Scale Finders. There are no competing Chord Finder title checkboxes. The annotation checkbox in Stradella and the extended-chord voicing-note checkbox in Treble control footer text only. SVG/PNG filenames are ASCII-safe, with individual Stradella realization buttons included when Contextual is selected.

## Treble layout range

Chromatic-button instruments now offer **1 octave** and **2 octaves** in addition to all previous Treble size presets. The compact options center a window on selected buttons and expand to the smallest available larger preset if necessary. Piano range presets are unchanged. Export uses the actual resulting diagram width.

### La Melodiosa sampled register-following mode

The preferred sound source is **La Melodiosa**. With **Follow configured Stradella registers** enabled, each sounded bass/counterbass button is assigned one nominal MIDI pitch from the selected bass range, and each pitch class contributed by a preset chord button is assigned one nominal MIDI pitch from the selected chord range. The selected physical buttons are preserved. For example, with bass `F2–E3` and chord `F3–E4`, a C bass sounds as nominal C3 and a C-major chord requests C4–E4–G3. The Chord Finder's nominal lowest note and sample MIDI requests therefore agree. This also applies to other features that call the shared Stradella button playback engine (such as Bass Pattern Player and physical-button progressions); Harmony Explorer's abstract pitch-class chord player keeps its own convention.

**Native mapping versus transposition.** La Melodiosa's bundled bass-side SFZ covers MIDI 36–59 (C2–B3) in reed selections I, II and III. Within this range its regions still transpose nearby recorded WAV samples: "native range" does not imply a separate recording of every semitone. For requested notes outside C2–B3, the sampler selects the nearest bass-side region of the chosen sample register and alters WAV playback rate to reach the requested MIDI pitch. The treble-side sample map is independent. Extreme shifts may alter timbre, attack, sustain, perceived reed registers and note duration. Recorded samples may contain octave-doubled partials, so the result is not a measured replication of a specific acoustic accordion.

**No automatic synthetic fallback.** When La Melodiosa is selected, missing or invalid sample mappings produce a warning and silence for the affected note rather than silently substituting an oscillator. The synthesizer remains available only if the user explicitly selects it as the sound source. No missing sample recordings are fabricated.

For a direct comparison, select **Original mapping** (rather than **Configured registers**) in the sampled playback mapping control to leave sampled note requests at the original C2–B2 bass and C3–B3 chord ranges. Analytical descriptions continue to use the separately configured ranges in this legacy playback mode, so their computed lowest notes may not match what is requested from the sampler. Settings files from older versions are supported: the new mode defaults to `true` if the key is absent.

## Chord symbol style

In **Settings → Notation**, choose one of three display formats: **C / Cm**, **CM / Cm**, or **Cmaj / Cmin**. Extended major and minor chord labels follow the same family convention. This setting applies to chord labels in diagrams, Harmony Explorer, progression lists, contextual titles and descriptive text.

It does not modify pitch classes, audio, chord recognition, ABC/MIDI notation, or existing sanitized SVG/PNG filename conventions. The selection can be included in exported settings.

### Stradella nominal-gap preference and Reset

The Chord Finder's **Minimum nominal note gap** setting is saved as `stradellaMinimumNominalGap`: `0` permits all gaps (default), `2` excludes adjacent pitches 1 semitone apart, and `3` excludes pitches 1 or 2 semitones apart. Distinct nominal MIDI pitches are used; shared pitch classes and unison doublings are not automatically treated as clashes. Import/export of the settings JSON preserves this choice.

The top-bar **Reset** menu offers separate actions for clearing transient work and, when supported, restoring the current tool's defaults. This does not reset the application's global Sound or Stradella register configuration.
