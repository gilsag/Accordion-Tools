import { rhythmEventKey, type RhythmExercise } from "../../features/rhythmTrainer/rhythmModel";
import type { TranslationKey } from "../../i18n/catalog";

/** A timing view, not a music staff: each lane shows each note's attack and duration.
 * 6/8 emphasizes beat groups 1–3 and 4–6 while retaining six eighth slots. */
export function RhythmTrainerTimeline({exercise,positionUnit,playing,activeRhythmKeys,t}: {
  exercise:RhythmExercise;positionUnit:number;playing:boolean;activeRhythmKeys:ReadonlySet<string>;
  t:(key:TranslationKey)=>string;
}) {
  const unit=exercise.barUnits;
  return <section className="rhythm-timeline" aria-label={t("rhythm.timeline")}>
    <div className="rhythm-timeline-title"><strong>{t("rhythm.timeline")}</strong>
      <span>{exercise.meter} · {t("rhythm.pitchSource")}</span></div>
    <div className="rhythm-timeline-bars">
      {exercise.harmonicLabels.map((root,bar)=><div className={`rhythm-timeline-bar ${playing && Math.floor(positionUnit/unit)===bar?"active":""}`} key={bar}>
        <div className="rhythm-bar-header">{t("rhythm.bar")} {bar+1} · {root}</div>
        <div className="rhythm-beat-ruler">
          {Array.from({length:unit},(_,i)=><div key={i} className={(exercise.meter==="6/8"&&(i===0||i===3))?"rhythm-strong-beat":""}>{i+1}</div>)}
        </div>
        {(["bass","treble"] as const).map(hand=><div key={hand} className="rhythm-lane">
          <span className="rhythm-lane-caption">{hand==="bass"?t("rhythm.left"):t("rhythm.right")}</span>
          <div className="rhythm-lane-grid" style={{"--rhythm-slots":unit} as React.CSSProperties}>
            {Array.from({length:unit},(_,i)=><i key={i} style={{left:`${i/unit*100}%`}}/>)}
            {exercise.events.filter(e=>e.bar===bar&&e.hand===hand).map((e,i)=><div key={i}
              className={`rhythm-event rhythm-event-${hand}${activeRhythmKeys.has(rhythmEventKey(e)) ? " is-sounding" : ""}`}
              data-event-key={rhythmEventKey(e)} data-active={activeRhythmKeys.has(rhythmEventKey(e)) ? "true" : "false"}
              title={`${e.label} · ${e.durationUnits} ${t("rhythm.durationUnits")}`}
              style={{left:`${((e.startUnit-bar*unit)/unit)*100}%`,width:`${(e.durationUnits/unit)*100}%`}}>
              <span className="rhythm-attack-dot" aria-hidden="true">●</span>
              {e.durationUnits/unit>=0.26 && <span className="rhythm-duration-value" aria-hidden="true">{e.durationUnits}</span>}
            </div>)}
          </div>
        </div>)}
      </div>)}
    </div>
    <p className="rhythm-timeline-note">{t("rhythm.legend")}</p>
  </section>;
}
