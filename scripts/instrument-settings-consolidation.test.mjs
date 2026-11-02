import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const app = [readFileSync('src/App.tsx','utf8'), readFileSync('src/app/useAppController.ts','utf8'), readFileSync('src/app/views/SettingsView.tsx','utf8'), readFileSync('src/app/views/ToolsView.tsx','utf8'), readFileSync('src/app/views/WorkspaceView.tsx','utf8')].join("\n");
const pkg = JSON.parse(readFileSync('package.json','utf8'));
const body = app.slice(app.indexOf('activeSettingsSection === "instrument" && ('),app.indexOf('toggleSettingsSection("notation")'));
assert.match(app, /toggleSettingsSection\("instrument"\)/);
assert.doesNotMatch(app, /toggleSettingsSection\("stradellaRegisters"\)/);
for (const item of ['ui.basses','ui.trebleLayout','ui.presetChordConstructionHelp','ui.registerBassGroup','ui.registerChordGroup','ui.registerConfiguredRange']) {
 assert.ok(body.includes(`t("${item}")`), `Instrument includes ${item}`);
}
for (const item of ['stradellaBassRegisterOctave','stradellaBassRegisterGrouping','stradellaChordRegisterOctave','stradellaChordRegisterGrouping']) {
 assert.ok(body.includes(`value={${item}}`), `${item} remains connected`);
}
const notation = app.slice(app.indexOf('activeSettingsSection === "notation" && ('),app.indexOf('toggleSettingsSection("musicNotation")'));
assert.match(notation,/ui\.chordLabels/);
const appearance = app.slice(app.indexOf('activeSettingsSection === "appearance" && ('),app.indexOf('toggleSettingsSection("sound")'));
assert.match(appearance,/ui\.octaveNumbers/);
for (const lang of ['en','es','fr','pt','it','de']) {
 const file=readFileSync(`src/i18n/${lang}.ts`,'utf8');
 for (const key of ['settings.instrument','ui.presetChordConstruction','ui.presetChordConstructionHelp']) assert.ok(file.includes(key), `${lang}: ${key}`);
}
for (const name of ['StradellaReferenceChartPanel','HarmonyProgressionAssistant']) {
 assert.equal(existsSync(`src/components/tools/${name}.tsx`),false,`${name} removed`);
 assert.ok(!app.includes(name), `${name} not used`);
}
assert.match(readFileSync('docs/settings.md','utf8'), /Settings → Instrument/);
assert.ok(readFileSync('src/config/appInfo.ts','utf8').includes(`version: "${pkg.version}"`));
console.log('✓ Instrument settings grouping, read-only formulas, localization, saved-state bindings, and orphan cleanup passed');
