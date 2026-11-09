# Bass–Treble Rhythm Trainer

The Rhythm Trainer is a dedicated two-hand coordination player. Select **Bass–Treble Rhythm Trainer** in Tools from either manual. It uses the current accordion configuration for the treble and Stradella diagrams, as well as the application's sound engine and volume/register preferences.

## Play an exercise

1. Choose a meter: **2/4**, **3/4**, **4/4**, or **6/8**. The available Stradella accompaniments and treble rhythmic templates update to match.
2. Choose the left-hand accompaniment and the right-hand rhythm independently.
3. Select a key and a **chord progression from the same library as the Bass Pattern Player** (cadences, jazz, pop, blues, etc.). Each progression chord occupies its defined number of bars. The right hand follows the current chord root; left-hand bass alternations do not change the harmony.
4. Adjust tempo and repetition count (1, 2, or 4 cycles), then press **Play** in the Tools panel or the shared playback bar under the diagram. **Stop** silences the exercise and clears all highlights.

The right hand repeats **one selected physical treble button for the harmonic root of each measure**. It does not follow every alternating bass pitch. Its note changes at the start of a new harmony, even if the left hand rests on that beat. For instance, C–G–G–C changes the repeated treble note from C to G in measure 2. Alternate button positions for the same pitch are not all highlighted; the trainer picks one available position near octave 4. If a required button or pattern is unavailable, playback is disabled and the missing item is shown. Shorter treble keyboards may expand their visible range to include the required notes.

The central workspace displays a centered four-column rhythm timeline and the paired diagrams (up to 880 px wide, still respecting the configured diagram scale). A dot indicates the **attack** and the length of the colored bar indicates the **notated duration**. Gray represents the left hand; teal represents treble. The active measure is outlined during playback and each attack dot lights up while its scheduled note sounds. Stradella is shown above Treble in the Trainer; the ABC Player keeps its own original order. For 6/8, the timeline shows six eighth-note positions. The ruler visually distinguishes the start of each three-eighth compound beat without an additional explanatory caption.

## Exercise library

The catalog has 25 right-hand rhythms: six in 2/4, six in 3/4, six in 4/4, and seven in 6/8. The first choice in every meter is sustained; the second is one note per metrical beat (dotted-quarter beats in 6/8). Examples include sustained notes, 2+1 and 1+2 in 3/4, eighth-note subdivisions, offbeats, 2-against-3, 3+3 in 6/8, 2+2+2 hemiola, and Cueca bass echo. These are rhythmic templates, not separate melodies or musical pitches. Difficulty values are indicative rather than calibrated performance scores.

The left hand uses compatible built-in Bass Pattern Player definitions: Polka, March and Tango/Habanera (2/4); Waltz, Mazurca and Alternate-bass Waltz (3/4); Alternate-bass Polka, March, and Son/Rumba claves in both 3–2 and 2–3 directions (4/4); and Tarantella (6/8). The sixth choice, **Cueca (ABC bass notes)**, reproduces the verified bass-onset structure of the ABC Player's Cueca floreos, *not* a full Stradella chord accompaniment. Its bass voice has eighth-note attacks at positions 2, 3, 5, and 6 (resting on 1 and 4). It uses **one bass-root button at each attack** and deliberately adds **no chord-button events**. You may select any compatible harmonic progression. The original Cueca examples use I–V–V–I in C (C–G–G–C), which is available in the shared progression library (the trainer defaults to I–IV–V–I in C major). The trainer does not restrict you to that progression.

Important tempo convention: The trainer's 6/8 tempo is measured in **dotted-quarter beats/minute**, while the Cueca ABC source has **Q:1/4=80**. To reproduce that ABC reference speed, set the trainer to approximately **53 BPM** (80 × 2/3); one eighth-note slot is then approximately 375 ms. Set a different tempo for practice as needed.

## Musical notation

Enable **Show notation** from the top toolbar to render both hands using the app’s ABC notation renderer. On desktop, notation opens in the resizable right-side panel; hide it with the workspace results toggle. On narrow screens, notation appears below the diagrams. The notation normally uses two staves: treble root notes and a combined Stradella bass/chord-symbol voice; the latter does **not** attempt to spell every sounding Stradella reed. The treble pitch follows the selected chord root for each bar. An SVG download button is included. In the current implementation, notation uses a neutral C chromatic key signature with explicit accidentals, to avoid incorrect pitches when mixing modal and chromatic progressions.

## Current phase limitations

The current version provides **Explore/listen mode** and synchronized two-hand playback. It does **not yet score user taps, accept MIDI/microphone input, provide count-in, implement endless looping, or generate arpeggios**. These are planned for later phases. The note assignments currently use chord roots only, not third/fifth arpeggio degrees. The 6/8 Cueca rhythm is transposed from a source bass-only pattern; it is not a transcription of the original treble floreo melodies.

The tool reuses the existing sound scheduler pattern, Bass Pattern resolution, two-manual SVG diagram, and exclusive stop behavior. No ABC source examples are modified.

## March and clave-based left-hand exercises

The **March (2/4)** pattern uses four eighth-note attacks per measure: root bass on 1, chord on 1&, fifth bass on 2, chord on 2&. **March (4/4)** uses root bass on 1, chord on 2, fifth bass on 3, chord on 4, with accents on the basses. Both are built-in Bass Pattern Player definitions shared with the trainer.

Four **4/4 two-bar clave-based coordination exercises** use the same shared library as the Bass Pattern Player. Son 3–2 places its five strokes at **bar 1: 1, 2&, 4; bar 2: 2, 3**. Son 2–3 reverses the bar order. Rumba 3–2 shifts the 4 attack to **4&**, and Rumba 2–3 reverses the order. Each bar's first clave attack is mapped to a root bass button; its remaining strokes use the chord button, chosen from the *current harmonic progression*. These are **pedagogical Stradella adaptations of the clave timeline**, not literal claves (normally a percussion reference) or a transcription of a Cuban bass tumbao. No extra downbeat notes are inserted in the 2-side.

The two-bar timing cycle persists **across harmonic changes**, even when the progression changes chords every measure. A four-bar I–IV–V–I progression still occupies four bars, not eight. With odd-length progressions, the last clave cycle is incomplete before the chosen progression repeats; use even-length progressions for uninterrupted clave looping. Notation and the animated attack dots derive from the same resolved events as audio playback.


## Standardized Stradella notation

The left-hand staff uses the same symbolic Stradella pitch-class-to-staff mapping as the Bass Pattern Player and recorded sequences. Chord buttons are indicated by a single upper-register root note with a chord-quality label (repeated by default). The staff does not shift when bass/chord audio octaves or registers change. **Settings → Music notation** provides global preferences for repeated chord labels and optional counterbass dashes. The Rhythm Trainer remains a symbolic learning tool; its treble notes retain their selected physical treble octave. Imported scores in ABC Player are not rewritten.
