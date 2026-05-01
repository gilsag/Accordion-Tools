/*
  Helpers for free-positioned text notes.
*/

import type { FontFamily, TextNote, TextNoteAnchor } from "../types";

/** Creates a stored text-note object from the current note settings and click position. */
export function makeTextNote(args: {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  font: FontFamily;
  anchor: TextNoteAnchor;
}): TextNote {
  return {
    id: `note-${Date.now()}-${Math.round(args.x)}-${Math.round(args.y)}`,
    x: args.x,
    y: args.y,
    text: args.text.trim(),
    fontSize: args.fontSize,
    color: args.color,
    font: args.font,
    anchor: args.anchor,
  };
}

/** Normalizes line endings and splits text so SVG can render each line as a tspan. */
export function splitMultilineText(text: string) {
  return text.replace(/\r\n/g, "\n").split("\n");
}
