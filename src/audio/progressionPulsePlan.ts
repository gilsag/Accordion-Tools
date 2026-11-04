import type { DiagramButton } from "../types";
import type { ProgressionRhythmPattern } from "../sound";

const isBass = (button: DiagramButton) => button.kind === "bass-root" || button.kind === "bass-counterbass";

/** One source of beat-by-beat physical IDs for notation, playback and diagram animation.
 * The first beat sounds the lowest *selected* bass/counterbass. When a recipe
 * has no bass button, an external root bass may supply the first beat without
 * becoming part of the chosen chord realization. Remaining beats sound every
 * other button in the selected recipe, including non-low bass/counterbass.
 * An empty remainder is a rest: never silently repeat the bass on every beat.
 */
export function progressionPulsePlan(
  realization: readonly DiagramButton[],
  fallbackBass: readonly DiagramButton[],
  rhythm: ProgressionRhythmPattern,
  lowestSoundingPitch: (button: DiagramButton) => number,
): DiagramButton[][] {
  if (rhythm === "block") return [[...realization]];
  const selectedBass = realization.filter(isBass);
  const candidates = selectedBass.length ? selectedBass : fallbackBass.filter(isBass);
  const lowest = [...candidates].sort((a, b) =>
    lowestSoundingPitch(a) - lowestSoundingPitch(b) || a.id.localeCompare(b.id))[0];
  const firstBeat = lowest ? [lowest] : [];
  const otherBeats = realization.filter((button) => button.id !== lowest?.id);
  const count = rhythm === "march" ? 4 : rhythm === "waltz" ? 3 : 2;
  return [firstBeat, ...Array.from({ length: count - 1 }, () => [...otherBeats])];
}
