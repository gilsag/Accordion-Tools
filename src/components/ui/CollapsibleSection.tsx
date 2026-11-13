import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  /** One-line description shown under the title while the section is collapsed. */
  summary?: string;
  /** Extra class for the content wrapper. */
  contentClassName?: string;
  /** Keep the content mounted (hidden) once it has been opened, so state held
   * by the children survives closing the section. */
  keepMounted?: boolean;
  children: ReactNode;
};

/** Reusable left-panel section shell used by settings and tool panels. The
 * content is rendered only while the section is open, so lazily loaded
 * children are fetched on first use. */
export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  summary,
  contentClassName,
  keepMounted = false,
  children,
}: CollapsibleSectionProps) {
  const [hasOpened, setHasOpened] = useState(isOpen);
  if (isOpen && !hasOpened) setHasOpened(true);
  const mounted = isOpen || (keepMounted && hasOpened);
  return (
    <section className="control-section">
      <button className="section-title" type="button" aria-expanded={isOpen} onClick={onToggle}>
        {title} <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      {!isOpen && summary && <p className="section-summary">{summary}</p>}

      {mounted && (
        <div className={contentClassName ? `section-content ${contentClassName}` : "section-content"} hidden={!isOpen}>
          {children}
        </div>
      )}
    </section>
  );
}
