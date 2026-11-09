# Bass Pattern Player — rhythmic accuracy audit

**Working baseline:** Accordion Tools v0.19.0 plus Rhythm Trainer Phases 1–5 and shared notation Phase 6.
**Review date:** 8 November 2026.
**Scope:** all 29 built-in definitions in `public/bass-patterns/bass-patterns.json`, not user-created patterns or acoustic authenticity. The JSON specifies attacks, durations, accents and Stradella button actions; it does not by itself encode an entire genre's idiomatic bass, percussion, guitar articulation, tempo or stylistic variations.

## Findings and decisions

Three patterns contained objectively inconsistent or incomplete timing and have been corrected:

1. **Shuffle (12/8):** the old eight events spanned only six of the twelve eighth-note units. The corrected long–short sequence uses positions `0,2,3,5,6,8,9,11` with durations `2,1` repeated four times. Four dotted-quarter beats are now filled.
2. **Bo Diddley beat (4/4, 2 bars):** the old definition placed all attacks in its first bar. The corrected two-bar rhythmic skeleton uses 3–2 son clave onsets `0,1.5,3 | 5,6`. This is an adapted Stradella figure, not the original guitar/percussion texture.
3. **Standard African bell (12/8):** the old definition stated 4/4 despite describing a seven-stroke *twelve-pulse* timeline. It now uses 12/8 and attacks at `0,2,4,5,7,9,11` (seven strikes over 12 eighth-note pulses). The button assignment remains an explicit Stradella adaptation rather than an imitation of bell timbre.

A **text-only correction** clarifies that the `bolero` definition's three rapid bass attacks occur in the latter half of **beat 1**, not beat 2. It does not validate that figure as a universal bolero accompaniment.

### Review of each built-in pattern

**Assessment key:** *Reference-compatible* means the measured attacks fit a well-established metric cell; *teaching variant* means the rhythm is a plausible simplified accordion exercise but not a definitive genre pattern; *requires musical review* means further stylistic verification is advisable before presenting it as canonical. This is a rhythmic audit, not an endorsement of exact timbres or voicings.

| ID | Meter/cycle | Assessment | Notes |
|---|---|---|---|
| `progression-essence` | 4/4 ×1 | Teaching abstraction | Single root+chord hit only; deliberately does not fill the measure. |
| `oom-pah-pah` | 3/4 ×1 | Reference-compatible | Root on 1; chord on 2 and 3. |
| `mazurca` | 3/4 ×1 | Reference-compatible accent, teaching variant | Accent on second beat is stylistically supported, although actual mazurkas have richer variation. |
| `waltz-alternate-bass` | 3/4 ×1 | Teaching variant | Root–chord–fifth bass; different from conventional bass–chord–chord waltz. |
| `march-2-4` | 2/4 ×1 | Teaching variant | Four eighth-note root/chord/fifth/chord actions, bass accents on main beats. |
| `polka` | 2/4 ×1 | Reference-compatible | Simple bass on 1 and chord on 2. |
| `alternate-bass-polka` | 4/4 ×1 | Teaching variant | Four-quarter bass/chord/fifth/chord phrase, equivalent to two 2/4 pulses but written in 4/4. |
| `march-4-4` | 4/4 ×1 | Teaching variant | Four quarter attacks, accented bass on 1 and 3. |
| `tarantella` | 6/8 ×1 | Requires musical review | Onsets at eighth slots 1, 3, 4 and 6; accent placement and omissions need review against a specific tarantella accompaniment style. |
| `bo-diddley` | 4/4 ×2 | **Corrected** | Standard 3–2 five-stroke timing; simplified Stradella instrumentation. |
| `son-clave-3-2` | 4/4 ×2 | Reference-compatible | Three-side 1, 2&, 4; two-side 2, 3. |
| `son-clave-2-3` | 4/4 ×2 | Reference-compatible | The two-side precedes the three-side. |
| `rumba-clave-3-2` | 4/4 ×2 | Reference-compatible | Three-side final attack delayed to 4&. |
| `rumba-clave-2-3` | 4/4 ×2 | Reference-compatible | Two-side precedes the displaced three-side. |
| `tango-habanera` | 2/4 ×1 | Reference-compatible attacks; articulation review | Onsets at 1, 1a, 2, 2& match the habanera figure. A 0.35-unit chord gate beginning at 0.75 overlaps the following bass at 1.0 by 0.10 units; preserve for now pending intentional-articulation review. |
| `nuevo-tango` | 4/4 ×1 | Reference-compatible attacks; notation review | 3+3+2 eighth grouping yields attacks at 0, 1.5 and 3; short `1/3`-unit sounding gates create unusual tuplets/rests in notation. |
| `traditional-tango` | 4/4 ×1 | Requires musical review | Syncopated Stradella variant, but should not be described as a universal traditional tango bass. |
| `bolero` | 4/4 ×1 | Requires musical review | Descriptive timing error corrected; the chord-heavy figure is one illustrative version, not a verified archetype of all bolero styles. |
| `bass-chord-together` | 4/4 ×1 | Teaching abstraction | Two simultaneous bass+chord hits on beats 1 and 3; deliberately sparse. |
| `rumba-accordion` | 4/4 ×1 | Teaching variant | Bass on 1, chords on 2 and 3, combined hit on 4; not equivalent to son or rumba clave, nor to a full Cuban bass pattern. |
| `ska-skank` | 4/4 ×1 | Reference-compatible | Chord hits on all four eighth-note offbeats. |
| `shuffle` | 12/8 ×1 | **Corrected** | Four 2+1 long-short pairs fill four compound beats. |
| `swing-three-to-one` | 4/4 ×1 | Reference-compatible as an exaggerated swing ratio | Four 3:1 pairs; unlike the typical triplet-based 2:1 shuffle. |
| `scotch-snap` | 4/4 ×1 | Reference-compatible | Repeated short–long 1:3 attacks. |
| `bossa-nova` | 4/4 ×2 | Requires musical review | Two-bar syncopation with ties across a bar; should be compared with a specific two-bar *violão* accompaniment. Not a generic bossa nova definition. |
| `standard-african-bell` | 12/8 ×1 | **Corrected** | Seven-stroke, twelve-pulse timeline adapted to Stradella. |
| `charleston` | 4/4 ×1 | Teaching variant | Core accents at 1 and 2& with an extra attack on beat 3. |
| `barbara-ann` | 8/8 ×1 | Teaching/genre-inspired exercise | Specific stylized pop figure, not a universal rhythmic archetype. |
| `gallop` | 4/4 ×1 | Reference-compatible | Repeated long–short–short eighth/sixteenth/sixteenth figure. |

## Technical verification

Run `npm run test:patterns` to check uniqueness, positive durations, meter boundaries, completeness of declared multi-bar cycles, and selected externally documented attack grids. This test is included in `npm run test:all`. It does **not** judge stylistic authenticity, acoustic articulation, song feel, or actual listening quality.

The other 26 attack grids were deliberately **not rewritten** solely on musical intuition. `tango-habanera`, `nuevo-tango`, `tarantella`, `traditional-tango`, `bolero` and `bossa-nova` merit a subsequent music-led review, ideally with a named reference arrangement and A/B listening tests. A short note gate may be intentional, and rhythm subdivision is not always the same as note duration.

## Reference material used for this audit

- Berklee PULSE, *The Clave*: https://pulse.berklee.edu/?id=4&lesson=14
- University of Puget Sound, *The 3–2 Son Clave* (including the Bo Diddley connection): https://musictheory.pugetsound.edu/mt21c/ThreeTwoClave.html
- Rhythm Dictionary, *12/8 bell*: https://www.rhythmdictionary.com/c/bell-12-8
- Tunable, *12/8 meter and shuffle interpretation*: https://tunableapp.com/time-signature/12-8/
- Polish Music Center, *Mazur/Mazurka*: https://polishmusic.usc.edu/research/dances/mazur/
- Rhythm Dictionary, *Milonga/Habanera*: https://www.rhythmdictionary.com/p/milonga
- Yamaha, *Exploring Latin Rhythms* (examples of stylistic variation): https://hub.yamaha.com/keyboards/k-how-to/exploring-latin-rhythms/
