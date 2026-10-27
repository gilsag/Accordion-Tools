# Responsive UI validation — v0.15.7 release candidate

**Baseline:** v0.15.6 uploaded source. **Scope:** interface-only changes in App.tsx, App.css, DocumentationViewer.css, and HelpTip.tsx.

## What was actually tested

- The live GitHub Pages site was unavailable from this container (DNS blocked).
- `npm ci` could not complete because required dependency tarballs were not cached and the registry was unreachable. Thus the running Vite app, native `tsc -b`, lint, and the full test suite were **not** verified.
- A controlled **Chromium  headless fixture** was built with the application's baseline/current CSS and representative DOM structure (toolbar, sidebar, 96-bass-size SVG viewBox, diagram wrapper, help targets and documentation dialog). This is a layout proxy, **not** actual Accordion Tools execution.
- Chromium layouts were compared at widths **360, 390, 430, 768, 1024, 1280, 1440 CSS px**. No page-wide horizontal overflow was observed in this fixture.

## Representative fixture measurements

| Viewport width | Before: estimated 96-bass button diameter | Updated Readable diameter | Viewer horizontal scrolling | Toolbar overflow |
|---|---:|---:|---|---|
| 360 px | 13.3 px | 42.1 px | yes, inside canvas only | no |
| 390 px | 14.5 px | 42.1 px | yes, inside canvas only | no |
| 430 px | 16.0 px | 42.1 px | yes, inside canvas only | no |
| 768 px | 29.0 px | 42.1 px | yes, inside canvas only | no |
| 1024 px | 29.2 px | 29.2 px (unchanged) | no new scrolling | fixed (23 px baseline overflow removed) |
| 1280 / 1440 px | unchanged | unchanged | unchanged | no |

On a 390 px fixture, selecting **Fit entire diagram** returned the SVG width to ~378 px. The documentation fixture switched to a one-column article with horizontally scrollable topic navigation. These values are layout-fixture measurements, not measured in the running application or on a real phone.

## Explicit preservation checks

- No code changes under `src/tools/`, `src/sound.ts`, `src/laMelodiosa.ts`, `src/download.ts`, or any sample assets.
- The React viewer's `viewBox` is unchanged; the new minimum width is applied **only through `.canvas-wrap > .diagram`** at small viewport sizes. Downloaded SVGs have no such parent.
- The default Readable/Fit preference is transient React state, deliberately **not serialized** with musical or diagram settings.
- Touch help uses a focusable span with button semantics, not a nested `<button>` inside `<label>`.

## Local release gates (still necessary)

1. `npm ci && npm run test:all && npm run test:responsive && npm run lint && npm run build`.
2. Chrome Android and real iPhone Safari: portrait/landscape, tool-panel scrolling, readable horizontal SVG panning, Fit mode, tappable notes, and tooltips. Check touch scrolling does not accidentally select a button.
3. Tablet at 768 px and small laptop around 1024 px: toolbar, sidebar, Harmony canvas and portrait/landscape rotation.
4. Verify sound with La Melodiosa, SVG/PNG download and import/export settings; compare exports against v0.15.6 for equal input/settings.
5. Check VoiceOver/TalkBack and keyboard order. The tools remain before the workspace in the DOM; this candidate deliberately avoids changing document/keyboard order.
