import type { FontFamily, TextNote, TextNoteAnchor } from "../types";

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

export function splitMultilineText(text: string) {
  return text.replace(/\r\n/g, "\n").split("\n");
}
