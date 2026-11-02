/** Focused contracts for the first behavior-preserving modularization step.
 * Uses TypeScript's parser without esbuild so this test can run on platforms
 * where native bundler binaries have not yet been installed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = (path) => readFileSync(path, 'utf8');
const app = source('src/App.tsx');
const instrument = source('src/instrument/useInstrumentState.ts');
const schema = source('src/settings/settingsSchema.ts');
const controller = source('src/settings/settingsController.ts');

assert.match(app, /useInstrumentState\(\)/, 'App consumes instrument ownership hook');
assert.match(app, /useLanguageSettings\(\)/, 'App consumes persisted language hook');
assert.doesNotMatch(app, /\[side, setSide\]\s*=\s*useState/, 'No duplicate physical-side state in App');
for (const key of ['side', 'basses', 'trebleLayout', 'trebleRows', 'trebleSize', 'pianoTrebleRange', 'showTrebleOctaves']) {
  assert.ok(instrument.includes(`${key}, set${key[0].toUpperCase()}${key.slice(1)}`), `${key} owned by instrument`);
}
for (const key of ['stradellaBassRegisterOctave', 'stradellaBassRegisterGrouping', 'stradellaChordRegisterOctave', 'stradellaChordRegisterGrouping']) {
  assert.ok(instrument.includes(key), `${key} owned by instrument`);
  assert.ok(schema.includes(key), `${key} remains in the settings file contract`);
  assert.ok(app.includes(key), `${key} remains wired to controls and import/export`);
}
assert.doesNotMatch(instrument, /SoundSource|SampleRegister|laMelodiosa|playButtonSound/, 'Sound ownership remains independent');
assert.match(schema, /bassPatternBarsPerChord/, 'Legacy settings alias retained');
assert.match(app, /applyStartupSettings\(defaults, settingsSettersRef\.current\)/, 'Startup settings delegate to controller');
assert.match(app, /applyImportedSettings\(settings, settingsSettersRef\.current\)/, 'Imported settings delegate to controller');
assert.doesNotMatch(app, /function applyExtendedDefaultSettings\(/, 'Legacy setter validation moved out of App');
assert.match(controller, /export function collectCurrentSettings\(/, 'JSON projection now owned by controller');
assert.match(schema, /bassPatternRepeatsPerChord/, 'Current settings key retained');

// Evaluate the actual pure settings I/O module: type-only imports are erased.
const tsSource = source('src/settings/settingsPersistence.ts');
const jsSource = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { fetchDefaultSettingsDocument, parseSettingsDocumentFile, downloadSettingsDocument } =
  await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(jsSource)}`);
const originalFetch = globalThis.fetch;
let fetchCall;
globalThis.fetch = async (url, options) => {
  fetchCall = { url, options };
  return { ok: true, json: async () => ({ side: 'stradella', basses: '96', stradellaBassRegisterGrouping: 'F-E' }) };
};
try {
  const value = await fetchDefaultSettingsDocument('/base/default-settings.json');
  assert.equal(value.basses, '96');
  assert.deepEqual(fetchCall, { url: '/base/default-settings.json', options: { cache: 'no-store' } });
  globalThis.fetch = async () => ({ ok: false });
  assert.equal(await fetchDefaultSettingsDocument('/base/default-settings.json'), null);
  globalThis.fetch = async () => ({ ok: true, json: async () => null });
  assert.equal(await fetchDefaultSettingsDocument('/base/default-settings.json'), null);
} finally {
  globalThis.fetch = originalFetch;
}
const partial = await parseSettingsDocumentFile({ text: async () => '{"basses":"72"}' });
assert.deepEqual(partial, { basses: '72' }, 'Partial legacy imports preserved');
await assert.rejects(parseSettingsDocumentFile({ text: async () => '{bad json' }), SyntaxError);

// Preserve download name, JSON indentation and DOM cleanup without a browser.
const oldDocument = globalThis.document;
const oldCreate = URL.createObjectURL;
const oldRevoke = URL.revokeObjectURL;
let downloaded;
let revoked;
const anchor = {
  href: '', download: '', click() { downloaded = [this.href, this.download]; }, remove() {},
};
globalThis.document = { createElement() { return anchor; }, body: { appendChild() {} } };
URL.createObjectURL = () => 'blob:settings';
URL.revokeObjectURL = (url) => { revoked = url; };
try {
  downloadSettingsDocument(partial);
  assert.deepEqual(downloaded, ['blob:settings', 'accordion-tools-settings.json']);
  assert.equal(revoked, 'blob:settings');
} finally {
  globalThis.document = oldDocument;
  URL.createObjectURL = oldCreate;
  URL.revokeObjectURL = oldRevoke;
}
console.log('✓ Modular instrument ownership and backward-compatible settings I/O checks passed');
