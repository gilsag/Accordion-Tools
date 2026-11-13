/** Diagram annotation: verify that relocating diagram/annotation state does not change
 * defaults, button identity, SVG coordinates, stored-note data, or overlays.
 * Existing diagram/export tests independently cover the actual SVG output.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

const source = (path) => readFileSync(path, 'utf8');
function hookFixture() {
  const slots=[]; let cursor=0; let effects=[];
  return {get effects(){return effects},reset(){cursor=0;effects=[]}, react:{
    useState(initial){const i=cursor++;if (!slots[i]) {
      const cell={value:typeof initial==='function'?initial():initial};
      cell.set=(next)=>{cell.value=typeof next==='function'?next(cell.value):next};slots[i]=cell;
    } return [slots[i].value,slots[i].set]},
    useRef(initial){const i=cursor++;if (!slots[i])slots[i]={current:initial};return slots[i]},
    useEffect(callback){effects.push(callback)},
  }};
}
const moduleFrom = (path, react, imports = {}) =>
  loadIsolated(path, { imports: { react, ...imports }, globals: { window: { setTimeout: () => 0 } } });
const appearanceFixture=hookFixture();
const appearance=moduleFrom('src/diagram/useDiagramAppearanceState.ts',appearanceFixture.react,{
  '../instrument/sizePresets':{TREBLE_PRESET_BUTTON_SIZE:{small:28}},
});
let appearanceState=appearance.useDiagramAppearanceState();

test("Diagram appearance, overlays/fingering and annotation editor compatibility", () => {
  for(const [key,expected] of Object.entries({buttonSize:28,spacing:2.3,diagramVerticalSpacing:18,
   diagramScale:100,pianoKeyWidthScale:1,pianoKeyHeightScale:1,pianoBlackKeyWidthScale:1,
   pianoBlackKeyHeightScale:1,showStatusBar:true,trebleAngle:30,buttonStrokeWidth:3,
   referenceStrokeWidth:6,chordFillStrength:100,accidentalStyle:'grey',labelFontSize:13,
   showButtonLabels:true,showBellowsGuide:true,showStradellaRowLabels:true,
   titleMode:'contextual',customTitle:'My accordion diagram',titleFont:'system',titleSize:24,
   labelFont:'system',colorTheme:'default'}))assert.equal(appearanceState[key],expected,`Appearance default: ${key}`);
  const scaleSetter=appearanceState.setDiagramScale;
  scaleSetter(86);
  appearanceFixture.reset();
  appearanceState=appearance.useDiagramAppearanceState();
  assert.equal(appearanceState.diagramScale,86);
  assert.strictEqual(appearanceState.setDiagramScale,scaleSetter,'Settings setter is stable');
  const overlayFixture=hookFixture();
  const overlays=moduleFrom('src/diagram/useDiagramOverlays.ts',overlayFixture.react);
  const renderOverlays=()=>{overlayFixture.reset();return overlays.useDiagramOverlays()};
  let o=renderOverlays();
  assert.equal(o.fingeringPosition,'inside-bottom');
  assert.equal(o.fingeringDraft,'1');
  assert.equal(o.annotateMode,'notes','Annotate Diagram opens in Notes mode');
  assert.equal(JSON.stringify(overlays.ANNOTATE_MODES),JSON.stringify(['select','finger','sequence','notes']));
  o.toggleButtonSelected('row-1');
  o=renderOverlays();
  assert.equal(o.overlays['row-1'].selected,true);
  assert.equal(o.overlays['row-1'].finger,undefined,'Select mode leaves fingering alone');
  assert.equal(JSON.stringify(o.selectedButtonIds),JSON.stringify(['row-1']));
  o.toggleButtonSelected('row-1');
  o=renderOverlays();
  assert.equal(o.overlays['row-1'].selected,false,'A second click deselects');
  o.toggleButtonSelected('row-1');
  o.toggleButtonSelected('row-2');
  o=renderOverlays();
  o.setFingeringDraft(' 3 ');
  o=renderOverlays();
  o.toggleButtonFinger('row-2');
  o=renderOverlays();
  assert.equal(o.overlays['row-2'].selected,true,'Finger mode leaves the selection alone');
  assert.equal(o.overlays['row-2'].finger,'3');
  assert.equal(o.fingeringDraft,' 3 ','The finger value is kept for the next button');
  o.toggleButtonFinger('row-2');
  o=renderOverlays();
  assert.equal(o.overlays['row-2'].finger,'','Same finger again removes it');
  o.toggleButtonFinger('row-2');
  o.setFingeringDraft('');
  o=renderOverlays();
  o.toggleButtonFinger('row-2');
  o=renderOverlays();
  assert.equal(o.overlays['row-2'].finger,'','An empty value clears the button');
  o.setFingeringDraft(' 4 ');
  o=renderOverlays();
  o.applyFingerToSelected();
  o=renderOverlays();
  assert.equal(o.overlays['row-1'].finger,'4');
  assert.equal(o.overlays['row-2'].finger,'4');
  o.clearFingerForSelected();
  o=renderOverlays();
  assert.equal(o.overlays['row-1'].finger,'');
  o.deselectButton('row-1');
  o=renderOverlays();
  assert.equal(o.overlays['row-1'].selected,false);
  o.clearSelection();
  o=renderOverlays();
  assert.equal(o.selectedButtonIds.length,0);
  o.setOverlays({'row-1':{selected:true,finger:'2'},'row-2':{selected:false,finger:'5'}});
  o=renderOverlays();
  o.clearAllFingerings();
  o=renderOverlays();
  assert.equal(o.overlays['row-1'].selected,true);
  assert.equal(o.overlays['row-1'].finger,'');
  assert.equal(o.overlays['row-2'].finger,'');
  const noteFixture=hookFixture();
  const notesMade=[];
  const annotations=moduleFrom('src/features/annotateDiagram/useDiagramAnnotations.ts',noteFixture.react,{
    '../../tools/textNoteTools':{makeTextNote(args){notesMade.push(args);return {id:'note-1',...args}}},
  });
  const renderNotes=(size=24)=>{noteFixture.reset();return annotations.useDiagramAnnotations(size)};
  let n=renderNotes();
  for(const [key,expected] of Object.entries({textNoteFontSize:15,textNoteColor:'#172033',textNoteFont:'system',
   annotationBold:false,annotationItalic:false,annotationOffsetPercent:50,annotationButtonAnchor:'center'}))
   assert.equal(n[key],expected,`Annotation default ${key}`);
  assert.equal(n.textNotes.length,0);
  assert.equal(n.inlineAnnotationEditor,null);
  const selected={id:'button-C',x:100,y:200,width:60,height:40};
  const left=n.annotationPointForButton(selected,'left',50);
  assert.equal(left.x,85);
  assert.equal(left.y,200);
  const topRight=n.annotationPointForButton(selected,'topRight',100);
  assert.equal(topRight.x,121.6);
  assert.equal(topRight.y,180);
  const unbounded=n.annotationPointForButton({id:'button-x',x:1,y:1},'left',-100);
  assert.equal(unbounded.x,1,'Negative offset clamped at zero');
  n.setAnnotationButtonAnchor('topRight');
  n.setAnnotationBold(true);
  n.setTextNoteFontSize(18);
  n=renderNotes();
  n.beginButtonAnnotation(selected);
  n=renderNotes();
  assert.equal(n.inlineAnnotationEditor.attachedToButtonId,'button-C');
  assert.equal(n.inlineAnnotationEditor.annotationAnchor,'topRight');
  assert.equal(n.inlineAnnotationEditor.bold,true);
  assert.equal(n.inlineAnnotationEditor.fontSize,18);
  assert.equal(n.inlineAnnotationEditor.x,115); // 50% of the 60px-wide button
  assert.equal(n.inlineAnnotationEditor.y,190); // 50% of 40px high
  n.setInlineAnnotationEditor({...n.inlineAnnotationEditor,text:'  Test note  '});
  n=renderNotes();
  n.commitInlineAnnotation();
  n=renderNotes();
  assert.equal(notesMade.length,1);
  assert.equal(notesMade[0].text,'Test note');
  assert.equal(notesMade[0].anchor,'middle');
  assert.equal(notesMade[0].attachedToButtonId,'button-C');
  assert.equal(n.textNotes[0].id,'note-1');
  assert.equal(n.inlineAnnotationEditor,null);
  assert.equal(n.annotationLocationLabel(n.textNotes[0]),'Button · top right');
  assert.equal(n.annotationPreview({...n.textNotes[0],text:'A   long\n label'}),'A long label');
  n.beginFreeAnnotation(25,50);
  n=renderNotes();
  assert.equal(n.inlineAnnotationEditor.x,25);
  assert.equal(n.inlineAnnotationEditor.attachedToButtonId,undefined);
  n.cancelInlineAnnotation();
  n=renderNotes();
  assert.equal(n.inlineAnnotationEditor,null);
  n.deleteTextNote('note-1');
  n=renderNotes();
  assert.equal(n.textNotes.length,0);
  n.beginFreeAnnotation(5,10);
  n=renderNotes();
  n.setInlineAnnotationEditor({...n.inlineAnnotationEditor,text:'   '});
  n=renderNotes();
  n.commitInlineAnnotation();
  n=renderNotes();
  assert.equal(n.textNotes.length,0,'Whitespace-only note is not saved');
  n.setTextNotes([{id:'a',text:'one'},{id:'b',text:'two'}]);
  n=renderNotes();
  n.clearTextNotes();
  n=renderNotes();
  assert.equal(n.textNotes.length,0);
});
