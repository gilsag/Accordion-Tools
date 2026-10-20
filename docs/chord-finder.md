# Chord Finder

Accordion Tools provides two chord finders, one for C-system/B-system/piano treble and one for Stradella bass. Both use the same chord formulas and chord symbols (for example `Cmaj`, `Cmin`, `Cmaj7`, `Cmin7`, `Cdim`, `Caug`, `C9`, `Cmaj11`, and `Cmin13`). Chord types are ordered by the number of tones in the complete chord, from triads through thirteenths.

## Supported extended chords

| Family | Example | Theoretical tones |
|---|---|---|
| Dominant 9 | C9 | C, E, G, B♭, D |
| Major 9 | Cmaj9 | C, E, G, B, D |
| Minor 9 | Cmin9 | C, E♭, G, B♭, D |
| Dominant 11 | C11 | C, E, G, B♭, D, F |
| Major 11 | Cmaj11 | C, E, G, B, D, F |
| Minor 11 | Cmin11 | C, E♭, G, B♭, D, F |
| Dominant 13 | C13 | C, E, G, B♭, D, F, A |
| Major 13 | Cmaj13 | C, E, G, B, D, F, A |
| Minor 13 | Cmin13 | C, E♭, G, B♭, D, F, A |

The full theoretical chord and the notes of a practical realization are not always the same. The unaltered fifth can be omitted in chords with at least four distinct notes. In elevenths, the ninth may also be omitted; dominant and major elevenths may omit the major third to create a **suspended-style** voicing. Minor elevenths ordinarily retain the minor third. Thirteenths may omit the fifth, ninth, and eleventh, leaving a conventional root–third–seventh–thirteenth shell. Triads are kept complete; an altered fifth is generally retained. The familiar single Stradella diminished-seventh button remains a special permitted approximation of a diminished seventh.

These are **conservative search rules**, not universal claims about jazz harmony. Rootless ensemble voicings are not included in ordinary Chord Finder approximations. Realizations may never add foreign pitch classes.

## Stradella Chord Finder

Choose a chord root, chord type, and search mode:

- **Bass rows only** builds a chord from individual bass and counterbass buttons.
- **Chord buttons only** searches chord-row buttons. The optional root marker is visual only.
- **Bass + chord buttons** includes mixed combinations, chord-only combinations, and bass/counterbass-only combinations.

The combined mode offers up to 1, 2, 3, or 4 buttons and Compact, Moderate, or Extended hand-span settings. Results pass a geometric reach filter, remove redundant buttons, and keep the preferred ergonomic position when physically different bass/counterbass buttons serve the same recipe. These are approximate hand-span thresholds, not certified fingering recommendations. There is no arbitrary five-realization cap.

For extended chords, up to **three Recommended examples** appear first in the realization selector. The shortlist aims to illustrate contrasting useful approaches: a **compact, pitch-class-complete** realization, a **minimally reduced** voicing with few omissions, and (where meaningful) a **functional shell** such as 1–3–7–13. When some approaches are unavailable, other closely ranked physical arrangements may fill the available places, including multiple exact recipes with identical pitch-class content. All valid alternatives remain selectable, even if not marked Recommended.

The score now balances **number of buttons**, **geometric hand span/compactness**, **musical omission cost**, **number of omitted tones**, and **third/eleventh tension** in major and dominant 11th/13th chords. A conventional 13th shell receives only a small preference rather than a dominant fixed bonus. Recommendation does **not** certify fingering comfort: the geometric reach estimate does not account for every player's hand technique or instrument variation. Exact/Approximate remains independent of Recommended.

If enabled, the concise explanation **beneath the exported diagram** identifies selected buttons, sounded pitch classes, and omitted notes **with their harmonic roles**, for example `G (fifth)`, `D (ninth)`, and `F (eleventh)`. An omitted major third in an eleventh chord is identified as a suspended-style voicing.

Expand **More explanation** in the Chord Finder panel for a realization-specific musical discussion. It describes the selected buttons and sounding pitch classes, then explains the consequences of omissions, why the result is Recommended (if applicable), and the Stradella's compressed chord register. On Stradella, seventh, ninth, eleventh, and thirteenth tones are **pitch-class descriptions**, not a guarantee that upper extensions are stacked in higher octaves; bass/counterbass tones use a separate register from chord rows. A thirteenth is the same pitch class as a sixth, so the retained seventh helps distinguish thirteenth harmony from an ordinary added-sixth chord. Major/dominant 11ths and 13ths discuss the potential semitone between the third and natural eleventh; minor 11ths explain the different whole-tone relation. The explanation is generated from the **actual selected result**, not just the chord name. Nonrecommended alternatives may still be valid and ergonomic; Recommended is an illustrative shortlist, not a hidden musical-validity filter.

## Treble Chord Finder

Choose the root, octave, chord type, inversion, and **Voicing** mode:

- **Auto (default)** displays the complete chord whenever all its tones are available on five or fewer buttons/keys. For 11th and 13th chords containing six or seven distinct tones, Auto chooses a practical reduced voicing instead.
- **Full chord (all tones)** attempts to highlight every theoretical chord tone. Six- and seven-button shapes are useful as diagrams but **cannot be played simultaneously with five fingers**. If the chosen octave or keyboard range does not contain a required pitch, the result identifies it as missing.
- **Practical voicing** uses the standard reduced arrangement: 11ths normally omit the fifth, and 13ths use root, third, seventh, and thirteenth. These choices are not the only musically valid voicings.

**Realization** indicates Exact when all theoretical chord tones are represented, and Approximate otherwise. It does not imply that a six- or seven-button exact illustration is playable with one hand. A note in **More explanation** gives the sounding tones, missing tones and why the result is complete or reduced.

The **Show chord realization note below diagram** checkbox now works with **all chords**, including triads, sevenths, ninths, elevenths, and thirteenths. The SVG/PNG footer reports the actually selected tones and any missing tones with their harmonic roles. When the selected octave or keyboard range lacks a required note, the explanation distinguishes this from a deliberate simplification. The footer is not displayed while the tool is inactive.

## Contextual titles and downloads

Under **Settings → Title**, choose:

- **Auto:** instrument or layout name.
- **Contextual (default):** the active Chord Finder's chord name and, for Stradella, exactness and button count; the active Scale Finder's root and scale name; otherwise the instrument/layout title.
- **Custom:** user-entered text.
- **None:** suppress the diagram title.

No separate title checkbox is required in either Chord Finder. Title formatting settings apply to every mode. For example, a Stradella title might read `Cmaj13 - Approximate - 2 buttons`, while a treble title might read `Cmaj13`.

SVG and PNG filenames use ASCII letters, numbers, and ordinary hyphens. Musical accidentals are converted to safe text. In Contextual mode, Stradella downloads include the selected button names to distinguish physical realizations, such as `Caug-Exact-3buttons-Bass-only-C-bass-E-counterbass-Gsharp-counterbass.svg` (actual names depend on the selected buttons). Filenames do not use typographical dashes, spaces, or other punctuation.

## Related tools

The Harmony Explorer can send supported chord families to the Stradella finder, and the Stradella finder can open related chords in Harmony Explorer. The Progression Assistant can preview its selected chord realization in the finder. See [Harmony Explorer](harmony-explorer.md), [Progression Assistant](progression-assistant.md), and [Settings](settings.md).
