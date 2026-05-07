# Chord Finder

Chord Finder locates chord shapes on the current layout.

There are two related tools:

- **Treble Chord Finder** for chromatic-button treble and piano treble layouts.
- **Stradella Chord Finder** for Stradella bass layouts.

## Treble Chord Finder

Treble Chord Finder searches for compact chord shapes around a selected root.

It supports:

- chord type selection
- inversion selection
- octave/range behavior depending on the treble layout
- playback of the found chord

It works on C-system, B-system/Bayan, and piano treble diagrams.

## Stradella Chord Finder

Stradella Chord Finder is different because the bass side is not a free chromatic keyboard.

It supports three search modes:

### Bass rows only

Finds chord tones using bass and counterbass note buttons. Playback plays the notes in pitch order and then the full chord.

### Chord buttons only

Uses only chord-row buttons. The optional root bass marker is a visual reference and does not count as a sounded chord tone.

### Bass + chord buttons

First tries an exact chord-buttons-only solution. If not available, it adds nearby bass/counterbass buttons needed to complete the chord.

## Supported chord types

The shared chord library includes common triads, sixths, sevenths, ninths, diminished/half-diminished chords, suspended chords, and altered dominants.

If the chosen chord cannot be produced exactly in the selected mode/layout, the result is shown as **Not found**.

## Playback

If sound is enabled, found chord shapes can be played.

The Stradella sound engine is synthetic and should be treated as a reference aid.

## Export

Chord Finder highlights are included in SVG/PNG diagram downloads.

## Related settings

See [`settings.md`](settings.md) for:

- `stradellaChordFinderMode`
- `stradellaChordFinderMarkRootBass`
- `notation`
- `accidental`
- `soundEnabled`
