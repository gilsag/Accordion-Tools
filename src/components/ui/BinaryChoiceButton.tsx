import type { ReactNode } from "react";

type BinaryChoiceButtonProps = {
  label: ReactNode;
  enabled: boolean;
  onToggle: () => void;
  whenEnabled: string;
  whenDisabled: string;
};

/** A single explicit action replaces an unnecessary two-option dropdown. */
export function BinaryChoiceButton({ label, enabled, onToggle, whenEnabled, whenDisabled }: BinaryChoiceButtonProps) {
  return (
    <div className="binary-choice-control">
      <span className="label-line">{label}</span>
      <button type="button" className={`small-button ${enabled ? "active-tool" : ""}`} aria-pressed={enabled} onClick={onToggle}>
        {enabled ? whenEnabled : whenDisabled}
      </button>
    </div>
  );
}
