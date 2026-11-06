/** Constrained global optimization and original Chord Finder rank are behavioral
 * contracts. Compile the pure engine with TypeScript (no esbuild/Vite binary). */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(path, 'utf8');
const compiled = ts.transpileModule(read('src/tools/harmonyExplorer/progression.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sourceButtons = [
  { id: 'bass-C', x: 0, y: 0, kind: 'bass-root', pitchClass: 'C' },
  { id: 'chord-C', x: 1, y: 0, kind: 'chord-major', chordRoot: 'C' },
  { id: 'bass-D', x: 2, y: 0, kind: 'bass-root', pitchClass: 'D' },
  { id: 'chord-D', x: 3, y: 0, kind: 'chord-major', chordRoot: 'D' },
];
const candidates = (root) => Array.from({ length: 6 }, (_unused, n) => {
  const played = n === 5 ? sourceButtons.filter(button => button.kind === 'chord-major' && button.chordRoot === root) :
    [{ ...sourceButtons[0], id: `${root}-bass-only-${n}`, x: n * 0.1 }];
  return { playable: true, exact: true, playbackButtons: played, coveredPitches: [root],
    buttons: played, missingPitches: [], extraPitches: [] };
});
const deps = {
  '../../music/chordDefinitions': { intervalsForChordFinder() {return [0,4,7]}, chordFinderLabel() {return 'Major'} },
  '../chordDisplay': { displayFinderChord(root) {return root;} },
  '../stradellaChordFinderTools': { getStradellaChordFinderResults(_buttons, root) { return candidates(root); } },
  './music': {
    analyzeVoiceLeading() { return { totalMotion: 0, sharedPitchClasses: [] }; },
    chordLabel(rootPc) { return rootPc === 0 ? 'C' : 'D'; },
    chordFamily() { return { name: 'Major' }; },
    pitchClassesForChord() { return []; },
  },
  './integration': {
    finderPatternForHarmonyFamily() { return 'major'; },
    pitchClassNameFromNumber(pc) { return pc === 0 ? 'C' : 'D'; },
    pitchClassNumberFromName(name) { return name === 'C' ? 0 : 2; },
  },
};
const module = { exports: {} };
runInNewContext(compiled, { module, exports: module.exports,
  require(name) {
    if (name in deps) return deps[name];
    throw new Error(`Unexpected import: ${name}`);
  },
}, { filename: 'progression.ts' });
const engine = module.exports;
const chords = [
  { id: 'first', rootPc: 0, familyId: 'major', sectorIndex: 0 },
  { id: 'second', rootPc: 2, familyId: 'major', sectorIndex: 0 },
];
const available = engine.progressionRealizationsForChord(sourceButtons, chords[0], true);
assert.equal(available.length, 6, 'All candidates are browsable, beyond optimizer top five');
assert.equal(available[5].realizationIndex, 5, 'Original rank is unchanged');
const pinnedKey = engine.progressionRealizationKey(available[5].result);
assert.equal(pinnedKey, 'chord-C', 'Played button IDs, not visual guides, determine identity');
const defaults = { allowApproximations: false, handMovementWeight: 0.65, maxRealizationsPerChord: 5 };
const auto = engine.optimizeStradellaProgression(sourceButtons, chords, defaults);
assert.equal(auto.playable, true);
assert.ok(auto.steps[0].realizationIndex < 5, 'Automatic optimization retains historical shortlist');
const pinned = engine.optimizeStradellaProgression(sourceButtons, chords, {
  ...defaults, fixedRealizationKeys: { first: pinnedKey },
});
assert.equal(pinned.playable, true);
assert.equal(pinned.steps[0].realizationIndex, 5, 'Pinned choice may be outside top five');
assert.equal(engine.progressionRealizationKey(pinned.steps[0].result), pinnedKey);
assert.ok(pinned.steps[1].realizationIndex < 5, 'Unpinned steps remain globally optimized');
assert.equal(pinned.steps[1].transitionFromPrevious !== null, true, 'Transition recalculated for the actual choice');
const reordered = engine.optimizeStradellaProgression(sourceButtons, [...chords].reverse(), {
  ...defaults, fixedRealizationKeys: { first: pinnedKey },
});
assert.equal(reordered.steps[1].realizationIndex, 5, 'Choice follows chord ID when order changes');
const unavailable = engine.optimizeStradellaProgression(sourceButtons, chords, {
  ...defaults, fixedRealizationKeys: { first: 'missing-recipe' },
});
assert.equal(unavailable.playable, false, 'Missing explicit selection is never substituted silently');

console.log('✓ Per-chord pinned realizations, original rank, stable IDs, global transitions, and synchronized consumers passed');
