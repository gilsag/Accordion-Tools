/* Kept apart from abcPlayerTools.ts, which loads lazily with the ABC engine:
   the transport needs the meter at startup. */
/** The tune's meter from its M: field ("6/8", "C", "C|"), or 4/4 when it has
 * none. The count-in and metronome click in this meter. */
export function abcMeter(abcText: string) {
  const field = /^M:\s*([^%\n]+)/m.exec(abcText)?.[1].trim();
  return field && /^(C\|?|\d+\s*\/\s*\d+)$/.test(field) ? field.replace(/\s+/g, "") : "4/4";
}
