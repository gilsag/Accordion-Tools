# Accordion Tools v0.16.0 — Modular architecture

Version 0.16.0 focuses on **maintainability and loading performance**, preserving the musical workflows and file formats established in v0.15.28.

## Highlights

- **Modularized application:** dedicated feature state, typed tool registry, Settings/Tools/Workspace views, and independent SVG, notation, audio, settings, and export services.
- **Faster initial loading architecture:** deferred Stradella/Treble Chord Finder, Harmony Explorer, Progression Assistant, Harmonic Circle, ABC parser, and `abcjs` notation chunks. The production bundle audit confirmed that these heavy entrypoints are not eagerly imported.
- **Compatibility retained:** original Stradella realization/ranking and playback-button identities, six interface languages, nominal registers and La Melodiosa audio mapping, SVG/PNG/ZIP/ABC/MIDI/LilyPond exports, and **118 settings export keys**.
- **Expanded regression coverage:** command sequencing, reset boundaries, batch-capture restoration, diagram geometry, settings compatibility, localization, and production build-manifest audits.
- **Refreshed README:** musical use cases and five annotated screenshots presented before technical documentation.

## Validation

On Windows, the user reported a successful `npm run verify:release` run: lint, `test:all`, release metadata checks, TypeScript compilation, Vite production build, and chunk-manifest audit passed. A broad browser check found the interface working, apart from the known limitation below. The detailed device/browser checklist is retained in `docs/internal/release-v0.16.0-validation.md` and is not independently signed off in full.

## Known limitation and planned improvement

In the **Progression Assistant**, optimized realizations for a Major chord may contain bass/counterbass buttons only. In a waltz, accompaniment may therefore not alternate **root bass – preset Major chord – preset Major chord**. This behavior predates the architectural migration. The proposed immediate rhythm correction is intentionally **not included** in v0.16.0. A future enhancement will allow selecting a particular **Stradella Chord Finder realization for each progression chord**, with consistent playback, visual highlights, and notation.

## Notes

- Existing settings JSON files remain compatible. No settings migration is required.
- After publishing, verify the GitHub Pages deployment at https://gilsag.github.io/Accordion-Tools/.
- See [VERSION_HISTORY.md](VERSION_HISTORY.md) for phase-by-phase technical details.
