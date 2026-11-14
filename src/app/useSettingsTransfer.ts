import {
  parseSettingsDocumentFile,
  downloadSettingsDocument,
} from "../settings/settingsPersistence";
import {
  usePlatformNotices,
  usePlatformSettings,
  type PlatformLanguage,
} from "./platform/platformContexts";

/** The Settings panel's file commands: save, load and reset to defaults.
 * Gathering the values and setters from their owners, startup and the saved
 * session are the settings registry's job (`src/settings/settingsRegistry.ts`). */
export function useSettingsTransfer(t: PlatformLanguage["t"]) {
  const registry = usePlatformSettings();
  const { notify } = usePlatformNotices();

  /** Forgets the saved session and the saved language, then reloads so that
   * every owner starts again from the built-in and bundled defaults. */
  function resetSettingsToDefaults() {
    registry.forgetSession();
    window.location.reload();
  }

  /** Download format and filename remain compatible with v0.15.28. */
  function downloadCurrentSettings() {
    downloadSettingsDocument(registry.collect());
  }

  /** Imports a settings JSON file and applies it to the current session. */
  async function importSettingsFile(file: File | undefined) {
    if (!file) return;
    try {
      const settings = await parseSettingsDocumentFile(file);
      registry.applyImported(settings);
    } catch {
      notify(t("ui.invalidSettingsFile"));
    }
  }

  return {
    downloadCurrentSettings,
    importSettingsFile,
    resetSettingsToDefaults,
  };
}
