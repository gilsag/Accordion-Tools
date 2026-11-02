# v0.16.0 release validation — sign-off worksheet

**Release decision (2026-11-02):** the user reported that `npm run verify:release` passed on Windows and that the application interface generally worked. A specific Progression Assistant waltz-accompaniment limitation was observed and explicitly deferred for a future per-chord realization selector. This report constitutes approval to prepare v0.16.0; **the individual browser/device checks below were not all independently signed off**, and production GitHub Pages deployment must be verified after publishing.

## 1. Reproducible source/build checks

From a clean checkout of the fully patched modularization branch (including the Phase 8 PNG and Phase 7 localization regression fixes), use the project's supported Node.js version and run:

```bash
npm ci
npm run verify:release
```

`verify:release` runs ESLint, the complete `test:all` suite, static release preflight checks, and `tsc -b && vite build --manifest` followed by inspection of the emitted dynamic chunks. All commands must exit with code zero. Save the output in your release record; record the Node/npm version and commit hash. The manifest audit lists **uncompressed** sizes; it is not a network transfer or startup performance estimate.

**Release evidence:** commit: ______; Node/npm: not recorded; `test:all`: passed (user log); lint: passed (user log); build/audit: passed (user log, 298 modules transformed, dynamic chunks confirmed); browser/device: broadly functional per user, not item-by-item; reviewer/date: user, 2026-11-02.

## 2. Compatibility and browser acceptance matrix

Use a fresh profile for first-use testing, then repeat with saved settings. Inspect browser console and Network panel for failed JS/WAV/ABC requests. Test both development mode and `dist/` as served under the GitHub Pages base `/Accordion-Tools/` (not just `/`). Mark each group passed only after observing the behavior.

| Group | Representative checks | Status |
| --- | --- | --- |
| Instrument and treble | C-system and B-system button diagrams, row/size changes, piano key range, side switching; compare physical IDs and selected buttons with v0.15.28 | [ ] |
| Stradella model | Several bass counts (8, 48 variants, 96, 120), bass/counterbass vs preset-chord octave/grouping C–B and F–E, nominal-note explanations | [ ] |
| Chord/scale tools | Treble and Stradella Finders; inversions, slash basses, realizations, note-level toggles; same ranking and `playbackButtons` | [ ] |
| Harmony/progressions | Harmony circle, ring filters, chord previews, Harmony → Finder → Progression transfers, physical button identity and progression optimization | [ ] |
| ABC Player | First open, example catalog, two-voice mapping, ties, repeats, tempo, play/pause/resume/stop, switch tools while playing | [ ] |
| Bass Pattern/sequence | Custom-pattern persistence, pattern editor, sequence recording, loops and stop/reset, notation and MIDI/LilyPond exports | [ ] |
| Annotation/diagram | Inline notes, dragging, fingering, overlay reset, responsive diagram scroll/fit, chart and explanatory-footer placement | [ ] |
| Audio | Synth and La Melodiosa, both sample registers and follow-nominal-register option, sound on/off, first user-gesture unlock, switching players while sounding | [ ] |
| Export formats | SVG, PNG (including HTML footer rasterization), Stradella realization ZIP order/filenames, annotation and title dimensions, ABC/notation SVG, MIDI, LilyPond | [ ] |
| Settings and persistence | Import older/partial JSON, default-settings.json, manual vs browser language preference, exact 118-key export round-trip; custom bass-pattern localStorage | [ ] |
| Six languages | EN, ES, FR, PT-BR, IT, DE: tool labels, settings, help titles, explanations, export filenames unchanged by locale | [ ] |
| Screen sizes | Desktop plus 860px/phone widths; focus mode, toolbar and reset menu, dark/light mode, no layout overlap | [ ] |

## 3. Lazy-loading acceptance

1. Clear browser cache and use a fresh session; open the app without selecting a tool. `abcjs` and heavy Finder/Harmony panels should not be requested until relevant functionality needs them.
2. Open each deferred panel: Treble Chord Finder, Stradella Chord Finder, Harmony Explorer, Progression Assistant, and Harmonic Circle. Verify the loading fallback is temporary, the panel renders, and tool state persists when switching views.
3. Show notation from a Bass Pattern or progression **before opening the ABC Player**. Confirm the `abcjs` chunk loads, the score renders with the original notation settings and SVG download works.
4. Enter/load ABC text. Confirm first asynchronous parser load yields the same notes, timing, errors and physical button IDs as the pre-refactor version. Change text rapidly before a load finishes; confirm stale results are not displayed.
5. Inspect Network transfer sizes, errors, cache hits, retry after a failed request if testable, and initial vs on-demand JS loading. Keep measured numbers and device/network conditions in the release record. A manifest audit alone is not a runtime certification.

## 4. Gate and release procedure

- The user has explicitly accepted the known Progression Assistant limitation for v0.16.0; the proposed waltz corrective patch is **not** part of this release. Preserve the 118-key settings schema and musical results.
- The release-only changes update `package.json`, `package-lock.json` root version, About metadata, README, history, and final release notes together. **Rerun `npm run verify:release` after applying them**.
- Commit and push the verified release to `main`, then create an **annotated** tag on that exact commit: `git tag -a v0.16.0 -m "Accordion Tools v0.16.0"` followed by `git push origin v0.16.0`. Do not create an earlier tag or overwrite an existing one.
- Verify the deployed GitHub Pages site separately; a successful local build does not establish that every asset is available under its production base path. Retain the unchecked browser matrix as additional regression coverage for future releases.

Earlier validation reports in this repository are historical evidence, not a pass for the current release.
