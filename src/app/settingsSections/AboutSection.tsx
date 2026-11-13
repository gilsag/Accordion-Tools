import { AboutPanel } from "../../components/settings/AboutPanel";
import { ResetSettingsControl } from "../../components/settings/ResetSettingsControl";
import type { AppControllerModel } from "../useAppController";

/** The slice of the controller model this section reads. */
type AboutSectionModel = Pick<AppControllerModel["settings"],
  "downloadCurrentSettings" | "importSettingsFile" | "resetSettingsToDefaults" | "t">;

/** About: app information, guides, and saving, loading and resetting settings. */
export default function AboutSection({ model }: { model: AboutSectionModel }) {
  const {
    downloadCurrentSettings, importSettingsFile, resetSettingsToDefaults, t,
  } = model;
  return (
    <AboutPanel>
      <div className="button-row">
        <button
          className="small-button"
          onClick={downloadCurrentSettings}
        >
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
