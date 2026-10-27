# Chord Finder

Accordion Tools provides two chord finders, one for C-system/B-system/piano treble and one for Stradella bass. Both use the same chord formulas and chord symbols (for example `Cmaj`, `Cmin`, `Cmaj7`, `Cmin7`, `Cdim`, `Caug`, `C9`, `Cmaj11`, and `Cmin13`). Chord types are ordered by the number of tones in the complete chord, from triads through thirteenths.


The **Show diagram explanation** checkbox controls the concise four-level annotation displayed with the Stradella diagram and included in SVG/PNG exports. Each Chord or Scale Finder has a Show/Hide action; hiding the result preserves the selected chord or scale and its settings. Playback remains independently available when notes/buttons are available. Use the application Reset menu when you want to clear the current work or restore a tool's supported defaults.


## Additional chord families (v0.15.8)

Both Finders include **Csus2, C7sus4, Cadd9, Cm(add9), C6/9,
Cm6/9, C7♯5, C7♯9, and Cmaj7♯11**. Altered fifths, altered ninths,
altered elevenths, suspensions and explicitly added ninths are defining tones:
a reduced realization must retain them. C7♯9 can be represented by the
Stradella preset **C7 + C minor** (the minor-third pitch class is spelled as
an augmented ninth in the requested chord). Additional combinations use the
existing exact/mixed search; some require four buttons or cannot be realized
within the selected preset and ergonomic limits.

**Ranking:** For requested chords with up to four distinct tones, exactness
retains its established priority. For five or more distinct tones, the
mixed-mode score applies stronger nominal low-register semitone and cluster
penalties. Conventional omissions may therefore be preferable to denser
complete realizations. This is a ranking preference, not a validity filter,
and it reflects configured nominal pitches rather than measured reeds.

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
- **Chord buttons only** searches chord-row buttons. The optional root marker is visual only; use **Show/Hide root bass reference** to toggle it.
- **Bass + chord buttons** includes mixed combinations, chord-only combinations, and bass/counterbass-only combinations.

### Requested bass and inversion (Stradella)

The **Requested bass / inversion** selector defaults to **Any (no specified bass)**. Choose a particular tone of the requested chord (for example, G for `Emin7/G`) to require that pitch class to be the **lowest modeled note**. The Finder uses the analytical register ranges configured in Settings for the separate bass/counterbass and preset-chord buttons. A slash specification is an actual constraint: candidates with a different lowest modeled note are excluded before the Recommended shortlist is chosen. If the current layout, button-count/reach limits, and register assumptions cannot realize the specified bass, no valid result is shown; the Finder does not silently substitute another inversion.

Root, chord quality, pitch-class coverage, modeled register, and physical button selection remain separate. For example, `Emin7/G` and `Gmaj6` both contain E–G–B–D, but they have different requested harmonic identities. This iteration supports only slash basses that are tones of the requested chord, not arbitrary outside pedal tones. When needed, one non-root bass button may reinforce a tone already present in preset chord buttons, subject to existing geometry and button limits. With no slash-bass selection, candidate validity is unchanged, although five-plus-tone recommendation ordering reflects the new density policy. Exported notes and contextual titles identify the realized slash bass when the configured register model places a non-root chord tone lowest. The requested root and chord quality remain unchanged; filenames use safe text such as `-over-Bflat` or `-over-G`.

These inversions apply to the **configured one-pitch-per-tone model**, not an acoustically verified transcription: real accordions may add reeds or octave doublings, and La Melodiosa has both register-following sampled playback and an optional original-mapping mode. Adjust the register model to match the instrument's observed behavior where known.

The combined mode offers up to 1, 2, 3, or 4 buttons and Compact, Moderate, or Extended hand-span settings. Results pass a geometric reach filter and remove harmonically unnecessary buttons, except that the combined mode may additionally allow one root bass/counterbass button reinforcing the root already present in preset chords. Physically equivalent bass/counterbass positions are consolidated to one ergonomic representative. These are approximate hand-span thresholds, not certified fingering recommendations. There is no arbitrary five-realization cap.

For extended chords, up to **three Recommended examples** appear first in the realization selector. The shortlist aims to illustrate contrasting useful approaches: a **compact, pitch-class-complete** realization, a **minimally reduced** voicing with few omissions, and (where meaningful) a **functional shell** such as 1–3–7–13. When some approaches are unavailable, other closely ranked physical arrangements may fill the available places, including multiple exact recipes with identical pitch-class content. All valid alternatives remain selectable, even if not marked Recommended.

The score now balances **number of buttons**, **geometric hand span/compactness**, **musical omission cost**, **number of omitted tones**, and **third/eleventh tension** in major and dominant 11th/13th chords. Compactness is measured in **adjacent Stradella column spacings**, not screen pixels, so changing the displayed button size or diagram spacing does not change recommendation priorities. The ergonomic distance uses a **small 1.10 weight on movement along the instrument’s vertical (circle-of-fifths) direction**, which is the diagram’s horizontal axis; movement between functional rows has weight 1.00. This is a modest geometric heuristic, not a fingering model. Physically equivalent bass-only clusters use deterministic tie-breaking, favoring proximity to the requested root's reference button before stable button IDs. A conventional 13th shell receives only a small preference rather than a dominant fixed bonus. Within comparable major/dominant 13th realizations, omitting a natural eleventh is penalized less than omitting a ninth, because the eleventh can conflict with the major third. The inverse preference is not imposed on minor 13ths. Notes need not be in stacked-thirds or scale order: vertical ordering alone has no ranking penalty. Different slash-bass requests are not directly comparable. The scorer also applies a **one-point preference for a single played root bass supporting preset chord buttons**, using the structural registral metadata. This is deliberately smaller than the three-point cost of another button and less than the cost of an extra normalized column of reach. It is a tie-breaking preference, not a requirement for root position: **slash-bass and chord-button-only alternatives receive no penalty and remain available**. Multiple-bass combinations are not interpreted as having one definitive low root. Recommendation does **not** certify fingering comfort: the geometric reach estimate does not account for every player's hand technique or instrument variation. Exact/Approximate remains independent of Recommended.

### Four-level concise diagram notes

Under **Chord Finder → Show diagram explanation**, select any combination of the four explanation levels:

- **Harmonic identity:** Requested root and quality, with the realized slash bass when applicable (e.g., `Cmin7/B♭ · Third inversion`). Inversions are interpreted using the selected nominal register settings.
- **Pitch-class realization:** Sounding pitch classes, Exact/Approximate status, and omitted chord tones with their harmonic roles. Pitch classes do not specify octaves.
- **Physical realization:** Played Stradella bass/counterbass and preset chord buttons, button count, and Recommended status when applicable. Preset chord buttons use concise symbols (`CM`, `Fm`, `G7`, `Bdim7`); **bass** and **counterbass** are written in full. Reference buttons that are highlighted but not sounded are excluded.
- **Registral voicing:** Sounding pitches and octaves under the configured analytical bass and chord registers. This is a nominal model, not an acoustic measurement of reed frequencies or octave doublings.

The levels appear in this order in both the settings menu and the SVG/PNG diagram footer. Footer values share one aligned label column; the registral chart sits beside its heading rather than below a detached label. Each checkbox operates independently while **Show diagram explanation** is enabled. All four levels are enabled by default. Disabling the master option hides the footer without changing the saved selections; disabling all four levels removes the footer and its reserved space.

Registral voicing normally lists distinct nominal pitches in ascending order (for example, `C2 – E3 – G3`), marking unison contributions as `×2` where applicable. The nested **Show nominal note spacing** option replaces this text with a compact chart beside the Registral voicing heading. It shows the number of semitones between each pair of consecutive nominal pitches, with one-semitone intervals highlighted red. Labels respond to the explanation text-size control while using bounded chart typography and collision-avoiding spacing. Pitch-marker positions and interval lengths are strictly proportional (23 diagram units per semitone); crowded note labels move to separate vertical lanes without shifting pitches. Short marker ticks replace long full-height leaders, and semitone counts appear below the axis. The scale is intrinsic to the SVG and may shrink uniformly to fit an export; the displayed interval counts remain exact. The chart is included in SVG/PNG downloads when enabled. The explanatory tooltip identifies the register model as configured, not measured audio.

The note-spacing option is on by default and disabled when Registral voicing is unchecked, without discarding its selection. The setting is included as `stradellaShowNominalNoteSpacing` in exported/imported settings JSON; older files without the key use the default. The contextual title and download filenames do not depend on which note levels are visible. The `stradellaNoteLevels` selections can be imported or exported; absent fields in older settings default to enabled.

These short notes do **not** filter or rescore candidates, change their sounding pitches, or hide the separate **More explanation** discussion. In particular, showing a lowest *modeled* pitch is not a claim that the actual acoustic lowest reed has been measured.

Expand **More explanation** in the Chord Finder panel for a realization-specific musical discussion. It describes the selected buttons and sounding pitch classes, then identifies structural root support, a *potential* slash-bass character, a chord-button-only realization, or an ambiguous multiple-bass combination. It explains the consequences of omissions, why the result is Recommended (if applicable), and the Stradella's compressed chord register. On Stradella, seventh, ninth, eleventh, and thirteenth tones are **pitch-class descriptions**, not a guarantee that upper extensions are stacked in higher octaves; bass/counterbass tones use a separate register from chord rows. A thirteenth is the same pitch class as a sixth, so the retained seventh helps distinguish thirteenth harmony from an ordinary added-sixth chord. Major/dominant 11ths and 13ths discuss the potential semitone between the third and natural eleventh; minor 11ths explain the different whole-tone relation. The explanation is generated from the **actual selected result**, not just the chord name. Nonrecommended alternatives may still be valid and ergonomic; Recommended is an illustrative shortlist, not a hidden musical-validity filter.

### Structural registral interpretation

Each Stradella Chord Finder result now has internal `registral` metadata derived **only from the sounded (`playbackButtons`) buttons**. This distinguishes root support by a bass/counterbass button, another chord tone used as a bass, multiple distinct bass pitches, and realizations using preset chord buttons alone. An optional visually highlighted root button in **Chord buttons only** is not played and does **not** imply bass support.

Where one non-root bass button accompanies preset chords, the metadata records a **potential slash-chord interpretation** (for example, `Cmaj7/B` for B counterbass + C major). This is a structural indication, **not** a verified inversion or an assertion that B is the lowest acoustic reed for every instrument. With multiple different bass notes or chord buttons alone, the lowest-register interpretation is indeterminate. Root pitch-class presence and root reinforcement in a separate bass register are tracked independently.

The analysis contains no fixed MIDI octaves and does not use the current sound engine. In mixed mode, the search retains selected registrally distinct **root-reinforced** alternatives. For example, `C bass + C major` is now considered different from `C major` alone: both are exact in pitch-class terms, but only the former explicitly reinforces C in a separate bass role. This is allowed only when an otherwise valid chord-button-only realization can be augmented by **one** practical root bass/counterbass button within the existing maximum-button and hand-span limits. Other pitch-class-redundant combinations remain excluded; in particular, there is no extra non-root bass doubling or unlimited bass-note stacking.

The candidate-generation improvement does **not** alter Exact/Approximate rules or audio. The recommendation model uses this structural metadata as a modest preference in recommendation scores and same-priority physical ranking. A recommended root-supported result identifies its separate bass reinforcement in the *Why Recommended* explanation, without asserting fixed octave assignments. The explanation layer uses the stored metadata for explanations and diagram notes. Root-supported recipes identify independent bass reinforcement; non-root single-bass recipes identify a **conditional** slash-chord interpretation (e.g. `Cmaj7/B`, `Cmaj13/B`); chord-button-only and multiple-bass recipes are explicitly distinguished. No acoustic lowest-note assertion is made without instrument/register evidence. Search, scoring, omission rules, and audio remain unchanged.

## Treble Chord Finder

Choose the root, octave, chord type, inversion, and **Voicing** mode:

- **Auto (default)** displays the complete chord whenever all its tones are available on five or fewer buttons/keys. For 11th and 13th chords containing six or seven distinct tones, Auto chooses a practical reduced voicing instead.
- **Full chord (all tones)** attempts to highlight every theoretical chord tone. Six- and seven-button shapes are useful as diagrams but **cannot be played simultaneously with five fingers**. If the chosen octave or keyboard range does not contain a required pitch, the result identifies it as missing.
- **Practical voicing** uses the standard reduced arrangement: 11ths normally omit the fifth, and 13ths use root, third, seventh, and thirteenth. These choices are not the only musically valid voicings.

**Realization** indicates Exact when all theoretical chord tones are represented, and Approximate otherwise. It does not imply that a six- or seven-button exact illustration is playable with one hand. A note in **More explanation** gives the sounding tones, missing tones and why the result is complete or reduced.

The **Show chord realization note below diagram** checkbox now works with **all chords**, including triads, sevenths, ninths, elevenths, and thirteenths. The SVG/PNG footer reports the actually selected tones and any missing tones with their harmonic roles. When the selected octave or keyboard range lacks a required note, the explanation distinguishes this from a deliberate simplification. The footer is not displayed while the tool is inactive.

## Configurable register interpretation and navigation

In **Settings → Stradella registers**, independently from Sound, the bass/counterbass and preset-chord ranges let you select a starting octave plus either `C–B` or `F–E` grouping. The result and concise explanation now show the **nominal pitches from low to high**, with octave numbers. More explanation retains the model-specific inversion discussion and caveats. For example, a B bass with a C major chord can yield B2 as the nominal lowest note with the defaults (bass C2–B2, chords C3–B3), but a high bass-register setting may place a C chord tone below B.

This calculation does **not** establish a physical accordion's true acoustic inversion. When **Follow configured Stradella registers** is enabled in La Melodiosa playback, its nominal MIDI pitches also drive the sampler (with transposition as needed); when disabled, sample playback retains the historical C2–B2 and C3–B3 mappings. It is based on one nominal pitch per chord tone and played button, not on visual reference markers or measured reed spectra. Structural labels (root support and possible slash-bass character) remain separate from the configured register model.

The mixed-mode realization selector provides adjacent **←** and **→** arrow buttons on one line, with an index indicator between them. Accessible labels identify Previous realization and Next realization. Navigation does not autoplay or wrap around.

## Contextual titles and downloads

Under **Settings → Title**, choose:

- **Auto:** instrument or layout name.
- **Contextual (default):** identifies the *realized* chord and inversion under the selected nominal register settings while retaining the requested root and quality. A non-root chord tone in the lowest modeled position is shown as a conventional slash (`Cmin7/B♭`), with Exact/Approximate status and played-button count. In root position no slash is needed. For Treble, it identifies the selected inversion and Exact/Approximate status (or No realization when no buttons are highlighted). Scale Finders retain the root and scale name; other modes use the instrument/layout title.
- **Custom:** user-entered text.
- **None:** suppress the diagram title.

No separate title checkbox is required in either Chord Finder. For example, Stradella can show `Cmin7/B♭ - Exact - 2 buttons` or `Cmaj13/B - Approximate - 2 buttons`, while treble may show `Cmaj7 - selected 1st inversion - Exact`. Octave numbers are shown in Registral voicing, not the contextual title. The register-dependent slash is a **nominal musical interpretation**, not proof of a measured lowest reed; a short tooltip and this guide explain the limitation. Hiding any or all concise note levels does not change the title. Longer contextual titles are auto-fitted in compact diagrams.
SVG and PNG filenames use ASCII letters, numbers, and ordinary hyphens. Musical accidentals are converted to safe text. In Contextual mode, Stradella downloads use a separate stable recipe key (requested chord, explicit slash bass, Exact/Approximate, and selected played buttons), rather than the modeled-lowest title suffix, to distinguish physical realizations, such as `Cmin7-over-Bflat-Exact-2buttons-Bflat-bass-C-minor.svg` or `Caug-Exact-3buttons-Bass-only-C-bass-E-counterbass-Gsharp-counterbass.svg` (actual names depend on the selected buttons). Filenames do not use typographical dashes, spaces, or other punctuation.

## Related tools

The Harmony Explorer can send supported chord families to the Stradella finder, and the Stradella finder can open related chords in Harmony Explorer. The Progression Assistant can preview its selected chord realization in the finder. See [Harmony Explorer](harmony-explorer.md), [Progression Assistant](progression-assistant.md), and [Settings](settings.md).

### Register-dependent voicing density (v0.15.4)

When the nominal register model predicts adjacent semitones in the bass or chord registers, concise **Registral voicing** notes may identify a close pair (for example, `close E3–F3 semitone`) or a cluster of four or more neighboring pitches. **More explanation** discusses why these intervals can be intentional but might sound congested in the lower register. The observation depends on distinct modeled MIDI pitches; a unison doubled by two buttons is not counted as dissonance.

In **Bass + chord buttons** recommendations, chords of up to four distinct tones retain the restrained density adjustment (capped at 1.1 points). Chords with five or more tones use a stronger register-aware density cost, so a congested low-register interval can outweigh another button. It does not remove valid realizations, override a requested slash-bass constraint, or claim verified physical-acoustic reed voicing. Larger octave/rank combinations on real instruments may sound different from the simplified model.

## Chord symbol display

Chord symbols shown in diagrams and explanations follow **Settings → Notation → Chord symbol style**. For example, a C minor seventh realization may appear as **Cm7/B♭** or **Cmin7/B♭**. The chord search, inversion constraints, and download filename identifiers are unaffected.

### Proportional registral spacing and dense-voicing control

The optional nominal-spacing diagram places distinct nominal MIDI pitches on a **strictly proportional horizontal semitone scale** (23 diagram units per semitone). Note names are staggered onto independent label rows and linked to their true pitch positions by leader lines; label collisions must not change pitch distances. These are configured Stradella register pitches, not measurements of acoustic reeds.

The **Minimum nominal note gap** selector has three settings: **Allow all gaps** (default), **Exclude 1-semitone gaps**, and **Exclude 1- and 2-semitone gaps**. The test compares adjacent *distinct* nominal pitches after sorting them by MIDI note number and ignoring unison duplicates. It applies to all Stradella Chord Finder search modes before recommendations are assigned. This is a registral preference, not a judgement of harmonic chord correctness; a filtered chord may still be musically valid. Close one-semitone pairs also incur a stronger *ranking* penalty when the filter is off.

**Download all diagrams (ZIP)** saves the playable candidate diagrams for the current chord and search settings, preserving the chosen **SVG/PNG** download format, explanation levels, diagram labels and configured registers. Each candidate is exported separately and the current selection is restored afterwards. The existing Download button saves only the displayed diagram.

The top-bar **Reset** menu separates **Clear current work** (removes transient selections and playback without altering preferences) from **Restore current tool defaults** (resets the active Chord Finder's controls, not global sound or register settings). The second action is shown only for tools with a defined reset scope.
