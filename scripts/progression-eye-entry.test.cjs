/** Real chord-selection/annotation behavior plus rendering the real panel with
 * a minimal JSX/React harness (no browser or native tsx required). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { Module } = require('node:module');
const path = require('node:path');
const files = (file) => fs.readFileSync(file, 'utf8');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    module._compile(ts.transpileModule(files(filename), {fileName:filename,compilerOptions:{
      target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,
    }}).outputText, filename);
  };
}
const { progressionNoteStep, toggleProgressionNoteId } = require('../src/features/progressionAssistant/progressionNoteSelection.ts');
const { generateStradella } = require('../src/stradella.ts');
const { progressionRealizationsForChord, optimizeStradellaProgression } = require('../src/tools/harmonyExplorer/progression.ts');
const { realizationAnnotation, DEFAULT_STRADELLA_NOTE_LEVELS } = require('../src/tools/stradellaChordFinder/diagramAnnotations.ts');
const buttons = generateStradella('120',24,6,'natural',0);
const progression=[
  {id:'first-C',rootPc:0,pattern:'major-triad',sectorIndex:0},
  {id:'second-G',rootPc:7,pattern:'dominant7',sectorIndex:0},
];
const plan=optimizeStradellaProgression(buttons,progression,{
  allowApproximations:true,handMovementWeight:0,voiceLeadingWeight:0,maxRealizationsPerChord:5,
});
assert.equal(plan.playable,true);
let eye=null;
eye=toggleProgressionNoteId(eye,'first-C');
assert.equal(eye,'first-C');
assert.strictEqual(progressionNoteStep(plan,eye),plan.steps[0]);
eye=toggleProgressionNoteId(eye,'second-G');
assert.equal(eye,'second-G','only one eye active');
assert.strictEqual(progressionNoteStep(plan,eye),plan.steps[1]);
eye=toggleProgressionNoteId(eye,'second-G');
assert.equal(eye,null,'second click hides all notes');
assert.equal(progressionNoteStep(plan,eye),null);
const reversed={...plan,steps:[...plan.steps].reverse()};
assert.strictEqual(progressionNoteStep(reversed,'second-G'),plan.steps[1], 'reordering does not select wrong chord');
assert.equal(progressionNoteStep({...plan,steps:plan.steps.slice(0,1)},'second-G'),null, 'removed chord has no explanation');
assert.equal(progressionNoteStep({...plan,playable:false},'first-C'),null, 'unplayable plan has no explanation');
const noteStep=progressionNoteStep(plan,'first-C');
const fromFinder=progressionRealizationsForChord(buttons,noteStep.chord,true);
assert.strictEqual(noteStep.result.playbackButtons.length>0,true);
const annotation=realizationAnnotation('C','major-triad',noteStep.result,undefined,null,DEFAULT_STRADELLA_NOTE_LEVELS,'compact','en');
assert.equal(annotation.lines.length,4);
assert.ok(annotation.lines.some(line=>line.includes('Physical realization')));
assert.ok(annotation.lines.some(line=>line.includes('Harmonic identity')));
assert.ok(fromFinder.some(({result}) => result.playbackButtons.map(b=>b.id).sort().join('|') ===
  noteStep.result.playbackButtons.map(b=>b.id).sort().join('|')), 'exact physical recipe retained');

// Execute the real JSX rendering with a lightweight stateful React surrogate.
const cells=[];let stateIndex=0;const actions=[];
const jsx=(type,props)=>({type,props:props??{}});
const react={useState(initial){const i=stateIndex++;if(!cells[i]) cells[i]={v:initial};
  return [cells[i].v,(next)=>{cells[i].v=typeof next==='function'?next(cells[i].v):next}];},
  useMemo(fn){return fn()},};
const stubs={
 'react':react,'react/jsx-runtime':{jsx,jsxs:jsx},
 '../../i18n/catalog':{translateKnownLabel:(_lang,label)=>label},
 '../../music/chordDefinitions':{CHORD_FINDER_OPTIONS:[{value:'major-triad',label:'Major'}]},
 '../../i18n/useI18n':{useI18n:()=>({t:(key,params)=>params?.chord?`${key} ${params.chord}`:key,language:'en'})},
 '../ui/CollapsibleSection':{CollapsibleSection:()=>null},
 '../ui/SegmentedChoice':{SegmentedChoice:()=>null},
 '../ui/HelpTip':{HelpTip:()=>null},
 '../../tools/harmonyExplorer/progression':{progressionRealizationKey:(r)=>r.playbackButtons.map(b=>b.id).join('|'), progressionChordLabel:(c)=>c.id},
 '../../tools/scaleFinderTools':{FINDER_ROOT_OPTIONS:[{value:'C',label:'C'}]},
 '../../tools/harmonyExplorer/progressionPresets':{convertProgressionPreset:()=>({chords:[{rootPc:0}],unsupported:[]})},
 './progressionRealizationText':{realizationText:()=> 'C bass + CM'},
};
const panelPath=path.resolve('src/components/tools/ProgressionAssistantPanel.tsx');
const compiled=ts.transpileModule(files(panelPath), {fileName:panelPath,compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,
}}).outputText;
const mod=new Module(panelPath,module);mod.filename=panelPath;mod.paths=module.paths;
mod.require=(id)=>{if(id in stubs)return stubs[id];throw new Error(`Unexpected runtime import: ${id}`)};
mod._compile(compiled,panelPath);
const props={isOpen:true,chordDisplayStyle:'compact',onToggle:()=>{},progression,plan,
  presetDefinitions:[{id:'i-iv-v-i',name:'I IV V I'}],onUsePreset:()=>{},
  realizationOptions:Object.fromEntries(progression.map(chord=>[chord.id,[{result:plan.steps.find(s=>s.chord.id===chord.id).result,realizationIndex:0}]])),
  realizationKeys:{},onCycleRealization:()=>{},manualRoot:'C',onManualRootChange:()=>{},
  manualPattern:'major-triad',onManualPatternChange:()=>{},handMovementWeight:0.65,
  onHandMovementWeightChange:()=>{},voiceLeadingWeight:0.35,onVoiceLeadingWeightChange:()=>{},
  rhythmPattern:'waltz',onRhythmPatternChange:()=>{},tempoBpm:120,onTempoBpmChange:()=>{},
  noteStepId:'first-C',onToggleStepNotes:(id)=>actions.push(id),onAddManualChord:()=>{},
  onRemoveChord:()=>{},onMoveChord:()=>{},onClear:()=>{},onPlay:()=>{},onStop:()=>{},
};
const walk=(element)=>{if(Array.isArray(element))return element.flatMap(walk);
  if(!element || typeof element!=='object')return [];
  return [element,...walk(element.props?.children)];};
const render=()=>{stateIndex=0;return walk(mod.exports.ProgressionAssistantPanel(props));};
let tree=render();
let eyes=tree.filter(e=>typeof e.props?.className==='string'&&e.props.className.includes('progression-note-eye'));
assert.equal(eyes.length,2);
assert.deepEqual(eyes.map(e=>e.props['aria-pressed']),[true,false]);
assert.match(eyes[0].props['aria-label'],/HideNotesFor/i);
eyes[1].props.onClick();assert.deepEqual(actions,['second-G']);
let actionText=tree.filter(e=>e.type==='button').map(e=>e.props.children).filter(x=>typeof x==='string');
assert.ok(actionText.includes('ui.addChord')&&actionText.includes('tools.clear'), 'Add and Clear coexist');
assert.ok(!actionText.includes('ui.openPreviewInChordFinder'));
const segment=tree.find(e=>e.type?.name==='SegmentedChoice');
assert.ok(segment);
assert.deepEqual(segment.props.options.map(o=>o.value),['preset','manual']);
segment.props.onChange('preset');tree=render();
actionText=tree.filter(e=>e.type==='button').map(e=>e.props.children).filter(x=>typeof x==='string');
assert.ok(actionText.includes('ui.progressionLoadPreset')&&actionText.includes('tools.clear'));
assert.ok(!actionText.includes('ui.addChord'));
segment.props.onChange('manual');tree=render();
actionText=tree.filter(e=>e.type==='button').map(e=>e.props.children).filter(x=>typeof x==='string');
assert.ok(actionText.includes('ui.addChord')&&actionText.includes('tools.clear'));
const controller=files('src/app/useAppController.ts');
assert.ok(!controller.includes('T:Optimized Stradella progression'),'No forced ABC title');
assert.match(controller,/diagramNoteAnnotation = progressionAnnotation/);
assert.match(controller,/finderAnnotationDisplayLines = diagramNoteAnnotation\?\.lines/);
assert.match(controller,/setHarmonyProgressionNoteStepId\(null\)/,'Reset and clear can hide notes');
const settings=JSON.parse(files('scripts/settings-export-keys.json'));
assert.equal(settings.length,118);
for (const locale of ['en','es','fr','pt','it','de']) {
  const text=files(`src/i18n/${locale}.ts`);
  for(const key of ['ui.progressionEntryMode','ui.progressionManual','ui.progressionLoadPreset',
    'ui.progressionShowNotesFor','ui.progressionHideNotesFor'])assert.ok(text.includes(`"${key}"`),`${locale}: ${key}`);
}
console.log('✓ Stable eye selection, Finder annotation/IDs, preset/manual toggle, inline actions, title removal and six locales passed');
