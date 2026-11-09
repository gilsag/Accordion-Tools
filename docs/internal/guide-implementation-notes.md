# Implementation notes for the user guides

The guides in `docs/*.md` are shown in the app's documentation viewer and are written for players. This file keeps the implementation detail that used to live in them: engine rules, ranking weights, data flow and module names. Keep it in step with the code; keep the user guides free of it.

## Chord Finder

### Ranking and recommendations

**Ranking:** Every chord uses one weighted score (`preferenceScore` in `searchBassAndChordButtons.ts`): three per button, reach in columns × 2.58, omission costs from `omissionPenalty()` × 0.9 plus 1.25 per omitted tone (0.45 for extended chords), the voicing-density cost, and −1 when one bass button plays the requested bass under chord buttons. Completeness has no separate priority after v0.18.0. Leaving out only the plain fifth costs `FIFTH_OMISSION_COST` (0.25) instead, because the seventh and diminished buttons lack it by construction. For five or more distinct tones, stronger nominal low-register semitone and cluster penalties apply, so conventional omissions may be preferable to denser complete realizations.

**Bass on a bass button:** with `requestedBassOnBassButton`, a requested bass must also be the pitch of a played bass or counterbass button, not only the lowest modelled note. The search order on the Chord Finder and in the Progression Assistant is: requested bass on a bass button, then requested bass as the lowest note, then (for the root-position default only) any bass. This is a ranking preference, not a validity filter, and it reflects configured nominal pitches rather than measured reeds.

The combined mode offers up to 1, 2, 3, or 4 buttons and Compact, Moderate, or Extended hand-span settings. Results pass a geometric reach filter and remove harmonically unnecessary buttons, except that the combined mode may additionally allow one root bass/counterbass button reinforcing the root already present in preset chords. Physically equivalent bass/counterbass positions are consolidated to one ergonomic representative. These are approximate hand-span thresholds, not certified fingering recommendations. There is no arbitrary five-realization cap.

For extended chords, up to **three Recommended examples** appear first in the realization comparison table. The shortlist aims to illustrate contrasting useful approaches: a **compact, pitch-class-complete** realization, a **minimally reduced** voicing with few omissions, and (where meaningful) a **functional shell** such as 1–3–7–13. When some approaches are unavailable, other closely ranked physical arrangements may fill the available places, including multiple exact recipes with identical pitch-class content. All valid alternatives remain selectable, even if not marked Recommended.

The score now balances **number of buttons**, **geometric hand span/compactness**, **musical omission cost**, **number of omitted tones**, and **third/eleventh tension** in major and dominant 11th/13th chords. Compactness is measured in **adjacent Stradella column spacings**, not screen pixels, so changing the displayed button size or diagram spacing does not change recommendation priorities. The ergonomic distance uses a **small 1.10 weight on movement along the instrument’s vertical (circle-of-fifths) direction**, which is the diagram’s horizontal axis; movement between functional rows has weight 1.00. This is a modest geometric heuristic, not a fingering model. Physically equivalent bass-only clusters use deterministic tie-breaking, favoring proximity to the requested root's reference button before stable button IDs. A conventional 13th shell receives only a small preference rather than a dominant fixed bonus. Within comparable major/dominant 13th realizations, omitting a natural eleventh is penalized less than omitting a ninth, because the eleventh can conflict with the major third. The inverse preference is not imposed on minor 13ths. Notes need not be in stacked-thirds or scale order: vertical ordering alone has no ranking penalty. Different slash-bass requests are not directly comparable. The scorer also applies a **one-point preference for a single played root bass supporting preset chord buttons**, using the structural registral metadata. This is deliberately smaller than the three-point cost of another button and less than the cost of an extra normalized column of reach. It is a tie-breaking preference, not a requirement for root position: **slash-bass and chord-button-only alternatives receive no penalty and remain available**. Multiple-bass combinations are not interpreted as having one definitive low root. Recommendation does **not** certify fingering comfort: the geometric reach estimate does not account for every player's hand technique or instrument variation. Exact/Approximate remains independent of Recommended.

### Results inspector

The inspector **frame and responsive workspace slot are shared application infrastructure**, although the Stradella table and its filter logic remain tool-specific. No other tool currently supplies inspector content; its existing layout stays intact. Adding a future tool should use the same frame and slot without duplicating that tool’s selection state. The application settings JSON is unchanged.

### Requested bass

Root, chord quality, pitch-class coverage, modeled register, and physical button selection remain separate. For example, `Emin7/G` and `Gmaj6` both contain E–G–B–D, but they have different requested harmonic identities. This iteration supports only slash basses that are tones of the requested chord, not arbitrary outside pedal tones. When needed, one non-root bass button may reinforce a tone already present in preset chord buttons, subject to existing geometry and button limits. With no slash-bass selection, candidate validity is unchanged, although five-plus-tone recommendation ordering reflects the new density policy. Exported notes and contextual titles identify the realized slash bass when the configured register model places a non-root chord tone lowest. The requested root and chord quality remain unchanged; filenames use safe text such as `-over-Bflat` or `-over-G`.

### Structural registral metadata

Each Stradella Chord Finder result now has internal `registral` metadata derived **only from the sounded (`playbackButtons`) buttons**. This distinguishes root support by a bass/counterbass button, another chord tone used as a bass, multiple distinct bass pitches, and realizations using preset chord buttons alone. An optional visually highlighted root button in **Chord buttons only** is not played and does **not** imply bass support.

Where one non-root bass button accompanies preset chords, the metadata records a **potential slash-chord interpretation** (for example, `Cmaj7/B` for B counterbass + C major). This is a structural indication, **not** a verified inversion or an assertion that B is the lowest acoustic reed for every instrument. With multiple different bass notes or chord buttons alone, the lowest-register interpretation is indeterminate. Root pitch-class presence and root reinforcement in a separate bass register are tracked independently.

The analysis contains no fixed MIDI octaves and does not use the current sound engine. In mixed mode, the search retains selected registrally distinct **root-reinforced** alternatives. For example, `C bass + C major` is now considered different from `C major` alone: both are exact in pitch-class terms, but only the former explicitly reinforces C in a separate bass role. This is allowed only when an otherwise valid chord-button-only realization can be augmented by **one** practical root bass/counterbass button within the existing maximum-button and hand-span limits. Other pitch-class-redundant combinations remain excluded; in particular, there is no extra non-root bass doubling or unlimited bass-note stacking.

The candidate-generation improvement does **not** alter Exact/Approximate rules or audio. The recommendation model uses this structural metadata as a modest preference in recommendation scores and same-priority physical ranking. A recommended root-supported result identifies its separate bass reinforcement in the *Why Recommended* explanation, without asserting fixed octave assignments. The explanation layer uses the stored metadata for explanations and diagram notes. Root-supported recipes identify independent bass reinforcement; non-root single-bass recipes identify a **conditional** slash-chord interpretation (e.g. `Cmaj7/B`, `Cmaj13/B`); chord-button-only and multiple-bass recipes are explicitly distinguished. No acoustic lowest-note assertion is made without instrument/register evidence. Search, scoring, omission rules, and audio remain unchanged.

### Voicing density

In **Bass + chord buttons** recommendations, chords of up to four distinct tones retain the restrained density adjustment (capped at 1.1 points). Chords with five or more tones use a stronger register-aware density cost, so a congested low-register interval can outweigh another button. It does not remove valid realizations, override a requested slash-bass constraint, or claim verified physical-acoustic reed voicing. Larger octave/rank combinations on real instruments may sound different from the simplified model.

### Nominal spacing chart and minimum gap

The optional nominal-spacing diagram places distinct nominal MIDI pitches on a **strictly proportional horizontal semitone scale** (23 diagram units per semitone). Note names are staggered onto independent label rows and linked to their true pitch positions by leader lines; label collisions must not change pitch distances. These are configured Stradella register pitches, not measurements of acoustic reeds.

The **Minimum nominal note gap** selector has three settings: **Allow all gaps** (default), **Exclude 1-semitone gaps**, and **Exclude 1- and 2-semitone gaps**. The test compares adjacent *distinct* nominal pitches after sorting them by MIDI note number and ignoring unison duplicates. It applies to all Stradella Chord Finder search modes before recommendations are assigned. This is a registral preference, not a judgement of harmonic chord correctness; a filtered chord may still be musically valid. Close one-semitone pairs also incur a stronger *ranking* penalty when the filter is off.

### Filenames

SVG and PNG filenames use ASCII letters, numbers, and ordinary hyphens. Musical accidentals are converted to safe text. In Contextual mode, Stradella downloads use a separate stable recipe key (requested chord, explicit slash bass, Exact/Approximate, and selected played buttons), rather than the modeled-lowest title suffix, to distinguish physical realizations, such as `Cmin7-over-Bflat-Exact-2buttons-Bflat-bass-C-minor.svg` or `Caug-Exact-3buttons-Bass-only-C-bass-E-counterbass-Gsharp-counterbass.svg` (actual names depend on the selected buttons). Filenames do not use typographical dashes, spaces, or other punctuation.

## Progression Assistant

### Chord-type catalog and Harmony compatibility
Progression Assistant and both Chord Finder panels use the same **35-option** `CHORD_FINDER_OPTIONS` list in `src/music/chordDefinitions.ts`; its selection is consistently labeled **Chord type** in all six interface languages. This includes add9, altered sevenths, 9ths, 11ths and 13ths. Requests store the exact `FinderChordPattern` identity and use the existing Stradella search/ranking engine. Some chords have no realizations on a particular physical bass layout; the result is reported as unavailable rather than substituted with a simpler chord. In the current UI, the automatic optimizer still examines up to five available ranked candidates, while arrows expose all playable candidates.

Harmony Explorer retains its existing 16-family graph. Chords transferred from Harmony retain their original `ChordFamilyId` and are converted via the explicit Harmony-to-Finder adapter when searching. The unsupported augmented-major-seventh family is not silently mapped. Harmony Explorer's ring mathematics and chord-family display remain unchanged.

### Optimizer
For each chord, Accordion Tools generates ranked **Bass + chord buttons** realizations using the same Stradella Chord Finder engine. **Auto** uses global dynamic programming over the original first-five candidate shortlist. Individual Finder rankings are unchanged; the transition objective has been revised as described below.

#### Choosing a realization for an individual chord

Each chord row has **← / →** controls. They cycle from **Auto** through every playable Chord Finder realization and display its **original rank**, including choices below the optimizer's first five. In Auto, the optimizer chooses the chord's sounding recipe; choosing a rank **pins that chord** to the selected `playbackButtons` recipe and recomputes the globally optimized choices for the other steps. The original ranks do not change.

Manual choices belong to stable progression-step IDs, not list positions; rearranging chords keeps the right choice with each chord. If the selected recipe disappears because the physical layout changes, that step returns to Auto. Removing a step clears its choice. These choices are temporary session state and are not part of the settings file.

Changing a realization stops any scheduled playback. The eye-selected diagram notes, preview highlights, rhythmic playback and generated notation all read the same resulting progression plan. The previous **Open preview in Chord Finder** button has been removed; the arrow controls and shared Results Inspector already expose the available recipes.

**Example:** If automatic optimization chooses bass/counterbass notes to form C major, browse to a candidate using the **C major chord button**. Auto now begins with the original Finder rank and trades rank against user-weighted transitions; a bass-only realization still produces bass-only pulses under existing waltz rules unless explicitly replaced. The rhythmic layer now separates the lowest selected bass/counterbass from the remaining selected buttons. Independent per-chord bass-pulse override and rhythm editing remain future work.

The automatic objective is now

`J = Σ (original Finder rank − 1) + 1.5 × physicalSlider × Σ(physical movement in button spacings) + 0.75 × voiceSlider × Σ(harmonic pitch-class motion in semitones)`.

Both independent sliders range from 0 to 100%, represented as 0–1 coefficients. The numerical scales (2 button spacings and 4 semitones for a 3-rank tradeoff at 100%) are starting heuristics, **not biomechanical or acoustic measurements**. The original Stradella Chord Finder ranking handles physical button economy, musical completeness, and ergonomic preferences; no secondary fixed exactness penalty or compactness penalty is applied. Conservative omissions approved by the Chord Finder are always eligible. The former approximation checkbox has been removed: it duplicated the Finder’s eligibility policy rather than defining a separate progression preference. The legacy `progressionAllowApproximations` JSON field is dropped by the version 2 settings migration. The 5-candidate automatic shortlist remains in place; explicit arrows can pin any available ranked recipe.

At **0% physical / 0% harmonic**, Auto chooses the first eligible Finder realization independently at each unpinned step. The sliders can independently favor physical continuity or minimum pitch-class motion; user-pinned steps always win. The existing `progressionHandMovementWeight` settings key retains its original value for import/export compatibility but is now interpreted as a physical coefficient, not as a complementary cross-fade. The harmonic weight defaults to 35% and is session-only. Persisting it would need a settings migration step (see `settings-file-reference.md`).

### Preset progressions
The preset selector reads the **same 30-entry JSON catalog already loaded by the Bass Pattern Player (29 original entries plus Cueca I–V–V–I)**; there is no second catalog fetch or copy. Switch to **Use preset**, select a progression and key, then **Load preset** to replace the editable list (with fresh stable IDs and cleared realization pins). Roman numerals are resolved using the existing Bass Pattern Player helper. Supported Roman-numeral templates resolve directly to shared Finder chord-type IDs. Secondary chords (`V7/IV`, `V/bVI`) resolve in two steps through `resolveRomanChord()`: the target in the key, then the chord as a major-scale degree on that target. Catalog entries with `"mode": "minor"` count III, VI and VII from the natural minor scale. Any symbol whose chord type cannot be read exactly is still **marked unsupported** and blocks loading; nothing is silently reduced. Catalog names remain as defined in the shared JSON.

### Diagram notes

The explanatory lines come directly from `realizationAnnotation()` using the step's `result.playbackButtons`, current nominal Stradella register model, chord-display style, interface language, and the **existing four note-level preferences**. Optional interval charts reuse the same diagram footer and SVG/PNG rendering pipeline as Chord Finder. This is an explanatory preview, not a change to the selected realization, audio pitches, or rank. An eye is suppressed during sounding pulses so a static chord explanation is not mistaken for the currently sounding subset; playback highlighting takes priority.

### Rhythm planner

For mixed realizations such as **E counterbass + G major** for Em7, E counterbass is the first-beat event and G major sounds subsequently. All rhythm pulses share a single pure planner (`src/audio/progressionPulsePlan.ts`) used for scheduled audio, active-button highlighting, and generated ABC notation. Changing the rhythm or tempo cancels the previous schedule; silent pulses clear sounding highlights.

## Harmony Explorer

Harmony Explorer lives in `src/tools/harmonyExplorer/`. Its harmonic engine returns pitch-class relationships only; the Accordion Tools integration layer handles audio, translation to the Stradella Chord Finder and progression optimization. This keeps harmonic relationships independent of physical keyboard coordinates.

## ABC Player

The ABC Player uses `abcjs` to parse and sequence the tune, then applies Accordion Tools' own treble, piano and Stradella button mapping. The example list is generated at build time from `public/abc/*.abc` (see [`settings-file-reference.md`](settings-file-reference.md#abc-example-manifest)); identical duplicate files are listed once, and built-in titles have localized overrides where available.

## Bass Pattern Player

Progressions live in `public/chord-progressions/chord-progressions.json` and patterns in `public/bass-patterns/bass-patterns.json`. The pattern syntax is in [`bass-pattern-format.md`](bass-pattern-format.md). Rendered notation uses `abcjs`.
