# Bass Pattern Player format v2

The Bass Pattern Player reads built-in patterns from:

```text
public/bass-patterns/bass-patterns.json
```

The app can also store custom patterns in the browser's local storage through the in-app custom pattern editor. Local custom patterns do not modify the built-in JSON file.

## File shape

The built-in file must be a versioned object:

```json
{
  "version": 2,
  "legend": {
    "B": ["bass:1"],
    "A": ["bass:5"],
    "T": ["bass:3"],
    "K": ["counter:3"],
    "C": ["chord"],
    "X": ["bass:1", "chord"],
    "z": ["rest"]
  },
  "patterns": []
}
```

Each pattern describes one bar. The app repeats that bar for each chord in the selected progression. The in-app **Bars per chord** control decides how many times the bar pattern repeats before moving to the next progression chord.

## Pattern object

A pattern may use either compact `pattern` notation or explicit `steps` notation.

```json
{
  "id": "alternate-bass-polka",
  "name": "Alternate bass polka",
  "meter": "4/4",
  "tags": ["polka", "oom-pah", "beginner"],
  "description": "Root bass, chord, fifth bass, chord.",
  "pattern": ">B C A C"
}
```

or:

```json
{
  "id": "counterbass-chord-example",
  "name": "Counterbass with chord example",
  "meter": "4/4",
  "tags": ["counterbass", "simultaneous"],
  "steps": [
    { "t": 0, "d": 1, "play": ["bass:1"], "accent": ">" },
    { "t": 1, "d": 1, "play": ["counter:3", "chord"] },
    { "t": 2, "d": 1, "play": ["bass:5"] },
    { "t": 3, "d": 1, "play": ["chord"] }
  ]
}
```

Rules:

- `id` must be unique.
- `name` is required.
- `meter` is required.
- Use either `pattern` or `steps`, not both.
- `tags` are optional and are used for organization/search/display.
- A pattern should fit inside one bar.

## Meter and rhythmic coordinates

`meter` is the time signature and defines both the bar length and the rhythmic counting unit.

The pattern coordinates `t` and `d` are counted in the denominator note value of the meter. For example, `4/4` contains four quarter-note units, while `6/8` contains six eighth-note units.

There is no separate required `unit` field. The meter already defines the counting unit.

| Meter | Bar contains | `t`/`d` unit | Common musical feel | Example full-bar duration |
| --- | --- | --- | --- | --- |
| `2/2` | 2 half-note units | half note | cut time, two large beats | `d: 2` |
| `3/2` | 3 half-note units | half note | broad triple meter | `d: 3` |
| `2/4` | 2 quarter-note units | quarter note | march, polka | `d: 2` |
| `3/4` | 3 quarter-note units | quarter note | waltz | `d: 3` |
| `4/4` | 4 quarter-note units | quarter note | common time | `d: 4` |
| `5/4` | 5 quarter-note units | quarter note | asymmetric, often 3+2 or 2+3 | `d: 5` |
| `7/4` | 7 quarter-note units | quarter note | asymmetric, often 4+3 or 3+4 | `d: 7` |
| `3/8` | 3 eighth-note units | eighth note | short triple meter | `d: 3` |
| `5/8` | 5 eighth-note units | eighth note | asymmetric, often 2+3 or 3+2 | `d: 5` |
| `6/8` | 6 eighth-note units | eighth note | compound duple, often 3+3 | `d: 6` |
| `7/8` | 7 eighth-note units | eighth note | asymmetric, often 2+2+3, 2+3+2, or 3+2+2 | `d: 7` |
| `8/8` | 8 eighth-note units | eighth note | grouped 3+3+2, 2+3+3, or 4+4 | `d: 8` |
| `9/8` | 9 eighth-note units | eighth note | compound triple, often 3+3+3 | `d: 9` |
| `11/8` | 11 eighth-note units | eighth note | asymmetric, e.g. 3+3+3+2 | `d: 11` |
| `12/8` | 12 eighth-note units | eighth note | compound quadruple, often 3+3+3+3 | `d: 12` |
| `15/8` | 15 eighth-note units | eighth note | compound/asymmetric groupings | `d: 15` |

So in `4/4`, `{ "t": 1, "d": 1 }` starts on beat 2 and lasts one quarter note. In `6/8`, `{ "t": 3, "d": 3 }` starts on the fourth eighth-note unit and lasts three eighth notes, i.e. one dotted-quarter span.

## Rhythmic values and tuplets

`t` and `d` may be numbers or fraction strings:

```json
{ "t": 0, "d": 1, "play": ["bass:1"] }
{ "t": "1/2", "d": "1/2", "play": ["chord"] }
{ "t": "1+1/3", "d": "1/3", "play": ["chord"] }
{ "t": "4/7", "d": "4/7", "play": ["bass:5"] }
```

Supported denominator values are currently:

```text
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12
```

This supports duplets, triplets, quintuplets, sextuplets, septuplets, nonuplets, and common compound tuplets such as five in the time of three using `3/5`.

Invalid examples:

```json
{ "t": "1/0", "d": 1, "play": ["bass:1"] }
{ "t": "abc", "d": 1, "play": ["bass:1"] }
{ "t": -1, "d": 1, "play": ["bass:1"] }
{ "t": 0, "d": 0, "play": ["bass:1"] }
```

## Subdivisions, offsets, and syncopation

Fractions are fractions of the meter-defined unit.

In `4/4`, the unit is a quarter note:

| Value | Meaning in `4/4` |
| --- | --- |
| `1` | quarter note |
| `"1/2"` | eighth note |
| `"1/4"` | sixteenth note |
| `"3/2"` | dotted quarter note |
| `2` | half note |
| `3` | dotted half note |
| `4` | whole-note span, i.e. a full 4/4 bar |

In `6/8`, the unit is an eighth note:

| Value | Meaning in `6/8` |
| --- | --- |
| `1` | eighth note |
| `"1/2"` | sixteenth note |
| `"3/2"` | dotted eighth note |
| `3` | dotted quarter note |
| `6` | full 6/8 bar |

### Eighth-note offsets

In `4/4`, an eighth-note offbeat can be written with `"1/2"` offsets:

```json
{
  "id": "eighth-offbeats",
  "name": "Eighth-note offbeats",
  "meter": "4/4",
  "steps": [
    { "t": 0, "d": "1/2", "play": ["bass:1"] },
    { "t": "1/2", "d": "1/2", "play": ["chord"] },
    { "t": 1, "d": "1/2", "play": ["bass:5"] },
    { "t": "1+1/2", "d": "1/2", "play": ["chord"] }
  ]
}
```

### Sixteenth-note offsets

In `4/4`, sixteenth-note placement uses quarters of the quarter-note unit:

```json
{
  "id": "sixteenth-push",
  "name": "Sixteenth-note push",
  "meter": "4/4",
  "steps": [
    { "t": 0, "d": "1/4", "play": ["bass:1"] },
    { "t": "3/4", "d": "1/4", "play": ["chord"] },
    { "t": 1, "d": "1/4", "play": ["bass:5"] },
    { "t": "1+3/4", "d": "1/4", "play": ["chord"] }
  ]
}
```

### Dotted rhythms

A dotted duration is one and a half times the base duration. In explicit steps, write it as a rational value such as `"3/2"`. In compact pattern strings, use either a dot or the equivalent fraction.

```json
{
  "id": "dotted-quarter-example",
  "name": "Dotted quarter plus eighth",
  "meter": "2/4",
  "steps": [
    { "t": 0, "d": "3/2", "play": ["bass:1"] },
    { "t": "3/2", "d": "1/2", "play": ["chord"] }
  ]
}
```

Equivalent compact pattern:

```json
{
  "id": "dotted-quarter-example-compact",
  "name": "Dotted quarter plus eighth",
  "meter": "2/4",
  "pattern": "B. C/2"
}
```

### Anticipations

An anticipation places an event slightly before the next main unit or next chord change. For example, this chord arrives on the last eighth note before beat 2:

```json
{
  "id": "anticipated-chord",
  "name": "Anticipated chord",
  "meter": "4/4",
  "steps": [
    { "t": 0, "d": 1, "play": ["bass:1"] },
    { "t": "1+1/2", "d": "1/2", "play": ["chord"], "accent": ">" },
    { "t": 2, "d": 1, "play": ["bass:5"] },
    { "t": 3, "d": 1, "play": ["chord"] }
  ]
}
```

### Syncopation

Syncopation emphasizes weak parts of the bar or ties/sustains across stronger parts. A practical playback representation is to place events on offbeats and/or give them longer durations.

```json
{
  "id": "syncopated-offbeats",
  "name": "Syncopated offbeats",
  "meter": "4/4",
  "steps": [
    { "t": "1/2", "d": 1, "play": ["chord"], "accent": ">" },
    { "t": "1+1/2", "d": 1, "play": ["chord"], "accent": ">" },
    { "t": "2+1/2", "d": 1, "play": ["chord"], "accent": ">" },
    { "t": "3+1/2", "d": "1/2", "play": ["chord"], "accent": ">" }
  ]
}
```

### Basic tuplets

Tuplets are written as rational durations. In `4/4`, three equal events inside one quarter-note unit each have duration `"1/3"`:

```json
{
  "id": "triplet-beat",
  "name": "Triplet beat",
  "meter": "4/4",
  "steps": [
    { "t": 0, "d": "1/3", "play": ["bass:1"] },
    { "t": "1/3", "d": "1/3", "play": ["chord"] },
    { "t": "2/3", "d": "1/3", "play": ["chord"] }
  ]
}
```

Five in the time of three units uses `"3/5"`:

```json
{
  "id": "five-in-three",
  "name": "Five in the time of three",
  "meter": "4/4",
  "steps": [
    { "t": 0, "d": "3/5", "play": ["bass:1"] },
    { "t": "3/5", "d": "3/5", "play": ["chord"] },
    { "t": "6/5", "d": "3/5", "play": ["bass:5"] },
    { "t": "9/5", "d": "3/5", "play": ["chord"] },
    { "t": "12/5", "d": "3/5", "play": ["chord"] }
  ]
}
```

## Compact pattern notation

Compact patterns are good for sequential one-line rhythms. Each token advances time automatically.

| Compact token | Meaning |
| --- | --- |
| `B` | one meter unit of root bass |
| `A` | one meter unit of fifth/alternate bass |
| `T` | one meter unit of third bass |
| `K` | one meter unit of counterbass third |
| `C` | one meter unit of chord |
| `X` | one meter unit of root bass plus chord |
| `z` | one meter unit of rest |
| `B2` | root bass for two units |
| `B/2` | root bass for half a unit |
| `B3/2` | root bass for one and a half units |
| `B.` | dotted root bass, equivalent to `B3/2` |
| `B/3 C/3 C/3` | three triplet events in one unit |
| `|` | visual barline separator; ignored by playback |
| `>B` | accented root bass |
| `^B` | marcato-style accent |
| `.B` | light/short-style accent |
| `!B` | named strong accent |
| `B~` | notation-level tie marker on this event |
| `[K+C]` | simultaneous compact group: counterbass third plus chord |

Examples:

```json
{ "meter": "4/4", "pattern": ">B C A C" }
{ "meter": "6/8", "pattern": ">B C C A C C" }
{ "meter": "6/8", "pattern": ">B3 C3" }
{ "meter": "4/4", "pattern": "B/3 C/3 C/3 A/3 C/3 C/3" }
{ "meter": "4/4", "pattern": ">[K+C] z C A" }
```

`[K+C]` expands each symbol through the legend and combines the resulting play tokens. It is useful when you do not want to create a custom one-letter legend symbol.

## Legend symbols

The legend maps compact symbols to one or more play tokens.

Default/current legend symbols:

```json
{
  "B": ["bass:1"],
  "A": ["bass:5"],
  "T": ["bass:3"],
  "K": ["counter:3"],
  "C": ["chord"],
  "X": ["bass:1", "chord"],
  "z": ["rest"]
}
```

You may add custom symbols in the JSON file. For example, `Y` is not built in, but it works if you define it:

```json
"legend": {
  "Y": ["counter:3", "chord"]
}
```

Then:

```json
{ "meter": "4/4", "pattern": "B C Y C" }
```

## Play tokens

Implemented play tokens include:

| Token | Meaning |
| --- | --- |
| `bass:1` | root bass relative to the current chord |
| `bass:3` | third bass relative to the current chord |
| `bass:5` | fifth bass relative to the current chord |
| `bass:b7` | flat seventh bass relative to the current chord |
| `counter:1` | counterbass-row version of the root when available |
| `counter:3` | counterbass third |
| `chord` | current chord, using the selected Chord voicing setting |
| `chord:simple` | one practical Stradella chord button |
| `chord:full` | fuller chord-finder recipe when available |
| `rest` | silence |

Tokens matching `bass:<degree>` or `counter:<degree>` may use scale degrees 1–7 with optional `b` or `#` accidentals, but the selected accordion layout must actually have a suitable button. Unsupported or unavailable buttons are reported as missing.

## Simultaneous buttons

Use multiple play tokens in the same `play` array to start buttons at the same time.

```json
{ "t": 0, "d": 1, "play": ["bass:1", "chord"] }
```

This plays the root bass and the chord button simultaneously.

```json
{ "t": 1, "d": 1, "play": ["counter:3", "chord"] }
```

This plays the counterbass third and the chord button simultaneously.

```json
{ "t": 2, "d": "1/2", "play": ["bass:5", "chord:full"], "accent": ">" }
```

This plays the fifth bass together with the fuller chord-finder voicing.

In compact notation, simultaneous actions can be written using an existing symbol such as `X`, a custom legend symbol such as `Y`, or a bracket group:

```json
{ "meter": "4/4", "pattern": "X C [K+C] C" }
```

`rest` must appear alone. This is valid:

```json
{ "t": 1, "d": 1, "play": ["rest"] }
```

This is invalid:

```json
{ "t": 1, "d": 1, "play": ["rest", "chord"] }
```

## Accents

Pattern steps may include an optional `accent` field.

Allowed values:

| Accent | Meaning |
| --- | --- |
| `>` | Standard accent / stronger attack |
| `^` | Marcato-style accent |
| `.` | Light / short-style accent marker |
| `strong` | Named strong accent |
| `weak` | Named weak accent |
| `marcato` | Named marcato accent |
| `ghost` | Very soft / ghosted note |

Example:

```json
{ "t": 0, "d": 1, "play": ["bass:1"], "accent": ">" }
```

In compact pattern strings, accent markers may appear before the symbol:

```text
>B C ^A .C !X
```

Playback currently maps accents mainly to relative volume. Some markers are also useful for sheet/export display.

## Notation-level ties

The playback engine can already sustain an event by giving it a longer duration:

```json
{ "t": 0, "d": 2, "play": ["bass:1"] }
```

That is the preferred way to create a sustained half-note playback event.

For notation/export purposes, steps may also include a tie marker:

```json
{ "t": 0, "d": 1, "play": ["bass:1"], "tie": "start" }
{ "t": 1, "d": 1, "play": ["bass:1"], "tie": "stop" }
```

Allowed values:

```text
start, stop, continue
```

Compact notation can mark a tied event with `~`:

```text
B~ B C A
```

Current limitation: ties are notation-level markers. Playback still follows each event's `t` and `d` values; it does not yet merge tied events into one audio envelope.

## Rendered in-app notation

The Bass Pattern Player can render staff notation in the application using `abcjs`. The rendered notation is generated from the expanded playback state: root, chord progression, bars per chord, selected pattern, chord voicing, and repeat mode.

The notation follows a simplified Stradella convention:

| Musical action | Rendered convention |
|---|---|
| Fundamental bass | first matching note position at or below the bass-clef middle line D |
| Counterbass | first matching note position at or below the bass-clef middle line D |
| Chord button | first matching note position above the bass-clef middle line D |
| Major chord button | chord root note with `M` marker |
| Minor chord button | chord root note with `m` marker |
| Dominant seventh chord button | chord root note with `7` marker |
| Diminished chord button | chord root note with `d` marker |
| Simultaneous bass + chord | both positions are shown at the same rhythmic point |

Counterbass notes are not specially marked in the staff notation.

The rendered notation can optionally include a summary note at the end, for example:

```text
I–IV–V–I progression · Alternate bass polka · 8 bars · Root C · 2 bars per chord · 4/4
```

The old compact bass-pattern sheet preview has been removed from the interface. Staff notation is now the main visual notation view.

Rendered notation can be downloaded as an SVG file from the notation panel.

## ABC export

The **Export ABC** button expands the current Bass Pattern Player state into a `.abc` file. It uses:

- the selected bass pattern,
- the selected chord progression,
- the selected root/key,
- the current **Bars per chord** setting,
- the current tempo.

For example, if the app is set to root `C`, progression `I V7 vi IV`, `2` bars per chord, and a one-bar pattern, the exported ABC contains eight generated bars: two bars of C, two bars of G7, two bars of Am, and two bars of F.

The ABC export includes:

- `M:` from the pattern meter,
- `L:` from the meter denominator,
- `Q:` from the Bass Pattern Player tempo,
- `K:` from the selected root,
- quoted resolved chord labels such as `"C"`, `"G7"`, or `"Am"`,
- bass-note events where a bass or counterbass button is played,
- rests for gaps in the generated bar.

Remaining limitation: ABC still cannot represent every accordion-specific detail. It does not encode bellows, fingering, register switches, or true button tablature. Treat it as a progression-aware notation sketch, not as a complete engraved accordion arrangement.

## MIDI export

The **Export MIDI** button expands the current Bass Pattern Player state into a `.mid` file. It uses:

- the selected bass pattern,
- the selected chord progression,
- the selected root/key,
- the current **Bars per chord** setting,
- the current tempo,
- the resolved Stradella buttons for each generated event.

Because the MIDI export is built from the same generated events used for playback, it follows the selected root, the expanded progression, and the repeated bars per chord.

Remaining limitations:

- MIDI stores pitches, velocities, and durations, not accordion button identities.
- Bass buttons are placed in a lower register.
- Chord buttons are placed in a middle register.
- Accent gain affects MIDI velocity.
- Ties are not yet merged into a single sustained MIDI note.
- Bellows, fingering, register switches, and exact reed behavior are not encoded.

## In-app custom pattern editor

The Bass Pattern Player includes a custom pattern editor. It lets you:

- load the selected pattern into the editor,
- edit one pattern object as JSON,
- validate it live,
- save it to the browser's local custom library,
- remove a selected custom pattern.

Custom patterns are saved in browser local storage. They survive page reloads in the same browser, but they are not written back into `public/bass-patterns/bass-patterns.json`.

To make a custom pattern permanent in the project source, copy the saved pattern object into the built-in JSON file.

## Current limitations

- A pattern describes one bar.
- Pattern strings are sequential; use explicit `steps` for precise overlapping/advanced timing.
- Ties are notation-level markers and do not yet merge playback envelopes.
- There is no independent layered-polyrhythm format yet.
- ABC export is progression-aware, but it is not full accordion tablature or publication-grade engraving.
- MIDI export is progression-aware, but it stores MIDI pitches rather than accordion-specific button metadata.
- Unsupported play tokens or unavailable buttons produce validation or missing-button messages.

## Troubleshooting

| Error | Likely cause |
| --- | --- |
| `duplicate id` | Two patterns use the same `id`. |
| `invalid meter` | The meter is not written like `4/4` or uses an unsupported denominator. |
| `use either pattern or steps, not both` | A pattern object contains both compact and explicit formats. |
| `no playable pattern string or steps` | The compact pattern did not parse or the `steps` array is empty. |
| `step extends past the end of the bar` | `t + d` is greater than the meter numerator. |
| `rest cannot be combined with other play tokens` | `rest` appears in a multi-token `play` array. |
| `unknown play token` | A token is misspelled or not implemented. |
| `invalid accent` | The accent is not one of the allowed accent values. |
| `invalid tie marker` | The tie value is not `start`, `stop`, or `continue`. |

## Chord progression library format

Chord progressions are stored separately from bass patterns in:

```text
public/chord-progressions/chord-progressions.json
```

The preferred compact format is:

```json
{
  "id": "pop-rock",
  "name": "Pop-rock progression",
  "progression": "I V vi IV",
  "description": "Very common pop and rock progression."
}
```

The `progression` field is a space-separated list of Roman-numeral chord symbols. Each symbol is one progression slot. The Bass Pattern Player's **Bars per chord** setting controls how many bars the selected bass pattern repeats for each slot.

Examples:

```json
{ "id": "i-iv-v-i", "name": "I–IV–V–I", "progression": "I IV V I" }
```

```json
{ "id": "twelve-bar-blues", "name": "Twelve-bar blues", "progression": "I I I I IV IV I I V IV I V" }
```

Use ASCII accidentals in the compact `progression` string:

```text
bVII  = lowered seventh
#IVdim = raised-four diminished chord
```

The display name may use typographic symbols such as `♭` and `♯`, but the compact progression string should use `b` and `#` for easier parsing.

For uncommon symbols that are awkward in a string, an array form is also accepted:

```json
{
  "id": "example-array",
  "name": "Array example",
  "symbols": ["I", "V/bVI", "bVI", "V/III", "III", "V", "I"]
}
```

The older expanded form with `steps` is still understood internally, but the compact `progression` string is preferred for hand editing.


## Export behavior

The Bass Pattern Player exports the selected app state, not just the raw pattern definition. Export uses:

- the selected root/key
- the selected chord progression
- the selected bars-per-chord setting
- the selected bass pattern
- the current tempo

Available export formats are:

| Format | Purpose | Notes |
|---|---|---|
| ABC | Lightweight notation sketch | Useful for sharing rhythm and chord flow. |
| MIDI | Playable event export | Uses resolved bass/chord buttons from the expanded progression. |
| LilyPond `.ly` | Engraving source | Designed to be rendered externally with LilyPond. |

The LilyPond export uses a `ChordNames` context for resolved chord labels and a `RhythmicStaff` for the bass-pattern rhythm. Because the pattern language is button/action-based rather than staff-note-based, the rhythmic staff shows event labels as markup. For example, a simultaneous root bass plus chord event is shown as a single rhythmic event labelled with its play tokens.

Tuplets and rational durations are exported using LilyPond duration multipliers where needed. For example, one third of a quarter-note meter unit can be represented in the generated source as `c4*1/3`.

## Rendered Stradella staff notation

When the app renders bass-pattern notation with `abcjs`, it uses a simplified Stradella accordion convention rather than ordinary piano-style voicing.

The vertical position is chosen from the musical note name and the button type:

- **Bass and counterbass buttons:** write the note at the first matching staff position at or below the bass-clef middle line, D.
- **Chord buttons:** write the chord root at the first matching staff position above the bass-clef middle line.
- **Bass + chord together:** write both notes at the same rhythmic position, one in the lower bass area and one in the upper chord area.

Chord quality is shown by a small symbol above the chord-button note:

| Symbol | Chord button quality |
|---|---|
| `M` | major |
| `m` | minor |
| `7` | dominant seventh |
| `d` | diminished |

Counterbass events are not marked with `cb` in the rendered staff notation. They are still counterbass events internally and in playback, but visually they follow the same lower-staff placement rule as fundamental bass notes.

If the Bass Pattern Player repeat control is set to a fixed count or infinite loop, the rendered notation uses repeat signs. Fixed-count repeat also adds a short repeat-count annotation.
