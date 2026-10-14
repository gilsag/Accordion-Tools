# Harmony Explorer

Harmony Explorer is the harmonic-navigation workspace in Accordion Tools. It visualizes relationships between a reference chord family in the inner ring and related chord families in outer rings around the circle of fifths.

Outer rings are grouped by the number of pitch classes shared with the reference chord in each sector. More common tones appear closer to the inner ring. A zero-shared-notes ring can be enabled when fully disjoint relationships are useful.

## Opening Harmony Explorer

Use **Harmony** in the top bar. While the Harmony workspace is active, the Tools panel shows only Harmony Explorer; accordion-specific tools such as Scale Finder, Chord Finder, Selection, and Fingering are hidden because they do not act on the harmonic-circle diagram.

The Harmony workspace retains Accordion Tools' global sound and export systems.

## Core controls

The compact Tools panel contains the choices that change the harmonic question itself:

- **Reference family (inner ring)**;
- **Related chord family (outer rings)**, including **All families (diatonic only)**;
- **Parent scale / mode**;
- diatonic-only filtering or diatonic highlighting;
- quick presets for m7, maj7, dominant 7, and diminished 7 relationships.

The **All families** mode is intentionally diatonic-only to keep aggregate diagrams readable.

## Harmony settings

Secondary display and playback preferences are under **Settings → Harmony** so they do not crowd the main exploration panel. These include:

- enharmonic labels;
- segment separator lines;
- legend and explanation box;
- visibility of each available shared-note ring;
- chord-tone tooltips;
- chord-family colors;
- circle diameter and maximum font size;
- block/arpeggio playback;
- selected-chord-only or reference→related playback.

These settings are included in saved settings JSON and can also be set in `public/default-settings.json`.

## Tooltips and voice leading

Hovering a chord can show:

- chord family;
- chord tones;
- tones shared with the reference chord, highlighted in the tooltip;
- Roman-numeral information relative to the selected parent scale/mode;
- a pitch-class voice-leading summary.

Voice-leading information is descriptive. The relationship engine works with pitch classes rather than fixed piano-style octave voicings.

## Audio

Click a chord to hear it. Integrated Harmony Explorer playback uses the same sound engine and settings as Accordion Tools, including La Melodiosa when selected.

For compatibility with the Stradella system, Harmony Explorer converts the chord to pitch classes and renders them inside the single **C3-B3 Stradella chord octave**. This keeps the harmonic layer separate from octave-specific piano voicing assumptions.

## Show on Stradella

Click an outer-ring chord. The **Selected relationship** section offers **Show on Stradella** when that chord family is supported by the Stradella Chord Finder.

The handoff:

1. switches to the Stradella workspace;
2. opens the Stradella Chord Finder;
3. transfers the selected root and chord type;
4. selects **Bass + chord buttons** mode;
5. shows the highest-ranked exact or conservative approximate realization.

The existing realization menu can then be used to inspect alternative button combinations.

## Explore harmony from the Chord Finder

For supported Stradella Chord Finder formulas, **Explore harmony** returns to Harmony Explorer without changing the current reference family.

If the chord was originally sent from Harmony Explorer through **Show on Stradella**, the existing Harmony selection is retained. If the chord was entered independently in the Stradella finder, its chord family becomes the **related/outer-ring family** while the user's current reference family remains unchanged.

This avoids the previous behavior in which exploring an Em7 chord could unexpectedly change the inner reference family from major triads to minor sevenths.

## Send a relationship to the Progression Assistant

A selected relationship can also be sent to the separate **Progression Assistant** using **Add relationship to Progression**. Accordion Tools adds the reference chord followed by the selected related chord, switches to the Stradella workspace, and opens the progression tool.

See [`progression-assistant.md`](progression-assistant.md).

## Export

The top-bar SVG/PNG download control exports the active Harmony Explorer diagram when the Harmony workspace is selected. Temporary tooltips, selection marks, and navigation highlights are excluded from exported diagrams.

## Architecture

Harmony Explorer remains modular inside `src/tools/harmonyExplorer/`. Its harmonic engine returns pitch-class relationships; the Accordion Tools integration layer handles audio rendering, Stradella Chord Finder translation, and progression optimization. This keeps harmonic relationships independent from physical keyboard coordinates.

## Record a progression from the circle

Use **Start recording** in Harmony Explorer, then click chords in the diagram in the order you want them to occur. Reference-ring and related-chord clicks are both recorded, and repeated clicks remain repeated events. **Stop recording** pauses capture without deleting the sequence; **Clear** removes it.

Once at least one event has been recorded, **Show notation** appears in the top bar. The recorded sequence is rendered as simple staff notation and can be downloaded as SVG. Use **Play recording** to audition the captured note/chord sequence locally; **Stop** cancels scheduled playback.

Choose **Send to Progression Assistant** to transfer the recorded chord events to the Stradella-side assistant, where physical realizations and accompaniment patterns can be optimized. If the Harmony recording also contains single-note events, Accordion Tools shows a brief warning before transfer because those note events are not exported to the chord-oriented Progression Assistant.

## Optional note ring

**Settings → Harmony → Show inner note ring** adds a small pitch-class ring inside the reference-family ring. The twelve notes follow the same circle-of-fifths orientation as the chord sectors. Clicking a note auditions that pitch using the current Harmony sound source. While Harmony recording is active, note-ring clicks are also captured as note events, appear in the recorded sequence, and are included in its staff notation. The option is off by default.
