# Accordion-Tools

**Accordion-Tools** is a browser-based collection of interactive tools for accordion players, students, and teachers. It combines configurable Stradella and treble diagrams with scale and chord exploration, harmonic analysis, fingering and sequence tools, accompaniment patterns, audio playback, music notation, and SVG/PNG export.

Current version: **0.14.0**

**Live site:** https://gilsag.github.io/Accordion-Tools/

## Highlights

- Stradella bass diagrams from compact layouts up to 120 bass.
- C-system, B-system/Bayan, and piano treble layouts.
- Scale Finder and Chord Finder for treble and Stradella.
- Stradella chord realizations using chord buttons, bass/counterbass buttons, or mixed combinations, with ergonomic ranking and conservative approximations.
- Harmony Explorer for common-tone relationships, diatonic harmony, chord families, voice leading, and progression recording.
- Stradella Progression Assistant for optimizing chord realizations across a complete progression.
- Sequence, Fingering, Selection, and diagram-annotation tools.
- Stradella Bass Pattern Player with notation and accompaniment patterns.
- ABC playback and diagram highlighting.
- Synthesized sound plus optional **La Melodiosa** sampled accordion playback.
- Music notation and SVG/PNG export.

## Screenshots

### Treble Scale Finder

![Treble Scale Finder](docs/images/treble-scale-finder.png)

Scale visualization and fingering paths on a chromatic button accordion treble layout.

### Stradella Chord Finder

![Stradella Chord Finder](docs/images/stradella-chord-finder.png)

The Chord Finder compares practical exact and approximate Stradella realizations using chord buttons, bass/counterbass notes, or both. It prioritizes fewer buttons and compact fingering, and can label exported diagrams with the chord, realization type, sounding tones, and any omissions. The screenshot shows **Em7** realized as **E counterbass + G major**.

### Harmony Explorer

![Harmony Explorer](docs/images/harmony-explorer.png)

Explore relationships between chord families around the circle of fifths. Relationships can be filtered or highlighted according to a selected parent scale or mode, and chord/note clicks can be recorded as a progression.

### Stradella Sequence Tool

![Stradella Sequence Tool](docs/images/stradella-sequence.png)

Create ordered button paths using numbers and arrows for exercises, bass movement, fingering ideas, and teaching diagrams.

### Progression Assistant

![Stradella Progression Assistant](docs/images/progression-assistant.png)

Optimize Stradella realizations across an entire chord progression, balancing harmonic voice movement and physical button movement. The assistant supports playback, accompaniment patterns, button highlighting, and staff notation.

## Main workspaces

### Stradella

Generate and interact with common Stradella bass layouts. Depending on the selected layout, diagrams include fundamental bass, counterbass, major, minor, dominant-seventh, and diminished-seventh rows.

Important Stradella tools include:

- **Chord Finder** — ranked exact and conservative approximate realizations, with optional diagram labels and title-based SVG/PNG filenames.
- **Progression Assistant** — whole-progression optimization and accompaniment playback.
- **Bass Pattern Player** — reusable Stradella accompaniment patterns and progressions.
- **Scale Finder** — scale paths using bass and counterbass notes.
- **Sequence** — ordered button paths with numbers and arrows.

### Treble

Treble diagrams support:

- C-system chromatic button accordion.
- B-system / Bayan.
- 3-, 4-, and 5-row layouts.
- Piano keyboard layouts.

Scale and chord tools share the same configurable notation and diagram system.

### Harmony

The Harmony Explorer provides circular diagrams of relationships between a selectable reference chord family and related chord families.

Features include:

- common-tone grouping by ring;
- diatonic-only and highlighted-diatonic views;
- selectable parent scales and modes;
- optional inner note ring;
- chord-tone tooltips and Roman numerals;
- voice-leading information;
- chord-family highlighting;
- progression recording from chord and note clicks;
- playback and notation of recorded sequences;
- direct handoff of chord progressions to the Stradella Progression Assistant.

## Sound

Accordion-Tools includes a lightweight synthesized sound engine and optional playback using the **La Melodiosa** accordion sample set.

**La Melodiosa** was sampled, edited, and originally programmed by **Petri Pohjanmies (Finland), 2026** and is used under the Creative Commons Attribution (CC-BY) license. The original attribution and instrument-definition files are retained with the samples in `public/samples/la-melodiosa/`.

## Documentation

Detailed documentation is available in the [`docs/`](docs/) folder, including guides for:

- [Settings](docs/settings.md)
- [Scale Finder](docs/scale-finder.md)
- [Chord Finder](docs/chord-finder.md)
- [Harmony Explorer](docs/harmony-explorer.md)
- [Progression Assistant](docs/progression-assistant.md)
- [Selection Tool](docs/selection-tool.md)
- [Fingering Tool](docs/fingering-tool.md)
- [Sequence Tool](docs/sequence-tool.md)
- [Annotate Diagram](docs/annotate-diagram-tool.md)
- [ABC Player](docs/abc-player.md)
- [Bass Pattern Player](docs/bass-pattern-player.md)
- [Bass Pattern format](docs/bass-pattern-format.md)

## Running locally

Accordion-Tools uses React, TypeScript, Vite, and npm.

```bash
npm install
npm run dev
```

Vite will display the local address, normally something similar to:

```text
http://localhost:5173/
```

To test the production build:

```bash
npm run build
npm run preview
```

## Export

Diagrams can be exported as **SVG** or **PNG**. Several tools also provide dedicated notation or music-data exports.

## Acknowledgements

The development of the Stradella Chord Finder was informed in part by the [Stradella Explorer](https://accordionchords.com/stradella-bass-chord-calculator-interactive-stacking-engine/) at AccordionChords.com, which provided a useful reference for exploring practical chord realizations on the Stradella bass system.

Thanks also to **Petri Pohjanmies** for making the La Melodiosa sample set available under CC-BY.

## License

See [`LICENSE`](LICENSE) for the license applying to Accordion-Tools. Third-party assets, including La Melodiosa, retain their own licensing and attribution terms.


### Reading the documentation in the app

Choose **Settings → About → Open documentation** to browse the bundled guides with topic navigation and search, without leaving the application. The GitHub README remains available through the existing link.
