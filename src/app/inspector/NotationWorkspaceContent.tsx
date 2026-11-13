import type { AppControllerModel } from "../useAppController";
import type { NotationKind } from "../../notation/notationSelection";
import { NotationScore } from "../../notation/NotationScore";
import { RhythmNotationPanel } from "./RhythmNotationInspector";
import { useI18n } from "../../i18n/useI18n";
import { bassPatternName, progressionName } from "../../i18n/optionLabels";

/** The only tool-to-score routing point. Views decide placement, not rendering;
 * features decide notes, not headers, export actions or panel structure. */
export function NotationWorkspaceContent({ kind, tools }: {
  kind: NotationKind;
  tools: AppControllerModel["tools"];
}) {
  const { t, language } = useI18n();
  const render = tools.renderNotationInto;
  const showTitle = tools.musicNotationIncludeTitle;
  if (kind === "rhythm") return <RhythmNotationPanel trainer={tools.rhythmTrainer}
    renderNotationInto={render} showTitle={showTitle} />;

  let title = "";
  let abc = "";
  let filename = "notation";
  let imported = false;
  switch (kind) {
    case "abc":
      title = tools.abcParseResult.title || "ABC notation";
      abc = tools.abcText;
      filename = `${title}-notation`;
      imported = true;
      break;
    case "bassPattern":
      title = `${tools.selectedBassPattern ? bassPatternName(tools.selectedBassPattern.id, tools.selectedBassPattern.name, language) : t("ui.bassPatternPlayer")} ${t("ui.over")} ${tools.selectedChordProgression ? progressionName(tools.selectedChordProgression.id, tools.selectedChordProgression.name, language) : t("ui.progression")}`;
      abc = tools.bassPatternRenderedNotationAbc;
      filename = `${tools.selectedBassPattern?.id ?? "bass-pattern"}-notation`;
      break;
    case "progression":
      title = t("ui.optimizedStradellaProgression");
      abc = tools.harmonyProgressionRenderedNotationAbc;
      filename = "optimized-stradella-progression-notation";
      break;
    case "recording":
      title = t("ui.recordedHarmonyProgression");
      abc = tools.harmonyRecordedProgressionNotationAbc;
      filename = "recorded-harmony-progression-notation";
      break;
    case "sequence":
      title = t("ui.sequenceNotation");
      abc = tools.sequenceRenderedNotationAbc;
      filename = "sequence-notation";
      break;
  }
  if (!abc.trim()) return null;
  return <NotationScore title={title} abc={abc} filename={filename} render={render}
    showTitle={showTitle} imported={imported}/>;
}
