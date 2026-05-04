# Accordion-Tools

Accordion-Tools is a browser-based accordion and music-layout diagram generator built with React, TypeScript, Vite, and npm.

It helps accordion players, students, and teachers create clear visual diagrams for Stradella bass, chromatic button accordion treble, and piano treble layouts. The app can be used for reference, teaching, practice planning, fingering notes, scale and chord exploration, sound playback, and exporting diagrams as SVG or PNG files.

## Live Site

The GitHub Pages site is configured for:

```text
https://gilsag.github.io/Accordion-Tools/
```

## Main Features

### Stradella Bass Diagrams

The app can generate Stradella bass layouts in many common sizes, including 8, 12, 24, 32, 40, 48, 60, 72, 80, 96, 100, and 120 bass layouts.

Depending on the selected layout, the diagram can show bass rows, counterbass rows, major chords, minor chords, dominant seventh chords, and diminished seventh chords.

### Chromatic Button Accordion Treble Diagrams

The app can generate chromatic button accordion treble diagrams for:

- C-system
- B-system / Bayan
- 3, 4, or 5 rows
- Small, full-size, and large range presets

The treble layout can also show or hide octave numbers.

### Piano Treble Diagrams

The Treble top-bar mode includes a layout selector for C-system, B-system/Bayan, or Piano keyboard. The piano option draws a horizontal piano keyboard while reusing the same musical logic used by the accordion treble tools.

Supported piano treble ranges include:

- Two octaves, C4–C6
- Three octaves, C3–C6
- Four octaves, C2–C6

The piano treble view supports note labels, octave numbers, selection, fingering, sequence recording, sound playback, Scale Finder, Chord Finder, text notes, and SVG or PNG export.

### Notation Options

The app supports several notation styles:

- English note names, such as `C D E F`
- German note names, such as `C D E F G A H`
- Solfege, such as `Do Re Mi Fa`
- Intervals
- Blank labels

Accidental spelling can also be adjusted:

- Default spelling
- Prefer flats
- Prefer sharps

### Scale Finder

The Scale Finder works on treble layouts and Stradella layouts. On treble layouts it can highlight a one-octave scale path and play it when sound is enabled. On Stradella layouts it uses only the bass and counterbass note rows, choosing buttons close to the selected root when possible. Some scales may not be available on smaller Stradella configurations.

Supported scale types include:

- Major scale
- Natural minor scale
- Harmonic minor scale
- Major pentatonic scale
- Minor pentatonic scale
- Major blues scale
- Minor blues scale
- Chromatic scale

### Chord Finder

The Chord Finder works on treble layouts. It finds compact chord shapes around a selected root and supports inversions.

Supported chord types include:

- Major triad
- Minor triad
- Augmented triad
- Diminished triad
- Suspended fourth
- Dominant seventh
- Major 6
- Dominant 7♭5
- Dominant 7♭9
- Dominant 9
- 9sus4
- Dominant 11
- Major seventh
- Major 7/9
- Minor seventh
- Half-diminished seventh
- Minor 9
- Minor major 9
- Diminished seventh

### Selection, Fingering, and Sequence Tools

Users can select buttons or piano keys, apply fingering labels, and record ordered sequences.

Sequences can display:

- Numbers
- Straight arrows
- Curved arrows
- Numbers and arrows together

These tools are useful for showing melodies, exercises, scale paths, chord shapes, fingering ideas, or movement patterns.

### Text Notes

The app lets users place custom multiline text notes directly on the SVG diagram. These notes can be used for reminders, explanations, lesson comments, or practice instructions.

### Sound Playback

Accordion-Tools includes a browser-based synthetic sound engine using the Web Audio API.

Sound can be used for:

- Button or key clicks
- Selected-button playback
- Scale Finder playback
- Chord Finder playback
- Recorded sequence playback

The sound is synthetic and is intended as a lightweight practice/reference aid, not as a realistic sampled accordion. Single Stradella bass buttons have a configurable bass voicing setting, because real accordion bass registers vary by instrument.

### File Download

The current diagram can be downloaded as an SVG or PNG file. Choose the file type from the top-bar download selector; the download button label updates automatically. SVG is best for editing and scaling, while PNG is convenient for sharing, slides, and quick printing.

### About Panel

The Settings panel includes a short About section with the app name, author link, README link, app version, and license information. Settings and tool sections start collapsed by default.

### Editable Default Settings

The app reads startup defaults from:

```text
public/default-settings.json
```

This file can be edited before building or publishing the app. It lets a user change common startup behavior, such as the default side, notation style, treble layout, bass size, download format, and whether selection-on-click starts enabled or disabled.

For example, the default file includes:

```json
{
  "side": "stradella",
  "notation": "english",
  "basses": "96",
  "trebleLayout": "c-system",
  "selectionOnClick": false,
  "downloadFormat": "svg",
  "stradellaBassVoicing": "single-low"
}
```

If the file is missing or contains an invalid value, the app falls back to its built-in defaults.

## Stradella Chord Finder

The app includes a separate Stradella Chord Finder implemented in:

```text
src/tools/stradellaChordFinderTools.ts
```

It is separate from the treble Chord Finder because the Stradella bass system is not a free chromatic keyboard. It has single-note bass/counterbass rows plus prebuilt chord rows, so the finder uses Stradella-specific rules instead of treble-style inversions.

The Stradella Chord Finder supports three search modes:

1. **Bass rows only**: finds the requested chord tones using the closest available single-note bass and counterbass buttons, always choosing the nearest available button relative to the root. Playback sounds the notes in pitch order and then plays the full chord.
2. **Chord buttons only**: uses exact, repeatable Stradella chord-row recipes. The same relative pattern is transposed for every root. The optional root bass marker is only a visual reference and does not count as a sounded chord tone.
3. **Bass + chord buttons**: first tries the exact chord-buttons-only result. If that is not available, it searches for chord buttons that add no unwanted tones, then adds the closest bass/counterbass buttons needed to complete the chord exactly.

Chord-buttons-only mode can also mark the root bass note in a different color. It does not show a recipe if the available chord buttons would add tones outside the requested chord.

The Stradella Chord Finder highlights button combinations only. It intentionally does **not** draw arrows on the Stradella layout, because Stradella chord-finder results are simultaneous button combinations rather than melodic paths.

There is intentionally no inversion option for the Stradella Chord Finder. Standard Stradella does not offer free inversion choices like a piano or chromatic treble side.

The current chord set includes major, minor, augmented, diminished, sixth, seventh, ninth, eleventh, major-nine, minor-six, minor-major-seven, minor-nine, and minor-major-nine patterns. Chord types that cannot be made exactly in the selected mode are shown as not found.

## ABC Player

Accordion-Tools includes an ABC Player that can load or paste a simple ABC tune, parse notes, durations, accidentals, octaves, rests, bracketed note chords, and quoted chord symbols.

In Treble mode, the player highlights matching chromatic-button or piano treble notes while it plays. Quoted chord symbols can be ignored or optionally played as treble block chords.

In Stradella mode, the player can use one of three mapping modes:

- **Bass notes only**: maps written ABC pitches to bass/counterbass note buttons.
- **Chord symbols only**: maps quoted ABC chord symbols, such as `"C"`, `"G7"`, or `"Am"`, to Stradella chord-button recipes.
- **Bass notes + chord symbols**: combines written ABC bass notes with quoted chord-symbol accompaniment.

The player includes Play, Pause, Continue, Stop, tempo control, and a position slider. It reports notes or chord symbols that cannot be shown in the selected layout or mapping mode. Full ABC repeats, tuplets, ornaments, and multi-voice two-hand playback are still future improvements.

## Stradella Bass Pattern Player

Accordion-Tools includes a first data-driven Stradella Bass Pattern Player. It combines a reusable bass pattern with a Roman-numeral chord progression and a selected root note.

Built-in pattern definitions are stored in:

```text
public/bass-patterns/bass-patterns.json
```

Built-in progression definitions are stored in:

```text
public/chord-progressions/chord-progressions.json
```

The first version includes patterns such as polka / oom-pah, oom-pah-pah waltz, alternate-bass polka, and tango / habanera. It also includes progressions such as I–IV–V–I, I–vi–ii–V7, minor i–iv–V7–i, and 12-bar blues.

## Project Structure

```text
Accordion-Tools/
├── public/
│   └── default-settings.json
├── src/
│   ├── tools/
│   ├── App.css
│   ├── App.tsx
│   ├── download.ts
│   ├── main.tsx
│   ├── music.tsx
│   ├── pianoTreble.ts
│   ├── sound.ts
│   ├── stradella.ts
│   ├── treble.ts
│   └── types.ts
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── README.md
└── LICENSE
```

## Important Source Files

### `src/App.tsx`

Main application component. It manages the interface, settings, selected buttons, fingerings, sequences, text notes, sound controls, and SVG rendering.

### `src/music.tsx`

Shared musical logic. It contains note-name tables, pitch formatting, transposition helpers, chord labels, chord tones, and music-label rendering.

### `src/stradella.ts`

Stradella bass layout generator.

### `src/treble.ts`

Chromatic button accordion treble layout generator.

### `src/pianoTreble.ts`

Piano treble keyboard layout generator. It creates piano keys using the same `DiagramButton` shape as the accordion layouts, so existing tools can work with the piano view.

### `src/tools/scaleFinderTools.ts`

Scale Finder logic for treble layouts.

### `src/tools/chordFinderTools.ts`

Chord Finder logic for treble layouts.

### `src/sound.ts`

Browser sound engine using the Web Audio API.

### `src/download.ts`

SVG and PNG download helpers.

## Requirements

To run the project locally, you need:

- Node.js
- npm

Check whether they are installed:

```bash
node --version
npm --version
```

## Running the Project Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will show a local address, usually:

```text
http://localhost:5173/
```

Open that address in your browser.

## Building the Project

Create a production build:

```bash
npm run build
```

The production files are created in:

```text
dist/
```

## Deploying to GitHub Pages

This project is configured for GitHub Pages under the repository name:

```text
Accordion-Tools
```

The Vite configuration should include:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Accordion-Tools/',
})
```

In GitHub, go to:

```text
Settings → Pages → Build and deployment
```

Then set the source to:

```text
GitHub Actions
```

If the repository name changes, the `base` value in `vite.config.ts` must also be changed.

## Files Not to Upload

Do not upload:

```text
node_modules/
```

This folder is large and can be recreated with:

```bash
npm install
```

Also avoid uploading private files such as:

```text
.env
```

These may contain passwords, tokens, or private settings.


### Stradella Chord Finder root marker

In Chord buttons only mode, the Stradella Chord Finder can also mark the named root bass note in a different color. This marker is enabled by default and is meant as a visual reference; the chord-button-only recipe itself remains based only on chord-row buttons.


## Code Organization Notes

The app keeps shared chord definitions in `src/music/chordDefinitions.ts`, app metadata in `src/config/appInfo.ts`, and Stradella-specific chord-finder helpers under `src/tools/stradellaChordFinder/`. The Stradella folder separates button voicings, fixed chord-button recipes, search modes, shared search utilities, and result formatting. Reusable UI pieces now live under `src/components/`, including the collapsible section shell, the About panel, the Treble Chord Finder panel, and the Stradella Chord Finder panel. This makes the chord logic and visible panels easier to review and extend.

## Automated Tests

The project includes small command-line tests for musical logic. The Stradella chord tests check important cases such as C7 chord-button recipes, Cm7♭5 chord-button recipes, Not Found behavior for augmented and minor-major seventh chords, closest bass-row selection, and mixed bass/chord-button results. The notation tests check English, German, Solfege, interval, blank, forced-sharp, forced-flat, and Stradella button-label spelling.

Run the Stradella chord tests with:

```bash
npm run test:chords
```

Run the notation/spelling tests with:

```bash
npm run test:notation
```

Run all tests with:

```bash
npm run test:all
```

The normal production build is still:

```bash
npm run build
```

### Version 0.5.6 notes

This version refines the left-panel layout so expanded menus scroll inside the sidebar without covering the diagram, starts sound enabled by default, reorders Settings as Layout, Notation, Appearance, Sound, Title, and About, and moves Selection above Fingering in Tools. It also adds an Appearance slider for vertical spacing between the title, bellows guide, and buttons, plus piano-key width and height controls for Piano Treble.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

You may copy, fork, modify, and reuse this project for personal, educational, and other non-commercial purposes, as long as appropriate credit is given.

Commercial use is not permitted without prior written permission.

See the `LICENSE` file for more details.

## Author

Created by Esteban Gil (`gilsag`).



## Layout note

Version 0.5.6 adds a Focus diagram button, interface density control, diagram scale control, compact result cards for chord finders, and inline tooltips for important controls.

## Version 0.5.7 notes

Version 0.5.7 adds an optional status bar above the diagram. The status bar summarizes the current side, layout, notation, sound state, and active tool, and can be turned off in Appearance settings.

This version also adds file-based settings save/load controls in Settings → About. Saving downloads a separate `accordion-tools-settings.json` file, and loading applies a chosen settings JSON to the current session. This does not overwrite `public/default-settings.json`, so the editable default file remains available as the app's normal startup defaults.

## Version 0.5.8 notes

Version 0.5.8 adds a Stradella Scale Finder that uses only bass and counterbass note buttons, with the same scale types as the treble Scale Finder. It also adjusts tooltip styling so help icons sit inline next to their label text instead of below it.

## Version 0.6.2 notes

Version 0.6.2 adds a Scale Finder display option shared by treble and Stradella Scale Finder. Scale paths can now be shown as numbers only, straight arrows, curved arrows, numbers plus straight arrows, or numbers plus curved arrows.


## v0.6.2 Notes

- Stradella Scale Finder now prefers smoother physical movement between consecutive scale notes, while still staying near the root position.
- Fixed sidebar/grid sizing so wider side menus reserve their own space instead of overlapping the top bar, status bar, or diagram.


## Built-in ABC examples

The ABC Player includes example tunes stored in `public/abc/`:

- `c-major-scale.abc`
- `happy-birthday.abc`
- `twinkle-little-star.abc`
- `dyads-and-chords.abc`
- `stradella-chord-symbols.abc`

These examples can be loaded from the ABC Player dropdown. Personal `.abc` files do not need to be stored in the project; they can be loaded with the file picker.

## Version 0.6.5 notes

Version 0.6.5 adds an optional Treble ABC chord-symbol playback mode and introduces a first Stradella Bass Pattern Player. The new pattern player loads reusable bass patterns and Roman-numeral chord progressions from `public/` JSON files.

## Version 0.6.6 notes

Version 0.6.6 adds a **Chord voicing** option to the Stradella Bass Pattern Player:

- **Simple chord button** uses the practical single Stradella chord-row button for each progression chord. For example, `V7` uses only the dominant seventh button.
- **Full recipe when available** uses the fuller Stradella Chord Finder recipe when the pattern calls for a chord.

The default is **Simple chord button**, which better matches ordinary accompaniment patterns such as polka, waltz, and oom-pah figures.
