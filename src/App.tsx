import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import "./App.css";

import type {
  AccidentalMode,
  AccidentalStyle,
  BassCount,
  ChordLabelMode,
  ColorTheme,
  DiagramButton,
  FontFamily,
  LeftPanelMode,
  NotationMode,
  Overlay,
  NumberPosition,
  SequenceColorPreset,
  SequenceDisplayMode,
  SequenceStep,
  Side,
  TrebleSizePreset,
  TextNote,
  TextNoteAnchor,
  TitleMode,
} from "./types";

import {
  chordSuffix,
  chordTones,
  fontClass,
  formatPitch,
  isAccidentalPitch,
  isChordKind,
  renderMusicLabel,
  rowFunction,
} from "./music";

import {
  generateStradella,
  stradellaRowLabel,
  stradellaVisibleRoots,
  stradellaVisibleRows,
} from "./stradella";

import { generateTreble } from "./treble";
import { downloadSvg } from "./download";
import {
  getSequenceLabelsForButton,
  getSequenceStepsWithButtons,
  makeSequenceArrowPath,
  sequenceArrowStyleFromMode,
  sequenceModeShowsArrows,
  sequenceModeShowsNumbers,
} from "./tools/sequenceTools";
import { makeTextNote, splitMultilineText } from "./tools/textNoteTools";

const BASS_OPTIONS: Array<{ value: BassCount; label: string }> = [
  { value: "8", label: "8" },
  { value: "12", label: "12" },
  { value: "24", label: "24" },
  { value: "32", label: "32" },
  { value: "40", label: "40" },
  { value: "48-8x6", label: "48, 8×6" },
  { value: "48-12x4", label: "48, 12×4" },
  { value: "60", label: "60" },
  { value: "72", label: "72" },
  { value: "80", label: "80" },
  { value: "96", label: "96" },
  { value: "100", label: "100" },
  { value: "120", label: "120" },
];

const TREBLE_SIZE_OPTIONS: Array<{ value: TrebleSizePreset; label: string }> = [
  { value: "small", label: "Small CBA, about 3 octaves" },
  { value: "full", label: "Full-size CBA, about 3¾–4 octaves" },
  { value: "large", label: "Large CBA, about 5+ octaves" },
];

const TREBLE_SIZE_VIEW_WIDTH: Record<TrebleSizePreset, number> = {
  small: 1080,
  full: 1220,
  large: 1460,
};

const TREBLE_PRESET_BUTTON_SIZE: Record<TrebleSizePreset, number> = {
  small: 28,
  full: 24,
  large: 20,
};

const COLOR_PRESETS: Record<SequenceColorPreset, string> = {
  red: "#d4553f",
  blue: "#1746d0",
  black: "#111111",
  grey: "#666666",
  theme: "#1746d0",
};

function numberY(buttonY: number, buttonSize: number, position: NumberPosition) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

function fingeringY(buttonY: number, buttonSize: number, position: NumberPosition) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const previousLayoutSignatureRef = useRef<string | null>(null);

  const [side, setSide] = useState<Side>("stradella");
  const [notation, setNotation] = useState<NotationMode>("english");
  const [accidental, setAccidental] = useState<AccidentalMode>("natural");
  const [chordLabelMode, setChordLabelMode] = useState<ChordLabelMode>("chord-name");
  const [basses, setBasses] = useState<BassCount>("96");
  const [trebleSystem, setTrebleSystem] = useState<"c-system" | "b-system">("c-system");
  const [trebleRows, setTrebleRows] = useState<3 | 4 | 5>(5);
  const [trebleSize, setTrebleSize] = useState<TrebleSizePreset>("small");
  const [showTrebleOctaves, setShowTrebleOctaves] = useState(false);

  const [buttonSize, setButtonSize] = useState(TREBLE_PRESET_BUTTON_SIZE.small);
  const [spacing, setSpacing] = useState(2.3);
  const [trebleAngle, setTrebleAngle] = useState(30);
  const [buttonStrokeWidth, setButtonStrokeWidth] = useState(3);
  const [referenceStrokeWidth, setReferenceStrokeWidth] = useState(6);
  const [chordFillStrength, setChordFillStrength] = useState(100);
  const [accidentalStyle, setAccidentalStyle] = useState<AccidentalStyle>("grey");
  const [labelFontSize, setLabelFontSize] = useState(13);
  const [showBellowsGuide, setShowBellowsGuide] = useState(true);
  const [showStradellaRowLabels, setShowStradellaRowLabels] = useState(true);

  const [titleMode, setTitleMode] = useState<TitleMode>("auto");
  const [customTitle, setCustomTitle] = useState("My accordion diagram");
  const [titleFont, setTitleFont] = useState<FontFamily>("system");
  const [titleSize, setTitleSize] = useState(24);
  const [labelFont, setLabelFont] = useState<FontFamily>("system");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default");

  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("settings");

  const [settingsSections, setSettingsSections] = useState({
    layout: true,
    title: false,
    appearance: true,
    notation: false,
  });

  const [toolSections, setToolSections] = useState({
    fingering: true,
    selection: true,
    sequences: true,
    textNotes: true,
  });

  const [overlays, setOverlays] = useState<Record<string, Overlay>>({});
  const [isRecordingSequence, setIsRecordingSequence] = useState(false);
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [sequenceDisplayMode, setSequenceDisplayMode] = useState<SequenceDisplayMode>(
    "numbers-and-curved-arrows"
  );
  const [sequenceColorPreset, setSequenceColorPreset] = useState<SequenceColorPreset>("red");
  const [sequenceThickness, setSequenceThickness] = useState(3.2);
  const [sequenceArrowheadSize, setSequenceArrowheadSize] = useState(4);
  const [sequenceNumberFontSize, setSequenceNumberFontSize] = useState(10);
  const [sequenceNumberColorPreset, setSequenceNumberColorPreset] = useState<SequenceColorPreset>("red");
  const [sequenceNumberPosition, setSequenceNumberPosition] = useState<NumberPosition>("above");
  const [fingeringPosition, setFingeringPosition] = useState<NumberPosition>("inside-bottom");

  const [noteDraft, setNoteDraft] = useState("Remember\nbellows direction");
  const [isPlacingTextNote, setIsPlacingTextNote] = useState(false);
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [textNoteFontSize, setTextNoteFontSize] = useState(15);
  const [textNoteColor, setTextNoteColor] = useState("#172033");
  const [textNoteFont, setTextNoteFont] = useState<FontFamily>("system");
  const [textNoteAnchor, setTextNoteAnchor] = useState<TextNoteAnchor>("start");

  function changeTrebleSize(nextSize: TrebleSizePreset) {
    setTrebleSize(nextSize);
    setButtonSize(TREBLE_PRESET_BUTTON_SIZE[nextSize]);
  }

  const buttons = useMemo(() => {
    return side === "stradella"
      ? generateStradella(basses, buttonSize, spacing, accidental)
      : generateTreble(
          trebleSystem,
          trebleRows,
          trebleSize,
          buttonSize,
          spacing,
          trebleAngle,
          showTrebleOctaves
        );
  }, [
    side,
    basses,
    trebleSystem,
    trebleRows,
    trebleSize,
    buttonSize,
    spacing,
    trebleAngle,
    accidental,
    showTrebleOctaves,
  ]);

  const layoutSignature = [
    side,
    basses,
    trebleSystem,
    trebleRows,
    trebleSize,
    buttonSize,
    spacing,
    trebleAngle,
    showTrebleOctaves,
  ].join("|");

  useEffect(() => {
    if (previousLayoutSignatureRef.current === null) {
      previousLayoutSignatureRef.current = layoutSignature;
      return;
    }

    if (previousLayoutSignatureRef.current !== layoutSignature) {
      setOverlays({});
      setSequenceSteps([]);
      setIsRecordingSequence(false);
      setTextNotes([]);
      setIsPlacingTextNote(false);
      previousLayoutSignatureRef.current = layoutSignature;
    }
  }, [layoutSignature]);

  const selectedButtonIds = Object.entries(overlays)
    .filter(([, overlay]) => overlay.selected)
    .map(([id]) => id);

  const activeButton = selectedButtonIds[0];

  const selectedButtons = selectedButtonIds
    .map((id) => buttons.find((button) => button.id === id))
    .filter(Boolean) as DiagramButton[];

  const sequenceStepsWithButtons = getSequenceStepsWithButtons(sequenceSteps, buttons);

  function toggleSettingsSection(section: keyof typeof settingsSections) {
    setSettingsSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function toggleToolSection(section: keyof typeof toolSections) {
    setToolSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function toggleButton(id: string) {
    setOverlays((current) => ({
      ...current,
      [id]: {
        ...current[id],
        selected: !current[id]?.selected,
      },
    }));

    if (isRecordingSequence) {
      setSequenceSteps((current) => [...current, { id, step: current.length + 1 }]);
    }
  }

  function setFingerForSelected(finger: string) {
    if (!activeButton) return;
    setOverlays((current) => ({
      ...current,
      [activeButton]: { ...current[activeButton], finger },
    }));
  }

  function clearFingerForSelected() {
    if (!activeButton) return;
    setOverlays((current) => ({
      ...current,
      [activeButton]: { ...current[activeButton], finger: "" },
    }));
  }

  function clearAllFingerings() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], finger: "" };
      });
      return next;
    });
  }

  function clearSelection() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], selected: false };
      });
      return next;
    });
  }

  function clearSequence() {
    setSequenceSteps([]);
  }

  function clearTextNotes() {
    setTextNotes([]);
    setIsPlacingTextNote(false);
  }

  function resetDiagramWork() {
    setOverlays({});
    setSequenceSteps([]);
    setIsRecordingSequence(false);
    setTextNotes([]);
    setIsPlacingTextNote(false);
  }

  function getMainLabel(button: DiagramButton) {
    if (side === "stradella" && isChordKind(button.kind)) {
      const root = formatPitch(button.chordRoot, notation, accidental, button.chordNaturalName);

      if (chordLabelMode === "root-only") return root;
      if (chordLabelMode === "row-function") return rowFunction(button.kind);
      if (chordLabelMode === "chord-tones") {
        return chordTones(button.chordRoot ?? "C", button.kind, notation, accidental);
      }

      return `${root}${chordSuffix(button.kind)}`;
    }

    return formatPitch(button.pitchClass, notation, accidental, button.naturalName);
  }

  function autoTitle() {
    if (side === "stradella") return `${basses}-Bass Stradella`;
    return `${trebleSystem === "c-system" ? "C-system" : "B-system / Bayan"} Treble`;
  }

  function setPanel(mode: Exclude<LeftPanelMode, "hidden">) {
    setLeftPanelMode((current) => (current === mode ? "hidden" : mode));
  }

  function downloadCurrentDiagram() {
    if (!svgRef.current) return;
    downloadSvg(svgRef.current, `${side}-accordion-diagram.svg`);
  }

  function svgPointFromMouse(event: ReactMouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const screenMatrix = svg?.getScreenCTM();
    if (!svg || !screenMatrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(screenMatrix.inverse());
  }

  function handleSvgClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (!isPlacingTextNote || !noteDraft.trim()) return;

    const point = svgPointFromMouse(event);
    if (!point) return;

    setTextNotes((current) => [
      ...current,
      makeTextNote({
        x: point.x,
        y: point.y,
        text: noteDraft,
        fontSize: textNoteFontSize,
        color: textNoteColor,
        font: textNoteFont,
        anchor: textNoteAnchor,
      }),
    ]);
    setIsPlacingTextNote(false);
  }

  const finalTitle = titleMode === "auto" ? autoTitle() : titleMode === "custom" ? customTitle : "";

  const visibleRoots = side === "stradella" ? stradellaVisibleRoots(basses) : [];
  const visibleRows = side === "stradella" ? stradellaVisibleRows(basses) : [];

  const viewWidth =
    side === "stradella"
      ? Math.max(1040, 275 + visibleRoots.length * buttonSize * spacing * 1.15)
      : TREBLE_SIZE_VIEW_WIDTH[trebleSize];

  const viewHeight =
    side === "stradella"
      ? Math.max(320, 220 + visibleRows.length * buttonSize * spacing * 0.88)
      : 450;

  const appGridColumns = `${leftPanelMode === "hidden" ? "" : "320px "}minmax(0, 1fr)`;

  const showSequenceNumbers = sequenceModeShowsNumbers(sequenceDisplayMode);
  const showSequenceArrows = sequenceModeShowsArrows(sequenceDisplayMode);
  const sequenceArrowStyle = sequenceArrowStyleFromMode(sequenceDisplayMode);
  const sequenceArrowheadMarkerId = "sequence-arrowhead";
  const sequenceColor = COLOR_PRESETS[sequenceColorPreset];
  const sequenceNumberColor = COLOR_PRESETS[sequenceNumberColorPreset];

  const svgStyle = {
    "--button-stroke-width": buttonStrokeWidth,
    "--reference-stroke-width": referenceStrokeWidth,
    "--chord-fill-strength": chordFillStrength / 100,
    "--sequence-color": sequenceColor,
    "--sequence-thickness": sequenceThickness,
    "--sequence-number-color": sequenceNumberColor,
    "--sequence-number-size": `${sequenceNumberFontSize}px`,
  } as CSSProperties;

  return (
    <main className="app" style={{ gridTemplateColumns: appGridColumns }}>
      {leftPanelMode !== "hidden" && (
        <aside className="left-panel">
          <h1>{leftPanelMode === "settings" ? "Settings" : "Tools"}</h1>

          {leftPanelMode === "settings" && (
            <>
              <section className="control-section">
                <button className="section-title" onClick={() => toggleSettingsSection("layout")}>
                  Layout <span>{settingsSections.layout ? "−" : "+"}</span>
                </button>

                {settingsSections.layout && (
                  <div className="section-content">
                    {side === "stradella" && (
                      <>
                        <label>
                          Basses
                          <select value={basses} onChange={(event) => setBasses(event.target.value as BassCount)}>
                            {BASS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Chord labels
                          <select
                            value={chordLabelMode}
                            onChange={(event) => setChordLabelMode(event.target.value as ChordLabelMode)}
                          >
                            <option value="chord-name">Chord name: C, Cm, C7</option>
                            <option value="root-only">Root only</option>
                            <option value="chord-tones">Chord tones</option>
                            <option value="row-function">Row function: M, m, 7</option>
                          </select>
                        </label>
                      </>
                    )}

                    {side === "treble" && (
                      <>
                        <label>
                          Treble system
                          <select
                            value={trebleSystem}
                            onChange={(event) => setTrebleSystem(event.target.value as "c-system" | "b-system")}
                          >
                            <option value="c-system">C-system</option>
                            <option value="b-system">B-system / Bayan</option>
                          </select>
                        </label>

                        <label>
                          Rows
                          <select
                            value={trebleRows}
                            onChange={(event) => setTrebleRows(Number(event.target.value) as 3 | 4 | 5)}
                          >
                            <option value={3}>3 rows</option>
                            <option value={4}>4 rows</option>
                            <option value={5}>5 rows</option>
                          </select>
                        </label>

                        <label>
                          Treble size
                          <select value={trebleSize} onChange={(event) => changeTrebleSize(event.target.value as TrebleSizePreset)}>
                            {TREBLE_SIZE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Octave numbers
                          <select
                            value={showTrebleOctaves ? "on" : "off"}
                            onChange={(event) => setShowTrebleOctaves(event.target.value === "on")}
                          >
                            <option value="off">Off</option>
                            <option value="on">On</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button className="section-title" onClick={() => toggleSettingsSection("title")}>
                  Title <span>{settingsSections.title ? "−" : "+"}</span>
                </button>

                {settingsSections.title && (
                  <div className="section-content">
                    <label>
                      Title
                      <select value={titleMode} onChange={(event) => setTitleMode(event.target.value as TitleMode)}>
                        <option value="auto">Auto</option>
                        <option value="custom">Custom</option>
                        <option value="none">None</option>
                      </select>
                    </label>

                    {titleMode === "custom" && (
                      <label>
                        Custom title
                        <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} />
                      </label>
                    )}

                    {titleMode !== "none" && (
                      <>
                        <label>
                          Title font
                          <select value={titleFont} onChange={(event) => setTitleFont(event.target.value as FontFamily)}>
                            <option value="system">System</option>
                            <option value="serif">Serif</option>
                            <option value="mono">Mono</option>
                            <option value="rounded">Rounded</option>
                          </select>
                        </label>

                        <label>
                          Title size: {titleSize}px
                          <input
                            type="range"
                            min={14}
                            max={42}
                            value={titleSize}
                            onChange={(event) => setTitleSize(Number(event.target.value))}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button className="section-title" onClick={() => toggleSettingsSection("appearance")}>
                  Appearance <span>{settingsSections.appearance ? "−" : "+"}</span>
                </button>

                {settingsSections.appearance && (
                  <div className="section-content">
                    <label>
                      Color theme
                      <select value={colorTheme} onChange={(event) => setColorTheme(event.target.value as ColorTheme)}>
                        <option value="default">Default blue</option>
                        <option value="classic">Classic ink</option>
                        <option value="pastel">Pastel</option>
                        <option value="warm">Warm cream</option>
                        <option value="contrast">High contrast</option>
                        <option value="print">Print / grayscale</option>
                      </select>
                    </label>

                    <label>
                      Accidental buttons
                      <select
                        value={accidentalStyle}
                        onChange={(event) => setAccidentalStyle(event.target.value as AccidentalStyle)}
                      >
                        <option value="grey">Grey</option>
                        <option value="dark">Dark</option>
                        <option value="outline">Outline only</option>
                        <option value="theme">Theme color</option>
                      </select>
                    </label>

                    <label>
                      Label font
                      <select value={labelFont} onChange={(event) => setLabelFont(event.target.value as FontFamily)}>
                        <option value="system">System</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </label>

                    <label>
                      Label font size: {labelFontSize}px
                      <input
                        type="range"
                        min={8}
                        max={24}
                        value={labelFontSize}
                        onChange={(event) => setLabelFontSize(Number(event.target.value))}
                      />
                    </label>

                    <button
                      type="button"
                      className={`small-button ${showBellowsGuide ? "active-tool" : ""}`}
                      onClick={() => setShowBellowsGuide((current) => !current)}
                    >
                      {showBellowsGuide ? "Hide bellows guide" : "Show bellows guide"}
                    </button>

                    {side === "stradella" && (
                      <label>
                        Show Stradella row labels
                        <select value={showStradellaRowLabels ? "on" : "off"} onChange={(event) => setShowStradellaRowLabels(event.target.value === "on")}>
                          <option value="on">On</option>
                          <option value="off">Off</option>
                        </select>
                      </label>
                    )}

                    <label>
                      Button size: {buttonSize}
                      <input
                        type="range"
                        min={12}
                        max={28}
                        value={buttonSize}
                        onChange={(event) => setButtonSize(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Spacing: {spacing.toFixed(2)}
                      <input
                        type="range"
                        min={1.7}
                        max={3.2}
                        step={0.05}
                        value={spacing}
                        onChange={(event) => setSpacing(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Button line: {buttonStrokeWidth.toFixed(1)}
                      <input
                        type="range"
                        min={1}
                        max={6}
                        step={0.25}
                        value={buttonStrokeWidth}
                        onChange={(event) => setButtonStrokeWidth(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Reference line: {referenceStrokeWidth.toFixed(1)}
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={0.25}
                        value={referenceStrokeWidth}
                        onChange={(event) => setReferenceStrokeWidth(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Chord fill: {chordFillStrength}%
                      <input
                        type="range"
                        min={20}
                        max={100}
                        step={5}
                        value={chordFillStrength}
                        onChange={(event) => setChordFillStrength(Number(event.target.value))}
                      />
                    </label>

                    {side === "treble" && (
                      <label>
                        Treble angle: {trebleAngle}°
                        <input
                          type="range"
                          min={-35}
                          max={35}
                          value={trebleAngle}
                          onChange={(event) => setTrebleAngle(Number(event.target.value))}
                        />
                      </label>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button className="section-title" onClick={() => toggleSettingsSection("notation")}>
                  Notation <span>{settingsSections.notation ? "−" : "+"}</span>
                </button>

                {settingsSections.notation && (
                  <div className="section-content">
                    <label>
                      Notation
                      <select value={notation} onChange={(event) => setNotation(event.target.value as NotationMode)}>
                        <option value="english">C D E F</option>
                        <option value="solfege">Do Re Mi Fa</option>
                        <option value="intervals">Intervals</option>
                        <option value="blank">Blank</option>
                      </select>
                    </label>

                    <label>
                      Accidentals
                      <select value={accidental} onChange={(event) => setAccidental(event.target.value as AccidentalMode)}>
                        <option value="natural">Default spelling</option>
                        <option value="flats">Prefer flats</option>
                        <option value="sharps">Prefer sharps</option>
                      </select>
                    </label>
                  </div>
                )}
              </section>
            </>
          )}

          {leftPanelMode === "tools" && (
            <>
              <section className="control-section">
                <button className="section-title" onClick={() => toggleToolSection("fingering")}>
                  Fingering <span>{toolSections.fingering ? "−" : "+"}</span>
                </button>

                {toolSections.fingering && (
                  <div className="section-content">
                    <p className="hint">Click one or more buttons. The first selected button is used for fingering.</p>

                    <label>
                      Finger for selected button
                      <input placeholder="1-5" maxLength={2} onChange={(event) => setFingerForSelected(event.target.value)} />
                    </label>

                    <label>
                      Fingering position
                      <select value={fingeringPosition} onChange={(event) => setFingeringPosition(event.target.value as NumberPosition)}>
                        <option value="inside-bottom">Inside bottom</option>
                        <option value="inside-top">Inside top</option>
                        <option value="above">Above button</option>
                      </select>
                    </label>

                    <div className="button-row">
                      <button className="small-button" onClick={clearFingerForSelected}>
                        Clear selected
                      </button>
                      <button className="small-button" onClick={clearAllFingerings}>
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button className="section-title" onClick={() => toggleToolSection("selection")}>
                  Selection <span>{toolSections.selection ? "−" : "+"}</span>
                </button>

                {toolSections.selection && (
                  <div className="section-content">
                    <p className="hint">
                      Selected buttons: <strong>{selectedButtons.length}</strong>
                    </p>

                    {selectedButtons.length > 0 ? (
                      <div className="selected-list">
                        {selectedButtons.map((button) => (
                          <div key={button.id} className="selected-item">
                            <span>{getMainLabel(button) || "Blank"}</span>
                            <span className="selected-meta">
                              {side === "stradella"
                                ? `${stradellaRowLabel(button.kind)}, col ${button.column + 1}`
                                : `row ${button.row + 1}, col ${button.column + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="hint">No buttons selected.</p>
                    )}

                    <button className="small-button" onClick={clearSelection}>
                      Clear selection
                    </button>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button className="section-title" onClick={() => toggleToolSection("sequences")}>
                  Sequence <span>{toolSections.sequences ? "−" : "+"}</span>
                </button>

                {toolSections.sequences && (
                  <div className="section-content">
                    <p className="hint">Turn recording on, then click buttons in order. Repeated buttons are allowed.</p>

                    <label>
                      Display
                      <select
                        value={sequenceDisplayMode}
                        onChange={(event) => setSequenceDisplayMode(event.target.value as SequenceDisplayMode)}
                      >
                        <option value="numbers">Numbers only</option>
                        <option value="straight-arrows">Straight arrows</option>
                        <option value="curved-arrows">Curved arrows</option>
                        <option value="numbers-and-straight-arrows">Numbers + straight arrows</option>
                        <option value="numbers-and-curved-arrows">Numbers + curved arrows</option>
                      </select>
                    </label>

                    <label>
                      Arrow color
                      <select value={sequenceColorPreset} onChange={(event) => setSequenceColorPreset(event.target.value as SequenceColorPreset)}>
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                        <option value="grey">Grey</option>
                        <option value="theme">Theme accent</option>
                      </select>
                    </label>

                    <label>
                      Arrow thickness: {sequenceThickness.toFixed(1)}
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.25}
                        value={sequenceThickness}
                        onChange={(event) => setSequenceThickness(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Arrowhead size: {sequenceArrowheadSize.toFixed(1)}
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={0.5}
                        value={sequenceArrowheadSize}
                        onChange={(event) => setSequenceArrowheadSize(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Number color
                      <select value={sequenceNumberColorPreset} onChange={(event) => setSequenceNumberColorPreset(event.target.value as SequenceColorPreset)}>
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                        <option value="grey">Grey</option>
                        <option value="theme">Theme accent</option>
                      </select>
                    </label>

                    <label>
                      Number position
                      <select value={sequenceNumberPosition} onChange={(event) => setSequenceNumberPosition(event.target.value as NumberPosition)}>
                        <option value="above">Above button</option>
                        <option value="inside-top">Inside top</option>
                        <option value="inside-bottom">Inside bottom</option>
                      </select>
                    </label>

                    <label>
                      Number font size: {sequenceNumberFontSize}px
                      <input
                        type="range"
                        min={7}
                        max={18}
                        value={sequenceNumberFontSize}
                        onChange={(event) => setSequenceNumberFontSize(Number(event.target.value))}
                      />
                    </label>

                    <button
                      className={`small-button ${isRecordingSequence ? "active-tool" : ""}`}
                      onClick={() => setIsRecordingSequence((current) => !current)}
                    >
                      {isRecordingSequence ? "Stop recording" : "Record sequence"}
                    </button>

                    <p className="hint">
                      Sequence length: <strong>{sequenceSteps.length}</strong>
                    </p>

                    <button className="small-button" onClick={clearSequence}>
                      Clear sequence
                    </button>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button className="section-title" onClick={() => toggleToolSection("textNotes")}>
                  Text notes <span>{toolSections.textNotes ? "−" : "+"}</span>
                </button>

                {toolSections.textNotes && (
                  <div className="section-content">
                    <p className="hint">Type text, click “Place note”, then click on the diagram. Multiple lines are supported.</p>

                    <label>
                      Note text
                      <textarea
                        rows={4}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Type a note"
                      />
                    </label>

                    <label>
                      Text size: {textNoteFontSize}px
                      <input
                        type="range"
                        min={8}
                        max={32}
                        value={textNoteFontSize}
                        onChange={(event) => setTextNoteFontSize(Number(event.target.value))}
                      />
                    </label>

                    <label>
                      Text color
                      <input type="color" value={textNoteColor} onChange={(event) => setTextNoteColor(event.target.value)} />
                    </label>

                    <label>
                      Text font
                      <select value={textNoteFont} onChange={(event) => setTextNoteFont(event.target.value as FontFamily)}>
                        <option value="system">System</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </label>

                    <label>
                      Text anchor
                      <select value={textNoteAnchor} onChange={(event) => setTextNoteAnchor(event.target.value as TextNoteAnchor)}>
                        <option value="start">Left</option>
                        <option value="middle">Center</option>
                      </select>
                    </label>

                    <button
                      className={`small-button ${isPlacingTextNote ? "active-tool" : ""}`}
                      onClick={() => setIsPlacingTextNote((current) => !current)}
                    >
                      {isPlacingTextNote ? "Click diagram..." : "Place note"}
                    </button>

                    <p className="hint">
                      Notes: <strong>{textNotes.length}</strong>
                    </p>

                    <button className="small-button" onClick={clearTextNotes}>
                      Clear notes
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </aside>
      )}

      <section className="workspace">
        <div className="topbar">
          <button className={`topbar-button ${side === "stradella" ? "active" : ""}`} onClick={() => setSide("stradella")}>
            Stradella
          </button>

          <button className={`topbar-button ${side === "treble" ? "active" : ""}`} onClick={() => setSide("treble")}>
            Treble
          </button>

          <span className="topbar-separator" />

          <button className={`topbar-button ${leftPanelMode === "settings" ? "active" : ""}`} onClick={() => setPanel("settings")}>
            Settings
          </button>

          <button className={`topbar-button ${leftPanelMode === "tools" ? "active" : ""}`} onClick={() => setPanel("tools")}>
            Tools
          </button>

          <span className="topbar-spacer" />

          <button className="topbar-button reset-button" onClick={resetDiagramWork}>
            Reset
          </button>

          <button className="topbar-button download-button" onClick={downloadCurrentDiagram}>
            Download SVG
          </button>
        </div>

        <div className="canvas-wrap">
          <svg
            ref={svgRef}
            className={`diagram diagram-theme-${colorTheme} accidental-style-${accidentalStyle} ${isPlacingTextNote ? "placing-note" : ""}`}
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            role="img"
            onClick={handleSvgClick}
            style={svgStyle}
          >
            <defs>
              <marker
                id={sequenceArrowheadMarkerId}
                markerWidth={sequenceArrowheadSize + 1}
                markerHeight={sequenceArrowheadSize + 1}
                refX={sequenceArrowheadSize}
                refY={sequenceArrowheadSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d={`M 0 0 L ${sequenceArrowheadSize} ${sequenceArrowheadSize / 2} L 0 ${sequenceArrowheadSize} z`}
                  className="sequence-arrowhead"
                />
              </marker>
            </defs>

            {titleMode !== "none" && (
              <text x={viewWidth / 2} y="34" textAnchor="middle" className={`title ${fontClass(titleFont)}`} style={{ fontSize: titleSize }}>
                {finalTitle}
              </text>
            )}

            {showBellowsGuide && (
              <>
                <text x="76" y="70" textAnchor="middle" className="bellows-end-label">
                  Bottom
                </text>

                <text x={viewWidth / 2} y="70" textAnchor="middle" className="bellows-label">
                  Bellows
                </text>

                <text x={viewWidth - 76} y="70" textAnchor="middle" className="bellows-end-label">
                  Top
                </text>
              </>
            )}

            {showBellowsGuide && <rect x="72" y="82" width={viewWidth - 150} height="12" rx="6" className="bellows-strip" />}

            {side === "stradella" && showStradellaRowLabels &&
              visibleRows.map((kind) => {
                const sample = buttons.find((button) => button.kind === kind && button.column === 0);
                if (!sample) return null;

                return (
                  <text key={kind} x={sample.x - buttonSize - 10} y={sample.y + 4} textAnchor="end" className="stradella-row-label">
                    {stradellaRowLabel(kind)}
                  </text>
                );
              })}

            {buttons.map((button) => {
              const overlay = overlays[button.id] ?? {};
              const mainLabel = getMainLabel(button);
              const isChord = isChordKind(button.kind);
              const isTreble = button.kind === "treble-note";
              const isTrebleAccidental = isTreble && isAccidentalPitch(button.pitchClass);
              const sequenceLabels = getSequenceLabelsForButton(sequenceSteps, button.id);

              const fontSize =
                chordLabelMode === "chord-tones" && isChord ? Math.max(7, labelFontSize * 0.75) : labelFontSize;

              return (
                <g
                  key={button.id}
                  className="button-group"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleButton(button.id);
                  }}
                >
                  <circle
                    cx={button.x}
                    cy={button.y}
                    r={buttonSize}
                    className={[
                      "button",
                      isChord ? "chord" : "note",
                      isTreble ? "treble-button" : "",
                      isTrebleAccidental ? "treble-accidental" : "",
                      overlay.selected ? "selected" : "",
                      button.isReference ? "reference" : "",
                      sequenceLabels ? "in-sequence" : "",
                    ].join(" ")}
                  />

                  <text
                    x={button.x}
                    y={button.y - (overlay.finger || sequenceLabels ? 2 : 0)}
                    textAnchor="middle"
                    className={[
                      "main-label",
                      fontClass(labelFont),
                      isTreble ? "treble-label" : "",
                      isTrebleAccidental ? "treble-accidental-label" : "",
                    ].join(" ")}
                    style={{ fontSize }}
                  >
                    {renderMusicLabel(mainLabel)}
                  </text>

                  {showSequenceNumbers && sequenceLabels && (
                    <text x={button.x} y={numberY(button.y, buttonSize, sequenceNumberPosition)} textAnchor="middle" className="sequence-number">
                      {sequenceLabels}
                    </text>
                  )}

                  {overlay.finger && (
                    <text
                      x={button.x}
                      y={fingeringY(button.y, buttonSize, fingeringPosition)}
                      textAnchor="middle"
                      className={["finger-label", fontClass(labelFont), isTrebleAccidental ? "treble-accidental-label" : ""].join(" ")}
                      style={{ fontSize: buttonSize * 0.44 }}
                    >
                      {overlay.finger}
                    </text>
                  )}
                </g>
              );
            })}

            {showSequenceArrows &&
              sequenceStepsWithButtons.slice(0, -1).map((fromStep, index) => {
                const toStep = sequenceStepsWithButtons[index + 1];

                return (
                  <path
                    key={`${fromStep.id}-${toStep.id}-${fromStep.step}-${toStep.step}`}
                    d={makeSequenceArrowPath(fromStep.button, toStep.button, index, buttonSize, sequenceArrowStyle)}
                    className="sequence-arrow"
                    markerEnd={`url(#${sequenceArrowheadMarkerId})`}
                  />
                );
              })}

            {textNotes.map((note) => (
              <text
                key={note.id}
                x={note.x}
                y={note.y}
                textAnchor={note.anchor}
                className={`free-text-note ${fontClass(note.font)}`}
                style={{ fontSize: note.fontSize, fill: note.color }}
              >
                {splitMultilineText(note.text).map((line, index) => (
                  <tspan key={index} x={note.x} dy={index === 0 ? 0 : note.fontSize * 1.25}>
                    {line || " "}
                  </tspan>
                ))}
              </text>
            ))}
          </svg>
        </div>
      </section>
    </main>
  );
}

export default App;
