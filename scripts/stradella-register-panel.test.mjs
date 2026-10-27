import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.tsx', 'utf8');
const css = readFileSync('src/App.css', 'utf8');
const settings = readFileSync('docs/settings.md', 'utf8');
const render = app.slice(app.indexOf('activeSettingsSection === "stradellaRegisters" && ('), app.indexOf('toggleSettingsSection("sound")'));

assert.equal((render.match(/className="stradella-register-group"/g) ?? []).length, 2, 'Two independent register groups');
assert.ok(render.indexOf('ui.registerBassGroup') < render.indexOf('ui.registerChordGroup'), 'Bass group precedes chord group');
assert.doesNotMatch(render, /<legend>|ui\.chordFormationAndRegisterPlacement/, 'No redundant large legend');
for (const token of ['ui.registerNominalModel', 'ui.registerStartingOctave', 'ui.registerGrouping', 'ui.registerGroupingHelp', 'ui.registerConfiguredRange', 'ui.stradellaRegisterIntro']) {
  assert.ok(render.includes(token), `${token} present`);
}
assert.equal((render.match(/ui\.registerConfiguredRange/g) ?? []).length, 2, 'Both configured ranges remain visible');
for (const stateName of ['stradellaBassRegisterOctave', 'stradellaBassRegisterGrouping', 'stradellaChordRegisterOctave', 'stradellaChordRegisterGrouping']) {
  assert.ok(render.includes(`value={${stateName}}`), `${stateName} unchanged`);
  assert.ok(app.includes(`set${stateName[0].toUpperCase()}${stateName.slice(1)}`), `${stateName} setter kept`);
}
for (const ariaKey of ['ui.bassCounterbassStartingOctave', 'ui.presetChordStartingOctave', 'ui.bassCounterbassGrouping', 'ui.presetChordGrouping']) {
  assert.match(render, new RegExp(`(aria-label|ariaLabel)=\\{t\\("${ariaKey.replaceAll('.', '\\.')}"\\)\\}`), `Distinct accessibility name: ${ariaKey}`);
}
assert.match(css, /\.stradella-register-group \+ \.stradella-register-group\s*\{[^}]*border-top:/);
assert.match(css, /\.density-compact \.stradella-register-group/);
assert.match(css, /\.density-comfortable \.stradella-register-group/);
assert.match(settings, /C–B\/F–E grouping tooltip/);
const keys = ['registerNominalModel','registerBassGroup','registerChordGroup','registerStartingOctave','registerGrouping','registerConfiguredRange','registerGroupingHelp'];
for (const lang of ['en','es','fr','pt','it','de']) {
  const src = readFileSync(`src/i18n/${lang}.ts`, 'utf8');
  for (const key of keys) assert.ok(src.includes(`"ui.${key}"`), `${lang}: missing ${key}`);
}
assert.match(readFileSync('src/config/appInfo.ts','utf8'), /version: "0\.15\.20"/);
assert.equal(JSON.parse(readFileSync('package.json','utf8')).version, '0.15.20');
assert.equal(JSON.parse(readFileSync('package-lock.json','utf8')).version, '0.15.20');
console.log('✓ Stradella register panel grouping, accessibility, persistence and localization regression passed');
