# Stradella Bass Pattern Player

The Stradella Bass Pattern Player plays Stradella bass patterns over a chord progression.

It combines:

- a selected bass pattern,
- a chord progression,
- a root/key,
- a repeats-per-chord value,
- a tempo,
- optional repeat/loop playback.

The patterns and progressions are built into the app. How to write new ones is described in the [bass pattern format reference](https://github.com/gilsag/Accordion-Tools/blob/main/docs/internal/bass-pattern-format.md).

## Basic workflow

1. Choose a chord progression.
2. Choose a root.
3. Choose a bass pattern.
4. Choose the chord voicing mode.
5. Set repeats per chord and tempo. The tempo is in beats per minute, and the label shows which note is the beat: the quarter note in 2/4, 3/4 and 4/4, the dotted quarter in 6/8 and 12/8, the eighth note in other x/8 meters.
6. Choose playback repeat: `1 time`, `2 times`, `4 times`, or `Loop until stopped`.
7. Press **Play** in the playback bar under the diagram (**Stop** ends a loop).

## Chord progressions

Progressions are written in Roman numerals, so each one works in any key. The root you choose turns the numerals into chords: with root C, **I IV V I** becomes C F G C.

## Bass patterns

Each pattern is one or more bars of bass and chord buttons in a rhythm, such as an oom-pah or a waltz. The pattern repeats for every chord of the progression, moving to that chord's buttons.

## Repeats per chord

**Repeats per chord** controls how many complete bass-pattern cycles are played before moving to the next chord in the progression. If a pattern has `"bars": 2`, one repeat lasts two notated bars.

Example:

```text
Progression: I IV V I
Repeats per chord: 2
```

With a one-bar pattern, playback expands to two bars of `I`, two bars of `IV`, two bars of `V`, and two bars of `I`. With a two-bar pattern, each repeat lasts two bars.

## Repeat control

The repeat control is a single dropdown:

- `1 time`
- `2 times`
- `4 times`
- `Loop until stopped`

Repeat affects playback and rendered notation repeat signs. The notation does not print extra text such as “loop” or “repeat 4 times.”

## Rendered staff notation

When the Bass Pattern Player is active and has playable events, the top toolbar shows **Show notation**. This draws the accompaniment as staff notation below the diagram.

The rendered notation title names the selected pattern and progression. The notation is generated from the full current state:

- selected root/key,
- selected chord progression,
- repeats per chord,
- selected pattern,
- chord voicing mode,
- repeat mode.

The generated notation uses the shared **Music notation** settings. By default, the notation includes a title, hides descriptions and summary notes, and wraps at four bars per line.

### Stradella notation convention

The rendered notation follows the standard symbolic Stradella convention (American Accordionists’ Association, 1938):

| Action | Staff placement |
|---|---|
| Fundamental bass | first matching note position at or below the bass-clef middle line D |
| Counterbass | first matching note position at or below the bass-clef middle line D |
| Chord button | first matching note position above the bass-clef middle line D; D3 itself may represent a D chord |
| Bass + chord together | both positions are shown at the same rhythmic point |

Chord quality is shown above chord-button notes:

| Mark | Meaning |
|---|---|
| `M` | major |
| `m` | minor |
| `7` | dominant seventh |
| `d` | diminished |

Counterbass notes use the same written pitch positions as fundamental bass notes. A courtesy dash can be enabled under **Settings → Music notation**. Chord-quality labels repeat on every chord by default. Written staff positions never depend on audio register octaves.

## Notation help

The tool includes a collapsible **Notation help** section near the playback/export controls. It summarizes the Stradella staff-placement rule inside the tool, rather than in the top toolbar.

## Optional notation summary

The **Include summary note in rendered notation** checkbox adds a concise text line at the end of the rendered notation. It can include useful context such as:

```text
I–IV–V–I progression · Alternate bass polka · 8 bars · Root C · 2 repeats per chord · 4/4
```

The staff-notation view presents the current pattern.

## Downloading rendered notation

When notation is visible, the notation panel includes **Download SVG**. This downloads the rendered staff notation diagram as an SVG file.

The ABC download contains the score as displayed, including the notation preferences and the tempo. MIDI and LilyPond downloads contain the sounding notes.

## Export

Exports are grouped into one compact row. Choose a format and press **Download**.

Supported formats:

- `ABC`
- `MIDI`
- `LilyPond`

Exports are progression-aware. They use the selected root, chord progression, repeats per chord, pattern bar count, pattern, and tempo.

## Custom pattern editor

The Custom Pattern Editor is collapsible and supports live validation.

It lets you draft one pattern object, validate it, and save it to a local custom pattern library in the browser. This local library does not rewrite the built-in project JSON files.

## Current limitations

- In-app notation is a teaching/reading aid, not a full accordion edition.
- It does not encode bellows direction, fingering, register switches, or manufacturer-specific voicing.
- Notation-level ties are displayed, but playback still follows the event durations directly.

## Music notation settings used by this tool

The Bass Pattern Player uses the shared **Settings → Music notation** section for rendered notation. Useful options include showing/hiding the generated title, including the pattern description, including a compact summary note, changing bars per line, adjusting notation text size, and changing the notation scale and staff width.

## Pattern accuracy and stylistic scope

The built-in catalog has **29 rhythmic definitions**. It mixes conventional accompaniment foundations (e.g., Waltz, Polka, March), abstract rhythmic figures (e.g., gallop and Scotch snap), and **Stradella adaptations** of rhythms originally played by other instruments (claves, rock guitar, African bell). Pattern labels are teaching aids; they do not certify an ethnographically complete accompaniment for each genre.

Three patterns are worth describing exactly:

- **Shuffle (12/8):** four long–short pairs fill all twelve eighth-note positions (attacks on 1, 3, 4, 6, 7, 9, 10 and 12).
- **Bo Diddley beat (4/4, two bars):** a five-attack figure derived from the 3–2 son clave (bar 1: 1, 2&, 4; bar 2: 2, 3). It does not imitate muted guitar strumming.
- **Standard African bell (12/8):** the seven-stroke, twelve-pulse timeline in compound meter, with attacks on pulses 1, 3, 5, 6, 8, 10 and 12. Playing it on accordion buttons is a deliberate adaptation.

The Son/Rumba clave 3–2 and 2–3 definitions are also two-bar adaptations with exactly five attacks. The other named dances are **representative practice examples**, not unique or authoritative definitions of a genre.
