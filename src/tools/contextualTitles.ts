/* Contextual titles identify the user's requested harmony and the *actual*
   selected realization without conflating chord identity with modeled voicing.
   This formatting is intentionally independent of diagram note visibility and
   export filename recipe keys. */
import type { FinderChordInversion, FinderChordPattern } from "../types";
import { finderChordSymbol } from "./stradellaChordFinder/chordSymbol";
import { harmonicIdentitySymbol } from "./stradellaChordFinder/harmonicIdentity";

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
  const identity = harmonicIdentitySymbol({ root, pattern, requestedBass });
  const countLabel = `${buttonCount} ${bassOnly ? "bass " : ""}${buttonCount === 1 ? "button" : "buttons"}`;
  // An inferred slash symbol would incorrectly replace the requested harmonic
  // identity. For unspecified basses, show a distinct *modeled* lowest tone
  // only when its pitch class differs from the requested root.
  const lowestClass = modeledLowest?.replace(/-?\d+$/, "");
  const modeledLabel = requestedBass === null && modeledLowest && lowestClass !== root
    ? ` - modeled lowest ${modeledLowest}`
    : "";
  return `${identity} - ${exact ? "Exact" : "Approximate"} - ${countLabel}${modeledLabel}`;
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
