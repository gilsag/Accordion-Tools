/** Phase 3e: state ownership, musical engine forwarding, and cross-tool invariants.
 * The original harmony and progression algorithm suites independently validate
 * actual chord/voice computations; this test locks down the feature boundary.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const source = (file) => readFileSync(file, 'utf8');
const app = [source('src/App.tsx'), source('src/app/useAppController.ts'), source('src/app/views/SettingsView.tsx'), source('src/app/views/ToolsView.tsx'), source('src/app/views/WorkspaceView.tsx')].join("\n");
const expSrc = source('src/features/harmonyExplorer/useHarmonyExplorer.ts');
const progSrc = source('src/features/progressionAssistant/useProgressionAssistant.ts');
for (const key of ['useHarmonyExplorerState()', 'useHarmonyExplorerResults({',
  'useHarmonyProgressionState()', 'useHarmonyProgressionResults({'])
  assert.ok(app.includes(key), `App uses ${key}`);
for (const key of ['harmonyReferenceFamilyId','harmonySelection','harmonyProgression','harmonyRecordedProgression'])
  assert.doesNotMatch(app,new RegExp(`\\[${key},\\s*set[A-Z][^\\]]*\\]\\s*=\\s*useState`), `${key} lives in its feature`);
for (const key of ['sendHarmonyRecordedProgressionToAssistant','openHarmonyProgressionStepInChordFinder',
  'showHarmonySelectionOnStradella','stopHarmonyRecordedProgressionPlayback','playOptimizedHarmonyProgression'])
  assert.ok(app.includes(`function ${key}(`), `Cross-tool/audio command ${key} remains in App`);
assert.ok(app.includes('step.result.playbackButtons.map((button) => button.id).sort().join("|")'),
  'Physical playback-button identity still determines finder handoff');
assert.match(app, /setPendingProgressionRealizationKey\(resultKey\)/);
assert.match(app, /playButtonRhythmProgression\(/);

function reactMock() {
  const slots=[]; let index=0; const effects=[];
  return {effects, reset() {index=0;effects.length=0}, react:{
    useState(initial) {const i=index++;if(!slots[i]){
      const cell={value:typeof initial==='function'?initial():initial};
      cell.set=(next)=>{cell.value=typeof next==='function'?next(cell.value):next};
      slots[i]=cell;
    } return [slots[i].value,slots[i].set];},
    useRef(initial) {const i=index++;if(!slots[i])slots[i]={current:initial};return slots[i]},
    useEffect(fn) {effects.push(fn)},
    useMemo(fn) {return fn()},
  }};
}
function load(file,react,dependencies) {
  const output = ts.transpileModule(source(file),{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText;
  const module={exports:{}};
  runInNewContext(output,{module,exports:module.exports,require(name){
    if(name==='react')return react;
    if(name in dependencies)return dependencies[name];
    throw new Error(`Unexpected runtime import ${name} (${file})`);
  }},{filename:file});return module.exports;
}
const refVisibility={0:true,1:true,2:true};
const sectorArgs=[];const sectorResults=[];let countArgs=[];
const harmonyMusic={
  DEFAULT_RING_VISIBILITY: refVisibility,
  buildSectorRelationships(...args) {sectorArgs.push(args);const sectors=[{rootPc:0,stamp:sectorArgs.length}];sectorResults.push(sectors);return sectors;},
  relationshipCounts(sectors){countArgs.push(sectors);return [2,1];},
  filterRelationshipCounts(counts,vis){assert.equal(JSON.stringify(vis),JSON.stringify(refVisibility));return counts},
  chordFamily(id){return {id,name:'Major triad'}},
  relatedFamilyName(){return 'Minor seventh'},
  scaleDefinition(id){return {id,name:'Ionian'}},
};
const explanationCalls=[];
const eh=reactMock();
const explorer=load('src/features/harmonyExplorer/useHarmonyExplorer.ts',eh.react,{
  '../../tools/harmonyExplorer/music':harmonyMusic,
  '../../i18n/musicTerms':{familyName:(_id,name)=>name,scaleName:(_id,name)=>name},
  '../../tools/harmonyExplorer/explanation':{buildDiagramExplanation(options){explanationCalls.push(options);return 'expected explanation'}},
});
let state=explorer.useHarmonyExplorerState();
for(const [field,expected] of Object.entries({
  harmonyReferenceFamilyId:'major',harmonyRelatedFamilyId:'minor7',harmonyScaleId:'ionian',
  harmonyDiatonicOnly:false,harmonyHighlightDiatonic:true,harmonyShowEnharmonics:false,
  harmonyShowSeparators:true,harmonyShowLegend:true,harmonyShowExplanation:false,
  harmonyShowToneTooltips:true,harmonyShowNoteRing:true,harmonyColorByFamily:false,
  harmonyDiameter:900,harmonyFontSize:18,harmonyPlaybackStyle:'block',
  harmonyVoicingStyle:'root',harmonySelection:null,harmonyFocusedReferenceRootPc:null,
})) assert.equal(state[field],expected,`Explorer default: ${field}`);
assert.equal(JSON.stringify(state.harmonyRingVisibility),JSON.stringify(refVisibility));
assert.notStrictEqual(state.harmonyRingVisibility,refVisibility,'ring visibility initialized independently');
assert.equal(eh.effects.length,1,'Selection reset effect retained');
const setter=state.setHarmonyShowNoteRing;
state.setHarmonyShowNoteRing(false);eh.reset();state=explorer.useHarmonyExplorerState();
assert.strictEqual(setter,state.setHarmonyShowNoteRing,'Stable setter across renders');
assert.equal(state.harmonyShowNoteRing,false);
const t=(key)=>key;
const options={...state,language:'en',t};
let calculated=explorer.useHarmonyExplorerResults(options);
assert.equal(calculated.harmonyAllFamiliesMode,false);
assert.equal(calculated.harmonyEffectiveDiatonicOnly,false);
assert.equal(calculated.harmonyEffectiveHighlightDiatonic,true);
assert.deepEqual([...sectorArgs[0]],['major','minor7','ionian',false,true]);
assert.strictEqual(countArgs[0],sectorResults[0]);
assert.strictEqual(calculated.harmonySectors,sectorResults[0]);
assert.equal(calculated.harmonyExplanation,'expected explanation');
assert.equal(explanationCalls[0].showNoteRing,false);
assert.equal(explanationCalls[0].referenceFamilyName,'Major triad');
calculated=explorer.useHarmonyExplorerResults({...options,harmonyRelatedFamilyId:'all'});
assert.equal(calculated.harmonyAllFamiliesMode,true);
assert.equal(calculated.harmonyEffectiveDiatonicOnly,true);
assert.equal(calculated.harmonyEffectiveHighlightDiatonic,false);
assert.equal(explanationCalls.at(-1).relatedFamilyName,'ui.allDiatonicFamilies');

const physicalButtons=[{id:'bass-C',kind:'bass-root'},{id:'chord-C',kind:'chord-major'}];
let generatedArgs=[],optimizedArgs=[]; let playable=true;
const playbackButtons=[physicalButtons[0],physicalButtons[1]];
const progression={
  optimizeStradellaProgression(...args){optimizedArgs.push(args);return {
    playable,steps: playable ? [{result:{playbackButtons},chord:{rootPc:0,familyId:'major'}}] : []
  }}
};
const ph=reactMock();
const assistant=load('src/features/progressionAssistant/useProgressionAssistant.ts',ph.react,{
  '../../tools/harmonyExplorer/progression':progression,
  '../../stradella':{generateStradella(...args){generatedArgs.push(args);return physicalButtons}},
});
let prog=assistant.useHarmonyProgressionState();
for(const [field,expected] of Object.entries({
 harmonyProgressionRecording:false,harmonyRecordedNotationVisible:false,
 harmonyRecordedProgressionPlaying:false,harmonyProgressionManualRoot:'C',
 harmonyProgressionManualFamilyId:'major',harmonyProgressionAllowApproximations:true,
 harmonyProgressionHandMovementWeight:0.65,harmonyProgressionRhythmPattern:'block',
 harmonyProgressionPreviewIndex:null,harmonyProgressionNotationVisible:false,
})) assert.equal(prog[field],expected,`Progression default: ${field}`);
for(const k of ['harmonyProgression','harmonyRecordedProgression','harmonyProgressionActiveButtonIds'])
 assert.equal(prog[k].length,0,`${k} initially empty`);
assert.equal(prog.harmonyProgressionIdRef.current,1);
assert.equal(prog.harmonyProgressionNotationRef.current,null);
assert.equal(prog.harmonyRecordedNotationRef.current,null);
let updates=[];
const selection={basses:'96',buttonSize:40,spacing:1.2,stradellaAccidental:'sharps',diagramVerticalSpacing:6,
 harmonyProgression:[{id:'p1',rootPc:0,familyId:'major'}],
 harmonyProgressionAllowApproximations:false,harmonyProgressionHandMovementWeight:0.4,
 harmonyProgressionPreviewIndex:0,setHarmonyProgressionPreviewIndex:(v)=>updates.push(v),
 harmonyProgressionActiveButtonIds:[],activeToolSection:'progressionAssistant'};
let result=assistant.useHarmonyProgressionResults(selection);
assert.deepEqual([...generatedArgs[0]],['96',40,1.2,'sharps',6]);
assert.strictEqual(optimizedArgs[0][0],physicalButtons);
assert.strictEqual(optimizedArgs[0][1],selection.harmonyProgression);
assert.equal(JSON.stringify(optimizedArgs[0][2]),JSON.stringify({
 allowApproximations:false,handMovementWeight:0.4,maxRealizationsPerChord:5}));
assert.strictEqual(result.harmonyProgressionPlan.steps[0].result.playbackButtons,playbackButtons);
assert.equal(JSON.stringify([...result.progressionPreviewButtonIds]),JSON.stringify(['bass-C','chord-C']));
assert.equal(ph.effects.length,1);
ph.effects[0]();assert.equal(updates[0](0),0,'Existing preview-clamping updater retained');
result=assistant.useHarmonyProgressionResults({...selection,activeToolSection:'scaleFinder'});
assert.equal(result.progressionPreviewButtonIds.size,0,'Preview hidden outside Assistant');
result=assistant.useHarmonyProgressionResults({...selection,harmonyProgressionActiveButtonIds:['chord-C']});
assert.equal(result.progressionPreviewButtonIds.size,0,'Playback markings supersede preview');
assert.ok(result.harmonyProgressionActiveButtonIdSet.has('chord-C'));
playable=false;
result=assistant.useHarmonyProgressionResults(selection);
assert.equal(result.harmonyProgressionPlan.playable,false);
assert.equal(result.progressionPreviewButtonIds.size,0);
ph.effects.at(-1)();assert.equal(updates.at(-1),null,'Unplayable plan clears stale preview');
console.log('✓ Phase 3e Harmony and progression defaults, selectors, physical IDs, and commands passed');
