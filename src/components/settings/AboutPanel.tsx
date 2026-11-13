import { lazy, Suspense, useState } from "react";
import type { ReactNode } from "react";

// The viewer bundles every user guide as raw Markdown (about 200 KB), so it is
// loaded only when someone opens the documentation.
const DocumentationViewer = lazy(() => import("./DocumentationViewer").then((module) => ({ default: module.DocumentationViewer })));
import { APP_INFO } from "../../config/appInfo";
import { useI18n } from "../../i18n/useI18n";

type AboutPanelProps = {
  /** Controls shown under the app information (settings file actions). */
  children?: ReactNode;
};

/** Compact app metadata shown in Settings → About. */
export function AboutPanel({ children }: AboutPanelProps) {
  const [docsOpen, setDocsOpen] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <p className="hint">
        <strong>{APP_INFO.name}</strong> {t("about.description")}
      </p>
      <p className="hint">
        {t("about.author")}:{" "}
        <a href={APP_INFO.authorGithubUrl} target="_blank" rel="noreferrer">
          {t("ui.contactSource")}
        </a>
      </p>
      <p className="hint">{t("about.version")}: {APP_INFO.version}</p>
      <p className="hint">
        {t("about.samples")}: <strong>La Melodiosa</strong> {t("ui.attribution")}{" "}
        {t("ui.sampleCreditLicense")}
      </p>
      <p className="hint">
        {t("about.license")}:{" "}
        <a href={APP_INFO.licenseUrl} target="_blank" rel="noreferrer">
          CC BY-NC 4.0
        </a>
      </p>
      <p className="hint">
        <button type="button" className="small-button" onClick={() => setDocsOpen(true)}> {t("about.openDocs")}</button>
      </p>
      <p className="hint">
        <a href={APP_INFO.readmeUrl} target="_blank" rel="noreferrer">
          {t("about.openReadme")}
        </a>
      </p>
      {children}
      {docsOpen && (
        <Suspense fallback={null}>
          <DocumentationViewer onClose={() => setDocsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
