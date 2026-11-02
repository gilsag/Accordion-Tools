import { useState } from "react";
import { TREBLE_PRESET_BUTTON_SIZE } from "../instrument/sizePresets";
import type { AccidentalStyle, ColorTheme, FontFamily, TitleMode } from "../types";

/** Owns diagram geometry, visibility and title typography, not physical
 * instrument geometry, chord results, sound or export operations. All defaults
 * and individual setters are stable for legacy settings import/export.
 */
export function useDiagramAppearanceState() {
  /* Appearance state shared by Stradella and treble diagrams. */
  const [buttonSize, setButtonSize] = useState(TREBLE_PRESET_BUTTON_SIZE.small);
  const [spacing, setSpacing] = useState(2.3);
  const [diagramVerticalSpacing, setDiagramVerticalSpacing] = useState(18);
  const [pianoKeyWidthScale, setPianoKeyWidthScale] = useState(1);
  const [pianoKeyHeightScale, setPianoKeyHeightScale] = useState(1);
  const [pianoBlackKeyWidthScale, setPianoBlackKeyWidthScale] = useState(1);
  const [pianoBlackKeyHeightScale, setPianoBlackKeyHeightScale] = useState(1);
  const [diagramScale, setDiagramScale] = useState(100);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [trebleAngle, setTrebleAngle] = useState(30);
  const [buttonStrokeWidth, setButtonStrokeWidth] = useState(3);
  const [referenceStrokeWidth, setReferenceStrokeWidth] = useState(6);
  const [chordFillStrength, setChordFillStrength] = useState(100);
  const [accidentalStyle, setAccidentalStyle] =
    useState<AccidentalStyle>("grey");
  const [labelFontSize, setLabelFontSize] = useState(13);
  const [showButtonLabels, setShowButtonLabels] = useState(true);
  const [showBellowsGuide, setShowBellowsGuide] = useState(true);
  const [showStradellaRowLabels, setShowStradellaRowLabels] = useState(true);

  /* Title and label font state. */
  const [titleMode, setTitleMode] = useState<TitleMode>("contextual");
  const [customTitle, setCustomTitle] = useState("My accordion diagram");
  const [titleFont, setTitleFont] = useState<FontFamily>("system");
  const [titleSize, setTitleSize] = useState(24);
  const [labelFont, setLabelFont] = useState<FontFamily>("system");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default");

  return {
    buttonSize, setButtonSize, spacing, setSpacing,
    diagramVerticalSpacing, setDiagramVerticalSpacing,
    pianoKeyWidthScale, setPianoKeyWidthScale,
    pianoKeyHeightScale, setPianoKeyHeightScale,
    pianoBlackKeyWidthScale, setPianoBlackKeyWidthScale,
    pianoBlackKeyHeightScale, setPianoBlackKeyHeightScale,
    diagramScale, setDiagramScale,
    showStatusBar, setShowStatusBar, trebleAngle, setTrebleAngle,
    buttonStrokeWidth, setButtonStrokeWidth,
    referenceStrokeWidth, setReferenceStrokeWidth,
    chordFillStrength, setChordFillStrength,
    accidentalStyle, setAccidentalStyle,
    labelFontSize, setLabelFontSize,
    showButtonLabels, setShowButtonLabels,
    showBellowsGuide, setShowBellowsGuide,
    showStradellaRowLabels, setShowStradellaRowLabels,
    titleMode, setTitleMode, customTitle, setCustomTitle,
    titleFont, setTitleFont, titleSize, setTitleSize,
    labelFont, setLabelFont, colorTheme, setColorTheme,
  };
}
