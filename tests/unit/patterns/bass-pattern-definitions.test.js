/* Rhythmic invariants and selected externally documented reference timelines.
 * No genre can be certified from a JSON catalog alone; uncertain stylistic
 * adaptations are described in docs/internal/archive/bass-pattern-rhythm-audit.md. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from "vitest";

const library = JSON.parse(readFileSync('public/bass-patterns/bass-patterns.json', 'utf8'));
const byId = new Map(library.patterns.map(pattern => [pattern.id,pattern]));
function number(value) {
  if (typeof value === 'number') return value;
  const simple = /^(\d+)(?:\+(\d+)\/(\d+))?$/.exec(value);
  if (simple) return Number(simple[1]) + (simple[2] ? Number(simple[2])/Number(simple[3]) : 0);
  const fraction = /^(\d+)\/(\d+)$/.exec(value);
  if (fraction) return Number(fraction[1])/Number(fraction[2]);
  throw new Error('Unexpected pattern time: ' + value);
}
const nonRest = pattern => pattern.steps.filter(step => !step.play.includes('rest'));
const starts = pattern => nonRest(pattern).map(step => number(step.t));

test("29 patterns: valid meter spans, complete multi-bar cycles, standard clave, tango, shuffle, and bell onsets", () => {
  const near = (values, expected, label) => {
    assert.equal(values.length, expected.length, label+' attack count');
    values.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-9,label+' event '+i));
  };
  assert.equal(library.version,2);
  assert.equal(library.patterns.length,29,'preserve the shared 29-pattern catalog');
  assert.equal(byId.size,library.patterns.length,'pattern IDs must be unique');
  for (const pattern of library.patterns) {
    assert.match(pattern.meter,/^\d+\/\d+$/);
    const units = Number(pattern.meter.split('/')[0]) * (pattern.bars ?? 1);
    assert.ok(nonRest(pattern).length>0,pattern.id+' contains an attack');
    const startsAll = pattern.steps.map(step=>number(step.t));
    assert.deepEqual(startsAll,[...startsAll].sort((a,b)=>a-b),pattern.id+' event order');
    for(const step of pattern.steps){
      const t=number(step.t), d=number(step.d);
      assert.ok(t>=0 && d>0 && t+d<=units+1e-9,
        `${pattern.id}: event [${t},${t+d}] outside ${units} meter units`);
      assert.ok(Array.isArray(step.play) && step.play.length>0,pattern.id+' event has action');
      assert.ok(!(step.play.includes('rest') && step.play.length>1),pattern.id+' rest cannot also sound a button');
    }
    if(pattern.bars>1) for(let b=0;b<pattern.bars;b++)
      assert.ok(nonRest(pattern).some(step => number(step.t)>=b*Number(pattern.meter.split('/')[0]) &&
        number(step.t)<(b+1)*Number(pattern.meter.split('/')[0])),
        pattern.id+' has no attack in bar '+(b+1));
  }
  near(starts(byId.get('oom-pah-pah')),[0,1,2],'3/4 waltz');
  near(starts(byId.get('march-2-4')),[0,0.5,1,1.5],'2/4 march');
  near(starts(byId.get('tango-habanera')),[0,0.75,1,1.5],'2/4 habanera');
  near(starts(byId.get('nuevo-tango')),[0,1.5,3],'4/4 tango 3+3+2');
  near(starts(byId.get('son-clave-3-2')),[0,1.5,3,5,6],'3-2 son clave');
  near(starts(byId.get('son-clave-2-3')),[1,2,4,5.5,7],'2-3 son clave');
  near(starts(byId.get('rumba-clave-3-2')),[0,1.5,3.5,5,6],'3-2 rumba clave');
  near(starts(byId.get('rumba-clave-2-3')),[1,2,4,5.5,7.5],'2-3 rumba clave');
  near(starts(byId.get('bo-diddley')),[0,1.5,3,5,6],'two-bar Bo Diddley clave-derived skeleton');
  const shuffle=byId.get('shuffle');
  assert.equal(shuffle.meter,'12/8');
  near(starts(shuffle),[0,2,3,5,6,8,9,11],'four long-short shuffle pairs');
  assert.deepEqual(nonRest(shuffle).map(step=>number(step.d)),[2,1,2,1,2,1,2,1]);
  const bell=byId.get('standard-african-bell');
  assert.equal(bell.meter,'12/8');
  near(starts(bell),[0,2,4,5,7,9,11],'seven-stroke 12/8 bell timeline');
});
