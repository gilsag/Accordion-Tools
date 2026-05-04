/* Exact chord-button-only recipes for the Stradella Chord Finder. */

import type { DiagramButton, FinderChordPattern } from "../../types";
import { fixedStradellaRecipe } from "./recipes";
import { notPlayableResult, resultFromButtons, summarizeResult, type StradellaChordFinderResult } from "./results";
import { chordKindLabel } from "./voicings";
import { recipeButtons, rootBassCandidates } from "./utils";

export function chordButtonRecipeResult(
  buttons: DiagramButton[],
  root: string,
  targetPitches: string[],
  pattern: FinderChordPattern,
  markRootBass: boolean,
): StradellaChordFinderResult {
  const recipe = fixedStradellaRecipe(root, pattern);

  if (!recipe) {
    return notPlayableResult(
      targetPitches,
      "No exact chord-buttons-only recipe.",
      "This chord type cannot be made exactly from Stradella chord buttons alone without adding unwanted tones.",
    );
  }

  const { selectedButtons, primaryButtonIds, missingSteps } = recipeButtons(buttons, root, recipe);
  const rootBassButton = markRootBass ? rootBassCandidates(buttons, root)[0] : undefined;

  if (missingSteps.length > 0) {
    return notPlayableResult(targetPitches, recipe.shortDescription, `${recipe.explanation} Missing visible button(s): ${missingSteps.join(", ")}.`);
  }

  const summary = summarizeResult(selectedButtons, targetPitches);
  if (!summary.exact) {
    return notPlayableResult(
      targetPitches,
      recipe.shortDescription,
      summary.extraPitches.length > 0
        ? "The available chord-buttons-only recipe would add tone(s) outside the requested chord, so it is not shown."
        : "The available chord-buttons-only recipe does not cover every requested tone, so it is not shown.",
    );
  }

  const selectedNames = selectedButtons.map((button) => `${button.chordRoot ?? "?"} ${chordKindLabel(button.kind)}`.trim()).join(" + ");
  const visualButtons = rootBassButton ? [rootBassButton, ...selectedButtons] : selectedButtons;
  const rootBassButtonIds = rootBassButton ? [rootBassButton.id] : [];

  return resultFromButtons(
    visualButtons,
    selectedButtons,
    primaryButtonIds,
    rootBassButtonIds,
    targetPitches,
    recipe.shortDescription,
    `${recipe.explanation} Selected: ${selectedNames || "none"}.`,
  );
}
