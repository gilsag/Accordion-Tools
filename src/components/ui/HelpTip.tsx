type HelpTipProps = {
  text: string;
};

/** Small inline tooltip helper for compact explanations near controls. */
export function HelpTip({ text }: HelpTipProps) {
  return (
    <span className="help-tip" title={text} aria-label={text} tabIndex={0}>
      ?
    </span>
  );
}
