/* Contextual titles identify the user's requested harmony and the *actual*
   selected realization without conflating chord identity with modeled voicing.
   This formatting is intentionally independent of diagram note visibility and
   export filename recipe keys. */
import type { FinderChordInversion, FinderChordPattern } from "../types";
import { finderChordSymbol } from "./stradellaChordFinder/chordSymbol";
import { displayRoot, realizedChordName } from "./stradellaChordFinder/chordSpelling";

type StradellaTitleInput = {
  root: string;
  pattern: FinderChordPattern;
  requestedBass: string | null;
  exact: boolean;
  buttonCount: number;
  bassOnly: boolean;
  /** A nominal model prediction, not an observed acoustic bass note. */
  modeledLowest: string | null;
};

export function stradellaContextualTitle(input: StradellaTitleInput): string {
  const { root, pattern, requestedBass, exact, buttonCount, bassOnly, modeledLowest } = input;
  const requestedSymbol = `${displayRoot(root)}${finderChordSymbol(root, pattern).slice(root.length)}`;
  const identity = realizedChordName(root, pattern, requestedBass, modeledLowest?.replace(/-?\d+$/, ""), requestedSymbol);
  const countLabel = `${buttonCount} ${bassOnly ? "bass " : ""}${buttonCount === 1 ? "button" : "buttons"}`;
  // Keep the selected harmonic root/quality. When there is no explicitly
  // requested bass, the slash describes the nominal inversion of this result.
  return `${identity} - ${exact ? "Exact" : "Approximate"} - ${countLabel}`;
}

const selectedInversion: Record<FinderChordInversion, string> = {
  root: "",
  first: "selected 1st inversion",
  second: "selected 2nd inversion",
  third: "selected 3rd inversion",
};

type TrebleTitleInput = {
  root: string;
  pattern: FinderChordPattern;
  inversion: FinderChordInversion;
  hasButtons: boolean;
  exact: boolean;
};

export function trebleContextualTitle(input: TrebleTitleInput): string {
  const identity = finderChordSymbol(input.root, input.pattern);
  const inversion = selectedInversion[input.inversion];
  // "Selected" describes the UI request; missing buttons may prevent that
  // inversion from being fully represented on a compact treble keyboard.
  return `${identity}${inversion ? ` - ${inversion}` : ""} - ${
    input.hasButtons ? (input.exact ? "Exact" : "Approximate") : "No realization"
  }`;
}
