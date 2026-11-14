import { useI18n } from "../../i18n/useI18n";
import { useShareLink } from "./shareLinkContext";

/** Copies a link to the instrument and this Finder's choice. */
export function CopyLinkButton() {
  const { t } = useI18n();
  const { copyShareLink } = useShareLink();
  return (
    <button type="button" className="small-button" onClick={() => void copyShareLink()}>
      {t("ui.copyLink")}
    </button>
  );
}
