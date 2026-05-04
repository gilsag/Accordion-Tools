import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/** Reusable left-panel section shell used by settings and tool panels. */
export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="control-section">
      <button className="section-title" type="button" onClick={onToggle}>
        {title} <span>{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && <div className="section-content">{children}</div>}
    </section>
  );
}
