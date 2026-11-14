import { HelpTip } from "../../components/ui/HelpTip";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import type { ColorTheme, InterfaceTheme } from "../../types";
import {
  usePlatformAppearance,
  usePlatformLanguage,
  usePlatformShell,
} from "../platform/platformContexts";

/** Appearance options that apply to the Harmony workspace. */
export default function HarmonyAppearanceSection() {
  const { t } = usePlatformLanguage();
  const { colorTheme, setColorTheme, setShowStatusBar, showStatusBar } = usePlatformAppearance();
  const { interfaceDensity, interfaceTheme, setInterfaceDensity, setInterfaceTheme } =
    usePlatformShell();
  return (
    <>
      <SegmentedChoice
        label={
          <>
            {t("ui.interfaceDensity")} <HelpTip text={t("ui.interfaceDensityHelp")} />
          </>
        }
        ariaLabel={t("ui.interfaceDensity")}
        value={interfaceDensity}
        onChange={setInterfaceDensity}
        options={[
          { value: "compact", label: t("ui.compact") },
          { value: "comfortable", label: t("ui.comfortable") },
        ]}
      />
      <label>
        <span className="label-line">
          {t("ui.interfaceTheme")} <HelpTip text={t("ui.interfaceThemeHelp")} />
        </span>
        <select
          value={interfaceTheme}
          onChange={(event) => setInterfaceTheme(event.target.value as InterfaceTheme)}
        >
          <option value="system">{t("ui.themeSystem")}</option>
          <option value="light">{t("ui.themeLight")}</option>
          <option value="dark">{t("ui.themeDark")}</option>
        </select>
      </label>
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
