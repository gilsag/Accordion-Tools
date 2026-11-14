import { useRef } from "react";
import type { DownloadFormat } from "../../types";
import type { useLanguageSettings } from "../../settings/useLanguageSettings";
import { DownloadIcon, ResetIcon } from "./toolbarIcons";
import { DOWNLOAD_FORMATS, useDismissibleMenu } from "./toolbarMenuSupport";

type Translate = ReturnType<typeof useLanguageSettings>["t"];

/** Clear the current work; restore the tool's defaults where the tool has
 * any (the Harmony workspace and the Stradella Chord Finder). */
export function ResetMenu({
  t,
  canRestoreToolDefaults,
  onClearWork,
  onRestoreToolDefaults,
}: {
  t: Translate;
  canRestoreToolDefaults: boolean;
  onClearWork: () => void;
  onRestoreToolDefaults: () => void;
}) {
  const menuRef = useRef<HTMLDetailsElement | null>(null);
  useDismissibleMenu(menuRef);
  return (
    <details ref={menuRef} className="reset-menu">
      <summary
        className="topbar-button reset-button topbar-labelled-icon-button"
        title={t("ui.resetScope")}
      >
        <ResetIcon />
        <span className="topbar-label">{t("ui.reset")}</span> <span aria-hidden="true">▾</span>
      </summary>
      <div className="reset-menu-options">
        <button
          type="button"
          onClick={(event) => {
            onClearWork();
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
        >
          {t("ui.clearCurrentWork")}
        </button>
        {canRestoreToolDefaults && (
          <button
            type="button"
            onClick={(event) => {
              onRestoreToolDefaults();
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {t("ui.restoreToolDefaults")}
          </button>
        )}
      </div>
    </details>
  );
}

/** One menu for both formats; the last one used is remembered (it is also
 * the format of "Download all diagrams (ZIP)") and listed first. */
export function DownloadMenu({
  t,
  downloadFormat,
  onDownload,
}: {
  t: Translate;
  downloadFormat: DownloadFormat;
  onDownload: (format: DownloadFormat) => void;
}) {
  const menuRef = useRef<HTMLDetailsElement | null>(null);
  useDismissibleMenu(menuRef);
  return (
    <details ref={menuRef} className="reset-menu export-menu">
      <summary
        className="topbar-button download-button topbar-labelled-icon-button"
        title={t("ui.download")}
      >
        <DownloadIcon />
        <span className="topbar-label">{t("ui.download")}</span> <span aria-hidden="true">▾</span>
      </summary>
      <div className="reset-menu-options">
        {[downloadFormat, ...DOWNLOAD_FORMATS.filter((format) => format !== downloadFormat)].map(
          (format) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                if (menuRef.current) menuRef.current.open = false;
                onDownload(format);
              }}
            >
              {t("ui.downloadKind", { kind: format.toUpperCase() })}
            </button>
          ),
        )}
      </div>
    </details>
  );
}
