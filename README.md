# Accordion-Tools

Accordion-Tools is a browser-based accordion and music-layout diagram generator built with React, TypeScript, Vite, and npm.

It helps accordion players, students, and teachers create visual diagrams for Stradella bass, chromatic button accordion treble, and piano treble layouts. The app can be used for reference, teaching, practice planning, fingering notes, scale and chord exploration, ABC playback, Stradella accompaniment patterns, sound playback, and exporting diagrams as SVG or PNG files.

Current app version: **0.8.2**

## Live Site

```text
https://gilsag.github.io/Accordion-Tools/
```

## Highlights

- Stradella bass diagrams from small layouts up to 120 bass.
- Treble diagrams for C-system, B-system/Bayan, and piano keyboard layouts.
- Multiple notation styles: English, German, solfege, intervals, or blank labels.
- Scale Finder, Chord Finder, Selection, Fingering, Sequence, and Annotate Diagram tools.
- ABC Player for simple ABC notation playback and diagram highlighting.
- Stradella Bass Pattern Player with chord progressions, repeats-per-chord, repeat/loop playback, rendered Stradella staff notation, custom pattern editor, and local custom pattern storage.
- Progression-aware ABC, MIDI, and LilyPond `.ly` export from the Bass Pattern Player.
- SVG and PNG diagram export.
- Save/load settings JSON and editable startup defaults.

## Documentation

Detailed documentation lives in the [`docs/`](docs/) folder.

| Document | Purpose |
|---|---|
| [`docs/settings.md`](docs/settings.md) | App settings, startup defaults, and save/load behavior. |
| [`docs/selection-tool.md`](docs/selection-tool.md) | Marking selected buttons/keys. |
| [`docs/fingering-tool.md`](docs/fingering-tool.md) | Adding finger numbers to diagrams. |
| [`docs/sequence-tool.md`](docs/sequence-tool.md) | Creating ordered paths with numbers/arrows. |
| [`docs/annotate-diagram-tool.md`](docs/annotate-diagram-tool.md) | Adding button-attached and free-position annotations to diagrams. |
| [`docs/scale-finder.md`](docs/scale-finder.md) | Treble and Stradella scale paths. |
| [`docs/chord-finder.md`](docs/chord-finder.md) | Treble and Stradella chord search. |
| [`docs/abc-player.md`](docs/abc-player.md) | ABC playback and diagram mapping. |
| [`docs/bass-pattern-player.md`](docs/bass-pattern-player.md) | Bass Pattern Player workflow, notation, looping, and exports. |
| [`docs/bass-pattern-format.md`](docs/bass-pattern-format.md) | Bass pattern file format, rhythm syntax, accents, ties, tuplets, and tokens. |

## Diagram Layouts

Accordion-Tools supports three main visual layout families:

- **Stradella bass layouts**
- **Chromatic button accordion treble layouts**
- **Piano treble layouts**

The top bar switches between Stradella and Treble. In Treble mode, the Layout settings choose between C-system, B-system/Bayan, and Piano keyboard.

### Stradella Bass Diagrams

The app can generate Stradella bass layouts in many common sizes:

- 8 bass
- 12 bass
- 24 bass
- 32 bass
- 40 bass
- 48 bass
- 60 bass
- 72 bass
- 80 bass
- 96 bass
- 100 bass
- 120 bass

Depending on the selected layout, the diagram can show bass rows, counterbass rows, major chords, minor chords, dominant seventh chords, and diminished seventh chords.

### Chromatic Button Accordion Treble Diagrams

The app can generate chromatic button accordion treble diagrams for:

- C-system
- B-system / Bayan
- 3, 4, or 5 rows
- small, full-size, and large range presets

The treble layout can show or hide octave numbers.

### Piano Treble Diagrams

Piano Treble draws a horizontal piano keyboard while reusing the same musical logic used by the accordion treble tools.

Supported piano treble ranges include:

- C4–C6
- C3–C6
- C2–C6

Piano appearance can be adjusted with key-width and key-height controls.

## Notation and Appearance

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

Appearance controls include color theme, label visibility, button size, spacing, line thickness, diagram scale, piano key size, interface density, vertical spacing, and status bar visibility.

The **Focus diagram** button hides the side controls and gives more room to the diagram.

## Tools Overview

The Tools panel changes depending on whether the app is in Treble or Stradella mode. Tools and settings start collapsed by default.

### Selection Tool

Marks individual buttons or keys. Selected items can be reviewed, cleared, played back, and included in SVG/PNG exports.

See [`docs/selection-tool.md`](docs/selection-tool.md).

### Fingering Tool

Adds finger numbers to selected buttons or keys. Numbers can appear inside the button or above it.

See [`docs/fingering-tool.md`](docs/fingering-tool.md).

### Sequence Tool

Records ordered paths for melodies, exercises, scales, arpeggios, and bass movement. Sequences can display numbers, arrows, or both.

See [`docs/sequence-tool.md`](docs/sequence-tool.md).

### Annotate Diagram

Adds inline annotations directly on the diagram. Click a button or empty diagram location, type the annotation in place, and manage annotations from the Tools panel list.

See [`docs/annotate-diagram-tool.md`](docs/annotate-diagram-tool.md).

### Scale Finder

Highlights scale paths in Treble or Stradella mode. Treble mode supports C-system, B-system/Bayan, and piano layouts. Stradella mode uses bass and counterbass note buttons.

See [`docs/scale-finder.md`](docs/scale-finder.md).

### Chord Finder

Finds chord shapes on treble layouts and Stradella layouts. Stradella mode supports bass-rows-only, chord-buttons-only, and bass-plus-chord search modes.

See [`docs/chord-finder.md`](docs/chord-finder.md).

### ABC Player

Loads or pastes simple ABC notation and animates the current diagram during playback. It supports notes, rests, durations, accidentals, key signatures, bracketed note chords, quoted chord symbols, tempo control, and playback controls.

See [`docs/abc-player.md`](docs/abc-player.md).

### Stradella Bass Pattern Player

Combines a reusable bass pattern with a Roman-numeral chord progression and selected root/key.

Recent features include:

- compact progression library format
- expanded built-in progression list
- repeats-per-chord setting
- fixed repeat and infinite loop playback
- collapsible custom pattern editor with live validation
- local custom pattern library stored in the browser
- rendered staff notation preview using abcjs and simplified Stradella bass conventions, with SVG download
- notation-level ties
- rational rhythm values for tuplets and syncopation
- compact pattern notation with accents, rests, barlines, simultaneous groups, and durations
- progression-aware ABC, MIDI, and LilyPond `.ly` export

See [`docs/bass-pattern-player.md`](docs/bass-pattern-player.md) and [`docs/bass-pattern-format.md`](docs/bass-pattern-format.md).

## Bass Pattern and Progression Files

Built-in bass patterns are stored in:

```text
public/bass-patterns/bass-patterns.json
```

Built-in chord progressions are stored in:

```text
public/chord-progressions/chord-progressions.json
```

The chord-progression file uses a compact format such as:

```json
{
  "id": "i-iv-v-i",
  "name": "I–IV–V–I progression",
  "progression": "I IV V I",
  "description": "A simple tonic–subdominant–dominant–tonic progression."
}
```

The bass-pattern file supports explicit steps and compact pattern strings. See [`docs/bass-pattern-format.md`](docs/bass-pattern-format.md) before editing it manually.

## Sound Playback

Accordion-Tools includes a browser-based synthetic sound engine using the Web Audio API.

Sound can be used for:

- button/key clicks
- selected-button playback
- Scale Finder playback
- Chord Finder playback
- Sequence playback
- ABC playback
- Bass Pattern Player playback

The sound is synthetic and intended as a lightweight practice/reference aid, not as a realistic sampled accordion.

## Download and Export

The current diagram can be downloaded as:

- SVG
- PNG

The Bass Pattern Player can also export the expanded accompaniment as:

- ABC sketch
- MIDI file

The ABC/MIDI export uses the selected root, selected progression, repeats per chord, selected pattern, pattern bar count, and tempo.

## Settings and Defaults

Startup defaults are read from:

```text
public/default-settings.json
```

The About panel can save and load settings JSON files for the current session.

See [`docs/settings.md`](docs/settings.md) for details.

## Project Structure

```text
Accordion-Tools/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   ├── abc-player.md
│   ├── bass-pattern-format.md
│   ├── bass-pattern-player.md
│   ├── chord-finder.md
│   ├── fingering-tool.md
│   ├── scale-finder.md
│   ├── selection-tool.md
│   ├── sequence-tool.md
│   ├── settings.md
│   └── annotate-diagram-tool.md
├── public/
│   ├── abc/
│   ├── bass-patterns/
│   │   └── bass-patterns.json
│   ├── chord-progressions/
│   │   └── chord-progressions.json
│   ├── default-settings.json
│   ├── favicon.svg
│   └── icons.svg
├── scripts/
│   ├── chord-logic.test.ts
│   └── notation.test.ts
├── src/
│   ├── components/
│   ├── config/
│   ├── music/
│   ├── tools/
│   ├── App.css
│   ├── App.tsx
│   ├── download.ts
│   ├── index.css
│   ├── main.tsx
│   ├── music.tsx
│   ├── pianoTreble.ts
│   ├── sound.ts
│   ├── stradella.ts
│   ├── treble.ts
│   └── types.ts
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── LICENSE
```

## Important Source Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Main application component and UI coordination. |
| `src/types.ts` | Shared TypeScript types for settings, tools, diagram buttons, ABC, and bass patterns. |
| `src/music.tsx` | Musical helpers for notes, labels, transposition, and chord tones. |
| `src/music/chordDefinitions.ts` | Central chord-definition list. |
| `src/stradella.ts` | Stradella bass layout generator. |
| `src/treble.ts` | Chromatic-button treble layout generator. |
| `src/pianoTreble.ts` | Piano keyboard layout generator. |
| `src/sound.ts` | Web Audio sound engine. |
| `src/download.ts` | SVG and PNG export helpers. |
| `src/tools/abcPlayerTools.ts` | ABC parsing, timing, chord-symbol mapping, and playback helpers. |
| `src/tools/bassPatternPlayerTools.ts` | Bass Pattern Player loading, validation, progression expansion, rhythm parsing, export, and playback-event logic. |
| `src/tools/stradellaChordFinder/` | Stradella-specific chord-finder implementation. |

## Automated Tests

Run the Stradella chord tests:

```bash
npm run test:chords
```

Run the notation/spelling tests:

```bash
npm run test:notation
```

Run all tests:

```bash
npm run test:all
```

## Requirements

To run the project locally, install:

- Node.js
- npm

Check installation:

```bash
node --version
npm --version
```

## Running Locally

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

## Building

Create a production build:

```bash
npm run build
```

The production files are created in:

```text
dist/
```

## Previewing a Production Build

After building, preview the production bundle locally:

```bash
npm run preview
```

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.

See [`LICENSE`](LICENSE) for details.
