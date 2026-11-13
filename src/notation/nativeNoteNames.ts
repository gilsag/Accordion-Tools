/** Add native ABC annotations BELOW notes before the engraving step. No SVG
 * surgery: written durations, stems, open/filled noteheads and score identity
 * remain intact. Imported ABC is only annotated when its key can be interpreted
 * unambiguously (K:C / K:Am); complex imported scores are left untouched. */
const PITCH = /^([_=^]*)([a-gA-G])([,']*)/;

export function noteName(abcPitch: string): string | null {
  const match = PITCH.exec(abcPitch);
  if (!match) return null;
  const accidental = match[1].includes("^") ? "♯" : match[1].includes("_") ? "♭" : match[1].includes("=") ? "♮" : "";
  return `${match[2].toUpperCase()}${accidental}`;
}

/** A deliberately small ABC lexer, so notes inside quoted chord labels, voice
 * identifiers, decorations or comments cannot be mistaken for pitches. */
export function addNativeNoteNames(abc: string, imported = false): string {
  if (imported && !/^K:\s*(?:C|Am)\s*(?:%.*)?$/m.test(abc)) return abc;
  let inMusic = false;
  const rows = abc.split("\n");
  return rows.map(row => {
    if (/^K:/.test(row)) { inMusic = true; return row; }
    if (!inMusic || /^\s*(?:[A-Za-z]:|%%|%)/.test(row)) return row;
    let result = "";
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      if (ch === "%") { result += row.slice(i); break; }
      if (ch === '"') {
        const end = row.indexOf('"', i+1);
        if (end < 0) { result += row.slice(i); break; }
        result += row.slice(i, end + 1); i = end + 1; continue;
      }
      if (ch === "!") {
        const end = row.indexOf("!", i+1);
        if (end > i) { result += row.slice(i, end + 1); i=end+1; continue; }
      }
      if (ch === "[" && /^\[(?:V:|K:|M:|L:|Q:)/.test(row.slice(i))) {
        const end = row.indexOf("]", i + 1);
        if (end >= 0) { result += row.slice(i, end + 1); i = end+1; continue; }
      }
      if (ch === "[") {
        const end = row.indexOf("]", i + 1);
        if (end > i) {
          const content = row.slice(i+1,end);
          const all = [...content.matchAll(/[_=^]*[A-Ga-g][,']*/g)].map(m => noteName(m[0])).filter(Boolean);
          if (all.length && all.length <= 4 && content.replace(/[_=^A-Ga-g,']/g,"") === "") {
            result += `"_${all.join("–")}"` + row.slice(i,end+1); i=end+1; continue;
          }
        }
      }
      const found = PITCH.exec(row.slice(i));
      if (found) {
        const pitch = found[0];
        result += `"_${noteName(pitch)}"${pitch}`;
        i += pitch.length;
        continue;
      }
      result += ch; i++;
    }
    return result;
  }).join("\n");
}
