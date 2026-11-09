import type { useRhythmTrainer } from "../../features/rhythmTrainer/useRhythmTrainer";
import type { InterfaceLanguage, TranslationKey } from "../../i18n/catalog";
import { bassPatternName } from "../../i18n/optionLabels";
import { RHYTHM_METERS, type RhythmMeter } from "../../features/rhythmTrainer/rhythmModel";
import { formatProgressionOptionLabel } from "../../app/controllerOptions";
import { FINDER_ROOT_OPTIONS } from "../../tools/scaleFinderTools";

const TEMPLATE_LABEL_KEYS: Record<string,TranslationKey> = {
  T201:"rhythm.template.sustain2", T203:"rhythm.template.fourEighths",
  T204:"rhythm.template.offbeats", T205:"rhythm.template.threePlusOneEighths",
  T206:"rhythm.template.onePlusThreeEighths",
  T301:"rhythm.template.sustain3", T305:"rhythm.template.twoAgainstThree", T306:"rhythm.template.sixEighths",
  T400:"rhythm.template.sustain4", T404:"rhythm.template.eightEighths", T405:"rhythm.template.offbeats",
  T601:"rhythm.template.sustain6", T602:"rhythm.template.compound",
  T603:"rhythm.template.hemiola", T604:"rhythm.template.sixEighths",
  T605:"rhythm.template.cuecaEcho", T607:"rhythm.template.dottedEighths",
};

/** The tool panel only presents the feature; state and transport live in its hook. */
export function RhythmTrainerControls({trainer,t,language}: {
  trainer: ReturnType<typeof useRhythmTrainer>;
  t:(key:TranslationKey)=>string;
  language:InterfaceLanguage;
}) {
  return <div className="section-content rhythm-trainer-controls">
    <p className="hint">{t("rhythm.intro")}</p>
    <label>{t("rhythm.meter")}
      <select value={trainer.meter} onChange={e=>trainer.changeMeter(e.target.value as RhythmMeter)}>
        {RHYTHM_METERS.map(m=><option key={m} value={m}>{m}</option>)}
      </select>
    </label>
    <label>{t("rhythm.bass")}
      <select value={trainer.bassStyleId} onChange={e=>trainer.changeBassStyle(e.target.value)}>
        {trainer.availableStyles.map(s=><option key={s.id} value={s.id}>{s.id==="cueca-abc-bass" ? t("rhythm.cueca") : bassPatternName(s.id,s.label,language)}</option>)}
      </select>
    </label>
    <label>{t("rhythm.treble")}
      <select value={trainer.trebleTemplateId} onChange={e=>trainer.changeTrebleTemplate(e.target.value)}>
        {trainer.availableTemplates.map(p=><option key={p.id} value={p.id}>{p.id} · {TEMPLATE_LABEL_KEYS[p.id] ? t(TEMPLATE_LABEL_KEYS[p.id]) : p.label}</option>)}
      </select>
    </label>
    <label>{t("rhythm.key")}
      <select value={trainer.keyRoot} onChange={e=>trainer.changeRoot(e.target.value)}>
        {FINDER_ROOT_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
    </label>
    <label>{t("rhythm.harmony")}
      <select value={trainer.progression?.id ?? ""} disabled={!trainer.chordProgressions.length}
        onChange={e=>trainer.changeProgression(e.target.value)}>
        {!trainer.chordProgressions.length && <option value="">{t("ui.noProgression")}</option>}
        {trainer.chordProgressions.map(p=><option key={p.id} value={p.id}>{formatProgressionOptionLabel(p,language)}</option>)}
      </select>
    </label>
    <div className="compact-control-grid">
      <label>{t("ui.tempo")}: {trainer.tempo} {trainer.meter==="6/8"?"♩. / min":"♩ / min"}
        <input type="range" min={30} max={180} step={1} value={trainer.tempo}
          onChange={e=>trainer.changeTempo(Number(e.target.value))}/>
      </label>
      <label>{t("rhythm.repeats")}
        <select value={trainer.repeats} onChange={e=>trainer.changeRepeats(Number(e.target.value))}>
          {[1,2,4].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </label>
    </div>
    <p className="hint">{t("rhythm.rootRule")}</p>
    <p className="hint">{t("rhythm.progression")}: {trainer.exercise.harmonicLabels.join(" – ")}</p>
    {trainer.exercise.missing.length>0 && <div className="result-card" role="alert">
      {trainer.exercise.missing.map(s=><p key={s}>{s}</p>)}
    </div>}
    <div className="playback-bar-buttons">
      <button className="small-button" type="button" disabled={!trainer.canPlay || trainer.playing || trainer.loading}
        onClick={()=>void trainer.play()}>{trainer.loading?t("ui.loadingSounds"):t("tools.play")}</button>
      <button className="small-button" type="button" onClick={trainer.stop}>{t("ui.stop")}</button>
    </div>
  </div>;
}
