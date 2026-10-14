# Stradella Progression Assistant

The **Progression Assistant** is a separate Stradella-side tool for choosing a coherent sequence of chord realizations across a progression. It is not part of the Harmony Explorer panel, although Harmony Explorer can send selected relationships into it.

## Opening the tool

Choose **Stradella** in the top bar, then open **Tools → Progression Assistant**.

The tool is shown only for the Stradella side because its optimization uses the physical geometry of Stradella bass/counterbass and chord buttons.

## Building a progression

Add chords manually by choosing a root and chord family, or select a relationship in Harmony Explorer and choose **Add relationship to Progression**.

The list can be reordered or edited by removing individual chords. **Clear progression** removes the complete sequence.

## Optimization

For each chord, Accordion Tools generates ranked **Bass + chord buttons** realizations. It then uses dynamic programming to optimize the complete path rather than choosing every chord independently.

The score combines:

- pitch-class voice-leading motion, measured in semitones;
- physical movement between Stradella button combinations, normalized in approximate button spacings;
- a small compactness preference within each realization;
- a strong preference for exact realizations.

The **Hand-movement emphasis** slider changes the balance between harmonic motion and physical hand movement.

**Allow conservative fifth-omission approximations** is enabled by default. These approximations contain no foreign tones and may omit only a non-defining perfect fifth. Exact realizations remain preferred whenever the ergonomic advantage of an approximation is not sufficient to overcome the approximation penalty.

## Stradella preview

Click an optimized step to preview its selected buttons directly on the current Stradella diagram. This keeps the progression workflow in one tool rather than opening Chord Finder for every step.

Use **Open preview in Chord Finder** when you want to inspect the selected realization alongside the other ranked alternatives for that chord.

## Results

The optimized plan reports:

- the selected physical realization for each chord;
- total harmonic voice motion;
- total physical hand movement;
- whether any approximate realizations were used;
- per-transition voice motion;
- per-transition physical movement;
- shared pitch classes.

**Play optimized progression** uses the current Accordion Tools sound settings, including La Melodiosa when selected. The buttons sounding on each pulse are highlighted directly on the Stradella diagram during playback.

### Rhythmic playback

The Progression Assistant provides four intentionally simple accompaniment patterns:

- **All buttons together** — plays the complete selected realization as a block.
- **Basic oom-pah (2/4)** — the chord root bass on beat 1, followed by the chord-row button(s) on beat 2: for example, **C → CM**.
- **Waltz (3/4)** — the chord root bass on beat 1, followed by the chord-row button(s) on beats 2 and 3: **C → CM → CM**.
- **March (4/4)** — the chord root bass on beat 1, followed by the chord-row button(s) on beats 2, 3, and 4: **C → CM → CM → CM**.

For mixed realizations such as **E counterbass + G major** for Em7, the accompaniment patterns preserve the bass/counterbass button selected by the optimizer: E counterbass is the bass event and G major is the chord event. For chord-only realizations, the player falls back to the ordinary fundamental root bass for the bass beat.

The tool includes its own tempo control. If a realization contains no chord-row button, the complete realization is used for the chord pulse so playback does not silently drop the harmony.

### Staff notation

When an optimized plan is available, the top toolbar offers **Show notation**, following the same workflow as the Bass Pattern Player. The notation reflects the selected rhythmic pattern and optimized button realizations and can be downloaded as SVG.

## Relationship to Harmony Explorer


Pitch-class voice-leading and physical button choice are intentionally separate: E fundamental and E counterbass are harmonically identical, while the ergonomic optimizer decides which physical E is preferable.

Harmony Explorer answers **which chords are harmonically related and why**. The Progression Assistant answers **how a sequence of those chords can be realized efficiently on the Stradella manual**.

Keeping them separate makes both tools simpler while preserving a direct handoff between them.
