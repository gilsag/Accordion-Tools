# Accordion-Tools

Accordion-Tools is a browser-based accordion diagram generator built with React, TypeScript, Vite, and npm.

It helps accordion players, students, and teachers create clear visual diagrams for Stradella bass layouts and chromatic button accordion treble layouts. The app can be used for reference, teaching, practice planning, fingering notes, scale and chord exploration, and exporting diagrams as SVG files.

## Live Site

The GitHub Pages site is configured for:

```text
https://gilsag.github.io/Accordion-Tools/
```

## What the App Does

Accordion-Tools lets you build and customize accordion diagrams directly in the browser.

The app has two main diagram modes:

- **Stradella bass side**
- **Chromatic button accordion treble side**

It also includes tools for selecting buttons, adding fingerings, creating note sequences, finding scales and chords, adding free text notes, playing synthetic sounds, and downloading the finished diagram.

## Main Features

### Stradella Bass Diagrams

The app can generate Stradella bass layouts in many common sizes.

Supported bass presets include:

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

### Stradella Chord Label Options

For Stradella chord buttons, the app can show different kinds of labels:

- No chord labels
- Chord names, such as `C`, `Cm`, or `C7`
- Root names only
- Chord tones
- Row-function labels, such as major, minor, seventh, or diminished function

This makes the app useful both for practical playing charts and for music-theory explanations.

### Chromatic Button Accordion Treble Diagrams

The app can generate chromatic button accordion treble diagrams.

Supported treble systems include:

- C-system
- B-system / Bayan

Supported row options include:

- 3 rows
- 4 rows
- 5 rows

Supported size presets include:

- Small CBA, about 3 octaves
- Full-size CBA, about 3¾–4 octaves
- Large CBA, about 5+ octaves

The treble layout can also show or hide octave numbers.

### Notation Options

The app supports several notation styles:

- English note names, such as `C D E F`
- Solfege, such as `Do Re Mi Fa`
- Intervals
- Blank labels

Accidental spelling can also be adjusted:

- Default spelling
- Prefer flats
- Prefer sharps

This is useful for adapting diagrams to different teaching styles, countries, and musical traditions.

### Scale Finder

The Scale Finder works on the treble side.

It can highlight a one-octave scale path on the chromatic button layout. It can also restrict the path to the first 3, 4, or 5 rows.

Supported scale types include:

- Major scale
- Natural minor scale
- Harmonic minor scale
- Major pentatonic scale
- Minor pentatonic scale
- Major blues scale
- Minor blues scale
- Chromatic scale

The Scale Finder can also play the highlighted scale when sound is enabled.

### Chord Finder

The Chord Finder works on the treble side.

It finds compact chord shapes around a selected root and supports inversions.

Supported chord types include:

- Major triad
- Minor triad
- Augmented triad
- Diminished triad
- Suspended fourth
- Dominant seventh
- Major seventh
- Minor seventh
- Half-diminished seventh
- Diminished seventh

The Chord Finder can play the chord as an arpeggio and then as a chord when sound is enabled.

### Selection Tool

Users can click buttons to select them.

The selected buttons can be reviewed in a list, deselected individually, cleared, or played together. This makes it easy to mark a group of notes or buttons for study.

### Fingering Tool

The Fingering tool lets users add finger numbers to selected buttons or click buttons directly to label them.

Finger numbers can be shown:

- Inside the button near the bottom
- Inside the button near the top
- Above the button

This is useful for creating lesson diagrams, exercise sheets, and personal practice notes.

### Sequence Tool

The Sequence tool lets users record a button sequence by clicking buttons in order.

Sequences can show:

- Numbers
- Straight arrows
- Curved arrows
- Numbers and arrows together

Sequence colors, arrow thickness, arrowhead size, number size, and number position can be customized.

This is useful for showing melodies, exercises, scale paths, or movement patterns.

### Text Notes

The app lets users place custom text notes directly on the SVG diagram.

Text notes can be used for reminders, explanations, lesson comments, or practice instructions.

Text note options include:

- Multiline text
- Font size
- Text color
- Font family
- Text alignment

### Sound Playback

Accordion-Tools includes a browser-based synthetic sound engine using the Web Audio API.

Sound can be used for:

- Button clicks
- Selected-button playback
- Scale Finder playback
- Chord Finder playback
- Recorded sequence playback

Available sound presets include:

- Soft reed
- Bright reed
- Musette detuned reeds
- Organ-like
- Bass reed
- Single oscillator

Sound options include volume, attack, release, note duration, sequence tempo, waveform, and musette detuning.

The sound is synthetic and is intended as a lightweight practice/reference aid, not as a realistic sampled accordion.

### Appearance Customization

The visual appearance of the diagram can be customized.

Options include:

- Color theme
- Label font
- Label font size
- Button size
- Button spacing
- Button line thickness
- Reference button line thickness
- Chord fill strength
- Treble angle
- Accidental button style
- Show or hide button labels
- Show or hide bellows guide
- Show or hide Stradella row labels

Available color themes include:

- Default blue
- Classic ink
- Pastel
- Warm cream
- High contrast
- Print / grayscale

### Titles

Diagram titles can be:

- Generated automatically
- Customized manually
- Hidden

Title font and title size can also be adjusted.

### SVG Download

The current diagram can be downloaded as an SVG file.

This is useful for:

- Printing
- Sharing with students
- Including diagrams in documents
- Saving practice charts
- Preparing teaching material

## Project Structure

```text
Accordion-Tools/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── tools/
│   │   ├── chordFinderTools.ts
│   │   ├── scaleFinderTools.ts
│   │   ├── sequenceTools.ts
│   │   └── textNoteTools.ts
│   ├── App.css
│   ├── App.tsx
│   ├── download.ts
│   ├── index.css
│   ├── main.tsx
│   ├── music.tsx
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

Main application component.

It manages the user interface, settings, selected buttons, fingerings, sequences, text notes, sound controls, and SVG rendering.

### `src/music.tsx`

Shared musical logic.

It contains note-name tables, pitch transposition helpers, notation formatting, chord labels, chord tones, and music-label rendering.

### `src/stradella.ts`

Stradella bass layout generator.

It defines the supported Stradella presets and generates the visible bass and chord buttons.

### `src/treble.ts`

Chromatic button accordion treble layout generator.

It defines the C-system and B-system treble layouts, row behavior, size presets, note metadata, and button geometry.

### `src/tools/scaleFinderTools.ts`

Scale Finder logic for treble-side scale paths.

### `src/tools/chordFinderTools.ts`

Chord Finder logic for treble-side chord shapes and inversions.

### `src/tools/sequenceTools.ts`

Sequence numbering and arrow-path logic.

### `src/tools/textNoteTools.ts`

Helpers for creating and rendering custom text notes.

### `src/sound.ts`

Browser sound engine using the Web Audio API.

### `src/download.ts`

SVG download helper.

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

## Previewing the Production Build

After building, preview the production version locally:

```bash
npm run preview
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

## Possible Future Improvements

Possible improvements include:

- Adding a piano keyboard treble view
- Adding more export formats
- Adding preset examples
- Adding saved diagram templates
- Adding more realistic accordion sounds
- Adding image export, such as PNG
- Adding documentation screenshots
- Improving mobile layout
- Adding more accordion systems or custom layouts

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

You may copy, fork, modify, and reuse this project for personal, educational, and other non-commercial purposes, as long as appropriate credit is given.

Commercial use is not permitted without prior written permission.

See the `LICENSE` file for more details.

## Author

Created by Esteban Gil (`gilsag`).
