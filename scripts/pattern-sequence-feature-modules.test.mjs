/** Phase 3d: behavioral contracts at the Bass Pattern and Sequence boundaries.
 * Real notation/engine/sound algorithms are covered by their existing tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const read = (p) => readFileSync(p, "utf8");
const app = read("src/App.tsx");
for (const marker of ["useBassPatternState(t)", "useBassPatternResults({", "useSequenceState()", "useSequenceResults(sequenceSteps, buttons)"]) {
  assert.ok(app.includes(marker), `App delegates to ${marker}`);
}
assert.doesNotMatch(app, /const \[bassPatternId,\s*setBassPatternId\]\s*=\s*useState/);
assert.doesNotMatch(app, /const \[sequenceSteps,\s*setSequenceSteps\]\s*=\s*useState/);
for (const marker of ["function scheduleBassPatternPlayback()", "function stopBassPatternPlayback()", "function playRecordedSequence()", "function exportSelectedBassPattern()", "renderNotationInto("]) {
  assert.ok(app.includes(marker), `Application retains orchestration: ${marker}`);
}

function hooks() {
  const slots = []; const effects = []; let index = 0;
  return {
    effects,
    reset() { index = 0; },
    react: {
      useState(initial) {
        const i = index++;
        if (!slots[i]) {
          const entry = { value: typeof initial === "function" ? initial() : initial };
          entry.set = (next) => { entry.value = typeof next === "function" ? next(entry.value) : next; };
          slots[i] = entry;
        }
        return [slots[i].value, slots[i].set];
      },
      useMemo(factory) { return factory(); },
      useEffect(callback) { effects.push(callback); },
      useRef(value) { const i = index++; if (!slots[i]) slots[i] = { current: value }; return slots[i]; },
      useCallback(callback) { return callback; },
    },
  };
}
function load(file, react, imports, globals={}) {
  const compiled = ts.transpileModule(read(file).replaceAll("import.meta.env.BASE_URL", '"/"'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod={exports:{}};
  runInNewContext(compiled, {
    ...globals, module:mod, exports:mod.exports,
    require(name) { if (name === "react") return react; if (name in imports) return imports[name]; throw new Error(`Unexpected dependency ${name}`); },
  }, {filename:file});
  return mod.exports;
}
const bassHooks=hooks();
const storage=new Map();
const writes=[]; const store={
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key,value) { writes.push([key,value]); storage.set(key,value); },
};
const validPattern={id:"custom-x",name:"New",meter:"4/4",tags:["custom"],pattern:">B C A C"};
const calls=[];
const engine={
  validateBassPatternLibrary(library) { calls.push(["validate",library]); return library.patterns.some((p)=>!p.id) ? ["missing id"] : []; },
  makeBassPatternEvents(...args) { calls.push(["events", args]); return [{buttons:[args[0][0]],startBeat:0,durationBeats:1}]; },
  totalBassPatternBeats(events) { calls.push(["beats", events]); return events.length ? 8 : 0; },
  bassPatternMissingItems(events) { calls.push(["missing",events]); return ["D♭"]; },
};
const fetches=[];
const patterns={version:2,legend:"Built-in legend",patterns:[{id:"polka",name:"Polka",meter:"4/4",pattern:">B C"}]};
const progressions=[{id:"i-iv-v-i",name:"I-IV-V-I",chords:["C","F","G","C"]}];
const fetch=async (url) => {
  fetches.push(url);
  return {ok:true,json:async()=>url.includes("bass-patterns/")?patterns:progressions};
};
const bass=load("src/features/bassPatternPlayer/useBassPatternPlayer.ts",bassHooks.react,{
  "../../tools/bassPatternPlayerTools":engine,
},{window:{localStorage:store},fetch});
const t=(key,params)=>key+(params ? `:${Object.values(params).join(",")}` : "");
function renderBass() {bassHooks.reset();return bass.useBassPatternState(t);}
let state=renderBass();
for(const [key,value] of Object.entries({bassPatternId:"polka",chordProgressionId:"i-iv-v-i",bassPatternRoot:"C",bassPatternTempoBpm:80,bassPatternChordVoicing:"simple",bassPatternBarsPerChord:2,bassPatternLoopMode:"fixed",bassPatternLoopCount:2,bassPatternExportFormat:"abc",bassPatternEditorExpanded:false,bassPatternRenderedNotationVisible:false,bassPatternPlaybackState:"stopped"})) assert.equal(state[key],value,key);
assert.equal(state.bassPatternDefinitions.length,0);
assert.equal(state.bassPatternEditorMessage,"");
assert.equal(state.bassPatternActiveButtonIds.length,0);
assert.equal(state.bassPatternNotationRef.current,null);
assert.equal(bassHooks.effects.length,1);
const setter=state.setBassPatternTempoBpm;
bassHooks.effects[0]();
await new Promise((resolve)=>setImmediate(resolve));
state=renderBass();
assert.strictEqual(state.setBassPatternTempoBpm,setter,"React setter preserved");
assert.equal(state.bassPatternDefinitions[0].legend,"Built-in legend","Library legend inheritance");
assert.equal(state.chordProgressionDefinitions[0].id,"i-iv-v-i");
assert.deepEqual(fetches,["/bass-patterns/bass-patterns.json","/chord-progressions/chord-progressions.json"]);

state.setBassPatternEditorText(JSON.stringify(validPattern));
state=renderBass();
assert.equal(state.bassPatternEditorErrors.length,0);
state.saveCustomBassPattern(); state=renderBass();
assert.equal(state.bassPatternId,"custom-x");
assert.equal(state.customBassPatternDefinitions.length,1);
assert.equal(state.bassPatternEditorMessage,"ui.savedCustomPattern:New");
assert.equal(writes.at(-1)[0],"accordionTools.customBassPatterns.v2");
assert.equal(JSON.parse(writes.at(-1)[1])[0].id,"custom-x");
state.loadSelectedPatternIntoEditor(); state=renderBass();
assert.equal(JSON.parse(state.bassPatternEditorText).id,"custom-x");
state.removeSelectedCustomBassPattern(); state=renderBass();
assert.equal(state.customBassPatternDefinitions.length,0);
assert.equal(state.bassPatternId,"polka","Deletion returns to first built-in pattern");
assert.equal(state.bassPatternEditorMessage,"ui.removedCustomPattern");
state.setBassPatternEditorText("not JSON"); state=renderBass();
assert.equal(state.bassPatternEditorErrors.length,1,"JSON validation retained");
state.saveCustomBassPattern(); state=renderBass();
assert.ok(state.bassPatternEditorMessage.includes("JSON") || state.bassPatternEditorMessage.includes("token"), "Original syntax error shown to user");

const physical=[{id:"bass-1",kind:"bass-root"},{id:"chord-1",kind:"chord-major"}];
const input={bassPatternDefinitions:state.bassPatternDefinitions,bassPatternId:state.bassPatternId,
 chordProgressionDefinitions:state.chordProgressionDefinitions,chordProgressionId:state.chordProgressionId,
 buttons:physical,side:"stradella",bassPatternRoot:"C",bassPatternChordVoicing:"simple",
 bassPatternBarsPerChord:2,bassPatternActiveButtonIds:["bass-1"]};
let result=bass.useBassPatternResults(input);
assert.strictEqual(result.selectedBassPattern,state.bassPatternDefinitions[0]);
assert.equal(result.bassPatternEvents[0].buttons[0],physical[0],"Physical button identities preserved");
assert.equal(result.bassPatternTotalBeats,8);
assert.equal(result.bassPatternMissingText,"D♭");
assert.ok(result.bassPatternActiveButtonIdSet.has("bass-1"));
assert.equal(calls.find(([type])=>type==="events")[1][4],"simple");
result=bass.useBassPatternResults({...input,side:"treble"});
assert.equal(result.bassPatternEvents.length,0,"Treble cannot generate Stradella accompaniment");

// Existing custom definitions are loaded before asynchronous public patterns.
const restored=hooks();
storage.set("accordionTools.customBassPatterns.v2",JSON.stringify([validPattern]));
const restoredBass=load("src/features/bassPatternPlayer/useBassPatternPlayer.ts",restored.react,{
 "../../tools/bassPatternPlayerTools":engine,
},{window:{localStorage:store},fetch});
assert.equal(restoredBass.useBassPatternState(t).customBassPatternDefinitions[0].id,"custom-x");

const seqHooks=hooks();
const sequence=load("src/features/sequences/useSequenceState.ts",seqHooks.react,{
 "../../tools/sequenceTools":{getSequenceStepsWithButtons(steps,buttons){return steps.map((s)=>({...s,button:buttons.find(b=>b.id===s.id)})).filter((s)=>s.button);}},
});
function renderSeq() { seqHooks.reset(); return sequence.useSequenceState(); }
let seq=renderSeq();
for(const [key,value] of Object.entries({isRecordingSequence:false,sequenceDisplayMode:"numbers-and-curved-arrows",sequenceColorPreset:"red",sequenceThickness:3.2,sequenceArrowheadSize:4,sequenceNumberFontSize:10,sequenceNumberColorPreset:"red",sequenceNumberPosition:"above",sequenceRenderedNotationVisible:false})) assert.equal(seq[key],value,key);
seq.appendRecordedButton("bass-1");seq.appendRecordedButton("chord-1");seq.appendRecordedButton("bass-1");
seq=renderSeq();
assert.equal(JSON.stringify(seq.sequenceSteps),JSON.stringify([{id:"bass-1",step:1},{id:"chord-1",step:2},{id:"bass-1",step:3}]));
const selected=sequence.useSequenceResults(seq.sequenceSteps,physical);
assert.strictEqual(selected[0].button,physical[0]);
assert.strictEqual(selected[1].button,physical[1]);
assert.strictEqual(selected[2].button,physical[0]);
seq.clearSequence(); assert.equal(renderSeq().sequenceSteps.length,0);
console.log("✓ Bass Pattern library/editor/persistence/results and Sequence recording/identity contracts passed");
