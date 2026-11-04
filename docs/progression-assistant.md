# Stradella Progression Assistant

The **Progression Assistant** is a separate Stradella-side tool for choosing a coherent sequence of chord realizations across a progression. It is not part of the Harmony Explorer panel, although Harmony Explorer can send selected relationships into it.

## Opening the tool

Choose **Stradella** in the top bar, then open **Tools → Progression Assistant**.

The tool is shown only for the Stradella side because its optimization uses the physical geometry of Stradella bass/counterbass and chord buttons.

## Building a progression

Use the **Manual / Use preset** choice to select an entry method. **Manual** shows Root and Chord type; **Add chord** appends the chosen chord. **Use preset** shows the shared Bass Pattern Player progression catalog and key, with **Load preset** replacing the list. Both modes place their primary action next to **Clear**. Switching modes does not erase the current progression or draft selections. Alternatively, select a relationship in Harmony Explorer and choose **Add relationship to Progression**.

The list is left-aligned and shows the chord symbol without repeating the chord-type name. Its up/down buttons reorder chords; × removes a chord. **Clear** removes the complete sequence. The eye next to a chord toggles its diagram explanation: at most one chord (or none) can have its eye selected. The notes use the currently optimized or manually pinned realization, never a theoretical chord or a purely visual reference marker.

### Chord-type catalog and Harmony compatibility

Progression Assistant and both Chord Finder panels use the same **35-option** `CHORD_FINDER_OPTIONS` list in `src/music/chordDefinitions.ts`; its selection is consistently labeled **Chord type** in all six interface languages. This includes add9, altered sevenths, 9ths, 11ths and 13ths. Requests store the exact `FinderChordPattern` identity and use the existing Stradella search/ranking engine. Some chords have no realizations on a particular physical bass layout; the result is reported as unavailable rather than substituted with a simpler chord. In the current UI, the automatic optimizer still examines up to five available ranked candidates, while arrows expose all playable candidates.

Harmony Explorer retains its existing 16-family graph. Chords transferred from Harmony retain their original `ChordFamilyId` and are converted via the explicit Harmony-to-Finder adapter when searching. The unsupported augmented-major-seventh family is not silently mapped. Harmony Explorer's ring mathematics and chord-family display remain unchanged.

## Optimization

For each chord, Accordion Tools generates ranked **Bass + chord buttons** realizations using the same Stradella Chord Finder engine. **Auto** uses global dynamic programming over the original first-five candidate shortlist. Individual Finder rankings are unchanged; the transition objective has been revised as described below.

### Choosing a realization for an individual chord

Each chord row has **← / →** controls. They cycle from **Auto** through every playable Chord Finder realization and display its **original rank**, including choices below the optimizer's first five. In Auto, the optimizer chooses the chord's sounding recipe; choosing a rank **pins that chord** to the selected `playbackButtons` recipe and recomputes the globally optimized choices for the other steps. The original ranks do not change.

Manual choices belong to stable progression-step IDs, not list positions; rearranging chords keeps the right choice with each chord. If the selected recipe disappears because the physical layout changes, that step returns to Auto. Removing a step clears its choice. These choices are temporary session state and do **not** add keys to the 118-field settings JSON.

Changing a realization stops any scheduled playback. The eye-selected diagram notes, preview highlights, rhythmic playback and generated notation all read the same resulting progression plan. The previous **Open preview in Chord Finder** button has been removed; the arrow controls and shared Results Inspector already expose the available recipes.

**Example:** If automatic optimization chooses bass/counterbass notes to form C major, browse to a candidate using the **C major chord button**. Auto now begins with the original Finder rank and trades rank against user-weighted transitions; a bass-only realization still produces bass-only pulses under existing waltz rules unless explicitly replaced. The rhythmic layer now separates the lowest selected bass/counterbass from the remaining selected buttons. Independent per-chord bass-pulse override and rhythm editing remain future work.

The automatic objective is now

`J = Σ (original Finder rank − 1) + 1.5 × physicalSlider × Σ(physical movement in button spacings) + 0.75 × voiceSlider × Σ(harmonic pitch-class motion in semitones)`.

Both independent sliders range from 0 to 100%, represented as 0–1 coefficients. The numerical scales (2 button spacings and 4 semitones for a 3-rank tradeoff at 100%) are starting heuristics, **not biomechanical or acoustic measurements**. The original Stradella Chord Finder ranking handles physical button economy, musical completeness, and ergonomic preferences; no secondary fixed exactness penalty or compactness penalty is applied. Conservative omissions approved by the Chord Finder are always eligible. The former approximation checkbox has been removed: it duplicated the Finder’s eligibility policy rather than defining a separate progression preference. The legacy `progressionAllowApproximations` JSON field is still accepted and round-tripped but no longer filters these results. The 5-candidate automatic shortlist remains in place; explicit arrows can pin any available ranked recipe.

At **0% physical / 0% harmonic**, Auto chooses the first eligible Finder realization independently at each unpinned step. The sliders can independently favor physical continuity or minimum pitch-class motion; user-pinned steps always win. The existing `progressionHandMovementWeight` settings key retains its original value for import/export compatibility but is now interpreted as a physical coefficient, not as a complementary cross-fade. The new harmonic weight defaults to 35% and is session-only; the 118-key settings export is unchanged. A future version could add opt-in persistence with an explicit schema migration.

### Preset progressions

The preset selector reads the **same 29-entry JSON catalog already loaded by the Bass Pattern Player**; there is no second catalog fetch or copy. Switch to **Use preset**, select a progression and key, then **Load preset** to replace the editable list (with fresh stable IDs and cleared realization pins). Roman numerals are resolved using the existing Bass Pattern Player helper. Supported Roman-numeral templates resolve directly to shared Finder chord-type IDs. Unsupported Roman-numeral syntax (including secondary dominants), and minor-tonic entries that require a separate minor-mode resolver are **marked unsupported** and cannot be loaded; none are silently reduced or omitted. Catalog names remain as defined in the shared JSON. The key refers to the common major-scale mapping for supported templates. A future extension can implement a proper minor-mode and secondary-dominant bridge.

## Stradella preview and explanatory notes

Select the **eye icon** beside any progression chord to display the same four levels of explanatory notes available in Stradella Chord Finder (harmonic identity, realized pitch classes, nominal registral voicing, and physical played buttons). Its pressed state indicates the selected chord; pressing it again turns the notes off. Selecting a different eye automatically replaces the previous selection. The choice is stored by the chord's stable ID, so reordering a sequence does not transfer its notes to a different chord. Deleting that chord, replacing the progression, or clearing it removes the eye selection.

The explanatory lines come directly from `realizationAnnotation()` using the step's `result.playbackButtons`, current nominal Stradella register model, chord-display style, interface language, and the **existing four note-level preferences**. Optional interval charts reuse the same diagram footer and SVG/PNG rendering pipeline as Chord Finder. This is an explanatory preview, not a change to the selected realization, audio pitches, or rank. An eye is suppressed during sounding pulses so a static chord explanation is not mistaken for the currently sounding subset; playback highlighting takes priority.

A result clicked in the shared Results Inspector also selects that chord's preview and notes. With no eye selected, the previous arrow-based preview still works, but does not force explanatory text. The former **Open preview in Chord Finder** command has been removed; use the per-chord realization arrows for all ranked options.

## Results

The optimized plan reports:

- the selected physical realization for each chord;
- total harmonic voice motion;
- total physical hand movement;
- whether any approximate realizations were used;
- per-transition voice motion;
- per-transition physical movement;
- shared pitch classes.

**Play progression** and **Stop** stay in the left controls panel; the extra Finder-opening control has been removed. The Results Inspector shows the chosen steps and transition metrics. The top toolbar provides **Show results / Hide results** for either the Stradella Chord Finder or the Progression Assistant.

**Play progression** uses the current Accordion Tools sound settings, including La Melodiosa when selected. The buttons sounding on each pulse are highlighted directly on the Stradella diagram during playback.

### Rhythmic playback

The Progression Assistant provides four intentionally simple accompaniment patterns:

- **All buttons together** — plays the complete selected realization as a block.
- **Basic oom-pah (2/4)** — the lowest selected bass/counterbass on beat 1, followed by every other button from that realization on beat 2.
- **Waltz (3/4)** — the lowest selected bass/counterbass on beat 1, then all remaining selected buttons on beats 2 and 3.
- **March (4/4)** — the lowest selected bass/counterbass on beat 1, then all remaining selected buttons on beats 2, 3 and 4.

The lowest bass is determined by the **configured nominal sound mapping**, not by physically measured accordion reed voicing. If several bass/counterbass buttons are selected, only the lowest sounds on beat 1; the higher bass/counterbass buttons join the remaining selected buttons for the following beats. For chord-only realizations, the existing fallback fundamental root bass supplies beat 1 without altering the chosen realization. For bass-only realizations with no remaining buttons, the other beats are **rests**, not repetitions of the bass or invented preset-chord tones.

For mixed realizations such as **E counterbass + G major** for Em7, E counterbass is the first-beat event and G major sounds subsequently. All rhythm pulses share a single pure planner (`src/audio/progressionPulsePlan.ts`) used for scheduled audio, active-button highlighting, and generated ABC notation. Changing the rhythm or tempo cancels the previous schedule; silent pulses clear sounding highlights.

The tool includes its own tempo control. Unlike the former behavior, a bass-only realization is not repeated as a bass cluster on every beat; choose a realization containing other buttons to hear chord pulses. This is intentional and does not alter the Chord Finder result.

### Staff notation

When a playable plan is available, the top toolbar offers **Show notation**, following the same workflow as the Bass Pattern Player. The notation reflects the selected rhythmic pattern and selected button realizations and can be downloaded as SVG. Its ABC export no longer forces the redundant heading “Optimized Stradella progression”; chord labels and staff content are preserved.

## Relationship to Harmony Explorer


Pitch-class voice-leading and physical button choice are intentionally separate: E fundamental and E counterbass are harmonically identical, while the ergonomic optimizer decides which physical E is preferable.

Harmony Explorer answers **which chords are harmonically related and why**. The Progression Assistant answers **how a sequence of those chords can be realized efficiently on the Stradella manual**.

Keeping them separate makes both tools simpler while preserving a direct handoff between them.
