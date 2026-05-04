import type { ReactNode } from "react";
import { APP_INFO } from "../../config/appInfo";
import { CollapsibleSection } from "../ui/CollapsibleSection";

type AboutPanelProps = {
  isOpen: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

/** Compact app metadata shown in Settings → About. */
export function AboutPanel({ isOpen, onToggle, children }: AboutPanelProps) {
  return (
    <CollapsibleSection title="About" isOpen={isOpen} onToggle={onToggle}>
      <p className="hint">
        <strong>{APP_INFO.name}</strong> is a browser-based diagram generator for
        Stradella bass, chromatic-button treble, and piano treble layouts.
      </p>
      <p className="hint">
        Author:{" "}
        <a href={APP_INFO.authorGithubUrl} target="_blank" rel="noreferrer">
          gilsag on GitHub
        </a>
      </p>
      <p className="hint">Version: {APP_INFO.version}</p>
      <p className="hint">
        License:{" "}
        <a href={APP_INFO.licenseUrl} target="_blank" rel="noreferrer">
          CC BY-NC 4.0
        </a>
      </p>
      <p className="hint">
        <a href={APP_INFO.readmeUrl} target="_blank" rel="noreferrer">
          Open README.md
        </a>
      </p>
      {children}
    </CollapsibleSection>
  );
}
