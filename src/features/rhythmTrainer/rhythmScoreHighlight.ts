/** Associate ABC.js-rendered note groups with the SAME RhythmEvent keys that
 * drive button and timeline highlights. ABC.js add_classes produces stable
 * voice (.abcjs-vN) classes; rest groups
 * are intentionally excluded. We never parse pitches from SVG text.
 *
 * A single Stradella voice is preferred by rhythmNotation.ts. Polyphonic
 * scores split bass and chord buttons into separate voices, so one rhythmic
 * event can legitimately illuminate notes in both voices.
 */
import { rhythmEventKey, type RhythmExercise, type RhythmEvent } from "./rhythmModel";

function sortedEvents(exercise: RhythmExercise, bar: number, hand: "bass" | "treble",
  predicate: (event:RhythmEvent)=>boolean = ()=>true) {
  return exercise.events.filter(e=>e.bar===bar && e.hand===hand && predicate(e))
    .sort((a,b)=>a.startUnit-b.startUnit);
}

export function mapRhythmScoreNotes(host: HTMLElement, exercise: RhythmExercise) {
  if (!host.querySelector("svg")) return false;
  host.querySelectorAll("svg .abcjs-note[data-rhythm-key]").forEach(node=>{
    node.removeAttribute("data-rhythm-key");
    node.classList.remove("rhythm-score-active");
  });
  const hasPolyphony=!!host.querySelector("svg .abcjs-v2.abcjs-note");
  const attach=(voice:number,events:RhythmEvent[])=>{
    // Follow the chronological note sequence within each voice. ABC.js may
    // reuse measure indices around automatic line breaks (mmN), so matching
    // individual measure classes fails on longer blues progressions.
    const nodes=Array.from(host.querySelectorAll<SVGGElement>(`svg .abcjs-note.abcjs-v${voice}`));
    // Prefer no highlight over incorrectly matching a note to a different
    // attack if ABC.js ever changes its engraving/voice representation.
    if (nodes.length!==events.length) return;
    nodes.forEach((node,i)=>node.setAttribute("data-rhythm-key",rhythmEventKey(events[i])));
  };
  const all=(hand:"bass"|"treble",predicate?: (event:RhythmEvent)=>boolean)=>
    Array.from({length:exercise.barCount},(_,bar)=>sortedEvents(exercise,bar,hand,predicate)).flat();
  attach(0,all("treble"));
  if(!hasPolyphony) attach(1,all("bass"));
  else {
    attach(1,all("bass",e=>e.buttons.some(b=>b.kind==="bass-root"||b.kind==="bass-counterbass")));
    attach(2,all("bass",e=>e.buttons.some(b=>b.kind.startsWith("chord-"))));
  }
  return true;
}

export function highlightRhythmScoreNotes(host:HTMLElement|null,activeKeys:ReadonlySet<string>) {
  if (!host) return;
  host.querySelectorAll<SVGElement>(".abcjs-note[data-rhythm-key]").forEach(node=>{
    node.classList.toggle("rhythm-score-active",activeKeys.has(node.getAttribute("data-rhythm-key")??""));
  });
}
