# Instrument profiles — architecture proposal

**Status: design proposal, not implemented in v0.15.24.** The application groups instrument-related UI controls under Settings → Instrument, but still stores treble and Stradella layout choices and nominal bass/chord registers using their existing independent state/settings keys. Chord-button pitch-class formulas remain fixed in the music engine. This document defines a safe migration target, not a new supported import format.

## Goals

A named, exportable profile describes one configured accordion, independently of UI preferences, harmonic targets, selected chords, and temporary player state. It combines:

- Treble keyboard type and geometry (C/B system or piano, rows and configured range).
- Stradella layout and number of bass buttons.
- Played pitch classes for each preset chord-button family, including three- and four-note seventh and diminished variants where applicable.
- For bass/counterbass and chord rows, one or more configured reed ranks per played pitch class. Each rank can specify starting octave, octave grouping or split point, and rank-dependent octave offsets; selected register combinations enable subsets of these ranks.
- Provenance of the configuration: generic default, manufacturer specification, user observation, or directly measured. A saved name does not imply acoustic measurement.

## Separation of concerns

1. **Harmony:** The requested chord and its spellings are independent of the selected instrument.
2. **Physical buttons:** The diagram and button roles come from the profile's layout.
3. **Pitch classes of buttons:** The profile's preset-chord formulas affect chord search, exact/approximate coverage, chord labels, and available realizations. Their effect must be applied consistently to every chord-search and progression consumer.
4. **Configured sounded notes:** Rank mappings expand a played physical button into zero or more modeled MIDI pitches. Bass/counterbass and preset chords remain distinct. Physical rank choices affect registral density and modeled inversion, but must not silently change harmonic validity.
5. **Audio:** Synthesis may follow the configured pitch map when explicitly requested. La Melodiosa samples remain recordings of a *different* instrument with their own mapping and transposition constraints; a selected profile is not acoustic verification.
6. **Presentation and export:** A concise profile-and-register summary with help explains what configuration generated the nominal result. Detailed explanations discuss the actual realization without repeated generic caveats.

## Example schema (conceptual, not yet accepted)

```ts
interface InstrumentProfile {
  schemaVersion: 1;
  id: string;
  name: string;
  provenance: "generic" | "manufacturer" | "observed" | "measured";
  treble: { system: "c-system" | "b-system" | "piano"; rows?: number; range?: string };
  stradella: {
    bassCount: number;
    chordButtonIntervals: {
      major: number[]; minor: number[];
      dominant7: number[]; diminished7: number[];
    };
    ranks: {
      bass: ReedRank[];
      counterbass: ReedRank[];
      chord: ReedRank[];
    };
    registerSelections: Record<string, { activeRankIds: string[] }>;
  };
}
interface ReedRank {
  id: string;
  baseOctave: number;
  splitAt?: string;  // defined musical reference pitch class, not a UI index
  octaveOffsetBelowSplit?: number;
  octaveOffsetAboveSplit?: number;
}
```

This sketch is intentionally incomplete: real instrument reed ranks, chord variations, and register mechanics require explicit constraints and examples before the serialization format is finalized. In particular, instrument-dependent duplicated reeds may generate simultaneous notes at multiple octaves. A fixed one-pitch-per-tone fallback must remain available for older settings files.

## Migration plan

1. Add a validated, versioned profile schema and a factory profile reproducing the **current behavior exactly**. Do not change defaults or candidate scores.
2. Move physical layout settings into a named profile without changing their controls or established exported settings keys. Add profile import/export and migration tests.
3. Parameterize chord-button pitch-class formulas *through all consumers*: diagram labels, candidate generation/coverage, exact/approximate classification, progression optimization, references, and chord-button audio.
4. Add multiple reed ranks to the registral model and distinguish pitch-class duplicates from actual sounding-note doublings. The minimum-note-gap filter and ranking must explicitly document which representation they use.
5. Integrate register selections and optional profile-following synthesis. Preserve separate La Melodiosa original mapping and attribution.
6. Replace repeated explanatory boilerplate with one visible profile/status description and a contextual help entry. Update the in-app help, user guides, developer guide, tests, and export semantics.

## Acceptance tests

- Default profile produces byte-for-byte-equivalent chord recipes and nominal registers to the current default where possible.
- 96/120-bass labeling and non-C instrument roots have no accidental spelling borrowed from physical button labels.
- Dominant seventh and diminished buttons with three vs four configured pitch classes alter coverage and playable candidate pools as specified.
- Reed banks with two through five ranks, register switches and an F–E split generate the intended modeled MIDI pitches. A unison doubling counts as multiple reed contributions, **not** a semitone clash.
- Saved profiles survive app restart, JSON round-trips, old settings import, language changes and Reset.
- Changing profiles never changes the theoretical target chord, import notation, or chord filename conventions without explicit user action.
- Source tests, live diagram rendering, exported SVG/PNG, and audio comparisons are reviewed independently.

## Separate tempo issue

The Bass Pattern Player currently schedules events using the denominator-defined pattern unit (in 6/8, one eighth note) but ABC/MIDI exports use quarter-note tempo marks. Relabeling the control `BPM` alone does not establish consistent playback/export timing. Define the user-facing beat unit for simple and compound meters, then update scheduling and all exports together, with regressions for 4/4 and 6/8.
