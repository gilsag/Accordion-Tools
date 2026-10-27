import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyzeVoicingDensity, passesNominalGapFilter } from "../src/tools/stradellaChordFinder/voicingDensity";
import { voicingIntervalLayout } from "../src/tools/stradellaChordFinder/voicingIntervalLayout";
import { createZip } from "../src/tools/zipExport";
import { generateStradella } from "../src/stradella";
import { getStradellaChordFinderResults } from "../src/tools/stradellaChordFinderTools";
import { analyzeConfiguredStradellaVoicing, DEFAULT_STRADELLA_REGISTER_MODEL } from "../src/tools/stradellaChordFinder/registerModel";
import type { ModeledStradellaNote } from "../src/tools/stradellaChordFinder/registerModel";
const note = (midi: number): ModeledStradellaNote => ({ midi, pitchClass: ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][midi%12],
  octave: Math.floor(midi/12)-1, source: "chord", buttonId: `mock-${midi}` });
for (const pitches of [[60,61], [60,60,61], [60,62], [60,63], [60,64], [60,61,62,64]]) {
  const notes = pitches.map(note);
  const gaps = [...new Set(pitches)].sort((a,b)=>a-b).slice(1).map((m,i)=>m-[...new Set(pitches)].sort((a,b)=>a-b)[i]);
  for (const rule of [0,2,3] as const) {
    assert.equal(passesNominalGapFilter(notes,rule), rule===0 || gaps.every((gap)=>gap>=rule));
  }
}
assert.equal(passesNominalGapFilter([note(48),note(48)], 3),true,"repeated pitch is not a semitone clash");
assert.ok(analyzeVoicingDensity([note(60),note(61)]).penalty > analyzeVoicingDensity([note(60),note(62)]).penalty);
const buttons = generateStradella("96", 38, 1.18, "default");
const unfiltered = getStradellaChordFinderResults(buttons,"C","major7","bass-and-chords",true,3,5.5);
const noSemitone = getStradellaChordFinderResults(buttons,"C","major7","bass-and-chords",true,3,5.5,null,DEFAULT_STRADELLA_REGISTER_MODEL,2);
const noWholeTone = getStradellaChordFinderResults(buttons,"C","major7","bass-and-chords",true,3,5.5,null,DEFAULT_STRADELLA_REGISTER_MODEL,3);
assert.ok(unfiltered.some((result) => result.playable &&
  !passesNominalGapFilter(analyzeConfiguredStradellaVoicing(result.playbackButtons,"C",DEFAULT_STRADELLA_REGISTER_MODEL).notes,2)),
"Unfiltered results should include a legitimate close major-seventh voicing");
for (const [results,minimum] of [[noSemitone,2],[noWholeTone,3]] as const) {
  assert.ok(results.some((candidate) => candidate.playable),"Spacing must leave valid alternatives available");
  for (const result of results.filter((candidate) => candidate.playable))
    assert.ok(passesNominalGapFilter(analyzeConfiguredStradellaVoicing(result.playbackButtons,"C",DEFAULT_STRADELLA_REGISTER_MODEL).notes,minimum));
  assert.equal(results.length, results.filter((candidate) => candidate.playable).length,
    "when a valid candidate remains, the filtered result list contains no unusable placeholder");
}
const layout=voicingIntervalLayout([60,61,63,68].map(note), {fontSize:40});
assert.deepEqual(layout.positions.slice(1).map((p,i)=>p.x-layout.positions[i].x),[23,46,115]);
const bytes=new TextEncoder().encode("<svg />");
const zip=createZip([{name:"001-C.svg",data:bytes},{name:"002-D.svg",data:bytes}]);
const buffer=new Uint8Array(await zip.arrayBuffer());
assert.equal(zip.type,"application/zip");
assert.equal(new DataView(buffer.buffer).getUint32(0,true),0x04034b50);
assert.equal(new DataView(buffer.buffer).getUint32(buffer.length-22,true),0x06054b50);
assert.equal(new DataView(buffer.buffer).getUint16(buffer.length-12,true),2);
const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
assert.match(app,/function clearHarmonyWork\(/);
assert.match(app,/function resetStradellaFinderDefaults\(/);
assert.match(app,/className="reset-menu"/);
assert.match(app,/flushSync\(\(\) => setStradellaChordFinderRealizationIndex\(initialIndex\)\)/);
assert.match(app,/stradellaMinimumNominalGap,/);
console.log("✓ Proportional layout, adjacent-gap filter, ZIP metadata and reset scope checks passed");
