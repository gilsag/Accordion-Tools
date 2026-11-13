import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StradellaNotationPreferences } from "../../notation/stradellaNotation";
import type { ToolSection } from "../../app/toolRegistry";
import type { SideButtonSettings } from "../../app/sideButtons";
import { stradellaButtonsFor, trebleButtonsFor } from "../../app/sideButtons";
import type { SoundOptions } from "../../sound";
import { audioClockNow, currentPlaybackGeneration, onStopAllSound, playButtonSound,
  prepareSamplesFor, samplesReadyFor, stopAllSound } from "../../sound";
import { audioTimelineOrigin, scheduleAtAudioOffset } from "../../audio/audioClock";
import { chordProgressionSteps, resolveRomanChord, type BassPatternDefinition, type ChordProgressionDefinition } from "../../tools/bassPatternPlayerTools";
import { treblePitchTargets, trebleButtonForTarget, type TreblePitchMode } from "./treblePitchPatterns";
import { buildRhythmExercise, DEFAULT_TREBLE_TEMPLATE_BY_METER, millisecondsPerUnit, RHYTHM_BASS_STYLES,
  RHYTHM_TEMPLATES, rhythmEventKey, type RhythmMeter } from "./rhythmModel";

export function useRhythmTrainer({sideButtonSettings,bassPatterns,chordProgressions,soundOptions,activeToolSection,stopOtherPlayback,notationPreferences}: {
  sideButtonSettings: SideButtonSettings;
  bassPatterns: BassPatternDefinition[];
  chordProgressions: ChordProgressionDefinition[];
  soundOptions: SoundOptions;
  activeToolSection: ToolSection;
  stopOtherPlayback: () => void;
  notationPreferences: StradellaNotationPreferences;
}) {
  const [meter,setMeter] = useState<RhythmMeter>("3/4");
  const [bassStyleId,setBassStyleId] = useState("oom-pah-pah");
  const [trebleTemplateId,setTrebleTemplateId] = useState(DEFAULT_TREBLE_TEMPLATE_BY_METER["3/4"]);
  const [treblePitchMode,setTreblePitchMode] = useState<TreblePitchMode>("root");
  const [keyRoot,setKeyRoot] = useState("C");
  const [progressionId,setProgressionId] = useState("i-iv-v-i");
  const [notationVisible,setNotationVisible] = useState(false);
  const progression = useMemo(()=>chordProgressions.find(p=>p.id===progressionId) ?? chordProgressions[0],
    [chordProgressions,progressionId]);
  const [tempo,setTempo] = useState(80);
  const [repeats,setRepeats] = useState(2);
  const [playing,setPlaying] = useState(false);
  const [loading,setLoading] = useState(false);
  const [positionUnit,setPositionUnit] = useState(0);
  const [activeIds,setActiveIds] = useState<string[]>([]);
  const [activeRhythmKeys,setActiveRhythmKeys] = useState<ReadonlySet<string>>(() => new Set());
  const timeouts = useRef<number[]>([]);
  const run = useRef(0);
  const activeCounts = useRef(new Map<string,number>());
  const activeRhythmCounts = useRef(new Map<string,number>());
  const stopTimers = useCallback(() => {
    run.current += 1;
    timeouts.current.forEach(id=>window.clearTimeout(id));
    timeouts.current=[];
    activeCounts.current.clear();
    activeRhythmCounts.current.clear();
    setActiveRhythmKeys(new Set());
    setPlaying(false);
    setLoading(false);
    setActiveIds([]);
    setPositionUnit(0);
  }, []);
  const stop = useCallback(() => { stopTimers(); stopAllSound(); },[stopTimers]);
  // Other transports call stopAllSound on start, so rhythm transport must
  // relinquish the clock and clear pending highlights without a second Stop.
  useEffect(()=>onStopAllSound(stopTimers),[stopTimers]);
  useEffect(()=>()=>{run.current+=1; timeouts.current.forEach(window.clearTimeout);},[]);
  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Switching tools must cancel a running player immediately.
    if(activeToolSection!=="rhythmTrainer" && (playing || loading)) stop();
  },[activeToolSection,playing,loading,stop]);

  const bassButtons=useMemo(()=>stradellaButtonsFor(sideButtonSettings),[sideButtonSettings]);
  const trebleButtons=useMemo(()=>trebleButtonsFor(sideButtonSettings,reference=>{
    const chords = progression ? chordProgressionSteps(progression)
      .map(step=>resolveRomanChord(step.symbol,keyRoot,progression.mode)) : [];
    const attacks=RHYTHM_TEMPLATES.find(t=>t.id===trebleTemplateId && t.meter===meter)?.notes.length??1;
    return chords.flatMap(chord=>treblePitchTargets(chord.root,chord.pattern,treblePitchMode,attacks)
      .flatMap(target=>{const b=trebleButtonForTarget(reference,target);return b?[b]:[];}));
  }),[sideButtonSettings,keyRoot,progression,treblePitchMode,trebleTemplateId,meter]);
  const exercise=useMemo(()=>buildRhythmExercise({meter,bassStyleId,trebleTemplateId,treblePitchMode,keyRoot,progression,
    bassButtons,trebleButtons,bassPatterns}),[meter,bassStyleId,trebleTemplateId,treblePitchMode,keyRoot,progression,bassButtons,trebleButtons,bassPatterns]);
  const availableStyles=RHYTHM_BASS_STYLES.filter(s=>s.meter===meter);
  const availableTemplates=RHYTHM_TEMPLATES.filter(t=>t.meter===meter);
  const canPlay=exercise.events.length>0 && exercise.missing.length===0 && soundOptions.enabled;
  const activeButtonIdSet=useMemo(()=>new Set(activeIds),[activeIds]);

  function changeMeter(next:RhythmMeter) {
    stop(); setMeter(next);
    setBassStyleId(RHYTHM_BASS_STYLES.find(s=>s.meter===next)?.id??"");
    setTrebleTemplateId(DEFAULT_TREBLE_TEMPLATE_BY_METER[next]);
  }
  function changeBassStyle(next:string) {stop();setBassStyleId(next);}
  function changeTrebleTemplate(next:string) {stop();setTrebleTemplateId(next);}
  function changeTreblePitchMode(next:TreblePitchMode) {stop();setTreblePitchMode(next);}
  function changeRoot(next:string) {stop();setKeyRoot(next);}
  function changeProgression(next:string) {stop();setProgressionId(next);}
  function changeTempo(next:number) {stop();setTempo(next);}
  function changeRepeats(next:number) {stop();setRepeats(next);}

  const play=async () => {
    if(!canPlay) return;
    stopOtherPlayback(); // ABC, Bass Pattern, sound-engine players, and other running notes.
    stopTimers();
    const runId=run.current;
    const generation=currentPlaybackGeneration();
    const allButtons=exercise.events.flatMap(e=>e.buttons);
    if(!samplesReadyFor(allButtons,soundOptions)) {
      setLoading(true);
      await prepareSamplesFor(allButtons,soundOptions);
      if (run.current!==runId || generation!==currentPlaybackGeneration()) return;
      setLoading(false);
    }
    if(run.current!==runId) return;
    setPlaying(true);
    const msUnit=millisecondsPerUnit(meter,tempo);
    const cycleUnits=exercise.barCount*exercise.barUnits;
    const ports={now:audioClockNow,push:(id:number)=>{timeouts.current.push(id);}};
    const origin=audioTimelineOrigin(ports.now);
    const addIds=(ids:string[])=>{
      ids.forEach(id=>activeCounts.current.set(id,(activeCounts.current.get(id)??0)+1));
      setActiveIds([...activeCounts.current.keys()]);
    };
    const removeIds=(ids:string[])=>{
      ids.forEach(id=>{const remaining=(activeCounts.current.get(id)??0)-1;
        if(remaining<=0) activeCounts.current.delete(id); else activeCounts.current.set(id,remaining);});
      setActiveIds([...activeCounts.current.keys()]);
    };
    const changeRhythmKey=(key:string,delta:number)=>{
      const next=(activeRhythmCounts.current.get(key)??0)+delta;
      if(next<=0) activeRhythmCounts.current.delete(key);
      else activeRhythmCounts.current.set(key,next);
      setActiveRhythmKeys(new Set(activeRhythmCounts.current.keys()));
    };
    for(let cycle=0;cycle<repeats;cycle++) {
      for(const event of exercise.events) {
        const offsetMs=(cycle*cycleUnits+event.startUnit)*msUnit;
        const durationMs=event.durationUnits*msUnit*soundOptions.articulation;
        const eventIds=event.buttons.map(b=>b.id);
        const eventKey=rhythmEventKey(event);
        scheduleAtAudioOffset(ports,origin,offsetMs,
          when=>{if(run.current!==runId)return;
            const opts={...soundOptions,volume:Math.min(1,soundOptions.volume*event.gain)};
            event.buttons.forEach(button=>playButtonSound(button,opts,{at:when,durationMs}));},
          ()=>{if(run.current!==runId)return;
            setPositionUnit(event.startUnit);
            addIds(eventIds);
            changeRhythmKey(eventKey,1);
            ports.push(window.setTimeout(()=>{
              if(run.current===runId) {removeIds(eventIds);changeRhythmKey(eventKey,-1);}
            },Math.max(30,durationMs)));
          });
      }
    }
    ports.push(window.setTimeout(()=>{if(run.current===runId)stopTimers();},
      repeats*cycleUnits*msUnit+170));
  };
  return {notationPreferences,meter,changeMeter,bassStyleId,changeBassStyle,trebleTemplateId,changeTrebleTemplate,
    treblePitchMode,changeTreblePitchMode,keyRoot,changeRoot,
    progressionId,progression,chordProgressions,changeProgression,notationVisible,setNotationVisible,
    tempo,changeTempo,repeats,changeRepeats,
    availableStyles,availableTemplates,exercise,trebleButtons,bassButtons,activeButtonIdSet,
    playing,loading,positionUnit,activeRhythmKeys,canPlay,play,stop};
}
