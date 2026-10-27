import type { ReactNode } from "react";

type SegmentedChoiceProps<T extends string> = {
  label: ReactNode;
  ariaLabel?: string;
  value: T;
  options: readonly { value: NoInfer<T>; label: string }[];
  onChange: (next: NoInfer<T>) => void;
};

/** Both persistent choices remain visible. aria-pressed communicates which is
 * selected; this is not a Show/Hide action whose label should describe a click. */
export function SegmentedChoice<T extends string>({ label, ariaLabel, value, options, onChange }: SegmentedChoiceProps<T>) {
  return (
    <div className="segmented-choice-control">
      <span className="label-line">{label}</span>
      <div className="segmented-choice" role="group" aria-label={ariaLabel ?? (typeof label === "string" ? label : "Choose setting")}>
        {options.map((option) => (
          <button key={option.value} type="button" className={`segmented-choice-button ${value === option.value ? "selected" : ""}`}
            aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>
        ))}
      </div>
    </div>
  );
}
