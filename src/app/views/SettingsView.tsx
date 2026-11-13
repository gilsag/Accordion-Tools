import { Fragment } from "react";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { SUPPORTED_LANGUAGES, type InterfaceLanguagePreference } from "../../i18n/catalog";
import { SETTINGS_SECTIONS } from "../settingsSections";
import type { AppControllerModel } from "../useAppController";

/** The Settings panel: the language choice, then one collapsible section per
 * entry of SETTINGS_SECTIONS that applies to the current workspace. All state
 * and commands originate in the controller.
 */
export function SettingsView({ model }: { model: AppControllerModel["settings"] }) {
  const { activeSettingsSection, changeLanguage, languagePreference, t, toggleSettingsSection, workspaceMode } = model;
  return (
    <>
      <section className="control-section">
        <div className="section-content">
          <label>
            {t("settings.language")}
            <select value={languagePreference} onChange={(event) => changeLanguage(event.target.value as InterfaceLanguagePreference)}>
              <option value="auto">{t("settings.languageAuto")}</option>
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {SETTINGS_SECTIONS
        .filter(({ workspace }) => workspace === "both" || workspace === workspaceMode)
        .map(({ id, titleKey, introKey, Component }) => (
          <Fragment key={id}>
            {introKey && <p className="hint" style={{ marginBottom: 10 }}>{t(introKey)}</p>}
            <CollapsibleSection
              title={t(titleKey)}
              isOpen={activeSettingsSection === id}
              onToggle={() => toggleSettingsSection(id)}
            >
              <Component model={model} />
            </CollapsibleSection>
          </Fragment>
        ))}
    </>
  );
}
