import { useState } from "react";

type HelpTipProps = {
  text: string;
};

/** Small inline tooltip helper for compact explanations near controls. */
export function HelpTip({ text }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      className="help-tip"
      aria-label={text}
      aria-expanded={open}
      data-open={open ? "true" : undefined}
      onClick={(event) => {
        // Most tips sit inside form <label> elements; never toggle the labelled input.
        event.preventDefault();
        event.stopPropagation();
        setOpen((current) => !current);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }
      }}
      onBlur={() => setOpen(false)}
    >
      ?
    </span>
  );
}
