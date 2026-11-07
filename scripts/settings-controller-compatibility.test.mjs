/** Comparison fixtures were recorded from the original v0.15.28 settings
 * settings handlers before moving them out of App.tsx. They assert actual
 * setter calls AND order, including historically distinct startup/import rules.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = (path) => readFileSync(path, 'utf8');
const source = read('src/settings/settingsController.ts');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const controller = {};
const normalizeStradellaNoteLevels = (value) => {
  const input = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(['identity', 'pitchClasses', 'voicing', 'physical']
    .map((key) => [key, typeof input[key] === 'boolean' ? input[key] : true]));
};
new Function('require', 'exports', compiled)((id) => {
  if (id.includes('i18n/catalog')) return { isInterfaceLanguagePreference: (v) =>
    ['auto', 'en', 'es', 'fr', 'pt', 'it', 'de'].includes(v) };
  if (id.includes('diagramAnnotations')) return { normalizeStradellaNoteLevels };
  if (id.includes('settingsMigrations')) return { SETTINGS_VERSION: 2 };
  if (id.includes('harmonyExplorer/music')) return { DEFAULT_RING_VISIBILITY: {0:false,1:true,2:true,3:true,4:true} };
  throw new Error(`Unexpected settings controller import: ${id}`);
}, controller);

const fixtures = JSON.parse(read('scripts/settings-compatibility-fixtures.json'));
const oldWindow = globalThis.window;
try {
  for (const testCase of fixtures) {
    const calls = [];
    const setters = new Proxy({}, {
      get(_target, key) { return (value) => calls.push([key, value]); },
    });
    globalThis.window = {localStorage:{getItem() {return testCase.stored;}}};
    if (testCase.mode === 'startup') controller.applyStartupSettings(testCase.input, setters);
    else controller.applyImportedSettings(testCase.input, setters);
    assert.deepEqual(calls, testCase.expectedCalls, `Legacy settings behavior: ${testCase.label}`);
  }
  // A storage error historically makes a valid startup language effective.
  const calls = [];
  globalThis.window = { localStorage: { getItem() {throw Error('blocked');} } };
  controller.applyStartupSettings({ language: 'fr' }, new Proxy({}, {
    get(_t, key) {return (value) => calls.push([key, value]);},
  }));
  assert.deepEqual(calls, [['setLanguagePreference', 'fr']]);
  // Note length in players is clamped to 30–100% and ignored when not a number.
  for (const [value, expected] of [[0.1, [['setSoundArticulation', 0.3]]], [1.4, [['setSoundArticulation', 1]]],
    [0.666, [['setSoundArticulation', 0.67]]], ['loud', []]]) {
    const articulationCalls = [];
    controller.applyImportedSettings({ soundArticulation: value }, new Proxy({}, {
      get(_t, key) {return (v) => articulationCalls.push([key, v]);},
    }));
    assert.deepEqual(articulationCalls, expected, `soundArticulation ${value}`);
  }
} finally {
  globalThis.window = oldWindow;
}

const expectedKeys = JSON.parse(read('scripts/settings-export-keys.json'));
const snapshot = new Proxy({
  harmonyRingVisibility: {0:false, 1:true, 2:false, 7:true},
}, {get(target, key) {return key in target ? target[key] : key;}});
const exported = controller.collectCurrentSettings(snapshot);
assert.deepEqual(Object.keys(exported), expectedKeys, 'Historical settings key set and JSON order');
assert.equal(exported.settingsVersion, 2, 'Exports carry the settings format version');
assert.equal(exported.soundArticulation, 'soundArticulation');
assert.equal(exported.stradellaRequestedBassOnBassButton, 'stradellaRequestedBassOnBassButton');
assert.equal(exported.progressionRootPosition, 'harmonyProgressionRootPosition');
// Both are plain booleans on import; other values are ignored.
for (const [key, setter] of [['stradellaRequestedBassOnBassButton', 'setStradellaRequestedBassOnBassButton'], ['progressionRootPosition', 'setHarmonyProgressionRootPosition']]) {
  for (const [value, expected] of [[false, [[setter, false]]], ['yes', []]]) {
    const seen = [];
    controller.applyImportedSettings({ [key]: value }, new Proxy({}, { get(_t, name) { return (v) => seen.push([name, v]); } }));
    assert.deepEqual(seen, expected, `${key} ${value}`);
  }
}
assert.equal(exported.language, 'languagePreference');
assert.equal(exported.buttonSpacing, 'spacing');
assert.equal(exported.bassPatternRepeatsPerChord, 'bassPatternBarsPerChord');
assert.equal(exported.annotationTextSize, 'textNoteFontSize');
assert.equal(exported.stradellaShowNominalNoteSpacing, 'showStradellaVoicingIntervals');
assert.equal(exported.progressionRhythmPattern, 'harmonyProgressionRhythmPattern');
assert.deepEqual(exported.harmonyRingVisibility, {'0':false,'1':true,'2':false,'7':true});
console.log(`✓ Settings compatibility: ${fixtures.length} original import/default traces and ${expectedKeys.length} exported keys`);
