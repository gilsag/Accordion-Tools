import type { OptimizedProgressionPlan } from "../../tools/harmonyExplorer/progression";

/** Eye selection is a single optional stable chord ID, not a mutable row index.
 * The optimizer may replace/reorder its steps when a user pins a recipe.
 */
export function progressionNoteStep(plan: OptimizedProgressionPlan, id: string | null) {
  if (!id || !plan.playable) return null;
  return plan.steps.find((step) => step.chord.id === id) ?? null;
}

export function toggleProgressionNoteId(current: string | null, clicked: string): string | null {
  return current === clicked ? null : clicked;
}
