import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { ColorTheme } from "../../types";
import {
  usePlatformAppearance,
  usePlatformLanguage,
  usePlatformShell,
} from "../platform/platformContexts";

/** Appearance options that apply to the Harmony workspace. */
export default function HarmonyAppearanceSection() {
  const { t } = usePlatformLanguage();
  const { colorTheme, setColorTheme, setShowStatusBar, showStatusBar } = usePlatformAppearance();
  const { interfaceDensity, setInterfaceDensity } = usePlatformShell();
  return (
    <>
      <SegmentedChoice
        label={
          <>
            {t("ui.interfaceDensity")} <HelpTip text={t("ui.interfaceDensityHelp")} />
          </>
        }
        value={interfaceDensity}
        onChange={setInterfaceDensity}
        options={[
          { value: "compact", label: t("ui.compact") },
          { value: "comfortable", label: t("ui.comfortable") },
        ]}
      />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={showStatusBar}
          onChange={(event) => setShowStatusBar(event.target.checked)}
        />
        <span>{t("ui.showStatusBar")}</span>
      </label>
      <label>
        {t("ui.colorTheme")}
        <select
          value={colorTheme}
          onChange={(event) => setColorTheme(event.target.value as ColorTheme)}
        >
          <option value="default">{t("ui.defaultBlue")}</option>
          <option value="classic">{t("ui.classicInk")}</option>
          <option value="pastel">{t("ui.pastel")}</option>
          <option value="warm">{t("ui.warmCream")}</option>
          <option value="contrast">{t("ui.highContrast")}</option>
          <option value="print">{t("ui.printGrayscale")}</option>
        </select>
      </label>
    </>
  );
}
