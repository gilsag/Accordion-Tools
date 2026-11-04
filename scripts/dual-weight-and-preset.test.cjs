// Behavioral TS execution without the platform-specific esbuild/tsx binary.
const { createRequire } = require('node:module');
const path = require('node:path');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename,'utf8');
    const compiled = ts.transpileModule(source, {fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    module._compile(compiled,filename);
  };
}
const { optimizeStradellaProgression, progressionRealizationKey, progressionRealizationsForChord } = require('../src/tools/harmonyExplorer/progression.ts');
const { convertProgressionPreset } = require('../src/tools/harmonyExplorer/progressionPresets.ts');
const { generateStradella } = require('../src/stradella.ts');
const { CIRCLE_OF_FIFTHS } = require('../src/tools/harmonyExplorer/music.ts');
const buttons = generateStradella('120', 24, 6, 'natural', 0);
const chord = (id,rootPc,familyId) => ({id,rootPc,familyId,sectorIndex:CIRCLE_OF_FIFTHS.indexOf(rootPc)});
const progression = [chord('cm',0,'major'),chord('em',4,'minor7'),chord('g7',7,'dominant7')];
const options = {allowApproximations:true, handMovementWeight:0,voiceLeadingWeight:0,maxRealizationsPerChord:5};
const plan = optimizeStradellaProgression(buttons,progression,options);
assert.equal(plan.playable,true);
assert.deepEqual(plan.steps.map(s=>s.realizationIndex), [0,0,0]);
assert.ok(plan.steps[0].result.playbackButtons.some(button=>button.kind==='chord-major'), 'CM should use original Finder top realization');
const firstOptions = progressionRealizationsForChord(buttons,progression[0],true);
const pinnedKey = progressionRealizationKey(firstOptions[2].result);
const pinned = optimizeStradellaProgression(buttons,progression,{...options,fixedRealizationKeys:{cm:pinnedKey}});
assert.equal(pinned.steps[0].realizationIndex,2);
assert.deepEqual(pinned.steps.slice(1).map(s=>s.realizationIndex),[0,0]);
const handOnly=optimizeStradellaProgression(buttons,progression,{...options,handMovementWeight:1});
const voiceOnly=optimizeStradellaProgression(buttons,progression,{...options,voiceLeadingWeight:1});
assert.ok(handOnly.totalPhysicalMovement>=0 && voiceOnly.totalHarmonicMotion>=0);
assert.ok(handOnly.totalPhysicalMovement <= plan.totalPhysicalMovement + 1e-8, "Physical slider should not worsen physical movement at its maximum");
assert.ok(voiceOnly.totalHarmonicMotion <= plan.totalHarmonicMotion + 1e-8, "Voice slider should not worsen pitch-class motion at its maximum");
for(const [preset, expected] of [
  [{progression:'I vi IV V'},['major-triad','minor-triad','major-triad','major-triad']],
  [{progression:'ii V7 Imaj7'},['minor-triad','dominant7','major7']],
  [{progression:'bVII IV I'},['major-triad','major-triad','major-triad']],
]){
 const { chords,unsupported}=convertProgressionPreset(preset,'C');
 assert.deepEqual(unsupported,[]);assert.deepEqual(chords.map(x=>x.pattern),expected);
}
for(const symbols of ['V7/IV I','III9 V7','I sus4']){
 const converted=convertProgressionPreset({progression:symbols},'C');
 assert.ok(converted.unsupported.length>0);assert.equal(converted.chords.length,0);
}
const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../public/chord-progressions/chord-progressions.json'),'utf8'));
assert.equal(catalog.length,29,'Use existing bundled 29-progression catalog');
const convertible = catalog.filter(item => convertProgressionPreset(item,'C').chords.length>0);
assert.ok(convertible.length >= 15 && convertible.length < catalog.length, 'Provide a useful subset and flag unsupported symbols');
assert.equal(convertProgressionPreset(catalog.find(item=>item.id==='folia'),'C').chords.length,0,'Do not guess a major-key resolution for a minor tonic');
console.log('✓ Real Chord Finder ranking at 0/0, pinned physical IDs, independent weights, and shared preset conversions passed');
