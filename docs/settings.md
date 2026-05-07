# Settings Guide

Accordion-Tools has two kinds of settings:

1. **Session settings** changed in the browser while using the app.
2. **Startup defaults** stored in `public/default-settings.json` and loaded when the app starts.

The app also lets you save and load a separate settings JSON file from the About panel. Loading a settings file changes the current session; it does not rewrite `public/default-settings.json`.

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
| `trebleSize` | Treble range preset for chromatic-button layouts. |
| `pianoTrebleRange` | Piano keyboard range preset. |
| `showTrebleOctaves` | Shows or hides octave numbers on treble labels. |

## Notation settings

| Setting | Purpose |
|---|---|
| `notation` | Label style: English, German, solfege, intervals, or blank labels. |
| `accidental` | Accidental spelling preference: default/natural, prefer sharps, or prefer flats. |
| `chordLabelMode` | Controls how chord labels are displayed. |


## Music notation settings

These settings control the rendered staff-notation panels that appear below the diagram for Bass Pattern Player, ABC Player, and Sequence Tool.

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
| `titleMode` | Automatic, custom, or hidden title behavior. |
| `customTitle` | Title used when custom title mode is active. |
| `showButtonLabels` | Shows or hides button/key labels. |
| `showBellowsGuide` | Shows or hides the bellows guide. |
| `showStradellaRowLabels` | Shows or hides Stradella row labels. |
| `diagramVerticalSpacing` | Vertical spacing between title, bellows guide, and diagram. |
| `diagramScale` | Overall diagram scale percentage. |
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

## Sound settings

| Setting | Purpose |
|---|---|
| `soundEnabled` | Enables or disables browser sound playback. |
| `stradellaBassVoicing` | Chooses the synthetic voicing used for Stradella bass buttons. |

The sound engine uses the browser Web Audio API. It is intended for reference and practice, not as a realistic sampled accordion.

## Tool defaults

| Setting | Purpose |
|---|---|
| `scaleFinderDisplayMode` | Default path display mode for Scale Finder. |
| `stradellaChordFinderMode` | Default search mode for Stradella Chord Finder. |
| `stradellaChordFinderMarkRootBass` | Marks the root bass as a visual reference in chord-button results. |
| `abcStradellaMode` | Default ABC mapping mode in Stradella mode. |
| `abcTrebleChordSymbolsMode` | Default quoted chord-symbol behavior in Treble mode. |
| `bassPatternChordVoicing` | Bass Pattern Player chord voicing: simple chord button or fuller recipe when available. |
| `bassPatternRepeatsPerChord` | Number of complete bass-pattern cycles played for each progression chord. |
| `bassPatternTempoBpm` | Default Bass Pattern Player tempo. |
| `bassPatternLoopMode` | Default Bass Pattern Player repeat mode. |
| `bassPatternLoopCount` | Default fixed repeat count when repeat mode is fixed. |
| `abcTempoBpm` | Default ABC Player tempo when the tune does not override it. |
| `soundSequenceTempoBpm` | Default Sequence Tool playback tempo. |

## Bass Pattern Player repeat behavior

Playback repeat controls are part of the Bass Pattern Player UI. They can play once, repeat a fixed number of times, or loop until stopped.

The repeat control affects playback only. The pattern definition still describes one pattern cycle, while the progression and repeats-per-chord setting determine the expanded accompaniment.

## Recommended workflow

1. Adjust the app interactively until it looks and behaves the way you want.
2. Save the settings JSON from the About panel.
3. Keep that saved file as a backup.
4. If you are publishing your own build, copy the relevant values into `public/default-settings.json`.
