import { AboutPanel } from "./AboutPanel";
import { ResetSettingsControl } from "./ResetSettingsControl";
import { usePlatformLanguage } from "../platform/platformContexts";
import { useSettingsTransfer } from "../useSettingsTransfer";

/** About: app information, guides, and saving, loading and resetting settings. */
export default function AboutSection() {
  const { t } = usePlatformLanguage();
  const { downloadCurrentSettings, importSettingsFile, resetSettingsToDefaults } =
    useSettingsTransfer(t);
  return (
    <AboutPanel>
      <div className="button-row">
        <button className="small-button" onClick={downloadCurrentSettings}>
          {t("settings.saveJson")}
        </button>
        <label className="small-button file-button">
          {t("settings.loadJson")}
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              void importSettingsFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <p className="hint">
        {t("settings.jsonHint")} <code>public/default-settings.json</code>.
      </p>
      <p className="hint">{t("settings.autoSaveHint")}</p>
      <ResetSettingsControl onReset={resetSettingsToDefaults} />
    </AboutPanel>
  );
}
