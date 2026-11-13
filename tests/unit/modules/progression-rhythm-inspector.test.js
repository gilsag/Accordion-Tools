// Execute production rhythm planner directly, without a separate test implementation.
import assert from 'node:assert/strict';
import { progressionPulsePlan } from '../../../src/audio/progressionPulsePlan';
import { test } from "vitest";

const bass = (id,pitch)=>({id,kind:'bass-root',pitchClass:pitch});
const counterbass=(id,pitch)=>({id,kind:'bass-counterbass',pitchClass:pitch});
const chord=(id)=>({id,kind:'chord-major',chordRoot:'C'});
const low=bass('low-C','C'), higher=counterbass('higher-E','E'), button=chord('C-major');
const midi=(button)=>({'low-C':36,'higher-E':40,'C-major':48,'root-C':36,'only-bass':36}[button.id]);
const ids=pulses=>pulses.map(p=>p.map(b=>b.id));
const chosen=[higher,low,button];

test("Shared rhythmic bass/remainder planner, and rests", () => {
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
});
