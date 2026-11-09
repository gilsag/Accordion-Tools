import assert from "node:assert/strict";
import abcjs from "abcjs";
import { readFileSync } from "node:fs";
import { buildRhythmExercise, RHYTHM_METERS, RHYTHM_TEMPLATES, rhythmEventKey, millisecondsPerUnit,
  rootTrebleButton, unitsPerTempoBeat, type RhythmExerciseOptions } from "../src/features/rhythmTrainer/rhythmModel";
import { rhythmExerciseToAbc } from "../src/features/rhythmTrainer/rhythmNotation";
import { stradellaButtonsFor, trebleButtonsFor, type SideButtonSettings } from "../src/app/sideButtons";
import { validateBassPatternLibrary } from "../src/tools/bassPatternPlayerTools";
import type { BassPatternLibrary, ChordProgressionDefinition } from "../src/tools/bassPatternPlayerTools";

const settings:SideButtonSettings={basses:"96",stradellaAccidental:"natural",trebleLayout:"c-system",trebleRows:5,
  trebleSize:"full",pianoTrebleRange:"three-octave",buttonSize:28,spacing:2.3,diagramVerticalSpacing:0,
  pianoKeyWidthScale:1,pianoKeyHeightScale:1,pianoBlackKeyWidthScale:1,pianoBlackKeyHeightScale:1,
  trebleAngle:30,showTrebleOctaves:true};
const library=JSON.parse(readFileSync("public/bass-patterns/bass-patterns.json","utf8")) as BassPatternLibrary;
const progressions=JSON.parse(readFileSync("public/chord-progressions/chord-progressions.json","utf8")) as ChordProgressionDefinition[];
const cuecaHarmony:ChordProgressionDefinition={id:"cueca-example",name:"Cueca example",symbols:["I","V","V","I"]};
const opts:RhythmExerciseOptions={meter:"6/8",bassStyleId:"cueca-abc-bass",trebleTemplateId:"T602",keyRoot:"C",
  progression:cuecaHarmony,bassButtons:stradellaButtonsFor(settings),trebleButtons:trebleButtonsFor(settings),bassPatterns:library.patterns};
const plan=(change:Partial<RhythmExerciseOptions>={})=>buildRhythmExercise({...opts,...change});
assert.equal(RHYTHM_TEMPLATES.length,25,"25 documented rhythmic templates across four meters");
assert.deepEqual(RHYTHM_METERS,["2/4","3/4","4/4","6/8"]);
for (const meter of RHYTHM_METERS) {
  const templates=RHYTHM_TEMPLATES.filter(template=>template.meter===meter);
  assert.match(templates[0].label,/^Sustained/,`${meter} starts with a sustained treble note`);
  const expectedOnsets=meter==="6/8"?[0,3]:Array.from({length:Number(meter[0])},(_,i)=>i);
  assert.deepEqual(templates[1].notes.map(([start])=>start),expectedOnsets,`${meter} second pattern has one attack per beat`);
}
assert.equal(RHYTHM_TEMPLATES.find(t=>t.id==="T401")?.label,"1+1+1+1","existing 4/4 template IDs remain stable");
assert.deepEqual([...new Set(RHYTHM_TEMPLATES.map(t=>t.meter))].sort(),["2/4","3/4","4/4","6/8"]);
assert.ok(RHYTHM_TEMPLATES.every(t=>t.notes.every(([start,d])=>start>=0 && d>0 &&
  start+d<=Number(t.meter.split("/")[0])+1e-9)),"all notes fit inside their bars");
const cueca=plan();
assert.deepEqual(cueca.missing,[]);
assert.deepEqual(cueca.harmonicRoots,["C","G","G","C"]);
const hand=(which:"bass"|"treble",bar=0,exercise=cueca)=>exercise.events.filter(e=>e.hand===which&&e.bar===bar);
assert.deepEqual(hand("bass").map(e=>e.startUnit),[1,2,4,5],"Cueca bass attacks on original slots 2,3,5,6");
assert.ok(hand("bass").every(e=>e.buttons.length===1 && e.buttons[0].kind==="bass-root"),"no invented chord buttons");
assert.deepEqual(hand("treble").map(e=>e.startUnit),[0,3],"3+3 on main compound beats");
assert.equal(rhythmEventKey(hand("bass")[0]),"bass:0:1:1");
assert.notEqual(rhythmEventKey(hand("bass")[0]),rhythmEventKey(hand("treble")[0]),"each hand owns a distinct highlight marker");
assert.equal(hand("bass").filter(b=>hand("treble").some(t=>t.startUnit===b.startUnit)).length,0);
assert.deepEqual(hand("treble",1).map(e=>e.buttons[0].pitchClass),["G","G"]);
assert.deepEqual(hand("bass",1).map(e=>e.buttons[0].pitchClass),["G","G","G","G"]);
assert.deepEqual(hand("treble",0,plan({trebleTemplateId:"T605"})).map(e=>e.startUnit),[1,2,4,5]);
assert.deepEqual(hand("treble",0,plan({trebleTemplateId:"T603"})).map(e=>e.startUnit),[0,2,4]);
assert.deepEqual(hand("treble",0,plan({trebleTemplateId:"T607"})).map(e=>e.startUnit),[0,1.5,3,4.5]);
assert.equal(unitsPerTempoBeat("6/8"),3);
assert.ok(Math.abs(millisecondsPerUnit("6/8",80*2/3)-375)<0.00001,"ABC quarter=80 -> dotted-quarter=53.333 -> 375ms eighth");
assert.equal(cueca.events.length,24,"4 bars × 4 cueca bass attacks + 2 treble attacks");
assert.equal(plan({progression:{id:"single",name:"One chord",symbols:["I"]}}).barCount,1);
const cuecaPreset=progressions.find(p=>p.id==="i-v-v-i");
assert.ok(cuecaPreset,"The Cueca I–V–V–I is present in the shared Bass Pattern Player library");
assert.deepEqual(plan({progression:cuecaPreset}).harmonicRoots,["C","G","G","C"]);
const standard=plan({progression:progressions.find(p=>p.id==="i-iv-v-i")});
assert.deepEqual(standard.harmonicRoots,["C","F","G","C"],"Existing Bass Pattern Player progression resolved");
assert.equal(standard.barCount,4);
assert.deepEqual(standard.events.filter(e=>e.hand==="treble").map(e=>e.buttons[0].pitchClass),["C","C","F","F","G","G","C","C"]);
const blues=plan({progression:progressions.find(p=>p.id==="twelve-bar-blues")});
assert.equal(blues.barCount,12,"Full twelve-bar progression, not truncated to four bars");
assert.deepEqual(blues.harmonicRoots.slice(0,5),["C","C","C","C","F"]);
assert.equal(blues.events.filter(e=>e.hand==="bass").length,48,"Cueca rhythm repeated in every blues measure");
const minor=plan({progression:progressions.find(p=>p.id==="folia")});
assert.deepEqual(minor.harmonicRoots.slice(0,4),["C","G","C","A#"],"Minor mode is preserved");
const longSteps=plan({progression:{id:"steps",name:"Multi-bar",steps:[{symbol:"I",bars:2},{symbol:"V",bars:3}]}});
assert.deepEqual(longSteps.harmonicRoots,["C","C","G","G","G"],"Per-step bars are preserved");
assert.equal(longSteps.events.filter(e=>e.hand==="bass").length,20);
const notation=rhythmExerciseToAbc(cueca);
assert.match(notation,/%%score 1 2/,"Cueca uses a single bass-staff voice, with its actual rests");
assert.doesNotMatch(notation,/V:3 clef=bass/,"Do not create a silent chord voice for bass-only Cueca");
assert.match(notation,/M:6\/8/);
assert.match(notation,/V:1 clef=treble/);
assert.match(notation,/V:2 clef=bass/);
assert.match(notation,/z C, C, z C, C,/); // True Cueca silences on eighths 1 and 4.
assert.match(notation,/z G,, G,, z G,, G,,/,"G bass uses the lower part of the bass clef (G2), not G3");
const offbeatAbc=rhythmExerciseToAbc(plan({trebleTemplateId:"T605"}));
assert.match(offbeatAbc,/z C C z C C/); // Treble rests match Cueca bass attacks
assert.equal(plan({progression:undefined}).events.length,0,"Awaiting library load produces no events");
const waltz=plan({meter:"3/4",bassStyleId:"waltz-alternate-bass",trebleTemplateId:"T303",progression:{id:"single",name:"One chord",symbols:["I"]}});
assert.deepEqual(waltz.missing,[]);
assert.ok(waltz.events.filter(e=>e.hand==="treble").every(e=>e.buttons[0].pitchClass==="C"),
  "Treble follows C harmony despite left hand changing bass pitch");
assert.deepEqual(waltz.events.filter(e=>e.hand==="treble").map(e=>e.startUnit),[0,2]);
const ordinaryWaltz=plan({meter:"3/4",bassStyleId:"oom-pah-pah",trebleTemplateId:"T303",
  progression:{id:"i-v-i",name:"Waltz",symbols:["I","V","I"]}});
const waltzNotation=rhythmExerciseToAbc(ordinaryWaltz);
assert.match(waltzNotation,/%%score 1 2/,"Conventional waltz fits one Stradella staff");
assert.doesNotMatch(waltzNotation,/V:3 clef=bass/,"No artificial second voice or ghost rests");
assert.match(waltzNotation,/\[V:2\][^\n]*C, "\^M"C "\^M"C/,"C bass followed by two single chord-button symbols");
assert.match(waltzNotation,/\[V:2\][^\n]*G,, "\^M"G, "\^M"G,/,"G bass and chords use lower and upper bass-staff regions");
assert.doesNotMatch(waltzNotation,/x[0-9]*/,"No spacer rests in the normal waltz score");
const mazurca=plan({meter:"3/4",bassStyleId:"mazurca",trebleTemplateId:"T303",
  progression:{id:"one",name:"One chord",symbols:["I"]}});
assert.match(rhythmExerciseToAbc(mazurca),/\[C,C\]/,"Simultaneous bass+chord buttons use one notated onset");

// 2/4 reuses the exact existing Polka/Tango bass definitions; both voices
// must remain aligned to two quarter-note beats and notated as 2/4.
const twoFourPolka=plan({meter:"2/4",bassStyleId:"polka",trebleTemplateId:"T202",
  progression:{id:"one",name:"One chord",symbols:["I"]}});
assert.deepEqual(twoFourPolka.missing,[]);
assert.deepEqual(hand("bass",0,twoFourPolka).map(e=>e.startUnit),[0,1]);
assert.deepEqual(hand("treble",0,twoFourPolka).map(e=>e.startUnit),[0,1]);
assert.match(rhythmExerciseToAbc(twoFourPolka),/M:2\/4/);
assert.equal(twoFourPolka.barUnits,2);
assert.equal(unitsPerTempoBeat("2/4"),1);
assert.equal(millisecondsPerUnit("2/4",120),500);
const twoFourTango=plan({meter:"2/4",bassStyleId:"tango-habanera",trebleTemplateId:"T201",
  progression:{id:"one",name:"One chord",symbols:["I"]}});
assert.deepEqual(twoFourTango.missing,[]);
assert.deepEqual(hand("bass",0,twoFourTango).map(e=>e.startUnit),[0,0.75,1,1.5]);
assert.equal(hand("treble",0,twoFourTango).length,1);
const tangoAbc=rhythmExerciseToAbc(twoFourTango);
assert.match(tangoAbc,/M:2\/4/);
assert.equal(abcjs.parseOnly(tangoAbc)[0].warnings?.length??0,0,
  "Tango 0.35-beat performance gate is converted to valid conventional notation");
const polka=plan({meter:"4/4",bassStyleId:"alternate-bass-polka",trebleTemplateId:"T405",progression:{id:"single",name:"One chord",symbols:["I"]}});
assert.deepEqual(polka.missing,[]);
assert.deepEqual(polka.events.filter(e=>e.hand==="treble").map(e=>e.startUnit),[0.5,1.5,2.5,3.5]);

// March options are shared with Bass Pattern Player, without duplicating
// rhythm data. Two-four march alternates on eighth notes; 4/4 is quarter pulse.
assert.deepEqual(validateBassPatternLibrary(library),[],"Shared pattern catalog remains valid");
const march24=plan({meter:"2/4",bassStyleId:"march-2-4",trebleTemplateId:"T202",
  progression:{id:"one",name:"One chord",symbols:["I"]}});
assert.deepEqual(march24.missing,[]);
assert.deepEqual(hand("bass",0,march24).map(e=>e.startUnit),[0,0.5,1,1.5]);
assert.deepEqual(hand("bass",0,march24).map(e=>e.buttons[0].kind),
  ["bass-root","chord-major","bass-root","chord-major"]);
assert.deepEqual(hand("bass",0,march24).filter(e=>e.buttons[0].kind==="bass-root").map(e=>e.buttons[0].pitchClass),
  ["C","G"],"March alternates root/fifth without changing harmony");
assert.equal(abcjs.parseOnly(rhythmExerciseToAbc(march24))[0].warnings?.length??0,0);
const march44=plan({meter:"4/4",bassStyleId:"march-4-4",trebleTemplateId:"T401",
  progression:{id:"one",name:"One chord",symbols:["I"]}});
assert.deepEqual(march44.missing,[]);
assert.deepEqual(hand("bass",0,march44).map(e=>e.startUnit),[0,1,2,3]);
assert.deepEqual(hand("bass",0,march44).map(e=>e.gain),[1.25,1,1.25,1]);

// Five-stroke clave forms over TWO bars. The second bar may have a different
// chord; it must not repeat the first 3-side or double the progression length.
const claveProgression:ChordProgressionDefinition={id:"changes",name:"Changes",symbols:["I","V","IV","I"]};
const claveCases:[string,number[],number[]][]=[
  ["son-clave-3-2",[0,1.5,3],[1,2]],
  ["son-clave-2-3",[1,2],[0,1.5,3]],
  ["rumba-clave-3-2",[0,1.5,3.5],[1,2]],
  ["rumba-clave-2-3",[1,2],[0,1.5,3.5]],
];
for (const [style,first,second] of claveCases) {
  const pattern=library.patterns.find(p=>p.id===style)!;
  assert.equal(pattern?.bars,2,`${style} remains a shared two-bar pattern`);
  const exercise=plan({meter:"4/4",bassStyleId:style,trebleTemplateId:"T401",progression:claveProgression});
  assert.deepEqual(exercise.missing,[],`${style} resolves all physical Stradella buttons`);
  assert.equal(exercise.barCount,4,`${style} must not stretch a four-bar progression to eight`);
  for (let bar=0;bar<4;bar++) {
    const expected=(bar%2===0?first:second);
    const left=hand("bass",bar,exercise);
    assert.deepEqual(left.map(e=>e.startUnit-bar*4),expected,`${style} bar ${bar+1} clave onsets`);
    assert.equal(left.length,expected.length,`${style} no extra downbeat or tie retriggers`);
    assert.ok(left.every(e=>e.durationUnits===0.5),`${style} short clave strokes`);
    assert.ok(left[0].buttons.some(b=>b.kind==="bass-root"),"first attack of each bar is bass");
    assert.ok(left.slice(1).every(e=>e.buttons.some(b=>b.kind.startsWith("chord-"))),
      `${style} remaining attacks use chord buttons`);
  }
  assert.deepEqual(hand("bass",1,exercise).map(e=>e.buttons[0].pitchClass),
    Array.from({length:second.length},()=>"G"),`${style} bar 2 follows the V harmony`);
  assert.equal(exercise.events.filter(e=>e.hand==="bass").length,10,"two cycles produce ten attacks");
  const abc=rhythmExerciseToAbc(exercise);
  assert.match(abc,/M:4\/4/);
  assert.equal(abcjs.parseOnly(abc)[0].warnings?.length??0,0,`${style} score parses without warnings`);
  const odd=plan({meter:"4/4",bassStyleId:style,trebleTemplateId:"T401",
    progression:{id:"odd",name:"Odd bars",symbols:["I","V","I"]}});
  assert.equal(odd.barCount,3,`${style} odd-length progression is not expanded`);
  assert.deepEqual(hand("bass",2,odd).map(e=>e.startUnit-8),first,`${style} clave restarts on third bar`);
}

assert.ok(rootTrebleButton(opts.trebleButtons,"C"));
const impossible=plan({bassButtons:[]});
assert.ok(impossible.missing.some(s=>s.includes("Missing Stradella bass")));
console.log("✓ Rhythm Trainer: 25 templates, March 2/4 & 4/4, four clave cycles, Cueca, shared progressions, notation and meter normalization");
