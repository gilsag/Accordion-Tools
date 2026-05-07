# Stradella Bass Pattern Player

The Stradella Bass Pattern Player plays Stradella bass patterns over a chord progression.

It combines:

- a selected bass pattern,
- a chord progression,
- a root/key,
- a bars-per-chord value,
- a tempo,
- optional repeat/loop playback.

The detailed pattern-file syntax is documented in [`bass-pattern-format.md`](bass-pattern-format.md).

## Basic workflow

1. Choose a chord progression.
2. Choose a root.
3. Choose a bass pattern.
4. Choose the chord voicing mode.
5. Set bars per chord and tempo.
6. Choose playback repeat: `1 time`, `2 times`, `4 times`, or `Loop until stopped`.
7. Press **Play pattern**.

## Chord progressions

Chord progressions use compact Roman-numeral strings in:

```text
public/chord-progressions/chord-progressions.json
```

Example:

```json
{
  "id": "i-iv-v-i",
  "name": "I–IV–V–I progression",
  "progression": "I IV V I"
}
```

The selected root resolves the Roman numerals to real chord labels. In root `C`, `I IV V I` becomes `C F G C`.

## Bass patterns

Bass patterns are stored in:

```text
public/bass-patterns/bass-patterns.json
```

Patterns may use compact pattern strings or explicit timed `steps`. Use compact strings for common repeated rhythms and explicit steps for tuplets, overlapping events, ties, or more exact timing.

## Bars per chord

**Bars per chord** controls how many full pattern bars are played before moving to the next chord in the progression.

Example:

```text
Progression: I IV V I
Bars per chord: 2
```

The playback expands to two bars of `I`, two bars of `IV`, two bars of `V`, and two bars of `I`.

## Repeat control

The repeat control is a single dropdown:

- `1 time`
- `2 times`
- `4 times`
- `Loop until stopped`

Repeat affects playback and rendered notation repeat signs. The notation does not print extra text such as “loop” or “repeat 4 times.”

## Rendered staff notation

When the Bass Pattern Player is active and has playable events, the top toolbar shows **Show notation**. This renders a staff-notation view below the diagram using `abcjs`.

The rendered notation title names the selected pattern and progression. The notation is generated from the full current state:

- selected root/key,
- selected chord progression,
- bars per chord,
- selected pattern,
- chord voicing mode,
- repeat mode.

The generated notation uses the shared **Music notation** settings. By default, the notation includes a title, hides descriptions and summary notes, and wraps at four bars per line.

### Stradella notation convention

The rendered notation follows a simplified Stradella bass convention:

| Action | Staff placement |
|---|---|
| Fundamental bass | first matching note position at or below the bass-clef middle line D |
| Counterbass | first matching note position at or below the bass-clef middle line D |
| Chord button | first matching note position above the bass-clef middle line D |
| Bass + chord together | both positions are shown at the same rhythmic point |

Chord quality is shown above chord-button notes:

| Mark | Meaning |
|---|---|
| `M` | major |
| `m` | minor |
| `7` | dominant seventh |
| `d` | diminished |

Counterbass notes are not specially marked in the staff notation.

## Notation help

The tool includes a collapsible **Notation help** section near the playback/export controls. It summarizes the Stradella staff-placement rule inside the tool, rather than in the top toolbar.

## Optional notation summary

The **Include summary note in rendered notation** checkbox adds a concise text line at the end of the rendered notation. It can include useful context such as:

```text
I–IV–V–I progression · Alternate bass polka · 8 bars · Root C · 2 bars per chord · 4/4
```

This replaces the older compact bass-pattern sheet preview, which has been removed from the interface.

## Downloading rendered notation

When notation is visible, the notation panel includes **Download SVG**. This downloads the rendered staff notation diagram as an SVG file.

This is separate from exporting the musical data as ABC, MIDI, or LilyPond.

## Export

Exports are grouped into one compact row. Choose a format and press **Download**.

Supported formats:

- `ABC`
- `MIDI`
- `LilyPond`

Exports are progression-aware. They use the selected root, chord progression, bars per chord, pattern, and tempo.

## Custom pattern editor

The Custom Pattern Editor is collapsible and supports live validation.

It lets you draft one pattern object, validate it, and save it to a local custom pattern library in the browser. This local library does not rewrite the built-in project JSON files.

## Current limitations

- In-app notation is a teaching/reading aid, not a full accordion edition.
- It does not encode bellows direction, fingering, register switches, or manufacturer-specific voicing.
- Notation-level ties are displayed, but playback still follows the event durations directly.

## Music notation settings used by this tool

The Bass Pattern Player uses the shared **Settings → Music notation** section for rendered notation. Useful options include showing/hiding the generated title, including the pattern description, including a compact summary note, changing bars per line, reducing chord-symbol font size, and changing abcjs render scale/staff width.
