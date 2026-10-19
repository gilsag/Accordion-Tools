import { useState } from "react";
import type { ReactNode } from "react";
import { DocumentationViewer } from "./DocumentationViewer";
import { APP_INFO } from "../../config/appInfo";
import { CollapsibleSection } from "../ui/CollapsibleSection";

type AboutPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

/** Compact app metadata shown in Settings → About. */
export function AboutPanel({ isOpen, onToggle, children }: AboutPanelProps) {
  const [docsOpen, setDocsOpen] = useState(false);
  return (
    <CollapsibleSection title="About" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        <strong>{APP_INFO.name}</strong> is a browser-based diagram and exploration tool for
        Stradella bass, chromatic-button treble, piano treble, and harmonic relationships.
      </p>
      <p className="hint">
        Author:{" "}
        <a href={APP_INFO.authorGithubUrl} target="_blank" rel="noreferrer">
          gilsag on GitHub
        </a>
      </p>
      <p className="hint">Version: {APP_INFO.version}</p>
      <p className="hint">
        Accordion samples: <strong>La Melodiosa</strong> by Petri Pohjanmies
        (2026), used under CC-BY.
      </p>
      <p className="hint">
        License:{" "}
        <a href={APP_INFO.licenseUrl} target="_blank" rel="noreferrer">
          CC BY-NC 4.0
        </a>
      </p>
      <p className="hint">
        <button type="button" className="small-button" onClick={() => setDocsOpen(true)}>Open documentation</button>
      </p>
      <p className="hint">
        <a href={APP_INFO.readmeUrl} target="_blank" rel="noreferrer">
          Open README.md
        </a>
      </p>
      {children}
      {docsOpen && <DocumentationViewer onClose={() => setDocsOpen(false)} />}
    </CollapsibleSection>
  );
}
