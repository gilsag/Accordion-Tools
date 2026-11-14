/** Diagram colours for places a stylesheet cannot reach: SVG presentation
 * attributes, the PNG canvas, an inline footer style and the default colour of
 * a new text note. Each equals the --diagram-* token of the same name in
 * src/styles/diagram-tokens.css (a test checks this), and like those tokens
 * they never follow the interface theme. */
export const DIAGRAM_COLORS = {
  paper: "#ffffff",
  ink: "#172033",
  "circle-ink": "#16191f",
  "footer-ink": "#20252a",
} as const;
