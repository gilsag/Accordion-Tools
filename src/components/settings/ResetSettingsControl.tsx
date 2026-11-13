import { useState } from "react";
import { useI18n } from "../../i18n/useI18n";

/** "Reset to defaults" with an inline confirmation step, so a single stray
 * click cannot discard the saved session. */
export function ResetSettingsControl({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <div className="button-row">
        <button type="button" className="small-button" onClick={() => setConfirming(true)}>
          {t("settings.resetDefaults")}
        </button>
      </div>
    );
  }
  return (
    <div className="reset-settings-confirm" role="group" aria-label={t("settings.resetDefaults")}>
      <p className="hint">{t("settings.resetConfirm")}</p>
      <div className="button-row">
        <button type="button" className="small-button danger-button" onClick={onReset}>
          {t("settings.resetConfirmYes")}
        </button>
        <button type="button" className="small-button" autoFocus onClick={() => setConfirming(false)}>
          {t("ui.cancel")}
        </button>
      </div>
    </div>
  );
}
