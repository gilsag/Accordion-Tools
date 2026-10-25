import { useState } from "react";
import type { ReactNode } from "react";
import { DocumentationViewer } from "./DocumentationViewer";
import { APP_INFO } from "../../config/appInfo";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { useI18n } from "../../i18n/context";

type AboutPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

/** Compact app metadata shown in Settings → About. */
export function AboutPanel({ isOpen, onToggle, children }: AboutPanelProps) {
  const [docsOpen, setDocsOpen] = useState(false);
  const { t } = useI18n();
  return (
    <CollapsibleSection title={t("about.title")} isOpen={isOpen} onToggle={onToggle}>
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
      {docsOpen && <DocumentationViewer onClose={() => setDocsOpen(false)} />}
    </CollapsibleSection>
  );
}
