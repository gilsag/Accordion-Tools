import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  /** One-line description shown under the title while the section is collapsed. */
  summary?: string;
  children: ReactNode;
};

/** Reusable left-panel section shell used by settings and tool panels. */
export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  summary,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="control-section">
      <button className="section-title" type="button" aria-expanded={isOpen} onClick={onToggle}>
        {title} <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      {!isOpen && summary && <p className="section-summary">{summary}</p>}

      {isOpen && <div className="section-content">{children}</div>}
    </section>
  );
}
