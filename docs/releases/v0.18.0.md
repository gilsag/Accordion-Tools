### Faster and lighter

- Stradella Chord Finder searches are about 120 times faster: button tones are cached and compared as bitmasks, and impractical combinations are discarded before the redundancy check. Results are identical. A search-time budget test guards it.
- Moving a Progression Assistant weight slider no longer searches every chord again: Chord Finder results are cached per bass layout, making each move about six times faster on a 12-chord progression.
- The first visit downloads about 180 KiB of compressed JavaScript and CSS instead of 317 KiB: only the English interface loads at startup, the documentation viewer loads on demand, and La Melodiosa samples load after the first click or key press, for the side in use only. The bundle audit now enforces size budgets.

### Playback

- The ABC Player, Bass Pattern Player, Progression Assistant rhythms, Sequence, arpeggios and the Harmony recording schedule notes on the Web Audio clock, so timing stays steady when the page is busy. Notes sound for their written length, and Play waits until the needed samples are loaded (the playback bar shows Loading sounds…).
- New **Settings → Sound → Note length in players** (30–100%, default 85%) sets how much of each written note sounds in the players.
- The playback bar now shows when the Progression Assistant and Sequence are playing, so Play cannot start them a second time on top of themselves.
- The Bass Pattern tempo counts conventional beats: the quarter note in 2/4, 3/4 and 4/4, the dotted quarter in 6/8 and 12/8, the eighth note in other x/8 meters. The label names the beat, and the tempo range now starts at 30. Patterns in simple meters play exactly as before; the 6/8 and 12/8 patterns now play at the same number of dotted-quarter beats per minute instead of eighths, so they are three times faster at the same setting. The ABC, LilyPond and MIDI exports state the same beat (MIDI files in x/8 meters now use eighth notes rather than quarter notes, at the same speed).

### Interface

- One playback bar under the diagram serves every player. The toolbar has a Download menu (SVG/PNG, remembering the last format) and icon buttons for Focus diagram, Results and Sound.
- The diagram can be used from the keyboard (Tab, arrow keys, Enter/Space) and is announced by screen readers.
- The phone Tools sheet stays open while you use a tool.
- The Progression Assistant can draw its path on the diagram (**Show path on diagram**, off by default). Each chord row again has single-click ↑, ↓ and × buttons.
- Opening another tool hides the Chord Finder's chord and Results panel; returning to the Chord Finder shows the same chord and realization again.
- The toolbar stays on one row: when the full toolbar does not fit (for example with the Results panel open at 1280 px, or in a longer language), Settings, Tools, Show notation, Reset and Download become icons with tooltips.
- The Chord Finder shows the chord as soon as it opens, and **Requested bass / inversion** starts on the root, falling back to any bass with a note when root position is impossible.
- Tool descriptions appear under each tool name, accidentals are drawn more clearly, and settings section headers report whether they are open to assistive technology.
- The empty-score ABC message is translated in all six languages.

### Settings files

- Saved settings carry `settingsVersion` (now 2) and are migrated on load; files from v0.17.0 and earlier still load. The retired `progressionAllowApproximations` key is dropped.

### Documentation and maintenance

- The in-app guides are rewritten for players (Settings, Chord Finder, Progression Assistant, ABC Player and others); implementation detail moved to `docs/internal/guide-implementation-notes.md` and `docs/internal/settings-file-reference.md`, and the bass pattern format guide moved to `docs/internal/`.
- The developer guide now states only current rules; its history moved here (see the v0.17.0 notes below).
- Tests that matched source-code text were retired. A Playwright browser suite (`npm run test:e2e`) covers the same behaviour in a real browser at desktop and phone sizes.
- Package renamed to `accordion-tools`; a duplicate Bella Ciao file and unused template images removed.

Known issues: the Vite chunk-size advisory remains (it concerns the lazily loaded ABC and notation chunks, not the startup download).
