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
for(const symbols of ['III9 V7','I sus4','V7/IV/I','V7/X']){
 const converted=convertProgressionPreset({progression:symbols},'C');
 assert.ok(converted.unsupported.length>0,symbols);assert.equal(converted.chords.length,0);
}
// Secondary chords resolve on their target: V7/IV in C is C7, V/bVI is Eb.
const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const roots=(preset,key)=>convertProgressionPreset(preset,key).chords.map(c=>names[c.rootPc]+':'+c.pattern);
assert.deepEqual(roots({progression:'V7/IV IV V/bVI bVI'},'C'),['C:dominant7','F:major-triad','D#:major-triad','G#:major-triad']);
// Minor-mode entries count III, VI and VII from the natural minor scale.
assert.deepEqual(roots({progression:'i VII III V',mode:'minor'},'A'),['A:minor-triad','G:major-triad','C:major-triad','E:major-triad']);
assert.deepEqual(roots({progression:'iv III bII I',mode:'minor'},'A'),['D:minor-triad','C:major-triad','A#:major-triad','A:major-triad']);
const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../public/chord-progressions/chord-progressions.json'),'utf8'));
assert.equal(catalog.length,29,'Use existing bundled 29-progression catalog');
for (const item of catalog) assert.deepEqual(convertProgressionPreset(item,'C').unsupported,[],`${item.id} loads`);
assert.deepEqual(roots(catalog.find(item=>item.id==='bird-blues'),'F').slice(4,6),['F:dominant7','A#:major-triad'],'Bird Blues: V7/IV then IV');
assert.deepEqual(roots(catalog.find(item=>item.id==='folia'),'D').slice(3,5),['C:major-triad','F:major-triad'],'Folia: bVII and bIII are major');
// The Bass Pattern Player resolves through the same function.
const { resolveRomanChord } = require('../src/tools/bassPatternPlayerTools.ts');
const resolve=(symbol,key,mode)=>{const c=resolveRomanChord(symbol,key,mode);return c.root+':'+c.pattern;};
assert.equal(resolve('V7/IV','C'),'C:dominant7');
assert.equal(resolve('bVII','C'),'A#:major-triad','a flat does not make a numeral minor');
assert.equal(resolve('#IVdim','C'),'F#:diminished-triad');
assert.equal(resolve('VI','A','minor'),'F:major-triad');
console.log('✓ Real Chord Finder ranking at 0/0, pinned physical IDs, independent weights, and shared preset conversions passed');
