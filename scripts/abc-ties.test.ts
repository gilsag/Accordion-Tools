import { readFileSync } from 'node:fs';
import { parseAbc, abcChordSymbols, abcEventsForStradellaSide, abcEventsForTrebleSide, abcPitchNames } from '../src/tools/abcPlayerTools';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const singleTie = parseAbc(`X:1\nT:Tie test\nL:1/8\nM:4/4\nK:C\nV:1\nA-A2 B2 |]`);
assert(singleTie.errors.length === 0, 'Expected no parse errors');
assert(singleTie.events.length === 2, `Expected 2 events, got ${singleTie.events.length}`);
assert(singleTie.events[0].notes[0]?.pitchClass === 'A', 'Expected first event to be A');
assert(Math.abs(singleTie.events[0].durationBeats - 1.5) < 0.0001, `Expected tied A to last 1.5 beats, got ${singleTie.events[0].durationBeats}`);

const chordTie = parseAbc(`X:1\nT:Chord tie test\nL:1/8\nM:4/4\nK:C\nV:1\n[CE]-[CE] G |]`);
assert(chordTie.errors.length === 0, 'Expected no parse errors for chord tie');
assert(chordTie.events.length === 2, `Expected 2 chord-tie events, got ${chordTie.events.length}`);
assert(Math.abs(chordTie.events[0].durationBeats - 1) < 0.0001, `Expected tied chord to last 1 beat, got ${chordTie.events[0].durationBeats}`);

const repeated = parseAbc(`X:1\nT:Repeat test\nL:1/4\nM:2/4\nK:C\n|: C D :| E F |]`);
assert(repeated.errors.length === 0, 'Expected no parse errors for repeat test');
assert(abcPitchNames(repeated.events).join(',') === 'C4,D4,E4,F4', 'Expected C D E F pitch set');
assert(repeated.events.length === 6, `Expected repeat expansion to produce 6 events, got ${repeated.events.length}`);

const bbKey = parseAbc(`X:1\nT:Bb key test\nL:1/4\nM:2/4\nK:Bb\nB E |]`);
assert(bbKey.errors.length === 0, 'Expected no parse errors for Bb key test');
assert(abcPitchNames(bbKey.events).includes('A#4'), 'Expected B in K:Bb to map to Bb/A#');
assert(abcPitchNames(bbKey.events).includes('D#4'), 'Expected E in K:Bb to map to Eb/D#');

const bellaCiao = parseAbc(readFileSync('public/abc/bella-ciao.abc', 'utf8'));
assert(bellaCiao.voiceIds.length === 2, `Expected Bella Ciao to have 2 voices, got ${bellaCiao.voiceIds.length}`);
assert(abcEventsForTrebleSide(bellaCiao.events).length > 0, 'Expected Bella Ciao treble events');
assert(abcChordSymbols(abcEventsForStradellaSide(bellaCiao.events)).includes('Am'), 'Expected Bella Ciao Stradella voice to include Am chord symbols');

const gorro = parseAbc(readFileSync('public/abc/un-gorro-de-lana.abc', 'utf8'));
assert(gorro.voiceIds.length === 2, `Expected Un Gorro de Lana to have 2 voices, got ${gorro.voiceIds.length}`);
assert(abcPitchNames(abcEventsForTrebleSide(gorro.events)).includes('A#4'), 'Expected Un Gorro de Lana treble to contain Bb/A# from key signature');
assert(abcChordSymbols(abcEventsForStradellaSide(gorro.events)).includes('B♭'), 'Expected Un Gorro de Lana Stradella voice to include B♭ chord symbols');

console.log('ABC parser tests passed');
