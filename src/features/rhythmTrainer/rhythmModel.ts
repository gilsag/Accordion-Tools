/** Rhythmic coordination engine. Coordinates are meter-denominator units:
 * quarters in 2/4, 3/4 and 4/4, eighths in 6/8. Never infer harmony from a
 * moving alternate-bass note: a bar's explicit harmonic root is authoritative.
 */
import type { DiagramButton } from "../../types";
import { chordProgressionSteps, makeBassPatternEvents, normalizedPatternSteps, patternBarCount, resolveRomanChord, type BassPatternDefinition, type ChordProgressionDefinition } from "../../tools/bassPatternPlayerTools";

export type RhythmMeter = "2/4" | "3/4" | "4/4" | "6/8";
export type RhythmEvent = {
  hand: "bass" | "treble";
  startUnit: number;
  durationUnits: number;
  bar: number;
  buttons: DiagramButton[];
  label: string;
  gain: number;
};
/** Stable marker identity shared by playback scheduling and timeline rendering. */
export function rhythmEventKey(event: RhythmEvent): string {
  return `${event.hand}:${event.bar}:${event.startUnit}:${event.durationUnits}`;
}

export type RhythmTemplate = {
  id: string;
  meter: RhythmMeter;
  label: string;
  difficulty: number;
  /** Explicit spans allow offbeat rhythms to preserve their rests. */
  notes: ReadonlyArray<readonly [start: number, duration: number]>;
};
const template = (id: string, meter: RhythmMeter, label: string, difficulty: number,
  notes: ReadonlyArray<readonly [number, number]>): RhythmTemplate => ({ id, meter, label, difficulty, notes });

export const RHYTHM_TEMPLATES: readonly RhythmTemplate[] = [
  template("T201", "2/4", "Sustained (2)", 1, [[0,2]]),
  template("T202", "2/4", "1+1", 1, [[0,1],[1,1]]),
  template("T203", "2/4", "Four eighths", 2, Array.from({length:4},(_,i)=>[i/2,0.5] as const)),
  template("T204", "2/4", "Offbeat eighths", 3, [[0.5,0.5],[1.5,0.5]]),
  template("T205", "2/4", "3+1 eighths", 3, [[0,1.5],[1.5,0.5]]),
  template("T206", "2/4", "1+3 eighths", 3, [[0,0.5],[0.5,1.5]]),
  template("T301", "3/4", "Sustained (3)", 1, [[0,3]]),
  template("T302", "3/4", "1+1+1", 1, [[0,1],[1,1],[2,1]]),
  template("T303", "3/4", "2+1", 1, [[0,2],[2,1]]),
  template("T304", "3/4", "1+2", 1, [[0,1],[1,2]]),
  template("T305", "3/4", "2 against 3", 3, [[0,1.5],[1.5,1.5]]),
  template("T306", "3/4", "Six eighths", 2, Array.from({length:6},(_,i)=>[i/2,0.5] as const)),
  template("T400", "4/4", "Sustained (4)", 1, [[0,4]]),
  template("T401", "4/4", "1+1+1+1", 1, [[0,1],[1,1],[2,1],[3,1]]),
  template("T402", "4/4", "2+2", 1, [[0,2],[2,2]]),
  template("T403", "4/4", "3+1", 2, [[0,3],[3,1]]),
  template("T404", "4/4", "Eight eighths", 2, Array.from({length:8},(_,i)=>[i/2,0.5] as const)),
  template("T405", "4/4", "Offbeat eighths", 3, [[0.5,0.5],[1.5,0.5],[2.5,0.5],[3.5,0.5]]),
  template("T601", "6/8", "Sustained (6)", 1, [[0,6]]),
  template("T602", "6/8", "Compound 3+3", 1, [[0,3],[3,3]]),
  template("T603", "6/8", "Hemiola 2+2+2", 3, [[0,2],[2,2],[4,2]]),
  template("T604", "6/8", "Six eighths", 2, Array.from({length:6},(_,i)=>[i,1] as const)),
  template("T605", "6/8", "Cueca bass echo", 1, [[1,1],[2,1],[4,1],[5,1]]),
  template("T606", "6/8", "1+2+1+2", 3, [[0,1],[1,2],[3,1],[4,2]]),
  template("T607", "6/8", "Four dotted eighths", 4, [[0,1.5],[1.5,1.5],[3,1.5],[4.5,1.5]]),
];

export const RHYTHM_BASS_STYLES: ReadonlyArray<{id:string; meter:RhythmMeter; label:string}> = [
  {id:"polka",meter:"2/4",label:"Polka"},
  {id:"march-2-4",meter:"2/4",label:"March (2/4)"},
  {id:"tango-habanera",meter:"2/4",label:"Tango / habanera"},
  {id:"oom-pah-pah",meter:"3/4",label:"Waltz"},
  {id:"mazurca",meter:"3/4",label:"Mazurca"},
  {id:"waltz-alternate-bass",meter:"3/4",label:"Alternate-bass waltz"},
  {id:"alternate-bass-polka",meter:"4/4",label:"Alternate bass polka"},
  {id:"march-4-4",meter:"4/4",label:"March (4/4)"},
  {id:"son-clave-3-2",meter:"4/4",label:"Son clave 3-2"},
  {id:"son-clave-2-3",meter:"4/4",label:"Son clave 2-3"},
  {id:"rumba-clave-3-2",meter:"4/4",label:"Rumba clave 3-2"},
  {id:"rumba-clave-2-3",meter:"4/4",label:"Rumba clave 2-3"},
  {id:"tarantella",meter:"6/8",label:"Tarantella"},
  {id:"cueca-abc-bass",meter:"6/8",label:"Cueca (ABC bass notes)"},
];

export const RHYTHM_METERS: readonly RhythmMeter[] = ["2/4","3/4","4/4","6/8"];
export function unitsPerBar(meter: RhythmMeter) { return meter === "6/8" ? 6 : Number(meter.split("/")[0]); }
export function unitsPerTempoBeat(meter: RhythmMeter) { return meter === "6/8" ? 3 : 1; }
export function millisecondsPerUnit(meter: RhythmMeter, dottedQuarterBpm: number) {
  return 60000 / Math.max(20, dottedQuarterBpm) / unitsPerTempoBeat(meter);
}

/** Choose a stable single physical position, prioritizing the fourth octave. */
export function rootTrebleButton(buttons: DiagramButton[], root: string): DiagramButton | undefined {
  return buttons.filter(b => b.kind === "treble-note" && b.pitchClass === root)
    .sort((a,b) => Math.abs((a.soundOctave ?? a.octave ?? 4)-4) - Math.abs((b.soundOctave ?? b.octave ?? 4)-4)
      || a.column - b.column || a.row - b.row)[0];
}

export type RhythmExerciseOptions = {
  meter: RhythmMeter;
  bassStyleId: string;
  trebleTemplateId: string;
  keyRoot: string;
  progression: ChordProgressionDefinition | undefined;
  bassButtons: DiagramButton[];
  trebleButtons: DiagramButton[];
  bassPatterns: BassPatternDefinition[];
};
export type RhythmExercise = {
  meter: RhythmMeter;
  barUnits: number;
  barCount: number;
  harmonicRoots: string[];
  harmonicLabels: string[];
  harmonicSymbols: string[];
  events: RhythmEvent[];
  missing: string[];
  selectedTemplate: RhythmTemplate | undefined;
};

export function buildRhythmExercise(options: RhythmExerciseOptions): RhythmExercise {
  const {meter,bassStyleId,trebleTemplateId,keyRoot,progression,bassButtons,trebleButtons,bassPatterns} = options;
  const barUnits=unitsPerBar(meter);
  const selectedTemplate = RHYTHM_TEMPLATES.find(t => t.id === trebleTemplateId && t.meter === meter);
  const style = RHYTHM_BASS_STYLES.find(p => p.id === bassStyleId && p.meter === meter);
  // Expand the SAME progression definitions, chord spellings and per-step bar counts
  // used by the Bass Pattern Player. Bass notes never redefine the harmony.
  const expanded = progression ? chordProgressionSteps(progression)
    .flatMap(step=>Array.from({length:step.bars},()=>step.symbol)) : [];
  const symbols = expanded;
  const harmonicChords = symbols.map(s=>resolveRomanChord(s,keyRoot,progression?.mode));
  const harmonicRoots = harmonicChords.map(chord=>chord.root);
  const harmonicLabels = harmonicChords.map((chord,i)=>`${chord.root} · ${symbols[i]}`);
  const missing:string[]=[];
  const events:RhythmEvent[]=[];
  if (!progression || !symbols.length) missing.push("No chord progression is available.");
  if (!selectedTemplate) missing.push("Treble rhythmic template is unavailable for this meter.");
  if (!style) missing.push("Bass style is unavailable for this meter.");
  const bassPattern = bassPatterns.find(p=>p.id===bassStyleId && p.meter===meter);
  if (style && bassStyleId !== "cueca-abc-bass" && !bassPattern) missing.push(`Missing bass pattern: ${bassStyleId}`);
  if (progression && bassPattern) {
    const cycleBars = patternBarCount(bassPattern);
    if (cycleBars === 1) {
      // Retain the established one-bar playback path exactly, including
      // rhythmic gates, accents and the shared physical button resolver.
      makeBassPatternEvents(bassButtons,bassPattern,progression,keyRoot,"simple").forEach(e=>{
        missing.push(...e.missing);
        if (e.buttons.length) events.push({hand:"bass",startUnit:e.startBeat,durationUnits:e.durationBeats,
          bar:e.barNumber-1,buttons:e.buttons,label:e.label,gain:e.gain});
      });
    } else {
      // Multi-bar patterns are PHRASES, not two measures of each harmony.
      // Align the phrase to the exercise's bar grid, and resolve each bar's
      // current harmony independently. Thus 3-2 remains 3-2 when chords
      // change every bar; the progression is never lengthened by cycleBars.
      const cycleSteps = normalizedPatternSteps(bassPattern);
      symbols.forEach((symbol,bar)=>{
        const offset=(bar%cycleBars)*barUnits;
        const perBarSteps=cycleSteps.filter(step=>step.t>=offset-1e-8 && step.t<offset+barUnits-1e-8)
          .map(step=>({t:Number((step.t-offset).toFixed(6)),
            d:Math.min(step.d, offset+barUnits-step.t), play:step.play,
            ...(step.accent?{accent:step.accent}:{}),...(step.tie?{tie:step.tie}:{})}));
        if(!perBarSteps.length) return;
        const perBarPattern: BassPatternDefinition={...bassPattern,bars:1,steps:perBarSteps,pattern:undefined};
        const perBarProgression: ChordProgressionDefinition={id:"rhythm-bar",name:"Rhythm bar",symbols:[symbol],mode:progression.mode};
        makeBassPatternEvents(bassButtons,perBarPattern,perBarProgression,keyRoot,"simple").forEach(e=>{
          missing.push(...e.missing);
          if(e.buttons.length) events.push({hand:"bass",startUnit:bar*barUnits+e.startBeat,
            durationUnits:e.durationBeats,bar,buttons:e.buttons,label:e.label,gain:e.gain});
        });
      });
    }
  }
  if (style?.id === "cueca-abc-bass") {
    // Exact source rhythm in public/abc/cueca-floreo-*.abc: z C,, C,, z C,, C,,
    // No chord buttons: the source bass voice contains bass notes only.
    harmonicRoots.forEach((root,bar)=>{
      const bass = bassButtons.find(b=>b.kind==="bass-root" && b.pitchClass===root);
      if (!bass) {missing.push(`Missing Stradella bass: ${root}`); return;}
      [1,2,4,5].forEach(slot=>events.push({hand:"bass",startUnit:bar*6+slot,durationUnits:1,bar,
        buttons:[bass],label:`${root} bass`,gain:1}));
    });
  }
  harmonicRoots.forEach((root,bar)=>{
    const treble = rootTrebleButton(trebleButtons,root);
    if (!treble) {missing.push(`Missing treble root: ${root}`); return;}
    selectedTemplate?.notes.forEach(([onset,duration])=> events.push({hand:"treble",
      startUnit:bar*barUnits+onset,durationUnits:duration,bar,buttons:[treble],label:root,gain:1}));
  });
  events.sort((a,b)=>a.startUnit-b.startUnit || (a.hand==="bass"?-1:1));
  return {meter,barUnits,barCount:harmonicRoots.length,harmonicRoots,harmonicLabels,harmonicSymbols:symbols,events,missing:[...new Set(missing)],selectedTemplate};
}
