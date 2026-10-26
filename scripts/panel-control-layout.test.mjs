import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = (filename) => readFileSync(filename, 'utf8');
const app = source('src/App.tsx');
const css = source('src/App.css');
const treble = source('src/components/tools/TrebleChordFinderPanel.tsx');
const bass = source('src/components/tools/StradellaChordFinderPanel.tsx');
const en = source('src/i18n/en.ts');
assert.match(app, /className=\{`small-button appearance-label-toggle/);
assert.match(app, /aria-pressed=\{showStradellaRowLabels\}/);
assert.doesNotMatch(app, /label=\{t\("ui\.stradellaRowLabels"\)\}/);
assert.match(css, /\.appearance-label-toggle\s*\{[^}]*width:\s*100%/);
assert.match(css, /\.section-content label:has\(> input\[type="range"\]\)/);
assert.match(css, /\.label-line\s*\{[^}]*white-space:\s*normal/);
assert.match(app, /t\("ui\.soundSourceHint"\)/);
assert.match(app, /t\("ui\.stradellaRegisterIntro"\)/);
assert.match(app, /t\("ui\.melodiosaConfiguredShort"\)/);
assert.match(app, /t\("ui\.melodiosaOriginalShort"\)/);
assert.match(app, /t\("ui\.registerBassGroup"\)/);
assert.match(app, /t\("ui\.registerConfiguredRange"\)/);
assert.match(app, /t\("ui\.registerChordGroup"\)/);
assert.doesNotMatch(app, /onClick=\{clearScaleFinder\}/);
assert.doesNotMatch(app, /onClear=\{clearChordFinder\}/);
assert.doesNotMatch(app, /onClear=\{clearStradellaChordFinder\}/);
for (const panel of [bass,treble]) {
 assert.doesNotMatch(panel, /\bonClear\b/);
 assert.doesNotMatch(panel, /t\("tools\.clearChord"\)/);
 assert.match(panel, /onClick=\{onToggleActive\}/);
}
assert.match(app, /onClear=\{\(\) => \{/); // Progression Assistant still clears sequences
for (const lang of ['en','es','fr','it','pt','de']) {
 const catalog=source(`src/i18n/${lang}.ts`);
 for (const key of ['diagramScale','labelFontSize','buttonSize','spacing','verticalSpacing','buttonLine','referenceLine','chordFill']) {
  const line=catalog.split('\n').find(x=>x.includes(`"ui.${key}"`));
  assert.ok(line && !/:\s*['"]\s*,?\s*$/.test(line), `${lang} ${key}: no double-colon suffix`);
 }
 for (const key of ['melodiosaConfiguredShort','melodiosaOriginalShort']) {
  assert.match(catalog, new RegExp(`"ui\\.${key}"`));
 }
 assert.match(catalog,/tools\.showExplanationBelow/);
}
assert.match(en,/Show diagram explanation/);
console.log('✓ Compact panel controls, localization, and Finder action invariants passed');
