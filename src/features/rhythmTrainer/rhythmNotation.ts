/** ABC notation derived from the Rhythm Trainer playback events.
 * Stradella notation is symbolic: bass/counterbass buttons are written in the
 * lower bass-clef register; a chord button is a SINGLE note in the upper
 * register with its quality (M/m/7/d), not its sounding reed pitches.
 * The written octave is conventional and intentionally not a reed octave.
 */
import type { DiagramButton } from "../../types";
import { DEFAULT_STRADELLA_NOTATION, stradellaWrittenPitch, stradellaButtonToken, stradellaChordQuality,
  type StradellaNotationPreferences } from "../../notation/stradellaNotation";
import type { RhythmEvent, RhythmExercise } from "./rhythmModel";

type Voice = "treble" | "bass" | "chord" | "left";

const noteLetters: Record<string,string> = {
  C:"C", "C#":"^C", D:"D", "D#":"^D", E:"E", F:"F",
  "F#":"^F", G:"G", "G#":"^G", A:"A", "A#":"^A", B:"B",
};

function abcPitch(button: DiagramButton, voice: Voice): string {
  const pitch = button.kind.startsWith("chord-") ? button.chordRoot ?? button.pitchClass : button.pitchClass;
  const base = noteLetters[pitch ?? "C"] ?? "C";
  if (voice !== "treble") {
    return stradellaWrittenPitch(pitch ?? "C", button.kind.startsWith("chord-") ? "chord" : "bass");
  }
  const octave = button.soundOctave ?? button.octave ?? 4;
  if (octave < 4) return `${base}${",".repeat(4-octave)}`;
  if (octave > 4) return `${base.toLowerCase()}${"'".repeat(octave-5)}`;
  return base;
}
/** The bass library includes performance gate lengths (e.g. Tango 0.35 beat)
 * which are not conventional written note lengths. Quantize score-only gates
 * to a 1/16-beat grid; audio and the rhythm timeline retain exact timing. */
function scoreDuration(units: number) {
  return Math.max(1/16,Math.round(units*16)/16);
}
function abcDuration(units: number):string {
  if (Math.abs(units-1)<0.00001) return "";
  if (Number.isInteger(units)) return `${units}`;
  for (let den=2;den<=48;den++) {
    const num=Math.round(units*den);
    if(Math.abs(num/den-units)<0.00001) return `${num}/${den}`;
  }
  return `${units}`;
}
function isBassButton(button: DiagramButton) {
  return button.kind === "bass-root" || button.kind === "bass-counterbass";
}
function isChordButton(button: DiagramButton) {
  return button.kind.startsWith("chord-");
}
/** Combine the physical Stradella button root and its quality in one marker:
 * CM, Cm, G7, Bbd. This annotates the BASS staff, not the treble voice.
 * It labels the actual chord button rather than implying that one button
 * realizes every extension of the progression's underlying harmony.
 */
function buttonChordName(button: DiagramButton): string {
  return `${button.chordRoot ?? button.pitchClass ?? "C"}${stradellaChordQuality(button) ?? "M"}`;
}
function chordIdentity(button: DiagramButton | undefined): string | undefined {
  return button ? `${button.chordRoot ?? button.pitchClass ?? "C"}:${button.kind}` : undefined;
}
/** For bass-only arrangements (Cueca), label the *harmony*, since there is no
 * physical chord button to label. Keep the requested compact CM/Cm spelling. */
function harmonicName(exercise: RhythmExercise, bar: number): string {
  return (exercise.harmonicChordNames[bar] ?? "")
    .replace(/maj/g, "M").replace(/min/g, "m").replace(/dim/g, "d")
    .replace(/"/g, "");
}
function replaceQualityWithChordName(marked: string, chord: DiagramButton | undefined): string {
  if (!chord) return marked;
  return marked.replace(/^"\^[^"\n]+"/, `"^${buttonChordName(chord)}"`);
}
function token(event:RhythmEvent,voice:Voice,preferences:StradellaNotationPreferences,markChordQuality=true,duration=event.durationUnits) {
  const buttons=event.buttons.filter(b=>voice==="treble"? b.kind==="treble-note"
    :voice==="bass"? isBassButton(b):voice==="chord"?isChordButton(b):isBassButton(b)||isChordButton(b));
  const body = buttons.map(b=>abcPitch(b,voice));
  if (!body.length) return `x${abcDuration(event.durationUnits)}`;
  const pitch = body.length===1 ? body[0] : `[${body.join("")}]`;
  if (voice === "left") {
    const marked = stradellaButtonToken(buttons, preferences, markChordQuality ? null :
      (buttons.find(isChordButton)?.kind === "chord-major" ? "M" :
       buttons.find(isChordButton)?.kind === "chord-minor" ? "m" :
       buttons.find(isChordButton)?.kind === "chord-dominant7" ? "7" : "d"));
    return `${replaceQualityWithChordName(marked.token,buttons.find(isChordButton))}${abcDuration(duration)}`;
  }
  return `${markChordQuality&&voice==="chord" ? `"^${buttonChordName(buttons.find(isChordButton)!)}"` : ""}${pitch}${abcDuration(duration)}`;
}
function entriesForBar(exercise:RhythmExercise,bar:number,voice:Voice) {
  return exercise.events.filter(e=>e.bar===bar && (voice==="treble"?e.hand==="treble":e.hand==="bass")
    && e.buttons.some(b=>voice==="treble"?b.kind==="treble-note":voice==="bass"?isBassButton(b):voice==="chord"?isChordButton(b):isBassButton(b)||isChordButton(b)))
    .sort((a,b)=>a.startUnit-b.startUnit);
}
/** Prefer one conventional bass-clef line: bass then chord symbols, without
 * empty voice rests. Also handles bass+chord button attacks as a chord on one
 * onset. Return null only for genuinely overlapping note durations. */
function singleLeftBar(exercise:RhythmExercise,bar:number,preferences:StradellaNotationPreferences,priorKind?:string): {line:string|null;kind?:string} {
  let cursor=0;
  const pieces:string[]=[];
  let previousChordIdentity=priorKind;
  const entries=entriesForBar(exercise,bar,"left");
  const bassOnly = !entries.some(event => event.buttons.some(isChordButton));
  let labelledBassOnly = false;
  for (const [i,event] of entries.entries()) {
    const start=event.startUnit-bar*exercise.barUnits;
    if (start<cursor-0.00001) return {line:null,kind:previousChordIdentity};
    if (start>cursor+0.00001) pieces.push(`z${abcDuration(start-cursor)}`);
    const following=entries[i+1]?.startUnit;
    const nextStart=following===undefined?exercise.barUnits:following-bar*exercise.barUnits;
    const notated=scoreDuration(event.durationUnits);
    // Tiny overlaps caused by a performance gate (Tango chord .35 beat)
    // are not separate rhythmic voices. End the written symbol at the next
    // onset, but retain actual gate durations for playback. Real overlaps
    // longer than an eighth of a beat still use the polyphonic fallback.
    const overlap=start+notated-nextStart;
    if(overlap>1/8+0.00001) return {line:null,kind:previousChordIdentity};
    const duration=Math.min(notated,nextStart-start);
    if(duration<=0) return {line:null,kind:previousChordIdentity};
    const identity=chordIdentity(event.buttons.find(isChordButton));
    let note=token(event,"left",preferences,preferences.chordQualityLabels==="always" || (!!identity && identity!==previousChordIdentity),duration);
    if (bassOnly && !labelledBassOnly && harmonicName(exercise,bar)) {
      note=`"^${harmonicName(exercise,bar)}"${note}`;
      labelledBassOnly = true;
    }
    pieces.push(note);
    if(identity) previousChordIdentity=identity;
    cursor=start+duration;
  }
  if(cursor<exercise.barUnits-0.00001) pieces.push(`z${abcDuration(exercise.barUnits-cursor)}`);
  return {line:pieces.length?pieces.join(" "):`z${exercise.barUnits}`,kind:previousChordIdentity};
}
/** For rare overlapping left-hand events retain polyphony. Invisible spacers
 * avoid misleading extra rests caused by two simultaneous staff voices. */
function voiceBar(exercise: RhythmExercise, bar: number, voice: Voice,preferences:StradellaNotationPreferences) {
  let cursor=0;
  const pieces:string[]=[];
  let previousChordIdentity:string|undefined;
  for (const event of entriesForBar(exercise,bar,voice)) {
    const start=event.startUnit-bar*exercise.barUnits;
    if (start>cursor+0.00001) pieces.push(`${voice==="treble"?"z":"x"}${abcDuration(start-cursor)}`);
    if (start<cursor-0.00001) continue;
    const identity=chordIdentity(event.buttons.find(isChordButton));
    pieces.push(token(event,voice,preferences,preferences.chordQualityLabels==="always" || (!!identity && identity!==previousChordIdentity),
      voice==="treble"?event.durationUnits:scoreDuration(event.durationUnits)));
    if(identity) previousChordIdentity=identity;
    cursor=start+(voice==="treble"?event.durationUnits:scoreDuration(event.durationUnits));
  }
  if(cursor<exercise.barUnits-0.00001) pieces.push(`${voice==="treble"?"z":"x"}${abcDuration(exercise.barUnits-cursor)}`);
  return pieces.length?pieces.join(" "):`${voice==="treble"?"z":"x"}${exercise.barUnits}`;
}
export function rhythmExerciseToAbc(exercise:RhythmExercise, title="Bass–Treble Rhythm Trainer", preferences:StradellaNotationPreferences = DEFAULT_STRADELLA_NOTATION) {
  if (!exercise.barCount) return "";
  let lastChordKind:string|undefined;
  const singleLeftBars=Array.from({length:exercise.barCount},(_,bar)=>{
    const result=singleLeftBar(exercise,bar,preferences,lastChordKind);
    lastChordKind=result.kind;
    return result.line;
  });
  const needsPolyphony=singleLeftBars.some(bar=>bar===null);
  const measure=(voice:Voice)=>Array.from({length:exercise.barCount},(_,bar)=>{
    const separator=bar>0&&bar%4===0?"\n":" ";
    const contents=voice==="left"?singleLeftBars[bar] ?? "" : voiceBar(exercise,bar,voice,preferences);
    return `${separator}| ${contents}`;
  }).join("")+" |]";
  return [
    "X:1", `T:${title.replace(/[\r\n]/g," ")}`,
    needsPolyphony?"%%score 1 (2 3)":"%%score 1 2",
    "%%staffsep 64", "%%stretchlast 0",
    `M:${exercise.meter}`,`L:1/${exercise.meter.split("/")[1]}`,
    "K:C", "V:1 clef=treble",
    needsPolyphony?"V:2 clef=bass":"V:2 clef=bass",
    ...(needsPolyphony?["V:3 clef=bass"]:[]),
    `[V:1]${measure("treble")}`,
    `[V:2]${measure(needsPolyphony?"bass":"left")}`,
    ...(needsPolyphony?[`[V:3]${measure("chord")}`]:[]),
  ].join("\n");
}
