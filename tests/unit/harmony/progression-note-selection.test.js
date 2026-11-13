/** Which chord's notes are shown (the eye toggle) and that the explanation
 * uses the Finder's own realization and annotation. */
import assert from 'node:assert/strict';
import { progressionNoteStep, toggleProgressionNoteId } from '../../../src/features/progressionAssistant/progressionNoteSelection';
import { generateStradella } from '../../../src/stradella';
import { progressionRealizationsForChord, optimizeStradellaProgression } from '../../../src/tools/harmonyExplorer/progression';
import { realizationAnnotation, DEFAULT_STRADELLA_NOTE_LEVELS } from '../../../src/tools/stradellaChordFinder/diagramAnnotations';
import { test } from "vitest";

const buttons = generateStradella('120',24,6,'natural',0);
const progression=[
  {id:'first-C',rootPc:0,pattern:'major-triad',sectorIndex:0},
  {id:'second-G',rootPc:7,pattern:'dominant7',sectorIndex:0},
];
const plan=optimizeStradellaProgression(buttons,progression,{
  allowApproximations:true,handMovementWeight:0,voiceLeadingWeight:0,maxRealizationsPerChord:5,
});

test("Stable eye selection and Finder annotation/IDs", () => {
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
});
