# ABC Player

The ABC Player loads or pastes ABC notation and animates the diagram during playback. It uses `abcjs` for the main parsing and sequencing step, then applies Accordion Tools' own treble, piano, and Stradella button-mapping logic.

It is useful for:

- checking melodies on the treble layout
- exploring how ABC notes map to accordion buttons
- testing quoted chord symbols on Stradella
- creating simple playback examples

## Loading ABC

ABC can be loaded from a file or pasted into the player.

Built-in example files are stored in:

```text
public/abc/
```

The example list is generated automatically by Vite from the `.abc` files in `public/abc/`. The browser fetches the generated `abc/examples.json`; you should **not edit or create this manifest manually**.

To add a song, copy its `.abc` file into `public/abc/`, with a `T:` title in the ABC header. Restart/reload the development page if needed. When building for GitHub Pages, commit the file and redeploy (`npm run build`); a static deployed website cannot detect new server files without a rebuild. The menu uses `T:` as the display name, or the filename if no title is present. Identical duplicate files are listed only once. Existing built-in names have localized overrides where available; otherwise the ABC title is used as written.

Examples include:

- `c-major-scale.abc`
- `happy-birthday.abc` (F-major melody and accordion bass/chord accompaniment)
- `twinkle-little-star.abc`
- `dyads-and-chords.abc`
- `stradella-chord-symbols.abc`
- `bella-ciao.abc`
- `katyusha.abc`
- `easy-polka.abc` (Jean-Michel Bencetti; 2/4)
- `un-gorro-de-lana.abc`

### Additional scores

`katyusha.abc` contains the melody and the **alternating bass-button / preset chord-button accompaniment** from the supplied 16-bar accordion score, including its repeat signs. The notes on or above the bass staff's middle line designate chord buttons, not separately sounded single pitches: for example, A bass → Am chord → E bass → Am chord. Its 100 BPM quarter-note tempo is a practice default, not a tempo supplied by the score. Fingering is omitted.

`easy-polka.abc` contains two parts from the supplied Jean-Michel Bencetti score: melody and alternating Stradella single bass/chord buttons. It retains the first/second endings and the two main repeats. The score marks half-note = 80; the ABC Player uses its equivalent quarter-note tempo of 160 BPM.

`happy-birthday.abc` follows the supplied F-major accordion score, with separate treble melody and Stradella bass/chord events, including F7, B-flat major, and a simultaneous F bass + F-major ending. Its 95 quarter-note BPM is an editable practice tempo; the image has no metronome marking.

### Cueca floreos

The five built-in **Cueca floreo 1–5** examples have fixed names in all interface languages. Each contains two ABC voices in 6/8: voice 1 is the melody, and voice 2 is a single-note bass part. The five keys, in menu order, are C major, G major, A minor, C major, and E minor.

The bass follows the indicated tonic–dominant–dominant–tonic harmonic sequence over four bars. It plays on eighth-note positions **2, 3, 5, and 6** of each measure and rests on positions **1 and 4**. The bass pitches are nominal octave-2 roots; no chord-button part, fingering or T/D text is included. All five examples use `Q:1/4=80`, matching the ABC Player's quarter-note BPM control.

The ABC Player maps voice 1 to Treble and voice 2 to Stradella. It does not currently play both manual voices simultaneously. The transcription originated from a supplied score image; check the melodic notes against a sharper source before treating this as a verified edition.

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
- `V:` voice sections for common two-hand ABC files
- simple repeat expansion
- simple note ties and whole-chord ties
- common tuplet/duration handling through abcjs sequencing
- Play, Pause, Continue, and Stop controls

Some advanced ABC features are still limited or future work, including ornaments, simultaneous two-hand playback on both manuals, custom ABC directives that do not affect abcjs sequencing, and advanced partial ties inside chords.

## Treble mode

In Treble mode, ABC notes highlight matching notes on the chromatic-button or piano treble diagram. If the ABC file contains multiple `V:` sections, the treble side uses voice `1` by default.

Quoted chord symbols can be:

- ignored
- played as treble block chords

The default is to ignore quoted chord symbols in Treble mode.

## Stradella mode

In Stradella mode, the ABC Player supports these mapping modes. If the ABC file contains multiple `V:` sections, the Stradella side uses voice `2` by default.

- **Bass notes only**: maps written ABC pitches to bass/counterbass note buttons.
- **Chord symbols only**: maps quoted ABC chord symbols to Stradella chord-button recipes.
- **Bass notes + chord symbols**: combines written ABC bass notes with quoted chord-symbol accompaniment. This is the default Stradella ABC mapping.

### Accordion bass-staff shorthand

For scores that use a **single written pitch to represent a whole preset chord button**, add the exact comment `% accordion-tools-stradella-bass-chord` to the ABC header. In voice 2 (bass clef), notes **on or above D3**, the bass staff middle line, are then interpreted as chord-button markers; lower notes remain single bass notes. Put a quoted chord symbol on the first upper note at each harmony change (for example, `A,, "Am"A, E,, A,`). Subsequent upper markers reuse that chord quality until another chord label occurs. The chord marker's written pitch positions it on the staff; it does **not** become an additional sounded bass note. This is an opt-in notation convention; ordinary ABC notation continues to use literal pitches and standard chord symbols.

With **Bass notes only**, the marked chord events are omitted. With **Chord symbols only**, single bass notes are omitted. With the combined mode, both physical button types are played at their written times. The ABC Player still plays the selected Treble or Stradella side separately, not both hands together.

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


## Ties

Simple ABC ties are merged during playback after abcjs sequencing. For example, `A-A2` is treated as one sustained A event with the combined duration, so the diagram does not retrigger the same button on the continuation note. Whole-chord ties such as `[CE]-[CE]` are handled similarly when the tied chord contains the same notes.

Advanced partial ties inside chords are not fully interpreted yet.
