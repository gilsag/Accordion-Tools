// Execute production rhythm planner directly, without a separate test implementation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { Module } = require('node:module');
const filename = require('node:path').resolve(__dirname, '../src/audio/progressionPulsePlan.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName:filename, compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const mod = new Module(filename, module);mod.filename=filename;mod.paths=module.paths;mod._compile(compiled,filename);
const { progressionPulsePlan } = mod.exports;
const bass = (id,pitch)=>({id,kind:'bass-root',pitchClass:pitch});
const counterbass=(id,pitch)=>({id,kind:'bass-counterbass',pitchClass:pitch});
const chord=(id)=>({id,kind:'chord-major',chordRoot:'C'});
const low=bass('low-C','C'), higher=counterbass('higher-E','E'), button=chord('C-major');
const midi=(button)=>({'low-C':36,'higher-E':40,'C-major':48,'root-C':36,'only-bass':36}[button.id]);
const ids=pulses=>pulses.map(p=>p.map(b=>b.id));
const chosen=[higher,low,button];
for(const [pattern,count] of [['oom-pah',2],['waltz',3],['march',4]]){
 const sequence=progressionPulsePlan(chosen,[],pattern,midi);
 assert.equal(sequence.length,count);
 assert.deepEqual(ids(sequence),[['low-C'],...Array(count-1).fill(['higher-E','C-major'])],`${pattern}: one lowest bass, all other selected buttons`);
 assert.strictEqual(sequence[0][0],low,'preserves exact physical identity');
}
assert.deepEqual(ids(progressionPulsePlan(chosen,[],'block',midi)),[['higher-E','low-C','C-major']]);
assert.deepEqual(ids(progressionPulsePlan([button],[bass('root-C','C')],'waltz',midi)),[['root-C'],['C-major'],['C-major']], 'preset-only fallback sounds root, then chord');
assert.deepEqual(ids(progressionPulsePlan([bass('only-bass','C')],[], 'waltz',midi)),[['only-bass'],[],[]], 'bass-only never repeats bass or invents a preset chord');
assert.deepEqual(ids(progressionPulsePlan([button],[], 'oom-pah',midi)),[[],['C-major']], 'missing fallback becomes a rest');
const selectedOnly = [higher, button];
assert.deepEqual(ids(progressionPulsePlan(selectedOnly,[bass('root-C','C')],'oom-pah',midi)),[['higher-E'],['C-major']], 'selected counterbass has priority over external root bass');
console.log('✓ Shared rhythmic bass/remainder planner, and rests passed');
