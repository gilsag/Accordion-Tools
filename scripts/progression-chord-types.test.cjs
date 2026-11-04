/** The Progression Assistant uses the Chord Finder's canonical chord types,
 * preserves legacy Harmony family transfers and keeps Finder ranking/IDs.
 * Run the real search without requiring the platform-specific tsx loader. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const compiled = ts.transpileModule(source, { fileName: filename, compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    module._compile(compiled, filename);
  };
}
const { CHORD_FINDER_OPTIONS, intervalsForChordFinder } = require('../src/music/chordDefinitions.ts');
const { displayFinderChord } = require('../src/tools/chordDisplay.ts');
const { generateStradella } = require('../src/stradella.ts');
const { getStradellaChordFinderResults } = require('../src/tools/stradellaChordFinderTools.ts');
const {
  progressionFinderPattern, progressionChordLabel, progressionTargetPitchClasses,
  progressionRealizationsForChord, optimizeStradellaProgression, progressionRealizationKey,
} = require('../src/tools/harmonyExplorer/progression.ts');
const { convertProgressionPreset } = require('../src/tools/harmonyExplorer/progressionPresets.ts');
const { CHORD_FAMILIES } = require('../src/tools/harmonyExplorer/music.ts');

assert.equal(CHORD_FINDER_OPTIONS.length, 35);
assert.equal(new Set(CHORD_FINDER_OPTIONS.map(({ value }) => value)).size, 35);
assert.equal(CHORD_FAMILIES.length, 16, 'Harmony Explorer catalog must remain untouched');
for (const { value: pattern } of CHORD_FINDER_OPTIONS) {
  const chord = { id: `c-${pattern}`, rootPc: 0, pattern, sectorIndex: 0 };
  assert.equal(progressionFinderPattern(chord), pattern);
  assert.deepEqual(progressionTargetPitchClasses(chord),
    [...new Set(intervalsForChordFinder(pattern).map((interval) => interval % 12))],
    `${pattern}: target notes use the canonical Finder formula`);
  for (const style of ['compact', 'letter', 'words']) {
    assert.equal(progressionChordLabel(chord, style), displayFinderChord('C', pattern, style),
      `${pattern}: symbol uses the existing Finder formatter`);
  }
}
const legacy = { id: 'from-harmony', rootPc: 0, familyId: 'halfDiminished7', sectorIndex: 0 };
assert.equal(progressionFinderPattern(legacy), 'minor7b5', 'Legacy Harmony IDs still map without changing them');
assert.equal(progressionFinderPattern({ ...legacy, familyId: 'augmentedMajor7' }), null,
  'No invented Finder equivalent for an unsupported Harmony family');

const buttons = generateStradella('120', 24, 6, 'natural', 0);
for (const pattern of ['major-triad', 'majorAdd9', 'dominant7b9', 'minorMajor9', 'major13', 'minor13']) {
  const chord = { id: `p-${pattern}`, rootPc: 0, pattern, sectorIndex: 0 };
  const original = getStradellaChordFinderResults(buttons, 'C', pattern, 'bass-and-chords', true);
  const displayed = progressionRealizationsForChord(buttons, chord, true);
  assert.equal(displayed.length, original.filter((result) => result.playable).length,
    `${pattern}: no new candidate or hidden playable alternative`);
  for (const { result, realizationIndex } of displayed) {
    assert.equal(result.playable, true);
    assert.equal(progressionRealizationKey(result), progressionRealizationKey(original[realizationIndex]),
      `${pattern}: original rank and physical playback buttons retained`);
  }
  if (displayed.length) {
    const zeroWeights = optimizeStradellaProgression(buttons, [chord], {
      allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0,
      maxRealizationsPerChord: 5,
    });
    assert.equal(zeroWeights.playable, true);
    assert.equal(zeroWeights.steps[0].realizationIndex, displayed[0].realizationIndex,
      `${pattern}: zero-weight Auto uses the original first Finder candidate`);
    const pinned = displayed.at(-1);
    const pinKey = progressionRealizationKey(pinned.result);
    const explicit = optimizeStradellaProgression(buttons, [chord], {
      allowApproximations: true, handMovementWeight: 0, voiceLeadingWeight: 0,
      maxRealizationsPerChord: 5, fixedRealizationKeys: { [chord.id]: pinKey },
    });
    assert.equal(explicit.steps[0].realizationIndex, pinned.realizationIndex,
      `${pattern}: arbitrary ranked option may be pinned`);
  }
}
const converted = convertProgressionPreset({ progression: 'ii V7 Imaj7' }, 'C');
assert.deepEqual(converted.unsupported, []);
assert.deepEqual(converted.chords.map((chord) => chord.pattern),
  ['minor-triad', 'dominant7', 'major7'], 'Presets use the same pattern IDs as manual selection');

const panel = fs.readFileSync('src/components/tools/ProgressionAssistantPanel.tsx', 'utf8');
const controller = fs.readFileSync('src/app/useAppController.ts', 'utf8');
assert.match(panel, /CHORD_FINDER_OPTIONS\.map\(/);
assert.match(panel, /t\("tools\.chordType"\)/);
assert.doesNotMatch(panel, /CHORD_FAMILIES\.map\(/);
assert.match(controller, /progressionFinderPattern\(harmonyProgressionNoteStep\.chord\)/,
  'Diagram notes preserve the exact Finder type of the chosen step');
assert.match(controller, /harmonyProgressionNoteStep\.result/,
  'Diagram notes use the actual optimized or pinned sounding recipe');
assert.match(controller, /converted\.chords\.map\(\(\{ rootPc, pattern, sectorIndex \}\)/);
const settingsKeys = JSON.parse(fs.readFileSync('scripts/settings-export-keys.json', 'utf8'));
assert.equal(settingsKeys.length, 118, 'No new settings key');
for (const locale of ['en', 'es', 'fr', 'pt', 'it', 'de']) {
  const source = fs.readFileSync(`src/i18n/${locale}.ts`, 'utf8');
  assert.ok(source.includes('tools.chordType'), `Existing chord-type translation reused: ${locale}`);
}
console.log('✓ All 35 chord types, legacy Harmony mapping, ranked candidates, pins, presets and UI terminology passed');
