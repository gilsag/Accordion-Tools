/* Registral descriptions use *played* button roles, not graphical markers.
   No fixed reed octaves or verified lowest acoustic pitch are assumed. */

import type { StradellaChordFinderResult } from "./results";
import { finderChordSymbol } from "./chordSymbol";
import type { FinderChordPattern } from "../../types";
import { isBassButton } from "./voicings";

/** One short, factual registral label for export/diagram annotations. */
export function briefRegistralRole(result: StradellaChordFinderResult): string {
  if (!result.playable) return "";
  const { registral } = result;
  if (registral.inversionCharacter === "root-supported") {
    const rootBass = result.playbackButtons.find((button) => isBassButton(button) && button.pitchClass === registral.rootPitchClass);
    return `Root supported by ${registral.rootPitchClass} ${rootBass?.kind === "bass-counterbass" ? "counterbass" : "bass"}`;
  }
  if (registral.potentialSlashBass) return `Non-root bass: ${registral.potentialSlashBass}`;
  if (registral.bassPitchClasses.length > 1) return "Multiple bass tones";
  if (registral.bassButtonCount > 0 && registral.chordButtonCount === 0) return "Bass rows only";
  return "";
}

/** Expanded, conditional register interpretation for the More explanation section. */
export function explainRegistralRole(
  root: string,
  pattern: FinderChordPattern,
  result: StradellaChordFinderResult,
): string {
  if (!result.playable || result.playbackButtons.length === 0) return "";
  const { registral } = result;
  const name = finderChordSymbol(root, pattern);
  if (registral.inversionCharacter === "root-supported") {
    const bassButtons = result.playbackButtons.filter(isBassButton);
    const kind = bassButtons[0]?.kind === "bass-counterbass" ? "counterbass" : "fundamental bass";
    const overlap = registral.bassChordOverlaps.includes(root)
      ? ` The root ${root} is also present in the preset chord buttons, but the ${kind} reinforces it through the bass-button mechanism rather than adding a new pitch class.`
      : ` The ${kind} supplies the root pitch class independently of the preset chords.`;
    return `Registral character: root-supported. The played ${root} ${kind} gives ${name} a distinct root-bass role.${overlap} The exact lowest sounding reed and octave doublings depend on the instrument and registration.`;
  }
  if (registral.potentialSlashBass) {
    const bass = registral.potentialSlashBass;
    return `Registral character: potential ${name}/${bass}. A played ${bass} bass/counterbass button adds a separate non-root bass role below or alongside the preset-chord register, while the harmonic root ${root} remains present elsewhere. This suggests a slash-chord or inverted character; it is not proof that ${bass} is the lowest acoustic pitch on every accordion or register.`;
  }
  if (registral.bassPitchClasses.length > 1) {
    const played = registral.bassPitchClasses.join(" and ");
    return `Registral character: multiple bass pitches (${played}). These are played bass/counterbass buttons, not simply tones of the preset chords. Button roles alone cannot identify the lowest acoustic pitch or prove an inversion${registral.rootBassSupported ? `, even though ${root} is among the bass notes` : ""}.`;
  }
  if (registral.bassButtonCount === 0 && registral.chordButtonCount > 0) {
    return `Registral character: preset-chord buttons only. The root ${root} ${registral.rootInPresetChords ? "occurs in their pitch-class content" : "is not supplied by the preset chord buttons"}, but no separate bass/counterbass button supports it. The chord extensions are represented within the preset-chord register rather than as a guaranteed high stack of thirds. The actual spacing and acoustic density depend on the selected instrument and register.`;
  }
  if (registral.chordButtonCount === 0 && registral.bassButtonCount > 0) {
    return `Registral character: bass/counterbass buttons only. These pitches use the bass-button sound, not the preset-chord voicing. Their exact octaves and doublings depend on the accordion and register; no inversion should be inferred from button order.`;
  }
  return `Registral character: the selected buttons provide no unambiguous low-root or slash-bass interpretation. This classification does not assume specific reed octaves.`;
}
