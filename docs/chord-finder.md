# Chord Finder

Accordion Tools has two chord finders: one for the treble side (C-system, B-system or piano) and one for the Stradella bass. Both know the same 35 chord types, from triads to thirteenths, and write chord symbols in the style chosen under **Settings → Notation**.

Opening a Chord Finder shows the current chord on the diagram straight away. **Hide chord** clears the diagram without losing your choices; **Show chord** brings it back. Opening another tool also hides the chord and the Results panel; when you come back to the Chord Finder, the same chord and realization reappear. **Play combination** plays the chosen buttons.

## Chord types

The list runs from three-note chords to seven-note chords. Besides major, minor, diminished, augmented, sixths and sevenths, it includes sus2, 7sus4, add9, m(add9), 6/9, m6/9, 7♯5, 7♯9, maj7♯11 and the 9th, 11th and 13th families:

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

### Leaving notes out

Many chords have more notes than you can play at once, so a practical version may leave some out. The finder follows conventional rules:

- The plain fifth can be left out of any chord with four or more notes.
- In 11th chords the ninth may also go; dominant and major 11ths may drop the third for a suspended sound. Minor 11ths keep their minor third.
- 13th chords may drop the fifth, ninth and eleventh, leaving root, third, seventh and thirteenth.
- Triads are always complete, and notes that give a chord its name (an altered fifth or ninth, a suspension, an added ninth) are always kept.
- A version never adds a note that is not in the chord.

A complete version is marked **Exact**; one that leaves notes out is **Approximate**, with the missing notes listed. These are cautious rules, not the only valid voicings. Being complete is only one factor in the ranking: leaving out just the plain fifth costs very little, so C bass + C7 (whose seventh button has no fifth) ranks as the usual first choice for C7.

## Stradella Chord Finder

Choose a **Chord root**, **Chord type** and **Search mode**:

- **Bass rows only:** builds the chord from single bass and counterbass buttons.
- **Chord buttons only:** uses the major, minor, seventh and diminished chord buttons. **Show root bass reference** marks the root bass for orientation; it is not played.
- **Bass + chord buttons:** mixes both, for example a bass button with a chord button.

In the mixed mode, **Maximum buttons** (1 to 4) and **Maximum hand span** (Compact, Moderate or Extended) limit how many buttons and how wide a reach are allowed. The reach limits are approximate, not fingering advice. Two buttons that sound the same note (a bass and a counterbass, say) count as one choice, and the more comfortable one is shown.

Remember that the Stradella chord buttons have only three notes: the seventh and diminished buttons leave out the fifth.

### Requested bass / inversion

**Requested bass / inversion** starts on the chord's root (root position) and follows it when you change the chord. If no combination within your limits puts the root lowest (Major 6/9 is an example), the finder shows results with any bass and says so under the selector.

- Choose **Any (no specified bass)** to see all inversions together. This choice stays when you change the chord.
- Choose another note of the chord to ask for that note in the bass, for example G for Em7/G.

**Play lowest note on bass button** (on by default) asks for the requested lowest note to be played on a bass or counterbass button, the way the left hand is usually played. Without it, chord buttons alone can count as root position, because their lowest note may be the root. If no combination within your limits plays that note on a bass button, the finder first tries the next wider **Maximum hand span** (Compact to Moderate, Moderate to Extended) and says so: C6 with Moderate reach becomes C counterbass + A minor. Only if that also fails does it show results where the note is only the lowest one, and says that instead.

"Lowest" is worked out from the register model in **Settings → Instrument → Stradella registers**, which gives each button one pitch. Real accordions may add octave reeds, so the note you hear lowest can differ; adjust the model to match your instrument if you know how it is built.

### Comparing realizations

Each way of playing the chord is a *realization*. The **Results** panel next to the diagram (below it on narrow screens) lists them in a table: the rank, the buttons played, the bass notes, Exact or Approximate, the notes left out, and the number of buttons. Up to three **Recommended** realizations are starred: typically a compact complete one, one with few notes left out, and a shell voicing such as root–third–seventh–thirteenth.

Click a row, or use **Previous realization** and **Next realization** (← →) in the tool panel, to show it on the diagram. Navigation does not play sound or wrap around.

Three filters narrow the table without changing the ranking:

- **Root in bass:** a bass or counterbass button plays the root. This is not the same as **Requested bass**, which is about the lowest note.
- **Exact only:** hides Approximate realizations.
- **≤ 2 buttons:** hides larger combinations.

If the selected realization is filtered out, it stays on the diagram and a note says it is hidden.

The ranking weighs the number of buttons, how compact the shape is, which notes are left out (the plain fifth hardly counts), whether a bass button supports the bass note, and how crowded the low notes would sound. Distances are measured in buttons, so changing the diagram's size or spacing does not change the order.

**Minimum nominal note gap** can leave out realizations whose neighbouring notes are very close: **Allow all gaps** (default), **Exclude 1-semitone gaps** or **Exclude 1- and 2-semitone gaps**. This is a matter of taste for the low register, not of correct harmony.

### Explanations on the diagram

With **Show diagram explanation** on, up to four lines appear under the diagram and in downloaded images. Turn each on or off:

- **Harmonic identity:** the chord and its inversion, for example Cm7/B♭ · Third inversion.
- **Pitch-class realization:** the notes that sound, Exact or Approximate, and any notes left out with their role.
- **Physical realization:** the buttons played, for example **B♭ bass + C minor**.
- **Registral voicing:** the notes from low to high with octave numbers, for example C2 – E3 – G3, from the register model. **Show nominal note spacing** draws them as a chart instead, showing the semitones between neighbours, with one-semitone gaps in red.

**Explanation text size** sets their size. These lines describe the chosen realization; they never change which buttons are found or how they sound.

**More explanation** in the tool panel gives a longer discussion of the selected realization: which notes support the root, whether a non-root bass gives a slash-chord sound, what leaving notes out does, why a result is recommended, and when close intervals in the low register might sound crowded.

### Download all diagrams

**Download all diagrams (ZIP)** saves one image for every realization of the current chord, in the format chosen in the **Download** menu, with the same explanation lines and labels. The diagram you were looking at is restored afterwards.

## Treble Chord Finder

Choose the root, octave, chord type, **Inversion** and **Voicing**:

- **Auto (default):** the complete chord when it fits on five or fewer buttons or keys; otherwise a practical reduced version.
- **Full chord (all tones):** every chord tone, even when there are six or seven. These shapes are useful to see but cannot be played with five fingers.
- **Practical voicing:** the usual reduced form: 11ths without the fifth; 13ths as root, third, seventh and thirteenth.

If the chosen octave or keyboard range is missing a note, the result says so. **Show chord realization note below diagram** adds a line with the notes played and any notes missing, and **More explanation** explains why the result is complete or reduced.

## Titles and file names

With **Settings → Title → Contextual** (the default), the diagram title names the chord as played, for example **Cm7/B♭ - Exact - 2 buttons** on Stradella or **Cmaj7 - selected 1st inversion - Exact** on the treble side. Downloaded files are named after the chord and the buttons used, in plain letters and numbers, so different realizations get different names.

## Related tools

Harmony Explorer can send a chord to the Stradella Chord Finder, and **Explore harmony** sends the current chord back. The Progression Assistant uses the same realizations for every chord in a progression. See [Harmony Explorer](harmony-explorer.md), [Progression Assistant](progression-assistant.md) and [Settings](settings.md).

The **Reset** menu in the top bar has **Clear current work** and **Restore current tool defaults**; neither changes your sound or register settings.
