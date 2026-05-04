/* Fixed Stradella chord-button recipes.

   These recipes describe repeatable chord-row button patterns relative to
   the requested root. They do not choose physical buttons; the main finder
   applies these recipes to the currently visible Stradella layout.
*/

import type { DiagramButton, FinderChordPattern } from "../../types";
import { transpose } from "../../music";

export type ChordButtonRecipeStep = {
  kind: DiagramButton["kind"];
  rootOffset: number;
  primary?: boolean;
};

export type ChordButtonRecipe = {
  steps: ChordButtonRecipeStep[];
  shortDescription: string;
  explanation: string;
};


export function fixedStradellaRecipe(root: string, pattern: FinderChordPattern): ChordButtonRecipe | undefined {
  const minorThird = transpose(root, 3);
  const majorThird = transpose(root, 4);
  const fifth = transpose(root, 7);
  const sixth = transpose(root, 9);
  const minorSeventh = transpose(root, 10);

  if (pattern === "major-triad") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }], shortDescription: "Major triad: root, major third, fifth.", explanation: `Use the ${root} major chord button.` };
  }

  if (pattern === "minor-triad") {
    return { steps: [{ kind: "chord-minor", rootOffset: 0, primary: true }], shortDescription: "Minor triad: root, minor third, fifth.", explanation: `Use the ${root} minor chord button.` };
  }

  if (pattern === "augmented-triad") return undefined;

  if (pattern === "diminished-triad") {
    return { steps: [{ kind: "chord-diminished7", rootOffset: 3, primary: true }], shortDescription: "Diminished triad: root, minor third, diminished fifth.", explanation: `Use the diminished button built on the minor third (${minorThird}).` };
  }

  if (pattern === "sus4") return undefined;

  if (pattern === "dominant7") {
    return { steps: [{ kind: "chord-dominant7", rootOffset: 0, primary: true }, { kind: "chord-diminished7", rootOffset: 7 }], shortDescription: "Dominant 7: root, major third, fifth, minor seventh.", explanation: `Use the ${root}7 button plus the diminished button on the fifth (${fifth}) to supply the omitted fifth.` };
  }

  if (pattern === "major6") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }, { kind: "chord-minor", rootOffset: 9 }], shortDescription: "Major 6: major triad plus sixth.", explanation: `Use ${root} major plus the minor chord on the sixth (${sixth}).` };
  }

  if (pattern === "minor6") {
    return { steps: [{ kind: "chord-minor", rootOffset: 0, primary: true }, { kind: "chord-diminished7", rootOffset: 0 }], shortDescription: "Minor 6: minor triad plus sixth.", explanation: `Use ${root} minor plus ${root} diminished.` };
  }

  if (pattern === "dominant7b5") {
    return undefined;
  }

  if (pattern === "dominant7b9") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }, { kind: "chord-diminished7", rootOffset: 10 }], shortDescription: "7♭9: dominant 7 color plus flat ninth.", explanation: `Use ${root} major plus the diminished button on the minor seventh (${minorSeventh}).` };
  }

  if (pattern === "dominant9") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }, { kind: "chord-minor", rootOffset: 7 }], shortDescription: "Dominant 9: dominant 7 plus ninth.", explanation: `Use ${root} major plus the minor chord on the fifth (${fifth}).` };
  }

  if (pattern === "dominant9sus4") return undefined;

  if (pattern === "dominant11") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }, { kind: "chord-major", rootOffset: 10 }], shortDescription: "Dominant 11: dominant 9 plus eleventh.", explanation: `Use ${root} major plus the major chord on the minor seventh (${minorSeventh}).` };
  }

  if (pattern === "major7") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }, { kind: "chord-minor", rootOffset: 4 }], shortDescription: "Major 7: major triad plus major seventh.", explanation: `Use ${root} major plus the minor chord on the major third (${majorThird}).` };
  }

  if (pattern === "major9" || pattern === "major7add9") {
    return { steps: [{ kind: "chord-major", rootOffset: 0, primary: true }, { kind: "chord-major", rootOffset: 7 }], shortDescription: "Major 9: major seventh plus ninth.", explanation: `Use ${root} major plus the major chord on the fifth (${fifth}).` };
  }

  if (pattern === "minor7") {
    return { steps: [{ kind: "chord-minor", rootOffset: 0, primary: true }, { kind: "chord-major", rootOffset: 3 }], shortDescription: "Minor 7: minor triad plus minor seventh.", explanation: `Use ${root} minor plus the major chord on the minor third (${minorThird}).` };
  }

  if (pattern === "minorMajor7") {
    return undefined;
  }

  if (pattern === "minor7b5") {
    return { steps: [{ kind: "chord-minor", rootOffset: 3, primary: true }, { kind: "chord-diminished7", rootOffset: 3 }], shortDescription: "Minor 7♭5: root, minor third, diminished fifth, minor seventh.", explanation: `Use the minor chord and diminished button built on the minor third (${minorThird}).` };
  }

  if (pattern === "minor9") {
    return { steps: [{ kind: "chord-minor", rootOffset: 0, primary: true }, { kind: "chord-minor", rootOffset: 7 }], shortDescription: "Minor 9: minor 7 plus ninth.", explanation: `Use ${root} minor plus the minor chord on the fifth (${fifth}).` };
  }

  if (pattern === "minorMajor9") {
    return { steps: [{ kind: "chord-minor", rootOffset: 0, primary: true }, { kind: "chord-major", rootOffset: 7 }], shortDescription: "Minor major 9: minor triad, major seventh, ninth.", explanation: `Use ${root} minor plus the major chord on the fifth (${fifth}).` };
  }

  if (pattern === "diminished7") {
    return { steps: [{ kind: "chord-diminished7", rootOffset: 0, primary: true }, { kind: "chord-diminished7", rootOffset: 3 }], shortDescription: "Diminished 7: root, minor third, diminished fifth, diminished seventh.", explanation: `Use ${root} diminished plus ${minorThird} diminished. The second button supplies the omitted diminished fifth.` };
  }

  return undefined;
}

