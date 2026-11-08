import type { BassCount, DiagramButton, PianoTrebleRange, TrebleLayout, TrebleSizePreset } from "../types";
import { generateStradella } from "../stradella";
import { generateTreble } from "../treble";
import { generatePianoTreble } from "../pianoTreble";

/** Layout settings that decide the physical buttons of either side. */
export type SideButtonSettings = {
  basses: BassCount;
  stradellaAccidental: "natural" | "flats" | "sharps";
  trebleLayout: TrebleLayout;
  trebleRows: 3 | 4 | 5;
  trebleSize: TrebleSizePreset;
  pianoTrebleRange: PianoTrebleRange;
  buttonSize: number;
  spacing: number;
  diagramVerticalSpacing: number;
  pianoKeyWidthScale: number;
  pianoKeyHeightScale: number;
  pianoBlackKeyWidthScale: number;
  pianoBlackKeyHeightScale: number;
  trebleAngle: number;
  showTrebleOctaves: boolean;
};

export function stradellaButtonsFor(settings: SideButtonSettings): DiagramButton[] {
  return generateStradella(settings.basses, settings.buttonSize, settings.spacing,
    settings.stradellaAccidental, settings.diagramVerticalSpacing);
}

const PRESET_WIDTHS: Array<[TrebleSizePreset, number]> = [
  ["one-octave", 5], ["two-octave", 9], ["small", 14], ["full", 18], ["large", 24],
];

/**
 * Treble buttons for the current settings. Compact one- and two-octave sizes
 * show a window of the full keyboard: `wantedButtons` receives the full-size
 * reference buttons and returns the ones that must be visible (Finder results
 * and marks); the smallest preset that holds them is used, centered on them.
 */
export function trebleButtonsFor(
  settings: SideButtonSettings,
  wantedButtons: (reference: DiagramButton[]) => DiagramButton[] = () => [],
): DiagramButton[] {
  const { trebleLayout, trebleRows, trebleSize, buttonSize, spacing, trebleAngle,
    showTrebleOctaves, diagramVerticalSpacing } = settings;
  if (trebleLayout === "piano") {
    return generatePianoTreble(settings.pianoTrebleRange, buttonSize, spacing, showTrebleOctaves, {
      keyWidthScale: settings.pianoKeyWidthScale,
      keyHeightScale: settings.pianoKeyHeightScale,
      blackKeyWidthScale: settings.pianoBlackKeyWidthScale,
      blackKeyHeightScale: settings.pianoBlackKeyHeightScale,
      verticalOffset: diagramVerticalSpacing,
    });
  }
  const system = trebleLayout;
  const compact = trebleSize === "one-octave" || trebleSize === "two-octave";
  if (!compact) {
    return generateTreble(system, trebleRows, trebleSize, buttonSize,
      spacing, trebleAngle, showTrebleOctaves, diagramVerticalSpacing);
  }
  // Use full geometry to locate the complete selection. Then choose the
  // smallest available preset containing all selected buttons.
  const reference = generateTreble(system, trebleRows, "large", buttonSize,
    spacing, trebleAngle, showTrebleOctaves, diagramVerticalSpacing);
  const wanted = wantedButtons(reference).map((button) => button.column);
  const low = Math.min(...wanted);
  const high = Math.max(...wanted);
  const minimum = trebleSize === "one-octave" ? 0 : 1;
  const selected = PRESET_WIDTHS.slice(minimum).find(([, width]) => !wanted.length || high - low < width)
    ?? PRESET_WIDTHS[PRESET_WIDTHS.length - 1];
  const [effectivePreset, width] = selected;
  const start = wanted.length
    ? Math.max(0, Math.min(24 - width, Math.round((low + high - width + 1) / 2)))
    : 0;
  return generateTreble(system, trebleRows, effectivePreset, buttonSize,
    spacing, trebleAngle, showTrebleOctaves, diagramVerticalSpacing, start);
}
