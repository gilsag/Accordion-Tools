/** Theory-level chord roles; independent of physical buttons and display styles. */
import type { FinderChordPattern } from "../types";
import { intervalsForChordFinder } from "./chordDefinitions";

export type ChordToneRole = "root" | "third" | "fifth" | "altered-fifth" | "sixth"
  | "seventh" | "suspension" | "added-ninth" | "ninth" | "altered-ninth"
  | "eleventh" | "altered-eleventh" | "thirteenth";

export function chordToneFunctions(pattern: FinderChordPattern): Array<{
  interval: number; role: ChordToneRole; defining: boolean;
}> {
  const intervals = intervalsForChordFinder(pattern);
  const is11 = ["dominant11", "major11", "minor11"].includes(pattern);
  const is13 = ["dominant13", "major13", "minor13"].includes(pattern);
  const suspended = ["sus2", "sus4", "dominant7sus4", "dominant9sus4"].includes(pattern);
  const added9 = ["majorAdd9", "minorAdd9", "major6add9", "minor6add9"].includes(pattern);
  return intervals.map((interval) => {
    let role: ChordToneRole;
    if (interval === 0) role = "root";
    else if (interval === 2 || (interval === 5 && suspended)) role = "suspension";
    else if (interval === 3 || interval === 4) role = "third";
    else if (interval === 7) role = "fifth";
    else if (interval === 6 || interval === 8) role = "altered-fifth";
    else if (interval === 9 && pattern !== "diminished7") role = "sixth";
    else if ([9, 10, 11].includes(interval)) role = "seventh";
    else if ([13, 15].includes(interval)) role = "altered-ninth";
    else if (interval === 14) role = added9 ? "added-ninth" : "ninth";
    else if (interval === 17) role = "eleventh";
    else if (interval === 18) role = "altered-eleventh";
    else role = "thirteenth";
    const omittable = (role === "fifth" && intervals.length >= 4) ||
      (role === "ninth" && (is11 || is13)) ||
      (role === "eleventh" && is13) ||
      (role === "third" && interval === 4 && ["dominant11", "major11"].includes(pattern));
    return { interval, role, defining: !omittable };
  });
}
