/** AAA-style symbolic notation: pitch-class placement is NOT a sound register.
 * Repeated chord marks are the agreed teaching default; no counterbass mark by default.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import abcjs from "abcjs";
import type { DiagramButton } from "../src/types";
import { DEFAULT_STRADELLA_NOTATION, stradellaWrittenPitch, stradellaButtonToken } from "../src/notation/stradellaNotation";
import { stradellaButtonsFor, type SideButtonSettings } from "../src/app/sideButtons";
import { makeBassPatternEvents, bassPatternEventsToStradellaNotationAbc,
  type BassPatternDefinition, type BassPatternLibrary, type ChordProgressionDefinition } from "../src/tools/bassPatternPlayerTools";
const button = (kind: DiagramButton["kind"], pitchClass: string, soundOctave = 2): DiagramButton => ({
  id: `${kind}-${pitchClass}`, kind, pitchClass, chordRoot: pitchClass,
  x:0,y:0,row:0,column:0,soundOctave,octave:soundOctave,
});
for(const [pc,bass,chord] of [
  ["C","C,","C"], ["D","D,","D,"], ["D#","^D,,","^D,"],
  ["Eb","_E,,","_E,"], ["E","E,,","E,"], ["G","G,,","G,"], ["B","B,,","B,"],
] as const) {
  assert.equal(stradellaWrittenPitch(pc,"bass"), bass,`${pc} bass at/below D3`);
  assert.equal(stradellaWrittenPitch(pc,"chord"), chord,`${pc} chord above D3`);
}
assert.deepEqual(DEFAULT_STRADELLA_NOTATION,{mode:"symbolic",chordQualityLabels:"always",markCounterbass:false});
for (const octave of [1,2,3,4,5]) {
  assert.equal(stradellaButtonToken([button("bass-root","C",octave)]).token,"C,", "bass written octave ignores audio configuration");
  assert.equal(stradellaButtonToken([button("chord-major","C",octave)]).token,'"^M"C', "chord written octave ignores audio configuration");
}
const bass=button("bass-root","C");
const chord=button("chord-major","C");
const first=stradellaButtonToken([bass,chord]);
assert.equal(first.token,'"^M"[C,C]');
assert.equal(stradellaButtonToken([chord],DEFAULT_STRADELLA_NOTATION,first.quality).token,'"^M"C',"labels repeat by default");
assert.equal(stradellaButtonToken([chord],{...DEFAULT_STRADELLA_NOTATION,chordQualityLabels:"changes"},first.quality).token,"C");
const counter=button("bass-counterbass","E");
assert.equal(stradellaButtonToken([counter]).token,"E,,");
const marked=stradellaButtonToken([counter],{...DEFAULT_STRADELLA_NOTATION,markCounterbass:true}).token;
assert.match(marked,/_–/);
// ABC.js must accept the optional courtesy annotation.
assert.equal(abcjs.parseOnly(`X:1\nM:4/4\nL:1/4\nK:C clef=bass\n${marked}4 |]`)[0].warnings?.length??0,0);

const settings:SideButtonSettings={basses:"96",stradellaAccidental:"natural",trebleLayout:"c-system",trebleRows:5,
  trebleSize:"full",pianoTrebleRange:"three-octave",buttonSize:28,spacing:2.3,diagramVerticalSpacing:0,
  pianoKeyWidthScale:1,pianoKeyHeightScale:1,pianoBlackKeyWidthScale:1,pianoBlackKeyHeightScale:1,
  trebleAngle:30,showTrebleOctaves:true};
const library=JSON.parse(readFileSync("public/bass-patterns/bass-patterns.json","utf8")) as BassPatternLibrary;
const waltz=library.patterns.find((p:BassPatternDefinition)=>p.id==="oom-pah-pah")!;
const progression:ChordProgressionDefinition={id:"single",name:"One chord",symbols:["I"]};
const events=makeBassPatternEvents(stradellaButtonsFor(settings),waltz,progression,"C");
const generated=bassPatternEventsToStradellaNotationAbc(waltz,progression,events,"C",1,80);
assert.match(generated,/%%score 1\n/,"non-overlapping waltz uses one left-hand voice");
assert.doesNotMatch(generated,/V:2 clef=bass/,"no overlaid silent chord voice");
assert.match(generated,/C, "\^M"C "\^M"C/,"repeated chord labels appear in one sequence");
assert.doesNotMatch(generated,/[xz]1?\s+"\^M"C/,"no artificial rest between bass and chord");
assert.match(generated,/Q:1\/4=80/,"Notation ABC export retains tempo");
assert.equal(abcjs.parseOnly(generated)[0].warnings?.length??0,0,"generated waltz ABC parses");
console.log("✓ Shared Stradella notation: registers, quality labels, counterbass, one-voice waltz");
