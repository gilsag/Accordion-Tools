/** Approximate system-ui glyph advances in ems. SVG tspans do not wrap by
 * themselves, so use proportional widths rather than a fixed character count.
 * The small reserve covers browser/font variation without wasting whole words. */
export function estimateLegendTextWidth(text: string, fontSize: number): number {
  let ems = 0;
  for (const char of text) {
    if (/\s/u.test(char)) ems += 0.29;
    else if (/[ilI.,:;!|']/u.test(char)) ems += 0.29;
    else if (/[mwMW@%#&]/u.test(char)) ems += 0.85;
    else if (/[fjrt(){}-]/u.test(char) || char === "[" || char === "]") ems += 0.43;
    else if (/[A-ZÁÉÍÓÚÜÑ]/u.test(char)) ems += 0.68;
    else if (/[0-9]/u.test(char)) ems += 0.57;
    else ems += 0.56;
  }
  return ems * fontSize * 1.06;
}

/** Wrap multilingual legend values to their actual SVG column width.
 * Keep words intact unless an individual word cannot fit in that column. */
export function wrapLegendText(text: string, width: number, fontSize: number): string[] {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (estimateLegendTextWidth(candidate, fontSize) <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    // Very long words must not run beyond the legend frame.
    for (const char of word) {
      if (line && estimateLegendTextWidth(line + char, fontSize) > width) {
        lines.push(line);
        line = "";
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}
