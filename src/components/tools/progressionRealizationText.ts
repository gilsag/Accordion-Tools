import { stradellaButtonFunction } from "../../i18n/musicTerms";
import { translate, type InterfaceLanguage } from "../../i18n/catalog";
import type { OptimizedProgressionPlan } from "../../tools/harmonyExplorer/progression";

export function realizationText(step: OptimizedProgressionPlan["steps"][number], locale: InterfaceLanguage = "en") {
  return step.result.playbackButtons
    .map((button) => {
      if (button.kind === "bass-counterbass") return `${button.pitchClass} ${translate(locale, "ui.counterbass")}`;
      if (button.kind === "bass-root") return `${button.pitchClass} ${translate(locale, "ui.bass")}`;
      const kind = button.kind
        .replace("chord-", "")
        .replace("dominant7", "7")
        .replace("diminished7", "°7");
      return `${button.chordRoot} ${locale !== "en" && locale !== "es" && (kind === "major" || kind === "minor") ? stradellaButtonFunction(kind, locale) : kind}`;
    })
    .join(" + ");
}
