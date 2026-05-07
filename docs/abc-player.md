# ABC Player

The ABC Player loads or pastes simple ABC notation and animates the diagram during playback.

It is useful for:

- checking melodies on the treble layout
- exploring how ABC notes map to accordion buttons
- testing quoted chord symbols on Stradella
- creating simple playback examples

## Loading ABC

ABC can be loaded from a file or pasted into the player.

Built-in examples are stored in:

```text
public/abc/
```

Examples include:

- `c-major-scale.abc`
- `happy-birthday.abc`
- `twinkle-little-star.abc`
- `dyads-and-chords.abc`
- `stradella-chord-symbols.abc`

## Supported ABC features

The player supports:

- notes
- rests
- durations
- accidentals
- octave marks
- key signatures
- bracketed note chords
- quoted chord symbols
- tempo control
- position slider
- Play, Pause, Continue, and Stop controls

Some advanced ABC features are still limited or future work, including full repeats, ornaments, multi-voice two-hand playback, and full tuplet notation.

## Treble mode

In Treble mode, ABC notes highlight matching notes on the chromatic-button or piano treble diagram.

Quoted chord symbols can be:

- ignored
- played as treble block chords

The default is to ignore quoted chord symbols in Treble mode.

## Stradella mode

In Stradella mode, the ABC Player supports these mapping modes:

- **Bass notes only**: maps written ABC pitches to bass/counterbass note buttons.
- **Chord symbols only**: maps quoted ABC chord symbols to Stradella chord-button recipes.
- **Bass notes + chord symbols**: combines written ABC bass notes with quoted chord-symbol accompaniment.

## Playback

ABC playback uses the same browser sound engine as the other tools. It is synthetic and intended for reference.

## Related settings

See [`settings.md`](settings.md) for:

- `abcStradellaMode`
- `abcTrebleChordSymbolsMode`
- `soundEnabled`

## Rendered notation view

When the ABC Player has ABC text loaded, the top toolbar can show a `Show notation` button. This renders the current ABC source below the diagram with `abcjs`, so the same source can be heard, highlighted on the accordion diagram, and read as staff notation.

The notation title uses the tune title from the ABC `T:` field when available. The notation panel includes **Download SVG** for saving the rendered staff notation.

The ABC editor is collapsible, collapsed by default, and placed near the lower end of the tool controls. Invalid ABC text should not interrupt the app interface; the notation panel shows a rendering error instead.

A collapsible **Notation help** section is available in the tool area.
